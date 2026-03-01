/**
 * PayBackPal - Group Service v2.0
 * Local-first: all reads/writes happen instantly in localStorage.
 * Each write fires a background API call to sync with MongoDB.
 */

const GroupService = {
    groups: [],

    init() {
        this.groups = StorageService.getGroups() || [];
        return this.groups;
    },

    getAll() { return this.groups; },
    getById(id) { return this.groups.find(g => g.id === id); },

    // ── Background sync helper ────────────────────────────────────
    _bg(promise) {
        promise.catch(e => console.warn('[Group] Background sync failed:', e.message));
    },

    /**
     * Create a new group — saves locally and syncs to backend.
     */
    create(groupData) {
        const user = AuthService.getCurrentUser();
        const newGroup = {
            id: Date.now().toString(),
            name: groupData.name,
            description: groupData.description || '',
            icon: groupData.icon || '👥',
            iconType: groupData.iconType || 'emoji',
            members: Array.isArray(groupData.members) ? [...groupData.members] : [],
            createdAt: new Date().toISOString(),
            createdBy: user ? user.id : 'me',
        };

        if (user) {
            const alreadyIn = newGroup.members.some(
                m => (m.id && m.id === user.id) || (m.email && m.email === user.email)
            );
            if (!alreadyIn) {
                newGroup.members.unshift({ id: user.id, name: user.name, email: user.email });
            }
        }

        this.groups.push(newGroup);
        StorageService.saveGroups(this.groups);

        // Background sync
        this._bg(ApiService.createGroup(newGroup).then(res => {
            if (res?.group?.id && res.group.id !== newGroup.id) {
                // Update local ID to match MongoDB ID
                newGroup.id = res.group.id;
                StorageService.saveGroups(this.groups);
            }
        }));

        return newGroup;
    },

    addMember(groupId, memberObj) {
        const group = this.getById(groupId);
        if (!group) return false;
        const duplicate = group.members.some(
            m => (m.id && m.id === memberObj.id) || (m.email && m.email === memberObj.email)
        );
        if (!duplicate) {
            group.members.push(memberObj);
            StorageService.saveGroups(this.groups);
            this._bg(ApiService.addMember(groupId, memberObj));
            return true;
        }
        return false;
    },

    removeMember(groupId, memberId) {
        const group = this.getById(groupId);
        if (group) {
            group.members = group.members.filter(m => m.id !== memberId && m !== memberId);
            StorageService.saveGroups(this.groups);
            this._bg(ApiService.removeMember(groupId, memberId));
            return true;
        }
        return false;
    },

    deleteGroup(groupId) {
        const before = this.groups.length;
        this.groups = this.groups.filter(g => g.id !== groupId);
        if (this.groups.length < before) {
            StorageService.saveGroups(this.groups);
            this._bg(ApiService.deleteGroup(groupId));
            return true;
        }
        return false;
    },

    updateGroup(groupId, updates) {
        const group = this.getById(groupId);
        if (group) {
            Object.assign(group, updates);
            StorageService.saveGroups(this.groups);
            this._bg(ApiService.updateGroup(groupId, updates));
            return group;
        }
        return null;
    },

    createSampleData() {
        if (this.groups.length > 0) return;
        const user = AuthService.getCurrentUser();
        if (!user) return;

        const sampleGroup = {
            id: Date.now().toString(),
            name: 'Pokhara Trip 🏔️',
            description: 'Weekend getaway with friends',
            icon: '🏕️',
            iconType: 'emoji',
            members: [
                { id: user.id, name: user.name, email: user.email },
                { id: 'm2', name: 'Arun',  email: 'arun@example.com' },
                { id: 'm3', name: 'Priya', email: 'priya@example.com' },
            ],
            createdAt: new Date().toISOString(),
            createdBy: user.id,
        };

        this.groups.push(sampleGroup);
        StorageService.saveGroups(this.groups);
        return sampleGroup;
    },
};
