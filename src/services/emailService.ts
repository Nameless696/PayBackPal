import ApiService from '../api/apiService';

type EmailPayload = {
  to: string;
  subject: string;
  body: string;
};

function dispatch(payload: EmailPayload): void {
  if (!payload.to) { console.warn('[EMAIL] Skipped — no recipient'); return; }
  ApiService.sendEmail(payload).catch(e => console.warn('[EMAIL] Send failed:', e.message));
}

export function sendGroupInvite(opts: { to: string; inviterName?: string; groupName: string }): void {
  if (!opts.to || !opts.groupName) return;
  dispatch({
    to: opts.to,
    subject: `You've been invited to "${opts.groupName}" on PayBackPal`,
    body: `Hi there!\n\n${opts.inviterName || 'Someone'} has invited you to join the group "${opts.groupName}" on PayBackPal.\n\nPayBackPal helps you track and settle shared expenses with ease.\n\nOpen the app to get started: http://localhost:8080\n\nCheers,\nThe PayBackPal Team`,
  });
}

export function sendMemberAdded(opts: { to: string; addedByName?: string; groupName: string }): void {
  if (!opts.to || !opts.groupName) return;
  dispatch({
    to: opts.to,
    subject: `You've been added to "${opts.groupName}" on PayBackPal`,
    body: `Hi!\n\n${opts.addedByName || 'Someone'} has added you to the group "${opts.groupName}" on PayBackPal so you can start splitting expenses together.\n\nOpen PayBackPal to view the group and its expenses.\n\nCheers,\nThe PayBackPal Team`,
  });
}

export function sendExpenseAlert(opts: { to: string; paidByName: string; expenseDescription: string; formattedAmount: string; groupName: string; currencySymbol?: string; perPerson?: number }): void {
  if (!opts.to) return;
  dispatch({
    to: opts.to,
    subject: `New expense in "${opts.groupName}": ${opts.formattedAmount}`,
    body: `Hi!\n\n${opts.paidByName} just added an expense in "${opts.groupName}".\n\n  📝 Description : ${opts.expenseDescription}\n  💰 Total       : ${opts.formattedAmount}\n  💸 Your share  : ${opts.currencySymbol ?? '₨'}${opts.perPerson?.toFixed(2) ?? '0.00'}\n\nOpen PayBackPal to view details and settle up.\n\nCheers,\nThe PayBackPal Team`,
  });
}

export function sendSettlementEmail(opts: { to: string; paidByName: string; formattedAmount: string; method?: string }): void {
  if (!opts.to) return;
  const methodLabels: Record<string, string> = { esewa: 'eSewa', khalti: 'Khalti', ime_pay: 'IME Pay', bank: 'Bank Transfer', cash: 'Cash' };
  const methodLabel = methodLabels[opts.method ?? 'cash'] ?? opts.method ?? 'Cash';
  dispatch({
    to: opts.to,
    subject: `${opts.paidByName} paid you ${opts.formattedAmount} via ${methodLabel}`,
    body: `Hi!\n\nGreat news — ${opts.paidByName} has settled a payment with you.\n\n  💳 Amount   : ${opts.formattedAmount}\n  🏦 Method   : ${methodLabel}\n  📅 Date     : ${new Date().toLocaleDateString()}\n\nIf you have not received this payment, please contact ${opts.paidByName} directly.\n\nCheers,\nThe PayBackPal Team`,
  });
}
