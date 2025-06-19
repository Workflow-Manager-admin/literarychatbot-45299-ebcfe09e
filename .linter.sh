#!/bin/bash
cd /home/kavia/workspace/code-generation/literarychatbot-45299-ebcfe09e/literarychatbot_frontend
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

