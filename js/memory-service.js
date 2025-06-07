/**
 * Memory Service
 * 
 * Handles all memory-related operations including CRUD operations,
 * validation, and interaction with Firestore.
 */

import { db } from './firebase-config.js';
import { 
    collection, 
    doc, 
    setDoc, 
    getDoc, 
    getDocs, 
    updateDoc, 
    deleteDoc, 
    query, 
    where, 
    orderBy as firestoreOrderBy, 
    limit,
    serverTimestamp 
} from 'firebase/firestore';

import { validateMemory } from './utils/validators.js';

/**
 * Memory object schema
 * @typedef {Object} Memory
 * @property {string} id - Unique identifier
 * @property {string} userId - Owner's user ID
 * @property {string} content - Interview response text
 * @property {string} timestamp - ISO string creation time
 * @property {string} type - Memory type (winston_interview, manual, etc.)
 * @property {string[]} entities - Extracted entities/topics
 * @property {string} privacy - Privacy setting (private, shared)
 * @property {Object} metadata - Additional metadata
 * @property {string} metadata.interviewSession - Session ID if from interview
 * @property {number} metadata.wordCount - Content word count
 * @property {string[]} metadata.tags - User or auto-generated tags
 * @property {string} metadata.lastModified - ISO string of last edit
 */

/**
 * Create a new memory object with defaults
 * @param {Partial<Memory>} data - Memory data
 * @returns {Memory} Complete memory object
 */
export function createMemoryObject(data) {
    const now = new Date().toISOString();
    const wordCount = data.content ? data.content.trim().split(/\s+/).length : 0;
    
    return {
        id: data.id || '', // Firestore will auto-generate if empty
        userId: data.userId || '',
        content: data.content || '',
        timestamp: data.timestamp || now,
        type: data.type || 'manual',
        entities: data.entities || [],
        privacy: data.privacy || 'private',
        metadata: {
            interviewSession: data.metadata?.interviewSession || '',
            wordCount: wordCount,
            tags: data.metadata?.tags || [],
            lastModified: data.metadata?.lastModified || now
        }
    };
}

/**
 * Save a memory to Firestore
 * @param {Partial<Memory>} memoryData - Memory data to save
 * @returns {Promise<Memory>} Saved memory object
 */
export async function saveMemory(memoryData) {
    try {
        // Create complete memory object
        const memory = createMemoryObject(memoryData);
        
        // Validate memory
        const validation = validateMemory(memory);
        if (!validation.isValid) {
            throw new Error(`Invalid memory: ${validation.errors.join(', ')}`);
        }
        
        // Get or create document reference
        const memoriesRef = collection(db, 'users', memory.userId, 'memories');
        const docRef = memory.id ? 
            doc(memoriesRef, memory.id) : 
            doc(memoriesRef); // Auto-generate ID
        
        // Update ID if auto-generated
        if (!memory.id) {
            memory.id = docRef.id;
        }
        
        // Add server timestamp
        const dataToSave = {
            ...memory,
            serverTimestamp: serverTimestamp()
        };
        
        // Save to Firestore
        await setDoc(docRef, dataToSave);
        
        console.log('Memory saved to Firestore:', memory.id);
        
        // Also save to localStorage as backup
        const memories = getLocalMemories();
        memories[memory.id] = memory;
        localStorage.setItem('infitwin_memories', JSON.stringify(memories));
        
        return memory;
    } catch (error) {
        console.error('Error saving memory:', error);
        
        // Fallback to localStorage only
        if (error.code === 'permission-denied') {
            console.warn('Firestore permission denied, saving to localStorage only');
            const memory = createMemoryObject(memoryData);
            const memories = getLocalMemories();
            memories[memory.id] = memory;
            localStorage.setItem('infitwin_memories', JSON.stringify(memories));
            return memory;
        }
        
        throw error;
    }
}

/**
 * Get a single memory by ID
 * @param {string} userId - User ID
 * @param {string} memoryId - Memory ID
 * @returns {Promise<Memory|null>} Memory object or null
 */
export async function getMemory(userId, memoryId) {
    try {
        // Get from Firestore
        const docRef = doc(db, 'users', userId, 'memories', memoryId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
            const data = docSnap.data();
            // Remove server timestamp field
            delete data.serverTimestamp;
            return data;
        }
        
        // Fallback to localStorage
        const memories = getLocalMemories();
        return memories[memoryId] || null;
    } catch (error) {
        console.error('Error getting memory:', error);
        
        // Fallback to localStorage
        const memories = getLocalMemories();
        return memories[memoryId] || null;
    }
}

/**
 * Get all memories for a user
 * @param {string} userId - User ID
 * @param {Object} options - Query options
 * @returns {Promise<Memory[]>} Array of memories
 */
