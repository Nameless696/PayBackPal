import React from 'react';
import { View, Text, FlatList, TouchableOpacity, SafeAreaView } from 'react-native';
import { useApp } from '../../context/AppContext';

const TYPE_ICONS: Record<string, string> = {
  member_added:    '👤',
  member_removed:  '👤',
  expense_added:   '💰',
  expense_updated: '✏️',
  expense_deleted: '🗑️',
  settlement_made: '✅',
  group_updated:   '👥',
  default:         '🔔',
};

export default function NotificationsScreen() {
  const { notifications, markNotifRead, markAllNotifsRead } = useApp();
  const sorted = [...notifications].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <SafeAreaView className="flex-1 bg-bg-body">
      <View className="flex-row justify-between items-center p-4">
        <Text className="text-text-1 text-[22px] font-extrabold">Notifications</Text>
        <TouchableOpacity onPress={markAllNotifsRead}>
          <Text className="text-primary text-[13px] font-semibold">Mark all read</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={sorted}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        ListEmptyComponent={
          <View className="items-center pt-12">
            <Text className="text-[48px] mb-3">🔔</Text>
            <Text className="text-text-muted text-base">No notifications yet</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            className={`rounded-xl p-[14px] flex-row items-start mb-2 border ${
              item.read ? 'bg-bg-card border-border' : 'border-primary/30'
            }`}
            style={!item.read ? { backgroundColor: 'rgba(108,99,255,0.08)' } : undefined}
            onPress={() => markNotifRead(item.id)}>
            <Text className="text-[22px] mr-3 mt-0.5">{TYPE_ICONS[item.type] ?? TYPE_ICONS.default}</Text>
            <View className="flex-1">
              <Text className={`text-sm leading-5 ${item.read ? 'text-text-2' : 'text-text-1 font-semibold'}`}>
                {item.message}
              </Text>
              <Text className="text-text-muted text-[11px] mt-1">
                {new Date(item.timestamp).toLocaleString()}
              </Text>
            </View>
            {!item.read && <View className="w-2 h-2 rounded-full bg-primary mt-1" />}
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}
