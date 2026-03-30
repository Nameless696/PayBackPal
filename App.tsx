import React from 'react';
import { View, StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import Toast from 'react-native-toast-message';
import { AuthProvider } from './src/context/AuthContext';
import { AppProvider, useApp } from './src/context/AppContext';
import { ModalProvider } from './src/context/ModalContext';
import RootNavigator from './src/navigation/RootNavigator';
import ErrorBoundary from './src/components/ErrorBoundary';
import GlobalSheets from './src/components/GlobalSheets';
import './global.css';

function AppRoot() {
  const { isDark } = useApp();
  return (
    <View className={isDark ? "flex-1 dark" : "flex-1"} style={{ flex: 1, backgroundColor: isDark ? '#09090b' : '#f8fafc' }}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={isDark ? '#09090b' : '#f8fafc'} />
      <RootNavigator />
      <GlobalSheets />
      <Toast topOffset={60} />
    </View>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ErrorBoundary>
          <AuthProvider>
            <AppProvider>
              <ModalProvider>
                <BottomSheetModalProvider>
                  <AppRoot />
                </BottomSheetModalProvider>
              </ModalProvider>
            </AppProvider>
          </AuthProvider>
        </ErrorBoundary>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
