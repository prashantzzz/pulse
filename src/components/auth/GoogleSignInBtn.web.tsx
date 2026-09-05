import { GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { colors, radius, spacing } from '../../theme';
import { T } from '../Text';
import type { GoogleSignInBtnProps } from './GoogleSignInBtn';

export function GoogleSignInBtn({ onSuccess, onError, loading }: GoogleSignInBtnProps) {
  const clientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '';

  const handleFallbackAuth = async () => {
    try {
      const redirectUrl = typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : undefined;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: redirectUrl },
      });
      if (error) throw error;
    } catch (err: any) {
      onError?.(err);
    }
  };

  if (!clientId) {
    console.warn('Google Web Client ID missing in .env! Falling back to Supabase OAuth.');
    return (
      <Pressable
        onPress={handleFallbackAuth}
        disabled={loading}
        style={({ pressed }) => [
          styles.fallbackBtn,
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

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <View style={[styles.container, loading && { opacity: 0.6 }]} pointerEvents={loading ? 'none' : 'auto'}>
        {loading ? (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="small" color={colors.text} />
          </View>
        ) : null}
        
        <div style={{ width: '100%', display: 'flex', justifyContent: 'center', minHeight: 44 }}>
          {/* Note: GoogleLogin width prop must be a number/pixel string, not a percentage */}
          <GoogleLogin
            onSuccess={async (credentialResponse) => {
              if (credentialResponse.credential) {
                try {
                  const { data, error } = await supabase.auth.signInWithIdToken({
                    provider: 'google',
                    token: credentialResponse.credential,
                  });
                  if (error) throw error;
                  if (data.session) {
                    onSuccess?.(data.session);
                  } else {
                    throw new Error('No session returned');
                  }
                } catch (err: any) {
                  onError?.(err);
                }
              }
            }}
            onError={() => {
              onError?.(new Error('Google Sign In Failed'));
            }}
            useOneTap
            theme="filled_black"
            shape="pill"
            size="large"
            width="320"
          />
        </div>
      </View>
    </GoogleOAuthProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    position: 'relative',
  },
  fallbackBtn: {
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
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    borderRadius: radius.pill,
  }
});
