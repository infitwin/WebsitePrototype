/**
 * Sandbox Firebase Integration Module
 * Extracted from sandbox.html - Phase 5 of Architecture Refactoring
 * 
 * Manages all Firebase operations for the sandbox including authentication,
 * file loading, face detection data, and Firestore operations.
 */

export class FirebaseIntegration {
    constructor(sandboxState) {
        this.sandboxState = sandboxState;
        this.initialized = false;
        this.log = sandboxState.log.bind(sandboxState);
    }

    /**
     * Initialize Firebase with configuration and auth state listener
     */
    async initialize() {
        if (this.initialized) return;
        
        try {
            // Initialize Firebase with configuration
            if (!firebase.apps.length) {
                const firebaseConfig = {
                    apiKey: "AIzaSyB0SdtkO7ngsXP7B0geafpDv_xEBAujel8",
                    authDomain: "infitwin.firebaseapp.com",
                    projectId: "infitwin",
                    storageBucket: "infitwin.firebasestorage.app",
                    messagingSenderId: "833139648849",
                    appId: "1:833139648849:web:2768d8e37cf2a318018b70",
                    measurementId: "G-PEJN4ZMCZ6"
                };
                firebase.initializeApp(firebaseConfig);
            }
            this.initialized = true;
            this.updateStatus(true);
            this.log('🔥 Firebase initialized');
            
            // Set up auth state listener
            firebase.auth().onAuthStateChanged(async (user) => {
                if (user) {
                    this.log('👤 User logged in:', user.email);
                    this.updateStatus(true);
                } else {
                    this.log('❌ No user logged in, attempting test login...');
                    // Try to login with test credentials
                    try {
                        await firebase.auth().signInWithEmailAndPassword('weezer@yev.com', '123456');
                        this.log('✅ Test user logged in');
                    } catch (error) {
                        this.log('❌ Login failed:', error.message);
                        this.updateStatus(false);
                    }
                }
            });
        } catch (error) {
            this.log('❌ Firebase initialization error:', error);
            this.updateStatus(false);
        }
    }

    /**
     * Update Firebase connection status in UI
     */
    updateStatus(connected) {
        const statusEl = document.getElementById('firebaseStatus');
        const statusText = document.getElementById('firebaseStatusText');
        if (statusEl && statusText) {
            if (connected) {
                statusEl.classList.add('connected');
                const user = firebase.auth().currentUser;
                if (user) {
                    statusText.textContent = 'Connected: ' + user.email;
                } else {
                    statusText.textContent = 'Connected';
                }
                statusEl.querySelector('span').style.background = '#28a745';
            } else {
                statusEl.classList.remove('connected');
                statusText.textContent = 'Disconnected';
                statusEl.querySelector('span').style.background = '#dc3545';
            }
        }
    }

    /**
     * Get current sandbox data for saving/export
     */
    getCurrentSandboxData() {
        // Get current sandbox state
        const nodes = [];
        const edges = [];
        
        // In a real implementation, we'd get this from the Nexus control
        if (this.sandboxState.sandboxRoot) {
            // Simulate getting data
            nodes.push({
                id: 'sandbox_node_1',
                label: 'Sample Node',
                type: 'person',
                _isSandbox: true,
                interviewId: 'interview_' + Date.now(),
                sessionId: 'session_' + Date.now()
            });
        }
        
        return { nodes, edges, changesCount: this.sandboxState.changesCount };
    }

