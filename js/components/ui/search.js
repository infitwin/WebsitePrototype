/**
 * Unified Search Component System
 * 
 * SINGLE SOURCE OF TRUTH for all search functionality.
 * Replaces all existing search implementations to prevent duplication.
 * 
 * Usage:
 * import { Search, SearchWithFilters } from './components/ui/search.js';
 * 
 * const search = new Search({
 *   placeholder: 'Search...',
 *   onSearch: (query) => performSearch(query),
 *   suggestions: true,
 *   debounceTime: 300
 * });
 */

import { BaseComponent } from '../core/base-component.js';
import { ComponentRegistry } from '../core/component-registry.js';
import { FormInput } from './form.js';
import { Button } from './button.js';

export class Search extends BaseComponent {
  constructor(options = {}) {
    super({
      placeholder: 'Search...',
      value: '',
      size: 'medium', // small, medium, large
      variant: 'default', // default, filled, minimal
      icon: true, // Show search icon
      clearButton: true, // Show clear button when has value
      submitButton: false, // Show submit button
      searchOnEnter: true, // Trigger search on Enter key
      searchOnChange: true, // Trigger search on input change
      debounceTime: 300, // Debounce time in ms for searchOnChange
      minLength: 1, // Minimum characters before search
      maxLength: null, // Maximum search query length
      disabled: false,
      autofocus: false,
      suggestions: false, // Enable search suggestions
      suggestionsData: [], // Array of suggestions or function returning suggestions
      maxSuggestions: 5, // Maximum suggestions to show
      highlightMatches: true, // Highlight matching text in suggestions
      recentSearches: false, // Show recent searches
      maxRecentSearches: 5, // Maximum recent searches to store
      onSearch: null, // Search handler function
      onClear: null, // Clear handler function
      onFocus: null, // Focus handler function
      onBlur: null, // Blur handler function
      ...options
    });
    
    // Internal state
    this.searchTimeout = null;
    this.recentSearchesList = [];
    this.loadRecentSearches();
  }
  
  createElement() {
    return document.createElement('div');
  }
  
  init() {
    this.buildSearchStructure();
    this.setupEventListeners();
    this.updateClasses();
    
    // Set initial state
    this.setState({
      value: this.config.value,
      isFocused: false,
      isSearching: false,
      showSuggestions: false,
      suggestions: [],
      selectedSuggestionIndex: -1
    });
    
    // Set initial value if provided
    if (this.config.value) {
      this.setValue(this.config.value);
    }
  }
  
