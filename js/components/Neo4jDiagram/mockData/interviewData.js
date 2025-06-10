/**
 * Full interview mock data for Phase 2-4 testing
 * 17 nodes with various types representing a complete interview
 */

export const fullInterviewData = {
  nodes: [
    // Central person
    {
      id: 'interviewee',
      name: 'John Doe',
      type: 'central',
      label: 'Interviewee'
    },
    
    // Family members
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
    
    // Events
    {
      id: 'birth',
      name: 'Born in Chicago',
      type: 'event',
      date: '1945',
      label: 'Birth'
    },
    {
      id: 'graduation',
      name: 'College Graduation',
      type: 'event',
      date: '1967',
      label: 'Graduation'
    },
    {
      id: 'wedding',
      name: 'Wedding Day',
      type: 'event',
      date: '1970',
      label: 'Wedding'
    },
    
    // Memories
    {
      id: 'memory1',
      name: 'First Day of School',
      type: 'memory_challenge',
      label: 'Challenging Memory'
    },
    {
      id: 'memory2',
      name: 'Family Road Trip',
      type: 'memory_joy',
      label: 'Joyful Memory'
    },
    {
      id: 'memory3',
      name: 'First Job',
      type: 'memory',
      label: 'Memory'
    },
    
    // Places
    {
      id: 'chicago',
      name: 'Chicago, IL',
      type: 'place',
      label: 'City'
    },
    {
      id: 'university',
      name: 'University of Illinois',
      type: 'place',
      label: 'Education'
    },
    {
      id: 'home',
      name: 'Family Home',
      type: 'place',
      label: 'Home'
    },
    
    // Organizations
    {
      id: 'company',
      name: 'Tech Corp',
      type: 'organization',
      label: 'Employer'
    },
    
    // Time period
    {
      id: 'era',
      name: '1960s',
      type: 'time',
      label: 'Era'
    }
  ],
  
  edges: [
    // Family relationships
    {
      id: 'e1',
      source: 'interviewee',
      target: 'spouse',
      type: 'MARRIED_TO',
      label: 'Married'
    },
    {
      id: 'e2',
      source: 'interviewee',
      target: 'child1',
      type: 'PARENT_OF',
      label: 'Parent'
    },
    {
      id: 'e3',
      source: 'interviewee',
      target: 'child2',
      type: 'PARENT_OF',
      label: 'Parent'
    },
    {
      id: 'e4',
      source: 'mother',
      target: 'interviewee',
      type: 'PARENT_OF',
      label: 'Parent'
    },
    {
      id: 'e5',
      source: 'father',
      target: 'interviewee',
      type: 'PARENT_OF',
      label: 'Parent'
    },
    
    // Event relationships
    {
      id: 'e6',
      source: 'interviewee',
      target: 'birth',
      type: 'EXPERIENCED',
      label: 'Born'
    },
    {
      id: 'e7',
      source: 'interviewee',
      target: 'graduation',
      type: 'ACHIEVED',
      label: 'Graduated'
    },
    {
      id: 'e8',
      source: 'interviewee',
      target: 'wedding',
      type: 'CELEBRATED',
      label: 'Married'
    },
    {
      id: 'e9',
      source: 'spouse',
      target: 'wedding',
      type: 'CELEBRATED',
      label: 'Married'
    },
    
    // Memory relationships
    {
      id: 'e10',
      source: 'interviewee',
      target: 'memory1',
      type: 'REMEMBERS',
      label: 'Remembers'
    },
    {
      id: 'e11',
      source: 'interviewee',
      target: 'memory2',
      type: 'REMEMBERS',
      label: 'Remembers'
    },
    {
      id: 'e12',
      source: 'interviewee',
      target: 'memory3',
      type: 'REMEMBERS',
      label: 'Remembers'
    },
    
    // Place relationships
    {
      id: 'e13',
      source: 'birth',
      target: 'chicago',
      type: 'LOCATED_IN',
      label: 'In'
    },
    {
      id: 'e14',
      source: 'graduation',
      target: 'university',
      type: 'OCCURRED_AT',
      label: 'At'
    },
    {
      id: 'e15',
      source: 'memory2',
      target: 'home',
      type: 'HAPPENED_AT',
      label: 'At'
    },
    
    // Work relationship
    {
      id: 'e16',
      source: 'interviewee',
      target: 'company',
      type: 'WORKED_AT',
      label: 'Employed'
    },
    {
      id: 'e17',
      source: 'memory3',
      target: 'company',
      type: 'RELATED_TO',
      label: 'About'
    },
    
    // Time relationships
    {
      id: 'e18',
      source: 'graduation',
      target: 'era',
      type: 'DURING',
      label: 'During'
    },
    {
      id: 'e19',
      source: 'memory1',
      target: 'era',
      type: 'DURING',
      label: 'During'
    },
    
    // Additional family connections
    {
      id: 'e20',
      source: 'spouse',
      target: 'child1',
      type: 'PARENT_OF',
      label: 'Parent'
    },
    {
      id: 'e21',
      source: 'spouse',
      target: 'child2',
      type: 'PARENT_OF',
      label: 'Parent'
    }
  ]
};