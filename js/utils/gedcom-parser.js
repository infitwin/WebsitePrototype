/**
 * GEDCOM Parser Utility
 * A simple JavaScript parser for GEDCOM genealogical data files
 * Based on GEDCOM 5.5.1 specification
 */

export class GedcomParser {
    constructor() {
        this.individuals = new Map();
        this.families = new Map();
        this.sources = new Map();
        this.header = {};
        this.records = [];
    }

    /**
     * Parse a GEDCOM file content
     * @param {string} content - The GEDCOM file content
     * @returns {Object} Parsed genealogy data
     */
    parse(content) {
        console.log('🧬 Starting GEDCOM parsing...');
        
        // Clean and split content into lines
        const lines = content
            .replace(/\r\n/g, '\n')
            .replace(/\r/g, '\n')
            .split('\n')
            .filter(line => line.trim().length > 0);

        console.log(`📄 Processing ${lines.length} lines`);

        // Parse each line
        const records = [];
        let currentRecord = null;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const parsed = this.parseLine(line);
            
            if (parsed.level === 0) {
                // Start new record
                if (currentRecord) {
                    records.push(currentRecord);
                }
                currentRecord = {
                    id: parsed.id,
                    tag: parsed.tag,
                    value: parsed.value,
                    children: []
                };
            } else if (currentRecord) {
                // Add to current record
                this.addToRecord(currentRecord, parsed);
            }
        }

        // Add final record
        if (currentRecord) {
            records.push(currentRecord);
        }

        // Process records
        this.processRecords(records);

        console.log(`✅ Parsed ${this.individuals.size} individuals and ${this.families.size} families`);

