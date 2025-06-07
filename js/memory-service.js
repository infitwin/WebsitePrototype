/**
 * Memory Service
 * 
 * Handles all memory-related operations including CRUD operations,
 * validation, and interaction with Firestore.
 */

// TODO: Import Firebase when SDK is added
// import { db } from './firebase-config.js';
// import { 
//     collection, 
//     doc, 
//     setDoc, 
//     getDoc, 
//     getDocs, 
//     updateDoc, 
//     deleteDoc, 
//     query, 
//     where, 
//     orderBy, 
//     limit 
// } from 'firebase/firestore';

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
        id: data.id || generateMemoryId(),
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
 * Generate a unique memory ID
 * @returns {string} Unique ID
 */
function generateMemoryId() {
    // Simple ID generation - in production, Firestore auto-generates IDs
    return `memory_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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
        
        // TODO: Save to Firestore
        // const docRef = doc(db, 'users', memory.userId, 'memories', memory.id);
        // await setDoc(docRef, memory);
        
        // Temporary: Save to localStorage
        const memories = getLocalMemories();
        memories[memory.id] = memory;
        localStorage.setItem('infitwin_memories', JSON.stringify(memories));
        
        console.log('Memory saved:', memory);
        return memory;
    } catch (error) {
        console.error('Error saving memory:', error);
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
        // TODO: Get from Firestore
        // const docRef = doc(db, 'users', userId, 'memories', memoryId);
        // const docSnap = await getDoc(docRef);
        // return docSnap.exists() ? docSnap.data() : null;
        
        // Temporary: Get from localStorage
        const memories = getLocalMemories();
        return memories[memoryId] || null;
    } catch (error) {
        console.error('Error getting memory:', error);
        throw error;
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
        
        // TODO: Query Firestore
        // const memoriesRef = collection(db, 'users', userId, 'memories');
        // let q = query(memoriesRef, orderBy(orderField, orderDirection), limit(limitCount));
        // 
        // if (filterType) {
        //     q = query(q, where('type', '==', filterType));
        // }
        // 
        // const querySnapshot = await getDocs(q);
        // return querySnapshot.docs.map(doc => doc.data());
        
        // Temporary: Get from localStorage
        const memories = getLocalMemories();
        let userMemories = Object.values(memories).filter(m => m.userId === userId);
        
        // Apply filters
        if (filterType) {
            userMemories = userMemories.filter(m => m.type === filterType);
        }
        
        // Sort
        userMemories.sort((a, b) => {
            const aVal = a[orderField];
            const bVal = b[orderField];
            return orderDirection === 'desc' ? 
                (bVal > aVal ? 1 : -1) : 
                (aVal > bVal ? 1 : -1);
        });
        
        // Limit
        return userMemories.slice(0, limitCount);
    } catch (error) {
        console.error('Error getting user memories:', error);
        throw error;
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
        
        // TODO: Update in Firestore
        // const docRef = doc(db, 'users', userId, 'memories', memoryId);
        // await updateDoc(docRef, updated);
        
        // Temporary: Update in localStorage
        const memories = getLocalMemories();
        memories[memoryId] = updated;
        localStorage.setItem('infitwin_memories', JSON.stringify(memories));
        
        return updated;
    } catch (error) {
        console.error('Error updating memory:', error);
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
        // TODO: Delete from Firestore
        // const docRef = doc(db, 'users', userId, 'memories', memoryId);
        // await deleteDoc(docRef);
        
        // Temporary: Delete from localStorage
        const memories = getLocalMemories();
        delete memories[memoryId];
        localStorage.setItem('infitwin_memories', JSON.stringify(memories));
    } catch (error) {
        console.error('Error deleting memory:', error);
        throw error;
    }
}

// Temporary helper for localStorage
function getLocalMemories() {
    try {
        const data = localStorage.getItem('infitwin_memories');
        return data ? JSON.parse(data) : {};
    } catch {
        return {};
    }
}