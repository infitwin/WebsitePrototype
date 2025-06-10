/**
 * Custom node drawing for vis-network
 * Renders nodes with emojis or initials similar to our original design
 */

import { getNodeDisplayContent, getNodeColor } from './nodeHelpers';
import { visualConfig } from '../config/visualConfig';

/**
 * Create canvas with emoji or initials
 */
export const createNodeCanvas = (node, size) => {
  console.log(`Creating node canvas for ${node.id} with size ${size}`, node);
  
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const scale = 2; // For retina displays
  
  canvas.width = size * 2 * scale;
  canvas.height = size * 2 * scale;
  ctx.scale(scale, scale);
  
  const centerX = size;
  const centerY = size;
  const radius = size;
  
  // Get node color
  const bgColor = getNodeColor(node.type);
  
  // Draw circle background
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
  ctx.fillStyle = bgColor;
  ctx.fill();
  
  // Draw white border
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.lineWidth = visualConfig.nodes.borderWidth;
  ctx.stroke();
  
  // Get display content
  const display = getNodeDisplayContent(node);
  console.log(`Node ${node.id} display content:`, display);
  
  // Draw content (emoji or initials)
  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  if (display.type === 'emoji') {
    // Draw emoji - use system font for better emoji support
    ctx.font = `${size * 0.6}px -apple-system, BlinkMacSystemFont, "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif`;
    ctx.fillText(display.content, centerX, centerY);
  } else {
    // Draw initials
    ctx.font = `600 ${size * 0.5}px ${visualConfig.nodes.fontFamily}`;
    ctx.fillText(display.content.toUpperCase(), centerX, centerY);
  }
  
  const dataUrl = canvas.toDataURL();
  console.log(`Created data URL for ${node.id}: ${dataUrl.substring(0, 100)}...`);
  return dataUrl;
};

/**
 * Custom node shape for vis-network
 */
export const registerCustomNodeShape = (visNetwork) => {
  // Register a custom shape that uses our drawing
  visNetwork.Network.prototype.nodeShapes['customNode'] = {
    draw: function(ctx, x, y, state, selected, hover, values) {
      // This is called by vis-network to draw the node
      const size = values.size || 25;
      
      // Draw shadow if enabled
      if (values.shadow) {
        ctx.save();
        ctx.shadowColor = values.shadowColor || visualConfig.nodes.shadowColor;
        ctx.shadowBlur = hover ? visualConfig.nodes.hover.shadowBlur : values.shadowSize;
        ctx.shadowOffsetX = values.shadowX || 0;
        ctx.shadowOffsetY = hover ? visualConfig.nodes.hover.shadowOffsetY : values.shadowY;
      }
      
      // Draw circle
      ctx.beginPath();
      ctx.arc(x, y, size, 0, 2 * Math.PI);
      ctx.fillStyle = values.color || '#9C88FF';
      ctx.fill();
      
      // Reset shadow for border
      if (values.shadow) {
        ctx.restore();
      }
      
      // Draw border
      ctx.strokeStyle = hover ? 'rgba(255, 255, 255, 1)' : values.borderColor || 'rgba(255, 255, 255, 0.9)';
      ctx.lineWidth = selected ? values.borderWidthSelected : values.borderWidth;
      ctx.stroke();
      
      // Draw content if available
      if (values.nodeContent) {
        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        if (values.nodeContent.type === 'emoji') {
          ctx.font = `${size * 0.6}px ${visualConfig.nodes.fontFamily}`;
          ctx.fillText(values.nodeContent.content, x, y);
        } else {
          ctx.font = `600 ${size * 0.5}px ${visualConfig.nodes.fontFamily}`;
          ctx.fillText(values.nodeContent.content.toUpperCase(), x, y);
        }
      }
    },
    
    distanceToBorder: function(ctx, angle) {
      // Return the distance from center to border
      return this.size;
    },
    
    getBoundingBox: function(ctx, values) {
      const size = values.size || 25;
      return {
        left: values.x - size,
        right: values.x + size,
        top: values.y - size,
        bottom: values.y + size
      };
    }
  };
};