        return {
            individuals: Array.from(this.individuals.values()),
            families: Array.from(this.families.values()),
            sources: Array.from(this.sources.values()),
            header: this.header,
            summary: this.generateSummary()
        };
    }

    /**
     * Parse a single GEDCOM line
     * @param {string} line - The line to parse
     * @returns {Object} Parsed line data
     */
    parseLine(line) {
        const trimmed = line.trim();
        if (!trimmed) return null;

        // GEDCOM line format: LEVEL [ID] TAG [VALUE]
        const parts = trimmed.split(' ');
        const level = parseInt(parts[0]);
        
        let id = null;
        let tag = '';
        let value = '';
        let startIndex = 1;

        // Check if there's an ID (starts with @)
        if (parts[1] && parts[1].startsWith('@') && parts[1].endsWith('@')) {
            id = parts[1];
            startIndex = 2;
        }

        // Get tag
        if (parts[startIndex]) {
            tag = parts[startIndex];
        }

        // Get value (rest of the line)
        if (parts.length > startIndex + 1) {
            value = parts.slice(startIndex + 1).join(' ');
        }

        return { level, id, tag, value };
    }

    /**
     * Add parsed line to record
     * @param {Object} record - The current record
     * @param {Object} parsed - The parsed line
     */
    addToRecord(record, parsed) {
        if (parsed.level === 1) {
            record.children.push({
                tag: parsed.tag,
                value: parsed.value,
                children: []
            });
        } else if (parsed.level > 1 && record.children.length > 0) {
            // Add to last child
            const lastChild = record.children[record.children.length - 1];
            this.addToChild(lastChild, parsed, parsed.level - 1);
        }
    }

    /**
     * Add parsed line to child record
     * @param {Object} child - The child record
     * @param {Object} parsed - The parsed line
     * @param {number} targetLevel - The target level
     */
    addToChild(child, parsed, targetLevel) {
        if (targetLevel === 1) {
            child.children.push({
                tag: parsed.tag,
                value: parsed.value,
                children: []
            });
        } else if (targetLevel > 1 && child.children.length > 0) {
            const lastChild = child.children[child.children.length - 1];
            this.addToChild(lastChild, parsed, targetLevel - 1);
        }
    }

    /**
     * Process all records and organize data
     * @param {Array} records - Array of parsed records
     */
    processRecords(records) {
        for (const record of records) {
            switch (record.tag) {
                case 'HEAD':
                    this.processHeader(record);
                    break;
                case 'INDI':
                    this.processIndividual(record);
                    break;
                case 'FAM':
                    this.processFamily(record);
                    break;
                case 'SOUR':
                    this.processSource(record);
                    break;
            }
        }
    }

    /**
     * Process header record
     * @param {Object} record - The header record
     */
    processHeader(record) {
        this.header = {
            source: this.getChildValue(record, 'SOUR'),
            version: this.getChildValue(record, 'GEDC', 'VERS'),
            charset: this.getChildValue(record, 'CHAR'),
            date: this.getChildValue(record, 'DATE'),
            filename: this.getChildValue(record, 'FILE')
        };
    }

    /**
     * Process individual record
     * @param {Object} record - The individual record
     */
    processIndividual(record) {
        const individual = {
            id: record.id,
            names: this.getNames(record),
            sex: this.getChildValue(record, 'SEX'),
            birth: this.getEvent(record, 'BIRT'),
            death: this.getEvent(record, 'DEAT'),
            events: this.getAllEvents(record),
            families: {
                spouse: this.getChildValues(record, 'FAMS'),
                child: this.getChildValues(record, 'FAMC')
            },
            notes: this.getChildValues(record, 'NOTE'),
            sources: this.getChildValues(record, 'SOUR')
        };

        this.individuals.set(record.id, individual);
    }

    /**
     * Process family record
     * @param {Object} record - The family record
     */
    processFamily(record) {
        const family = {
            id: record.id,
            husband: this.getChildValue(record, 'HUSB'),
            wife: this.getChildValue(record, 'WIFE'),
            children: this.getChildValues(record, 'CHIL'),
            marriage: this.getEvent(record, 'MARR'),
            divorce: this.getEvent(record, 'DIV'),
            events: this.getAllEvents(record),
            notes: this.getChildValues(record, 'NOTE'),
            sources: this.getChildValues(record, 'SOUR')
        };

        this.families.set(record.id, family);
    }

    /**
     * Process source record
     * @param {Object} record - The source record
     */
    processSource(record) {
        const source = {
            id: record.id,
            title: this.getChildValue(record, 'TITL'),
            author: this.getChildValue(record, 'AUTH'),
            publication: this.getChildValue(record, 'PUBL'),
            text: this.getChildValue(record, 'TEXT'),
            notes: this.getChildValues(record, 'NOTE')
        };

        this.sources.set(record.id, source);
    }

    /**
     * Get names from individual record
     * @param {Object} record - The individual record
     * @returns {Array} Array of name objects
     */
    getNames(record) {
        const names = [];
        const nameChildren = record.children.filter(child => child.tag === 'NAME');
        
        for (const nameChild of nameChildren) {
            const fullName = nameChild.value || '';
            const parts = fullName.split('/');
            const given = parts[0] ? parts[0].trim() : '';
            const surname = parts[1] ? parts[1].trim() : '';
            
            names.push({
                full: fullName,
                given: given,
                surname: surname,
                type: this.getChildValue(nameChild, 'TYPE') || 'primary'
            });
        }
        
        return names.length > 0 ? names : [{ full: 'Unknown', given: 'Unknown', surname: '', type: 'primary' }];
    }

    /**
     * Get event information
     * @param {Object} record - The record containing the event
     * @param {string} eventTag - The event tag (BIRT, DEAT, MARR, etc.)
     * @returns {Object|null} Event object or null
     */
    getEvent(record, eventTag) {
        const eventChild = record.children.find(child => child.tag === eventTag);
        if (!eventChild) return null;

        return {
            date: this.getChildValue(eventChild, 'DATE'),
            place: this.getChildValue(eventChild, 'PLAC'),
            note: this.getChildValue(eventChild, 'NOTE'),
            source: this.getChildValue(eventChild, 'SOUR')
        };
    }

    /**
     * Get all events from a record
     * @param {Object} record - The record
     * @returns {Array} Array of events
     */
    getAllEvents(record) {
        const eventTags = ['BIRT', 'DEAT', 'MARR', 'DIV', 'BURI', 'BAPM', 'CONF', 'GRAD', 'RESI'];
        const events = [];

        for (const tag of eventTags) {
            const event = this.getEvent(record, tag);
            if (event) {
                events.push({
                    type: tag,
                    ...event
                });
            }
        }

        return events;
    }

    /**
     * Get child value from record
     * @param {Object} record - The record
     * @param {...string} tags - The tag path
     * @returns {string|null} The value or null
     */
    getChildValue(record, ...tags) {
        let current = record;
        
        for (const tag of tags) {
            const child = current.children?.find(child => child.tag === tag);
            if (!child) return null;
            current = child;
        }
        
        return current.value || null;
    }

    /**
     * Get all child values for a tag
     * @param {Object} record - The record
     * @param {string} tag - The tag
     * @returns {Array} Array of values
     */
    getChildValues(record, tag) {
        return record.children
            .filter(child => child.tag === tag)
            .map(child => child.value)
            .filter(value => value);
    }

    /**
     * Generate summary statistics
     * @returns {Object} Summary object
     */
    generateSummary() {
        const individuals = Array.from(this.individuals.values());
        const families = Array.from(this.families.values());

        const livingCount = individuals.filter(ind => !ind.death?.date).length;
        const deceasedCount = individuals.filter(ind => ind.death?.date).length;
        const maleCount = individuals.filter(ind => ind.sex === 'M').length;
        const femaleCount = individuals.filter(ind => ind.sex === 'F').length;

        // Find date range
        const dates = [];
        individuals.forEach(ind => {
            if (ind.birth?.date) dates.push(ind.birth.date);
            if (ind.death?.date) dates.push(ind.death.date);
        });
        families.forEach(fam => {
            if (fam.marriage?.date) dates.push(fam.marriage.date);
        });

        return {
            totalIndividuals: individuals.length,
            totalFamilies: families.length,
            totalSources: this.sources.size,
            livingCount,
            deceasedCount,
            maleCount,
            femaleCount,
            dateRange: dates.length > 0 ? {
                earliest: Math.min(...dates.map(d => this.parseYear(d))),
                latest: Math.max(...dates.map(d => this.parseYear(d)))
            } : null
        };
    }

    /**
     * Parse year from GEDCOM date
     * @param {string} dateStr - The date string
     * @returns {number} The year
     */
    parseYear(dateStr) {
        if (!dateStr) return 0;
        const match = dateStr.match(/\b(\d{4})\b/);
        return match ? parseInt(match[1]) : 0;
    }

    /**
     * Convert parsed data to family tree structure
     * @returns {Object} Family tree structure
     */
    toFamilyTree() {
        const individuals = Array.from(this.individuals.values());
        const families = Array.from(this.families.values());

        // Create nodes for each individual
        const nodes = individuals.map(individual => ({
            id: individual.id,
            name: individual.names[0]?.full || 'Unknown',
            firstName: individual.names[0]?.given || 'Unknown',
            lastName: individual.names[0]?.surname || '',
            sex: individual.sex || 'U',
            birth: individual.birth,
            death: individual.death,
            living: !individual.death?.date
        }));

        // Create relationships
        const relationships = [];
        families.forEach(family => {
            // Parent-child relationships
            if (family.children && family.children.length > 0) {
                family.children.forEach(childId => {
                    if (family.husband) {
                        relationships.push({
                            from: family.husband,
                            to: childId,
                            type: 'parent'
                        });
                    }
                    if (family.wife) {
                        relationships.push({
                            from: family.wife,
                            to: childId,
                            type: 'parent'
                        });
                    }
                });
            }

            // Spousal relationships
            if (family.husband && family.wife) {
                relationships.push({
                    from: family.husband,
                    to: family.wife,
                    type: 'spouse',
                    marriage: family.marriage
                });
            }
        });

        return {
            nodes,
            relationships,
            summary: this.generateSummary()
        };
    }
}

/**
 * Simple function to parse GEDCOM content
 * @param {string} content - GEDCOM file content
 * @returns {Object} Parsed data
 */
export function parseGedcom(content) {
    const parser = new GedcomParser();
    return parser.parse(content);
}

/**
 * Validate GEDCOM file format
 * @param {string} content - File content to validate
 * @returns {boolean} True if valid GEDCOM format
 */
export function isValidGedcom(content) {
    if (!content || typeof content !== 'string') return false;
    
    const lines = content.split('\n').filter(line => line.trim().length > 0);
    if (lines.length === 0) return false;
    
    // Check for header
    const firstLine = lines[0].trim();
    if (!firstLine.startsWith('0 HEAD')) return false;
    
    // Check for trailer
    const lastLine = lines[lines.length - 1].trim();
    if (!lastLine.startsWith('0 TRLR')) return false;
    
    // Basic format check
    const validLinePattern = /^\d+\s+(@\w+@\s+)?\w+(\s+.*)?$/;
    const sampleLines = lines.slice(0, Math.min(10, lines.length));
    
    return sampleLines.every(line => validLinePattern.test(line.trim()));
}