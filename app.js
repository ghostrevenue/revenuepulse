// Mission Control - Frontend JavaScript

const API_BASE = '/api';
let agents = [];
let tasks = [];
let activity = [];
let selectedAgent = null;
let currentChatAgent = null;
let refreshInterval = null;
let officeRefreshInterval = null;

// ============================================================================
// Initialization
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
    loadData();
    startAutoRefresh();
    updateClock();
    setInterval(updateClock, 1000);
    
    // Form handlers
    document.getElementById('newTaskForm').addEventListener('submit', handleCreateTask);
    document.getElementById('newAgentForm').addEventListener('submit', handleCreateAgent);
});

// ============================================================================
// Data Loading
// ============================================================================

async function loadData() {
    await Promise.all([
        loadAgents(),
        loadTasks(),
        loadActivity(),
        loadStats()
    ]);
}

async function loadAgents() {
    try {
        const res = await fetch(`${API_BASE}/agents`);
        agents = await res.json();
        renderAgentTree();
        updateAgentSelects();
    } catch (err) {
        console.error('Failed to load agents:', err);
    }
}

async function loadTasks() {
    try {
        const res = await fetch(`${API_BASE}/tasks`);
        tasks = await res.json();
        renderTaskBoard();
    } catch (err) {
        console.error('Failed to load tasks:', err);
    }
}

async function loadActivity() {
    try {
        const res = await fetch(`${API_BASE}/activity?limit=50`);
        activity = await res.json();
        renderActivityFeed();
    } catch (err) {
        console.error('Failed to load activity:', err);
    }
}

async function loadStats() {
    try {
        const res = await fetch(`${API_BASE}/agents`);
        const statsAgents = await res.json();
        const totalAgents = statsAgents.length;
        const activeTasks = tasks.filter(t => t.status === 'in_progress' || t.status === 'queued').length;
        const completedToday = tasks.filter(t => {
            if (t.completed_at) {
                const completed = new Date(t.completed_at);
                const today = new Date();
                return completed.toDateString() === today.toDateString();
            }
            return false;
        }).length;

        document.getElementById('statAgents').textContent = totalAgents;
        document.getElementById('statActiveTasks').textContent = activeTasks;
        document.getElementById('statCompleted').textContent = completedToday;
    } catch (err) {
        console.error('Failed to load stats:', err);
    }
}

function startAutoRefresh() {
    refreshInterval = setInterval(loadData, 3000);
}

function refreshActivity() {
    loadActivity();
}

// ============================================================================
// Clock
// ============================================================================

function updateClock() {
    const now = new Date();
    const time = now.toLocaleTimeString('en-US', { hour12: false });
    document.getElementById('clock').textContent = time;
}

// ============================================================================
// Agent Tree Rendering
// ============================================================================

function renderAgentTree() {
    const container = document.getElementById('agentTree');
    
    // Build tree from flat agents array
    const rootAgent = agents.find(a => a.id === 'carson');
    if (!rootAgent) return;
    
    container.innerHTML = renderAgentNode(rootAgent, true);
}

function renderAgentNode(agent, isRoot = false) {
    const hasChildren = agent.children && agent.children.length > 0;
    const isExpanded = hasChildren; // Auto-expand for now
    const avatarClass = agent.role || 'operations';
    const statusClass = agent.status || 'idle';
    
    const roleIcons = {
        owner: '👤',
        research: '🔬',
        coding: '💻',
        business: '💼',
        operations: '⚙️'
    };
    
    let html = `
        <div class="agent-node ${isExpanded ? 'expanded' : ''}" data-id="${agent.id}">
            <div class="agent-node-header ${selectedAgent === agent.id ? 'selected' : ''}" 
                 onclick="selectAgent('${agent.id}')">
                ${hasChildren ? `<span class="agent-expand">▶</span>` : '<span class="agent-expand"></span>'}
                <div class="agent-avatar ${avatarClass}">${roleIcons[avatarClass] || '🤖'}</div>
                <div class="agent-info">
                    <div class="agent-name">${agent.name}</div>
                    <div class="agent-role">${agent.role || 'agent'}</div>
                </div>
                <div class="agent-status ${statusClass}"></div>
            </div>
    `;
    
    if (hasChildren) {
        html += '<div class="agent-children">';
        for (const childId of agent.children) {
            const child = agents.find(a => a.id === childId);
            if (child) {
                html += renderAgentNode(child);
            }
        }
        html += '</div>';
    }
    
    html += '</div>';
    return html;
}

