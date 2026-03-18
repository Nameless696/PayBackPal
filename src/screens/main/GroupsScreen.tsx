import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useApp } from '../../context/AppContext';
import { useModal } from '../../context/ModalContext';
import type { MainStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<MainStackParamList>;

export default function GroupsScreen() {
  const navigation = useNavigation<Nav>();
  const { groups } = useApp();
  const { openCreateGroup } = useModal();
  const [search,       setSearch]       = useState('');
  const [showArchived, setShowArchived] = useState(false);

  const active   = groups.filter(g => !g.isArchived && g.name.toLowerCase().includes(search.toLowerCase()));
  const archived = groups.filter(g =>  g.isArchived  && g.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <SafeAreaView className="flex-1 bg-bg-body">
      {/* Header */}
      <View className="flex-row justify-between items-center p-4 pb-2">
        <Text className="text-text-1 text-[22px] font-extrabold">Groups</Text>
        <TouchableOpacity className="bg-primary rounded-[10px] px-[14px] py-2" onPress={openCreateGroup}>
          <Text className="text-white font-bold text-sm">+ New</Text>
        </TouchableOpacity>
      </View>

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
            <Text className="text-[28px] mr-3">{item.iconType === 'emoji' ? item.icon : '👥'}</Text>
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
