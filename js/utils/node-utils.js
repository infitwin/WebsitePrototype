/**
 * Node utility functions for consistent node type handling
 */

/**
 * Get icon for node type
 * @param {string} type - The node type
 * @returns {string} Emoji icon for the node type
 */
export function getNodeTypeIcon(type) {
    const icons = {
        person: '👤',
        organization: '🏢',
        location: '📍',
        event: '📅',
        thing: '📦',
        default: '⚪'
    };
    return icons[type] || icons.default;
}

/**
 * Get color for node type
 * @param {string} type - The node type
 * @returns {string} Hex color code for the node type
 */
export function getNodeColor(type) {
    const colors = {
        person: '#9C88FF',
        organization: '#FF9F7F', 
        location: '#74B9FF',
        event: '#FF7675',
        thing: '#6BCF7F',
        default: '#9CA3AF'
    };
    return colors[type] || colors.default;
}