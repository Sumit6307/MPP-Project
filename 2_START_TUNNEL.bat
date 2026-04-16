@echo off
title Ngrok Tunnel
echo Starting Ngrok on Port 4000...
npx ngrok http 127.0.0.1:4000
pause
