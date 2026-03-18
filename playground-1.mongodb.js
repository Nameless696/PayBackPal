/* global use, db */
// ============================================================
//  PayBackPal — MongoDB Playground
//  Database: paybackpal
//  Collections: users, groups, expenses, notifications
//  Run each section individually with Ctrl+Alt+R (or the ▶ button)
// ============================================================

use('paybackpal');

// ─────────────────────────────────────────────
// 1. INSPECT ALL COLLECTIONS
// ─────────────────────────────────────────────

// List all users (no passwords)
db.getCollection('users').find({}, { password: 0 });

// List all groups
// db.getCollection('groups').find({});

// List all expenses
// db.getCollection('expenses').find({});

// List all notifications
// db.getCollection('notifications').find({});


// ─────────────────────────────────────────────
// 2. USER QUERIES
// ─────────────────────────────────────────────

// Find a user by email
// db.getCollection('users').findOne({ email: 'test@example.com' }, { password: 0 });

// Count total registered users
// db.getCollection('users').countDocuments();


// ─────────────────────────────────────────────
// 3. GROUP QUERIES
// ─────────────────────────────────────────────

// Find all groups a user belongs to (replace email below)
// db.getCollection('groups').find({ 'members.email': 'test@example.com' });

// Find groups with more than 2 members
// db.getCollection('groups').find({ $expr: { $gt: [{ $size: '$members' }, 2] } });

// Count members per group
// db.getCollection('groups').aggregate([
//   { $project: { name: 1, memberCount: { $size: '$members' } } }
// ]);


// ─────────────────────────────────────────────
// 4. EXPENSE QUERIES
// ─────────────────────────────────────────────

// All expenses for a specific group (replace groupId)
// db.getCollection('expenses').find({ groupId: ObjectId('REPLACE_GROUP_ID') });

// Total spent per group
// db.getCollection('expenses').aggregate([
//   { $match: { isSettlement: false, isContribution: false } },
//   { $group: { _id: '$groupId', totalSpent: { $sum: '$amount' } } },
//   { $sort: { totalSpent: -1 } }
// ]);

// Expenses by category across all groups
// db.getCollection('expenses').aggregate([
//   { $match: { isSettlement: false } },
//   { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
//   { $sort: { total: -1 } }
// ]);

// All settlements
// db.getCollection('expenses').find({ isSettlement: true });

// Expenses in the last 30 days
// db.getCollection('expenses').find({
//   date: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
//   isSettlement: false
// }).sort({ date: -1 });

// Largest single expense
// db.getCollection('expenses').find({ isSettlement: false }).sort({ amount: -1 }).limit(1);


// ─────────────────────────────────────────────
// 5. NOTIFICATION QUERIES
// ─────────────────────────────────────────────

// Unread notifications for a user (replace userId)
// db.getCollection('notifications').find({
//   userId: ObjectId('REPLACE_USER_ID'),
//   read: false
// }).sort({ timestamp: -1 });

// Count unread per user
// db.getCollection('notifications').aggregate([
//   { $match: { read: false } },
//   { $group: { _id: '$userId', unreadCount: { $sum: 1 } } }
// ]);


// ─────────────────────────────────────────────
// 6. ADMIN / CLEANUP
// ─────────────────────────────────────────────

// Delete all expenses for a group (use with caution)
// db.getCollection('expenses').deleteMany({ groupId: ObjectId('REPLACE_GROUP_ID') });

// Delete a user by email
// db.getCollection('users').deleteOne({ email: 'test@example.com' });

// Mark all notifications as read for a user
// db.getCollection('notifications').updateMany(
//   { userId: ObjectId('REPLACE_USER_ID') },
//   { $set: { read: true } }
// );

// Drop entire database (⚠️ DANGER — only for dev reset)
// db.dropDatabase();