  buildSearchStructure() {
    // Clear existing content
    this.element.innerHTML = '';
    
    // Create search wrapper
    this.searchWrapper = this.createChildElement('div', 'infitwin-search__wrapper');
    
    // Add search icon if enabled
    if (this.config.icon) {
      this.iconElement = this.createChildElement('span', 'infitwin-search__icon');
      this.iconElement.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/>
          <path d="m21 21-4.35-4.35"/>
        </svg>
      `;
      this.searchWrapper.appendChild(this.iconElement);
    }
    
    // Create input using FormInput component for consistency
    this.inputWrapper = this.createChildElement('div', 'infitwin-search__input-wrapper');
    this.input = document.createElement('input');
    this.input.type = 'search';
    this.input.className = 'infitwin-search__input';
    this.input.placeholder = this.config.placeholder;
    this.input.disabled = this.config.disabled;
    this.input.autofocus = this.config.autofocus;
    
    if (this.config.maxLength) {
      this.input.maxLength = this.config.maxLength;
    }
    
    // Set ARIA attributes
    this.input.setAttribute('role', 'searchbox');
    this.input.setAttribute('aria-label', 'Search');
    this.input.setAttribute('autocomplete', 'off');
    this.input.setAttribute('spellcheck', 'false');
    
    this.inputWrapper.appendChild(this.input);
    this.searchWrapper.appendChild(this.inputWrapper);
    
    // Add clear button if enabled
    if (this.config.clearButton) {
      this.clearButton = this.createChildElement('button', 'infitwin-search__clear', {
        type: 'button',
        'aria-label': 'Clear search',
        tabindex: '-1'
      });
      this.clearButton.innerHTML = '×';
      this.clearButton.style.display = 'none';
      this.searchWrapper.appendChild(this.clearButton);
    }
    
    // Add submit button if enabled
    if (this.config.submitButton) {
      this.submitButton = Button.primary({
        text: 'Search',
        size: this.config.size,
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/>
          <path d="m21 21-4.35-4.35"/>
        </svg>`,
        onClick: () => this.performSearch()
      });
      this.submitButton.element.classList.add('infitwin-search__submit');
      this.searchWrapper.appendChild(this.submitButton.element);
    }
    
    this.element.appendChild(this.searchWrapper);
    
    // Create suggestions container if enabled
    if (this.config.suggestions || this.config.recentSearches) {
      this.suggestionsContainer = new SearchSuggestions({
        maxSuggestions: this.config.maxSuggestions,
        highlightMatches: this.config.highlightMatches,
        onSelect: (suggestion) => this.selectSuggestion(suggestion)
      });
      this.element.appendChild(this.suggestionsContainer.element);
    }
  }
  
  updateClasses() {
    // Remove existing modifier classes
    this.element.className = this.getClassName();
    
    // Add size class
    this.element.classList.add(`infitwin-search--${this.config.size}`);
    
    // Add variant class
    this.element.classList.add(`infitwin-search--${this.config.variant}`);
    
    // Add state classes
    if (this.state.isFocused) {
      this.element.classList.add('infitwin-search--focused');
    }
    
    if (this.state.isSearching) {
      this.element.classList.add('infitwin-search--searching');
    }
    
    if (this.state.value) {
      this.element.classList.add('infitwin-search--has-value');
    }
    
    if (this.config.disabled) {
      this.element.classList.add('infitwin-search--disabled');
    }
  }
  
  setupEventListeners() {
    // Input events
    this.input.addEventListener('input', (e) => {
      this.handleInput(e.target.value);
    });
    
    this.input.addEventListener('focus', () => {
      this.setState({ isFocused: true });
      this.updateClasses();
      this.showRecentOrSuggestions();
      
      if (this.config.onFocus) {
        this.config.onFocus();
      }
    });
    
    this.input.addEventListener('blur', () => {
      // Delay to allow clicking on suggestions
      setTimeout(() => {
        this.setState({ isFocused: false, showSuggestions: false });
        this.updateClasses();
        this.hideSuggestions();
        
        if (this.config.onBlur) {
          this.config.onBlur();
        }
      }, 200);
    });
    
    // Keyboard navigation
    this.input.addEventListener('keydown', (e) => {
      this.handleKeyDown(e);
    });
    
    // Clear button
    if (this.clearButton) {
      this.clearButton.addEventListener('click', () => {
        this.clear();
        this.input.focus();
      });
    }
    
    // Form submission prevention
    this.input.addEventListener('search', (e) => {
      e.preventDefault();
      if (this.config.searchOnEnter) {
        this.performSearch();
      }
    });
  }
  
  handleInput(value) {
    this.setState({ value });
    this.updateClasses();
    
    // Toggle clear button visibility
    if (this.clearButton) {
      this.clearButton.style.display = value ? 'flex' : 'none';
    }
    
    // Handle search on change with debounce
    if (this.config.searchOnChange && value.length >= this.config.minLength) {
      clearTimeout(this.searchTimeout);
      this.searchTimeout = setTimeout(() => {
        this.performSearch();
      }, this.config.debounceTime);
    }
    
    // Update suggestions
    if (this.config.suggestions) {
      this.updateSuggestions(value);
    }
  }
  
  handleKeyDown(e) {
    switch (e.key) {
      case 'Enter':
        e.preventDefault();
        if (this.state.selectedSuggestionIndex >= 0 && this.state.showSuggestions) {
          const suggestion = this.state.suggestions[this.state.selectedSuggestionIndex];
          this.selectSuggestion(suggestion);
        } else if (this.config.searchOnEnter) {
          this.performSearch();
        }
        break;
        
      case 'ArrowDown':
        e.preventDefault();
        this.navigateSuggestions(1);
        break;
        
      case 'ArrowUp':
        e.preventDefault();
        this.navigateSuggestions(-1);
        break;
        
      case 'Escape':
        this.hideSuggestions();
        this.input.blur();
        break;
    }
  }
  
  navigateSuggestions(direction) {
    if (!this.state.showSuggestions || this.state.suggestions.length === 0) return;
    
    const currentIndex = this.state.selectedSuggestionIndex;
    const maxIndex = this.state.suggestions.length - 1;
    let newIndex = currentIndex + direction;
    
    // Wrap around
    if (newIndex < 0) newIndex = maxIndex;
    if (newIndex > maxIndex) newIndex = 0;
    
    this.setState({ selectedSuggestionIndex: newIndex });
    
    if (this.suggestionsContainer) {
      this.suggestionsContainer.setSelectedIndex(newIndex);
    }
  }
  
  async updateSuggestions(query) {
    if (!query || query.length < this.config.minLength) {
      this.hideSuggestions();
      return;
    }
    
    let suggestions = [];
    
    // Get suggestions from data source
    if (typeof this.config.suggestionsData === 'function') {
      try {
        suggestions = await this.config.suggestionsData(query);
      } catch (error) {
        console.error('Error fetching suggestions:', error);
      }
    } else if (Array.isArray(this.config.suggestionsData)) {
      // Filter static suggestions
      suggestions = this.config.suggestionsData.filter(item => {
        const text = typeof item === 'string' ? item : item.text || item.label || item.value;
        return text.toLowerCase().includes(query.toLowerCase());
      });
    }
    
    // Limit suggestions
    suggestions = suggestions.slice(0, this.config.maxSuggestions);
    
    this.setState({ 
      suggestions,
      showSuggestions: suggestions.length > 0,
      selectedSuggestionIndex: -1
    });
    
    if (this.suggestionsContainer) {
      this.suggestionsContainer.setSuggestions(suggestions, query);
      this.suggestionsContainer.show();
    }
  }
  
  showRecentOrSuggestions() {
    if (this.config.recentSearches && !this.state.value && this.recentSearchesList.length > 0) {
      const recentSuggestions = this.recentSearchesList.map(search => ({
        text: search,
        type: 'recent'
      }));
      
      this.setState({ 
        suggestions: recentSuggestions,
        showSuggestions: true,
        selectedSuggestionIndex: -1
      });
      
      if (this.suggestionsContainer) {
        this.suggestionsContainer.setSuggestions(recentSuggestions, '');
        this.suggestionsContainer.show();
      }
    } else if (this.state.value) {
      this.updateSuggestions(this.state.value);
    }
  }
  
  hideSuggestions() {
    this.setState({ showSuggestions: false, selectedSuggestionIndex: -1 });
    if (this.suggestionsContainer) {
      this.suggestionsContainer.hide();
    }
  }
  
  selectSuggestion(suggestion) {
    const value = typeof suggestion === 'string' ? suggestion : suggestion.text || suggestion.value;
    this.setValue(value);
    this.hideSuggestions();
    this.performSearch();
  }
  
  performSearch() {
    const query = this.state.value.trim();
    
    if (query.length < this.config.minLength) {
      return;
    }
    
    // Add to recent searches
    if (this.config.recentSearches) {
      this.addToRecentSearches(query);
    }
    
    // Clear debounce timeout
    clearTimeout(this.searchTimeout);
    
    // Set searching state
    this.setState({ isSearching: true });
    this.updateClasses();
    
    // Call search handler
    if (this.config.onSearch) {
      const result = this.config.onSearch(query);
      
      // Handle promise results
      if (result && typeof result.then === 'function') {
        result
          .then(() => {
            this.setState({ isSearching: false });
            this.updateClasses();
          })
          .catch((error) => {
            console.error('Search error:', error);
            this.setState({ isSearching: false });
            this.updateClasses();
          });
      } else {
        // Synchronous search
        this.setState({ isSearching: false });
        this.updateClasses();
      }
    }
    
    // Emit search event
    this.element.dispatchEvent(new CustomEvent('search:perform', {
      detail: { query, search: this }
    }));
  }
  
  addToRecentSearches(query) {
    // Remove if already exists
    this.recentSearchesList = this.recentSearchesList.filter(q => q !== query);
    
    // Add to beginning
    this.recentSearchesList.unshift(query);
    
    // Limit to max
    this.recentSearchesList = this.recentSearchesList.slice(0, this.config.maxRecentSearches);
    
    // Save to localStorage
    this.saveRecentSearches();
  }
  
  loadRecentSearches() {
    if (!this.config.recentSearches) return;
    
    try {
      const stored = localStorage.getItem('infitwin-recent-searches');
      if (stored) {
        this.recentSearchesList = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading recent searches:', error);
    }
  }
  
  saveRecentSearches() {
    if (!this.config.recentSearches) return;
    
    try {
      localStorage.setItem('infitwin-recent-searches', JSON.stringify(this.recentSearchesList));
    } catch (error) {
      console.error('Error saving recent searches:', error);
    }
  }
  
  clearRecentSearches() {
    this.recentSearchesList = [];
    this.saveRecentSearches();
  }
  
  // Public methods
  setValue(value) {
    this.input.value = value;
    this.handleInput(value);
  }
  
  getValue() {
    return this.state.value;
  }
  
  clear() {
    this.setValue('');
    this.hideSuggestions();
    
    if (this.config.onClear) {
      this.config.onClear();
    }
    
    this.element.dispatchEvent(new CustomEvent('search:clear', {
      detail: { search: this }
    }));
  }
  
  focus() {
    this.input.focus();
  }
  
  blur() {
    this.input.blur();
  }
  
  setDisabled(disabled) {
    this.config.disabled = disabled;
    this.input.disabled = disabled;
    this.updateClasses();
  }
}

