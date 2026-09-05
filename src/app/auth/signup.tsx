import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
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
import { formatAuthError, signUpWithEmail } from '../../lib/auth';
import { GoogleSignInBtn } from '../../components/auth/GoogleSignInBtn';
import { syncUserDataFromCloud } from '../../lib/sync';
import { useAuth } from '../../store/useAuth';
import { usePulse } from '../../store/useStore';
import { accentTint, colors, gradients, layout, radius, spacing, useAccent } from '../../theme';

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
  const [successInfo, setSuccessInfo] = useState<string | null>(null);

  const handleSignUp = async () => {
    if (!email.trim()) {
      setErrorMessage('Please enter your email.');
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

    try {
      const data = await signUpWithEmail(email, password);
      if (data?.user) {
        if (data.session) {
          // If auto-confirm is enabled or session is created immediately
          toast('Account created successfully');
          await syncUserDataFromCloud(data.user.id);
          const isUserOnboarded = usePulse.getState().onboarded;
          router.replace(isUserOnboarded || onboarded ? '/(tabs)/home' : '/onboarding');
        } else {
          // Email confirmation is required by Supabase project settings
          setSuccessInfo('Account created! Please check your email inbox to confirm your account.');
          toast('Check your email to confirm your account');
        }
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

  const handleGoogleSuccess = async (session: any) => {
    setErrorMessage(null);
    setGoogleLoading(true);
    useAuth.setState({ isVerifyingUser: true });

    try {
      toast('Signed in with Google');
      await syncUserDataFromCloud(session.user.id);
      const isUserOnboarded = usePulse.getState().onboarded;
      useAuth.setState({ isVerifyingUser: false });
      if (isUserOnboarded || onboarded) {
        router.replace('/(tabs)/home');
      } else {
        router.replace('/onboarding');
      }
    } catch (err: unknown) {
      useAuth.setState({ isVerifyingUser: false });
      const msg = formatAuthError(err);
      setErrorMessage(msg);
      toast(msg);
    } finally {
      setGoogleLoading(false);
      if (!useAuth.getState().isAuthenticated) {
        useAuth.setState({ isVerifyingUser: false });
      }
    }
  };

  const handleGoogleError = (err: unknown) => {
    const msg = formatAuthError(err);
    setErrorMessage(msg);
    toast(msg);
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

          {/* Success banner */}
          {successInfo ? (
            <View style={styles.successBanner}>
              <Icon name="checkmark-circle" size={20} color={colors.success} />
              <T variant="smallMedium" style={{ color: colors.success, flex: 1 }}>
                {successInfo}
              </T>
            </View>
          ) : null}

          {/* Error banner */}
          {errorMessage ? (
            <View style={styles.errorBanner}>
              <Icon name="alert-circle" size={18} color={colors.red} />
              <T variant="smallMedium" style={{ color: colors.red, flex: 1 }}>
                {errorMessage}
              </T>
            </View>
          ) : null}

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
            <GoogleSignInBtn 
              loading={googleLoading || loading}
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
            />
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
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.emeraldSoft,
    borderWidth: 1,
    borderColor: `${colors.success}40`,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.lg,
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
