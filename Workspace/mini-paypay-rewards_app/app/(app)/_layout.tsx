import { Tabs } from 'expo-router';
import { Image } from 'react-native';

import ProfileHeader from '@/components/profile-header';

export default function AppLayout() {
  return (
    <Tabs
      screenOptions={{
        header: () => <ProfileHeader />,
        sceneStyle: { backgroundColor: '#FBF8FF' },
        tabBarActiveTintColor: '#00003C',
        tabBarInactiveTintColor: '#64748B',
        tabBarActiveBackgroundColor: '#FCD400',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          height: 92,
          paddingTop: 8,
          paddingBottom: 24,
          borderTopWidth: 0,
          borderTopLeftRadius: 32,
          borderTopRightRadius: 32,
          position: 'absolute',
        },
        tabBarItemStyle: {
          marginHorizontal: 8,
          borderRadius: 9999,
          overflow: 'hidden',
        },
        tabBarLabelStyle: {
          fontFamily: 'Inter',
          fontWeight: '500',
          fontSize: 10,
          lineHeight: 15,
          letterSpacing: 1,
          textTransform: 'uppercase',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => (
            <Image
              source={require('@/assets/icons/home.png')}
              style={{ width: 18, height: 18, tintColor: color, resizeMode: 'contain' }}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ color }) => (
            <Image
              source={require('@/assets/icons/history.png')}
              style={{ width: 18, height: 18, tintColor: color, resizeMode: 'contain' }}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="rewards"
        options={{
          title: 'Rewards',
          tabBarIcon: ({ color }) => (
            <Image
              source={require('@/assets/icons/box.png')}
              style={{ width: 18, height: 18, tintColor: color, resizeMode: 'contain' }}
            />
          ),
        }}
      />
    </Tabs>
  );
}