/**
 * Search Suggestions Component
 */
export class SearchSuggestions extends BaseComponent {
  constructor(options = {}) {
    super({
      maxSuggestions: 5,
      highlightMatches: true,
      onSelect: null,
      ...options
    });
    
    this.suggestions = [];
    this.selectedIndex = -1;
  }
  
  createElement() {
    const element = document.createElement('div');
    element.setAttribute('role', 'listbox');
    element.setAttribute('aria-label', 'Search suggestions');
    return element;
  }
  
  init() {
    this.element.classList.add('infitwin-search-suggestions');
    this.hide();
  }
  
  setSuggestions(suggestions, query = '') {
    this.suggestions = suggestions;
    this.selectedIndex = -1;
    this.render(query);
  }
  
  render(query) {
    this.element.innerHTML = '';
    
    this.suggestions.forEach((suggestion, index) => {
      const item = this.createChildElement('div', 'infitwin-search-suggestions__item', {
        role: 'option',
        'aria-selected': index === this.selectedIndex ? 'true' : 'false'
      });
      
      // Add type class if available
      if (suggestion.type) {
        item.classList.add(`infitwin-search-suggestions__item--${suggestion.type}`);
      }
      
      // Create content
      const text = typeof suggestion === 'string' ? suggestion : suggestion.text || suggestion.label || suggestion.value;
      
      if (this.config.highlightMatches && query) {
        item.innerHTML = this.highlightText(text, query);
      } else {
        item.textContent = text;
      }
      
      // Add icon if provided
      if (suggestion.icon) {
        const icon = this.createChildElement('span', 'infitwin-search-suggestions__icon');
        icon.innerHTML = suggestion.icon;
        item.insertBefore(icon, item.firstChild);
      }
      
      // Add metadata if provided
      if (suggestion.meta) {
        const meta = this.createChildElement('span', 'infitwin-search-suggestions__meta');
        meta.textContent = suggestion.meta;
        item.appendChild(meta);
      }
      
      // Click handler
      item.addEventListener('click', () => {
        if (this.config.onSelect) {
          this.config.onSelect(suggestion);
        }
      });
      
      this.element.appendChild(item);
    });
  }
  
