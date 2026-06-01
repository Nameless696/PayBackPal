import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView, TextInput, Image, Alert, StatusBar, Platform } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { Camera } from 'lucide-react-native';
import { useApp } from '../../context/AppContext';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useAuth } from '../../context/AuthContext';
import { useModal } from '../../context/ModalContext';
import { calculateGroupBalances, minimizeTransactions } from '../../utils/calculations';
import { getCategoryIcon } from '../../constants/categories';
import type { MainScreenProps } from '../../navigation/types';
import { launchImageLibrary } from 'react-native-image-picker';
import RNShare from 'react-native-share';
import AnimatedPressable from '../../components/ui/AnimatedPressable';
import ApiService from '../../api/apiService';
import Toast from 'react-native-toast-message';

export default function GroupDetailsScreen({ navigation, route }: MainScreenProps<'GroupDetails'>) {
  const { groupId } = route.params;
  const { user } = useAuth();
  const { groups, expenses, fmt, deleteGroup, updateGroup, removeMember, archiveGroup, addNotification } = useApp();
  const { openAddExpense, openAddMember, openSettle, openEditExpense, openExpenseDetails, showConfirm } = useModal();
  const [showSimplify, setShowSimplify] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const C = useThemeColors();

  const group = groups.find(g => g.id === groupId);
  const groupExp = expenses.filter(e => e.groupId === groupId);
  const filteredExp = groupExp.filter(e => e.description.toLowerCase().includes(searchQuery.toLowerCase()) || e.amount.toString().includes(searchQuery.toLowerCase()));

  if (!group) {
    return (
      <SafeAreaView className="flex-1 bg-bg-body">
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Text style={s.backTxt}>← Back</Text>
        </TouchableOpacity>
        <View style={s.empty}><Text style={s.emptyTxt}>Group not found</Text></View>
      </SafeAreaView>
    );
  }

  const userId  = user?.id ?? '';
  const isAdmin  = group.createdBy === userId ||
                   group.members.some(m => m.id === userId && (m as any).role === 'admin');
  const balances = calculateGroupBalances(groupExp, userId);
  const totalAmt = groupExp.filter(e => !e.isSettlement).reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const simplified = minimizeTransactions(groupExp);

  const memberMap = Object.fromEntries(group.members.map(m => [m.id, m.name]));

  async function handleEditImage() {
    launchImageLibrary({ mediaType: 'photo', includeBase64: true, quality: 0.1, maxWidth: 400, maxHeight: 400 }, res => {
      if (res.assets?.[0]?.base64) {
        updateGroup(groupId, { iconType: 'image', icon: `data:image/jpeg;base64,${res.assets[0].base64}` });
        addNotification('group_updated', `Group "${group!.name}" photo updated`);
      }
    });
  }

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

  async function handleLeaveGroup() {
    const ok = await showConfirm(
      'Remove yourself from this group? You can rejoin using the invite code.',
      { title: 'Leave Group', okLabel: 'Leave', danger: false }
    );
    if (!ok) return;
    await removeMember(groupId, userId);
    navigation.goBack();
  }

  async function handleRemoveMember(memberId: string, memberName: string) {
    const ok = await showConfirm(`Remove ${memberName} from this group?`, { title: 'Remove Member', okLabel: 'Remove', danger: true });
    if (!ok) return;
    await removeMember(groupId, memberId);
    addNotification('member_removed', `${memberName} removed from "${group!.name}"`);
  }

  async function handleExportPDF() {
    try {
      Toast.show({ type: 'info', text1: 'Generating PDF...' });
      const res = await ApiService.getGroupReport(groupId);
      if (res?.pdf) {
        // Use react-native-share to share the base64 PDF directly
        await RNShare.open({
          url: `data:application/pdf;base64,${res.pdf}`,
          filename: res.filename || 'GroupReport.pdf',
          title: `PayBackPal Report for ${group!.name}`,
          type: 'application/pdf',
        });
        Toast.show({ type: 'success', text1: 'PDF Generated!', text2: 'Share sheet opened' });
      }
    } catch (e: any) {
      if (e.message !== 'User did not share') {
        Toast.show({ type: 'error', text1: 'PDF export failed', text2: e.message });
      }
    }
  }

  async function handleSendReminders() {
    const ok = await showConfirm(
      'Send email reminders to all members who owe money in this group?',
      { title: 'Send Reminders', okLabel: 'Send' }
    );
    if (!ok) return;
    try {
      const res = await ApiService.sendGroupReminders(groupId);
      Toast.show({ type: 'success', text1: `Sent ${res?.sent || 0} reminder(s)!` });
    } catch (e: any) {
      Toast.show({ type: 'error', text1: 'Failed to send reminders', text2: e.message });
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-bg-body">
      <ScrollView>
        {/* Hero */}
        <LinearGradient colors={['#3B2A6A', '#5B52E8', '#6C63FF']} style={s.hero}>
          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
            <Text style={s.backTxt}>← Back</Text>
          </TouchableOpacity>
          
          {isAdmin ? (
            <TouchableOpacity onPress={handleEditImage} style={{ alignSelf: 'center', position: 'relative', marginBottom: 10 }}>
              {group.iconType === 'image' && group.icon && group.icon.length > 5 ? (
                <Image source={{ uri: group.icon }} style={{ width: 80, height: 80, borderRadius: 22, borderWidth: 2, borderColor: 'rgba(255,255,255,0.8)' }} />
              ) : (
                <View style={{ width: 80, height: 80, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' }}>
                   <Text style={{ fontSize: 36 }}>{group.iconType === 'emoji' ? group.icon : '👥'}</Text>
                </View>
              )}
              <View style={{ position: 'absolute', bottom: -4, right: -4, backgroundColor: '#0F0F1A', borderRadius: 14, width: 28, height: 28, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#6C63FF' }}>
                <Camera color="#A5A0FF" size={12} />
              </View>
            </TouchableOpacity>
          ) : (
            <View style={{ alignSelf: 'center', marginBottom: 10 }}>
              {group.iconType === 'image' && group.icon && group.icon.length > 5 ? (
                <Image source={{ uri: group.icon }} style={{ width: 80, height: 80, borderRadius: 22, borderWidth: 2, borderColor: 'rgba(255,255,255,0.8)' }} />
              ) : (
                <View style={{ width: 80, height: 80, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' }}>
                  <Text style={{ fontSize: 36 }}>{group.iconType === 'emoji' ? group.icon : '👥'}</Text>
                </View>
              )}
            </View>
          )}

          <Text style={s.groupName}>{group.name}</Text>
          {group.description ? <Text style={s.groupDesc}>{group.description}</Text> : null}
          <Text style={s.memberCount}>{group.members.length} member{group.members.length !== 1 ? 's' : ''}</Text>

          {/* Settlement Progress */}
          {(() => {
            const totalDebts = simplified.transactions.length + (groupExp.filter(e => e.isSettlement).length);
            const settledCount = groupExp.filter(e => e.isSettlement).length;
            const progress = totalDebts > 0 ? settledCount / totalDebts : 1;
            return (
              <View style={{ alignSelf: 'stretch', paddingHorizontal: 24, marginBottom: 6 }}>
                <View style={{ height: 6, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 3, overflow: 'hidden' }}>
                  <View style={{ width: `${Math.round(progress * 100)}%`, height: '100%', backgroundColor: '#00C48C', borderRadius: 3 }} />
                </View>
                <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12, marginTop: 6, textAlign: 'center' }}>
                  {simplified.transactions.length === 0 ? 'All settled up ✅' : `${settledCount} of ${totalDebts} debts settled`}
                </Text>
              </View>
            );
          })()}

          {/* Member Avatars Row — Issue 6 */}
          <View style={{ flexDirection: 'row', alignSelf: 'center', marginTop: 12, marginBottom: 12 }}>
            {group.members.slice(0, 5).map((m, i) => (
              <View key={m.id} style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: '#6C63FF', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#FFF', marginLeft: i === 0 ? 0 : -10, zIndex: 5 - i }}>
                <Text style={{ color: '#FFF', fontSize: 13, fontWeight: '700' }}>{m.name.charAt(0).toUpperCase()}</Text>
              </View>
            ))}
            {group.members.length > 5 && (
              <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#FFF', marginLeft: -10 }}>
                <Text style={{ color: '#FFF', fontSize: 10, fontWeight: '700' }}>+{group.members.length - 5}</Text>
              </View>
            )}
          </View>

          {/* Stat Pills — Issue 6 */}
          <View style={{ flexDirection: 'row', alignSelf: 'center', gap: 10, marginBottom: 10 }}>
            <View style={{ backgroundColor: 'rgba(255,255,255,0.12)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 }}>
              <Text style={{ color: '#FFF', fontSize: 12, fontWeight: '600' }}>{fmt(totalAmt)} total</Text>
            </View>
            <View style={{ backgroundColor: 'rgba(255,255,255,0.12)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 }}>
              <Text style={{ color: '#FFF', fontSize: 12, fontWeight: '600' }}>{groupExp.filter(e => !e.isSettlement).length} expenses</Text>
            </View>
          </View>

          {/* Invite Code Chip */}
          <TouchableOpacity onPress={() => RNShare.open({ message: `Join my PayBackPal group! Invite code: ${group.id}`, title: 'PayBackPal Invite' }).catch(() => {})} style={{ backgroundColor: 'rgba(255,255,255,0.1)', alignSelf: 'center', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 12 }}>
              Invite: <Text style={{ color: '#fff', fontWeight: 'bold' }}>{group.id.slice(0, 8)}…</Text>
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>📋</Text>
          </TouchableOpacity>

          {/* Stats */}
          <View style={s.statsRow}>
            <View style={s.statBox}><Text style={s.statLabel}>TOTAL</Text><Text style={s.statVal}>{fmt(totalAmt)}</Text></View>
            <View style={s.statDivider} />
            <View style={s.statBox}><Text style={s.statLabel}>OWED TO YOU</Text><Text style={[s.statVal, { color: '#86EFAC' }]}>{fmt(balances.youAreOwed)}</Text></View>
            <View style={s.statDivider} />
            <View style={s.statBox}><Text style={s.statLabel}>YOU OWE</Text><Text style={[s.statVal, { color: '#FCA5A5' }]}>{fmt(balances.youOwe)}</Text></View>
          </View>
          <View style={{ height: 20 }} />
        </LinearGradient>

        {/* Action row */}
        <View style={s.actionRow}>
          <View style={{ flex: 1 }}>
            <TouchableOpacity onPress={() => openAddExpense(groupId)} activeOpacity={0.85} style={[s.actionBtn, { backgroundColor: '#6C63FF' }]}>
              <Text style={s.actionTxt}>＋ Expense</Text>
            </TouchableOpacity>
          </View>

          <View style={{ flex: 1 }}>
            <TouchableOpacity onPress={() => openAddMember(groupId)} activeOpacity={0.85} style={[s.actionBtn, { backgroundColor: '#5A52CC' }]}>
              <Text style={s.actionTxt}>👤 Member</Text>
            </TouchableOpacity>
          </View>

          <View style={{ flex: 1 }}>
            <TouchableOpacity onPress={() => openSettle(groupId)} activeOpacity={0.85} style={[s.actionBtn, { backgroundColor: '#00C48C' }]}>
              <Text style={s.actionTxt}>⚖️ Settle</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Expenses Search */}
        <View style={{ paddingHorizontal: 16, marginTop: 12, marginBottom: 16 }}>
          <View className="flex-row items-center bg-bg-card rounded-xl px-3 border border-border">
            <Text style={{ fontSize: 16, marginRight: 8 }}>🔍</Text>
            <TextInput 
              className="flex-1 text-text-1 py-3"
              placeholder="Search expenses..." 
              placeholderTextColor="#6B6890" 
              value={searchQuery} 
              onChangeText={setSearchQuery} 
            />
          </View>
        </View>

        {/* Activity Feed */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Activity Feed ({filteredExp.length})</Text>
          {filteredExp.length === 0 ? (
            <View style={s.empty}><Text style={[s.emptyTxt, { color: C.muted }]}>{searchQuery ? 'No matching activity' : 'No activity yet'}</Text></View>
          ) : [...filteredExp].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(exp => (
            exp.isSettlement ? (
              <TouchableOpacity key={exp.id} style={[s.expRow, { borderColor: '#22C55E' }]} onPress={() => openExpenseDetails(exp.id)}>
                <View style={s.expIconBox}><Text style={{ fontSize: 20 }}>💸</Text></View>
                <View style={{ flex: 1, marginRight: 10 }}>
                  <Text style={[s.expDesc, { color: C.text1 }]} numberOfLines={1}>{exp.description || 'Settlement'}</Text>
                  <Text style={[s.expMeta, { color: C.muted }]}>{new Date(exp.date).toLocaleDateString()}</Text>
                  <Text style={{ color: C.muted, fontSize: 11, marginTop: 2 }}>💬 {exp.comments?.length || 0}</Text>
                </View>
                <Text style={[s.expAmt, { color: '#22C55E' }]}>{fmt(exp.amount)}</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity key={exp.id} style={s.expRow} onPress={() => openExpenseDetails(exp.id)}>
                <View style={s.expIconBox}><Text style={{ fontSize: 20 }}>{getCategoryIcon(exp.category, exp.customCategoryIcon)}</Text></View>
                <View style={{ flex: 1, marginRight: 10 }}>
                  <Text style={[s.expDesc, { color: C.text1 }]} numberOfLines={1}>{exp.description}</Text>
                  <Text style={[s.expMeta, { color: C.muted }]} numberOfLines={1}>Paid by {memberMap[exp.paidBy] ?? exp.paidBy} · {new Date(exp.date).toLocaleDateString()}</Text>
                  <Text style={{ color: C.muted, fontSize: 11, marginTop: 2 }}>💬 {exp.comments?.length || 0}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[s.expAmt, { color: C.text1 }]}>{fmt(exp.amount)}</Text>
                  {exp.paidBy === userId && (
                    <TouchableOpacity onPress={() => openEditExpense(exp.id)} style={{ padding: 4, marginTop: 4 }}>
                      <Text style={{ fontSize: 14 }}>✏️</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </TouchableOpacity>
            )
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
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={[s.memberName, { color: C.text1 }]}>{member.name}</Text>
                  {(member.id === group.createdBy || (member as any).role === 'admin') && (
                    <View style={s.adminBadge}><Text style={s.adminBadgeTxt}>Admin</Text></View>
                  )}
                </View>
                <Text style={[s.memberEmail, { color: C.muted }]}>{member.email}</Text>
              </View>
              {/* Admin can remove any other member */}
              {isAdmin && member.id !== userId && (
                <TouchableOpacity onPress={() => handleRemoveMember(member.id, member.name)}>
                  <Text style={{ color: '#EF4444', fontSize: 13 }}>Remove</Text>
                </TouchableOpacity>
              )}
              {/* Any member can leave — shows on their own row */}
              {member.id === userId && (
                <TouchableOpacity onPress={handleLeaveGroup}>
                  <Text style={{ color: '#F59E0B', fontSize: 13 }}>Leave</Text>
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
                <Text key={i} style={[s.simplifyRow, { color: C.text2 }]}>
                  {memberMap[t.from] ?? t.from} → {memberMap[t.to] ?? t.to}: <Text style={{ fontWeight: '700', color: C.text1 }}>{fmt(t.amount)}</Text>
                </Text>
              ))}
              {simplified.savings > 0 && <Text style={s.savingsTxt}>Saves {simplified.savings} transaction{simplified.savings !== 1 ? 's' : ''}</Text>}
            </View>
          )}
        </View>

        {/* Admin Tools */}
        {isAdmin && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Admin Tools</Text>
            <TouchableOpacity style={s.adminCard} onPress={handleExportPDF} activeOpacity={0.7}>
              <Text style={{ fontSize: 18 }}>📄</Text>
              <Text style={s.adminCardTxt}>Export PDF Report</Text>
              <Text style={{ color: '#6B6890', fontSize: 16 }}>›</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.adminCard} onPress={handleSendReminders} activeOpacity={0.7}>
              <Text style={{ fontSize: 18 }}>🔔</Text>
              <Text style={s.adminCardTxt}>Send Debt Reminders</Text>
              <Text style={{ color: '#6B6890', fontSize: 16 }}>›</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Danger zone — admin only */}
        {isAdmin && (
          <View style={[s.section, { paddingBottom: 32 }]}>
            <TouchableOpacity style={s.adminCard} onPress={handleArchive}>
              <Text style={{ fontSize: 18 }}>📦</Text>
              <Text style={s.adminCardTxt}>{group.isArchived ? 'Unarchive Group' : 'Archive Group'}</Text>
              <Text style={{ color: '#6B6890', fontSize: 16 }}>›</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.adminCard, { borderColor: 'rgba(239,68,68,0.3)' }]} onPress={handleDeleteGroup}>
              <Text style={{ fontSize: 18 }}>🗑️</Text>
              <Text style={[s.adminCardTxt, { color: '#EF4444' }]}>Delete Group</Text>
              <Text style={{ color: '#EF4444', fontSize: 16 }}>›</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0F0F1A' },
  hero: { paddingHorizontal: 16, paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 16 : 16, paddingBottom: 0, alignItems: 'center' },
  backBtn: { alignSelf: 'flex-start', marginBottom: 16, paddingHorizontal: 8 },
  backTxt: { color: 'rgba(255,255,255,0.8)', fontSize: 15 },
  groupIcon: { fontSize: 48, textAlign: 'center', marginBottom: 8 },
  groupName: { fontSize: 22, fontWeight: '800', color: '#FFF', textAlign: 'center' },
  groupDesc: { color: 'rgba(255,255,255,0.7)', fontSize: 14, textAlign: 'center', marginTop: 4 },
  memberCount: { color: 'rgba(255,255,255,0.6)', fontSize: 13, textAlign: 'center', marginTop: 4, marginBottom: 14 },
  statsRow: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.10)', borderRadius: 16, paddingVertical: 14, paddingHorizontal: 16, alignSelf: 'stretch', marginTop: 14 },
  statBox: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)' },
  statLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 10, marginBottom: 4, fontWeight: '600' },
  statVal: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  actionRow: { flexDirection: 'row', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 4, gap: 10 },
  actionBtn: { flex: 1, borderRadius: 14, height: 52, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6 },
  actionTxt: { color: '#FFF', fontWeight: '700', fontSize: 13 },
  actionBtnGhost: { flex: 1, borderWidth: 1, borderColor: '#6C63FF', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  actionTxtGhost: { color: '#6C63FF', fontWeight: '700', fontSize: 14 },
  section: { paddingHorizontal: 16, paddingBottom: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 10, color: '#6C63FF' },
  empty: { borderRadius: 10, padding: 16, alignItems: 'center', backgroundColor: 'rgba(108,99,255,0.05)' },
  emptyTxt: { fontSize: 14 },
  expRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: 'rgba(108,99,255,0.2)', backgroundColor: '#1A1A2E', minHeight: 72 },
  expIconBox: { width: 48, height: 48, borderRadius: 12, backgroundColor: 'rgba(108,99,255,0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  expDesc: { fontSize: 15, fontWeight: '700' },
  expMeta: { fontSize: 12, marginTop: 3 },
  expAmt: { fontSize: 15, fontWeight: '800' },
  memberRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 10, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: 'rgba(108,99,255,0.2)', backgroundColor: 'transparent' },
  memberAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#6C63FF', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  memberAvatarTxt: { color: '#FFF', fontWeight: '700', fontSize: 15 },
  memberName: { fontSize: 14, fontWeight: '600' },
  memberEmail: { fontSize: 12, marginTop: 2 },
  simplifyToggle: { paddingVertical: 12 },
  simplifyToggleTxt: { color: '#6C63FF', fontWeight: '700', fontSize: 14 },
  simplifyCard: { borderRadius: 10, padding: 14, borderWidth: 1, borderColor: 'rgba(108,99,255,0.2)' },
  simplifyRow: { fontSize: 14, marginBottom: 6, lineHeight: 20 },
  savingsTxt: { color: '#22C55E', fontSize: 12, marginTop: 6 },
  adminCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1A1A2E', borderRadius: 14, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: 'rgba(108,99,255,0.15)', gap: 12 },
  adminCardTxt: { flex: 1, color: '#F1F0FF', fontWeight: '600', fontSize: 14 },
  adminBadge: { backgroundColor: '#6C63FF', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  adminBadgeTxt: { color: '#FFF', fontSize: 10, fontWeight: '700' },
});
