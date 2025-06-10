/**
 * Simple two-node test data for Phase 1 initial testing
 * Minimal graph to verify vis-network setup
 */

export const simpleTwoNodeData = {
  nodes: [
    {
      id: 'interviewee',
      name: 'John Doe',
      type: 'central',
      label: 'Interviewee'
    },
    {
      id: 'spouse',
      name: 'Jane Doe',
      type: 'family',
      label: 'Spouse'
    }
  ],
  edges: [
    {
      id: 'edge1',
      source: 'interviewee',
      target: 'spouse',
      type: 'MARRIED_TO',
      label: 'Married To'
    }
  ]
};