    /**
     * Load user artifacts from Firebase
     */
    async loadUserArtifacts() {
        if (!this.initialized) {
            this.log('⏳ Firebase not initialized yet for artifacts');
            return;
        }
        
        const user = firebase.auth().currentUser;
        if (!user) {
            this.log('❌ No user logged in for artifacts');
            const loadingEl = document.getElementById('artifactsLoading');
            if (loadingEl) {
                loadingEl.innerHTML = '<div style="color: #666;">Please log in to see files</div>';
            }
            return;
        }
        
        this.log('📎 Loading artifacts for user:', user.email, 'UID:', user.uid);
        
        const gridEl = document.getElementById('artifactsGrid');
        const loadingEl = document.getElementById('artifactsLoading');
        
        if (!gridEl || !loadingEl) {
            this.log('❌ Missing DOM elements for artifacts');
            return;
        }
        
        try {
            // Get user's files from Firestore
            const db = firebase.firestore();
            const filesRef = db.collection('users').doc(user.uid).collection('files');
            this.log('🔍 Querying path: users/' + user.uid + '/files');
            
            // Try a simpler query first
            const snapshot = await filesRef.limit(50).get();
            
            this.log('📊 Query completed. Empty:', snapshot.empty, 'Size:', snapshot.size);
            
            if (snapshot.empty) {
                loadingEl.innerHTML = '<div style="color: #666;">No files uploaded yet. <a href="../pages/my-files.html" style="color: #6B46C1;">Upload files</a></div>';
                return;
            }
            
            loadingEl.style.display = 'none';
            gridEl.innerHTML = '';
            
            snapshot.forEach(doc => {
                const file = doc.data();
                this.log('📄 File:', doc.id, file.fileName || 'Unnamed');
                const thumbnail = window.createArtifactThumbnail(doc.id, file);
                gridEl.appendChild(thumbnail);
            });
            
            this.log('✅ Loaded', snapshot.size, 'artifacts');
        } catch (error) {
            this.log('❌ Error loading artifacts:', error.message);
            console.error('Full error:', error);
            loadingEl.innerHTML = '<div style="color: #EF4444;">Error: ' + error.message + '</div>';
            
            // Check if it's a permission error
            if (error.code === 'permission-denied') {
                loadingEl.innerHTML = '<div style="color: #EF4444;">Permission denied. Please check Firestore rules.</div>';
            } else if (error.message && error.message.includes('index')) {
                // Try without orderBy if it's an index issue
                try {
                    this.log('🔄 Retrying without orderBy...');
                    const snapshot = await firebase.firestore()
                        .collection('users').doc(user.uid).collection('files')
                        .limit(50).get();
                    
                    if (!snapshot.empty) {
                        loadingEl.style.display = 'none';
                        gridEl.innerHTML = '';
                        
                        snapshot.forEach(doc => {
                            const file = doc.data();
                            const thumbnail = window.createArtifactThumbnail(doc.id, file);
                            gridEl.appendChild(thumbnail);
                        });
                        
                        this.log('✅ Loaded', snapshot.size, 'artifacts (without orderBy)');
                    }
                } catch (retryError) {
                    this.log('❌ Retry also failed:', retryError.message);
                }
            }
        }
    }

    /**
     * Load user faces from Firebase
     */
    async loadUserFaces() {
        if (!this.initialized) {
            this.log('⏳ Firebase not initialized yet for faces');
            return;
        }
        
        const user = firebase.auth().currentUser;
        if (!user) {
            this.log('❌ No user logged in for faces');
            const loadingEl = document.getElementById('facesLoading');
            if (loadingEl) {
                loadingEl.innerHTML = '<div style="color: #666;">Please log in to see faces</div>';
            }
            return;
        }
        
        this.log('👤 Loading faces for user:', user.email, 'UID:', user.uid);
        
        const gridEl = document.getElementById('facesGrid');
        const loadingEl = document.getElementById('facesLoading');
        
        if (!gridEl || !loadingEl) {
            this.log('❌ Missing DOM elements for faces');
            return;
        }
        
        try {
            // Get user's files that have extractedFaces
            const db = firebase.firestore();
            const filesQuery = db.collection('users').doc(user.uid).collection('files')
                .where('hasExtractedFaces', '==', true)
                .limit(50);
            
            this.log('🔍 Querying files with faces for user:', user.uid);
            const snapshot = await filesQuery.get();
            
            this.log('📊 Face query completed. Empty:', snapshot.empty, 'Size:', snapshot.size);
            
            if (snapshot.empty) {
                loadingEl.innerHTML = '<div style="color: #666;">No faces found. <a href="../pages/my-files.html" style="color: #6B46C1;">Upload photos</a></div>';
                return;
            }
            
            loadingEl.style.display = 'none';
            gridEl.innerHTML = '';
            
            let totalFaces = 0;
            
            snapshot.forEach(doc => {
                const fileData = doc.data();
                this.log('📸 File with faces:', doc.id, fileData.fileName);
                
                if (fileData.extractedFaces && Array.isArray(fileData.extractedFaces)) {
                    this.log('🔍 First face structure:', JSON.stringify(fileData.extractedFaces[0]));
                    
                    fileData.extractedFaces.forEach((face, index) => {
                        if (face && (face.imageUrl || face.dataUrl || face.url)) {
                            const thumbnail = window.createFaceThumbnail(doc.id, fileData, face, index);
                            gridEl.appendChild(thumbnail);
                            totalFaces++;
                        }
                    });
                }
            });
            
            this.log('✅ Loaded', totalFaces, 'faces from', snapshot.size, 'files');
        } catch (error) {
            this.log('❌ Error loading faces:', error.message);
            console.error('Full error:', error);
            loadingEl.innerHTML = '<div style="color: #EF4444;">Error: ' + error.message + '</div>';
        }
    }

