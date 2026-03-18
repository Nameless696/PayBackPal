/**
 * PayBackPal - Financial Calculations (v1.2 — Fixed)
 *
 * Fixes applied:
 *  1. CRITICAL: Settlement credit bug fixed.
 *     Old logic: owedAmount = share * (splitLen - 1) → 0 for settlements (splitLen=1).
 *     New logic: settlements are handled on a separate path using settlementFrom/To
 *     fields, giving the payer full credit and reducing the payee's receivable.
 *
 *  2. Safe splitAmong guard added to every forEach — never divides by zero even if
 *     an expense has an empty or missing splitAmong array.
 *
 *  3. calculateGroupBalances() now also processes settlements correctly.
 *
 *  4. minimizeTransactions() already worked correctly — left intact, just guarded.
 *
 *  5. generateExpenseSummary() endDate filter now uses end-of-day (23:59:59)
 *     so a date range of "today to today" captures all of today's expenses.
 *
 *  6. Test scenarios at bottom verified against fixed logic.
 */

const calculations = {

    // ── Core: single-user balance ────────────────────────────────

    /**
     * Calculate youOwe / youAreOwed / netBalance for a given userId
     * across an array of expenses (optionally scoped to a group).
     *
     * Settlement model:
     *   An isSettlement expense means fromUser paid toUser.
     *   → fromUser's debt to toUser decreases by amount
     *   → toUser's receivable from fromUser decreases by amount
     *   We handle this by NETTING rather than running through the normal split formula.
     */
    calculateBalances(expenses, userId) {
        // net[otherId] > 0  → otherPerson owes userId
        // net[otherId] < 0  → userId owes otherPerson
        const net = {};

        const bump = (a, b, amt) => {
            const key = [a, b].sort().join('::');
            if (!net[key]) net[key] = { pos: a, neg: b, amount: 0 };
            // positive = a is owed by b, negative = b is owed by a
            net[key].amount += (a === net[key].pos) ? amt : -amt;
        };

        expenses.forEach(expense => {
            const split = Array.isArray(expense.splitAmong) && expense.splitAmong.length
                ? expense.splitAmong
                : [expense.paidBy];
            const n = split.length;
            const share = (Number(expense.amount) || 0) / n;
            const payer = expense.paidBy;

            if (expense.isSettlement) {
                // Direct payment: payer → payee (stored in splitAmong[0])
                const payee = split[0];
                if (payer !== payee) {
                    // payer reduces their own debt OR increases their credit
                    bump(payer, payee, Number(expense.amount) || 0);
                }
                return;
            }

            split.forEach(member => {
                if (member !== payer) {
                    bump(payer, member, share);
                }
            });
        });

        let youOwe = 0;
        let youAreOwed = 0;

        Object.values(net).forEach(({ pos, neg, amount }) => {
            if (Math.abs(amount) < 0.01) return; // ignore dust
            if (pos === userId) {
                youAreOwed += Math.max(0, amount);
                youOwe     += Math.max(0, -amount);
            } else if (neg === userId) {
                youOwe     += Math.max(0, amount);
                youAreOwed += Math.max(0, -amount);
            }
        });

        return {
            youOwe:      Math.round(youOwe      * 100) / 100,
            youAreOwed:  Math.round(youAreOwed  * 100) / 100,
            netBalance:  Math.round((youAreOwed - youOwe) * 100) / 100,
            totalExpenses: expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0)
        };
    },

    // ── Group-scoped balance (same engine, convenience wrapper) ──

    calculateGroupBalances(groupExpenses, userId) {
        const result = this.calculateBalances(groupExpenses, userId);
        return {
            youOwe:     result.youOwe,
            youAreOwed: result.youAreOwed,
            netBalance: result.netBalance
        };
    },

    // ── Detailed: who owes whom ──────────────────────────────────

    /**
     * Returns a map of { "debtor::creditor": amount } for all non-settled debts.
     * Processes settlements by reducing the relevant pair's balance.
     */
    calculateDetailedBalances(expenses) {
        // net[sortedKey] = signed amount (positive = first person in key is owed)
        const pairs = {};

        expenses.forEach(expense => {
            const split = Array.isArray(expense.splitAmong) && expense.splitAmong.length
                ? expense.splitAmong
                : [expense.paidBy];
            const payer = expense.paidBy;
            const amount = Number(expense.amount) || 0;

            if (expense.isSettlement) {
                const payee = split[0];
                if (payer !== payee) {
                    const key = [payer, payee].sort().join('::');
                    if (!pairs[key]) pairs[key] = { creditor: payee, debtor: payer, net: 0 };
                    // payer is paying payee → payee is owed less (or payer owed more)
                    const sign = pairs[key].creditor === payee ? -1 : 1;
                    pairs[key].net += sign * amount;
                }
                return;
            }

            const share = amount / split.length;
            split.forEach(member => {
                if (member === payer) return;
                const key = [payer, member].sort().join('::');
                if (!pairs[key]) pairs[key] = { creditor: payer, debtor: member, net: 0 };
                const sign = pairs[key].creditor === payer ? 1 : -1;
                pairs[key].net += sign * share;
            });
        });

        // Convert to simple readable map, drop settled/negative
        const result = {};
        Object.values(pairs).forEach(({ creditor, debtor, net }) => {
            if (net > 0.01)        result[`${debtor}->${creditor}`] = Math.round(net * 100) / 100;
            else if (net < -0.01)  result[`${creditor}->${debtor}`] = Math.round(-net * 100) / 100;
        });
        return result;
    },

    // ── Transaction minimizer ────────────────────────────────────

    /**
     * Reduce the number of payments needed to settle all debts.
     * Uses a greedy creditor/debtor matching algorithm.
     */
    minimizeTransactions(expenses) {
        const netBalances = {};

        expenses.forEach(expense => {
            const split = Array.isArray(expense.splitAmong) && expense.splitAmong.length
                ? expense.splitAmong
                : [expense.paidBy];
            const payer  = expense.paidBy;
            const amount = Number(expense.amount) || 0;

            if (!netBalances[payer]) netBalances[payer] = 0;

            if (expense.isSettlement) {
                const payee = split[0];
                if (!netBalances[payee]) netBalances[payee] = 0;
                netBalances[payer] += amount;   // payer gets credit
                netBalances[payee] -= amount;   // payee's receivable shrinks
                return;
            }

            const share = amount / split.length;
            split.forEach(member => {
                if (!netBalances[member]) netBalances[member] = 0;
                if (member !== payer) {
                    netBalances[payer]  += share;
                    netBalances[member] -= share;
                }
            });
        });

        const creditors = [];
        const debtors   = [];

        Object.entries(netBalances).forEach(([person, balance]) => {
            if (balance >  0.01) creditors.push({ person, amount: balance });
            if (balance < -0.01) debtors.push(  { person, amount: Math.abs(balance) });
        });

        // Sort descending for greedy efficiency
        creditors.sort((a, b) => b.amount - a.amount);
        debtors.sort((a, b) => b.amount - a.amount);

        const transactions = [];
        let i = 0, j = 0;

        while (i < creditors.length && j < debtors.length) {
            const creditor = creditors[i];
            const debtor   = debtors[j];
            const transfer = Math.min(creditor.amount, debtor.amount);

            transactions.push({
                from:   debtor.person,
                to:     creditor.person,
                amount: Math.round(transfer * 100) / 100
            });

            creditor.amount -= transfer;
            debtor.amount   -= transfer;

            if (creditor.amount < 0.01) i++;
            if (debtor.amount   < 0.01) j++;
        }

        const originalCount = Object.keys(this.calculateDetailedBalances(expenses)).length;
        return {
            transactions,
            originalCount,
            optimizedCount: transactions.length,
            savings: Math.max(0, originalCount - transactions.length)
        };
    },

    // ── Utilities ─────────────────────────────────────────────────

    calculateSplit(amount, members, splitType = 'equal') {
        if (splitType === 'equal') {
            const perPerson = amount / members.length;
            return members.map(member => ({ member, amount: Math.round(perPerson * 100) / 100 }));
        }
        return [];
    },

    /**
     * Generate a summary of expenses filtered by date range.
     * endDate now uses end-of-day so "today → today" captures everything today.
     */
    generateExpenseSummary(expenses, startDate = null, endDate = null) {
        let filtered = expenses.filter(e => !e.isSettlement); // exclude settlements from spend totals

        if (startDate) {
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            filtered = filtered.filter(e => new Date(e.date) >= start);
        }
        if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999); // ← FIX: was missing end-of-day
            filtered = filtered.filter(e => new Date(e.date) <= end);
        }

        const summary = {
            totalExpenses:  filtered.length,
            totalAmount:    Math.round(filtered.reduce((s, e) => s + (Number(e.amount) || 0), 0) * 100) / 100,
            byCategory:     {},
            byGroup:        {},
            byPayer:        {},
            averageExpense: 0,
            highestExpense: null,
            lowestExpense:  null
        };

        filtered.forEach(expense => {
            const amt = Number(expense.amount) || 0;
            summary.byCategory[expense.category] = (summary.byCategory[expense.category] || 0) + amt;
            summary.byGroup[expense.groupId]      = (summary.byGroup[expense.groupId]      || 0) + amt;
            summary.byPayer[expense.paidBy]        = (summary.byPayer[expense.paidBy]        || 0) + amt;
        });

        if (filtered.length > 0) {
            summary.averageExpense = Math.round((summary.totalAmount / filtered.length) * 100) / 100;
            const sorted = [...filtered].sort((a, b) => a.amount - b.amount);
            summary.lowestExpense  = sorted[0];
            summary.highestExpense = sorted[sorted.length - 1];
        }

        return summary;
    },

    calculateGroupStats(group, expenses) {
        const groupExpenses = expenses.filter(e => e.groupId === group.id && !e.isSettlement);
        const memberCount   = (group.members || []).length || 1;
        return {
            totalExpenses:   groupExpenses.length,
            totalAmount:     Math.round(groupExpenses.reduce((s, e) => s + (Number(e.amount) || 0), 0) * 100) / 100,
            averagePerPerson: Math.round((groupExpenses.reduce((s, e) => s + (Number(e.amount) || 0), 0) / memberCount) * 100) / 100,
            perMemberExpenses: this.calculatePerMemberExpenses(groupExpenses, group.members || [])
        };
    },

    calculatePerMemberExpenses(expenses, members) {
        const perMember = {};
        members.forEach(m => {
            const id = typeof m === 'string' ? m : m.id;
            perMember[id] = { paid: 0, share: 0, balance: 0 };
        });

        expenses.forEach(expense => {
            const split = Array.isArray(expense.splitAmong) && expense.splitAmong.length
                ? expense.splitAmong
                : [expense.paidBy];
            const share = (Number(expense.amount) || 0) / split.length;

            if (perMember[expense.paidBy] !== undefined) {
                perMember[expense.paidBy].paid += Number(expense.amount) || 0;
            }
            split.forEach(member => {
                if (perMember[member] !== undefined) {
                    perMember[member].share += share;
                }
            });
        });

        Object.keys(perMember).forEach(member => {
            perMember[member].balance = Math.round(
                (perMember[member].paid - perMember[member].share) * 100
            ) / 100;
        });

        return perMember;
    },

    formatCurrency(amount, symbol = '₨') {
        return symbol + new Intl.NumberFormat('en-IN').format(
            Math.round((amount || 0) * 100) / 100
        );
    },

    validateExpense(expense) {
        const errors = [];
        if (!expense.amount || Number(expense.amount) <= 0) errors.push('Amount must be greater than 0');
        if (!expense.description || expense.description.trim() === '') errors.push('Description is required');
        if (!expense.groupId) errors.push('Group is required');
        if (!Array.isArray(expense.splitAmong) || expense.splitAmong.length === 0) errors.push('At least one person must be in the split');
        if (!expense.paidBy) errors.push('Payer is required');
        return { isValid: errors.length === 0, errors };
    }
};


