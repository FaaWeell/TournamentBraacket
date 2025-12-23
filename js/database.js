/**
 * ====================================
 * DATABASE SERVICE (LocalStorage)
 * Handles all data persistence
 * ====================================
 */

const DB = {
    // Storage Keys
    KEYS: {
        TOURNAMENTS: 'tb_tournaments',
        PARTICIPANTS: 'tb_participants',
        MATCHES: 'tb_matches',
        RESULTS: 'tb_results',
        SETTINGS: 'tb_settings'
    },

    /**
     * Initialize database with empty collections
     */
    init() {
        Object.values(this.KEYS).forEach(key => {
            if (!localStorage.getItem(key)) {
                localStorage.setItem(key, JSON.stringify([]));
            }
        });
        console.log('📦 Database initialized');
    },

    /**
     * Get all items from a collection
     * @param {string} key - Collection key
     * @returns {Array} Collection items
     */
    getAll(key) {
        try {
            return JSON.parse(localStorage.getItem(key)) || [];
        } catch (e) {
            console.error('Error reading from database:', e);
            return [];
        }
    },

    /**
     * Get item by ID
     * @param {string} key - Collection key
     * @param {string|number} id - Item ID
     * @returns {Object|null} Found item or null
     */
    getById(key, id) {
        const items = this.getAll(key);
        return items.find(item => item.id === id) || null;
    },

    /**
     * Find items by criteria
     * @param {string} key - Collection key
     * @param {Object} criteria - Search criteria
     * @returns {Array} Matching items
     */
    find(key, criteria) {
        const items = this.getAll(key);
        return items.filter(item => {
            return Object.entries(criteria).every(([field, value]) => {
                return item[field] === value;
            });
        });
    },

    /**
     * Insert new item
     * @param {string} key - Collection key
     * @param {Object} item - Item to insert
     * @returns {Object} Inserted item with ID
     */
    insert(key, item) {
        const items = this.getAll(key);
        const newItem = {
            ...item,
            id: this.generateId(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        items.push(newItem);
        this.save(key, items);
        return newItem;
    },

    /**
     * Update existing item
     * @param {string} key - Collection key
     * @param {string|number} id - Item ID
     * @param {Object} updates - Fields to update
     * @returns {Object|null} Updated item or null
     */
    update(key, id, updates) {
        const items = this.getAll(key);
        const index = items.findIndex(item => item.id === id);
        
        if (index === -1) return null;
        
        items[index] = {
            ...items[index],
            ...updates,
            updatedAt: new Date().toISOString()
        };
        
        this.save(key, items);
        return items[index];
    },

    /**
     * Delete item
     * @param {string} key - Collection key
     * @param {string|number} id - Item ID
     * @returns {boolean} Success status
     */
    delete(key, id) {
        const items = this.getAll(key);
        const filteredItems = items.filter(item => item.id !== id);
        
        if (filteredItems.length === items.length) return false;
        
        this.save(key, filteredItems);
        return true;
    },

    /**
     * Delete items by criteria
     * @param {string} key - Collection key
     * @param {Object} criteria - Delete criteria
     * @returns {number} Number of deleted items
     */
    deleteWhere(key, criteria) {
        const items = this.getAll(key);
        const filteredItems = items.filter(item => {
            return !Object.entries(criteria).every(([field, value]) => {
                return item[field] === value;
            });
        });
        
        const deletedCount = items.length - filteredItems.length;
        this.save(key, filteredItems);
        return deletedCount;
    },

    /**
     * Save items to storage
     * @param {string} key - Collection key
     * @param {Array} items - Items to save
     */
    save(key, items) {
        try {
            localStorage.setItem(key, JSON.stringify(items));
        } catch (e) {
            console.error('Error saving to database:', e);
            throw new Error('Failed to save data');
        }
    },

    /**
     * Generate unique ID
     * @returns {string} Unique ID
     */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
    },

    /**
     * Clear all data (use with caution!)
     */
    clearAll() {
        Object.values(this.KEYS).forEach(key => {
            localStorage.setItem(key, JSON.stringify([]));
        });
        console.log('🗑️ Database cleared');
    },

    /**
     * Export all data
     * @returns {Object} All database collections
     */
    exportData() {
        const data = {};
        Object.entries(this.KEYS).forEach(([name, key]) => {
            data[name] = this.getAll(key);
        });
        return data;
    },

    /**
     * Import data
     * @param {Object} data - Data to import
     */
    importData(data) {
        Object.entries(this.KEYS).forEach(([name, key]) => {
            if (data[name]) {
                this.save(key, data[name]);
            }
        });
        console.log('📥 Data imported');
    }
};

// Initialize database on load
DB.init();
