/**
 * PayBackPal - Expense Service v2.0
 * Local-first: all reads/writes happen instantly in localStorage.
 * Each write fires a background API call to sync with MongoDB.
 */

const ExpenseService = {
    expenses: [],
    receipts: [],

    init() {
        this.expenses = StorageService.getExpenses();
        this.receipts = StorageService.getReceipts();
        return { expenses: this.expenses, receipts: this.receipts };
    },

    // ── Background sync helper ────────────────────────────────────
    _bg(promise) {
        promise.catch(e => console.warn('[Expense] Background sync failed:', e.message));
    },

    // ── Reads ────────────────────────────────────────────────────

    getAll() {
        return this.expenses;
    },

    getByGroup(groupId) {
        return this.expenses.filter(e => e.groupId === groupId);
    },

    getById(id) {
        return this.expenses.find(e => e.id === id) || null;
    },

    // ── Helpers ───────────────────────────────────────────────────

    _uid() {
        try { return crypto.randomUUID(); }
        catch { return Date.now().toString(36) + Math.random().toString(36).slice(2); }
    },

    /**
     * Ensure splitAmong is always a non-empty array of strings.
     * Falls back to [paidBy] so there is always at least one participant.
     */
    _normalizeSplit(splitAmong, paidBy) {
        if (!Array.isArray(splitAmong) || splitAmong.length === 0) {
            return [paidBy];
        }
        return splitAmong;
    },

    // ── Writes ────────────────────────────────────────────────────

    /**
     * Add a new expense.
     * Spreads ALL incoming fields first, then enforces required structure on top —
     * so nothing from app.js is ever silently dropped.
     */
    addExpense(expenseData) {
        const safeSplit = this._normalizeSplit(expenseData.splitAmong, expenseData.paidBy);

        const newExpense = {
            // Spread everything first (captures custom fields from app.js)
            ...expenseData,

            // Then enforce / overwrite the core structural fields
            id:          this._uid(),
            groupId:     expenseData.groupId     || null,
            amount:      Number(expenseData.amount) || 0,
            description: (expenseData.description || '').trim(),
            category:    expenseData.category    || 'other',
            paidBy:      expenseData.paidBy       || 'me',
            splitAmong:  safeSplit,
            date:        expenseData.date         || new Date().toISOString(),
            receipt:     expenseData.receipt      || null,

            // Flags — preserve from expenseData or default false
            isSettlement:   !!expenseData.isSettlement,
            isContribution: !!expenseData.isContribution,
        };

        // Handle receipt storage
        if (newExpense.receipt) {
            const newReceipt = {
                id:        newExpense.id,
                expenseId: newExpense.id,
                groupId:   newExpense.groupId,
                image:     newExpense.receipt,
                date:      newExpense.date
            };
            this.receipts.push(newReceipt);
            StorageService.saveReceipts(this.receipts);
        }

        this.expenses.push(newExpense);
        StorageService.saveExpenses(this.expenses);

        // Background sync to backend
        this._bg(ApiService.addExpense(newExpense));

        return newExpense;
    },

    /**
     * Settle a debt (record a payment from one person to another).
     *
     * Model: payer (fromUser) gives money to payee (toUser).
     *   → stored as isSettlement:true expense
     *   → paidBy: fromUser (the one handing over money)
     *   → splitAmong: [toUser]  (the one receiving / being credited)
     *
     * In calculateBalances():
     *   fromUser paid → gets credit of amount*(splitLen-1).
     *   BUT splitLen=1 here, so that formula gives 0 — that's the EXISTING BUG.
     *   The balance engine in calculations.js is patched to handle isSettlement
     *   separately: payer's debt decreases by amount, payee's credit decreases.
     */
    settleDebt(fromUser, toUser, amount, method = 'cash', groupId = null) {
        const settlement = {
            id:          this._uid(),
            groupId:     groupId,
            amount:      Number(amount),
            description: `Settlement → ${toUser}`,
            category:    'settlement',
            paidBy:      fromUser,
            splitAmong:  [toUser],
            date:        new Date().toISOString(),
            isSettlement: true,
            settlementFrom: fromUser,
            settlementTo:   toUser,
            method:      method
        };

        this.expenses.push(settlement);
        StorageService.saveExpenses(this.expenses);

        // Background sync to backend
        this._bg(ApiService.settleDebt({ groupId, fromUser, toUser, amount, method }));

        return settlement;
    },

    /**
     * Record a manual contribution (member chips in outside of a specific expense).
     */
    recordContribution(memberId, memberName, amount, groupId) {
        return this.addExpense({
            groupId,
            amount,
            description: `Contribution by ${memberName}`,
            category:    'contribution',
            paidBy:      memberId,
            splitAmong:  [memberId],
            isContribution: true
        });
    },

    /**
     * Delete an expense by ID.
     */
    deleteExpense(id) {
        const before = this.expenses.length;
        this.expenses  = this.expenses.filter(e => e.id !== id);
        this.receipts  = this.receipts.filter(r => r.expenseId !== id);
        if (this.expenses.length < before) {
            StorageService.saveExpenses(this.expenses);
            StorageService.saveReceipts(this.receipts);
            // Background sync to backend
            this._bg(ApiService.deleteExpense(id));
            return true;
        }
        return false;
    },

    // ── Sample Data ───────────────────────────────────────────────

    /**
     * Seed sample expenses for a group.
     * Guards against duplicates, uses safe IDs.
     */
    createSampleData(groupId, user, members) {
        if (this.expenses.some(e => e.groupId === groupId)) return;

        const safeSplit = Array.isArray(members) && members.length
            ? members
            : [user.id];

        const yesterday = new Date(Date.now() - 86_400_000).toISOString();

        const samples = [
            {
                id:          this._uid(),
                groupId,
                amount:      1205.00,
                description: 'Hotel booking',
                category:    'travel',
                paidBy:      user.id,
                splitAmong:  safeSplit,
                date:        yesterday,
                receipt:     null,
                isSettlement:   false,
                isContribution: false,
            },
            {
                id:          this._uid(),
                groupId,
                amount:      457.50,
                description: 'Dinner at Lakeside',
                category:    'food',
                paidBy:      user.id,
                splitAmong:  safeSplit,
                date:        new Date().toISOString(),
                receipt:     null,
                isSettlement:   false,
                isContribution: false,
            }
        ];

        this.expenses.push(...samples);
        StorageService.saveExpenses(this.expenses);
    }
};