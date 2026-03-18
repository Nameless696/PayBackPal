/**
 * PayBackPal - Storage Service (v1.1)
 * Handles all data persistence using localStorage.
 * Added: generic get/set for settings (theme, currency, etc.)
 */

const StorageService = {
    KEYS: {
        USER: 'paybackpal_user',
        GROUPS: 'paybackpal_groups',
        EXPENSES: 'paybackpal_expenses',
        NOTIFICATIONS: 'paybackpal_notifications',
        RECEIPTS: 'paybackpal_receipts',
        SETTINGS: 'paybackpal_settings'
    },

    /** Save arbitrary data by key */
    save(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('StorageService.save error:', error);
            return false;
        }
    },

    /** Get arbitrary data by key with optional default */
    get(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            if (item === null) return defaultValue;
            // Try JSON parse, fallback to raw string
            try {
                return JSON.parse(item);
            } catch {
                return item;
            }
        } catch (error) {
            console.error('StorageService.get error:', error);
            return defaultValue;
        }
    },

    /** Save a named setting (string/bool/number) under settings namespace */
    set(settingKey, value) {
        try {
            localStorage.setItem(`paybackpal_${settingKey}`, typeof value === 'string' ? value : JSON.stringify(value));
            return true;
        } catch (e) {
            console.error('StorageService.set error:', e);
            return false;
        }
    },

    /** Get a named setting */
    getSetting(settingKey, defaultValue = null) {
        try {
            const raw = localStorage.getItem(`paybackpal_${settingKey}`);
            if (raw === null) return defaultValue;
            try { return JSON.parse(raw); } catch { return raw; }
        } catch (e) {
            return defaultValue;
        }
    },

    /** Clear specific key or all data */
    clear(key) {
        if (key) {
            localStorage.removeItem(key);
        } else {
            localStorage.clear();
        }
    },

    // ── Typed accessors ────────────────────────────────────────

    getUser() { return this.get(this.KEYS.USER); },
    saveUser(user) { return this.save(this.KEYS.USER, user); },

    getGroups() { return this.get(this.KEYS.GROUPS, []); },
    saveGroups(groups) { return this.save(this.KEYS.GROUPS, groups); },

    getExpenses() { return this.get(this.KEYS.EXPENSES, []); },
    saveExpenses(expenses) { return this.save(this.KEYS.EXPENSES, expenses); },

    getNotifications() { return this.get(this.KEYS.NOTIFICATIONS, []); },
    saveNotifications(notifications) { return this.save(this.KEYS.NOTIFICATIONS, notifications); },

    getReceipts() { return this.get(this.KEYS.RECEIPTS, []); },
    saveReceipts(receipts) { return this.save(this.KEYS.RECEIPTS, receipts); },

    // ── API Sync Stubs (v2.0 backend prep) ────────────────────

    /**
     * Returns a snapshot of all local data for backend sync.
     * In v2.0 this will POST to the API server.
     */
    exportForSync() {
        return {
            user: this.getUser(),
            groups: this.getGroups(),
            expenses: this.getExpenses(),
            notifications: this.getNotifications(),
            appVersion: '1.1.0',
            syncTimestamp: new Date().toISOString()
        };
    }
};
