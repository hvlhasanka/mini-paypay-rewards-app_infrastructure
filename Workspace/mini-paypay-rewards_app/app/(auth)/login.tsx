import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AlertModal from '@/components/alert-modal';
import { clearError, loginUser } from '@/store/authSlice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';

interface LoginForm {
  email: string;
  password: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const comingSoon = () => Alert.alert('Coming soon!');

export default function LoginScreen() {
  const dispatch = useAppDispatch();
  const { status, error, token } = useAppSelector((s) => s.auth);

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<LoginForm>({
    mode: 'onChange',
    defaultValues: { email: '', password: '' },
  });

  const [showPassword, setShowPassword] = useState(false);
  const lastErrorRef = useRef<string | null>(null);
  const lastTokenRef = useRef<string | null>(null);

  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  useEffect(() => {
    if (token && !lastTokenRef.current) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    lastTokenRef.current = token;
  }, [token]);

  useEffect(() => {
    if (error && error !== lastErrorRef.current) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
    lastErrorRef.current = error;
  }, [error]);

  const canSubmit = isValid && status !== 'loading';

  const onSubmit = handleSubmit(({ email, password }) => {
    dispatch(loginUser({ email: email.trim(), password }));
  });

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Access your editorial vault</Text>

            <View style={styles.fieldBlock}>
              <Text style={styles.label}>EMAIL ADDRESS</Text>
              <Controller
                control={control}
                name="email"
                rules={{
                  required: 'Email is required',
                  pattern: { value: EMAIL_REGEX, message: 'Enter a valid email' },
                }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={styles.input}
                    placeholder="name@institution.com"
                    placeholderTextColor="#767684"
                    autoCapitalize="none"
                    autoComplete="email"
                    keyboardType="email-address"
                    value={value}
                    onBlur={onBlur}
                    onChangeText={onChange}
                  />
                )}
              />
              {errors.email ? <Text style={styles.error}>{errors.email.message}</Text> : null}
            </View>

