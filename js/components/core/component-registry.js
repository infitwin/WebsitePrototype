/**
 * Component Registry - Prevents Duplicate Component Implementations
 * 
 * This registry tracks all component instances and types to prevent
 * accidental duplication and provide debugging capabilities.
 */

class ComponentRegistryManager {
  constructor() {
    // Map of component type -> Set of instances
    this.instances = new Map();
    
    // Map of component type -> constructor function
    this.types = new Map();
    
    // Track component creation statistics
    this.stats = {
      totalCreated: 0,
      createdByType: new Map(),
      activeInstances: 0
    };
    
    // Development mode warnings
    // Check if we're in development mode (process is not defined in browsers)
    this.isDevelopment = typeof process !== 'undefined' 
      ? process.env.NODE_ENV !== 'production'
      : window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  }
  
  /**
   * Register a component type
   * Prevents duplicate component type definitions
   */
  registerType(typeName, constructor) {
    if (this.types.has(typeName)) {
      const error = `Component type '${typeName}' is already registered. This prevents duplicate implementations.`;
      
      if (this.isDevelopment) {
        console.error(error);
        console.trace();
      }
      
      throw new Error(error);
    }
    
    this.types.set(typeName, constructor);
    this.instances.set(typeName, new Set());
    
    if (this.isDevelopment) {
      console.log(`✅ Registered component type: ${typeName}`);
    }
  }
  
  /**
   * Register a component instance
   * Tracks all active instances for debugging
   */
  register(typeName, instance) {
    if (!this.instances.has(typeName)) {
      this.instances.set(typeName, new Set());
    }
    
    this.instances.get(typeName).add(instance);
    
    // Update statistics
    this.stats.totalCreated++;
    this.stats.activeInstances++;
    
    if (!this.stats.createdByType.has(typeName)) {
      this.stats.createdByType.set(typeName, 0);
    }
    this.stats.createdByType.set(
      typeName, 
      this.stats.createdByType.get(typeName) + 1
    );
    
    if (this.isDevelopment) {
      console.log(`📦 Created ${typeName} instance (${instance.config.id})`);
    }
  }
  
  /**
   * Unregister a component instance
   * Called when component is destroyed
   */
  unregister(typeName, instance) {
    if (this.instances.has(typeName)) {
      this.instances.get(typeName).delete(instance);
      this.stats.activeInstances--;
      
      if (this.isDevelopment) {
        console.log(`🗑️ Destroyed ${typeName} instance (${instance.config.id})`);
      }
    }
  }
  
  /**
   * Get all instances of a specific component type
   */
  getInstances(typeName) {
    return Array.from(this.instances.get(typeName) || []);
  }
  
  /**
   * Get all registered component types
   */
  getTypes() {
    return Array.from(this.types.keys());
  }
  
  /**
   * Check if a component type is registered
   */
  hasType(typeName) {
    return this.types.has(typeName);
  }
  
  /**
   * Get component constructor by type name
   */
  getType(typeName) {
    return this.types.get(typeName);
  }
  
  /**
   * Development helper: Find components by criteria
   */
  findComponents(criteria = {}) {
    const results = [];
    
    this.instances.forEach((instanceSet, typeName) => {
      instanceSet.forEach(instance => {
        let matches = true;
        
        if (criteria.type && typeName !== criteria.type) {
          matches = false;
        }
        
        if (criteria.id && instance.config.id !== criteria.id) {
          matches = false;
        }
        
        if (criteria.className && !instance.hasClass(criteria.className)) {
          matches = false;
        }
        
        if (criteria.state) {
          Object.entries(criteria.state).forEach(([key, value]) => {
            if (instance.state[key] !== value) {
              matches = false;
            }
          });
        }
        
        if (matches) {
          results.push({
            type: typeName,
            instance: instance,
            id: instance.config.id
          });
        }
      });
    });
    
    return results;
  }
  
  /**
   * Development helper: Get registry statistics
   */
  getStats() {
    return {
      ...this.stats,
      typeBreakdown: Object.fromEntries(this.stats.createdByType),
      activeByType: Object.fromEntries(
        Array.from(this.instances.entries()).map(([type, instances]) => [
          type,
          instances.size
        ])
      )
    };
  }
  
  /**
   * Development helper: Detect potential issues
   */
  audit() {
    const issues = [];
    
    // Check for excessive instances of same type
    this.instances.forEach((instanceSet, typeName) => {
      if (instanceSet.size > 50) {
        issues.push({
          type: 'excessive_instances',
          componentType: typeName,
          count: instanceSet.size,
          message: `${typeName} has ${instanceSet.size} active instances. This might indicate a memory leak.`
        });
      }
    });
    
    // Check for components with similar IDs (potential duplicates)
    const allIds = new Map();
    this.instances.forEach((instanceSet, typeName) => {
      instanceSet.forEach(instance => {
        const id = instance.config.id;
        if (allIds.has(id)) {
          issues.push({
            type: 'duplicate_id',
            componentType: typeName,
            id: id,
            message: `Duplicate ID detected: ${id} used by multiple components`
          });
        } else {
          allIds.set(id, { type: typeName, instance });
        }
      });
    });
    
    return issues;
  }
  
  /**
   * Development helper: Print debug information
   */
  debug() {
    if (!this.isDevelopment) return;
    
    console.group('🔍 Component Registry Debug');
    console.log('Statistics:', this.getStats());
    console.log('Registered Types:', this.getTypes());
    console.log('Audit Issues:', this.audit());
    console.groupEnd();
  }
  
  /**
   * Clear all instances (for testing)
   */
  clear() {
    this.instances.clear();
    this.types.clear();
    this.stats = {
      totalCreated: 0,
      createdByType: new Map(),
      activeInstances: 0
    };
  }
}

// Export singleton instance
export const ComponentRegistry = new ComponentRegistryManager();

// Make registry available globally for debugging in development
if (typeof window !== 'undefined') {
  const isDevelopment = typeof process !== 'undefined' 
    ? process.env.NODE_ENV !== 'production'
    : window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  
  if (isDevelopment) {
    window.ComponentRegistry = ComponentRegistry;
  }
}