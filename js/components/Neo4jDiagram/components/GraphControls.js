/**
 * Graph Control Buttons
 * Provides Center, Reset Zoom, Reset Layout, and Beautify controls
 */

import React from 'react';
import { visualConfig } from '../config/visualConfig';

const GraphControls = ({ onCenter, onResetZoom, onResetLayout, onBeautify, stickyMode, onToggleSticky }) => {
  const buttonStyle = {
    padding: '8px 16px',
    backgroundColor: '#fff',
    color: '#333',
    border: '1px solid #ddd',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '13px',
    fontFamily: visualConfig.nodes.fontFamily,
    transition: 'all 200ms ease',
    outline: 'none'
  };

  return (
    <div style={{
      position: 'absolute',
      bottom: '20px',
      left: '20px',
      display: 'flex',
      gap: '10px',
      zIndex: 10
    }}>
      <button
        onClick={onCenter}
        style={buttonStyle}
        onMouseEnter={(e) => {
          e.target.style.backgroundColor = '#f5f5f5';
          e.target.style.transform = 'translateY(-1px)';
          e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
        }}
        onMouseLeave={(e) => {
          e.target.style.backgroundColor = '#fff';
          e.target.style.transform = 'translateY(0)';
          e.target.style.boxShadow = 'none';
        }}
      >
        Center
      </button>
      
      <button
        onClick={onResetZoom}
        style={buttonStyle}
        onMouseEnter={(e) => {
          e.target.style.backgroundColor = '#f5f5f5';
          e.target.style.transform = 'translateY(-1px)';
          e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
        }}
        onMouseLeave={(e) => {
          e.target.style.backgroundColor = '#fff';
          e.target.style.transform = 'translateY(0)';
          e.target.style.boxShadow = 'none';
        }}
      >
        Reset Zoom
      </button>
      
      <button
        onClick={onResetLayout}
        style={buttonStyle}
        onMouseEnter={(e) => {
          e.target.style.backgroundColor = '#f5f5f5';
          e.target.style.transform = 'translateY(-1px)';
          e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
        }}
        onMouseLeave={(e) => {
          e.target.style.backgroundColor = '#fff';
          e.target.style.transform = 'translateY(0)';
          e.target.style.boxShadow = 'none';
        }}
      >
        Reset Layout
      </button>
      
      <button
        onClick={onBeautify}
        style={{
          ...buttonStyle,
          backgroundColor: '#9C88FF',
          color: '#fff',
          border: '1px solid #9C88FF'
        }}
        onMouseEnter={(e) => {
          e.target.style.backgroundColor = '#8A75FF';
          e.target.style.transform = 'translateY(-1px)';
          e.target.style.boxShadow = '0 2px 8px rgba(156,136,255,0.3)';
        }}
        onMouseLeave={(e) => {
          e.target.style.backgroundColor = '#9C88FF';
          e.target.style.transform = 'translateY(0)';
          e.target.style.boxShadow = 'none';
        }}
      >
        Beautify
      </button>
      
      {onToggleSticky && (
        <button
          onClick={onToggleSticky}
          style={{
            ...buttonStyle,
            backgroundColor: stickyMode ? '#FF6B6B' : '#fff',
            color: stickyMode ? '#fff' : '#333',
            border: `1px solid ${stickyMode ? '#FF6B6B' : '#ddd'}`
          }}
          title={stickyMode ? 'Sticky mode ON - nodes stay in place' : 'Sticky mode OFF - nodes move freely'}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = stickyMode ? '#FF5252' : '#f5f5f5';
            e.target.style.transform = 'translateY(-1px)';
            e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = stickyMode ? '#FF6B6B' : '#fff';
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = 'none';
          }}
        >
          {stickyMode ? '📌 Sticky ON' : '📌 Sticky OFF'}
        </button>
      )}
    </div>
  );
};

export default GraphControls;