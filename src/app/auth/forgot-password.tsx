import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  BackHandler,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { toast } from '../../components/misc';
import { T } from '../../components/Text';
import { Button, Icon } from '../../components/ui';
import { formatAuthError, sendPasswordResetEmail } from '../../lib/auth';
import { useAuth } from '../../store/useAuth';
import { usePulse } from '../../store/useStore';
import { accentTint, colors, gradients, layout, radius, spacing, useAccent } from '../../theme';

export default function ForgotPasswordScreen() {
  useAccent();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const onboarded = usePulse((s) => s.onboarded);
  const isInitialized = useAuth((s) => s.isInitialized);
  const isAuthenticated = useAuth((s) => s.isAuthenticated);

  useEffect(() => {
    const onBackPress = () => {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/auth/login' as never);
      }
      return true;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [router]);

  useEffect(() => {
    if (isInitialized && isAuthenticated) {
      router.replace(onboarded ? '/(tabs)/home' : '/onboarding');
    }
  }, [isInitialized, isAuthenticated, onboarded, router]);

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleReset = async () => {
    if (!email.trim()) {
      setErrorMessage('Please enter your email address.');
      return;
    }

    setErrorMessage(null);
    setLoading(true);

    try {
      await sendPasswordResetEmail(email);
      setSent(true);
      toast('Reset instructions sent to your email');
    } catch (err: unknown) {
      const msg = formatAuthError(err);
      setErrorMessage(msg);
      toast(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <LinearGradient colors={[accentTint(colors.accent, 0.24), accentTint(colors.accent, 0.06), colors.bg]} style={StyleSheet.absoluteFill} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: Math.max(insets.top + layout.screenTopPad, 50), paddingBottom: insets.bottom + 30 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>

          {/* Top back button */}
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={10}>
            <Icon name="chevron-back" size={20} />
          </Pressable>

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoWrap}>
              <LinearGradient colors={[...gradients.accent]} style={[StyleSheet.absoluteFill, { borderRadius: 24 }]} />
              <T variant="hero" style={{ color: colors.bg, fontSize: 28, lineHeight: 34 }}>
                N
              </T>
            </View>
            <T variant="h1" style={{ marginTop: 16 }}>
              Reset password
            </T>
            <T variant="body" dim style={{ marginTop: 6, textAlign: 'center' }}>
              Enter your email address and we&apos;ll send you instructions to reset your password.
            </T>
          </View>

          {/* Error banner */}
          {errorMessage ? (
            <View style={styles.errorBanner}>
              <Icon name="alert-circle" size={18} color={colors.red} />
              <T variant="smallMedium" style={{ color: colors.red, flex: 1 }}>
                {errorMessage}
              </T>
            </View>
          ) : null}

          {/* Success card */}
          {sent ? (
            <View style={styles.successCard}>
              <Icon name="mail-unread-outline" size={32} color={colors.success} />
              <T variant="h3" style={{ color: colors.success, marginTop: 8 }}>
                Check your inbox
              </T>
              <T variant="body" dim style={{ textAlign: 'center', marginTop: 4 }}>
                We sent a password reset link to <T variant="bodySemi">{email}</T>. Tap the link in your email to choose a new password.
              </T>
              <View style={{ marginTop: spacing.lg, width: '100%' }}>
                <Button
                  label="Back to Sign In"
                  variant="outline"
                  onPress={() => router.replace('/auth/login' as never)}
                  full
                />
              </View>
            </View>
          ) : (
            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <T variant="smallSemi" muted style={{ marginBottom: 6 }}>
                  Email Address
                </T>
                <View style={styles.inputWrap}>
                  <Icon name="mail-outline" size={20} color={colors.textMuted} />
                  <TextInput
                    value={email}
                    onChangeText={(text) => {
                      setEmail(text);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    placeholder="athlete@example.com"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoFocus
                    style={styles.input}
                  />
                </View>
              </View>

              <View style={{ marginTop: spacing.md }}>
                <Button
                  label={loading ? 'Sending...' : 'Send Reset Link'}
                  onPress={handleReset}
                  disabled={loading}
                  full
                  size="lg"
                />
              </View>

              <View style={styles.footer}>
                <Pressable onPress={() => router.back()} hitSlop={8}>
                  <T variant="bodySemi" accent>
                    Back to Sign In
                  </T>
                </Pressable>
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  scrollContent: { paddingHorizontal: spacing.xl },
  backBtn: {
    position: 'absolute',
    top: 50,
    left: spacing.lg,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  header: { alignItems: 'center', marginTop: spacing.lg },
  logoWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.dangerSoft2,
    borderWidth: 1,
    borderColor: `${colors.red}40`,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.lg,
  },
  successCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    marginTop: spacing.xxl,
  },
  form: { gap: spacing.md, marginTop: spacing.xl },
  inputGroup: {},
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    color: colors.text,
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.lg,
  },
});
