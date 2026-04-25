import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppSelector } from '@/store/hooks';

export default function ProfileHeader() {
  const user = useAppSelector((s) => s.auth.user);

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safe}>
      <View style={styles.row}>
        <Image source={require('@/assets/icons/user.png')} style={styles.avatar} />
        <View style={styles.text}>
          <Text style={styles.welcome}>WELCOME BACK</Text>
          <Text style={styles.name}>{user?.name ?? user?.email ?? ''}</Text>
        </View>
        <Pressable
          style={styles.bellButton}
          hitSlop={8}
          onPress={() => Alert.alert('Coming soon!')}
        >
          <Image source={require('@/assets/icons/bell.png')} style={styles.bell} />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    backgroundColor: '#FFFFFF',
    boxShadow: '0px 20px 40px 0px #1B1B220F',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 16,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#FCD400',
  },
  text: { flex: 1 },
  bellButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bell: { width: 24, height: 24, resizeMode: 'contain', tintColor: '#00003C' },
  welcome: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.3,
    color: '#464653',
  },
  name: {
    fontFamily: 'Manrope',
    fontWeight: '800',
    fontSize: 18,
    lineHeight: 22.5,
    letterSpacing: -0.9,
    color: '#00003C',
    marginTop: 2,
  },
});
