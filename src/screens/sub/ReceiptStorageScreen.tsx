import React from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, SafeAreaView, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useApp } from '../../context/AppContext';
import { useModal } from '../../context/ModalContext';

const COL_WIDTH = (Dimensions.get('window').width - 48) / 2;

export default function ReceiptStorageScreen() {
  const navigation = useNavigation();
  const { expenses } = useApp();
  const { openReceiptLightbox } = useModal();

  const receipts = expenses
    .filter(e => e.receipt)
    .map(e => ({ id: e.id, uri: e.receipt!, desc: e.description, date: e.date }));

  return (
    <SafeAreaView className="flex-1 bg-bg-body">
      <View className="flex-row justify-between items-center p-4">
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text className="text-primary text-[15px]">← Back</Text>
        </TouchableOpacity>
        <Text className="text-text-1 text-lg font-bold">Receipts</Text>
        <View style={{ width: 60 }} />
      </View>

      <FlatList
        data={receipts}
        keyExtractor={item => item.id}
        numColumns={2}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        columnWrapperStyle={{ gap: 16 }}
        ListEmptyComponent={
          <View className="items-center pt-16">
            <Text className="text-[48px] mb-3">🧾</Text>
            <Text className="text-text-muted text-base">No receipts stored</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity style={{ width: COL_WIDTH, marginBottom: 16 }} onPress={() => openReceiptLightbox(item.uri)}>
            <Image source={{ uri: item.uri }} style={{ width: COL_WIDTH, height: COL_WIDTH, borderRadius: 12, backgroundColor: '#1A1A2E' }} resizeMode="cover" />
            <Text className="text-text-1 text-xs font-semibold mt-1.5" numberOfLines={1}>{item.desc}</Text>
            <Text className="text-text-muted text-[11px] mt-0.5">{new Date(item.date).toLocaleDateString()}</Text>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}
