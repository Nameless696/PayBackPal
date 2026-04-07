import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, SafeAreaView, Modal, Platform, Image, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { useModal } from '../../context/ModalContext';
import type { MainStackParamList } from '../../navigation/types';
import Toast from 'react-native-toast-message';

type Nav = NativeStackNavigationProp<MainStackParamList>;

export default function GroupsScreen() {
  const navigation = useNavigation<Nav>();
  const { groups, joinGroup, syncAll, isSyncing } = useApp();
  const { user } = useAuth();
  const { openCreateGroup } = useModal();

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (user) await syncAll(user);
    setRefreshing(false);
  }, [user, syncAll]);
  
  const [search,       setSearch]       = useState('');
  const [showArchived, setShowArchived] = useState(false);
  
  // -- Join Group Logic --
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [inviteCode, setInviteCode] = useState('');

  const submitJoin = async () => {
    if (!inviteCode.trim() || !user) return;
    try {
      await joinGroup(inviteCode.trim());
      Toast.show({ type: 'success', text1: '🎉 Joined!', text2: 'Group synced to your account' });
      setJoinModalOpen(false);
      setInviteCode('');
    } catch (e: any) {
      Toast.show({ type: 'error', text1: 'Could Not Join', text2: e?.message || 'Invalid invite code or group does not exist' });
    }
  };

  const active   = groups.filter(g => !g.isArchived && g.name.toLowerCase().includes(search.toLowerCase()));
  const archived = groups.filter(g =>  g.isArchived  && g.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <SafeAreaView className="flex-1 bg-bg-body">
      {/* Header */}
      <View className="flex-row justify-between items-center p-4 pb-2" style={{ paddingTop: Platform.OS === 'android' ? 44 : 16 }}>
        <Text className="text-text-1 text-[22px] font-extrabold">Groups</Text>
        <View className="flex-row gap-2">
          <TouchableOpacity className="bg-bg-card border border-primary rounded-[10px] px-[14px] py-2" onPress={() => setJoinModalOpen(true)}>
            <Text className="text-primary font-bold text-sm">Join</Text>
          </TouchableOpacity>
          <TouchableOpacity className="bg-primary rounded-[10px] px-[14px] py-2" onPress={openCreateGroup}>
            <Text className="text-white font-bold text-sm">+ New</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Join Group Inline Modal */}
      <Modal visible={joinModalOpen} transparent animationType="fade">
        <View className="flex-1 justify-center items-center px-6" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
          <View className="bg-bg-card w-full rounded-2xl p-6 border border-border">
            <Text className="text-white text-xl font-bold mb-4">Join a Group</Text>
            <TextInput
              className="bg-bg-body border border-border rounded-xl p-[14px] text-text-1 text-[15px] mb-4"
              placeholder="Paste Invite Code (Group ID)"
              placeholderTextColor="#6B6890"
              value={inviteCode} onChangeText={setInviteCode}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <View className="flex-row justify-end gap-3">
              <TouchableOpacity onPress={() => setJoinModalOpen(false)} className="py-2 px-4 rounded-xl border border-border">
                <Text className="text-text-muted font-bold">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={submitJoin} className="py-2 px-6 rounded-xl bg-primary">
                <Text className="text-white font-bold">Join Group</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Search */}
      <View className="flex-row items-center bg-bg-card mx-4 mt-1 mb-0 rounded-xl px-3 border border-border">
        <Text className="text-base mr-2">🔍</Text>
        <TextInput
          className="flex-1 text-text-1 text-sm py-3"
          value={search} onChangeText={setSearch}
          placeholder="Search groups…" placeholderTextColor="#6B6890"
        />
      </View>

      <FlatList
        data={active}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#6C63FF"
            colors={['#6C63FF']}
            progressBackgroundColor="#1A1A2E"
          />
        }
        ListEmptyComponent={
          <View className="items-center pt-12">
            <Text className="text-[48px] mb-3">👥</Text>
            <Text className="text-text-1 text-lg font-bold mb-1">No groups yet</Text>
            <Text className="text-text-muted text-sm">Create one to start splitting expenses</Text>
          </View>
        }
        ListFooterComponent={archived.length > 0 ? (
          <>
            <TouchableOpacity className="py-3" onPress={() => setShowArchived(v => !v)}>
              <Text className="text-text-muted text-[13px] font-semibold">
                {showArchived ? '▼' : '▶'} Archived Groups ({archived.length})
              </Text>
            </TouchableOpacity>
            {showArchived && archived.map(group => (
              <TouchableOpacity
                key={group.id}
                className="bg-bg-card rounded-[14px] p-[14px] flex-row items-center mb-2.5 border border-border opacity-60"
                onPress={() => navigation.navigate('GroupDetails', { groupId: group.id })}>
                <Text className="text-[28px] mr-3">{group.iconType === 'emoji' ? group.icon : '👥'}</Text>
                <View className="flex-1">
                  <Text className="text-text-muted text-[15px] font-bold">{group.name}</Text>
                  <Text className="text-text-muted text-xs mt-0.5">{group.members.length} members · Archived</Text>
                </View>
              </TouchableOpacity>
            ))}
          </>
        ) : null}
        renderItem={({ item }) => (
          <TouchableOpacity
            className="bg-bg-card rounded-[14px] p-[14px] flex-row items-center mb-2.5 border border-border"
            onPress={() => navigation.navigate('GroupDetails', { groupId: item.id })}>
            <View className="w-10 h-10 bg-primary/20 rounded-lg justify-center items-center overflow-hidden mr-3">
              {item.iconType === 'image' && item.icon && item.icon.length > 5 ? (
                <Image source={{ uri: item.icon }} style={{ width: '100%', height: '100%' }} />
              ) : (
                <Text className="text-xl">{item.icon || '👥'}</Text>
              )}
            </View>
            <View className="flex-1">
              <Text className="text-text-1 text-[15px] font-bold">{item.name}</Text>
              <Text className="text-text-muted text-xs mt-0.5">
                {item.members.length} member{item.members.length !== 1 ? 's' : ''}
              </Text>
              {item.description ? (
                <Text className="text-text-2 text-xs mt-0.5">{item.description}</Text>
              ) : null}
            </View>
            <Text className="text-text-muted text-[22px]">›</Text>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}
