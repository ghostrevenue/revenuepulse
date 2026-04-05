#!/usr/bin/env python3
"""
Agent Worker - Processes agent chat requests via file queue
Calls MiniMax API for actual LLM responses
"""

import json
import os
import sys
import httpx
from pathlib import Path
from datetime import datetime

# Load .env file to get MINIMAX_API_KEY
ENV_FILE = Path.home() / ".hermes" / ".env"
if ENV_FILE.exists():
    with open(ENV_FILE) as f:
        for line in f:
            line = line.strip()
            if "=" in line and not line.startswith("#"):
                key, _, value = line.partition("=")
                if key == "MINIMAX_API_KEY":
                    os.environ[key] = value

# Add parent dir to path for imports
sys.path.insert(0, str(Path(__file__).parent))

from main import load_json, save_json, AGENTS_FILE, log_activity, API_KEY, MINIMAX_API_URL

BASE_DIR = Path(__file__).parent
DATA_DIR = BASE_DIR / "data"
QUEUE_FILE = DATA_DIR / "agent_queue.json"
RESPONSES_FILE = DATA_DIR / "agent_responses.json"

def call_minimax(prompt: str, agent_name: str = "Agent") -> str:
    """Call MiniMax chat completion API"""
    api_key = os.environ.get("MINIMAX_API_KEY", API_KEY)
    if not api_key or api_key == "***":
        return f"[Error] No valid API key configured. Please set MINIMAX_API_KEY in ~/.hermes/.env"

    try:
        with httpx.Client(timeout=60.0) as client:
            response = client.post(
                MINIMAX_API_URL,
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "MiniMax-M2.7",
                    "messages": [
                        {"role": "user", "content": prompt}
                    ],
                    "max_tokens": 1024,
                    "temperature": 0.7
                }
            )

            if response.status_code == 200:
                data = response.json()
                return data.get("choices", [{}])[0].get("message", {}).get("content", "[No content in response]")
            else:
                return f"[API Error {response.status_code}] {response.text[:200]}"
    except httpx.TimeoutException:
        return "[Error] Request timed out. Please try again."
    except Exception as e:
        return f"[Error] {str(e)}"


def process_queue():
    """Process pending agent chat requests"""
    # Load queue
    queue = load_json(QUEUE_FILE, [])

    # Load responses
    responses = load_json(RESPONSES_FILE, [])

    # Load agents for system prompts
    agents = load_json(AGENTS_FILE, [])
    agent_map = {a["id"]: a for a in agents}

    new_queue = []
    for item in queue:
        request_id = item.get("request_id")
        agent_id = item.get("agent_id")
        message = item.get("message", "")
        timestamp = item.get("timestamp")

        # Check if already processed
        if any(r.get("request_id") == request_id for r in responses):
            continue

        # Get agent info
        agent = agent_map.get(agent_id)
        if not agent:
            responses.append({
                "request_id": request_id,
                "agent_id": agent_id,
                "response": f"[Error] Agent {agent_id} not found",
                "timestamp": datetime.now().isoformat()
            })
            continue

        # Build the prompt for the LLM
        system_prompt = agent.get('system_prompt', '')
        prompt = f"""You are {agent['name']}, {agent.get('role', 'agent').title()}.

Agent Profile:
- Name: {agent['name']}
- Role: {agent.get('role', 'agent')}
- Department: {agent.get('department', 'general')}
- Specialties: {agent.get('specialties', 'General tasks')}

{system_prompt}

The user sent you this message:
{message}

Respond as {agent['name']} would, based on your role and specialties. Be helpful, concise, and in character."""

        # Call MiniMax API
        response_text = call_minimax(prompt, agent['name'])

        responses.append({
            "request_id": request_id,
            "agent_id": agent_id,
            "response": response_text,
            "timestamp": datetime.now().isoformat()
        })

        # Log activity
        log_activity(agent_id, agent["name"], "chat_response", f"Response sent")

        # Item processed successfully — do NOT add back to queue

    # Save updated queue and responses
    save_json(QUEUE_FILE, new_queue)
    save_json(RESPONSES_FILE, responses)

    return len(queue)


if __name__ == "__main__":
    processed = process_queue()
    if processed > 0:
        print(f"Processed {processed} queue items")
