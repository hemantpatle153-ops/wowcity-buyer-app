import { Tabs } from 'expo-router/js-tabs';

import { TabBar } from '@/components/TabBar';
import { useTheme } from '@/theme/ThemeProvider';

export default function TabsLayout() {
  const { colors, reduceMotion } = useTheme();
  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.bg },
        animation: reduceMotion ? 'none' : 'shift',
      }}
    >
      <Tabs.Screen name="home" options={{ title: 'Discover' }} />
      <Tabs.Screen name="search" options={{ title: 'Search' }} />
      <Tabs.Screen name="shops" options={{ title: 'Shops' }} />
      <Tabs.Screen name="saved" options={{ title: 'Saved' }} />
      <Tabs.Screen name="account" options={{ title: 'Account' }} />
    </Tabs>
  );
}
