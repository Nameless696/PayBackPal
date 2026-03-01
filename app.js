/* ============================================================
   PayBackPal — App.js v2.1
   Polished: themed confirm/prompt wired, receipt nav fix,
   notification badge fix, screen entrance animations,
   consistent currency prefix updates.
   ============================================================ */

'use strict';

const app = (() => {

    /* ── Currency config ───────────────────────────── */
    const currencies = {
        NPR: { symbol: '₨', name: 'Nepali Rupee (NPR)' },
        USD: { symbol: '$',  name: 'US Dollar (USD)' },
        INR: { symbol: '₹', name: 'Indian Rupee (INR)' },
        EUR: { symbol: '€', name: 'Euro (EUR)' },
        GBP: { symbol: '£', name: 'British Pound (GBP)' },
    };

    let currentCurrency = StorageService.getSetting('currency') || 'NPR';
    let currentGroupId  = null;
    let pendingMembers  = [];

    /* ── Category icons ─────────────────────────────── */
    const categoryIcons = {
        food: '🍔', travel: '✈️', rent: '🏠', utilities: '💡',
        entertainment: '🎬', shopping: '🛍️', health: '🏥', other: '📦',
        settlement: '🤝', contribution: '💰',
    };

    /* ── Emoji pickers ──────────────────────────────── */
    const categoryEmojis = ['📦','🎮','🏋️','📚','✂️','🎵','🐕','🌿','☕','⚽',
                            '🎯','🛠️','💻','🎨','🧺','🎭','🧘','🚴','🍕','🛒'];
    const groupEmojis    = ['👥','🏕️','🏠','✈️','🎉','💼','🏋️','🎓','🍻','🎬',
                            '🚗','⚽','🎮','🎵','🌴','🍽️','💪','🤝','🏖️','🎸',
                            '🧳','🎂','🏔️','🌊'];

    /* ── Member helpers ─────────────────────────────── */
    function normalizeMember(m) {
        if (typeof m === 'string') return { id: m, name: m.split('@')[0] || m, email: m };
        if (m && typeof m === 'object') {
            return {
                id: m.id || m.email || String(Math.random()),
                name: m.name || (m.email ? m.email.split('@')[0] : 'Member'),
                email: m.email || '',
            };
        }
        return { id: 'unknown', name: 'Unknown', email: '' };
    }
    const normalizeMembers = arr => (arr || []).map(normalizeMember);

    /* ── Currency formatter ─────────────────────────── */
    function fmt(amount) {
        const sym = currencies[currentCurrency]?.symbol || '₨';
        return `${sym}${Math.abs(Number(amount) || 0).toFixed(2)}`;
    }

    /* ════════════════════════════════════════════════
       NAVIGATION
    ════════════════════════════════════════════════ */
    function navigateTo(screenId) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        const screen = document.getElementById(screenId);
        if (screen) {
            screen.classList.add('active');
            screen.scrollTop = 0;
            // Entrance animation
            if (typeof animations !== 'undefined') {
                animations.animatePageEntrance(screenId);
            }
        }

        // Sync bottom nav
        const navMap = { dashboard:'home', groups:'groups', notifications:'alerts', settings:'settings' };
        if (navMap[screenId]) {
            document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
            const navEl = document.querySelector(`[data-nav="${navMap[screenId]}"]`);
            if (navEl) navEl.classList.add('active');
        }

        // Hide nav on sub-screens
        const navHidden = ['login','signup','onboarding-1','onboarding-2','onboarding-3',
                           'splash-screen','group-details','receipt-storage','reports'];
        const nav = document.querySelector('.bottom-nav');
        if (nav) nav.style.display = navHidden.includes(screenId) ? 'none' : '';

        // Screen-specific render
        onNavigate(screenId);
    }

    function setActiveNav(el) {
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        if (el) el.classList.add('active');
    }

    /* ════════════════════════════════════════════════
       MODALS
    ════════════════════════════════════════════════ */
    function openModal(id) {
        document.getElementById(id)?.classList.add('active');
        const bdId = id.replace('-modal', '-backdrop');
        document.getElementById(bdId)?.classList.add('active');
        document.body.style.overflow = 'hidden';
        if (id === 'add-expense-modal') populateExpenseModal();
        if (id === 'settle-modal')      populateSettleModal();
        if (id === 'edit-profile-modal') {
            const user = AuthService.getCurrentUser();
            if (user) {
                const n = document.getElementById('edit-profile-name');
                const e = document.getElementById('edit-profile-email');
                if (n) n.value = user.name  || '';
                if (e) e.value = user.email || '';
            }
        }
    }

    function closeModal(id) {
        document.getElementById(id)?.classList.remove('active');
        const bdId = id.replace('-modal', '-backdrop');
        document.getElementById(bdId)?.classList.remove('active');
        document.body.style.overflow = '';
    }

    /* ════════════════════════════════════════════════
       THEMED CONFIRM (replaces browser confirm())
    ════════════════════════════════════════════════ */
    let _confirmResolve = null;

    function themedConfirm(message, title = 'Confirm', okLabel = 'Confirm', danger = false) {
        return new Promise(resolve => {
            _confirmResolve = resolve;
            const msgEl   = document.getElementById('themed-confirm-message');
            const titleEl = document.getElementById('themed-confirm-title');
            const okBtn   = document.getElementById('themed-confirm-ok');
            if (msgEl)   msgEl.textContent   = message;
            if (titleEl) titleEl.textContent = title;
            if (okBtn) {
                okBtn.textContent = okLabel;
                okBtn.className   = `btn ${danger ? 'btn-danger' : 'btn-primary'} ripple`;
                okBtn.style.flex  = '1';
            }
            openModal('themed-confirm-modal');
        });
    }

    function confirmThemedConfirm() {
        closeModal('themed-confirm-modal');
        if (_confirmResolve) { _confirmResolve(true); _confirmResolve = null; }
    }

    function closeThemedConfirm() {
        closeModal('themed-confirm-modal');
        if (_confirmResolve) { _confirmResolve(false); _confirmResolve = null; }
    }

    /* ════════════════════════════════════════════════
       THEMED PROMPT (replaces browser prompt())
    ════════════════════════════════════════════════ */
    let _promptResolve = null;

    function themedPrompt(message, title = 'Enter Value') {
        return new Promise(resolve => {
            _promptResolve = resolve;
            const labelEl  = document.getElementById('themed-prompt-label');
            const titleEl  = document.getElementById('themed-prompt-title');
            const inputEl  = document.getElementById('themed-prompt-input');
            const prefixEl = document.getElementById('themed-prompt-prefix');
            if (labelEl)  labelEl.textContent  = message;
            if (titleEl)  titleEl.textContent  = title;
            if (inputEl)  { inputEl.value = ''; }
            if (prefixEl) prefixEl.textContent = currencies[currentCurrency]?.symbol || '₨';
            openModal('themed-prompt-modal');
            setTimeout(() => inputEl?.focus(), 350);
        });
    }

    function submitThemedPrompt() {
        const val = document.getElementById('themed-prompt-input')?.value;
        closeModal('themed-prompt-modal');
        if (_promptResolve) { _promptResolve(val); _promptResolve = null; }
    }

    function closeThemedPrompt() {
        closeModal('themed-prompt-modal');
        if (_promptResolve) { _promptResolve(null); _promptResolve = null; }
    }

    /* ════════════════════════════════════════════════
       TOASTS
    ════════════════════════════════════════════════ */
    function showToast(msg, type = 'info', duration = 3200) {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const colors = {
            success: 'linear-gradient(135deg,#22C55E,#16A34A)',
            error:   'linear-gradient(135deg,#EF4444,#DC2626)',
            warning: 'linear-gradient(135deg,#F59E0B,#D97706)',
            info:    'linear-gradient(135deg,#6C63FF,#4F9EFF)',
        };
        const icons = { success:'✅', error:'❌', warning:'⚠️', info:'💬' };
        const toast = document.createElement('div');
        toast.style.cssText = `
            background:${colors[type]||colors.info};
            color:#fff;padding:13px 18px;border-radius:14px;
            font-size:14px;font-weight:600;
            font-family:var(--font-family);
            box-shadow:0 6px 24px rgba(0,0,0,0.22);
            animation:slideUp 0.3s cubic-bezier(0.34,1.4,0.64,1) both;
            max-width:100%;width:100%;pointer-events:auto;
            display:flex;align-items:center;gap:10px;
            border: 1px solid rgba(255,255,255,0.18);
        `;
        toast.innerHTML = `<span style="font-size:18px;flex-shrink:0;">${icons[type]||'💬'}</span><span>${msg}</span>`;
        container.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'fadeIn 0.22s ease-out reverse forwards';
            setTimeout(() => toast.remove(), 230);
        }, duration);
    }

    /* ════════════════════════════════════════════════
       THEME
    ════════════════════════════════════════════════ */
    function toggleTheme(isDark) {
        document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
        StorageService.set('theme', isDark ? 'dark' : 'light');
    }

    /* ════════════════════════════════════════════════
       SERVICE INIT
    ════════════════════════════════════════════════ */
    function initServices() {
        ['StorageService','AuthService','GroupService','ExpenseService','NotificationService'].forEach(svc => {
            if (typeof window[svc] !== 'undefined' && window[svc].init) window[svc].init();
        });
    }

    function initTheme() {
        const saved = StorageService.getSetting('theme') || 'dark';
        document.documentElement.setAttribute('data-theme', saved);
        const toggle = document.getElementById('dark-mode-toggle');
        if (toggle) toggle.checked = saved === 'dark';
    }

    /* ════════════════════════════════════════════════
       CURRENCY
    ════════════════════════════════════════════════ */
    function setCurrency(code) {
        if (!currencies[code]) return;
        currentCurrency = code;
        StorageService.set('currency', code);
        const sym = currencies[code].symbol;

        // Update all currency labels
        document.querySelectorAll('#currency-symbol-label, #currency-prefix-label, .currency-prefix')
            .forEach(el => { if (el) el.textContent = sym; });

        const badge = document.getElementById('currency-badge');
        if (badge) badge.textContent = `${code} ${sym}`;

        const sublabel = document.getElementById('currency-sublabel');
        if (sublabel) sublabel.textContent = currencies[code].name;

        // Update themed prompt prefix too
        const promptPrefix = document.getElementById('themed-prompt-prefix');
        if (promptPrefix) promptPrefix.textContent = sym;

        renderDashboard();
    }

    function initCurrency() {
        const sel = document.getElementById('currency-select');
        if (sel) sel.value = currentCurrency;
        setCurrency(currentCurrency);
    }

    /* ════════════════════════════════════════════════
       EMAIL ALERTS
    ════════════════════════════════════════════════ */
    function toggleEmailAlerts(on) { StorageService.set('emailAlerts', on); }
    function areEmailAlertsOn() {
        const val = StorageService.getSetting('emailAlerts');
        return val === null ? true : !!val;
    }

    /* ════════════════════════════════════════════════
       AUTH
    ════════════════════════════════════════════════ */
    async function handleLogin(e) {
        e.preventDefault();
        const email    = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;
        const btn      = e.target.querySelector('[type=submit]');
        if (btn) { btn.disabled = true; btn.textContent = 'Signing in…'; }
        try {
            const result = await AuthService.login(email, password);
            if (result?.success) {
                showToast('Welcome back! 👋', 'success');
                await postLogin(result.user);
            } else {
                showToast(result?.message || 'Invalid email or password', 'error');
                const form = document.getElementById('login-password');
                if (form && typeof animations !== 'undefined') animations.shakeElement(form.closest('.input-group'));
            }
        } finally {
            if (btn) { btn.disabled = false; btn.textContent = 'Sign In'; }
        }
    }

    async function handleSignup(e) {
        e.preventDefault();
        const name     = document.getElementById('signup-name').value.trim();
        const email    = document.getElementById('signup-email').value.trim();
        const password = document.getElementById('signup-password').value;
        const confirm  = document.getElementById('signup-confirm').value;
        if (password !== confirm) {
            showToast('Passwords do not match', 'error');
            if (typeof animations !== 'undefined') animations.shakeElement(document.getElementById('signup-confirm').closest('.input-group'));
            return;
        }
        const btn = e.target.querySelector('[type=submit]');
        if (btn) { btn.disabled = true; btn.textContent = 'Creating account…'; }
        try {
            const result = await AuthService.signup(name, email, password);
            if (result?.success) {
                showToast(`Welcome, ${name}! 🎉`, 'success');
                await postLogin(result.user);
            } else {
                showToast(result?.message || 'Signup failed. Try again.', 'error');
            }
        } finally {
            if (btn) { btn.disabled = false; btn.textContent = 'Create Account'; }
        }
    }

    function handleGoogleLogin() {
        const result = AuthService.loginWithGoogle?.();
        if (result?.success) { postLogin(result.user); return; }
        showToast('Google Sign-In requires backend — coming in v2.0 ☁️', 'info');
    }

    function handleLogout() {
        AuthService.logout();  // also clears JWT via ApiService.logout()
        showToast('Signed out. See you soon! 👋', 'info');
        navigateTo('login');
    }

    /**
     * Nuclear reset — clears all localStorage and reloads.
     * Only called when app data is corrupted.
     */
    function clearAppData() {
        if (typeof themedConfirm === 'function') {
            themedConfirm(
                'Reset App Data',
                'This will delete all groups, expenses and settings. Are you sure?',
                () => { localStorage.clear(); location.reload(); }
            );
        } else {
            localStorage.clear();
            location.reload();
        }
    }

    async function postLogin(user) {
        // Try to pull all data from backend and hydrate localStorage
        try {
            const sync = await ApiService.syncAll();
            // Always overwrite localStorage with backend data (clears any stale sample data)
            StorageService.saveGroups(sync.groups || []);
            GroupService.groups = sync.groups || [];
            StorageService.saveExpenses(sync.expenses || []);
            ExpenseService.expenses = sync.expenses || [];
            if (sync.notifications?.length) {
                StorageService.saveNotifications(sync.notifications);
            }
        } catch (err) {
            console.warn('[Sync] Backend unreachable, using local data:', err.message);
        }
        updateUserUI(user);
        renderDashboard();
        navigateTo('dashboard');
    }

    function updateUserUI(user) {
        if (!user) return;
        const initial = (user.name || 'U').charAt(0).toUpperCase();
        ['dashboard-avatar','settings-avatar'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.textContent = initial;
        });
        const nameEl  = document.getElementById('settings-name');
        const emailEl = document.getElementById('settings-email');
        if (nameEl)  nameEl.textContent  = user.name  || 'User';
        if (emailEl) emailEl.textContent = user.email || '';
    }

    async function handleEditProfile(e) {
        e.preventDefault();
        const name  = document.getElementById('edit-profile-name').value.trim();
        const email = document.getElementById('edit-profile-email').value.trim();
        await AuthService.updateProfile?.({ name, email });
        updateUserUI({ name, email });
        closeModal('edit-profile-modal');
        showToast('Profile updated ✅', 'success');
    }

    /* ════════════════════════════════════════════════
       DASHBOARD
    ════════════════════════════════════════════════ */
    function renderDashboard() {
        const user     = AuthService.getCurrentUser();
        if (user) updateUserUI(user);

        const groups   = GroupService.getAll();
        const expenses = ExpenseService.getAll();
        const userId   = user?.id || 'me';

        // Use the calculations module so settlements reduce balances correctly
        const bals = (typeof calculations !== 'undefined')
            ? calculations.calculateBalances(expenses, userId)
            : { youAreOwed: 0, youOwe: 0, totalExpenses: 0 };

        const totalSpent = expenses
            .filter(e => !e.isSettlement)
            .reduce((s, e) => s + (Number(e.amount) || 0), 0);

        const setEl = (id, text) => { const e = document.getElementById(id); if (e) e.textContent = text; };
        setEl('total-owed-to-you', fmt(bals.youAreOwed));
        setEl('total-you-owe',     fmt(bals.youOwe));
        setEl('total-expenses',    fmt(totalSpent));
        setEl('group-count',       groups.length);

        // Groups list
        const dashGroups = document.getElementById('dashboard-groups');
        if (dashGroups) {
            if (!groups.length) {
                dashGroups.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-icon">👥</div>
                        <div class="empty-title">No groups yet</div>
                        <div class="empty-desc">Create your first group to start splitting</div>
                        <button class="btn btn-primary btn-sm ripple" onclick="app.openModal('create-group-modal')">+ Create Group</button>
                    </div>`;
            } else {
                dashGroups.innerHTML = groups.slice(0, 4).map(g => buildGroupCard(g, expenses)).join('');
            }
        }

        // Recent activity
        const activityEl = document.getElementById('recent-activity');
        if (activityEl) {
            const recent = [...expenses].sort((a,b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
            if (!recent.length) {
                activityEl.innerHTML = `<p style="color:var(--text-muted);font-size:14px;text-align:center;padding:16px 0;">No activity yet</p>`;
            } else {
                activityEl.innerHTML = recent.map(ex => `
                    <div class="expense-card fade-in">
                        <div class="expense-icon">${getCategoryIcon(ex)}</div>
                        <div style="flex:1;min-width:0;">
                            <div class="list-item-title ellipsis">${ex.description}</div>
                            <div class="list-item-subtitle">${ex.group || ''} · ${formatDate(ex.date)}</div>
                        </div>
                        <div class="amount-positive">${fmt(ex.amount)}</div>
                    </div>`).join('');
            }
        }

        updateNotifBadge();
    }

    function buildGroupCard(group, allExpenses) {
        const icon = group.iconType === 'image'
            ? `<img src="${group.icon}" style="width:52px;height:52px;border-radius:14px;object-fit:cover;">`
            : `<div class="avatar-icon">${group.icon || '👥'}</div>`;
        const exps  = (allExpenses || []).filter(e => e.groupId === group.id);
        const total = exps.reduce((s, e) => s + (Number(e.amount) || 0), 0);
        const count = exps.length;
        return `
            <div class="group-card slide-up" onclick="app.openGroup('${group.id}')">
                ${icon}
                <div style="flex:1;min-width:0;">
                    <div class="list-item-title ellipsis">${group.name}</div>
                    <div class="list-item-subtitle">${group.members?.length || 0} members · ${count} expense${count !== 1 ? 's' : ''}</div>
                </div>
                <div>
                    <div class="amount-positive" style="font-weight:800;font-size:15px;">${fmt(total)}</div>
                    <div style="font-size:11px;color:var(--text-muted);text-align:right;margin-top:2px;">total</div>
                </div>
            </div>`;
    }

    /* ════════════════════════════════════════════════
       GROUPS SCREEN
    ════════════════════════════════════════════════ */
    function renderGroups() {
        try {
            const groups   = GroupService.getAll();
            const expenses = ExpenseService.getAll();
            const list     = document.getElementById('groups-list');
            if (!list) return;
            if (!groups.length) {
                list.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-icon">👥</div>
                        <div class="empty-title">No groups yet</div>
                        <div class="empty-desc">Create your first group to start splitting expenses</div>
                        <button class="btn btn-primary ripple" onclick="app.openModal('create-group-modal')">+ Create Group</button>
                    </div>`;
            } else {
                list.innerHTML = groups.map(g => buildGroupCard(g, expenses)).join('');
            }
        } catch (err) {
            console.error('[renderGroups] Error:', err);
            const list = document.getElementById('groups-list');
            if (list) list.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">⚠️</div>
                    <div class="empty-title">Something went wrong</div>
                    <div class="empty-desc">${err.message}</div>
                    <button class="btn btn-primary ripple" onclick="app.clearAppData()">Reset App Data</button>
                </div>`;
        }
    }

    /* ════════════════════════════════════════════════
       GROUP DETAILS
    ════════════════════════════════════════════════ */
    function openGroup(groupId) {
        try {
        currentGroupId = groupId;
        const group    = GroupService.getById(groupId);
        if (!group) { showToast('Group not found', 'error'); return; }

        const expenses = ExpenseService.getByGroup(groupId);
        const total    = expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
        const user     = AuthService.getCurrentUser();

        // Header icon
        const iconEl = document.getElementById('group-detail-icon');
        if (iconEl) {
            if (group.iconType === 'image') {
                iconEl.innerHTML = `<img src="${group.icon}" style="width:60px;height:60px;border-radius:16px;object-fit:cover;">`;
            } else {
                iconEl.innerHTML = '';
                iconEl.textContent = group.icon || '👥';
            }
        }

        // Calculate real balances for the current user in this group
        const userId    = user?.id || 'me';
        const groupBals = (typeof calculations !== 'undefined')
            ? calculations.calculateGroupBalances(expenses, userId)
            : { youOwe: 0, youAreOwed: 0 };

        const setEl = (id, v) => { const e = document.getElementById(id); if (e) e.textContent = v; };
        setEl('group-detail-name',    group.name);
        setEl('group-detail-members', group.members?.length || 0);
        setEl('group-total',          fmt(total));
        setEl('group-you-are-owed',   fmt(groupBals.youAreOwed));
        setEl('group-you-owe',        fmt(groupBals.youOwe));
        // Count badges
        setEl('group-expense-count', expenses.length ? `${expenses.length}` : '');
        setEl('group-member-count',  group.members?.length  ? `${group.members.length}`  : '');

        // Expenses list — enriched cards with paid-by pill + per-person share
        const expEl = document.getElementById('group-expenses-list');
        if (expEl) {
            if (!expenses.length) {
                expEl.innerHTML = `
                    <div class="empty-state" style="padding:32px 16px;">
                        <div class="empty-icon">💸</div>
                        <div class="empty-title">No expenses yet</div>
                        <div class="empty-desc">Add your first expense to this group</div>
                        <button class="btn btn-primary btn-sm ripple" onclick="app.openModal('add-expense-modal')">+ Add Expense</button>
                    </div>`;
            } else {
                // Sort newest first
                const sorted = [...expenses].sort((a,b) => new Date(b.date) - new Date(a.date));
                expEl.innerHTML = sorted.map((ex, i) => {
                    const paidByMember = normalizeMembers(group.members).find(m => m.id === ex.paidBy);
                    const paidByName   = ex.paidBy === 'me' ? 'You' : (paidByMember?.name || ex.paidBy || 'Someone');
                    const share        = (Number(ex.amount) || 0) / (ex.splitAmong?.length || 1);
                    const isSettlement = ex.isSettlement;
                    const isContrib    = ex.isContribution;
                    const tagStyle     = isSettlement
                        ? 'background:rgba(34,197,94,0.12);color:#16A34A;'
                        : isContrib
                        ? 'background:rgba(245,158,11,0.12);color:#D97706;'
                        : 'background:var(--primary-light);color:var(--primary);';
                    const tagLabel     = isSettlement ? '✓ settled' : isContrib ? '💰 contrib' : null;
                    return `
                    <div class="expense-card slide-up" style="animation-delay:${i * 40}ms;">
                        <div class="expense-icon" style="${isSettlement ? 'background:rgba(34,197,94,0.12);' : isContrib ? 'background:rgba(245,158,11,0.12);' : ''}">${getCategoryIcon(ex)}</div>
                        <div style="flex:1;min-width:0;">
                            <div style="display:flex;align-items:center;gap:6px;margin-bottom:2px;">
                                <div class="list-item-title ellipsis" style="flex:1;">${ex.description}</div>
                                ${tagLabel ? `<span style="font-size:10px;font-weight:700;padding:2px 7px;border-radius:20px;white-space:nowrap;${tagStyle}">${tagLabel}</span>` : ''}
                            </div>
                            <div class="list-item-subtitle">
                                <span style="font-weight:600;color:var(--primary);">${paidByName}</span>
                                &nbsp;·&nbsp;${formatDate(ex.date)}
                                &nbsp;·&nbsp;${ex.splitAmong?.length || 1} people
                            </div>
                        </div>
                        <div style="text-align:right;flex-shrink:0;margin-left:8px;">
                            <div class="amount-positive" style="font-size:15px;">${fmt(ex.amount)}</div>
                            <div style="font-size:11px;color:var(--text-muted);margin-top:1px;">${fmt(share)}/ea</div>
                        </div>
                    </div>`;
                }).join('');
            }
        }

        // Members
        const memEl = document.getElementById('group-members-list');
        const members = normalizeMembers(group.members);

        const adminMember = members.find(m => m.id === group.createdBy) || members[0];
        const isAdmin = !!(user && (
            group.createdBy === user.id || group.createdBy === 'me' ||
            (adminMember && (adminMember.email === user.email || adminMember.id === user.id)) ||
            (!group.createdBy && members.length > 0 && (members[0].email === user.email || members[0].id === user.id))
        ));

        // Compute per-member balance (simple: paid - owed share)
        const memberBalances = {};
        members.forEach(m => memberBalances[m.id] = 0);
        expenses.forEach(ex => {
            if (ex.isSettlement || ex.isContribution) return;
            const n     = ex.splitAmong?.length || 1;
            const share = (Number(ex.amount) || 0) / n;
            const payerId = ex.paidBy;
            if (memberBalances[payerId] !== undefined) memberBalances[payerId] += Number(ex.amount) || 0;
            (ex.splitAmong || []).forEach(mid => {
                if (memberBalances[mid] !== undefined) memberBalances[mid] -= share;
            });
        });

        // Avatar color palette (deterministic per index)
        const avatarColors = [
            'linear-gradient(135deg,#6C63FF,#4F9EFF)',
            'linear-gradient(135deg,#EC4899,#F43F5E)',
            'linear-gradient(135deg,#10B981,#14B8A6)',
            'linear-gradient(135deg,#F59E0B,#EF4444)',
            'linear-gradient(135deg,#8B5CF6,#6C63FF)',
            'linear-gradient(135deg,#3B82F6,#06B6D4)',
        ];

        if (memEl) {
            memEl.innerHTML = members.map((m, idx) => {
                const isGroupAdmin = m.id === group.createdBy || m.email === adminMember?.email || (idx === 0 && !group.createdBy);
                const isMe = !!(user && (m.id === user.id || m.id === 'me' || m.email === user.email));
                const bal  = memberBalances[m.id] || 0;
                const balColor = bal > 0.5 ? 'var(--success)' : bal < -0.5 ? 'var(--error)' : 'var(--text-muted)';
                const balText  = bal > 0.5 ? `+${fmt(bal)}` : bal < -0.5 ? `-${fmt(Math.abs(bal))}` : 'settled';
                const avatarBg = isGroupAdmin ? 'linear-gradient(135deg,#F59E0B,#D97706)' : avatarColors[idx % avatarColors.length];
                return `
                <div class="list-item" style="padding:12px 0;gap:10px;">
                    <div class="avatar avatar-sm" style="background:${avatarBg};width:38px;height:38px;font-size:14px;font-weight:800;flex-shrink:0;">
                        ${m.name.charAt(0).toUpperCase()}
                    </div>
                    <div class="list-item-content" style="flex:1;min-width:0;">
                        <div style="display:flex;align-items:center;gap:6px;margin-bottom:1px;">
                            <span class="list-item-title" style="font-size:14px;">${m.name}${isMe ? ' <span style="font-size:10px;color:var(--primary);font-weight:700;">(you)</span>' : ''}</span>
                            ${isGroupAdmin ? '<span style="background:linear-gradient(135deg,#F59E0B,#D97706);color:#fff;font-size:9px;font-weight:800;padding:2px 7px;border-radius:20px;letter-spacing:0.03em;">ADMIN</span>' : ''}
                        </div>
                        <div style="font-size:11px;color:var(--text-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${m.email || 'Member'}</div>
                    </div>
                    <div style="display:flex;align-items:center;gap:5px;flex-shrink:0;">
                        <span style="font-size:12px;font-weight:700;color:${balColor};min-width:56px;text-align:right;">${balText}</span>
                        ${isAdmin && !isGroupAdmin && !isMe ? `<button class="btn-icon" style="width:30px;height:30px;font-size:12px;background:rgba(245,158,11,0.12);color:#D97706;border-radius:8px;" onclick="app.makeAdmin('${m.id}')" title="Make Admin">👑</button>` : ''}
                        <button class="btn-icon" style="width:30px;height:30px;font-size:12px;background:rgba(108,99,255,0.1);color:var(--primary);border-radius:8px;" onclick="app.setContribution('${m.id}','${m.name}')" title="Record Contribution">💰</button>
                        ${isAdmin && !isMe ? `<button class="btn-icon" style="width:30px;height:30px;font-size:13px;background:rgba(239,68,68,0.1);color:var(--error);border-radius:8px;" onclick="app.removeGroupMember('${m.id}','${m.name}')" title="Remove">✕</button>` : ''}
                    </div>
                </div>`;
            }).join('');
        }

        // Settle-to dropdown
        const settleEl = document.getElementById('settle-to');
        if (settleEl) {
            settleEl.innerHTML = `<option value="">Select member</option>` +
                members.map(m => `<option value="${m.id}">${m.name}</option>`).join('');
        }

        // Show/hide leave button for non-admins
        const leaveBtn  = document.getElementById('leave-group-btn');
        const deleteBtn = document.getElementById('delete-group-btn');
        if (leaveBtn)  leaveBtn.style.display  = isAdmin ? 'none' : 'block';
        if (deleteBtn) deleteBtn.style.display = isAdmin ? 'block' : 'none';

        navigateTo('group-details');
        } catch (err) {
            console.error('[openGroup] Error:', err);
            showToast('Error loading group: ' + err.message, 'error');
        }
    }

    /* ════════════════════════════════════════════════
       ADD EXPENSE
    ════════════════════════════════════════════════ */
    function populateExpenseModal() {
        const groups  = GroupService.getAll();
        const expGrp  = document.getElementById('expense-group');
        if (expGrp) {
            expGrp.innerHTML = '<option value="">Select a group</option>' +
                groups.map(g => `<option value="${g.id}"${g.id === currentGroupId ? ' selected' : ''}>${g.icon || ''} ${g.name}</option>`).join('');

            // Remove old listener to avoid duplicates
            const fresh = expGrp.cloneNode(true);
            expGrp.parentNode.replaceChild(fresh, expGrp);
            fresh.addEventListener('change', function () {
                populateSplitMembers(this.value);
                populatePaidBy(this.value);
            });
            if (currentGroupId) {
                fresh.value = currentGroupId;
                populateSplitMembers(currentGroupId);
                populatePaidBy(currentGroupId);
            }
        }
    }

    function populateSplitMembers(groupId) {
        const group   = GroupService.getById(groupId);
        const splitEl = document.getElementById('split-members');
        if (!splitEl) return;
        const members = normalizeMembers(group?.members);
        splitEl.innerHTML = members.map(m => `
            <label style="display:inline-flex;align-items:center;gap:6px;background:var(--primary-light);color:var(--primary);border-radius:20px;padding:6px 12px;font-size:13px;font-weight:600;cursor:pointer;user-select:none;">
                <input type="checkbox" value="${m.id}" checked style="accent-color:var(--primary);width:14px;height:14px;">
                ${m.name}
            </label>`).join('');
    }

    function populatePaidBy(groupId) {
        const group   = GroupService.getById(groupId);
        const user    = AuthService.getCurrentUser();
        const el      = document.getElementById('expense-paid-by');
        if (!el) return;
        const members = normalizeMembers(group?.members);
        el.innerHTML = `<option value="me">You (${user?.name || 'Me'})</option>` +
            members
                .filter(m => m.id !== user?.id && m.id !== 'me')
                .map(m => `<option value="${m.id}">${m.name}</option>`).join('');
    }

    function handleCategoryChange(val) {
        const section = document.getElementById('custom-category-section');
        if (section) section.style.display = val === 'other' ? 'block' : 'none';
    }

    async function handleAddExpense(e) {
        e.preventDefault();
        const groupId     = document.getElementById('expense-group').value;
        if (!groupId) { showToast('Please select a group', 'error'); return; }

        const amount      = parseFloat(document.getElementById('expense-amount').value);
        const description = document.getElementById('expense-description').value.trim();
        const category    = document.getElementById('expense-category').value;
        const paidBy      = document.getElementById('expense-paid-by').value;

        if (!amount || amount <= 0) { showToast('Please enter a valid amount', 'error'); return; }
        if (!description)           { showToast('Please add a description', 'error'); return; }

        // ── Duplicate detection ──────────────────────────────────────
        const recentExpenses = ExpenseService.getByGroup(groupId);
        const sixtySecondsAgo = Date.now() - 60_000;
        const duplicate = recentExpenses.find(ex =>
            !ex.isSettlement &&
            !ex.isContribution &&
            ex.description.toLowerCase() === description.toLowerCase() &&
            Math.abs(Number(ex.amount) - amount) < 0.01 &&
            new Date(ex.date).getTime() > sixtySecondsAgo
        );
        if (duplicate) {
            const proceed = await themedConfirm(
                `"${description}" (${fmt(amount)}) was just added. Are you sure you want to add it again?`,
                '⚠️ Possible Duplicate', 'Add Anyway', true
            );
            if (!proceed) return;
        }
        // ────────────────────────────────────────────────────────────

        const checkboxes = document.querySelectorAll('#split-members input[type=checkbox]:checked');
        const splitAmong = Array.from(checkboxes).map(c => c.value);
        if (!splitAmong.length) splitAmong.push('me');

        let customName = '', customIcon = '';
        if (category === 'other') {
            customName = document.getElementById('custom-category-name').value.trim();
            customIcon = document.getElementById('custom-category-icon').value || '📦';
        }

        const receiptFile = document.getElementById('expense-receipt').files[0];
        const saveExpense = (receiptData = null) => {
            const expense = ExpenseService.addExpense({
                groupId, amount, description, category, paidBy,
                splitAmong, customCategoryName: customName, customCategoryIcon: customIcon,
                receipt: receiptData, date: new Date().toISOString(),
                group: GroupService.getById(groupId)?.name || '',
            });

            if (areEmailAlertsOn() && typeof EmailService !== 'undefined') {
                const user = AuthService.getCurrentUser();
                EmailService.sendExpenseAlert?.({
                    from: user?.email, groupName: expense.group,
                    description, amount, currency: currencies[currentCurrency].symbol,
                });
            }

            NotificationService.create('expense_added', `New expense: ${description} (${fmt(amount)})`);
            updateNotifBadge();
            closeModal('add-expense-modal');
            showToast('Expense added! 💰', 'success');
            renderDashboard();
            if (currentGroupId === groupId) openGroup(groupId);
            e.target.reset();
            document.getElementById('custom-category-section').style.display = 'none';
        };

        if (receiptFile) {
            const reader = new FileReader();
            reader.onload = evt => saveExpense(evt.target.result);
            reader.readAsDataURL(receiptFile);
        } else {
            saveExpense();
        }
    }

    /* ════════════════════════════════════════════════
       CREATE GROUP
    ════════════════════════════════════════════════ */
    function addMember() {
        const input = document.getElementById('add-member-email');
        const email = input?.value.trim();
        if (!email) return;
        if (pendingMembers.includes(email)) {
            showToast('Already added', 'warning');
            return;
        }
        // Basic email validation
        if (!email.includes('@')) {
            showToast('Please enter a valid email', 'error');
            return;
        }
        pendingMembers.push(email);
        renderChips();
        if (input) { input.value = ''; input.focus(); }
    }

    function renderChips() {
        const el = document.getElementById('group-members-chips');
        if (!el) return;
        el.innerHTML = pendingMembers.map((e, i) => `
            <div class="chip">
                ${e}
                <span class="chip-remove" onclick="app.removeMember(${i})">×</span>
            </div>`).join('');
    }

    function removeMember(idx) {
        pendingMembers.splice(idx, 1);
        renderChips();
    }

    function handleCreateGroup(e) {
        e.preventDefault();
        const name     = document.getElementById('new-group-name').value.trim();
        const desc     = document.getElementById('new-group-description').value.trim();
        const icon     = document.getElementById('new-group-icon').value     || '👥';
        const iconType = document.getElementById('new-group-icon-type').value || 'emoji';
        const user     = AuthService.getCurrentUser();

        const group = GroupService.create({
            name, description: desc, icon, iconType,
            members: [
                { id: user?.id || 'me', name: user?.name || 'You', email: user?.email || '' },
                ...pendingMembers.map((em, i) => ({ id: `m${Date.now()}${i}`, email: em, name: em.split('@')[0] })),
            ],
        });

        if (areEmailAlertsOn() && typeof EmailService !== 'undefined') {
            pendingMembers.forEach(email =>
                EmailService.sendGroupInvite?.({ to: email, from: user?.email, groupName: name }));
        }

        NotificationService.create('group_updated', `Group "${name}" created with ${pendingMembers.length} member(s)`);
        updateNotifBadge();

        pendingMembers = [];
        renderChips();
        closeModal('create-group-modal');
        showToast(`"${name}" created! 🚀`, 'success');
        renderDashboard();
        renderGroups();
        e.target.reset();
        const preview = document.getElementById('group-icon-preview');
        if (preview) { preview.innerHTML = ''; preview.textContent = '👥'; }
        document.getElementById('new-group-icon').value = '👥';
        document.getElementById('new-group-icon-type').value = 'emoji';
        document.querySelectorAll('#group-emoji-grid .emoji-btn').forEach(b => b.classList.remove('selected'));
    }

    function handleGroupIconUpload(input) {
        const file = input.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = e => {
            const preview  = document.getElementById('group-icon-preview');
            const iconInput = document.getElementById('new-group-icon');
            const typeInput = document.getElementById('new-group-icon-type');
            if (preview)  preview.innerHTML = `<img src="${e.target.result}" style="width:100%;height:100%;object-fit:cover;border-radius:12px;">`;
            if (iconInput) iconInput.value  = e.target.result;
            if (typeInput) typeInput.value  = 'image';
            document.querySelectorAll('#group-emoji-grid .emoji-btn').forEach(b => b.classList.remove('selected'));
        };
        reader.readAsDataURL(file);
    }

    /* ════════════════════════════════════════════════
       ADD MEMBER TO GROUP
    ════════════════════════════════════════════════ */
    function handleAddMember(e) {
        e.preventDefault();
        const email = document.getElementById('member-email').value.trim();
        if (!email) return;
        if (!currentGroupId) { showToast('No group selected', 'error'); return; }

        GroupService.addMember(currentGroupId, { id: `m${Date.now()}`, name: email.split('@')[0], email });

        if (areEmailAlertsOn() && typeof EmailService !== 'undefined') {
            const group = GroupService.getById(currentGroupId);
            const user  = AuthService.getCurrentUser();
            EmailService.sendMemberAdded?.({ to: email, from: user?.email, groupName: group?.name });
        }

        NotificationService.create('member_added', `${email} added to group`);
        updateNotifBadge();
        closeModal('add-member-modal');
        showToast(`${email.split('@')[0]} added! 👋`, 'success');
        openGroup(currentGroupId);
        e.target.reset();
    }

    /* ════════════════════════════════════════════════
       SETTLE UP
    ════════════════════════════════════════════════ */
    function populateSettleModal() {
        if (!currentGroupId) return;
        const group = GroupService.getById(currentGroupId);
        const el    = document.getElementById('settle-to');
        if (el) {
            const members = normalizeMembers(group?.members);
            el.innerHTML = '<option value="">Select member</option>' +
                members.map(m => `<option value="${m.id}">${m.name}</option>`).join('');
        }
    }

    function handleSettlement(e) {
        e.preventDefault();
        const toId   = document.getElementById('settle-to').value;
        const amount = parseFloat(document.getElementById('settle-amount').value);
        const method = document.getElementById('settle-payment-method').value;
        if (!toId || !amount || amount <= 0) {
            showToast('Please fill in all fields', 'error');
            return;
        }

        const group   = GroupService.getById(currentGroupId);
        const members = normalizeMembers(group?.members);
        const toMem   = members.find(m => m.id === toId);

        ExpenseService.addExpense({
            groupId: currentGroupId, amount, description: `Settlement via ${method}`,
            category: 'settlement', paidBy: 'me', splitAmong: [toId],
            date: new Date().toISOString(), group: group?.name || '', isSettlement: true,
        });

        if (areEmailAlertsOn() && typeof EmailService !== 'undefined') {
            const user = AuthService.getCurrentUser();
            EmailService.sendSettlementEmail?.({
                to: toMem?.email, from: user?.email,
                amount: fmt(amount), groupName: group?.name, method,
            });
        }

        NotificationService.create('settlement_made', `Settlement of ${fmt(amount)} sent to ${toMem?.name || toId} via ${method}`);
        updateNotifBadge();
        closeModal('settle-modal');
        showToast('Payment recorded! 🎉', 'success');
        triggerConfetti();
        renderDashboard();
        if (currentGroupId) openGroup(currentGroupId);
        e.target.reset();
    }

    /* ════════════════════════════════════════════════
       NOTIFICATIONS
    ════════════════════════════════════════════════ */
    function renderNotifications() {
        const notifs = NotificationService.getAll() || [];
        const list   = document.getElementById('notifications-list');
        if (!list) return;
        if (!notifs.length) {
            list.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🔔</div>
                    <div class="empty-title">All caught up!</div>
                    <div class="empty-desc">No notifications yet</div>
                </div>`;
        } else {
            list.innerHTML = [...notifs].reverse().map(n => `
                <div class="notif-item slide-up" style="${n.read ? 'opacity:0.7;' : ''}">
                    <div class="notif-icon-wrap">${NotificationService.getIcon?.(n.type) || '🔔'}</div>
                    <div style="flex:1;min-width:0;">
                        <div style="font-size:14px;font-weight:600;color:var(--text-primary);margin-bottom:2px;">${n.message}</div>
                        <div style="font-size:12px;color:var(--text-muted);">${formatDate(n.timestamp)}</div>
                    </div>
                    ${!n.read ? '<div style="width:8px;height:8px;border-radius:50%;background:var(--primary);flex-shrink:0;margin-top:4px;"></div>' : ''}
                </div>`).join('');
        }
    }

    function markAllRead() {
        NotificationService.markAllAsRead?.();
        updateNotifBadge();
        renderNotifications();
        showToast('All caught up! ✅', 'success');
    }

    function updateNotifBadge() {
        const unread = (NotificationService.getAll() || []).filter(n => !n.read).length;
        const badge  = document.getElementById('notification-badge');
        if (badge) {
            badge.style.display = unread ? 'flex' : 'none';
            badge.textContent   = unread > 9 ? '9+' : String(unread);
        }
    }

    /* ════════════════════════════════════════════════
       RECEIPTS — FIX: triggered from settings nav
    ════════════════════════════════════════════════ */
    function renderReceipts() {
        const grid = document.getElementById('receipts-grid');
        if (!grid) return;
        const expenses = ExpenseService.getAll().filter(e => e.receipt);
        if (!expenses.length) {
            grid.innerHTML = `
                <div style="grid-column:span 2;text-align:center;padding:48px 0;color:var(--text-muted);">
                    <div style="font-size:48px;margin-bottom:12px;">📸</div>
                    <div style="font-weight:700;font-size:15px;color:var(--text-primary);margin-bottom:6px;">No receipts yet</div>
                    <div style="font-size:13px;">Upload receipts when adding expenses</div>
                </div>`;
        } else {
            grid.innerHTML = expenses.map(e => `
                <div style="border-radius:var(--radius-lg);overflow:hidden;box-shadow:var(--shadow-card);cursor:pointer;border:1px solid var(--border-subtle);" onclick="this.querySelector('img').requestFullscreen?.()">
                    <img src="${e.receipt}" style="width:100%;aspect-ratio:1;object-fit:cover;">
                    <div style="padding:8px 10px;background:var(--bg-card);">
                        <div style="font-size:12px;font-weight:600;color:var(--text-primary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${e.description}</div>
                        <div style="font-size:11px;color:var(--text-muted);">${formatDate(e.date)}</div>
                    </div>
                </div>`).join('');
        }
    }

    /* ════════════════════════════════════════════════
       REPORTS
    ════════════════════════════════════════════════ */
    function generateReport() {
        const from = document.getElementById('report-from')?.value;
        const to   = document.getElementById('report-to')?.value;
        if (!from || !to) { showToast('Please select a date range', 'warning'); return; }
        if (new Date(from) > new Date(to)) { showToast('Start date must be before end date', 'error'); return; }

        const expenses = ExpenseService.getAll().filter(e => {
            const d = new Date(e.date);
            return d >= new Date(from) && d <= new Date(to + 'T23:59:59');
        });

        const total      = expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
        const byCategory = {};
        expenses.forEach(e => {
            const cat = e.category || 'other';
            byCategory[cat] = (byCategory[cat] || 0) + (Number(e.amount) || 0);
        });

        const el = document.getElementById('report-summary');
        if (!el) return;

        if (!expenses.length) {
            el.innerHTML = `<div class="empty-state"><div class="empty-icon">📊</div><div class="empty-title">No data</div><div class="empty-desc">No expenses in this date range</div></div>`;
            return;
        }

        el.innerHTML = `
            <div class="card mb-16">
                <h4 style="margin-bottom:12px;color:var(--text-secondary);font-size:12px;text-transform:uppercase;letter-spacing:0.07em;">Summary</h4>
                <div style="font-size:32px;font-weight:800;color:var(--primary);letter-spacing:-0.03em;">${fmt(total)}</div>
                <div style="color:var(--text-muted);font-size:13px;margin-top:4px;">${expenses.length} transaction${expenses.length !== 1 ? 's' : ''}</div>
            </div>
            <div class="card">
                <h4 style="margin-bottom:16px;">By Category</h4>
                ${Object.entries(byCategory)
                    .sort(([,a],[,b]) => b - a)
                    .map(([cat, amt]) => `
                    <div style="margin-bottom:14px;">
                        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
                            <div style="display:flex;align-items:center;gap:8px;">
                                <span>${categoryIcons[cat] || '📦'}</span>
                                <span style="font-size:14px;font-weight:600;color:var(--text-primary);text-transform:capitalize;">${cat}</span>
                            </div>
                            <span style="font-weight:800;color:var(--primary);">${fmt(amt)}</span>
                        </div>
                        <div class="progress">
                            <div class="progress-bar" style="width:${((amt / total) * 100).toFixed(1)}%"></div>
                        </div>
                    </div>`).join('')}
            </div>`;
    }

    /* ════════════════════════════════════════════════
       EXPORT
    ════════════════════════════════════════════════ */
    function exportData() {
        const data = typeof StorageService.exportForSync === 'function'
            ? StorageService.exportForSync()
            : { groups: GroupService.getAll(), expenses: ExpenseService.getAll() };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `paybackpal-export-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(a.href);
        showToast('Data exported! 📥', 'success');
    }

    /* ════════════════════════════════════════════════
       COMING SOON
    ════════════════════════════════════════════════ */
    function showComingSoon(feature) {
        showToast(`${feature} coming in v2.0 ⚡`, 'info');
    }

    /* ════════════════════════════════════════════════
       CONFETTI
    ════════════════════════════════════════════════ */
    function triggerConfetti() {
        if (typeof animations !== 'undefined') {
            animations.showConfetti();
        }
    }

    /* ════════════════════════════════════════════════
       HELPERS
    ════════════════════════════════════════════════ */
    function getCategoryIcon(expense) {
        if (expense.category === 'other' && expense.customCategoryIcon) return expense.customCategoryIcon;
        return categoryIcons[expense.category] || '💸';
    }

    function formatDate(dateStr) {
        if (!dateStr) return '';
        const d    = new Date(dateStr);
        const now  = new Date();
        const diff = Math.floor((now - d) / 86400000);
        if (diff === 0) return 'Today';
        if (diff === 1) return 'Yesterday';
        if (diff < 7)  return `${diff} days ago`;
        return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    }

    /* ════════════════════════════════════════════════
       EMOJI GRIDS
    ════════════════════════════════════════════════ */
    function buildEmojiGrids() {
        const catGrid = document.getElementById('category-emoji-grid');
        if (catGrid) {
            catGrid.innerHTML = categoryEmojis.map(em =>
                `<button type="button" class="emoji-btn" onclick="app.selectCategoryEmoji(this,'${em}')">${em}</button>`).join('');
        }
        const grpGrid = document.getElementById('group-emoji-grid');
        if (grpGrid) {
            grpGrid.innerHTML = groupEmojis.map(em =>
                `<button type="button" class="emoji-btn" onclick="app.selectGroupEmoji(this,'${em}')">${em}</button>`).join('');
        }
    }

    function selectCategoryEmoji(btn, emoji) {
        document.querySelectorAll('#category-emoji-grid .emoji-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        const input = document.getElementById('custom-category-icon');
        if (input) input.value = emoji;
    }

    function selectGroupEmoji(btn, emoji) {
        document.querySelectorAll('#group-emoji-grid .emoji-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        const preview  = document.getElementById('group-icon-preview');
        const iconVal  = document.getElementById('new-group-icon');
        const iconType = document.getElementById('new-group-icon-type');
        if (preview)  { preview.innerHTML = ''; preview.textContent = emoji; }
        if (iconVal)  iconVal.value  = emoji;
        if (iconType) iconType.value = 'emoji';
    }

    /* ════════════════════════════════════════════════
       GROUP MANAGEMENT (admin actions)
    ════════════════════════════════════════════════ */
    async function removeGroupMember(memberId, memberName) {
        if (!currentGroupId) return;
        const confirmed = await themedConfirm(
            `Remove ${memberName} from this group? They won't be able to see future expenses.`,
            'Remove Member', 'Remove', true
        );
        if (!confirmed) return;
        GroupService.removeMember(currentGroupId, memberId);
        NotificationService.create('member_removed', `${memberName} was removed from the group`);
        updateNotifBadge();
        showToast(`${memberName} removed`, 'info');
        openGroup(currentGroupId);
    }

    async function makeAdmin(memberId) {
        if (!currentGroupId) return;
        const group   = GroupService.getById(currentGroupId);
        if (!group) return;
        const members = normalizeMembers(group.members);
        const target  = members.find(m => m.id === memberId);
        if (!target) return;
        const confirmed = await themedConfirm(
            `Make ${target.name} the admin of "${group.name}"? You'll lose admin access.`,
            'Transfer Admin', 'Make Admin', false
        );
        if (!confirmed) return;
        GroupService.updateGroup(currentGroupId, { createdBy: memberId });
        NotificationService.create('group_updated', `${target.name} is now the admin of "${group.name}"`);
        updateNotifBadge();
        showToast(`${target.name} is now admin 👑`, 'success');
        openGroup(currentGroupId);
    }

    async function setContribution(memberId, memberName) {
        const amountStr = await themedPrompt(
            `How much has ${memberName} contributed?`,
            `Record Contribution`
        );
        if (amountStr === null) return;
        const amount = parseFloat(amountStr);
        if (isNaN(amount) || amount <= 0) { showToast('Please enter a valid amount', 'error'); return; }

        const group = GroupService.getById(currentGroupId);

        ExpenseService.addExpense({
            groupId: currentGroupId,
            amount,
            description: `Contribution by ${memberName}`,
            category: 'contribution',
            paidBy: memberId,
            splitAmong: normalizeMembers(group?.members).map(m => m.id),
            date: new Date().toISOString(),
            group: group?.name || '',
            isContribution: true,
        });

        NotificationService.create('expense_added',
            `💰 ${memberName} contributed ${fmt(amount)} to "${group?.name}". Please verify.`);
        updateNotifBadge();

        if (areEmailAlertsOn() && typeof EmailService !== 'undefined') {
            const members = normalizeMembers(group?.members);
            const target  = members.find(m => m.id === memberId);
            if (target?.email) {
                EmailService.sendExpenseAlert?.({
                    from: AuthService.getCurrentUser()?.email,
                    groupName: group?.name,
                    description: `Contribution: ${memberName} contributed ${fmt(amount)}`,
                    amount,
                    currency: currencies[currentCurrency].symbol,
                });
            }
        }

        showToast(`${memberName}'s contribution of ${fmt(amount)} recorded! ✅`, 'success');
        openGroup(currentGroupId);
        renderDashboard();
    }

    async function leaveGroup() {
        if (!currentGroupId) return;
        const group = GroupService.getById(currentGroupId);
        const confirmed = await themedConfirm(
            `Leave "${group?.name}"? You'll lose access to this group's expenses.`,
            'Leave Group', 'Leave', true
        );
        if (!confirmed) return;
        const user = AuthService.getCurrentUser();
        GroupService.removeMember(currentGroupId, user?.id || 'me');
        showToast(`You left "${group?.name}"`, 'info');
        navigateTo('groups');
        renderGroups();
        renderDashboard();
    }

    async function deleteGroup() {
        if (!currentGroupId) return;
        const group    = GroupService.getById(currentGroupId);
        if (!group) return;

        // Check that all expenses in the group are settled
        const expenses = ExpenseService.getByGroup(currentGroupId);
        const realExpenses = expenses.filter(e => !e.isSettlement && !e.isContribution);

        if (realExpenses.length > 0 && typeof calculations !== 'undefined') {
            const user   = AuthService.getCurrentUser();
            const userId = user?.id || 'me';
            const members = normalizeMembers(group.members);

            // Build per-member net balances
            const memberBalances = {};
            members.forEach(m => { memberBalances[m.id] = 0; });
            expenses.forEach(ex => {
                if (ex.isContribution) return;
                if (ex.isSettlement) {
                    const fromId = ex.paidBy;
                    const toId   = ex.splitAmong?.[0];
                    if (fromId && memberBalances[fromId] !== undefined) memberBalances[fromId] += Number(ex.amount) || 0;
                    if (toId   && memberBalances[toId]   !== undefined) memberBalances[toId]   -= Number(ex.amount) || 0;
                    return;
                }
                const n     = ex.splitAmong?.length || 1;
                const share = (Number(ex.amount) || 0) / n;
                if (memberBalances[ex.paidBy] !== undefined) memberBalances[ex.paidBy] += Number(ex.amount) || 0;
                (ex.splitAmong || []).forEach(mid => {
                    if (memberBalances[mid] !== undefined) memberBalances[mid] -= share;
                });
            });

            const hasUnsettled = Object.values(memberBalances).some(b => Math.abs(b) > 0.5);
            if (hasUnsettled) {
                showToast('⚠️ Settle all expenses before deleting this group', 'error');
                return;
            }
        }

        const confirmed = await themedConfirm(
            `Permanently delete "${group.name}"? This will also delete all ${expenses.length} expense(s). This cannot be undone.`,
            '🗑️ Delete Group', 'Delete', true
        );
        if (!confirmed) return;

        // Delete all expenses for this group first
        expenses.forEach(ex => ExpenseService.deleteExpense(ex.id));
        GroupService.deleteGroup(currentGroupId);

        NotificationService.create('group_updated', `Group "${group.name}" was deleted`);
        updateNotifBadge();
        currentGroupId = null;
        showToast(`"${group.name}" deleted`, 'info');
        navigateTo('groups');
        renderGroups();
        renderDashboard();
    }

    /* ════════════════════════════════════════════════
       SCREEN-SPECIFIC RENDER HOOKS
    ════════════════════════════════════════════════ */
    function onNavigate(screenId) {
        if (screenId === 'dashboard')       renderDashboard();
        if (screenId === 'groups')          renderGroups();
        if (screenId === 'notifications')   renderNotifications();
        if (screenId === 'receipt-storage') renderReceipts();   // FIX: was missing
    }

    /* ════════════════════════════════════════════════
       INIT
    ════════════════════════════════════════════════ */
    function init() {
        initServices();
        buildEmojiGrids();
        initTheme();
        initCurrency();

        const emailToggle = document.getElementById('email-alerts-toggle');
        if (emailToggle) emailToggle.checked = areEmailAlertsOn();

        // Splash auto-advance
        setTimeout(() => {
            document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
            const user = AuthService.getCurrentUser();
            if (user) {
                updateUserUI(user);
                renderDashboard();
                document.getElementById('dashboard').classList.add('active');
                const nav = document.querySelector('.bottom-nav');
                if (nav) nav.style.display = '';
                document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
                document.querySelector('[data-nav="home"]')?.classList.add('active');
            } else {
                document.getElementById('onboarding-1').classList.add('active');
                const nav = document.querySelector('.bottom-nav');
                if (nav) nav.style.display = 'none';
            }
        }, 1500);
    }

    document.addEventListener('DOMContentLoaded', init);

    /* ════════════════════════════════════════════════
       PUBLIC API
    ════════════════════════════════════════════════ */
    return {
        navigateTo,
        setActiveNav,
        openModal, closeModal,
        toggleTheme, setCurrency, toggleEmailAlerts, areEmailAlertsOn,

        // Auth
        handleLogin, handleSignup, handleGoogleLogin, handleLogout, handleEditProfile,

        // Expenses
        handleAddExpense, handleCategoryChange,

        // Groups
        handleCreateGroup, addMember, removeMember, handleGroupIconUpload,
        handleAddMember, handleSettlement, populateSettleModal,
        openGroup, removeGroupMember, makeAdmin, setContribution, leaveGroup, deleteGroup,

        // Notifications
        markAllRead,

        // Emoji pickers
        selectCategoryEmoji, selectGroupEmoji,

        // Reports / Export
        generateReport, exportData,

        // Themed modals (wired to HTML onclick)
        confirmThemedConfirm, closeThemedConfirm,
        submitThemedPrompt,   closeThemedPrompt,

        showComingSoon,
        renderDashboard, renderGroups, renderNotifications,
        fmt,
        clearAppData,
        getCurrencySymbol: () => currencies[currentCurrency]?.symbol || '₨',
    };

})();