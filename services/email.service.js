/**
 * PayBackPal - Email Service (v1.2 — Fixed)
 *
 * Fixes applied:
 *  1. CRITICAL: All public methods now accept EITHER an options object OR the
 *     original positional args — so they work correctly regardless of how
 *     app.js calls them. Previously all methods silently received `undefined`
 *     for most args because app.js passes objects while the old signatures
 *     expected positional args.
 *
 *     Example — old: sendGroupInvite(toEmail, inviterName, groupName)
 *               new: sendGroupInvite({ to, from, inviterName, groupName })
 *                    OR sendGroupInvite(toEmail, inviterName, groupName)  ← still works
 *
 *  2. _dispatch() now logs to console in a more readable format and gracefully
 *     handles missing StorageService.
 *
 *  3. sendExpenseAlert() now correctly reads currencySymbol from the options
 *     object instead of reaching into `app` global (which may not be ready).
 */

const EmailService = {

    // ── Core dispatcher ──────────────────────────────────────────

    /**
     * Log and (in v2.0) send an email.
     * @param {string} to
     * @param {string} subject
     * @param {string} body
     * @param {string|null} fromUser
     */
    _dispatch(to, subject, body, fromUser = null) {
        if (!to) { console.warn('[EMAIL] Skipped — no recipient address'); return; }

        const from = fromUser
            || (typeof AuthService !== 'undefined' && AuthService.getCurrentUser?.()?.email)
            || 'noreply@paybackpal.app';

        // Send via backend (Nodemailer) in background — fire & forget
        if (typeof ApiService !== 'undefined') {
            ApiService.sendEmail({ to, subject, body }).catch(e =>
                console.warn('[EMAIL] Backend send failed:', e.message)
            );
        }

        console.groupCollapsed(`[EMAIL] → ${to}`);
        console.log('Subject:', subject);
        console.log('Body:\n' + body);
        console.groupEnd();

        // Store in local email log for dev/demo visibility
        try {
            const emails = StorageService.get('paybackpal_email_log', []);
            emails.unshift({
                id:     Date.now().toString(),
                to, from, subject, body,
                sentAt: new Date().toISOString()
            });
            StorageService.save('paybackpal_email_log', emails.slice(0, 50));
        } catch (e) {
            console.warn('[EMAIL] Could not write to email log:', e);
        }
    },

    // ── Public API ───────────────────────────────────────────────
    //
    // Each method supports two calling conventions:
    //   1. Object:     sendGroupInvite({ to, inviterName, groupName })
    //   2. Positional: sendGroupInvite(toEmail, inviterName, groupName)

    /**
     * Send a group invite email.
     * app.js calls: EmailService.sendGroupInvite({ to, from, groupName })
     */
    sendGroupInvite(toOrOpts, inviterName, groupName) {
        const opts = typeof toOrOpts === 'object' && toOrOpts !== null ? toOrOpts : null;
        const to          = opts ? (opts.to || opts.toEmail) : toOrOpts;
        const inviter     = opts ? (opts.inviterName || opts.from || 'Someone') : (inviterName || 'Someone');
        const group       = opts ? opts.groupName : groupName;

        if (!to || !group) return;

        const subject = `You've been invited to "${group}" on PayBackPal`;
        const body = `Hi there!

${inviter} has invited you to join the group "${group}" on PayBackPal.

PayBackPal helps you track and settle shared expenses with ease.

Open the app to get started: https://paybackpal.app

Cheers,
The PayBackPal Team`.trim();

        this._dispatch(to, subject, body);
    },

    /**
     * Send an expense notification to all split members.
     * app.js calls: EmailService.sendExpenseAlert({ to, paidByName, expense, group, formattedAmount, currencySymbol })
     */
    sendExpenseAlert(toOrOpts, paidByName, expense, group, formattedAmount) {
        const opts = typeof toOrOpts === 'object' && toOrOpts !== null ? toOrOpts : null;
        const to          = opts ? (opts.to || opts.toEmail) : toOrOpts;
        const paidBy      = opts ? opts.paidByName  : (paidByName  || 'Someone');
        const exp         = opts ? opts.expense      : expense;
        const grp         = opts ? opts.group        : group;
        const fmtAmt      = opts ? opts.formattedAmount : formattedAmount;
        const symbol      = opts ? (opts.currencySymbol || '₨') : '₨';

        if (!to || !exp || !grp) return;

        const safeSplit = Array.isArray(exp.splitAmong) && exp.splitAmong.length ? exp.splitAmong : [exp.paidBy];
        const perPerson = ((Number(exp.amount) || 0) / safeSplit.length).toFixed(2);

        const subject = `New expense in "${grp.name}": ${fmtAmt}`;
        const body = `Hi!

${paidBy} just added an expense in "${grp.name}".

  📝 Description : ${exp.description}
  💰 Total       : ${fmtAmt}
  👥 Split among : ${safeSplit.length} people
  💸 Your share  : ${symbol}${perPerson}

Open PayBackPal to view details and settle up.

Cheers,
The PayBackPal Team`.trim();

        this._dispatch(to, subject, body);
    },

    /**
     * Send a settlement confirmation email.
     * app.js calls: EmailService.sendSettlementEmail({ to, paidByName, formattedAmount, method })
     */
    sendSettlementEmail(toOrOpts, paidByName, formattedAmount, method = 'cash') {
        const opts = typeof toOrOpts === 'object' && toOrOpts !== null ? toOrOpts : null;
        const to     = opts ? (opts.to || opts.toEmail) : toOrOpts;
        const paidBy = opts ? opts.paidByName    : (paidByName    || 'Someone');
        const fmtAmt = opts ? opts.formattedAmount : formattedAmount;
        const meth   = opts ? (opts.method || 'cash') : method;

        if (!to) return;

        const methodLabels = {
            esewa: 'eSewa', khalti: 'Khalti', ime_pay: 'IME Pay',
            bank: 'Bank Transfer', cash: 'Cash'
        };
        const methodLabel = methodLabels[meth] || meth;

        const subject = `${paidBy} paid you ${fmtAmt} via ${methodLabel}`;
        const body = `Hi!

Great news — ${paidBy} has settled a payment with you.

  💳 Amount   : ${fmtAmt}
  🏦 Method   : ${methodLabel}
  📅 Date     : ${new Date().toLocaleDateString()}

If you have not received this payment, please contact ${paidBy} directly.

Cheers,
The PayBackPal Team`.trim();

        this._dispatch(to, subject, body);
    },

    /**
     * Send a member-added notification.
     * app.js calls: EmailService.sendMemberAdded({ to, addedByName, groupName })
     */
    sendMemberAdded(toOrOpts, addedByName, groupName) {
        const opts = typeof toOrOpts === 'object' && toOrOpts !== null ? toOrOpts : null;
        const to      = opts ? (opts.to || opts.toEmail) : toOrOpts;
        const addedBy = opts ? opts.addedByName : (addedByName || 'Someone');
        const group   = opts ? opts.groupName   : groupName;

        if (!to || !group) return;

        const subject = `You've been added to "${group}" on PayBackPal`;
        const body = `Hi!

${addedBy} has added you to the group "${group}" on PayBackPal so you can start splitting expenses together.

Open PayBackPal to view the group and its expenses.

Cheers,
The PayBackPal Team`.trim();

        this._dispatch(to, subject, body);
    },

    // ── Dev helpers ──────────────────────────────────────────────

    getLog() {
        return StorageService.get('paybackpal_email_log', []);
    },

    clearLog() {
        StorageService.save('paybackpal_email_log', []);
    }
};