  highlightText(text, query) {
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }
  
  setSelectedIndex(index) {
    this.selectedIndex = index;
    
    // Update ARIA attributes
    const items = this.element.querySelectorAll('.infitwin-search-suggestions__item');
    items.forEach((item, i) => {
      item.setAttribute('aria-selected', i === index ? 'true' : 'false');
      if (i === index) {
        item.classList.add('infitwin-search-suggestions__item--selected');
        item.scrollIntoView({ block: 'nearest' });
      } else {
        item.classList.remove('infitwin-search-suggestions__item--selected');
      }
    });
  }
  
  show() {
    this.element.classList.add('show');
  }
  
  hide() {
    this.element.classList.remove('show');
  }
}

/**
 * Search with Filters Component
 */
export class SearchWithFilters extends BaseComponent {
  constructor(options = {}) {
    super({
      searchConfig: {}, // Config for Search component
      filters: [], // Array of filter configurations
      layout: 'horizontal', // horizontal, vertical
      showFilterCount: true, // Show active filter count
      onFilter: null, // Filter change handler
      ...options
    });
    
    this.activeFilters = new Map();
  }
  
  createElement() {
    return document.createElement('div');
  }
  
  init() {
    this.element.classList.add('infitwin-search-with-filters');
    this.element.classList.add(`infitwin-search-with-filters--${this.config.layout}`);
    
    this.buildStructure();
  }
  
