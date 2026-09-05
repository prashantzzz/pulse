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
import { formatAuthError, updatePassword } from '../../lib/auth';
import { accentTint, colors, gradients, layout, radius, spacing, useAccent } from '../../theme';

export default function ResetPasswordScreen() {
  useAccent();
  const router = useRouter();
  const insets = useSafeAreaInsets();

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

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleUpdate = async () => {
    if (!password) {
      setErrorMessage('Please enter a new password.');
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
      await updatePassword(password);
      toast('Password updated successfully');
      router.replace('/(tabs)/home');
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

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoWrap}>
              <LinearGradient colors={[...gradients.accent]} style={[StyleSheet.absoluteFill, { borderRadius: 24 }]} />
              <T variant="hero" style={{ color: colors.bg, fontSize: 28, lineHeight: 34 }}>
                N
              </T>
            </View>
            <T variant="h1" style={{ marginTop: 16 }}>
              Set new password
            </T>
            <T variant="body" dim style={{ marginTop: 4 }}>
              Enter and confirm your new secure password
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

          {/* Form */}
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <T variant="smallSemi" muted style={{ marginBottom: 6 }}>
                New Password
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
                Confirm New Password
              </T>
              <View style={styles.inputWrap}>
                <Icon name="shield-checkmark-outline" size={20} color={colors.textMuted} />
                <TextInput
                  value={confirmPassword}
                  onChangeText={(text) => {
                    setConfirmPassword(text);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="Re-enter new password"
                  placeholderTextColor={colors.textMuted}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  style={styles.input}
                />
              </View>
            </View>

            <View style={{ marginTop: spacing.md }}>
              <Button
                label={loading ? 'Updating...' : 'Update Password'}
                onPress={handleUpdate}
                disabled={loading}
                full
                size="lg"
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  scrollContent: { paddingHorizontal: spacing.xl },
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
});
