import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';

import { toast } from '../../components/misc';
import { AuthLoadingScreen } from '../../components/auth-loading';
import { handleAuthUrl } from '../../lib/auth';
import { syncUserDataFromCloud } from '../../lib/sync';
import { useAuth } from '../../store/useAuth';
import { usePulse } from '../../store/useStore';

/**
 * Handles deep links that come back from Supabase emails (signup confirmation,
 * password recovery) and OAuth.
 *
 * Two entry points are covered:
 *  - cold start: the app is closed and the email link launches it
 *  - warm start: the app is in the background and the email link foregrounds it
 *    (expo-router routes here, and the `url` event carries the tokens)
 *
 * Both use the same handler so the user is verified and lands inside the app
 * instead of being sent to the website.
 */
export default function AuthCallbackScreen() {
  const router = useRouter();
  const onboarded = usePulse((s) => s.onboarded);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const processedUrlRef = useRef<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function processUrl(targetUrl: string | null) {
      if (!targetUrl || processedUrlRef.current === targetUrl) return;
      processedUrlRef.current = targetUrl;

      useAuth.setState({ isVerifyingUser: true });
      try {
        // Password recovery links must land on the reset-password screen.
        if (targetUrl.includes('type=recovery') || targetUrl.includes('reset-password')) {
          await handleAuthUrl(targetUrl).catch(() => null);
          useAuth.setState({ isVerifyingUser: false });
          if (mounted) {
            router.replace('/auth/reset-password' as never);
          }
          return;
        }

        const session = await handleAuthUrl(targetUrl);
        if (!mounted) return;

        if (session?.user) {
          toast('Signed in successfully');
          await syncUserDataFromCloud(session.user.id).catch(() => {});
          useAuth.setState({ isVerifyingUser: false });
          const isUserOnboarded = usePulse.getState().onboarded;
          router.replace(isUserOnboarded || onboarded ? '/(tabs)/home' : '/onboarding');
          return;
        }

        // The link opened but produced no session (already used, expired, or
        // opened on a device without the stored PKCE verifier). Explain and
        // send the user to sign-in rather than leaving them on a spinner.
        toast('Email confirmed. Please sign in.');
        useAuth.setState({ isVerifyingUser: false });
        router.replace('/auth/login' as never);
      } catch (err: unknown) {
        useAuth.setState({ isVerifyingUser: false });
        if (!mounted) return;
        const msg = (err as { message?: string }).message ?? 'Authentication callback failed.';
        setErrorMsg(msg);
        toast(msg);
        setTimeout(() => {
          if (mounted) router.replace('/auth/login' as never);
        }, 2000);
      }
    }

    (async () => {
      const webUrl = typeof window !== 'undefined' && window.location?.href ? window.location.href : null;
      const nativeUrl = await Linking.getInitialURL().catch(() => null);
      const initialTarget = webUrl || nativeUrl;

      if (initialTarget) {
        await processUrl(initialTarget);
        return;
      }

      // No URL parameters: the user reached this screen directly or is already
      // signed in. Send them to the right place.
      useAuth.setState({ isVerifyingUser: false });
      if (mounted) {
        const isUserOnboarded = usePulse.getState().onboarded;
        router.replace(isUserOnboarded || onboarded ? '/(tabs)/home' : '/onboarding');
      }
    })();

    // Warm start: the email link is tapped while the app is in the background.
    const subscription = Linking.addEventListener('url', ({ url }) => {
      processUrl(url);
    });

    return () => {
      mounted = false;
      subscription.remove();
    };
  }, [onboarded, router]);

  return (
    <AuthLoadingScreen
      title="Completing sign in..."
      subtitle={errorMsg ? errorMsg : 'Setting up your profile & workouts'}
    />
  );
}
