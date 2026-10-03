import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  Image,
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
import { formatAuthError, isValidEmail, resendConfirmationEmail, signUpWithEmail, signInWithGoogle } from '../../lib/auth';
import { syncUserDataFromCloud } from '../../lib/sync';
import { useAuth } from '../../store/useAuth';
import { usePulse } from '../../store/useStore';
import { accentTint, colors, layout, radius, spacing, useAccent } from '../../theme';

export default function SignupScreen() {
  useAccent();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const onboarded = usePulse((s) => s.onboarded);
  const isInitialized = useAuth((s) => s.isInitialized);
  const isAuthenticated = useAuth((s) => s.isAuthenticated);
  const isVerifyingUser = useAuth((s) => s.isVerifyingUser);

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
    if (isInitialized && isAuthenticated && !isVerifyingUser) {
      router.replace(onboarded ? '/(tabs)/home' : '/onboarding');
    }
  }, [isInitialized, isAuthenticated, isVerifyingUser, onboarded, router]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  /** Set once signup succeeds but Supabase requires email confirmation. */
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [resendIn, setResendIn] = useState(0);

  // Simple 1-second cooldown so "Resend" can't be spammed (Supabase rate-limits
  // confirmation emails and rejects bursts).
  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = setTimeout(() => setResendIn((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearTimeout(timer);
  }, [resendIn]);

  const handleResendConfirmation = async () => {
    if (!pendingEmail || resending || resendIn > 0) return;
    setResending(true);
    setErrorMessage(null);
    try {
      await resendConfirmationEmail(pendingEmail);
      setResendIn(60);
      toast('Confirmation email sent again');
    } catch (err: unknown) {
      const msg = formatAuthError(err);
      setErrorMessage(msg);
      toast(msg);
    } finally {
      setResending(false);
    }
  };

  const handleSignUp = async () => {
    if (loading || googleLoading) return;

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setErrorMessage('Please enter your email.');
      return;
    }
    if (!isValidEmail(cleanEmail)) {
      setErrorMessage('Please enter a valid email address.');
      toast('Please enter a valid email address');
      return;
    }
    if (!password) {
      setErrorMessage('Please enter a password.');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setErrorMessage(null);
    setLoading(true);
    useAuth.setState({ isVerifyingUser: true });

    try {
      const data = await signUpWithEmail(cleanEmail, password);
      if (data?.user) {
        if (data.session) {
          // If auto-confirm is enabled or session is created immediately
          toast('Account created successfully');
          try {
            await Promise.race([
              syncUserDataFromCloud(data.user.id),
              new Promise((resolve) => setTimeout(resolve, 3500)),
            ]);
          } catch {
            // Background sync will continue
          }
          const isUserOnboarded = usePulse.getState().onboarded;
          useAuth.setState({ isVerifyingUser: false });
          router.replace(isUserOnboarded || onboarded ? '/(tabs)/home' : '/onboarding');
        } else {
          // Email confirmation is required by Supabase project settings.
          // Show a persistent "confirm your email" screen with instructions,
          // a resend action and a path back to sign-in.
          useAuth.setState({ isVerifyingUser: false });
          setPendingEmail(cleanEmail);
          setResendIn(60);
          toast('Check your email to confirm your account');
        }
      } else {
        useAuth.setState({ isVerifyingUser: false });
      }
    } catch (err: unknown) {
      useAuth.setState({ isVerifyingUser: false });
      const msg = formatAuthError(err);
      setErrorMessage(msg);
      toast(msg);
    } finally {
      setLoading(false);
      if (!useAuth.getState().isAuthenticated) {
        useAuth.setState({ isVerifyingUser: false });
      }
    }
  };

  const handleGoogleSignUp = async () => {
    if (loading || googleLoading) return;

    setErrorMessage(null);
    setGoogleLoading(true);
    useAuth.setState({ isVerifyingUser: true });

    try {
      const result = await signInWithGoogle();
      if (result.cancelled) {
        useAuth.setState({ isVerifyingUser: false });
        return;
      }
      if (result.session?.user) {
        toast('Signed in with Google');
        try {
          await Promise.race([
            syncUserDataFromCloud(result.session.user.id),
            new Promise((resolve) => setTimeout(resolve, 3500)),
          ]);
        } catch {
          // Background sync will continue
        }
        const isUserOnboarded = usePulse.getState().onboarded;
        useAuth.setState({ isVerifyingUser: false });
        if (isUserOnboarded || onboarded) {
          router.replace('/(tabs)/home');
        } else {
          router.replace('/onboarding');
        }
      } else {
        useAuth.setState({ isVerifyingUser: false });
        setErrorMessage('Unable to establish session. Please try again.');
        toast('Unable to establish session');
      }
    } catch (err: unknown) {
      useAuth.setState({ isVerifyingUser: false });
      const msg = formatAuthError(err);
      setErrorMessage(msg);
      toast(msg);
      if (Platform.OS !== 'web') {
        Alert.alert('Google Sign-In', msg);
      }
    } finally {
      setGoogleLoading(false);
      if (!useAuth.getState().isAuthenticated) {
        useAuth.setState({ isVerifyingUser: false });
      }
    }
  };

  return (
    <View style={styles.root}>
      <LinearGradient colors={[accentTint(colors.accent, 0.24), accentTint(colors.accent, 0.06), colors.bg]} style={StyleSheet.absoluteFill} />

      <KeyboardAvoidingView
        behavior="padding"
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
            <Image
              source={require('../../../assets/images/logo.png')}
              style={{ width: 84, height: 84, borderRadius: 22 }}
              resizeMode="contain"
            />
            <T variant="h1" style={{ marginTop: 16 }}>
              Create your account
            </T>
            <T variant="body" dim style={{ marginTop: 4 }}>
              Join NextRep to track workouts and sync your progress
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

          {pendingEmail ? (
            /* ── Email confirmation instructions ─────────────────────────── */
            <View style={styles.confirmCard}>
              <View style={styles.confirmIconWrap}>
                <Icon name="mail-unread-outline" size={30} color={colors.accent} />
              </View>

              <T variant="h3" center>
                Confirm your email
              </T>
              <T variant="small" dim center style={{ marginTop: 8, lineHeight: 20 }}>
                We sent a confirmation link to
              </T>
              <T variant="bodySemi" accent center numberOfLines={1} style={{ marginTop: 2 }}>
                {pendingEmail}
              </T>

              <View style={styles.stepsWrap}>
                {[
                  'Open the email from NextRep',
                  'Tap the "Confirm your email" link',
                  'Come back here and sign in',
                ].map((step, index) => (
                  <View key={step} style={styles.stepRow}>
                    <View style={styles.stepBadge}>
                      <T variant="micro" style={{ color: colors.bg, fontWeight: '700' }}>
                        {index + 1}
                      </T>
                    </View>
                    <T variant="small" style={{ flex: 1 }}>
                      {step}
                    </T>
                  </View>
                ))}
              </View>

              <T variant="micro" muted center style={{ marginTop: 10, lineHeight: 16 }}>
                Can&apos;t find it? Check your spam folder. The link can take a minute to arrive and expires
                after 1 hour.
              </T>

              <View style={{ alignSelf: 'stretch', gap: 10, marginTop: spacing.lg }}>
                <Button
                  label={
                    resending
                      ? 'Sending...'
                      : resendIn > 0
                      ? `Resend email in ${resendIn}s`
                      : 'Resend confirmation email'
                  }
                  variant="outline"
                  full
                  disabled={resending || resendIn > 0}
                  onPress={handleResendConfirmation}
                />
                <Button
                  label="I've confirmed — Sign In"
                  full
                  onPress={() =>
                    router.replace({ pathname: '/auth/login', params: { email: pendingEmail } } as never)
                  }
                />
              </View>

              <Pressable
                onPress={() => setPendingEmail(null)}
                hitSlop={8}
                style={{ marginTop: spacing.md }}>
                <T variant="small" accent>
                  Use a different email
                </T>
              </Pressable>
            </View>
          ) : (
            <>
              {/* Form */}
              <View style={styles.form}>
            <View style={styles.inputGroup}>
              <T variant="smallSemi" muted style={{ marginBottom: 6 }}>
                Email
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
                  style={styles.input}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <T variant="smallSemi" muted style={{ marginBottom: 6 }}>
                Password
              </T>
              <View style={styles.inputWrap}>
                <Icon name="lock-closed-outline" size={20} color={colors.textMuted} />
                <TextInput
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="At least 6 characters"
                  placeholderTextColor={colors.textMuted}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  style={styles.input}
                />
                <Pressable onPress={() => setShowPassword(!showPassword)} hitSlop={10} style={{ padding: 4 }}>
                  <Icon name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.textMuted} />
                </Pressable>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <T variant="smallSemi" muted style={{ marginBottom: 6 }}>
                Confirm Password
              </T>
              <View style={styles.inputWrap}>
                <Icon name="shield-checkmark-outline" size={20} color={colors.textMuted} />
                <TextInput
                  value={confirmPassword}
                  onChangeText={(text) => {
                    setConfirmPassword(text);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="Re-enter password"
                  placeholderTextColor={colors.textMuted}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  style={styles.input}
                />
              </View>
            </View>

            <View style={{ marginTop: spacing.md }}>
              <Button
                label={loading ? 'Creating account...' : 'Create Account'}
                onPress={handleSignUp}
                disabled={loading || googleLoading}
                full
                size="lg"
              />
              <T variant="micro" muted center style={{ marginTop: 10, lineHeight: 16 }}>
                We&apos;ll email you a confirmation link. Confirm it before signing in.
              </T>
            </View>
          </View>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <T variant="micro" muted style={{ paddingHorizontal: spacing.md, letterSpacing: 1.5 }}>
              OR
            </T>
            <View style={styles.dividerLine} />
          </View>

          {/* Google Sign-in */}
          <View>
            <Pressable
              onPress={handleGoogleSignUp}
              disabled={googleLoading || loading}
              style={({ pressed }) => [
                styles.googleBtn,
                pressed && { opacity: 0.85 },
                (googleLoading || loading) && { opacity: 0.6 },
              ]}>
              {googleLoading ? (
                <ActivityIndicator size="small" color={colors.text} />
              ) : (
                <>
                  <Ionicons name="logo-google" size={20} color={colors.text} />
                  <T variant="bodySemi" style={{ marginLeft: 10 }}>
                    Continue with Google
                  </T>
                </>
              )}
            </Pressable>
          </View>

          {/* Switch to Sign In */}
          <View style={styles.footer}>
            <T variant="body" dim>
              Already have an account?{' '}
            </T>
            <Pressable onPress={() => router.replace('/auth/login' as never)} hitSlop={8}>
              <T variant="bodySemi" accent>
                Sign In
              </T>
            </Pressable>
          </View>
            </>
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
  confirmCard: {
    marginTop: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    alignItems: 'center',
  },
  confirmIconWrap: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  stepsWrap: {
    alignSelf: 'stretch',
    gap: 10,
    marginTop: spacing.lg,
    backgroundColor: colors.surface2,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stepBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.borderBright,
    borderRadius: radius.pill,
    height: 52,
    paddingHorizontal: spacing.lg,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.xl,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
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
    marginTop: spacing.xl,
  },
});