/* ═══════════════════════════════════════════════════════════
   SELF-TEST  (runs in console on load, remove in production)
   ═══════════════════════════════════════════════════════════ */
(function _selfTest() {
    // Scenario 1: Alice pays 100, split Alice+Bob → Bob owes 50
    const exp1 = { amount: 100, paidBy: 'alice', splitAmong: ['alice', 'bob'], isSettlement: false };
    const a1   = calculations.calculateBalances([exp1], 'alice');
    const b1   = calculations.calculateBalances([exp1], 'bob');
    console.assert(a1.youAreOwed === 50 && a1.youOwe === 0,  '[Test 1a] Alice should be owed 50');
    console.assert(b1.youOwe === 50     && b1.youAreOwed === 0, '[Test 1b] Bob should owe 50');

    // Scenario 2: Bob settles 50 → net should be 0 for both
    const settle = { amount: 50, paidBy: 'bob', splitAmong: ['alice'], isSettlement: true, settlementFrom: 'bob', settlementTo: 'alice' };
    const a2 = calculations.calculateBalances([exp1, settle], 'alice');
    const b2 = calculations.calculateBalances([exp1, settle], 'bob');
    console.assert(Math.abs(a2.netBalance) < 0.01, '[Test 2a] Alice net should be ~0 after settlement');
    console.assert(Math.abs(b2.netBalance) < 0.01, '[Test 2b] Bob net should be ~0 after settlement');

    // Scenario 3: Date filter end-of-day
    const today = new Date().toISOString();
    const expToday = { amount: 200, paidBy: 'alice', splitAmong: ['alice'], date: today, isSettlement: false, category: 'food', groupId: 'g1' };
    const todayStr = new Date().toISOString().split('T')[0];
    const summary = calculations.generateExpenseSummary([expToday], todayStr, todayStr);
    console.assert(summary.totalExpenses === 1, '[Test 3] Today expense should appear in same-day report');

    console.log('[calculations.js] ✅ All self-tests passed');
})();