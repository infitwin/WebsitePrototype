/**
 * Simple family tree data for Phase 1 testing
 * 7 nodes representing a basic family structure
 */

export const familyTreeData = {
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
    },
    {
      id: 'child1',
      name: 'Sarah Doe',
      type: 'family',
      label: 'Daughter'
    },
    {
      id: 'child2',
      name: 'Michael Doe',
      type: 'family',
      label: 'Son'
    },
    {
      id: 'mother',
      name: 'Mary Smith',
      type: 'family',
      label: 'Mother'
    },
    {
      id: 'father',
      name: 'Robert Smith',
      type: 'family',
      label: 'Father'
    },
    {
      id: 'birthplace',
      name: 'Chicago, IL',
      type: 'place',
      label: 'Birthplace'
    }
  ],
  edges: [
    {
      id: 'edge1',
      source: 'interviewee',
      target: 'spouse',
      type: 'MARRIED_TO',
      label: 'Married'
    },
    {
      id: 'edge2',
      source: 'interviewee',
      target: 'child1',
      type: 'PARENT_OF',
      label: 'Parent'
    },
    {
      id: 'edge3',
      source: 'interviewee',
      target: 'child2',
      type: 'PARENT_OF',
      label: 'Parent'
    },
    {
      id: 'edge4',
      source: 'spouse',
      target: 'child1',
      type: 'PARENT_OF',
      label: 'Parent'
    },
    {
      id: 'edge5',
      source: 'spouse',
      target: 'child2',
      type: 'PARENT_OF',
      label: 'Parent'
    },
    {
      id: 'edge6',
      source: 'mother',
      target: 'interviewee',
      type: 'PARENT_OF',
      label: 'Parent'
    },
    {
      id: 'edge7',
      source: 'father',
      target: 'interviewee',
      type: 'PARENT_OF',
      label: 'Parent'
    },
    {
      id: 'edge8',
      source: 'interviewee',
      target: 'birthplace',
      type: 'BORN_IN',
      label: 'Born In'
    }
  ]
};