  buildStructure() {
    // Create search component
    this.searchComponent = new Search({
      ...this.config.searchConfig,
      onSearch: (query) => this.handleSearch(query)
    });
    this.element.appendChild(this.searchComponent.element);
    
    // Create filters container
    this.filtersContainer = this.createChildElement('div', 'infitwin-search-filters');
    
    // Add filter count badge
    if (this.config.showFilterCount) {
      this.filterCount = this.createChildElement('span', 'infitwin-search-filters__count');
      this.filterCount.style.display = 'none';
      this.filtersContainer.appendChild(this.filterCount);
    }
    
    // Create filter buttons
    this.config.filters.forEach(filterConfig => {
      const filterButton = Button.secondary({
        text: filterConfig.label,
        size: 'small',
        icon: filterConfig.icon,
        onClick: () => this.toggleFilter(filterConfig)
      });
      
      filterButton.element.classList.add('infitwin-search-filters__button');
      filterButton.element.setAttribute('data-filter-key', filterConfig.key);
      
      this.filtersContainer.appendChild(filterButton.element);
    });
    
    // Add clear filters button
    this.clearFiltersButton = Button.tertiary({
      text: 'Clear filters',
      size: 'small',
      onClick: () => this.clearFilters()
    });
    this.clearFiltersButton.element.classList.add('infitwin-search-filters__clear');
    this.clearFiltersButton.element.style.display = 'none';
    this.filtersContainer.appendChild(this.clearFiltersButton.element);
    
    this.element.appendChild(this.filtersContainer);
  }
  
  toggleFilter(filterConfig) {
    if (this.activeFilters.has(filterConfig.key)) {
      this.activeFilters.delete(filterConfig.key);
    } else {
      this.activeFilters.set(filterConfig.key, filterConfig);
    }
    
    this.updateFilterUI();
    this.applyFilters();
  }
  
  updateFilterUI() {
    // Update filter buttons
    this.config.filters.forEach(filterConfig => {
      const button = this.filtersContainer.querySelector(`[data-filter-key="${filterConfig.key}"]`);
      if (button) {
        if (this.activeFilters.has(filterConfig.key)) {
          button.classList.add('infitwin-search-filters__button--active');
        } else {
          button.classList.remove('infitwin-search-filters__button--active');
        }
      }
    });
    
    // Update filter count
    const count = this.activeFilters.size;
    if (this.filterCount) {
      if (count > 0) {
        this.filterCount.textContent = count.toString();
        this.filterCount.style.display = 'inline-flex';
      } else {
        this.filterCount.style.display = 'none';
      }
    }
    
    // Show/hide clear button
    if (this.clearFiltersButton) {
      this.clearFiltersButton.element.style.display = count > 0 ? 'inline-flex' : 'none';
    }
  }
  
  applyFilters() {
    const filters = Array.from(this.activeFilters.values());
    const query = this.searchComponent.getValue();
    
    if (this.config.onFilter) {
      this.config.onFilter({
        query,
        filters,
        activeFilterKeys: Array.from(this.activeFilters.keys())
      });
    }
    
    this.element.dispatchEvent(new CustomEvent('search:filter', {
      detail: { query, filters }
    }));
  }
  
  handleSearch(query) {
    this.applyFilters();
  }
  
  clearFilters() {
    this.activeFilters.clear();
    this.updateFilterUI();
    this.applyFilters();
  }
  
  // Public methods
  setFilter(key, active) {
    const filterConfig = this.config.filters.find(f => f.key === key);
    if (filterConfig) {
      if (active) {
        this.activeFilters.set(key, filterConfig);
      } else {
        this.activeFilters.delete(key);
      }
      this.updateFilterUI();
      this.applyFilters();
    }
  }
  
  getActiveFilters() {
    return Array.from(this.activeFilters.values());
  }
  
  search(query) {
    this.searchComponent.setValue(query);
    this.searchComponent.performSearch();
  }
}

// Export convenience functions
export function createSearch(options) {
  return new Search(options);
}

export function createSearchWithFilters(options) {
  return new SearchWithFilters(options);
}

// Register component types to prevent duplicates
ComponentRegistry.registerType('Search', Search);
ComponentRegistry.registerType('SearchWithFilters', SearchWithFilters);
ComponentRegistry.registerType('SearchSuggestions', SearchSuggestions);