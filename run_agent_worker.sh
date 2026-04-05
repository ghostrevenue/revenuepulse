#!/bin/bash
# Start the agent worker daemon in the background
cd /home/theoffice/mission-control
while true; do
    python3 agent_worker.py
    sleep 2
done
