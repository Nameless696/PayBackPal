import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView, Alert } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { useModal } from '../../context/ModalContext';
import { calculateGroupBalances, minimizeTransactions } from '../../utils/calculations';
import { getCategoryIcon } from '../../constants/categories';
import type { MainScreenProps } from '../../navigation/types';

export default function GroupDetailsScreen({ navigation, route }: MainScreenProps<'GroupDetails'>) {
  const { groupId } = route.params;
  const { user } = useAuth();
  const { groups, expenses, fmt, deleteGroup, removeMember, archiveGroup, addNotification } = useApp();
  const { openAddExpense, openAddMember, openSettle, openEditExpense, showConfirm } = useModal();
  const [showSimplify, setShowSimplify] = useState(false);

  const group = groups.find(g => g.id === groupId);
  const groupExp = expenses.filter(e => e.groupId === groupId);

  if (!group) {
    return (
      <SafeAreaView style={s.safe}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Text style={s.backTxt}>← Back</Text>
        </TouchableOpacity>
        <View style={s.empty}><Text style={s.emptyTxt}>Group not found</Text></View>
      </SafeAreaView>
    );
  }

  const userId = user?.id ?? '';
  const balances = calculateGroupBalances(groupExp, userId);
  const totalAmt = groupExp.filter(e => !e.isSettlement).reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const simplified = minimizeTransactions(groupExp);

  const memberMap = Object.fromEntries(group.members.map(m => [m.id, m.name]));

  async function handleDeleteGroup() {
    const ok = await showConfirm(`Delete "${group!.name}"? This cannot be undone.`, { title: 'Delete Group', okLabel: 'Delete', danger: true });
    if (!ok) return;
    await deleteGroup(groupId);
    navigation.goBack();
  }

  async function handleArchive() {
    await archiveGroup(groupId, !group!.isArchived);
    addNotification('group_updated', `Group "${group!.name}" ${group!.isArchived ? 'unarchived' : 'archived'}`);
    navigation.goBack();
  }

  async function handleRemoveMember(memberId: string, memberName: string) {
    const ok = await showConfirm(`Remove ${memberName} from this group?`, { title: 'Remove Member', okLabel: 'Remove', danger: true });
    if (!ok) return;
    await removeMember(groupId, memberId);
    addNotification('member_removed', `${memberName} removed from "${group!.name}"`);
  }

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView>
        {/* Hero */}
        <LinearGradient colors={['#6C63FF', '#4F9EFF']} style={s.hero}>
          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
            <Text style={s.backTxt}>← Back</Text>
          </TouchableOpacity>
          <Text style={s.groupIcon}>{group.iconType === 'emoji' ? group.icon : '👥'}</Text>
          <Text style={s.groupName}>{group.name}</Text>
          {group.description ? <Text style={s.groupDesc}>{group.description}</Text> : null}
          <Text style={s.memberCount}>{group.members.length} member{group.members.length !== 1 ? 's' : ''}</Text>

          {/* Stats */}
          <View style={s.statsRow}>
            <View style={s.statBox}><Text style={s.statLabel}>TOTAL</Text><Text style={s.statVal}>{fmt(totalAmt)}</Text></View>
            <View style={s.statDivider} />
            <View style={s.statBox}><Text style={s.statLabel}>OWED TO YOU</Text><Text style={[s.statVal, { color: '#86EFAC' }]}>{fmt(balances.youAreOwed)}</Text></View>
            <View style={s.statDivider} />
            <View style={s.statBox}><Text style={s.statLabel}>YOU OWE</Text><Text style={[s.statVal, { color: '#FCA5A5' }]}>{fmt(balances.youOwe)}</Text></View>
          </View>
        </LinearGradient>

        {/* Action row */}
        <View style={s.actionRow}>
          <TouchableOpacity style={s.actionBtn} onPress={() => openAddExpense(groupId)}>
            <Text style={s.actionTxt}>+ Expense</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.actionBtn} onPress={() => openAddMember(groupId)}>
            <Text style={s.actionTxt}>+ Member</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.actionBtnGhost} onPress={() => openSettle(groupId)}>
            <Text style={s.actionTxtGhost}>⚖️ Settle</Text>
          </TouchableOpacity>
        </View>

        {/* Expenses */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Expenses ({groupExp.filter(e => !e.isSettlement).length})</Text>
          {groupExp.filter(e => !e.isSettlement).length === 0 ? (
            <View style={s.empty}><Text style={s.emptyTxt}>No expenses yet</Text></View>
          ) : [...groupExp].filter(e => !e.isSettlement).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(exp => (
            <TouchableOpacity key={exp.id} style={s.expRow} onPress={() => openEditExpense(exp.id)}>
              <Text style={s.expIcon}>{getCategoryIcon(exp.category, exp.customCategoryIcon)}</Text>
              <View style={{ flex: 1 }}>
                <Text style={s.expDesc}>{exp.description}</Text>
                <Text style={s.expMeta}>Paid by {memberMap[exp.paidBy] ?? exp.paidBy} · {new Date(exp.date).toLocaleDateString()}</Text>
              </View>
              <Text style={s.expAmt}>{fmt(exp.amount)}</Text>
            </TouchableOpacity>
          ))}
          {groupExp.filter(e => e.isSettlement).map(exp => (
            <View key={exp.id} style={[s.expRow, { opacity: 0.6 }]}>
              <Text style={s.expIcon}>✅</Text>
              <View style={{ flex: 1 }}>
                <Text style={s.expDesc}>{exp.description}</Text>
                <Text style={s.expMeta}>{new Date(exp.date).toLocaleDateString()}</Text>
              </View>
              <Text style={[s.expAmt, { color: '#22C55E' }]}>{fmt(exp.amount)}</Text>
            </View>
          ))}
        </View>

        {/* Members */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Members ({group.members.length})</Text>
          {group.members.map(member => (
            <View key={member.id} style={s.memberRow}>
              <View style={s.memberAvatar}>
                <Text style={s.memberAvatarTxt}>{member.name.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.memberName}>{member.name}</Text>
                <Text style={s.memberEmail}>{member.email}</Text>
              </View>
              {member.id !== userId && (
                <TouchableOpacity onPress={() => handleRemoveMember(member.id, member.name)}>
                  <Text style={{ color: '#EF4444', fontSize: 13 }}>Remove</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>

        {/* Simplify Debts */}
        <View style={s.section}>
          <TouchableOpacity onPress={() => setShowSimplify(v => !v)} style={s.simplifyToggle}>
            <Text style={s.simplifyToggleTxt}>🔁 Simplify Debts {showSimplify ? '▼' : '▶'}</Text>
          </TouchableOpacity>
          {showSimplify && (
            <View style={s.simplifyCard}>
              {simplified.transactions.length === 0 ? (
                <Text style={{ color: '#22C55E', fontWeight: '600' }}>All settled up! ✅</Text>
              ) : simplified.transactions.map((t, i) => (
                <Text key={i} style={s.simplifyRow}>
                  {memberMap[t.from] ?? t.from} → {memberMap[t.to] ?? t.to}: <Text style={{ fontWeight: '700', color: '#F1F0FF' }}>{fmt(t.amount)}</Text>
                </Text>
              ))}
              {simplified.savings > 0 && <Text style={s.savingsTxt}>Saves {simplified.savings} transaction{simplified.savings !== 1 ? 's' : ''}</Text>}
            </View>
          )}
        </View>

        {/* Danger zone */}
        <View style={[s.section, { paddingBottom: 32 }]}>
          <TouchableOpacity style={s.archiveBtn} onPress={handleArchive}>
            <Text style={s.archiveTxt}>{group.isArchived ? 'Unarchive Group' : 'Archive Group'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.deleteBtn} onPress={handleDeleteGroup}>
            <Text style={s.deleteTxt}>Delete Group</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0F0F1A' },
  hero: { padding: 24, paddingBottom: 28 },
  backBtn: { marginBottom: 12 },
  backTxt: { color: 'rgba(255,255,255,0.8)', fontSize: 15 },
  groupIcon: { fontSize: 48, textAlign: 'center', marginBottom: 8 },
  groupName: { fontSize: 24, fontWeight: '800', color: '#FFF', textAlign: 'center' },
  groupDesc: { color: 'rgba(255,255,255,0.7)', fontSize: 14, textAlign: 'center', marginTop: 4 },
  memberCount: { color: 'rgba(255,255,255,0.6)', fontSize: 13, textAlign: 'center', marginTop: 4, marginBottom: 16 },
  statsRow: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 12, padding: 12 },
  statBox: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)' },
  statLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 10, marginBottom: 4, fontWeight: '600' },
  statVal: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  actionRow: { flexDirection: 'row', padding: 16, gap: 10 },
  actionBtn: { flex: 1, backgroundColor: '#6C63FF', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  actionTxt: { color: '#FFF', fontWeight: '700', fontSize: 14 },
  actionBtnGhost: { flex: 1, borderWidth: 1, borderColor: '#6C63FF', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  actionTxtGhost: { color: '#6C63FF', fontWeight: '700', fontSize: 14 },
  section: { paddingHorizontal: 16, paddingBottom: 8 },
  sectionTitle: { color: '#F1F0FF', fontSize: 16, fontWeight: '700', marginBottom: 10 },
  empty: { backgroundColor: '#1A1A2E', borderRadius: 10, padding: 16, alignItems: 'center' },
  emptyTxt: { color: '#6B6890', fontSize: 14 },
  expRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1A1A2E', borderRadius: 10, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: '#2D2B45' },
  expIcon: { fontSize: 22, marginRight: 10 },
  expDesc: { color: '#F1F0FF', fontSize: 14, fontWeight: '600' },
  expMeta: { color: '#6B6890', fontSize: 12, marginTop: 2 },
  expAmt: { color: '#F1F0FF', fontSize: 14, fontWeight: '700' },
  memberRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1A1A2E', borderRadius: 10, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: '#2D2B45' },
  memberAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#6C63FF', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  memberAvatarTxt: { color: '#FFF', fontWeight: '700', fontSize: 15 },
  memberName: { color: '#F1F0FF', fontSize: 14, fontWeight: '600' },
  memberEmail: { color: '#6B6890', fontSize: 12, marginTop: 2 },
  simplifyToggle: { paddingVertical: 12 },
  simplifyToggleTxt: { color: '#6C63FF', fontWeight: '700', fontSize: 14 },
  simplifyCard: { backgroundColor: '#1A1A2E', borderRadius: 10, padding: 14, borderWidth: 1, borderColor: '#2D2B45' },
  simplifyRow: { color: '#B8B5D1', fontSize: 14, marginBottom: 6, lineHeight: 20 },
  savingsTxt: { color: '#22C55E', fontSize: 12, marginTop: 6 },
  archiveBtn: { borderWidth: 1, borderColor: '#2D2B45', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginBottom: 10 },
  archiveTxt: { color: '#B8B5D1', fontWeight: '600' },
  deleteBtn: { borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  deleteTxt: { color: '#EF4444', fontWeight: '600' },
});