function selectAgent(agentId) {
    selectedAgent = agentId;
    renderAgentTree();
    openAgentModal(agentId);
}

// ============================================================================
// Agent Modal
// ============================================================================

function openAgentModal(agentId) {
    const agent = agents.find(a => a.id === agentId);
    if (!agent) return;
    
    const modal = document.getElementById('agentModal');
    const title = document.getElementById('agentModalTitle');
    const body = document.getElementById('agentModalBody');
    
    title.textContent = `${agent.name.toUpperCase()} DETAILS`;
    
    const statusColors = {
        idle: '#00ff88',
        working: '#0088ff',
        waiting: '#ffcc00',
        error: '#ff4444'
    };
    
    body.innerHTML = `
        <div class="agent-detail-header">
            <div class="agent-detail-avatar agent-avatar ${agent.role || 'operations'}">
                ${agent.role === 'owner' ? '👤' : agent.role === 'research' ? '🔬' : agent.role === 'coding' ? '💻' : agent.role === 'business' ? '💼' : '🤖'}
            </div>
            <div class="agent-detail-info">
                <h4>${agent.name}</h4>
                <div class="role">${agent.role || 'agent'} • Level ${agent.level || 1}</div>
                <div style="margin-top: 8px;">
                    <span class="task-status" style="background: ${statusColors[agent.status] || '#888'}20; color: ${statusColors[agent.status] || '#888'}">
                        ${(agent.status || 'idle').toUpperCase()}
                    </span>
                </div>
            </div>
        </div>
        
        <div class="agent-detail-stats">
            <div class="agent-stat">
                <div class="agent-stat-value">${agent.xp || 0}</div>
                <div class="agent-stat-label">XP</div>
            </div>
            <div class="agent-stat">
                <div class="agent-stat-value">${agent.tasks_completed || 0}</div>
                <div class="agent-stat-label">Tasks Done</div>
            </div>
            <div class="agent-stat">
                <div class="agent-stat-value">${agent.children?.length || 0}</div>
                <div class="agent-stat-label">Subagents</div>
            </div>
        </div>
        
        <div class="agent-detail-section">
            <h5>System Prompt</h5>
            <textarea id="agentPromptEditor">${agent.system_prompt || ''}</textarea>
        </div>
        
        <div class="agent-actions">
            <button class="btn-primary" onclick="saveAgentPrompt('${agent.id}')">Save Prompt</button>
            <button class="btn-primary" onclick="openChatWithAgent('${agent.id}')">Chat</button>
            <button class="btn-secondary" onclick="updateAgentStatus('${agent.id}', 'idle')">Set Idle</button>
            <button class="btn-secondary" onclick="updateAgentStatus('${agent.id}', 'working')">Set Working</button>
            ${agent.id !== 'carson' ? `<button class="btn-action danger" onclick="deleteAgent('${agent.id}')">Delete</button>` : ''}
        </div>
    `;
    
    modal.classList.add('active');
}

function closeAgentModal() {
    document.getElementById('agentModal').classList.remove('active');
}

