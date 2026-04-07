import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Image, KeyboardAvoidingView, Platform, SafeAreaView } from 'react-native';
import { BottomSheetModal, BottomSheetBackdrop, BottomSheetTextInput, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import Toast from 'react-native-toast-message';
import { launchImageLibrary } from 'react-native-image-picker';
import { Camera } from 'lucide-react-native';

import { useModal } from '../context/ModalContext';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';

// --- Shared Backdrop ---
const renderBackdrop = (props: any) => (
  <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.7} />
);

export default function GlobalSheets() {
  const modalCtx = useModal();
  const { groups, addExpense, createGroup, addMember, settleDebt, expenses, addExpenseComment, fmt } = useApp();
  const { user, updateProfile } = useAuth();

  // BottomSheet Refs
  const expenseRef = useRef<BottomSheetModal>(null);
  const groupRef = useRef<BottomSheetModal>(null);
  const memberRef = useRef<BottomSheetModal>(null);
  const settleRef = useRef<BottomSheetModal>(null);
  const profileRef = useRef<BottomSheetModal>(null);
  const detailsRef = useRef<BottomSheetModal>(null);

  // Snap points
  const snapMedium = useMemo(() => ['65%'], []);
  const snapLarge = useMemo(() => ['85%'], []);
  const snapSmall = useMemo(() => ['50%'], []);

  // Sync state to Modals
  useEffect(() => { modalCtx.addExpenseOpen ? expenseRef.current?.present() : expenseRef.current?.dismiss(); }, [modalCtx.addExpenseOpen]);
  useEffect(() => { modalCtx.createGroupOpen ? groupRef.current?.present() : groupRef.current?.dismiss(); }, [modalCtx.createGroupOpen]);
  useEffect(() => { modalCtx.addMemberOpen ? memberRef.current?.present() : memberRef.current?.dismiss(); }, [modalCtx.addMemberOpen]);
  useEffect(() => { modalCtx.settleOpen ? settleRef.current?.present() : settleRef.current?.dismiss(); }, [modalCtx.settleOpen]);
  useEffect(() => { modalCtx.editProfileOpen ? profileRef.current?.present() : profileRef.current?.dismiss(); }, [modalCtx.editProfileOpen]);
  useEffect(() => { modalCtx.expenseDetailsOpen ? detailsRef.current?.present() : detailsRef.current?.dismiss(); }, [modalCtx.expenseDetailsOpen]);

  // -- Add Expense State --
  const [expAmount, setExpAmount] = useState('');
  const [expDesc, setExpDesc] = useState('');
  const [expGroup, setExpGroup] = useState('');
  const [expPaidBy, setExpPaidBy] = useState('');
  const [expReceipt, setExpReceipt] = useState<string | null>(null);
  const [expCategory, setExpCategory] = useState('general');

  const activeExpenseGroupObj = useMemo(() => {
    const targetGroup = expGroup || (modalCtx.addExpenseGroupId ?? groups[0]?.id);
    return groups.find(g => g.id === targetGroup);
  }, [groups, expGroup, modalCtx.addExpenseGroupId]);

  const selectReceipt = () => {
    launchImageLibrary({ mediaType: 'photo', includeBase64: true, quality: 0.8, maxWidth: 1000, maxHeight: 1000 }, res => {
      if (res.assets?.[0]?.base64) setExpReceipt(`data:image/jpeg;base64,${res.assets[0].base64}`);
    });
  };

  const submitExpense = async () => {
    if (!expAmount || !expDesc) return Toast.show({ type: 'error', text1: 'Missing fields' });
    const targetGroup = expGroup || (modalCtx.addExpenseGroupId ?? groups[0]?.id);
    if (!targetGroup) return Toast.show({ type: 'error', text1: 'Please create a group first' });
    
    await addExpense({
      amount: parseFloat(expAmount),
      description: expDesc,
      category: expCategory,
      groupId: targetGroup,
      paidBy: expPaidBy || user?.id || '',
      splitAmong: activeExpenseGroupObj ? activeExpenseGroupObj.members.map(m => m.id) : [],
      date: new Date().toISOString(),
      receipt: expReceipt || undefined
    });
    
    Toast.show({ type: 'success', text1: 'Expense Added!' });
    modalCtx.closeAddExpense();
    setExpAmount(''); setExpDesc(''); setExpReceipt(null); setExpCategory('general'); setExpGroup(''); setExpPaidBy('');
  };

  // -- Create Group State --
  const [grpName, setGrpName] = useState('');
  const [grpDesc, setGrpDesc] = useState('');
  const [grpIcon, setGrpIcon] = useState<string | null>(null);

  const selectGrpIcon = () => {
    launchImageLibrary({ mediaType: 'photo', includeBase64: true, quality: 0.1, maxWidth: 400, maxHeight: 400 }, res => {
      if (res.assets?.[0]?.base64) setGrpIcon(`data:image/jpeg;base64,${res.assets[0].base64}`);
    });
  };

  const submitGroup = async () => {
    if (!grpName) return Toast.show({ type: 'error', text1: 'Group needs a name' });
    await createGroup({
      name: grpName,
      description: grpDesc,
      iconType: grpIcon ? 'image' : 'emoji', icon: grpIcon || '🚀',
      members: user ? [{ id: user.id, name: user.name, email: user.email, role: 'member', status: 'joined' } as any] : [],
    });
    Toast.show({ type: 'success', text1: 'Group Created!' });
    modalCtx.closeCreateGroup();
    setGrpName(''); setGrpDesc(''); setGrpIcon(null);
  };

  // -- Add Member State --
  const [memName, setMemName] = useState('');
  const [memEmail, setMemEmail] = useState('');

  const submitMember = async () => {
    if (!memName || !memEmail || !modalCtx.addMemberGroupId) return Toast.show({ type: 'error', text1: 'Invalid fields' });
    await addMember(modalCtx.addMemberGroupId, {
      id: `u_${Date.now()}`, name: memName, email: memEmail
    });
    Toast.show({ type: 'success', text1: 'Member Added!' });
    modalCtx.closeAddMember();
    setMemName(''); setMemEmail('');
  };

  // -- Settle State --
  const [settleAmt, setSettleAmt] = useState('');
  const [settleTo,  setSettleTo]  = useState('');
  const [settleMethod, setSettleMethod] = useState('Cash');

  // Dynamically compute members in active group for Settle list
  const activeGroupObj = useMemo(() => groups.find(g => g.id === modalCtx.settleGroupId), [groups, modalCtx.settleGroupId]);

  const submitSettle = async () => {
    if (!settleAmt || !modalCtx.settleGroupId || !user) return Toast.show({ type: 'error', text1: 'Invalid fields' });
    if (!settleTo) return Toast.show({ type: 'error', text1: 'Please select a member to pay' });
    
    await settleDebt(user.id, settleTo, parseFloat(settleAmt), settleMethod, modalCtx.settleGroupId);
    Toast.show({ type: 'success', text1: 'Debt Settled!' });
    modalCtx.closeSettle();
    setSettleAmt(''); setSettleTo(''); setSettleMethod('Cash');
  };

  // -- Profile State --
  const [profName, setProfName] = useState(user?.name || '');
  const [profEmail, setProfEmail] = useState(user?.email || '');
  const [profAvatar, setProfAvatar] = useState(user?.avatar || '');

  const selectAvatar = () => {
    launchImageLibrary({ mediaType: 'photo', includeBase64: true, quality: 0.1, maxWidth: 400, maxHeight: 400 }, res => {
      if (res.assets?.[0]?.base64) setProfAvatar(`data:image/jpeg;base64,${res.assets[0].base64}`);
    });
  };

  const submitProfile = async () => {
    const payload = { name: profName, email: profEmail, avatar: profAvatar };
    const success = await updateProfile(payload as any);
    if (success) {
      Toast.show({ type: 'success', text1: 'Profile Updated!' });
      modalCtx.closeEditProfile();
    } else {
      Toast.show({ type: 'error', text1: 'Failed to update profile' });
    }
  };

  // -- Expense Details & Discussion State --
  const activeExpense = modalCtx.editExpenseId ? expenses.find(e => e.id === modalCtx.editExpenseId) : null;
  const [commentText, setCommentText] = useState('');

  const submitComment = async () => {
    if (!commentText.trim() || !activeExpense || !user) return;
    await addExpenseComment(activeExpense.id, commentText.trim(), user.name);
    setCommentText('');
  };

  return (
    <>
      {/* 1. Add Expense Sheet */}
      <BottomSheetModal ref={expenseRef} snapPoints={snapLarge} backdropComponent={renderBackdrop} onDismiss={modalCtx.closeAddExpense} backgroundStyle={styles.bg} handleIndicatorStyle={styles.indicator}>
        <BottomSheetScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>Add Expense</Text>

          {!modalCtx.addExpenseGroupId && groups.length > 0 && (
            <View style={{ marginBottom: 16 }}>
              <Text style={{color: '#B8B5D1', marginBottom: 8, fontSize: 13, fontWeight: 'bold'}}>Select Group</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                {groups.map(g => (
                  <TouchableOpacity key={g.id} onPress={() => setExpGroup(g.id)} style={[styles.catTag, (expGroup || groups[0].id) === g.id && styles.catTagActive, { marginBottom: 8 }]}>
                    <Text style={[styles.catTagTxt, (expGroup || groups[0].id) === g.id && styles.catTagTxtActive]}>{g.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          <BottomSheetTextInput style={styles.input} placeholder="Amount (e.g. 50.00)" placeholderTextColor="#6B6890" value={expAmount} onChangeText={setExpAmount} keyboardType="numeric" />
          <BottomSheetTextInput style={styles.input} placeholder="Description (e.g. Dinner)" placeholderTextColor="#6B6890" value={expDesc} onChangeText={setExpDesc} />
          
          <Text style={{color: '#B8B5D1', marginBottom: 12, fontSize: 13, fontWeight: 'bold'}}>Category</Text>
          <View style={{ marginBottom: 20 }}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {['general', 'food', 'travel', 'rent', 'shopping'].map(cat => (
                <TouchableOpacity key={cat} onPress={() => setExpCategory(cat)} style={[styles.catTag, expCategory === cat && styles.catTagActive, { marginBottom: 8 }]}>
                  <Text style={[styles.catTagTxt, expCategory === cat && styles.catTagTxtActive]}>
                    {cat === 'general' ? '📋 ' : cat === 'food' ? '🍕 ' : cat === 'travel' ? '✈️ ' : cat === 'rent' ? '🏠 ' : '🛍️ '}
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          <Text style={{color: '#B8B5D1', marginBottom: 12, fontSize: 13, fontWeight: 'bold'}}>Paid By</Text>
          <View style={{ marginBottom: 20 }}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {activeExpenseGroupObj?.members.map(m => (
                <TouchableOpacity key={m.id} onPress={() => setExpPaidBy(m.id)} style={[styles.catTag, (expPaidBy || user?.id) === m.id && styles.catTagActive, { marginBottom: 8 }]}>
                  <Text style={[styles.catTagTxt, (expPaidBy || user?.id) === m.id && styles.catTagTxtActive]}>
                    👤 {m.id === user?.id ? 'You' : m.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          <TouchableOpacity style={styles.imgPickerBtn} onPress={selectReceipt}>
            {expReceipt ? <Image source={{ uri: expReceipt }} style={{ width: '100%', height: 120, borderRadius: 12 }} /> : <Text style={styles.imgPickerTxt}>📷 Attach Receipt</Text>}
          </TouchableOpacity>

          <TouchableOpacity style={styles.btn} onPress={submitExpense}><Text style={styles.btnText}>Add Expense</Text></TouchableOpacity>
        </BottomSheetScrollView>
      </BottomSheetModal>

      {/* 2. Create Group Sheet */}
      <BottomSheetModal ref={groupRef} snapPoints={snapMedium} backdropComponent={renderBackdrop} onDismiss={modalCtx.closeCreateGroup} backgroundStyle={styles.bg} handleIndicatorStyle={styles.indicator}>
        <BottomSheetScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>New Group</Text>
          
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <TouchableOpacity style={styles.grpIconPicker} onPress={selectGrpIcon}>
              {grpIcon ? (
                <Image source={{ uri: grpIcon }} style={{ width: 64, height: 64, borderRadius: 16 }} />
              ) : (
                <Camera color="#6C63FF" size={26} />
              )}
            </TouchableOpacity>
            <Text style={{ color: '#6B6890', marginLeft: 16, flex: 1 }}>Tap to upload a custom group image. (Optional)</Text>
          </View>

          <BottomSheetTextInput style={styles.input} placeholder="Group Name" placeholderTextColor="#6B6890" value={grpName} onChangeText={setGrpName} />
          <BottomSheetTextInput style={styles.input} placeholder="Description (Optional)" placeholderTextColor="#6B6890" value={grpDesc} onChangeText={setGrpDesc} />
          <TouchableOpacity style={styles.btn} onPress={submitGroup}><Text style={styles.btnText}>Create Group</Text></TouchableOpacity>
        </BottomSheetScrollView>
      </BottomSheetModal>

      {/* 3. Add Member Sheet */}
      <BottomSheetModal ref={memberRef} snapPoints={snapMedium} backdropComponent={renderBackdrop} onDismiss={modalCtx.closeAddMember} backgroundStyle={styles.bg} handleIndicatorStyle={styles.indicator}>
        <BottomSheetScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>Add Member</Text>
          <BottomSheetTextInput style={styles.input} placeholder="Name" placeholderTextColor="#6B6890" value={memName} onChangeText={setMemName} />
          <BottomSheetTextInput style={styles.input} placeholder="Email" placeholderTextColor="#6B6890" value={memEmail} onChangeText={setMemEmail} autoCapitalize="none" />
          <TouchableOpacity style={styles.btn} onPress={submitMember}><Text style={styles.btnText}>Send Invite</Text></TouchableOpacity>
        </BottomSheetScrollView>
      </BottomSheetModal>

      {/* 4. Settle Debt Sheet */}
      <BottomSheetModal ref={settleRef} snapPoints={snapLarge} backdropComponent={renderBackdrop} onDismiss={modalCtx.closeSettle} backgroundStyle={styles.bg} handleIndicatorStyle={styles.indicator}>
        <BottomSheetScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>Settle Debt</Text>
          
          <Text style={{color: '#FFF', fontSize: 18, fontWeight: 'bold', marginBottom: 6}}>Paying Who?</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16 }}>
            {activeGroupObj?.members.filter(m => m.id !== user?.id).map(m => (
              <TouchableOpacity key={m.id} onPress={() => setSettleTo(m.id)} style={[styles.catTag, settleTo === m.id && styles.catTagActive, { paddingVertical: 14, marginBottom: 8 }]}>
                <Text style={[styles.catTagTxt, settleTo === m.id && styles.catTagTxtActive]}>👤 {m.name}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={{color: '#FFF', fontSize: 18, fontWeight: 'bold', marginBottom: 6, marginTop: 4}}>Payment Method</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 20 }}>
            {['Cash', 'Bank Transfer', 'eSewa', 'Khalti'].map(method => (
              <TouchableOpacity key={method} onPress={() => setSettleMethod(method)} style={[styles.catTag, settleMethod === method && styles.catTagActive, { marginBottom: 8 }]}>
                <Text style={[styles.catTagTxt, settleMethod === method && styles.catTagTxtActive]}>{method}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <BottomSheetTextInput style={styles.input} placeholder="Amount to Settle" placeholderTextColor="#6B6890" value={settleAmt} onChangeText={setSettleAmt} keyboardType="numeric" />
          <TouchableOpacity style={styles.btn} onPress={submitSettle}><Text style={styles.btnText}>Record Payment</Text></TouchableOpacity>
        </BottomSheetScrollView>
      </BottomSheetModal>

      {/* 5. Edit Profile Sheet */}
      <BottomSheetModal ref={profileRef} snapPoints={snapMedium} backdropComponent={renderBackdrop} onDismiss={modalCtx.closeEditProfile} backgroundStyle={styles.bg} handleIndicatorStyle={styles.indicator}>
        <BottomSheetScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>Edit Profile</Text>
          
          <TouchableOpacity style={styles.avatarPicker} onPress={selectAvatar}>
            {profAvatar.length > 5 ? (
              <Image source={{ uri: profAvatar }} style={{ width: 80, height: 80, borderRadius: 40 }} />
            ) : (
              <Text style={styles.avatarPickerTxt}>{profName.charAt(0).toUpperCase() || '?'}</Text>
            )}
            <Text style={{ color: '#6C63FF', fontSize: 13, marginTop: 8, fontWeight: 'bold' }}>Change Photo</Text>
          </TouchableOpacity>

          <BottomSheetTextInput style={styles.input} placeholder="Name" placeholderTextColor="#6B6890" value={profName} onChangeText={setProfName} />
          <BottomSheetTextInput style={styles.input} placeholder="Email" placeholderTextColor="#6B6890" value={profEmail} onChangeText={setProfEmail} autoCapitalize="none" />
          <TouchableOpacity style={styles.btn} onPress={submitProfile}><Text style={styles.btnText}>Save Profile</Text></TouchableOpacity>
        </BottomSheetScrollView>
      </BottomSheetModal>

      {/* 6. Expense Details / Discussion Sheet */}
      <BottomSheetModal ref={detailsRef} snapPoints={snapLarge} backdropComponent={renderBackdrop} onDismiss={modalCtx.closeExpenseDetails} backgroundStyle={styles.bg} handleIndicatorStyle={styles.indicator}>
        <BottomSheetScrollView contentContainerStyle={styles.content}>
          {activeExpense ? (
            <>
              <Text style={styles.title}>Expense Details</Text>
              
              <View style={{ backgroundColor: '#2D2B45', padding: 16, borderRadius: 16, marginBottom: 20 }}>
                <Text style={{ color: '#F1F0FF', fontSize: 22, fontWeight: 'bold' }}>{activeExpense.description}</Text>
                <Text style={{ color: '#6C63FF', fontSize: 24, fontWeight: '900', marginTop: 4 }}>{fmt(activeExpense.amount)}</Text>
                <Text style={{ color: '#B8B5D1', fontSize: 13, marginTop: 8 }}>Payer ID: {activeExpense.paidBy === user?.id ? 'You' : activeExpense.paidBy}</Text>
                <Text style={{ color: '#B8B5D1', fontSize: 13 }}>Date: {new Date(activeExpense.date).toLocaleDateString()}</Text>
              </View>

              <Text style={{ color: '#FFF', fontSize: 18, fontWeight: 'bold', marginBottom: 12 }}>Discussion Log</Text>
              
              {(!activeExpense.comments || activeExpense.comments.length === 0) ? (
                <Text style={{ color: '#6B6890', fontStyle: 'italic', marginBottom: 20 }}>No comments yet. Be the first to track this!</Text>
              ) : (
                <View style={{ marginBottom: 20 }}>
                  {activeExpense.comments.map(c => (
                    <View key={c.id} style={{ backgroundColor: 'transparent', padding: 12, borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: '#2D2B45' }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                        <Text style={{ color: '#6C63FF', fontWeight: 'bold', fontSize: 13 }}>{c.userId}</Text>
                        <Text style={{ color: '#6B6890', fontSize: 11 }}>{new Date(c.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</Text>
                      </View>
                      <Text style={{ color: '#F1F0FF', fontSize: 15 }}>{c.text}</Text>
                    </View>
                  ))}
                </View>
              )}

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <BottomSheetTextInput 
                  style={[styles.input, { flex: 1, marginBottom: 0 }]} 
                  placeholder="Drop a comment..." 
                  placeholderTextColor="#6B6890" 
                  value={commentText} 
                  onChangeText={setCommentText} 
                />
                <TouchableOpacity onPress={submitComment} style={{ backgroundColor: '#6C63FF', padding: 16, borderRadius: 12, justifyContent: 'center' }}>
                  <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Send</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <Text style={{ color: '#FFF' }}>Syncing Expense Mapping...</Text>
          )}
        </BottomSheetScrollView>
      </BottomSheetModal>

      {/* 6. Receipt Lightbox (Standard Modal) */}
      <Modal visible={modalCtx.receiptLightboxOpen} transparent animationType="fade" onRequestClose={modalCtx.closeReceiptLightbox}>
        <View style={styles.lightboxBg}>
          <SafeAreaView style={{ flex: 1 }}>
            <TouchableOpacity style={styles.lightboxClose} onPress={modalCtx.closeReceiptLightbox}>
              <Text style={styles.lightboxCloseText}>Close</Text>
            </TouchableOpacity>
            {modalCtx.receiptUri ? (
              <Image source={{ uri: modalCtx.receiptUri }} style={styles.lightboxImg} resizeMode="contain" />
            ) : null}
          </SafeAreaView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  bg: { backgroundColor: '#1A1A2E' },
  indicator: { backgroundColor: '#2D2B45', width: 40 },
  content: { padding: 24 },
  title: { color: '#FFF', fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  input: {
    backgroundColor: 'transparent',
    color: '#FFF',
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2D2B45'
  },
  btn: {
    backgroundColor: '#6C63FF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8
  },
  btnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  lightboxBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center' },
  lightboxClose: { position: 'absolute', top: 50, right: 20, zIndex: 10, padding: 10 },
  lightboxCloseText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  lightboxImg: { width: '100%', height: '80%', alignSelf: 'center', marginTop: 80 },
  imgPickerBtn: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#6C63FF', borderStyle: 'dashed', borderRadius: 12, height: 120, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  imgPickerTxt: { color: '#6C63FF', fontWeight: 'bold' },
  avatarPicker: { alignSelf: 'center', alignItems: 'center', marginBottom: 20 },
  avatarPickerTxt: { color: '#FFF', fontSize: 32, fontWeight: 'bold', width: 80, height: 80, borderRadius: 40, backgroundColor: '#6C63FF', textAlign: 'center', textAlignVertical: 'center', lineHeight: 80 },
  catTag: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: '#2D2B45', marginRight: 10, borderWidth: 1, borderColor: 'transparent' },
  catTagActive: { backgroundColor: 'rgba(108,99,255,0.15)', borderColor: '#6C63FF' },
  catTagTxt: { color: '#B8B5D1', fontWeight: '600' },
  catTagTxtActive: { color: '#6C63FF', fontWeight: 'bold' },
  grpIconPicker: { width: 64, height: 64, borderRadius: 16, backgroundColor: '#2D2B45', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#6C63FF', borderStyle: 'dashed' }
});
