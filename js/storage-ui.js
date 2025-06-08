/**
 * Storage UI Components - Interactive visualizations using project color scheme
 */

import { 
    getStorageBreakdown, 
    getStorageHistory, 
    calculateDaysUntilFull,
    getStorageRecommendations,
    calculateStorageUsed,
    STORAGE_LIMIT 
} from './storage-service.js';

// Project color scheme
const COLORS = {
    primary: '#6B46C1',
    green: '#10B981',
    yellow: '#FFD700',
    blue: '#3B82F6',
    red: '#EF4444',
    textPrimary: '#374151',
    textSecondary: '#6B7280',
    border: '#E5E7EB',
    background: '#F3F4F6',
    white: '#FFFFFF'
};

// File type colors (variations of main theme)
const FILE_TYPE_COLORS = {
    images: '#3B82F6',      // Blue
    documents: '#10B981',   // Green
    spreadsheets: '#FFD700', // Yellow
    ebooks: '#6B46C1',      // Purple
    other: '#6B7280'        // Gray
};

/**
 * Create a donut chart for storage breakdown
 */
export function createStorageDonutChart(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `
        <div class="storage-donut-wrapper">
            <svg class="storage-donut" viewBox="0 0 200 200">
                <g class="donut-segments" transform="translate(100, 100)">
                    <!-- Segments will be added here -->
                </g>
                <text x="100" y="100" class="donut-center-text" text-anchor="middle">
                    <tspan class="donut-percentage" dy="-5">0%</tspan>
                    <tspan class="donut-label" x="100" dy="20">Used</tspan>
                </text>
            </svg>
            <div class="donut-legend">
                <!-- Legend items will be added here -->
            </div>
        </div>
        <style>
            .storage-donut-wrapper {
                display: flex;
                gap: 2rem;
                align-items: center;
            }
            .storage-donut {
                width: 200px;
                height: 200px;
            }
            .donut-segment {
                fill: transparent;
                stroke-width: 30;
                stroke-linecap: round;
                transition: all 0.3s ease;
                cursor: pointer;
            }
            .donut-segment:hover {
                opacity: 0.8;
                transform-origin: center;
            }
            .donut-center-text {
                fill: ${COLORS.textPrimary};
                font-family: 'Inter', sans-serif;
            }
            .donut-percentage {
                font-size: 32px;
                font-weight: 600;
            }
            .donut-label {
                font-size: 14px;
                fill: ${COLORS.textSecondary};
            }
            .donut-legend {
                display: flex;
                flex-direction: column;
                gap: 0.75rem;
            }
            .legend-item {
                display: flex;
                align-items: center;
                gap: 0.75rem;
                cursor: pointer;
                transition: opacity 0.2s ease;
            }
            .legend-item:hover {
                opacity: 0.8;
            }
            .legend-color {
                width: 12px;
                height: 12px;
                border-radius: 2px;
                flex-shrink: 0;
            }
            .legend-label {
                font-size: 14px;
                color: ${COLORS.textPrimary};
                flex: 1;
            }
            .legend-value {
                font-size: 12px;
                color: ${COLORS.textSecondary};
            }
        </style>
    `;

    updateDonutChart(container);
}

