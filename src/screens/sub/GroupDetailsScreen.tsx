import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView, TextInput, Image, Share } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { Camera } from 'lucide-react-native';
import { useApp } from '../../context/AppContext';
import { useThemeColors } from '../../hooks/useThemeColors';
import GlowButton from '../../components/ui/GlowButton';
import { useAuth } from '../../context/AuthContext';
import { useModal } from '../../context/ModalContext';
import { calculateGroupBalances, minimizeTransactions } from '../../utils/calculations';
import { getCategoryIcon } from '../../constants/categories';
import type { MainScreenProps } from '../../navigation/types';
import { launchImageLibrary } from 'react-native-image-picker';

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

  const userId = user?.id ?? '';
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

  async function handleRemoveMember(memberId: string, memberName: string) {
    const ok = await showConfirm(`Remove ${memberName} from this group?`, { title: 'Remove Member', okLabel: 'Remove', danger: true });
    if (!ok) return;
    await removeMember(groupId, memberId);
    addNotification('member_removed', `${memberName} removed from "${group!.name}"`);
  }

  return (
    <SafeAreaView className="flex-1 bg-bg-body">
      <ScrollView>
        {/* Hero */}
        <LinearGradient colors={['#6C63FF', '#4F9EFF']} style={s.hero}>
          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
            <Text style={s.backTxt}>← Back</Text>
          </TouchableOpacity>
          
          <TouchableOpacity onPress={handleEditImage} style={{ alignSelf: 'center', position: 'relative' }}>
            {group.iconType === 'image' && group.icon && group.icon.length > 5 ? (
              <View style={{ marginBottom: 12, elevation: 8, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } }}>
                 <Image source={{ uri: group.icon }} style={{ width: 90, height: 90, borderRadius: 24, borderWidth: 3, borderColor: 'rgba(255,255,255,0.8)' }} />
              </View>
            ) : (
              <View style={{ width: 90, height: 90, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 12 }}>
                 <Text style={{ fontSize: 40 }}>{group.iconType === 'emoji' ? group.icon : '👥'}</Text>
              </View>
            )}
            <View style={{ position: 'absolute', bottom: 6, right: -6, backgroundColor: '#0F0F1A', borderRadius: 16, width: 32, height: 32, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#4F9EFF' }}>
              <Camera color="#4F9EFF" size={14} />
            </View>
          </TouchableOpacity>

          <Text style={s.groupName}>{group.name}</Text>
          {group.description ? <Text style={s.groupDesc}>{group.description}</Text> : null}
          <Text style={s.memberCount}>{group.members.length} member{group.members.length !== 1 ? 's' : ''}</Text>

          <TouchableOpacity onPress={() => Share.share({ message: group.id })} style={{ backgroundColor: 'rgba(255,255,255,0.1)', alignSelf: 'center', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginBottom: 16 }}>
            <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 13, fontWeight: 'bold' }}>
              Invite Code: <Text style={{ color: '#fff', textDecorationLine: 'underline' }}>{group.id}</Text>
            </Text>
          </TouchableOpacity>

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
          <GlowButton label="+ Expense" onPress={() => openAddExpense(groupId)} style={{ flex: 1 }} />
          <GlowButton label="+ Member"  onPress={() => openAddMember(groupId)}  style={{ flex: 1 }} />
          <GlowButton label="⚖️ Settle" onPress={() => openSettle(groupId)}     style={{ flex: 1 }} />
        </View>

        {/* Expenses Search */}
        <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
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
              <TouchableOpacity key={exp.id} style={[s.expRow, { opacity: 0.85, borderColor: '#22C55E' }]} onPress={() => openExpenseDetails(exp.id)}>
                <Text style={s.expIcon}>💸</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[s.expDesc, { color: C.text1 }]}>{exp.description || 'Settlement'}</Text>
                  <Text style={[s.expMeta, { color: C.muted }]}>{new Date(exp.date).toLocaleDateString()} · {exp.comments?.length || 0}💬</Text>
                </View>
                <Text style={[s.expAmt, { color: '#22C55E', fontWeight: '900' }]}>{fmt(exp.amount)}</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity key={exp.id} style={s.expRow} onPress={() => openExpenseDetails(exp.id)}>
                <Text style={s.expIcon}>{getCategoryIcon(exp.category, exp.customCategoryIcon)}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[s.expDesc, { color: C.text1 }]}>{exp.description}</Text>
                  <Text style={[s.expMeta, { color: C.muted }]}>Paid by {memberMap[exp.paidBy] ?? exp.paidBy} · {new Date(exp.date).toLocaleDateString()} · {exp.comments?.length || 0}💬</Text>
                </View>
                <Text style={[s.expAmt, { color: C.text1 }]}>{fmt(exp.amount)}</Text>
                {exp.paidBy === userId && (
                  <TouchableOpacity onPress={() => openEditExpense(exp.id)} style={{ padding: 4, marginLeft: 8 }}>
                    <Text style={{ fontSize: 16 }}>✏️</Text>
                  </TouchableOpacity>
                )}
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
                <Text style={[s.memberName, { color: C.text1 }]}>{member.name}</Text>
                <Text style={[s.memberEmail, { color: C.muted }]}>{member.email}</Text>
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
                <Text key={i} style={[s.simplifyRow, { color: C.text2 }]}>
                  {memberMap[t.from] ?? t.from} → {memberMap[t.to] ?? t.to}: <Text style={{ fontWeight: '700', color: C.text1 }}>{fmt(t.amount)}</Text>
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
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 10, color: '#6C63FF' },
  empty: { borderRadius: 10, padding: 16, alignItems: 'center', backgroundColor: 'rgba(108,99,255,0.05)' },
  emptyTxt: { fontSize: 14 },
  expRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 10, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: 'rgba(108,99,255,0.2)', backgroundColor: 'transparent' },
  expIcon: { fontSize: 22, marginRight: 10 },
  expDesc: { fontSize: 14, fontWeight: '600' },
  expMeta: { fontSize: 12, marginTop: 2 },
  expAmt: { fontSize: 14, fontWeight: '700' },
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
  archiveBtn: { borderWidth: 1, borderColor: 'rgba(108,99,255,0.2)', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginBottom: 10 },
  archiveTxt: { color: '#6C63FF', fontWeight: '600' },
  deleteBtn: { borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  deleteTxt: { color: '#EF4444', fontWeight: '600' },
});
