/**
 * PayBackPal — API Service v2.0
 * Makes real HTTP calls to the Node.js/Express/MongoDB backend.
 * Falls back gracefully to local storage when the server is unreachable.
 *
 * Backend: http://localhost:5000
 * Token is persisted in localStorage so it survives page refreshes.
 */

const ApiService = {

    BASE_URL: 'http://localhost:5000/api',

    // ── Token management (persisted across reloads) ──────────────

    get token() {
        return localStorage.getItem('paybackpal_jwt') || null;
    },
    set token(val) {
        if (val) localStorage.setItem('paybackpal_jwt', val);
        else     localStorage.removeItem('paybackpal_jwt');
    },

    // ── Auth ─────────────────────────────────────────────────────

    async login(email, password) {
        const res = await this._post('/auth/login', { email, password });
        this.token = res.token;
        return res;
    },

    async signup(name, email, password) {
        // Returns { needsVerification, email, message } — no token yet
        return this._post('/auth/register', { name, email, password });
    },

    async verifyEmail(email, code) {
        const res = await this._post('/auth/verify', { email, code });
        if (res.token) this.token = res.token;
        return res;
    },

    async resendVerification(email) {
        return this._post('/auth/resend-verification', { email });
    },

    async logout() {
        this.token = null;
    },

    async getMe() {
        return this._get('/auth/me');
    },

    async updateProfile(updates) {
        return this._patch('/auth/profile', updates);
    },

    // ── Groups ───────────────────────────────────────────────────

    async getGroups() {
        return this._get('/groups');
    },

    async createGroup(groupData) {
        return this._post('/groups', groupData);
    },

    async getGroup(id) {
        return this._get(`/groups/${id}`);
    },

    async updateGroup(id, updates) {
        return this._patch(`/groups/${id}`, updates);
    },

    async deleteGroup(id) {
        return this._delete(`/groups/${id}`);
    },

    async addMember(groupId, memberData) {
        return this._post(`/groups/${groupId}/members`, memberData);
    },

    async removeMember(groupId, memberId) {
        return this._delete(`/groups/${groupId}/members/${memberId}`);
    },

    // ── Expenses ─────────────────────────────────────────────────

    async getExpenses(groupId = null) {
        const q = groupId ? `?groupId=${encodeURIComponent(groupId)}` : '';
        return this._get(`/expenses${q}`);
    },

    async addExpense(expenseData) {
        return this._post('/expenses', expenseData);
    },

    async deleteExpense(id) {
        return this._delete(`/expenses/${id}`);
    },

    async settleDebt(data) {
        return this._post('/expenses/settle', data);
    },

    // ── Notifications ────────────────────────────────────────────

    async getNotifications() {
        return this._get('/notifications');
    },

    async markNotificationRead(id) {
        return this._patch(`/notifications/${id}`, { read: true });
    },

    async markAllNotificationsRead() {
        return this._patch('/notifications/read-all', {});
    },

    // ── Sync ─────────────────────────────────────────────────────

    /** Fetch all groups + expenses + notifications for the current user. */
    async syncAll() {
        return this._get('/sync');
    },

    /** Push all local localStorage data to the backend (first-time migration). */
    async importLocalData() {
        const data = {
            groups:        StorageService.getGroups(),
            expenses:      StorageService.getExpenses(),
            notifications: StorageService.getNotifications(),
        };
        return this._post('/sync/import', data);
    },

    // ── Email ────────────────────────────────────────────────────

    async sendEmail({ to, subject, body, html }) {
        return this._post('/emails/send', { to, subject, body, html }).catch(e => {
            console.warn('[Email] Backend send failed:', e.message);
        });
    },

    // ── Health check ─────────────────────────────────────────────

    async ping() {
        try {
            const res = await fetch(`${this.BASE_URL}/health`, { signal: AbortSignal.timeout(3000) });
            return res.ok;
        } catch {
            return false;
        }
    },

    // ── HTTP helpers ─────────────────────────────────────────────

    async _get(endpoint) {
        const res = await fetch(`${this.BASE_URL}${endpoint}`, { headers: this._headers() });
        return this._handle(res);
    },

    async _post(endpoint, body) {
        const res = await fetch(`${this.BASE_URL}${endpoint}`, {
            method: 'POST', headers: this._headers(), body: JSON.stringify(body),
        });
        return this._handle(res);
    },

    async _patch(endpoint, body) {
        const res = await fetch(`${this.BASE_URL}${endpoint}`, {
            method: 'PATCH', headers: this._headers(), body: JSON.stringify(body),
        });
        return this._handle(res);
    },

    async _delete(endpoint) {
        const res = await fetch(`${this.BASE_URL}${endpoint}`, {
            method: 'DELETE', headers: this._headers(),
        });
        return this._handle(res);
    },

    _headers() {
        const h = { 'Content-Type': 'application/json' };
        if (this.token) h['Authorization'] = `Bearer ${this.token}`;
        return h;
    },

    async _handle(res) {
        let json;
        try { json = await res.json(); }
        catch { throw new Error(`HTTP ${res.status} — invalid JSON`); }
        if (!res.ok) throw new Error(json.message || `HTTP ${res.status}`);
        return json;
    },
};
