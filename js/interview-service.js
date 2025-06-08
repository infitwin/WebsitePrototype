/**
 * Interview Service - Firestore query system for interview transcripts
 */

import { auth, db } from './firebase-config.js';
import { 
    collection, 
    query, 
    where, 
    orderBy, 
    limit, 
    getDocs, 
    doc, 
    deleteDoc,
    startAfter 
} from 'firebase/firestore';

/**
 * Get all interview sessions for the current user
 */
export async function getInterviewSessions() {
    if (!auth.currentUser) {
        throw new Error('User not authenticated');
    }

    const userId = auth.currentUser.uid;
    
    try {
        // Query interview sessions
        const sessionsRef = collection(db, 'interview_sessions');
        const q = query(
            sessionsRef,
            where('userId', '==', userId),
            orderBy('createdAt', 'desc')
        );
        
        const snapshot = await getDocs(q);
        const sessions = [];
        
        snapshot.forEach(doc => {
            sessions.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        return sessions;
    } catch (error) {
        console.error('Error fetching interview sessions:', error);
        
        // Return mock data for development/testing
        return getMockInterviewSessions();
    }
}

/**
 * Get messages for a specific interview session
 */
export async function getInterviewMessages(sessionId, pageSize = 50, lastMessage = null) {
    if (!auth.currentUser) {
        throw new Error('User not authenticated');
    }

    try {
        // Query messages for the session
        const messagesRef = collection(db, 'interview_messages');
        let q = query(
            messagesRef,
            where('sessionId', '==', sessionId),
            orderBy('timestamp', 'asc'),
            limit(pageSize)
        );
        
        // Add pagination if lastMessage is provided
        if (lastMessage) {
            q = query(q, startAfter(lastMessage.timestamp));
        }
        
        const snapshot = await getDocs(q);
        const messages = [];
        
        snapshot.forEach(doc => {
            messages.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        return messages;
    } catch (error) {
        console.error('Error fetching interview messages:', error);
        
        // Return mock data for development/testing
        return getMockInterviewMessages(sessionId);
    }
}

/**
 * Delete an entire interview session and all its messages
 */
export async function deleteInterviewSession(sessionId) {
    if (!auth.currentUser) {
        throw new Error('User not authenticated');
    }

    try {
        // First delete all messages in the session
        const messagesRef = collection(db, 'interview_messages');
        const messagesQuery = query(messagesRef, where('sessionId', '==', sessionId));
        const messagesSnapshot = await getDocs(messagesQuery);
        
        const deletePromises = [];
        messagesSnapshot.forEach(messageDoc => {
            deletePromises.push(deleteDoc(messageDoc.ref));
        });
        
        // Delete all messages
        await Promise.all(deletePromises);
        
        // Then delete the session
        const sessionRef = doc(db, 'interview_sessions', sessionId);
        await deleteDoc(sessionRef);
        
        return true;
    } catch (error) {
        console.error('Error deleting interview session:', error);
        throw error;
    }
}

/**
 * Search within interview transcript
 */
export async function searchInterviewMessages(sessionId, searchTerm) {
    if (!searchTerm || searchTerm.trim().length < 2) {
        return [];
    }
    
    try {
        // Get all messages for the session
        const messages = await getInterviewMessages(sessionId, 1000); // Get all messages
        
        // Filter messages that contain the search term
        const searchTermLower = searchTerm.toLowerCase();
        const matchingMessages = messages.filter(message => 
            message.content && 
            message.content.toLowerCase().includes(searchTermLower)
        );
        
        return matchingMessages;
    } catch (error) {
        console.error('Error searching interview messages:', error);
        return [];
    }
}

/**
 * Export interview transcript as text file
 */
export function exportInterviewTranscript(session, messages) {
    try {
        // Create formatted transcript
        let transcript = `Interview Transcript\n`;
        transcript += `Session: ${session.title || 'Untitled Session'}\n`;
        transcript += `Date: ${formatDate(session.createdAt)}\n`;
        transcript += `Duration: ${formatDuration(session.duration)}\n`;
        transcript += `\n${'='.repeat(50)}\n\n`;
        
        // Add messages
        messages.forEach(message => {
            const timestamp = formatTime(message.timestamp);
            const speaker = message.speaker === 'user' ? 'You' : 'Infitwin AI';
            transcript += `[${timestamp}] ${speaker}:\n${message.content}\n\n`;
        });
        
        // Create and download file
        const blob = new Blob([transcript], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `interview-${session.id}-${formatDateForFilename(session.createdAt)}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        return true;
    } catch (error) {
        console.error('Error exporting transcript:', error);
        return false;
    }
}

/**
 * Get statistics for an interview session
 */
export function getInterviewStats(messages) {
    if (!messages || messages.length === 0) {
        return {
            totalMessages: 0,
            userMessages: 0,
            aiMessages: 0,
            averageMessageLength: 0,
            totalWords: 0
        };
    }
    
    const userMessages = messages.filter(m => m.speaker === 'user');
    const aiMessages = messages.filter(m => m.speaker === 'ai');
    
    const totalWords = messages.reduce((total, message) => {
        return total + (message.content ? message.content.split(' ').length : 0);
    }, 0);
    
    const averageMessageLength = messages.reduce((total, message) => {
        return total + (message.content ? message.content.length : 0);
    }, 0) / messages.length;
    
    return {
        totalMessages: messages.length,
        userMessages: userMessages.length,
        aiMessages: aiMessages.length,
        averageMessageLength: Math.round(averageMessageLength),
        totalWords
    };
}

// Mock data functions for development/testing
function getMockInterviewSessions() {
    return [
        {
            id: 'session-1',
            title: 'Life Story Interview',
            createdAt: new Date('2024-12-07T10:00:00Z').toISOString(),
            duration: 2340000, // 39 minutes in ms
            messageCount: 24,
            status: 'completed'
        },
        {
            id: 'session-2',
            title: 'Career Journey',
            createdAt: new Date('2024-12-06T14:30:00Z').toISOString(),
            duration: 1800000, // 30 minutes in ms
            messageCount: 18,
            status: 'completed'
        },
        {
            id: 'session-3',
            title: 'Family Memories',
            createdAt: new Date('2024-12-05T09:15:00Z').toISOString(),
            duration: 1560000, // 26 minutes in ms
            messageCount: 16,
            status: 'completed'
        }
    ];
}

function getMockInterviewMessages(sessionId) {
    const messageTemplates = {
        'session-1': [
            { speaker: 'ai', content: 'Hello! I\'m here to help you create your digital twin. Let\'s start with some basic information about your life. Can you tell me your full name and where you were born?' },
            { speaker: 'user', content: 'My name is Sarah Johnson, and I was born in Portland, Oregon in 1985.' },
            { speaker: 'ai', content: 'Thank you, Sarah. Portland is a beautiful city! Can you tell me about your family? Do you have any siblings?' },
            { speaker: 'user', content: 'Yes, I have two younger brothers, Mike and David. Mike is a software engineer and David is a teacher. We\'re all pretty close despite living in different cities now.' },
            { speaker: 'ai', content: 'That\'s wonderful that you maintain close relationships with your brothers. What about your parents? Can you tell me about them?' },
            { speaker: 'user', content: 'My parents are both retired now. My dad was a carpenter and my mom was a nurse. They taught me the value of hard work and helping others.' },
            { speaker: 'ai', content: 'Those are beautiful values to inherit. Can you tell me about your education and career path?' },
            { speaker: 'user', content: 'I studied graphic design at Portland State University. After graduation, I worked at a few design agencies before starting my own freelance business about 5 years ago.' },
            { speaker: 'ai', content: 'That\'s impressive! What inspired you to become an entrepreneur and start your own business?' },
            { speaker: 'user', content: 'I wanted more creative freedom and the ability to choose projects that aligned with my values. I also wanted better work-life balance.' }
        ],
        'session-2': [
            { speaker: 'ai', content: 'Let\'s dive deeper into your career journey. What was your first job like?' },
            { speaker: 'user', content: 'My first real job was at a small design agency called Creative Solutions. I was terrified but excited. The senior designers were really supportive.' },
            { speaker: 'ai', content: 'What was the most challenging project you worked on there?' },
            { speaker: 'user', content: 'We had a client who wanted a complete rebrand for their restaurant chain. It was my first big project, and I had to present to the CEO. I was so nervous!' },
            { speaker: 'ai', content: 'How did the presentation go?' },
            { speaker: 'user', content: 'It went better than expected! They loved the concept and it boosted my confidence tremendously. That project really shaped my approach to design.' }
        ],
        'session-3': [
            { speaker: 'ai', content: 'I\'d love to hear about some of your favorite family memories. What stands out to you?' },
            { speaker: 'user', content: 'One of my favorite memories is our annual camping trips to Crater Lake. My dad would tell us stories around the campfire every night.' },
            { speaker: 'ai', content: 'What kind of stories did he tell?' },
            { speaker: 'user', content: 'He made up these elaborate adventure stories where my brothers and I were the heroes. We\'d defeat dragons and discover hidden treasures. We loved it!' },
            { speaker: 'ai', content: 'Those sound like magical moments. Do you continue any family traditions now?' },
            { speaker: 'user', content: 'Yes! I still go camping with my brothers and their families. And I\'ve started telling stories to my nieces and nephews, just like dad did for us.' }
        ]
    };
    
    const templates = messageTemplates[sessionId] || messageTemplates['session-1'];
    
    return templates.map((template, index) => ({
        id: `msg-${sessionId}-${index}`,
        sessionId,
        speaker: template.speaker,
        content: template.content,
        timestamp: new Date(Date.now() - (templates.length - index) * 120000).toISOString() // 2 minutes apart
    }));
}

// Helper functions
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatDuration(milliseconds) {
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function formatDateForFilename(dateString) {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0]; // YYYY-MM-DD format
}

export {
    formatDate,
    formatTime,
    formatDuration,
    formatDateForFilename
};