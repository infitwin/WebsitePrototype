/**
 * Debug Sandbox Loading Issue
 * Check why data exists in Neo4j but isn't showing in Nexus
 */

// Add this script to sandbox.html temporarily
(async function debugSandboxLoading() {
    console.log('🔍 DEBUG: Sandbox Loading Diagnostic');
    
    // Wait for auth to complete
    await new Promise(resolve => {
        if (window.currentUser) {
            resolve();
        } else {
            const checkAuth = setInterval(() => {
                if (window.currentUser) {
                    clearInterval(checkAuth);
                    resolve();
                }
            }, 100);
        }
    });
    
    console.log('✅ Auth complete:', {
        userId: window.currentUser?.uid,
        twinId: window.currentTwinId
    });
    
    // Check current interview ID
    const currentInterviewId = localStorage.getItem('currentInterviewId');
    console.log('📋 Current Interview ID:', currentInterviewId);
    
    // Query Neo4j directly to see what's there
    if (window.Neo4jConnection) {
        try {
            // Get all sandbox nodes
            const allSandboxNodes = await window.Neo4jConnection.getDataForInterview(
                'interview_1751065502625_1m00mqvte', // The known interview ID
                'Sandbox'
            );
            console.log('📦 All sandbox nodes for known interview:', allSandboxNodes);
            
            // Try with current interview ID
            if (currentInterviewId && currentInterviewId !== 'interview_1751065502625_1m00mqvte') {
                const currentNodes = await window.Neo4jConnection.getDataForInterview(
                    currentInterviewId,
                    'Sandbox'
                );
                console.log('📦 Sandbox nodes for current interview:', currentNodes);
            }
            
            // Check if userId/twinId match
            if (allSandboxNodes.length > 0) {
                const node = allSandboxNodes[0];
                console.log('🔍 Checking user match:', {
                    nodeUserId: node.userId,
                    currentUserId: window.currentUser?.uid,
                    match: node.userId === window.currentUser?.uid
                });
                console.log('🔍 Checking twin match:', {
                    nodeTwinId: node.twinId,
                    currentTwinId: window.currentTwinId,
                    match: node.twinId === window.currentTwinId
                });
            }
            
            // Check what the loadExistingSandboxData function sees
            if (window.loadExistingSandboxData) {
                console.log('🔄 Calling loadExistingSandboxData...');
                const loaded = await window.loadExistingSandboxData();
                console.log('📊 loadExistingSandboxData result:', loaded);
            }
            
            // Check if Nexus is initialized
            if (window.graphRef && window.graphRef.current) {
                console.log('✅ Nexus graph ref exists');
                const nodes = window.graphRef.current.getNodes();
                console.log('📊 Current Nexus nodes:', nodes);
            } else {
                console.log('❌ Nexus graph ref not initialized');
            }
            
        } catch (error) {
            console.error('❌ Debug error:', error);
        }
    }
})();