async function saveAgentPrompt(agentId) {
    const textarea = document.getElementById('agentPromptEditor');
    const newPrompt = textarea.value;
    
    try {
        await fetch(`${API_BASE}/agents/${agentId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ system_prompt: newPrompt })
        });
        await loadAgents();
        openAgentModal(agentId); // Refresh modal
    } catch (err) {
        console.error('Failed to save prompt:', err);
        alert('Failed to save prompt');
    }
}

async function updateAgentStatus(agentId, status) {
    try {
        await fetch(`${API_BASE}/agents/${agentId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        });
        await loadAgents();
        openAgentModal(agentId);
    } catch (err) {
        console.error('Failed to update status:', err);
    }
}

async function deleteAgent(agentId) {
    if (!confirm('Delete this agent? This cannot be undone.')) return;
    
    try {
        await fetch(`${API_BASE}/agents/${agentId}`, { method: 'DELETE' });
        closeAgentModal();
        await loadAgents();
    } catch (err) {
        console.error('Failed to delete agent:', err);
    }
}

// ============================================================================
// New Agent Modal
// ============================================================================

function openNewAgentModal() {
    document.getElementById('newAgentForm').reset();
    updateParentAgentSelect();
    document.getElementById('newAgentModal').classList.add('active');
}

function closeNewAgentModal() {
    document.getElementById('newAgentModal').classList.remove('active');
}

function updateParentAgentSelect() {
    const select = document.getElementById('parentAgentSelect');
    select.innerHTML = '<option value="carson">Carson (Root)</option>';
    
    // Add top-level agents
    for (const agent of agents) {
        if (agent.parent_id === 'carson' || agent.id === 'carson') {
            const isRoot = agent.id === 'carson';
            select.innerHTML += `<option value="${agent.id}">${agent.name} ${isRoot ? '(Root)' : ''}</option>`;
        }
    }
}

async function handleCreateAgent(e) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    
    const agent = {
        name: formData.get('name'),
        role: formData.get('role'),
        parent_id: formData.get('parent_id'),
        system_prompt: formData.get('system_prompt'),
        status: 'idle',
        level: 1,
        xp: 0,
        tasks_completed: 0,
        current_task: null,
        children: []
    };
    
    try {
        await fetch(`${API_BASE}/agents`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(agent)
        });
        closeNewAgentModal();
        await loadAgents();
    } catch (err) {
        console.error('Failed to create agent:', err);
        alert('Failed to create agent');
    }
}

// ============================================================================
// Task Board
// ============================================================================

function renderTaskBoard() {
    const container = document.getElementById('taskBoard');
    
    if (tasks.length === 0) {
        container.innerHTML = '<div class="task-empty">No tasks yet. Create one to get started.</div>';
        return;
    }
    
    // Group tasks by status
    const grouped = {
        queued: tasks.filter(t => t.status === 'queued'),
        in_progress: tasks.filter(t => t.status === 'in_progress'),
        review: tasks.filter(t => t.status === 'review'),
        done: tasks.filter(t => t.status === 'done')
    };
    
    let html = '';
    
    for (const [status, statusTasks] of Object.entries(grouped)) {
        if (statusTasks.length === 0) continue;
        
        const statusLabels = {
            queued: 'QUEUED',
            in_progress: 'IN PROGRESS',
            review: 'IN REVIEW',
            done: 'DONE'
        };
        
        html += `<div style="margin-bottom: 16px;">
            <div style="font-size: 10px; color: var(--text-secondary); letter-spacing: 1px; margin-bottom: 8px;">${statusLabels[status]}</div>`;
        
        for (const task of statusTasks) {
            const assignee = agents.find(a => a.id === task.assigned_to);
            html += `
                <div class="task-item" onclick="openTaskDetail('${task.id}')">
                    <div class="task-item-header">
                        <span class="task-title">${task.title}</span>
                        <span class="task-priority ${task.priority}">${task.priority}</span>
                    </div>
                    ${assignee ? `<div class="task-assignee">Assigned: <span>${assignee.name}</span></div>` : ''}
                    <span class="task-status ${task.status}">${task.status.replace('_', ' ')}</span>
                </div>
            `;
        }
        
        html += '</div>';
    }
    
    container.innerHTML = html || '<div class="task-empty">No tasks yet.</div>';
}

