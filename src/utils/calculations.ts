// Pure financial calculations — direct port of calculations.js
import type { Expense, Group, Member, Balances, MinimizedTransactions, DebtTransaction } from '../types';

// ── Core: single-user balance ────────────────────────────────────

export function calculateBalances(expenses: Expense[], userId: string): Balances {
  const net: Record<string, { pos: string; neg: string; amount: number }> = {};

  const bump = (a: string, b: string, amt: number) => {
    const key = [a, b].sort().join('::');
    if (!net[key]) net[key] = { pos: a, neg: b, amount: 0 };
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
      const payee = split[0];
      if (payer !== payee) bump(payer, payee, Number(expense.amount) || 0);
      return;
    }

    split.forEach(member => {
      if (member !== payer) bump(payer, member, share);
    });
  });

  let youOwe = 0;
  let youAreOwed = 0;

  Object.values(net).forEach(({ pos, neg, amount }) => {
    if (Math.abs(amount) < 0.01) return;
    if (pos === userId) {
      youAreOwed += Math.max(0, amount);
      youOwe     += Math.max(0, -amount);
    } else if (neg === userId) {
      youOwe     += Math.max(0, amount);
      youAreOwed += Math.max(0, -amount);
    }
  });

  return {
    youOwe:       Math.round(youOwe * 100) / 100,
    youAreOwed:   Math.round(youAreOwed * 100) / 100,
    netBalance:   Math.round((youAreOwed - youOwe) * 100) / 100,
    totalExpenses: expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0),
  };
}

export function calculateGroupBalances(groupExpenses: Expense[], userId: string): Omit<Balances, 'totalExpenses'> {
  const { youOwe, youAreOwed, netBalance } = calculateBalances(groupExpenses, userId);
  return { youOwe, youAreOwed, netBalance };
}

// ── Detailed: who owes whom ────────────────────────────────────

