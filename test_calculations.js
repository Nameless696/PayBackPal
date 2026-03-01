
// Mock calculations.js content
const calculations = {
    calculateBalances(expenses, userId) {
        let youOwe = 0;
        let youAreOwed = 0;
        let totalExpenses = 0;
        
        expenses.forEach(expense => {
            totalExpenses += expense.amount;
            const shareAmount = expense.amount / expense.splitAmong.length;
            
            if (expense.paidBy === userId) {
                const owedAmount = shareAmount * (expense.splitAmong.length - 1);
                youAreOwed += owedAmount;
            } else {
                if (expense.splitAmong.includes(userId)) {
                    youOwe += shareAmount;
                }
            }
        });
        
        return {
            youOwe: Math.max(0, youOwe),
            youAreOwed: Math.max(0, youAreOwed),
            netBalance: youAreOwed - youOwe
        };
    }
};

// Test Scenario 1: Simple Debt
// Alice pays $100, split between Alice and Bob.
// Bob should owe $50.
const expense1 = {
    amount: 100,
    paidBy: 'alice',
    splitAmong: ['alice', 'bob']
};

console.log('--- Scenario 1 ---');
const aliceBal1 = calculations.calculateBalances([expense1], 'alice');
console.log('Alice Balance:', aliceBal1); // Exp: owed: 50, owe: 0
const bobBal1 = calculations.calculateBalances([expense1], 'bob');
console.log('Bob Balance:', bobBal1);     // Exp: owed: 0, owe: 50


// Test Scenario 2: Settlement
// Bob pays Alice $50 to settle.
// Logic in app: "Payment" expense.
// paidBy: Bob (payer), splitAmong: [Alice] (payee/consumer).
const settlement = {
    amount: 50,
    paidBy: 'bob',
    splitAmong: ['alice'],
    category: 'other' // distinct from settlement logic but used in calculcation
};

console.log('--- Scenario 2 (Settlement) ---');
const expenses2 = [expense1, settlement];

const aliceBal2 = calculations.calculateBalances(expenses2, 'alice');
console.log('Alice Balance:', aliceBal2);
// Alice paid 100 (split 2). Owed 50.
// Bob paid 50 (split 1). Alice consumed 50.
// Alice "owes" Bob 50 because Bob paid 50 and Alice is in split.
// Net: Alice Owed 50. Alice Owes 50. Net 0.

const bobBal2 = calculations.calculateBalances(expenses2, 'bob');
console.log('Bob Balance:', bobBal2);
// Bob Owe 50 (from exp1).
// Bob Paid 50 (settlement). Split [Alice].
// Bob Owed: 50 * (1-1) = 0? No. 
// splitAmong length is 1. share is 50. 
// paidBy (Bob) == userId. owed = 50 * (1 - 1) = 0.
// Wait. 
// If Bob paid 50, and split is [Alice].
// Bob paidBy=Bob. 
// owedAmount = share * (splitLen - 1) = 50 * (0) = 0.
// Bob gets 0 credit for paying!
