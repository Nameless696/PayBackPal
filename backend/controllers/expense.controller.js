/**
 * PayBackPal — Expense Controller
 */
const Expense = require('../models/Expense');
const Group   = require('../models/Group');

// ── Helper: verify user is member of the expense's group ──────────
const verifyAccess = async (expenseOrGroupId, userId) => {
    const group = await Group.findById(expenseOrGroupId);
    if (!group) return null;
    const ok = group.members.some(
        m => m.id === userId.toString() || m.userId?.toString() === userId.toString()
    );
    return ok ? group : null;
};

// ── GET /api/expenses?groupId=xxx ─────────────────────────────────
exports.getExpenses = async (req, res, next) => {
    try {
        const userId = req.user._id.toString();
        const { groupId } = req.query;

        let query = {};
        if (groupId) {
            // Verify user is member
            const group = await Group.findById(groupId);
            if (!group) return res.status(404).json({ message: 'Group not found' });
            const isMember = group.members.some(
                m => m.id === userId || m.userId?.toString() === userId
            );
            if (!isMember) return res.status(403).json({ message: 'Not a member of this group' });
            query.groupId = groupId;
        } else {
            // Return expenses from all groups the user belongs to
            const userGroups = await Group.find({ 'members.id': userId }, '_id');
            query.groupId = { $in: userGroups.map(g => g._id) };
        }

        const expenses = await Expense.find(query).sort('-date');
        res.json({ expenses: expenses.map(e => e.toJSON()) });
    } catch (err) { next(err); }
};

// ── POST /api/expenses ────────────────────────────────────────────
exports.addExpense = async (req, res, next) => {
    try {
        const {
            groupId, amount, description, category, paidBy, splitAmong,
            date, receipt, isSettlement, isContribution,
            settlementFrom, settlementTo, method,
            customCategoryName, customCategoryIcon, group: groupName,
        } = req.body;

        if (!groupId || !amount || !description) {
            return res.status(400).json({ message: 'groupId, amount and description are required' });
        }

        const group = await verifyAccess(groupId, req.user._id);
        if (!group) return res.status(403).json({ message: 'Group not found or access denied' });

        const expense = await Expense.create({
            groupId, amount: Number(amount), description: description.trim(),
            category: category || 'other',
            paidBy: paidBy || req.user._id.toString(),
            splitAmong: Array.isArray(splitAmong) && splitAmong.length ? splitAmong : [paidBy || req.user._id.toString()],
            date: date ? new Date(date) : new Date(),
            receipt: receipt || null,
            isSettlement: !!isSettlement,
            isContribution: !!isContribution,
            settlementFrom, settlementTo, method,
            customCategoryName, customCategoryIcon,
            group: groupName || group.name,
            createdBy: req.user._id,
        });

        res.status(201).json({ expense: expense.toJSON() });
    } catch (err) { next(err); }
};

// ── GET /api/expenses/:id ─────────────────────────────────────────
exports.getExpense = async (req, res, next) => {
    try {
        const expense = await Expense.findById(req.params.id);
        if (!expense) return res.status(404).json({ message: 'Expense not found' });

        const group = await verifyAccess(expense.groupId, req.user._id);
        if (!group) return res.status(403).json({ message: 'Access denied' });

        res.json({ expense: expense.toJSON() });
    } catch (err) { next(err); }
};

// ── DELETE /api/expenses/:id ──────────────────────────────────────
exports.deleteExpense = async (req, res, next) => {
    try {
        const expense = await Expense.findById(req.params.id);
        if (!expense) return res.status(404).json({ message: 'Expense not found' });

        const group = await verifyAccess(expense.groupId, req.user._id);
        if (!group) return res.status(403).json({ message: 'Access denied' });

        // Only expense creator or group admin can delete
        const isAdmin  = group.createdBy.toString() === req.user._id.toString();
        const isAuthor = expense.createdBy?.toString() === req.user._id.toString();
        if (!isAdmin && !isAuthor) {
            return res.status(403).json({ message: 'Not allowed to delete this expense' });
        }

        await expense.deleteOne();
        res.json({ message: 'Expense deleted' });
    } catch (err) { next(err); }
};

// ── POST /api/expenses/settle ─────────────────────────────────────
exports.settleDebt = async (req, res, next) => {
    try {
        const { groupId, fromUser, toUser, amount, method } = req.body;
        if (!groupId || !toUser || !amount) {
            return res.status(400).json({ message: 'groupId, toUser and amount are required' });
        }

        const group = await verifyAccess(groupId, req.user._id);
        if (!group) return res.status(403).json({ message: 'Group not found or access denied' });

        const expense = await Expense.create({
            groupId,
            amount:      Number(amount),
            description: `Settlement → ${toUser}`,
            category:    'settlement',
            paidBy:      fromUser || req.user._id.toString(),
            splitAmong:  [toUser],
            date:        new Date(),
            isSettlement:   true,
            settlementFrom: fromUser || req.user._id.toString(),
            settlementTo:   toUser,
            method:         method || 'cash',
            group:          group.name,
            createdBy:      req.user._id,
        });

        res.status(201).json({ expense: expense.toJSON() });
    } catch (err) { next(err); }
};
