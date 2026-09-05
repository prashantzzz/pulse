import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';
import { T } from '../Text';
import { colors, radius, spacing } from '../../theme';
import { signInWithGoogle } from '../../lib/auth';
import type { Session } from '@supabase/supabase-js';

export interface GoogleSignInBtnProps {
  onSuccess?: (session: Session) => void;
  onError?: (error: Error) => void;
  loading?: boolean;
}

export function GoogleSignInBtn({ onSuccess, onError, loading }: GoogleSignInBtnProps) {
  const handlePress = async () => {
    try {
      const result = await signInWithGoogle();
      if (result.session) {
        onSuccess?.(result.session);
      } else if (result.cancelled) {
        // Just ignore if cancelled
      } else {
        throw new Error('Google Sign In failed');
      }
    } catch (err: any) {
      onError?.(err);
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={loading}
      style={({ pressed }) => [
        styles.googleBtn,
        pressed && { opacity: 0.85 },
        loading && { opacity: 0.6 },
      ]}>
      {loading ? (
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
  );
}

const styles = StyleSheet.create({
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
});
