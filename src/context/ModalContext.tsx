import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';

// ── Bottom-sheet ref registry ─────────────────────────────────────

interface ModalContextValue {
  // Bottom sheets
  openAddExpense:      (groupId?: string) => void;
  closeAddExpense:     () => void;
  openCreateGroup:     () => void;
  closeCreateGroup:    () => void;
  openAddMember:       (groupId: string) => void;
  closeAddMember:      () => void;
  openSettle:          (groupId: string) => void;
  closeSettle:         () => void;
  openEditExpense:     (expenseId: string) => void;
  closeEditExpense:    () => void;
  openExpenseDetails:  (expenseId: string) => void;
  closeExpenseDetails: () => void;
  openEditProfile:     () => void;
  closeEditProfile:    () => void;
  openReceiptLightbox: (uri: string) => void;
  closeReceiptLightbox:() => void;

  // Sheet state (read by sheet components)
  addExpenseGroupId:   string | null;
  addMemberGroupId:    string | null;
  settleGroupId:       string | null;
  editExpenseId:       string | null;
  receiptUri:          string | null;

  // Sheet visibility flags
  addExpenseOpen:      boolean;
  createGroupOpen:     boolean;
  addMemberOpen:       boolean;
  settleOpen:          boolean;
  editExpenseOpen:     boolean;
  expenseDetailsOpen:  boolean;
  editProfileOpen:     boolean;
  receiptLightboxOpen: boolean;

  // Promise-based dialogs
  showConfirm: (message: string, opts?: { title?: string; okLabel?: string; danger?: boolean }) => Promise<boolean>;
  showPrompt:  (message: string, opts?: { title?: string; prefix?: string; placeholder?: string }) => Promise<string | null>;
}

const ModalContext = createContext<ModalContextValue | null>(null);

