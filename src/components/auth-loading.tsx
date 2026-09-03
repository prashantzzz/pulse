import React from 'react';
import { ActivityIndicator, Image, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { T } from './Text';
import { accentTint, colors, spacing, useAccent } from '../theme';

interface AuthLoadingScreenProps {
  title?: string;
  subtitle?: string;
}

export function AuthLoadingScreen({
  title = 'Signing you in...',
  subtitle = 'Setting up your profile & workouts',
}: AuthLoadingScreenProps) {
  useAccent();

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[accentTint(colors.accent, 0.18), accentTint(colors.accent, 0.05), colors.bg]}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.content}>
        {/* App Logo */}
        <View style={[styles.logoWrap, { shadowColor: colors.accent }]}>
          <Image
            source={require('../../assets/images/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        {/* Spinner */}
        <View style={{ marginTop: spacing.xl, marginBottom: spacing.md }}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>

        {/* Status Text */}
        <T variant="h3" center style={{ marginTop: spacing.xs }}>
          {title}
        </T>
        <T variant="small" dim center style={{ marginTop: 6, maxWidth: 260 }}>
          {subtitle}
        </T>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  logoWrap: {
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 8,
  },
  logo: {
    width: 84,
    height: 84,
    borderRadius: 22,
  },
});
