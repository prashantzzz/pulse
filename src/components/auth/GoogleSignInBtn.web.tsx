import { GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { supabase } from '../../lib/supabase';
import { colors, radius } from '../../theme';
import type { Session } from '@supabase/supabase-js';
import type { GoogleSignInBtnProps } from './GoogleSignInBtn';

export function GoogleSignInBtn({ onSuccess, onError, loading }: GoogleSignInBtnProps) {
  const clientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '';

  if (!clientId) {
    return null;
  }

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <View style={[styles.container, loading && { opacity: 0.6 }]} pointerEvents={loading ? 'none' : 'auto'}>
        {loading ? (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="small" color={colors.text} />
          </View>
        ) : null}
        
        <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
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
            width="100%"
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
    height: 52,
    borderRadius: radius.pill,
    overflow: 'hidden',
    position: 'relative',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.borderBright,
  }
});
