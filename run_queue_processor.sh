#!/bin/bash
# Queue processor daemon - calls agent_worker.py every 2 seconds
cd /home/theoffice/mission-control
echo "Queue processor started"
while true; do
    python3 agent_worker.py
    sleep 2
done
