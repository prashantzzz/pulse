import { GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { colors, radius, spacing } from '../../theme';
import { T } from '../Text';
import { useState, useEffect } from 'react';
import type { GoogleSignInBtnProps } from './GoogleSignInBtn';

export function GoogleSignInBtn({ onSuccess, onError, loading }: GoogleSignInBtnProps) {
  const clientId = process.env.EXPO_PUBLIC_WEB_CLIENT_ID || process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '';
  const [nonce, setNonce] = useState<string>('');

  useEffect(() => {
    // Generate a secure random nonce for Supabase verification
    const array = new Uint8Array(16);
    if (typeof window !== 'undefined' && window.crypto) {
      window.crypto.getRandomValues(array);
      const randomNonce = Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
      setNonce(randomNonce);
    } else {
      setNonce(Math.random().toString(36).substring(2, 15));
    }
  }, []);

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
              Continue with Google (Fallback)
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
          {/* We only render GoogleLogin once the nonce is generated to avoid cache issues */}
          {nonce ? (
            <GoogleLogin
              nonce={nonce}
              prompt="select_account"
              onSuccess={async (credentialResponse) => {
                if (credentialResponse.credential) {
                  try {
                    const { data, error } = await supabase.auth.signInWithIdToken({
                      provider: 'google',
                      token: credentialResponse.credential,
                      nonce: nonce, // Supabase strictly matches this with the ID token
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
              useOneTap={false} // Disabled One Tap to force the standard Account Chooser
              theme="filled_black"
              shape="pill"
              size="large"
              width="320"
            />
          ) : null}
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
