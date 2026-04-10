import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { AuthProvider, useAuth } from '../src/context/AuthContext';

function RootLayoutInner() {
  const { theme, isDarkMode } = useAuth();

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.background },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="register" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="add-transaction" options={{ presentation: 'modal', headerShown: false }} />
        <Stack.Screen name="add-invoice" options={{ presentation: 'modal', headerShown: false }} />
        <Stack.Screen name="add-category" options={{ presentation: 'modal', headerShown: false }} />
        <Stack.Screen name="add-client" options={{ presentation: 'modal', headerShown: false }} />
        <Stack.Screen name="client-detail" options={{ presentation: 'card', headerShown: false }} />
      </Stack>
    </View>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutInner />
    </AuthProvider>
  );
}