export function calculateDetailedBalances(expenses: Expense[]): Record<string, number> {
  const pairs: Record<string, { creditor: string; debtor: string; net: number }> = {};

  expenses.forEach(expense => {
    const split = Array.isArray(expense.splitAmong) && expense.splitAmong.length
      ? expense.splitAmong : [expense.paidBy];
    const payer = expense.paidBy;
    const amount = Number(expense.amount) || 0;

    if (expense.isSettlement) {
      const payee = split[0];
      if (payer !== payee) {
        const key = [payer, payee].sort().join('::');
        if (!pairs[key]) pairs[key] = { creditor: payee, debtor: payer, net: 0 };
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

  const result: Record<string, number> = {};
  Object.values(pairs).forEach(({ creditor, debtor, net }) => {
    if (net > 0.01)       result[`${debtor}->${creditor}`] = Math.round(net * 100) / 100;
    else if (net < -0.01) result[`${creditor}->${debtor}`] = Math.round(-net * 100) / 100;
  });
  return result;
}

// ── Transaction minimizer ────────────────────────────────────────

export function minimizeTransactions(expenses: Expense[]): MinimizedTransactions {
  const netBalances: Record<string, number> = {};

  expenses.forEach(expense => {
    const split = Array.isArray(expense.splitAmong) && expense.splitAmong.length
      ? expense.splitAmong : [expense.paidBy];
    const payer  = expense.paidBy;
    const amount = Number(expense.amount) || 0;

    if (!netBalances[payer]) netBalances[payer] = 0;

    if (expense.isSettlement) {
      const payee = split[0];
      if (!netBalances[payee]) netBalances[payee] = 0;
      netBalances[payer] += amount;
      netBalances[payee] -= amount;
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

  const creditors: { person: string; amount: number }[] = [];
  const debtors:   { person: string; amount: number }[] = [];

  Object.entries(netBalances).forEach(([person, balance]) => {
    if (balance >  0.01) creditors.push({ person, amount: balance });
    if (balance < -0.01) debtors.push({ person, amount: Math.abs(balance) });
  });

  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  const transactions: DebtTransaction[] = [];
  let i = 0, j = 0;

  while (i < creditors.length && j < debtors.length) {
    const creditor = creditors[i];
    const debtor   = debtors[j];
    const transfer = Math.min(creditor.amount, debtor.amount);

    transactions.push({ from: debtor.person, to: creditor.person, amount: Math.round(transfer * 100) / 100 });

    creditor.amount -= transfer;
    debtor.amount   -= transfer;

    if (creditor.amount < 0.01) i++;
    if (debtor.amount   < 0.01) j++;
  }

  const originalCount = Object.keys(calculateDetailedBalances(expenses)).length;
  return { transactions, originalCount, optimizedCount: transactions.length, savings: Math.max(0, originalCount - transactions.length) };
}

// ── Utilities ─────────────────────────────────────────────────────

export function calculateSplit(amount: number, members: Member[], splitType = 'equal') {
  if (splitType === 'equal') {
    const perPerson = amount / members.length;
    return members.map(member => ({ member, amount: Math.round(perPerson * 100) / 100 }));
  }
  return [];
}

export function generateExpenseSummary(expenses: Expense[], startDate?: string | null, endDate?: string | null) {
  let filtered = expenses.filter(e => !e.isSettlement);

  if (startDate) {
    const start = new Date(startDate); start.setHours(0, 0, 0, 0);
    filtered = filtered.filter(e => new Date(e.date) >= start);
  }
  if (endDate) {
    const end = new Date(endDate); end.setHours(23, 59, 59, 999);
    filtered = filtered.filter(e => new Date(e.date) <= end);
  }

  const summary = {
    totalExpenses:  filtered.length,
    totalAmount:    Math.round(filtered.reduce((s, e) => s + (Number(e.amount) || 0), 0) * 100) / 100,
    byCategory:     {} as Record<string, number>,
    byGroup:        {} as Record<string, number>,
    byPayer:        {} as Record<string, number>,
    averageExpense: 0,
    highestExpense: null as Expense | null,
    lowestExpense:  null as Expense | null,
  };

  filtered.forEach(expense => {
    const amt = Number(expense.amount) || 0;
    summary.byCategory[expense.category] = (summary.byCategory[expense.category] || 0) + amt;
    summary.byGroup[expense.groupId]      = (summary.byGroup[expense.groupId]      || 0) + amt;
    summary.byPayer[expense.paidBy]       = (summary.byPayer[expense.paidBy]       || 0) + amt;
  });

  if (filtered.length > 0) {
    summary.averageExpense = Math.round((summary.totalAmount / filtered.length) * 100) / 100;
    const sorted = [...filtered].sort((a, b) => a.amount - b.amount);
    summary.lowestExpense  = sorted[0];
    summary.highestExpense = sorted[sorted.length - 1];
  }

  return summary;
}

export function calculateGroupStats(group: Group, expenses: Expense[]) {
  const groupExpenses = expenses.filter(e => e.groupId === group.id && !e.isSettlement);
  const memberCount   = (group.members || []).length || 1;
  return {
    totalExpenses:    groupExpenses.length,
    totalAmount:      Math.round(groupExpenses.reduce((s, e) => s + (Number(e.amount) || 0), 0) * 100) / 100,
    averagePerPerson: Math.round((groupExpenses.reduce((s, e) => s + (Number(e.amount) || 0), 0) / memberCount) * 100) / 100,
    perMemberExpenses: calculatePerMemberExpenses(groupExpenses, group.members || []),
  };
}

export function calculatePerMemberExpenses(expenses: Expense[], members: (Member | string)[]) {
  const perMember: Record<string, { paid: number; share: number; balance: number }> = {};
  members.forEach(m => {
    const id = typeof m === 'string' ? m : m.id;
    perMember[id] = { paid: 0, share: 0, balance: 0 };
  });

  expenses.forEach(expense => {
    const split = Array.isArray(expense.splitAmong) && expense.splitAmong.length
      ? expense.splitAmong : [expense.paidBy];
    const share = (Number(expense.amount) || 0) / split.length;

    if (perMember[expense.paidBy] !== undefined) perMember[expense.paidBy].paid += Number(expense.amount) || 0;
    split.forEach(member => {
      if (perMember[member] !== undefined) perMember[member].share += share;
    });
  });

  Object.keys(perMember).forEach(member => {
    perMember[member].balance = Math.round((perMember[member].paid - perMember[member].share) * 100) / 100;
  });

  return perMember;
}

export function formatCurrency(amount: number, symbol = '₨'): string {
  return symbol + new Intl.NumberFormat('en-IN').format(Math.round((amount || 0) * 100) / 100);
}

export function validateExpense(expense: Partial<Expense>): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!expense.amount || Number(expense.amount) <= 0) errors.push('Amount must be greater than 0');
  if (!expense.description?.trim()) errors.push('Description is required');
  if (!expense.groupId) errors.push('Group is required');
  if (!Array.isArray(expense.splitAmong) || expense.splitAmong.length === 0) errors.push('At least one person must be in the split');
  if (!expense.paidBy) errors.push('Payer is required');
  return { isValid: errors.length === 0, errors };
}