async function updateDonutChart(container) {
    try {
        const breakdown = await getStorageBreakdown();
        const totalUsed = await calculateStorageUsed();
        const percentage = Math.round((totalUsed / STORAGE_LIMIT) * 100);

        // Update center text
        container.querySelector('.donut-percentage').textContent = `${percentage}%`;

        // Calculate segments
        const segments = [];
        let currentAngle = -90; // Start at top

        Object.entries(breakdown).forEach(([type, data]) => {
            if (data.size > 0) {
                const angleSize = (data.size / totalUsed) * 360;
                segments.push({
                    type,
                    size: data.size,
                    count: data.count,
                    startAngle: currentAngle,
                    endAngle: currentAngle + angleSize,
                    color: FILE_TYPE_COLORS[type]
                });
                currentAngle += angleSize;
            }
        });

        // Draw segments
        const segmentsGroup = container.querySelector('.donut-segments');
        segmentsGroup.innerHTML = segments.map((segment, index) => {
            const radius = 70;
            const startAngleRad = (segment.startAngle * Math.PI) / 180;
            const endAngleRad = (segment.endAngle * Math.PI) / 180;
            
            const x1 = radius * Math.cos(startAngleRad);
            const y1 = radius * Math.sin(startAngleRad);
            const x2 = radius * Math.cos(endAngleRad);
            const y2 = radius * Math.sin(endAngleRad);
            
            const largeArc = segment.endAngle - segment.startAngle > 180 ? 1 : 0;
            
            const pathData = [
                `M ${x1} ${y1}`,
                `A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`
            ].join(' ');

            return `
                <path
                    class="donut-segment"
                    d="${pathData}"
                    stroke="${segment.color}"
                    data-type="${segment.type}"
                    style="animation: drawSegment 0.8s ease-out ${index * 0.1}s both;"
                />
            `;
        }).join('');

        // Update legend
        const legend = container.querySelector('.donut-legend');
        legend.innerHTML = segments.map(segment => `
            <div class="legend-item" data-type="${segment.type}">
                <div class="legend-color" style="background-color: ${segment.color}"></div>
                <span class="legend-label">${capitalizeFirst(segment.type)}</span>
                <span class="legend-value">${formatFileSize(segment.size)} (${segment.count})</span>
            </div>
        `).join('');

        // Add animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes drawSegment {
                from {
                    stroke-dasharray: 0 1000;
                }
                to {
                    stroke-dasharray: 440 1000;
                }
            }
        `;
        container.appendChild(style);

    } catch (error) {
        console.error('Error updating donut chart:', error);
        container.innerHTML = '<p style="color: ' + COLORS.textSecondary + '">Unable to load storage data</p>';
    }
}

/**
 * Create usage history chart
 */
export function createUsageHistoryChart(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `
        <div class="usage-chart-wrapper">
            <div class="chart-header">
                <h4 style="color: ${COLORS.textPrimary}; margin: 0;">Storage Trend</h4>
                <span class="trend-period" style="color: ${COLORS.textSecondary}; font-size: 14px;">Last 30 days</span>
            </div>
            <svg class="usage-chart" viewBox="0 0 600 200">
                <defs>
                    <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style="stop-color:${COLORS.blue};stop-opacity:0.3" />
                        <stop offset="100%" style="stop-color:${COLORS.blue};stop-opacity:0" />
                    </linearGradient>
                </defs>
                <g class="chart-grid">
                    <!-- Grid lines will be added here -->
                </g>
                <g class="chart-data">
                    <!-- Data line and area will be added here -->
                </g>
                <g class="chart-labels">
                    <!-- Labels will be added here -->
                </g>
            </svg>
            <div class="chart-footer">
                <div class="prediction" style="display: none;">
                    <span style="color: ${COLORS.textSecondary};">Predicted full in: </span>
                    <span class="days-until-full" style="color: ${COLORS.yellow}; font-weight: 600;"></span>
                </div>
            </div>
        </div>
        <style>
            .usage-chart-wrapper {
                background: ${COLORS.white};
                padding: 1.5rem;
                border-radius: 12px;
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            }
            .chart-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 1rem;
            }
            .usage-chart {
                width: 100%;
                height: 200px;
            }
            .grid-line {
                stroke: ${COLORS.border};
                stroke-width: 1;
                stroke-dasharray: 2, 2;
            }
            .data-line {
                fill: none;
                stroke: ${COLORS.blue};
                stroke-width: 2;
                stroke-linecap: round;
                stroke-linejoin: round;
            }
            .data-area {
                fill: url(#areaGradient);
            }
            .data-point {
                fill: ${COLORS.blue};
                stroke: ${COLORS.white};
                stroke-width: 2;
                cursor: pointer;
                transition: r 0.2s ease;
            }
            .data-point:hover {
                r: 6;
            }
            .axis-label {
                fill: ${COLORS.textSecondary};
                font-size: 12px;
                font-family: 'Inter', sans-serif;
            }
            .chart-footer {
                margin-top: 1rem;
                text-align: center;
            }
        </style>
    `;

    updateUsageChart(container);
}

async function updateUsageChart(container) {
    try {
        const history = await getStorageHistory();
        const daysUntilFull = await calculateDaysUntilFull();

        if (history.length === 0) {
            container.querySelector('.chart-data').innerHTML = 
                `<text x="300" y="100" text-anchor="middle" fill="${COLORS.textSecondary}">No usage data available</text>`;
            return;
        }

        // Chart dimensions
        const width = 600;
        const height = 200;
        const padding = { top: 20, right: 20, bottom: 40, left: 60 };
        const chartWidth = width - padding.left - padding.right;
        const chartHeight = height - padding.top - padding.bottom;

        // Calculate scales
        const maxUsage = Math.max(...history.map(d => d.usage));
        const yScale = chartHeight / (maxUsage * 1.1); // Add 10% padding
        const xScale = chartWidth / (history.length - 1);

        // Draw grid lines
        const gridGroup = container.querySelector('.chart-grid');
        const gridLines = 5;
        gridGroup.innerHTML = Array.from({ length: gridLines }, (_, i) => {
            const y = padding.top + (chartHeight / (gridLines - 1)) * i;
            return `<line class="grid-line" x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" />`;
        }).join('');

        // Create line and area paths
        const points = history.map((d, i) => ({
            x: padding.left + i * xScale,
            y: padding.top + chartHeight - (d.usage * yScale)
        }));

        const linePath = points
            .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
            .join(' ');

        const areaPath = [
            `M ${points[0].x} ${padding.top + chartHeight}`,
            ...points.map(p => `L ${p.x} ${p.y}`),
            `L ${points[points.length - 1].x} ${padding.top + chartHeight}`,
            'Z'
        ].join(' ');

        // Draw data
        const dataGroup = container.querySelector('.chart-data');
        dataGroup.innerHTML = `
            <path class="data-area" d="${areaPath}" opacity="0">
                <animate attributeName="opacity" from="0" to="1" dur="0.8s" fill="freeze" />
            </path>
            <path class="data-line" d="${linePath}" stroke-dasharray="${chartWidth * 2}" stroke-dashoffset="${chartWidth * 2}">
                <animate attributeName="stroke-dashoffset" from="${chartWidth * 2}" to="0" dur="1s" fill="freeze" />
            </path>
            ${points.map((p, i) => `
                <circle class="data-point" cx="${p.x}" cy="${p.y}" r="4" opacity="0">
                    <animate attributeName="opacity" from="0" to="1" dur="0.3s" begin="1s" fill="freeze" />
                    <title>${formatFileSize(history[i].usage)} on ${formatDate(history[i].date)}</title>
                </circle>
            `).join('')}
        `;

        // Add labels
        const labelsGroup = container.querySelector('.chart-labels');
        labelsGroup.innerHTML = `
            <!-- Y-axis labels -->
            ${Array.from({ length: gridLines }, (_, i) => {
                const value = maxUsage * 1.1 * (1 - i / (gridLines - 1));
                const y = padding.top + (chartHeight / (gridLines - 1)) * i;
                return `<text class="axis-label" x="${padding.left - 10}" y="${y + 4}" text-anchor="end">${formatFileSize(value)}</text>`;
            }).join('')}
            <!-- X-axis labels -->
            ${[0, Math.floor(history.length / 2), history.length - 1].map(i => {
                const x = padding.left + i * xScale;
                const date = new Date(history[i].date);
                const label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                return `<text class="axis-label" x="${x}" y="${height - 15}" text-anchor="middle">${label}</text>`;
            }).join('')}
        `;

        // Update prediction
        if (daysUntilFull !== null && daysUntilFull > 0) {
            const prediction = container.querySelector('.prediction');
            const daysText = container.querySelector('.days-until-full');
            prediction.style.display = 'block';
            daysText.textContent = `${daysUntilFull} days`;
        }

    } catch (error) {
        console.error('Error updating usage chart:', error);
    }
}

