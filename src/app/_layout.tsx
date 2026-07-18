import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import AppTabs from '@/components/app-tabs';
import { initDatabase } from '@/db/client';
import { useSession } from '@/store/session';
import { colors } from '@/theme';

export default function RootLayout() {
  const [ready, setReady] = useState(false);
  const hydrate = useSession((s) => s.hydrate);

  useEffect(() => {
    initDatabase();
    hydrate();
    setReady(true);
  }, [hydrate]);

  if (!ready) {
    return <View style={{ flex: 1, backgroundColor: colors.bg }} />;
  }

  return (
    <ThemeProvider value={DarkTheme}>
      <StatusBar style="light" />
      <AppTabs />
    </ThemeProvider>
  );
}