            <View style={styles.fieldBlock}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>SECURITY KEY</Text>
                <Pressable onPress={comingSoon} hitSlop={8}>
                  <Text style={styles.forgot}>Forgot?</Text>
                </Pressable>
              </View>
              <View style={styles.passwordWrap}>
                <Controller
                  control={control}
                  name="password"
                  rules={{
                    required: 'Password is required',
                    minLength: { value: 6, message: 'Must be at least 6 characters' },
                    validate: {
                      hasUppercase: (v) =>
                        /[A-Z]/.test(v) || 'Must include an uppercase letter',
                      hasNumber: (v) => /\d/.test(v) || 'Must include a number',
                      hasSpecial: (v) =>
                        /[^A-Za-z0-9]/.test(v) || 'Must include a special character',
                    },
                  }}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      style={[styles.input, styles.passwordInput]}
                      placeholder="••••••••••••"
                      placeholderTextColor="#767684"
                      autoCapitalize="none"
                      autoComplete="password"
                      secureTextEntry={!showPassword}
                      value={value}
                      onBlur={onBlur}
                      onChangeText={onChange}
                    />
                  )}
                />
                <Pressable
                  style={styles.eyeButton}
                  onPress={() => setShowPassword((v) => !v)}
                  hitSlop={8}
                >
                  <Image
                    source={require('@/assets/icons/eye.png')}
                    style={[styles.eyeIcon, { opacity: showPassword ? 0.5 : 1 }]}
                    resizeMode="contain"
                  />
                </Pressable>
              </View>
              {errors.password ? <Text style={styles.error}>{errors.password.message}</Text> : null}
            </View>

            <Pressable
              style={[styles.cta, { opacity: canSubmit ? 1 : 0.7 }]}
              disabled={!canSubmit}
              onPress={onSubmit}
            >
              {status === 'loading' ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.ctaText}>Enter The Vault</Text>
                  <Ionicons name="arrow-forward" size={20} color="#FCD400" />
                </>
              )}
            </Pressable>

            <View style={styles.requestRow}>
              <Text style={styles.requestText}>New to the ecosystem?    </Text>
              <Pressable onPress={comingSoon} hitSlop={8}>
                <Text style={styles.requestLink}>Request Access</Text>
              </Pressable>
            </View>

            <View style={styles.badges}>
              <View style={styles.badge}>
                <Image
                  source={require('@/assets/icons/lock.png')}
                  style={styles.badgeIcon}
                  resizeMode="contain"
                />
                <Text style={styles.badgeText}>AES-256</Text>
              </View>
              <View style={styles.badge}>
                <Image
                  source={require('@/assets/icons/shield.png')}
                  style={styles.badgeIcon}
                  resizeMode="contain"
                />
                <Text style={styles.badgeText}>SIPC PROTECTED</Text>
              </View>
            </View>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerCopy}>
              © 2026 SOUKPAY INSTITUTIONAL. ALL RIGHTS RESERVED.
            </Text>
            <View style={styles.footerLinks}>
              <Pressable onPress={comingSoon} hitSlop={8}>
                <Text style={styles.footerLink}>PRIVACY</Text>
              </Pressable>
              <Pressable onPress={comingSoon} hitSlop={8}>
                <Text style={styles.footerLink}>COMPLIANCE</Text>
              </Pressable>
              <Pressable onPress={comingSoon} hitSlop={8}>
                <Text style={styles.footerLink}>SUPPORT</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <AlertModal
        visible={!!error}
        kind={error?.toLowerCase().includes('network') ? 'warning' : 'error'}
        title={error?.toLowerCase().includes('network') ? 'Connection issue' : 'Login failed'}
        message={error ?? undefined}
        actionLabel="Try again"
        onClose={() => dispatch(clearError())}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FBF8FF' },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 20,
    justifyContent: 'space-between',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    gap: 20,
  },
  title: {
    fontFamily: 'Manrope',
    fontWeight: '800',
    fontSize: 30,
    lineHeight: 36,
    letterSpacing: -0.75,
    color: '#00003C',
  },
  subtitle: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: 0,
    color: '#464653',
    marginTop: -8,
  },
  fieldBlock: { gap: 10, marginTop: 8 },
  labelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  label: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: '#464653',
  },
  forgot: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0,
    color: '#000080',
  },
  input: {
    backgroundColor: '#E7E4EE',
    borderRadius: 12,
    height: 55,
    paddingHorizontal: 20,
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 16,
    lineHeight: 16,
    letterSpacing: 0,
    color: '#000000',
  },
  passwordWrap: { justifyContent: 'center' },
  passwordInput: { paddingRight: 48 },
  eyeButton: {
    position: 'absolute',
    right: 18,
    height: 24,
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyeIcon: { width: 20, height: 20 },
  badgeIcon: { width: 14, height: 14 },
  cta: {
    marginTop: 12,
    alignSelf: 'stretch',
    height: 64,
    paddingTop: 20,
    paddingBottom: 20,
    backgroundColor: '#00003C',
    borderRadius: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#1B1B22',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.06,
    shadowRadius: 40,
    elevation: 12,
  },
  ctaText: {
    fontFamily: 'Manrope',
    fontWeight: '700',
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: 0,
    textAlign: 'center',
    color: '#FFFFFF',
  },
  requestRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  requestText: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0,
    textAlign: 'center',
    color: '#464653',
  },
  requestLink: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0,
    textAlign: 'center',
    color: '#00003C',
  },
  badges: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginTop: 8,
  },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6, opacity: 0.3 },
  badgeText: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 10,
    lineHeight: 15,
    letterSpacing: -0.5,
    textTransform: 'uppercase',
    color: '#1B1B22',
  },
  error: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 12,
    lineHeight: 16,
    color: '#DC2626',
    marginTop: 4,
    marginLeft: 4,
  },
  footer: { marginTop: 24, alignItems: 'center', gap: 10 },
  footerCopy: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    textAlign: 'center',
    color: '#46465399',
  },
  footerLinks: { flexDirection: 'row', gap: 28 },
  footerLink: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: '#46465399',
  },
});