/**
 * Create storage recommendations panel
 */
export function createStorageRecommendations(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `
        <div class="recommendations-panel">
            <h3 style="color: ${COLORS.textPrimary}; margin: 0 0 1rem 0;">Storage Optimization</h3>
            <div class="recommendations-list">
                <div class="loading-recommendations">
                    <div class="spinner"></div>
                    <span>Analyzing your storage...</span>
                </div>
            </div>
        </div>
        <style>
            .recommendations-panel {
                background: ${COLORS.white};
                padding: 1.5rem;
                border-radius: 12px;
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            }
            .recommendations-list {
                display: flex;
                flex-direction: column;
                gap: 1rem;
            }
            .recommendation-item {
                display: flex;
                align-items: flex-start;
                gap: 1rem;
                padding: 1rem;
                background: ${COLORS.background};
                border-radius: 8px;
                border: 1px solid ${COLORS.border};
                transition: all 0.2s ease;
            }
            .recommendation-item:hover {
                border-color: ${COLORS.yellow};
                transform: translateY(-1px);
            }
            .recommendation-icon {
                font-size: 24px;
                flex-shrink: 0;
            }
            .recommendation-content {
                flex: 1;
            }
            .recommendation-title {
                font-weight: 600;
                color: ${COLORS.textPrimary};
                margin-bottom: 0.25rem;
            }
            .recommendation-desc {
                font-size: 14px;
                color: ${COLORS.textSecondary};
                margin-bottom: 0.5rem;
            }
            .recommendation-action {
                padding: 0.5rem 1rem;
                background: ${COLORS.yellow};
                color: ${COLORS.textPrimary};
                border: none;
                border-radius: 6px;
                font-size: 14px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s ease;
            }
            .recommendation-action:hover {
                background: #FFC107;
                transform: translateY(-1px);
            }
            .loading-recommendations {
                display: flex;
                align-items: center;
                gap: 1rem;
                color: ${COLORS.textSecondary};
                padding: 2rem;
                justify-content: center;
            }
            .spinner {
                width: 20px;
                height: 20px;
                border: 2px solid ${COLORS.border};
                border-top-color: ${COLORS.primary};
                border-radius: 50%;
                animation: spin 1s linear infinite;
            }
            @keyframes spin {
                to { transform: rotate(360deg); }
            }
        </style>
    `;

    updateRecommendations(container);
}