export function ModalProvider({ children }: { children: React.ReactNode }) {
  const [addExpenseOpen,      setAddExpenseOpen]      = useState(false);
  const [createGroupOpen,     setCreateGroupOpen]     = useState(false);
  const [addMemberOpen,       setAddMemberOpen]       = useState(false);
  const [settleOpen,          setSettleOpen]          = useState(false);
  const [editExpenseOpen,     setEditExpenseOpen]     = useState(false);
  const [expenseDetailsOpen,  setExpenseDetailsOpen]  = useState(false);
  const [editProfileOpen,     setEditProfileOpen]     = useState(false);
  const [receiptLightboxOpen, setReceiptLightboxOpen] = useState(false);

  const [addExpenseGroupId, setAddExpenseGroupId] = useState<string | null>(null);
  const [addMemberGroupId,  setAddMemberGroupId]  = useState<string | null>(null);
  const [settleGroupId,     setSettleGroupId]     = useState<string | null>(null);
  const [editExpenseId,     setEditExpenseId]     = useState<string | null>(null);
  const [receiptUri,        setReceiptUri]        = useState<string | null>(null);

  // Confirm dialog state
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [confirmMsg,     setConfirmMsg]     = useState('');
  const [confirmOpts,    setConfirmOpts]    = useState<{ title?: string; okLabel?: string; danger?: boolean }>({});
  const confirmResolveRef = useRef<((v: boolean) => void) | null>(null);

  // Prompt dialog state
  const [promptVisible,     setPromptVisible]     = useState(false);
  const [promptMsg,         setPromptMsg]         = useState('');
  const [promptOpts,        setPromptOpts]        = useState<{ title?: string; prefix?: string; placeholder?: string }>({});
  const [promptValue,       setPromptValue]       = useState('');
  const promptResolveRef = useRef<((v: string | null) => void) | null>(null);

  const showConfirm = useCallback((message: string, opts = {}): Promise<boolean> => {
    return new Promise(resolve => {
      setConfirmMsg(message);
      setConfirmOpts(opts);
      confirmResolveRef.current = resolve;
      setConfirmVisible(true);
    });
  }, []);

  const showPrompt = useCallback((message: string, opts = {}): Promise<string | null> => {
    return new Promise(resolve => {
      setPromptMsg(message);
      setPromptOpts(opts);
      setPromptValue('');
      promptResolveRef.current = resolve;
      setPromptVisible(true);
    });
  }, []);

  const value: ModalContextValue = {
    addExpenseOpen, createGroupOpen, addMemberOpen, settleOpen, editExpenseOpen, expenseDetailsOpen, editProfileOpen, receiptLightboxOpen,
    addExpenseGroupId, addMemberGroupId, settleGroupId, editExpenseId, receiptUri,

    openAddExpense:      (gId?) => { setAddExpenseGroupId(gId ?? null); setAddExpenseOpen(true); },
    closeAddExpense:     () => setAddExpenseOpen(false),
    openCreateGroup:     () => setCreateGroupOpen(true),
    closeCreateGroup:    () => setCreateGroupOpen(false),
    openAddMember:       (gId) => { setAddMemberGroupId(gId); setAddMemberOpen(true); },
    closeAddMember:      () => setAddMemberOpen(false),
    openSettle:          (gId) => { setSettleGroupId(gId); setSettleOpen(true); },
    closeSettle:         () => setSettleOpen(false),
    openEditExpense:     (id) => { setEditExpenseId(id); setEditExpenseOpen(true); },
    closeEditExpense:    () => setEditExpenseOpen(false),
    openExpenseDetails:  (id) => { setEditExpenseId(id); setExpenseDetailsOpen(true); },
    closeExpenseDetails: () => setExpenseDetailsOpen(false),
    openEditProfile:     () => setEditProfileOpen(true),
    closeEditProfile:    () => setEditProfileOpen(false),
    openReceiptLightbox: (uri) => { setReceiptUri(uri); setReceiptLightboxOpen(true); },
    closeReceiptLightbox:() => setReceiptLightboxOpen(false),

    showConfirm, showPrompt,
  };

  return (
    <ModalContext.Provider value={value}>
      {children}

      {/* ── Confirm Dialog ─────────────────────────────────── */}
      <Modal transparent visible={confirmVisible} animationType="fade" onRequestClose={() => { confirmResolveRef.current?.(false); setConfirmVisible(false); }}>
        <View style={styles.overlay}>
          <View style={styles.dialog}>
            {confirmOpts.title && <Text style={styles.dialogTitle}>{confirmOpts.title}</Text>}
            <Text style={styles.dialogMsg}>{confirmMsg}</Text>
            <View style={styles.dialogRow}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => { confirmResolveRef.current?.(false); setConfirmVisible(false); }}>
                <Text style={styles.cancelTxt}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.okBtn, confirmOpts.danger && styles.dangerBtn]}
                onPress={() => { confirmResolveRef.current?.(true); setConfirmVisible(false); }}>
                <Text style={styles.okTxt}>{confirmOpts.okLabel ?? 'Confirm'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Prompt Dialog ──────────────────────────────────── */}
      <Modal transparent visible={promptVisible} animationType="fade" onRequestClose={() => { promptResolveRef.current?.(null); setPromptVisible(false); }}>
        <View style={styles.overlay}>
          <View style={styles.dialog}>
            {promptOpts.title && <Text style={styles.dialogTitle}>{promptOpts.title}</Text>}
            <Text style={styles.dialogMsg}>{promptMsg}</Text>
            <View style={styles.promptInputRow}>
              {promptOpts.prefix && <Text style={styles.prefix}>{promptOpts.prefix}</Text>}
              <TextInput
                style={styles.promptInput}
                value={promptValue}
                onChangeText={setPromptValue}
                placeholder={promptOpts.placeholder ?? '0'}
                placeholderTextColor="#6B6890"
                keyboardType="numeric"
                autoFocus
              />
            </View>
            <View style={styles.dialogRow}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => { promptResolveRef.current?.(null); setPromptVisible(false); }}>
                <Text style={styles.cancelTxt}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.okBtn} onPress={() => { promptResolveRef.current?.(promptValue); setPromptVisible(false); }}>
                <Text style={styles.okTxt}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ModalContext.Provider>
  );
}

export function useModal(): ModalContextValue {
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error('useModal must be used inside ModalProvider');
  return ctx;
}

const styles = StyleSheet.create({
  overlay:      { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  dialog:       { backgroundColor: '#1A1A2E', borderRadius: 16, padding: 24, width: '100%', maxWidth: 340 },
  dialogTitle:  { color: '#F1F0FF', fontSize: 18, fontWeight: '700', marginBottom: 8 },
  dialogMsg:    { color: '#B8B5D1', fontSize: 15, lineHeight: 22, marginBottom: 20 },
  dialogRow:    { flexDirection: 'row', gap: 12 },
  cancelBtn:    { flex: 1, borderWidth: 1, borderColor: '#2D2B45', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  cancelTxt:    { color: '#B8B5D1', fontWeight: '600' },
  okBtn:        { flex: 1, backgroundColor: '#6C63FF', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  dangerBtn:    { backgroundColor: '#EF4444' },
  okTxt:        { color: '#FFF', fontWeight: '700' },
  promptInputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#242438', borderRadius: 10, paddingHorizontal: 14, marginBottom: 16 },
  prefix:       { color: '#6C63FF', fontSize: 16, fontWeight: '700', marginRight: 4 },
  promptInput:  { flex: 1, color: '#F1F0FF', fontSize: 18, fontWeight: '700', paddingVertical: 12 },
});
