import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
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
import { formatAuthError, signInWithEmail, signInWithGoogle } from '../../lib/auth';
import { syncUserDataFromCloud } from '../../lib/sync';
import { useAuth } from '../../store/useAuth';
import { usePulse } from '../../store/useStore';
import { accentTint, colors, gradients, layout, radius, spacing, useAccent } from '../../theme';

export default function LoginScreen() {
  useAccent();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const onboarded = usePulse((s) => s.onboarded);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSignIn = async () => {
    if (!email.trim() || !password) {
      setErrorMessage('Please enter both email and password.');
      toast('Please fill in both email and password');
      return;
    }

    setErrorMessage(null);
    setLoading(true);

    try {
      const data = await signInWithEmail(email, password);
      if (data?.user) {
        toast('Signed in successfully');
        await syncUserDataFromCloud(data.user.id);
        const isUserOnboarded = usePulse.getState().onboarded;
        if (isUserOnboarded || onboarded) {
          router.replace('/(tabs)/home');
        } else {
          router.replace('/onboarding');
        }
      }
    } catch (err: unknown) {
      const msg = formatAuthError(err);
      setErrorMessage(msg);
      toast(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMessage(null);
    setGoogleLoading(true);

    try {
      const result = await signInWithGoogle();
      if (result.cancelled) {
        return;
      }
      if (result.session?.user) {
        toast('Signed in with Google');
        await syncUserDataFromCloud(result.session.user.id);
        const isUserOnboarded = usePulse.getState().onboarded;
        if (isUserOnboarded || onboarded) {
          router.replace('/(tabs)/home');
        } else {
          router.replace('/onboarding');
        }
      }
    } catch (err: unknown) {
      const msg = formatAuthError(err);
      setErrorMessage(msg);
      toast(msg);
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <LinearGradient colors={[accentTint(colors.accent, 0.12), colors.bg, colors.bg]} style={StyleSheet.absoluteFill} />

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
          
          {/* Logo & Header */}
          <View style={styles.header}>
            <Image
              source={require('../../../assets/images/logo.png')}
              style={{ width: 68, height: 68, borderRadius: 18 }}
              resizeMode="contain"
            />
            <T variant="hero" style={{ marginTop: 14, fontSize: 30, letterSpacing: 1.5 }}>
              NextRep
            </T>
            <T variant="h2" style={{ marginTop: 8 }}>
              Welcome back
            </T>
            <T variant="body" dim style={{ marginTop: 4 }}>
              Sign in to continue your training journey
            </T>
          </View>

          {/* Error message banner */}
          {errorMessage ? (
            <View style={styles.errorBanner}>
              <Icon name="alert-circle" size={18} color={colors.red} />
              <T variant="smallMedium" style={{ color: colors.red, flex: 1 }}>
                {errorMessage}
              </T>
            </View>
          ) : null}

          {/* Google Sign-in */}
          <View style={{ marginTop: spacing.xl }}>
            <Pressable
              onPress={handleGoogleSignIn}
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

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <T variant="micro" muted style={{ paddingHorizontal: spacing.md, letterSpacing: 1.5 }}>
              OR
            </T>
            <View style={styles.dividerLine} />
          </View>

          {/* Email / Password Form */}
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
                  placeholder="Enter password"
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

            <Pressable
              onPress={() => router.push('/auth/forgot-password' as never)}
              style={styles.forgotBtn}>
              <T variant="smallMedium" accent>
                Forgot password?
              </T>
            </Pressable>

            <View style={{ marginTop: spacing.md }}>
              <Button
                label={loading ? 'Signing in...' : 'Sign In'}
                onPress={handleSignIn}
                disabled={loading || googleLoading}
                full
                size="lg"
              />
            </View>
          </View>

          {/* Switch to Sign Up */}
          <View style={styles.footer}>
            <T variant="body" dim>
              Don&apos;t have an account?{' '}
            </T>
            <Pressable onPress={() => router.push('/auth/signup' as never)} hitSlop={8}>
              <T variant="bodySemi" accent>
                Create account
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
  header: { alignItems: 'center', marginTop: spacing.md },
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
  form: { gap: spacing.md },
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
  forgotBtn: { alignSelf: 'flex-end', paddingVertical: 4 },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xxl,
  },
});
