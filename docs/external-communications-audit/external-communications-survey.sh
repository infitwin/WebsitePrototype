#!/bin/bash
# External Communications Survey Script
# Run this in WSL to find all external connections

cd "/home/tim/current projects/ui-studio"

# Create comprehensive output file
cat > external-connections-survey.txt << 'EOF'
=== External Communications Survey ===
Directory: /home/tim/current projects/ui-studio
Date: $(date)
Purpose: Find all code that communicates with external services

EOF

echo "Starting survey..."

# 1. WebSocket and Real-time Connections
echo -e "\n=== WEBSOCKET AND REAL-TIME ===" >> external-connections-survey.txt
echo "Files with WebSocket connections:" >> external-connections-survey.txt
grep -r "WebSocket\|ws://\|wss://" app/src/ -l 2>/dev/null >> external-connections-survey.txt || echo "None found" >> external-connections-survey.txt

echo -e "\nFiles with Socket.io:" >> external-connections-survey.txt
grep -r "socket\.io\|io\.connect" app/src/ -l 2>/dev/null >> external-connections-survey.txt || echo "None found" >> external-connections-survey.txt

# 2. Firebase Services
echo -e "\n=== FIREBASE SERVICES ===" >> external-connections-survey.txt
echo "Firebase initialization:" >> external-connections-survey.txt
grep -r "initializeApp\|firebase\.app" app/src/ -l 2>/dev/null >> external-connections-survey.txt || echo "None found" >> external-connections-survey.txt

echo -e "\nFirebase Auth:" >> external-connections-survey.txt
grep -r "getAuth\|onAuthStateChanged\|signIn\|signOut" app/src/ -l 2>/dev/null >> external-connections-survey.txt || echo "None found" >> external-connections-survey.txt

echo -e "\nFirestore Database:" >> external-connections-survey.txt
grep -r "getFirestore\|collection\|doc\|setDoc\|getDoc" app/src/ -l 2>/dev/null >> external-connections-survey.txt || echo "None found" >> external-connections-survey.txt

echo -e "\nFirebase Storage:" >> external-connections-survey.txt
grep -r "getStorage\|uploadBytes\|getDownloadURL" app/src/ -l 2>/dev/null >> external-connections-survey.txt || echo "None found" >> external-connections-survey.txt

# 3. Audio/Video Streaming
echo -e "\n=== AUDIO/VIDEO STREAMING ===" >> external-connections-survey.txt
echo "Audio Context and Streaming:" >> external-connections-survey.txt
grep -r "AudioContext\|getUserMedia\|MediaStream\|audioWorklet" app/src/ -l 2>/dev/null >> external-connections-survey.txt || echo "None found" >> external-connections-survey.txt

# 4. HTTP/API Calls
echo -e "\n=== HTTP/API CALLS ===" >> external-connections-survey.txt
echo "Fetch API calls:" >> external-connections-survey.txt
grep -r "fetch(" app/src/ -l 2>/dev/null >> external-connections-survey.txt || echo "None found" >> external-connections-survey.txt

echo -e "\nAxios/HTTP libraries:" >> external-connections-survey.txt
grep -r "axios\|http\.get\|http\.post" app/src/ -l 2>/dev/null >> external-connections-survey.txt || echo "None found" >> external-connections-survey.txt

# 5. Third-party Services
echo -e "\n=== THIRD-PARTY SERVICES ===" >> external-connections-survey.txt
echo "AI Services (Gemini, OpenAI, etc):" >> external-connections-survey.txt
grep -r "gemini\|openai\|anthropic\|ai\.google" app/src/ -l 2>/dev/null >> external-connections-survey.txt || echo "None found" >> external-connections-survey.txt

echo -e "\nDatabase connections (Neo4j, etc):" >> external-connections-survey.txt
grep -r "neo4j\|mongodb\|postgres" app/src/ -l 2>/dev/null >> external-connections-survey.txt || echo "None found" >> external-connections-survey.txt

# 6. Summary
echo -e "\n=== SUMMARY ===" >> external-connections-survey.txt
echo "Total files with external communications:" >> external-connections-survey.txt
grep -r "WebSocket\|fetch(\|firebase\|axios\|getUserMedia" app/src/ -l 2>/dev/null | sort | uniq | wc -l >> external-connections-survey.txt

echo -e "\nSurvey complete! Results saved to: external-connections-survey.txt"
echo "To view results: cat external-connections-survey.txt"

# Also create a simple list of unique files
echo -e "\n=== ALL UNIQUE FILES WITH EXTERNAL COMMUNICATIONS ===" > all-external-files.txt
grep -r "WebSocket\|fetch(\|firebase\|axios\|getUserMedia\|socket\|http\|getAuth\|getFirestore" app/src/ -l 2>/dev/null | sort | uniq >> all-external-files.txt

echo "Simple file list saved to: all-external-files.txt"
echo "Total unique files: $(cat all-external-files.txt | wc -l)"