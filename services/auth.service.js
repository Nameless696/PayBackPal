/**
 * PayBackPal - Auth Service v2.0
 *
 * login() and signup() are now ASYNC — they call the backend API first.
 * If the backend is unreachable, they fall back to local password verification
 * so the app works offline / during development without a running server.
 *
 * JWT token is stored in localStorage via ApiService.token.
 */

const AuthService = {
    currentUser: null,

    // ── Init ─────────────────────────────────────────────────────

    init() {
        this.currentUser = StorageService.getUser();
        return this.currentUser;
    },

    isLoggedIn()    { return !!this.currentUser; },
    getCurrentUser(){ return this.currentUser; },

    // ── Login (async) ─────────────────────────────────────────────

    async login(email, password) {
        if (!email || !password) {
            return { success: false, message: 'Email and password are required' };
        }

        // Try backend first
        try {
            const res = await ApiService.login(email, password);
            this.currentUser = res.user;
            StorageService.saveUser(this.currentUser);
            return { success: true, user: this.currentUser };
        } catch (apiErr) {
            console.warn('[Auth] API login failed, using local fallback:', apiErr.message);
        }

        // ── Local fallback ──────────────────────────────────────
        return this._localLogin(email, password);
    },

    // ── Signup (async) ────────────────────────────────────────────

    async signup(name, email, password) {
        if (!name || !email || !password) {
            return { success: false, message: 'All fields are required' };
        }

        // Try backend first
        try {
            const res = await ApiService.signup(name, email, password);
            this.currentUser = res.user;
            StorageService.saveUser(this.currentUser);
            return { success: true, user: this.currentUser };
        } catch (apiErr) {
            console.warn('[Auth] API signup failed, using local fallback:', apiErr.message);
            // Check if the backend said it's a duplicate email
            if (apiErr.message?.toLowerCase().includes('already')) {
                return { success: false, message: 'Email is already registered' };
            }
        }

        // ── Local fallback ──────────────────────────────────────
        return this._localSignup(name, email, password);
    },

    // ── Google Login (mock — requires backend OAuth in v3.0) ─────

    loginWithGoogle() {
        const email = 'demo@paybackpal.com';
        this.currentUser = {
            id:     this._stableId(email),
            name:   'Demo User',
            email:  email,
            avatar: 'D',
        };
        StorageService.saveUser(this.currentUser);
        return { success: true, user: this.currentUser };
    },

    // ── Logout ───────────────────────────────────────────────────

    logout() {
        this.currentUser = null;
        ApiService.logout(); // clears JWT from localStorage
        StorageService.clear(StorageService.KEYS.USER);
    },

    // ── Update profile (async) ────────────────────────────────────

    async updateProfile(updates) {
        if (!this.currentUser) return false;

        // Try backend
        try {
            const res = await ApiService.updateProfile(updates);
            this.currentUser = { ...this.currentUser, ...res.user };
            StorageService.saveUser(this.currentUser);
            return true;
        } catch (e) {
            console.warn('[Auth] API updateProfile failed, updating locally:', e.message);
        }

        // Local fallback
        const oldEmail = this.currentUser.email;
        const newEmail = updates.email ? updates.email.toLowerCase().trim() : oldEmail;
        const newName  = updates.name  ? updates.name.trim() : this.currentUser.name;

        if (newEmail !== oldEmail) {
            const creds = this._getCredentials();
            if (creds[oldEmail]) { creds[newEmail] = creds[oldEmail]; delete creds[oldEmail]; }
            this._saveCredentials(creds);
        }

        this.currentUser = {
            ...this.currentUser, ...updates,
            id:     this._stableId(newEmail),
            name:   newName, email: newEmail,
            avatar: newName.charAt(0).toUpperCase(),
        };
        StorageService.saveUser(this.currentUser);
        return true;
    },

    // ── Local-only helpers ────────────────────────────────────────

    _stableId(email) {
        return 'u_' + btoa(email.toLowerCase().trim()).replace(/[+/=]/g, '_');
    },

    _hashPassword(str) {
        let hash = 5381;
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) + hash) ^ str.charCodeAt(i);
            hash = hash >>> 0;
        }
        return hash.toString(16);
    },

    _getCredentials() { return StorageService.get('paybackpal_credentials', {}); },
    _saveCredentials(c){ StorageService.save('paybackpal_credentials', c); },

    _localLogin(email, password) {
        const normalizedEmail = email.toLowerCase().trim();
        const creds      = this._getCredentials();
        const storedHash = creds[normalizedEmail];

        if (storedHash && storedHash !== this._hashPassword(password)) {
            return { success: false, message: 'Incorrect password' };
        }

        const existing = StorageService.getUser();
        const name = (existing?.email === normalizedEmail && existing?.name)
            ? existing.name : normalizedEmail.split('@')[0];

        this.currentUser = {
            id:     this._stableId(normalizedEmail),
            name, email: normalizedEmail,
            avatar: name.charAt(0).toUpperCase(),
        };
        StorageService.saveUser(this.currentUser);
        return { success: true, user: this.currentUser };
    },

    _localSignup(name, email, password) {
        const normalizedEmail = email.toLowerCase().trim();
        const creds = this._getCredentials();
        creds[normalizedEmail] = this._hashPassword(password);
        this._saveCredentials(creds);

        this.currentUser = {
            id:     this._stableId(normalizedEmail),
            name:   name.trim(), email: normalizedEmail,
            avatar: name.trim().charAt(0).toUpperCase(),
        };
        StorageService.saveUser(this.currentUser);
        return { success: true, user: this.currentUser };
    },
};