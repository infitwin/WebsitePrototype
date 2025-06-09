# Infitwin Component Library

## Architecture Overview

This component library is designed to **prevent duplicate implementations** by providing a single source of truth for all UI components. The architecture enforces consistency and makes it impossible to accidentally create duplicate controls.

## Component Structure

### Directory Organization
```
/js/components/
├── README.md                 # This file - component library documentation
├── core/                     # Core utility components
│   ├── base-component.js     # Base class all components extend
│   ├── event-manager.js      # Centralized event handling
│   └── validation.js         # Shared validation utilities
├── ui/                       # User interface components
│   ├── modal.js              # Modal/popup system
│   ├── button.js             # Button components
│   ├── form.js               # Form input components
│   ├── avatar.js             # Avatar system
│   ├── search.js             # Search components
│   └── filter.js             # Filter components
├── layout/                   # Layout components
│   ├── navigation.js         # Navigation system (already exists)
│   └── sidebar.js            # Sidebar layouts
└── utils/                    # Utility functions
    ├── dom-helpers.js        # DOM manipulation utilities
    └── style-helpers.js      # CSS class management
```

## Component Development Rules

### 1. ALL components MUST extend BaseComponent
This enforces consistent patterns and prevents ad-hoc implementations.

### 2. Component Registration System
All components are registered in a central registry to prevent duplicates.

### 3. Design System Integration
All components MUST use design system tokens from `/css/design-system.css`.

### 4. No Inline Styles
Components use CSS classes and design system tokens only.

### 5. Consistent API Patterns
All components follow the same initialization and configuration patterns.

## Usage Examples

### Creating a Modal (CORRECT WAY)
```javascript
import { Modal } from './components/ui/modal.js';

const modal = new Modal({
  title: 'Confirm Action',
  content: 'Are you sure you want to delete this item?',
  actions: [
    { text: 'Cancel', type: 'secondary' },
    { text: 'Delete', type: 'danger', action: () => deleteItem() }
  ]
});

modal.show();
```

### Creating a Button (CORRECT WAY)
```javascript
import { Button } from './components/ui/button.js';

const saveButton = new Button({
  text: 'Save Changes',
  type: 'primary',
  size: 'large',
  onClick: () => saveForm()
});

document.getElementById('button-container').appendChild(saveButton.element);
```

## PREVENTION MECHANISMS

### 1. Component Registry
- All components are registered automatically
- Duplicate registrations throw errors
- Easy to audit what components exist

### 2. Design System Enforcement
- Components that don't use design tokens fail validation
- Automated checks prevent hardcoded values

### 3. TypeScript Integration (Future)
- Type definitions prevent incorrect usage
- Compile-time checks for component APIs

### 4. Development Guidelines
- Clear documentation prevents confusion
- Examples show correct implementation patterns

## Migration Strategy

### Phase 1: Core Components (Current)
1. Modal system - replaces all popup variations
2. Button system - replaces all button variations
3. Form inputs - replaces all input variations

### Phase 2: Specialized Components
1. Avatar system - replaces all avatar variations
2. Search system - replaces all search variations
3. Filter system - replaces all filter variations

### Phase 3: Advanced Components
1. Data tables
2. Charts and visualizations
3. Complex form layouts

## Maintenance

### Adding New Components
1. Create component in appropriate directory
2. Extend BaseComponent
3. Register in component registry
4. Add documentation and examples
5. Update this README

### Updating Existing Components
1. Update component file
2. Update tests
3. Update documentation
4. Increment version if breaking changes

## Testing

All components include:
- Unit tests for functionality
- Visual regression tests
- Accessibility tests
- Cross-browser compatibility tests

This architecture ensures that once a component is created, it becomes the obvious choice for future use, preventing duplicate implementations.