    /**
     * Save file to Firebase Storage and create Firestore record
     */
    async uploadFile(file, metadata = {}) {
        if (!this.initialized) {
            throw new Error('Firebase not initialized');
        }

        const user = firebase.auth().currentUser;
        if (!user) {
            throw new Error('User not authenticated');
        }

        try {
            // Upload to Storage
            const storageRef = firebase.storage().ref();
            const fileRef = storageRef.child(`users/${user.uid}/files/${file.name}_${Date.now()}`);
            
            this.log('📤 Uploading file:', file.name);
            const uploadTask = await fileRef.put(file);
            const downloadURL = await uploadTask.ref.getDownloadURL();

            // Create Firestore record
            const db = firebase.firestore();
            const fileDoc = {
                fileName: file.name,
                fileType: file.type,
                fileSize: file.size,
                downloadURL: downloadURL,
                uploadedAt: firebase.firestore.FieldValue.serverTimestamp(),
                userId: user.uid,
                ...metadata
            };

            const docRef = await db.collection('users').doc(user.uid).collection('files').add(fileDoc);
            
            this.log('✅ File uploaded and saved:', docRef.id);
            return { id: docRef.id, ...fileDoc, downloadURL };

        } catch (error) {
            this.log('❌ Upload error:', error.message);
            throw error;
        }
    }

    /**
     * Delete file from Firebase
     */
    async deleteFile(fileId) {
        if (!this.initialized) {
            throw new Error('Firebase not initialized');
        }

        const user = firebase.auth().currentUser;
        if (!user) {
            throw new Error('User not authenticated');
        }

        try {
            const db = firebase.firestore();
            const fileRef = db.collection('users').doc(user.uid).collection('files').doc(fileId);
            
            // Get file data to delete from storage
            const fileDoc = await fileRef.get();
            if (fileDoc.exists) {
                const fileData = fileDoc.data();
                
                // Delete from Storage if URL exists
                if (fileData.downloadURL) {
                    try {
                        const storageRef = firebase.storage().refFromURL(fileData.downloadURL);
                        await storageRef.delete();
                        this.log('✅ File deleted from storage');
                    } catch (storageError) {
                        this.log('⚠️ Storage delete failed (file may not exist):', storageError.message);
                    }
                }
                
                // Delete from Firestore
                await fileRef.delete();
                this.log('✅ File record deleted:', fileId);
                return true;
            } else {
                this.log('❌ File not found:', fileId);
                return false;
            }
        } catch (error) {
            this.log('❌ Delete error:', error.message);
            throw error;
        }
    }

    /**
     * Get current user information
     */
    getCurrentUser() {
        return firebase.auth().currentUser;
    }

    /**
     * Sign out current user
     */
    async signOut() {
        try {
            await firebase.auth().signOut();
            this.log('👋 User signed out');
            this.updateStatus(false);
        } catch (error) {
            this.log('❌ Sign out error:', error.message);
            throw error;
        }
    }
}

/**
 * Factory function to create Firebase integration instance
 */
export function createFirebaseIntegration(sandboxState) {
    return new FirebaseIntegration(sandboxState);
}