async function updateRecommendations(container) {
    try {
        const recommendations = await getStorageRecommendations();
        const listContainer = container.querySelector('.recommendations-list');

        if (recommendations.length === 0) {
            listContainer.innerHTML = `
                <div style="text-align: center; padding: 2rem; color: ${COLORS.textSecondary};">
                    <div style="font-size: 48px; margin-bottom: 1rem;">✨</div>
                    <p>Your storage is well optimized!</p>
                </div>
            `;
            return;
        }

        listContainer.innerHTML = recommendations.map(rec => {
            const icons = {
                large_files: '📦',
                old_files: '📅',
                duplicates: '🔁'
            };

            return `
                <div class="recommendation-item">
                    <div class="recommendation-icon">${icons[rec.type] || '💡'}</div>
                    <div class="recommendation-content">
                        <div class="recommendation-title">${rec.title}</div>
                        <div class="recommendation-desc">${rec.description}</div>
                        <button class="recommendation-action" data-action="${rec.action}">
                            ${rec.action === 'review' ? 'Review Files' :
                              rec.action === 'archive' ? 'Archive Now' :
                              rec.action === 'deduplicate' ? 'Find Duplicates' : 'Optimize'}
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        // Add click handlers
        listContainer.querySelectorAll('.recommendation-action').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.target.dataset.action;
                handleRecommendationAction(action);
            });
        });

    } catch (error) {
        console.error('Error loading recommendations:', error);
        const listContainer = container.querySelector('.recommendations-list');
        listContainer.innerHTML = `<p style="color: ${COLORS.textSecondary};">Unable to load recommendations</p>`;
    }
}

function handleRecommendationAction(action) {
    // These would trigger actual optimization actions
    console.log('Recommendation action:', action);
    showNotification(`Starting ${action} process...`, 'info');
}

/**
 * Create storage meter widget for dashboard
 */
export function createStorageMeterWidget(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `
        <div class="storage-widget">
            <div class="widget-header">
                <div class="widget-icon">💾</div>
                <div class="widget-title">
                    <h4>Storage</h4>
                    <span class="widget-subtitle">Manage your files</span>
                </div>
            </div>
            <div class="storage-progress">
                <div class="progress-bar">
                    <div class="progress-fill" style="width: 0%"></div>
                </div>
                <div class="progress-text">
                    <span class="used-text">0 GB</span>
                    <span class="total-text">of 1 GB</span>
                </div>
            </div>
            <div class="widget-actions">
                <button class="widget-btn primary" onclick="window.location.href='file-browser.html'">
                    <span>📁</span> Browse Files
                </button>
                <button class="widget-btn secondary" onclick="window.location.href='storage-dashboard.html'">
                    <span>📊</span> View Details
                </button>
            </div>
        </div>
        <style>
            .storage-widget {
                background: ${COLORS.white};
                padding: 1.5rem;
                border-radius: 12px;
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            }
            .widget-header {
                display: flex;
                align-items: center;
                gap: 1rem;
                margin-bottom: 1.5rem;
            }
            .widget-icon {
                font-size: 32px;
            }
            .widget-title h4 {
                margin: 0;
                color: ${COLORS.textPrimary};
                font-size: 18px;
            }
            .widget-subtitle {
                color: ${COLORS.textSecondary};
                font-size: 14px;
            }
            .storage-progress {
                margin-bottom: 1.5rem;
            }
            .progress-bar {
                height: 12px;
                background: ${COLORS.border};
                border-radius: 6px;
                overflow: hidden;
                margin-bottom: 0.5rem;
            }
            .progress-fill {
                height: 100%;
                background: linear-gradient(90deg, ${COLORS.yellow} 0%, #FFC107 100%);
                transition: width 0.6s ease;
            }
            .progress-text {
                display: flex;
                justify-content: space-between;
                font-size: 14px;
            }
            .used-text {
                color: ${COLORS.textPrimary};
                font-weight: 600;
            }
            .total-text {
                color: ${COLORS.textSecondary};
            }
            .widget-actions {
                display: flex;
                gap: 0.75rem;
            }
            .widget-btn {
                flex: 1;
                padding: 0.75rem;
                border: none;
                border-radius: 8px;
                font-size: 14px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s ease;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 0.5rem;
            }
            .widget-btn.primary {
                background: ${COLORS.yellow};
                color: ${COLORS.textPrimary};
            }
            .widget-btn.primary:hover {
                background: #FFC107;
                transform: translateY(-1px);
            }
            .widget-btn.secondary {
                background: ${COLORS.background};
                color: ${COLORS.textPrimary};
                border: 1px solid ${COLORS.border};
            }
            .widget-btn.secondary:hover {
                background: ${COLORS.white};
                border-color: ${COLORS.yellow};
            }
        </style>
    `;

    updateStorageWidget(container);
}

async function updateStorageWidget(container) {
    try {
        const used = await calculateStorageUsed();
        const percentage = Math.round((used / STORAGE_LIMIT) * 100);
        
        container.querySelector('.progress-fill').style.width = `${percentage}%`;
        container.querySelector('.used-text').textContent = formatFileSize(used);
        container.querySelector('.total-text').textContent = `of ${formatFileSize(STORAGE_LIMIT)}`;
        
        // Add color change based on usage
        const progressFill = container.querySelector('.progress-fill');
        if (percentage > 90) {
            progressFill.style.background = `linear-gradient(90deg, ${COLORS.red} 0%, #DC2626 100%)`;
        } else if (percentage > 75) {
            progressFill.style.background = `linear-gradient(90deg, ${COLORS.yellow} 0%, #FFC107 100%)`;
        } else {
            progressFill.style.background = `linear-gradient(90deg, ${COLORS.green} 0%, #059669 100%)`;
        }
    } catch (error) {
        console.error('Error updating storage widget:', error);
    }
}

// Helper functions
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function showNotification(message, type = 'info') {
    // This would integrate with the notification system
    console.log(`[${type.toUpperCase()}] ${message}`);
}

// Export all functions
export {
    updateStorageWidget,
    updateRecommendations,
    updateUsageChart,
    updateDonutChart
};