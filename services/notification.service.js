// PayBackPal - Notification Service v2.0
// Syncs with backend in background; reads from localStorage for speed.

const NotificationService = {

    _bg(p) { p.catch(e => console.warn('[Notif] Sync failed:', e.message)); },

    init() { return this.getAll(); },

    create(type, message, data = {}) {
        const notification = {
            id:        Date.now().toString(),
            type, message, data,
            timestamp: new Date().toISOString(),
            read:      false,
        };
        const notifications = this.getAll();
        notifications.unshift(notification);
        StorageService.saveNotifications(notifications);
        return notification;
    },

    getAll()        { return StorageService.getNotifications(); },
    getUnreadCount(){ return this.getAll().filter(n => !n.read).length; },

    markAsRead(notificationId) {
        const notifications = this.getAll();
        const n = notifications.find(n => n.id === notificationId);
        if (n) {
            n.read = true;
            StorageService.saveNotifications(notifications);
            this._bg(ApiService.markNotificationRead(notificationId));
        }
        return n;
    },

    markAllAsRead() {
        const notifications = this.getAll();
        notifications.forEach(n => n.read = true);
        StorageService.saveNotifications(notifications);
        this._bg(ApiService.markAllNotificationsRead());
    },

    delete(notificationId) {
        const notifications = this.getAll().filter(n => n.id !== notificationId);
        StorageService.saveNotifications(notifications);
    },

    clear() { StorageService.saveNotifications([]); },
    
    // Notification type constants
    TYPES: {
        MEMBER_ADDED: 'member_added',
        MEMBER_REMOVED: 'member_removed',
        EXPENSE_ADDED: 'expense_added',
        EXPENSE_UPDATED: 'expense_updated',
        EXPENSE_DELETED: 'expense_deleted',
        SETTLEMENT_MADE: 'settlement_made',
        GROUP_UPDATED: 'group_updated'
    },
    
    // Get icon for notification type
    getIcon(type) {
        const icons = {
            member_added: '👥',
            member_removed: '👋',
            expense_added: '💰',
            expense_updated: '✏️',
            expense_deleted: '🗑️',
            settlement_made: '✅',
            group_updated: '📝'
        };
        return icons[type] || '📢';
    }
};
