import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { logout } from '@/store/authSlice';
import { useAppDispatch } from '@/store/hooks';

export default function HomeScreen() {
  const dispatch = useAppDispatch();

  const handleLogout = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    dispatch(logout());
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Home</Text>
      <Pressable style={styles.button} onPress={handleLogout}>
        <Text style={styles.buttonText}>Log out</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FBF8FF',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 16,
  },
  title: {
    fontFamily: 'Manrope',
    fontWeight: '800',
    fontSize: 24,
    color: '#00003C',
  },
  button: {
    marginTop: 16,
    backgroundColor: '#00003C',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 9999,
  },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});
