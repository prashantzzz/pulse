import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { toast } from '../../components/misc';
import { T } from '../../components/Text';
import { handleAuthUrl } from '../../lib/auth';
import { syncUserDataFromCloud } from '../../lib/sync';
import { usePulse } from '../../store/useStore';
import { colors, spacing } from '../../theme';

export default function AuthCallbackScreen() {
  const router = useRouter();
  const onboarded = usePulse((s) => s.onboarded);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function processCallback() {
      try {
        const webUrl = typeof window !== 'undefined' && window.location?.href ? window.location.href : null;
        const nativeUrl = await Linking.getInitialURL();
        const targetUrl = webUrl || nativeUrl;

        if (targetUrl) {
          const session = await handleAuthUrl(targetUrl);
          if (session?.user && mounted) {
            toast('Signed in successfully');
            await syncUserDataFromCloud(session.user.id);
            const isUserOnboarded = usePulse.getState().onboarded;
            if (isUserOnboarded || onboarded) {
              router.replace('/(tabs)/home');
            } else {
              router.replace('/onboarding');
            }
            return;
          }
        }
        // If already signed in or no specific URL parameters
        if (mounted) {
          router.replace(onboarded ? '/(tabs)/home' : '/onboarding');
        }
      } catch (err: unknown) {
        if (mounted) {
          const msg = (err as { message?: string }).message ?? 'Authentication callback failed.';
          setErrorMsg(msg);
          toast(msg);
          setTimeout(() => {
            router.replace('/auth/login' as never);
          }, 2000);
        }
      }
    }

    processCallback();

    return () => {
      mounted = false;
    };
  }, [onboarded, router]);

  return (
    <View style={styles.root}>
      <ActivityIndicator size="large" color={colors.accent} />
      <T variant="body" dim style={{ marginTop: spacing.md }}>
        {errorMsg ? errorMsg : 'Completing sign in...'}
      </T>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
});
