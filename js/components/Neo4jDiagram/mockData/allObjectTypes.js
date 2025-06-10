/**
 * Comprehensive test data showcasing all object types
 * This dataset demonstrates the full range of node types and their visual representations
 */

export const allObjectTypesData = {
  nodes: [
    // Central node - The interviewee
    {
      id: 'interviewee',
      type: 'central',
      name: 'Sarah Chen',
      description: 'The person being interviewed',
      importance: 'primary'
    },
    
    // People nodes (showing initials)
    {
      id: 'spouse',
      type: 'person',
      name: 'Michael Chen',
      description: 'Husband, married 2018',
      importance: 'primary'
    },
    {
      id: 'mother',
      type: 'person', 
      name: 'Linda Johnson',
      description: 'Mother, lives in Seattle',
      importance: 'primary'
    },
    {
      id: 'father',
      type: 'person',
      name: 'Robert Johnson',
      description: 'Father, retired engineer',
      importance: 'primary'
    },
    {
      id: 'sibling',
      type: 'person',
      name: 'Emma Johnson',
      description: 'Younger sister',
      importance: 'secondary'
    },
    {
      id: 'bestfriend',
      type: 'person',
      name: 'Jessica Park',
      description: 'College roommate and best friend',
      importance: 'secondary'
    },
    
    // Family groups
    {
      id: 'inlaws',
      type: 'family',
      name: 'Chen Family',
      description: 'Husband\'s parents and siblings',
      icon: '👨‍👩‍👧‍👦'
    },
    
    // Organizations (showing building emoji)
    {
      id: 'workplace',
      type: 'organization',
      name: 'TechCorp Solutions',
      description: 'Current employer since 2019'
    },
    {
      id: 'university',
      type: 'organization',
      name: 'Stanford University',
      description: 'Alma mater, graduated 2016'
    },
    
    // Places (showing location pin)
    {
      id: 'hometown',
      type: 'place',
      name: 'Seattle, WA',
      description: 'Where she grew up'
    },
    {
      id: 'currentcity',
      type: 'place',
      name: 'San Francisco, CA',
      description: 'Current residence'
    },
    {
      id: 'vacationspot',
      type: 'place',
      name: 'Hawaii',
      description: 'Favorite vacation destination'
    },
    
    // Events (showing calendar emoji)
    {
      id: 'wedding',
      type: 'event',
      name: 'Wedding Day',
      description: 'Married Michael Chen',
      date: '2018-06-15'
    },
    {
      id: 'graduation',
      type: 'event',
      name: 'College Graduation',
      description: 'Stanford University',
      date: '2016-05-20'
    },
    {
      id: 'firstjob',
      type: 'event',
      name: 'First Job',
      description: 'Started at TechCorp',
      date: '2019-01-15'
    },
    
    // Education nodes (showing graduation cap)
    {
      id: 'masters',
      type: 'education',
      name: 'MBA Program',
      description: 'Currently pursuing MBA',
      icon: '🎓'
    },
    {
      id: 'highschool',
      type: 'education',
      name: 'Lincoln High School',
      description: 'Graduated 2012'
    },
    
    // Memories (showing camera or emotion emojis)
    {
      id: 'memory_happy',
      type: 'memory_joy',
      name: 'Birth of Nephew',
      description: 'Sister had her first child',
      icon: '👶'
    },
    {
      id: 'memory_challenge',
      type: 'memory_challenge',
      name: 'Career Change',
      description: 'Switched from finance to tech',
      icon: '💪'
    },
    {
      id: 'memory_travel',
      type: 'memory',
      name: 'Europe Backpacking',
      description: 'Summer after graduation',
      icon: '🎒'
    },
    
    // Time periods
    {
      id: 'childhood',
      type: 'time',
      name: 'Childhood Years',
      description: '1990-2008',
      icon: '🧸'
    },
    {
      id: 'college',
      type: 'time', 
      name: 'College Years',
      description: '2012-2016',
      icon: '📚'
    }
  ],
  
  edges: [
    // Family relationships
    { id: 'e1', from: 'interviewee', to: 'spouse', label: 'married to', type: 'family' },
    { id: 'e2', from: 'interviewee', to: 'mother', label: 'daughter of', type: 'family' },
    { id: 'e3', from: 'interviewee', to: 'father', label: 'daughter of', type: 'family' },
    { id: 'e4', from: 'interviewee', to: 'sibling', label: 'sister of', type: 'family' },
    { id: 'e5', from: 'spouse', to: 'inlaws', label: 'son of', type: 'family' },
    
    // Friendships
    { id: 'e6', from: 'interviewee', to: 'bestfriend', label: 'best friends', type: 'social' },
    { id: 'e7', from: 'bestfriend', to: 'university', label: 'met at', type: 'connection' },
    
    // Work relationships
    { id: 'e8', from: 'interviewee', to: 'workplace', label: 'works at', type: 'professional' },
    { id: 'e9', from: 'firstjob', to: 'workplace', label: 'started at', type: 'event' },
    
    // Education connections
    { id: 'e10', from: 'interviewee', to: 'university', label: 'graduated from', type: 'education' },
    { id: 'e11', from: 'interviewee', to: 'masters', label: 'pursuing', type: 'education' },
    { id: 'e12', from: 'interviewee', to: 'highschool', label: 'attended', type: 'education' },
    { id: 'e13', from: 'graduation', to: 'university', label: 'graduated from', type: 'event' },
    
    // Location connections
    { id: 'e14', from: 'interviewee', to: 'currentcity', label: 'lives in', type: 'location' },
    { id: 'e15', from: 'interviewee', to: 'hometown', label: 'from', type: 'location' },
    { id: 'e16', from: 'mother', to: 'hometown', label: 'lives in', type: 'location' },
    { id: 'e17', from: 'father', to: 'hometown', label: 'lives in', type: 'location' },
    { id: 'e18', from: 'wedding', to: 'vacationspot', label: 'honeymoon', type: 'travel' },
    
    // Event connections
    { id: 'e19', from: 'interviewee', to: 'wedding', label: 'milestone', type: 'event' },
    { id: 'e20', from: 'spouse', to: 'wedding', label: 'milestone', type: 'event' },
    { id: 'e21', from: 'interviewee', to: 'graduation', label: 'achievement', type: 'event' },
    
    // Memory connections
    { id: 'e22', from: 'interviewee', to: 'memory_happy', label: 'cherishes', type: 'emotional' },
    { id: 'e23', from: 'memory_happy', to: 'sibling', label: 'about', type: 'reference' },
    { id: 'e24', from: 'interviewee', to: 'memory_challenge', label: 'overcame', type: 'growth' },
    { id: 'e25', from: 'interviewee', to: 'memory_travel', label: 'experienced', type: 'adventure' },
    
    // Time period connections
    { id: 'e26', from: 'childhood', to: 'hometown', label: 'spent in', type: 'temporal' },
    { id: 'e27', from: 'college', to: 'university', label: 'period at', type: 'temporal' },
    { id: 'e28', from: 'highschool', to: 'childhood', label: 'during', type: 'temporal' },
    { id: 'e29', from: 'memory_travel', to: 'college', label: 'after', type: 'temporal' },
    
    // Cross-connections for richer visualization
    { id: 'e30', from: 'workplace', to: 'currentcity', label: 'located in', type: 'location' },
    { id: 'e31', from: 'masters', to: 'currentcity', label: 'studying in', type: 'location' },
    { id: 'e32', from: 'memory_challenge', to: 'workplace', label: 'led to', type: 'career' }
  ]
};