function openTaskDetail(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    const statusOptions = ['queued', 'in_progress', 'blocked', 'review', 'done', 'failed'];
    const statusLabels = {
        queued: 'Queued',
        in_progress: 'In Progress',
        blocked: 'Blocked',
        review: 'In Review',
        done: 'Done',
        failed: 'Failed'
    };
    
    const assignee = agents.find(a => a.id === task.assigned_to);
    
    let html = `
        <div style="margin-bottom: 16px;">
            <h4 style="margin-bottom: 8px;">${task.title}</h4>
            <p style="font-size: 12px; color: var(--text-secondary);">${task.description || 'No description'}</p>
        </div>
        
        <div class="form-row">
            <div class="form-group">
                <label>Status</label>
                <select onchange="updateTaskStatus('${task.id}', this.value)">
                    ${statusOptions.map(s => `<option value="${s}" ${task.status === s ? 'selected' : ''}>${statusLabels[s]}</option>`).join('')}
                </select>
            </div>
            <div class="form-group">
                <label>Assignee</label>
                <select onchange="updateTaskAssignee('${task.id}', this.value)">
                    <option value="">Unassigned</option>
                    ${agents.filter(a => a.id !== 'carson').map(a => `<option value="${a.id}" ${task.assigned_to === a.id ? 'selected' : ''}>${a.name}</option>`).join('')}
                </select>
            </div>
        </div>
        
        <div class="agent-actions" style="margin-top: 16px;">
            <button class="btn-action danger" onclick="deleteTask('${task.id}')">Delete Task</button>
        </div>
    `;
    
    // Use agent modal for task detail
    const modal = document.getElementById('agentModal');
    document.getElementById('agentModalTitle').textContent = 'TASK DETAILS';
    document.getElementById('agentModalBody').innerHTML = html;
    modal.classList.add('active');
}

async function updateTaskStatus(taskId, status) {
    try {
        await fetch(`${API_BASE}/tasks/${taskId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        });
        await loadTasks();
    } catch (err) {
        console.error('Failed to update task:', err);
    }
}

async function updateTaskAssignee(taskId, assigneeId) {
    try {
        await fetch(`${API_BASE}/tasks/${taskId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ assigned_to: assigneeId || null })
        });
        await loadTasks();
    } catch (err) {
        console.error('Failed to assign task:', err);
    }
}

async function deleteTask(taskId) {
    if (!confirm('Delete this task?')) return;
    
    try {
        await fetch(`${API_BASE}/tasks/${taskId}`, { method: 'DELETE' });
        closeAgentModal();
        await loadTasks();
    } catch (err) {
        console.error('Failed to delete task:', err);
    }
}

// ============================================================================
// New Task Modal
// ============================================================================

function openNewTaskModal() {
    document.getElementById('newTaskForm').reset();
    updateTaskAgentSelect();
    document.getElementById('taskModal').classList.add('active');
}

function closeTaskModal() {
    document.getElementById('taskModal').classList.remove('active');
}

function updateTaskAgentSelect() {
    const select = document.getElementById('taskAgentSelect');
    select.innerHTML = '<option value="">Unassigned</option>';
    
    for (const agent of agents) {
        if (agent.id !== 'carson') {
            select.innerHTML += `<option value="${agent.id}">${agent.name}</option>`;
        }
    }
}

async function handleCreateTask(e) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    
    const task = {
        title: formData.get('title'),
        description: formData.get('description'),
        assigned_to: formData.get('assigned_to') || null,
        priority: formData.get('priority'),
        status: 'queued'
    };
    
    try {
        await fetch(`${API_BASE}/tasks`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(task)
        });
        closeTaskModal();
        await loadTasks();
    } catch (err) {
        console.error('Failed to create task:', err);
        alert('Failed to create task');
    }
}

