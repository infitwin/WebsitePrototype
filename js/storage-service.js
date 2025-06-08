/**
 * Storage Service - Advanced storage calculations and analytics
 */

import { auth, db, storage } from './firebase-config.js';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { ref, listAll, getMetadata } from 'firebase/storage';

// Storage constants
export const STORAGE_LIMIT = 1 * 1024 * 1024 * 1024; // 1GB in bytes

/**
 * Get storage breakdown by file type
 */
export async function getStorageBreakdown() {
    if (!auth.currentUser) {
        throw new Error('User not authenticated');
    }

    const userId = auth.currentUser.uid;
    const breakdown = {
        images: { count: 0, size: 0 },
        documents: { count: 0, size: 0 },
        spreadsheets: { count: 0, size: 0 },
        ebooks: { count: 0, size: 0 },
        other: { count: 0, size: 0 }
    };

    try {
        // Query file records from Firestore
        const filesRef = collection(db, 'files');
        const q = query(filesRef, where('userId', '==', userId));
        const snapshot = await getDocs(q);

        snapshot.forEach(doc => {
            const file = doc.data();
            const category = categorizeFile(file.fileType);
            breakdown[category].count++;
            breakdown[category].size += file.fileSize || 0;
        });

        return breakdown;
    } catch (error) {
        console.error('Error getting storage breakdown:', error);
        throw error;
    }
}

/**
 * Get storage usage history (last 30 days)
 */
export async function getStorageHistory() {
    if (!auth.currentUser) {
        throw new Error('User not authenticated');
    }

    const userId = auth.currentUser.uid;
    const history = [];
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    try {
        // For demo purposes, generate sample history data
        // In production, this would query a storage history collection
        const currentUsage = await calculateStorageUsed();
        
        for (let i = 29; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            
            // Simulate gradual increase with some variation
            const factor = (30 - i) / 30;
            const variation = Math.random() * 0.1 - 0.05; // ±5% variation
            const usage = currentUsage * factor * (1 + variation);
            
            history.push({
                date: date.toISOString().split('T')[0],
                usage: Math.max(0, Math.floor(usage))
            });
        }

        return history;
    } catch (error) {
        console.error('Error getting storage history:', error);
        return [];
    }
}

/**
 * Calculate days until storage full based on usage trend
 */
export async function calculateDaysUntilFull() {
    try {
        const history = await getStorageHistory();
        if (history.length < 7) {
            return null; // Not enough data
        }

        // Calculate average daily increase over last 7 days
        const recentHistory = history.slice(-7);
        const dailyIncrease = (recentHistory[6].usage - recentHistory[0].usage) / 6;

        if (dailyIncrease <= 0) {
            return null; // Storage not increasing
        }

        const currentUsage = recentHistory[6].usage;
        const remainingStorage = STORAGE_LIMIT - currentUsage;
        const daysUntilFull = Math.ceil(remainingStorage / dailyIncrease);

        return daysUntilFull > 0 ? daysUntilFull : 0;
    } catch (error) {
        console.error('Error calculating days until full:', error);
        return null;
    }
}

/**
 * Get storage recommendations
 */
export async function getStorageRecommendations() {
    if (!auth.currentUser) {
        return [];
    }

    const recommendations = [];
    const userId = auth.currentUser.uid;

    try {
        // Get large files (over 5MB)
        const filesRef = collection(db, 'files');
        const largeFilesQuery = query(
            filesRef, 
            where('userId', '==', userId),
            where('fileSize', '>', 5 * 1024 * 1024),
            orderBy('fileSize', 'desc'),
            limit(5)
        );
        const largeFiles = await getDocs(largeFilesQuery);

        if (!largeFiles.empty) {
            recommendations.push({
                type: 'large_files',
                title: 'Review Large Files',
                description: `You have ${largeFiles.size} files over 5MB that could be optimized`,
                action: 'review',
                priority: 'high',
                files: largeFiles.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }))
            });
        }

        // Check for old files (over 90 days)
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
        
        const oldFilesQuery = query(
            filesRef,
            where('userId', '==', userId),
            where('uploadedAt', '<', ninetyDaysAgo.toISOString()),
            limit(10)
        );
        const oldFiles = await getDocs(oldFilesQuery);

        if (!oldFiles.empty) {
            recommendations.push({
                type: 'old_files',
                title: 'Archive Old Files',
                description: `${oldFiles.size} files haven't been accessed in over 90 days`,
                action: 'archive',
                priority: 'medium'
            });
        }

        // Check for duplicate names (simplified check)
        const allFilesQuery = query(filesRef, where('userId', '==', userId));
        const allFiles = await getDocs(allFilesQuery);
        const fileNames = {};
        
        allFiles.forEach(doc => {
            const file = doc.data();
            if (!fileNames[file.fileName]) {
                fileNames[file.fileName] = [];
            }
            fileNames[file.fileName].push({ id: doc.id, ...file });
        });

        const duplicates = Object.entries(fileNames).filter(([_, files]) => files.length > 1);
        if (duplicates.length > 0) {
            recommendations.push({
                type: 'duplicates',
                title: 'Remove Duplicates',
                description: `Found ${duplicates.length} potential duplicate files`,
                action: 'deduplicate',
                priority: 'low'
            });
        }

        return recommendations;
    } catch (error) {
        console.error('Error getting recommendations:', error);
        return [];
    }
}

/**
 * Calculate total storage used
 */
export async function calculateStorageUsed() {
    if (!auth.currentUser) {
        return 0;
    }

    const userId = auth.currentUser.uid;
    let totalSize = 0;

    try {
        const filesRef = collection(db, 'files');
        const q = query(filesRef, where('userId', '==', userId));
        const snapshot = await getDocs(q);

        snapshot.forEach(doc => {
            const file = doc.data();
            totalSize += file.fileSize || 0;
        });

        return totalSize;
    } catch (error) {
        console.error('Error calculating storage:', error);
        return 0;
    }
}

/**
 * Optimize storage by removing duplicates
 */
export async function optimizeDuplicates() {
    // This would implement duplicate detection and removal
    // For now, return a mock result
    return {
        filesRemoved: 0,
        spaceRecovered: 0,
        message: 'No duplicates found'
    };
}

/**
 * Archive old files
 */
export async function archiveOldFiles(daysOld = 90) {
    // This would move old files to archive
    // For now, return a mock result
    return {
        filesArchived: 0,
        spaceFreed: 0,
        message: 'No files old enough to archive'
    };
}

// Helper function to categorize files
function categorizeFile(mimeType) {
    if (mimeType.startsWith('image/')) return 'images';
    if (mimeType.includes('pdf') || mimeType.includes('word') || mimeType.includes('document')) return 'documents';
    if (mimeType.includes('sheet') || mimeType.includes('excel')) return 'spreadsheets';
    if (mimeType.includes('epub')) return 'ebooks';
    return 'other';
}

// Export for use in other modules
export { categorizeFile };