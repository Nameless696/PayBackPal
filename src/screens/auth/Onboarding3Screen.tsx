import React from 'react';
import { View, Text, TouchableOpacity, SafeAreaView } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import type { AuthScreenProps } from '../../navigation/types';

export default function Onboarding3Screen({ navigation }: AuthScreenProps<'Onboarding3'>) {
  return (
    <SafeAreaView className="flex-1 bg-bg-body">
      <LinearGradient colors={['#6C63FF', '#22C55E']} style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 }}>
        <Text className="text-[80px] mb-6">🤝</Text>
        <Text className="text-[28px] font-extrabold text-white text-center mb-4">Settle Up Easily</Text>
        <Text className="text-base text-white/85 text-center leading-6">
          Send payments via eSewa, Khalti, bank transfer, or cash and mark debts as settled instantly.
        </Text>
      </LinearGradient>

      <View className="bg-bg-card p-8">
        <View className="flex-row justify-center gap-2 mb-6">
          <View className="h-2 w-2 rounded-full bg-border" />
          <View className="h-2 w-2 rounded-full bg-border" />
          <View className="h-2 w-6 rounded-full bg-primary" />
        </View>
        <TouchableOpacity className="bg-primary rounded-[14px] py-4 items-center mb-3" onPress={() => navigation.navigate('Signup')}>
          <Text className="text-white text-base font-bold">Get Started 🚀</Text>
        </TouchableOpacity>
        <TouchableOpacity className="py-[14px] items-center" onPress={() => navigation.navigate('Login')}>
          <Text className="text-text-2 text-[15px] font-semibold">I already have an account</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