export async function getUserMemories(userId, options = {}) {
    try {
        const {
            orderBy: orderField = 'timestamp',
            orderDirection = 'desc',
            limitCount = 50,
            filterType = null
        } = options;
        
        // Query Firestore
        const memoriesRef = collection(db, 'users', userId, 'memories');
        let constraints = [
            firestoreOrderBy(orderField, orderDirection),
            limit(limitCount)
        ];
        
        if (filterType) {
            constraints.unshift(where('type', '==', filterType));
        }
        
        const q = query(memoriesRef, ...constraints);
        const querySnapshot = await getDocs(q);
        
        const memories = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            // Remove server timestamp field
            delete data.serverTimestamp;
            memories.push(data);
        });
        
        // Sync with localStorage
        const localMemories = getLocalMemories();
        memories.forEach(memory => {
            localMemories[memory.id] = memory;
        });
        localStorage.setItem('infitwin_memories', JSON.stringify(localMemories));
        
        return memories;
    } catch (error) {
        console.error('Error getting user memories:', error);
        
        // Fallback to localStorage
        const memories = getLocalMemories();
        let userMemories = Object.values(memories).filter(m => m.userId === userId);
        
        // Apply filters
        if (options.filterType) {
            userMemories = userMemories.filter(m => m.type === options.filterType);
        }
        
        // Sort
        userMemories.sort((a, b) => {
            const aVal = a[options.orderBy || 'timestamp'];
            const bVal = b[options.orderBy || 'timestamp'];
            return (options.orderDirection || 'desc') === 'desc' ? 
                (bVal > aVal ? 1 : -1) : 
                (aVal > bVal ? 1 : -1);
        });
        
        // Limit
        return userMemories.slice(0, options.limitCount || 50);
    }
}

/**
 * Update a memory
 * @param {string} userId - User ID
 * @param {string} memoryId - Memory ID
 * @param {Partial<Memory>} updates - Fields to update
 * @returns {Promise<Memory>} Updated memory
 */
export async function updateMemory(userId, memoryId, updates) {
    try {
        // Get existing memory
        const existing = await getMemory(userId, memoryId);
        if (!existing) {
            throw new Error('Memory not found');
        }
        
        // Merge updates
        const updated = {
            ...existing,
            ...updates,
            metadata: {
                ...existing.metadata,
                ...updates.metadata,
                lastModified: new Date().toISOString()
            }
        };
        
        // Validate
        const validation = validateMemory(updated);
        if (!validation.isValid) {
            throw new Error(`Invalid memory update: ${validation.errors.join(', ')}`);
        }
        
        // Update in Firestore
        const docRef = doc(db, 'users', userId, 'memories', memoryId);
        await updateDoc(docRef, {
            ...updated,
            serverTimestamp: serverTimestamp()
        });
        
        // Update in localStorage
        const memories = getLocalMemories();
        memories[memoryId] = updated;
        localStorage.setItem('infitwin_memories', JSON.stringify(memories));
        
        return updated;
    } catch (error) {
        console.error('Error updating memory:', error);
        
        // Fallback to localStorage only
        if (error.code === 'permission-denied' || error.code === 'not-found') {
            const memories = getLocalMemories();
            const existing = memories[memoryId];
            if (!existing) {
                throw new Error('Memory not found');
            }
            
            const updated = {
                ...existing,
                ...updates,
                metadata: {
                    ...existing.metadata,
                    ...updates.metadata,
                    lastModified: new Date().toISOString()
                }
            };
            
            memories[memoryId] = updated;
            localStorage.setItem('infitwin_memories', JSON.stringify(memories));
            return updated;
        }
        
        throw error;
    }
}

/**
 * Delete a memory
 * @param {string} userId - User ID
 * @param {string} memoryId - Memory ID
 * @returns {Promise<void>}
 */
export async function deleteMemory(userId, memoryId) {
    try {
        // Delete from Firestore
        const docRef = doc(db, 'users', userId, 'memories', memoryId);
        await deleteDoc(docRef);
        
        // Delete from localStorage
        const memories = getLocalMemories();
        delete memories[memoryId];
        localStorage.setItem('infitwin_memories', JSON.stringify(memories));
    } catch (error) {
        console.error('Error deleting memory:', error);
        
        // Fallback to localStorage only
        if (error.code === 'permission-denied' || error.code === 'not-found') {
            const memories = getLocalMemories();
            delete memories[memoryId];
            localStorage.setItem('infitwin_memories', JSON.stringify(memories));
            return;
        }
        
        throw error;
    }
}

/**
 * Search memories by content
 * @param {string} userId - User ID
 * @param {string} searchTerm - Search term
 * @returns {Promise<Memory[]>} Matching memories
 */
export async function searchMemories(userId, searchTerm) {
    try {
        // For now, get all memories and filter client-side
        // In production, use Algolia or Firebase Extensions for full-text search
        const allMemories = await getUserMemories(userId, { limitCount: 1000 });
        
        const lowerSearch = searchTerm.toLowerCase();
        return allMemories.filter(memory => 
            memory.content.toLowerCase().includes(lowerSearch) ||
            memory.metadata.tags.some(tag => tag.toLowerCase().includes(lowerSearch)) ||
            memory.entities.some(entity => entity.toLowerCase().includes(lowerSearch))
        );
    } catch (error) {
        console.error('Error searching memories:', error);
        return [];
    }
}

// Helper for localStorage
function getLocalMemories() {
    try {
        const data = localStorage.getItem('infitwin_memories');
        return data ? JSON.parse(data) : {};
    } catch {
        return {};
    }
}