// ============================================================================
// Activity Feed
// ============================================================================

function renderActivityFeed() {
    const container = document.getElementById('activityFeed');
    
    if (activity.length === 0) {
        container.innerHTML = '<div class="activity-empty">No activity yet. Actions will appear here.</div>';
        return;
    }
    
    const actionIcons = {
        created: '✨',
        updated: '📝',
        deleted: '🗑️',
        task_assigned: '📋',
        task_completed: '✅',
        chat_response: '💬'
    };
    
    container.innerHTML = activity.map(entry => `
        <div class="activity-item">
            <div class="activity-icon">${actionIcons[entry.action] || '📌'}</div>
            <div class="activity-content">
                <span class="activity-agent">${entry.agent_name}</span>
                <span class="activity-action">${entry.action.replace('_', ' ')}</span>
                ${entry.details ? `<div class="activity-details">${entry.details}</div>` : ''}
            </div>
            <div class="activity-time">${formatTime(entry.timestamp)}</div>
        </div>
    `).join('');
}

function formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour12: false });
}

// ============================================================================
// Chat
// ============================================================================

function openChatWithAgent(agentId) {
    const agent = agents.find(a => a.id === agentId);
    if (!agent) return;
    
    currentChatAgent = agent;
    
    const modal = document.getElementById('chatModal');
    document.getElementById('chatModalTitle').textContent = `CHAT: ${agent.name.toUpperCase()}`;
    document.getElementById('chatMessages').innerHTML = `
        <div class="chat-message agent">
            <div class="sender">${agent.name}</div>
            <div>Hello! I'm ready to help. What would you like me to work on?</div>
        </div>
    `;
    
    modal.classList.add('active');
    document.getElementById('chatInput').focus();
}

function closeChatModal() {
    document.getElementById('chatModal').classList.remove('active');
    currentChatAgent = null;
}

function handleChatKeypress(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendChatMessage();
    }
}

async function sendChatMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    if (!message || !currentChatAgent) return;
    
    const messagesContainer = document.getElementById('chatMessages');
    
    // Add user message
    messagesContainer.innerHTML += `
        <div class="chat-message user">
            <div class="sender">You</div>
            <div>${escapeHtml(message)}</div>
        </div>
    `;
    
    input.value = '';
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    // Add loading indicator
    const loadingId = 'loading-' + Date.now();
    messagesContainer.innerHTML += `
        <div class="chat-message agent" id="${loadingId}">
            <div class="sender">${currentChatAgent.name}</div>
            <div style="color: var(--text-muted);">Thinking...</div>
        </div>
    `;
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    try {
        const res = await fetch(`${API_BASE}/chat/${currentChatAgent.id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: message })
        });
        
        const data = await res.json();
        
        // Remove loading indicator
        document.getElementById(loadingId)?.remove();
        
        // Add response
        messagesContainer.innerHTML += `
            <div class="chat-message agent">
                <div class="sender">${currentChatAgent.name}</div>
                <div>${escapeHtml(data.response)}</div>
            </div>
        `;
        
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        
        // Refresh data to update stats
        await loadData();
        
    } catch (err) {
        console.error('Chat error:', err);
        document.getElementById(loadingId)?.remove();
        messagesContainer.innerHTML += `
            <div class="chat-message agent">
                <div class="sender">${currentChatAgent.name}</div>
                <div style="color: var(--accent-red);">Error: Failed to get response</div>
            </div>
        `;
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML.replace(/\n/g, '<br>');
}

// ============================================================================
// Utility
// ============================================================================

function updateAgentSelects() {
    updateParentAgentSelect();
    updateTaskAgentSelect();
}

// Expose functions to global window for access from other scripts (e.g., office.js)
window.openChatWithAgent = openChatWithAgent;
window.closeChatModal = closeChatModal;
window.openAgentModal = openAgentModal;
window.selectAgent = selectAgent;
window.closeAgentModal = closeAgentModal;
