const express = require('express');
const router  = express.Router();
const protect = require('../middleware/auth');
const {
    getExpenses,
    addExpense,
    getExpense,
    deleteExpense,
    settleDebt,
} = require('../controllers/expense.controller');

router.use(protect);

router.route('/')
    .get(getExpenses)
    .post(addExpense);

router.post('/settle', settleDebt);

router.route('/:id')
    .get(getExpense)
    .delete(deleteExpense);

module.exports = router;
