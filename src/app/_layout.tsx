import React from 'react';
import { Slot, Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      >
        <Slot />
      </Stack>
      <StatusBar style="dark" backgroundColor="#fff" />
    </SafeAreaProvider>
  );
}