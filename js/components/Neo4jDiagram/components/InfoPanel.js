/**
 * Info Panel Component
 * Right-side panel (30% width) showing operation history and node details
 * Per specification requirements
 */

import React from 'react';
import { visualConfig } from '../config/visualConfig';

const InfoPanel = ({ 
  operations = [], 
  selectedNode = null, 
  hoveredNode = null,
  onOperationClick,
  onClearSelection
}) => {
  // Format timestamp for display
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // Get the last 5-6 operations for active queue
  const activeQueue = operations.slice(-6);
  
  return (
    <div style={{
      width: '30%',
      height: '100%',
      backgroundColor: '#FAFAFA',
      borderLeft: '1px solid #E0E0E0',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: visualConfig.nodes.fontFamily,
      fontSize: '14px'
    }}>
      {/* Header */}
      <div style={{
        padding: '20px',
        borderBottom: '1px solid #E0E0E0',
        backgroundColor: '#FFFFFF'
      }}>
        <h2 style={{ 
          margin: 0, 
          fontSize: '18px', 
          fontWeight: 600,
          color: '#2C3E50'
        }}>
          Interview Validation
        </h2>
      </div>

      {/* Active Queue Section */}
      <div style={{
        padding: '20px',
        borderBottom: '1px solid #E0E0E0',
        backgroundColor: '#FFFFFF',
        minHeight: '200px'
      }}>
        <h3 style={{ 
          margin: '0 0 15px 0', 
          fontSize: '14px', 
          fontWeight: 600,
          color: '#666',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          Active Queue
        </h3>
        
        {activeQueue.length === 0 ? (
          <p style={{ color: '#999', fontStyle: 'italic', fontSize: '13px' }}>
            No recent operations. New additions will appear here.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {activeQueue.map((op, index) => (
              <div
                key={op.id || index}
                onClick={() => onOperationClick && onOperationClick(op)}
                style={{
                  padding: '10px',
                  backgroundColor: op.highlight ? '#FFF3CD' : '#F8F9FA',
                  border: `1px solid ${op.highlight ? '#FFE69C' : '#E9ECEF'}`,
                  borderRadius: '4px',
                  cursor: 'pointer',
                  transition: 'all 200ms ease',
                  ':hover': {
                    backgroundColor: '#E9ECEF'
                  }
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#E9ECEF';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = op.highlight ? '#FFF3CD' : '#F8F9FA';
                }}
              >
                <div style={{ 
                  fontSize: '12px', 
                  color: '#6C757D',
                  marginBottom: '4px'
                }}>
                  [{formatTimestamp(op.timestamp)}] {op.type}
                </div>
                <div style={{ 
                  fontSize: '13px', 
                  color: '#2C3E50',
                  fontWeight: 500
                }}>
                  {op.itemName}
                </div>
                {op.details && (
                  <div style={{ 
                    fontSize: '12px', 
                    color: '#6C757D',
                    marginTop: '4px'
                  }}>
                    {op.details}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Scrollable History Section */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '20px',
        backgroundColor: '#FAFAFA'
      }}>
        <h3 style={{ 
          margin: '0 0 15px 0', 
          fontSize: '14px', 
          fontWeight: 600,
          color: '#666',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          Complete History
        </h3>
        
        {operations.length === 0 ? (
          <p style={{ color: '#999', fontStyle: 'italic', fontSize: '13px' }}>
            All operations during this session will be logged here.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {operations.map((op, index) => (
              <div
                key={op.id || index}
                onClick={() => onOperationClick && onOperationClick(op)}
                style={{
                  padding: '8px',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E9ECEF',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  transition: 'all 200ms ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#F8F9FA';
                  e.currentTarget.style.borderColor = '#DEE2E6';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#FFFFFF';
                  e.currentTarget.style.borderColor = '#E9ECEF';
                }}
              >
                <span style={{ color: '#6C757D' }}>
                  [{formatTimestamp(op.timestamp)}]
                </span>{' '}
                <span style={{ 
                  color: op.type === 'ERROR' ? '#DC3545' : '#28A745',
                  fontWeight: 500
                }}>
                  {op.type}:
                </span>{' '}
                <span style={{ color: '#2C3E50' }}>
                  {op.itemName}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Node Details (if selected) */}
      {(selectedNode || hoveredNode) && (
        <div style={{
          padding: '20px',
          borderTop: '1px solid #E0E0E0',
          backgroundColor: '#FFFFFF',
          maxHeight: '200px'
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '10px'
          }}>
            <h3 style={{ 
              margin: 0, 
              fontSize: '14px', 
              fontWeight: 600,
              color: '#666'
            }}>
              {selectedNode ? 'Selected Node' : 'Hovered Node'}
            </h3>
            {selectedNode && onClearSelection && (
              <button
                onClick={onClearSelection}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '18px',
                  color: '#999',
                  cursor: 'pointer',
                  padding: '0',
                  lineHeight: 1
                }}
              >
                ×
              </button>
            )}
          </div>
          
          <div style={{ fontSize: '13px' }}>
            <div style={{ marginBottom: '8px' }}>
              <strong>Name:</strong> {(selectedNode || hoveredNode).name || (selectedNode || hoveredNode).id}
            </div>
            <div style={{ marginBottom: '8px' }}>
              <strong>Type:</strong> {(selectedNode || hoveredNode).type}
            </div>
            {(selectedNode || hoveredNode).properties && (
              <div>
                <strong>Properties:</strong>
                <div style={{ 
                  marginTop: '4px', 
                  paddingLeft: '10px',
                  fontSize: '12px',
                  color: '#666'
                }}>
                  {Object.entries((selectedNode || hoveredNode).properties).map(([key, value]) => (
                    <div key={key}>
                      {key}: {String(value)}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default InfoPanel;