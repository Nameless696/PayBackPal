import React from 'react';
import { View, Text, TouchableOpacity, SafeAreaView } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import type { AuthScreenProps } from '../../navigation/types';

export default function Onboarding1Screen({ navigation }: AuthScreenProps<'Onboarding1'>) {
  return (
    <SafeAreaView className="flex-1 bg-bg-body">
      <LinearGradient colors={['#6C63FF', '#4F9EFF']} style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 }}>
        <Text className="text-[80px] mb-6">💸</Text>
        <Text className="text-[28px] font-extrabold text-white text-center mb-4">Split Any Expense</Text>
        <Text className="text-base text-white/85 text-center leading-6">
          Easily divide bills, trips, rent and any shared cost with your friends and family.
        </Text>
      </LinearGradient>

      <View className="bg-bg-card p-8">
        <View className="flex-row justify-center gap-2 mb-6">
          <View className="h-2 w-6 rounded-full bg-primary" />
          <View className="h-2 w-2 rounded-full bg-border" />
          <View className="h-2 w-2 rounded-full bg-border" />
        </View>
        <TouchableOpacity className="bg-primary rounded-[14px] py-4 items-center mb-3" onPress={() => navigation.navigate('Onboarding2')}>
          <Text className="text-white text-base font-bold">Next →</Text>
        </TouchableOpacity>
        <TouchableOpacity className="py-[14px] items-center" onPress={() => navigation.navigate('Login')}>
          <Text className="text-text-2 text-[15px] font-semibold">Skip</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
