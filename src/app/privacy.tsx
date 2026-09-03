import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { BackHandler, StyleSheet, View } from 'react-native';
import { T } from '../components/Text';
import { Card, Icon, Row, Screen, ScreenHeader } from '../components/ui';
import { colors, radius, spacing, useAccent } from '../theme';

export default function PrivacyPolicyScreen() {
  useAccent();
  const router = useRouter();

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/profile' as never);
    }
  };

  useEffect(() => {
    const onBackPress = () => {
      handleBack();
      return true;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [router]);

  return (
    <Screen scroll contentStyle={styles.container}>
      <ScreenHeader
        title="Privacy Policy"
        subtitle="Last updated: September 2026"
        back
        onBack={handleBack}
      />

      <Card style={styles.heroCard}>
        <Row gap={12} align="center">
          <View style={styles.heroIconWrap}>
            <Icon name="shield-checkmark" size={24} color={colors.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <T variant="bodySemi">Privacy-First Fitness</T>
            <T variant="micro" muted>
              Your workout data belongs strictly to you. No data selling, no ad tracking, and no hidden telemetry.
            </T>
          </View>
        </Row>
      </Card>

      <View style={styles.content}>
        {/* Section 1 */}
        <PolicySection
          icon="document-text-outline"
          title="1. Overview"
          body="NextRep ('the App', 'we', 'our') is designed as an offline-first fitness tracker. We are committed to transparency and protecting your privacy. This policy explains what information is collected, how it is stored, and your rights regarding your data."
        />

        {/* Section 2 */}
        <PolicySection
          icon="barbell-outline"
          title="2. Information We Collect"
          body="We only collect information necessary to provide core fitness tracking functionality:"
          bulletPoints={[
            'Workout Data: Exercises performed, sets, reps, weights, rest durations, workout notes, and personal records (PRs).',
            'Body Measurements: Optional entries such as weight, body fat percentage, and muscle dimensions entered by you.',
            'Account Information (Optional): If you choose to create a cloud backup account, we store your email address and display name.',
            'Device Permissions: Notification and alarm permissions solely to alert you when rest timers finish or when scheduled workout reminders occur.',
          ]}
        />

        {/* Section 3 */}
        <PolicySection
          icon="close-circle-outline"
          title="3. Information We DO NOT Collect"
          body="To ensure maximum privacy, NextRep does NOT collect or access:"
          bulletPoints={[
            'No GPS or real-time location tracking.',
            'No biometric or health sensor data beyond what you manually log.',
            'No contact lists, phone logs, or camera/photo access without explicit user action.',
            'No third-party advertising identifiers (IDFA / AAID) or cross-app tracking cookies.',
          ]}
        />

        {/* Section 4 */}
        <PolicySection
          icon="lock-closed-outline"
          title="4. How Your Data Is Stored & Protected"
          body="NextRep is built with an offline-first architecture:"
          bulletPoints={[
            'Local Storage: All workouts and settings are stored locally on your device in secure app storage.',
            'Encrypted Cloud Sync (Optional): If you sign in, your data is securely synced to our database (Supabase) via TLS/HTTPS encryption. Data is isolated using strict Row-Level Security (RLS) so only your authenticated account can read or write your records.',
            'No Third-Party Sale: We do not sell, rent, or trade your personal or fitness data to any third party or data broker.',
          ]}
        />

        {/* Section 5 */}
        <PolicySection
          icon="download-outline"
          title="5. Data Ownership & Export"
          body="You own 100% of your data:"
          bulletPoints={[
            'CSV Export: You can export your entire workout history into a standard .CSV file anytime from the Settings menu.',
            'Data Deletion: You can clear all local data with a single tap in Settings. If you have a cloud account, you can request full account and data deletion at any time.',
          ]}
        />

        {/* Section 6 */}
        <PolicySection
          icon="people-outline"
          title="6. Children's Privacy"
          body="NextRep is intended for individuals aged 13 and older. We do not knowingly collect personal identifiable information from children under the age of 13."
        />

        {/* Section 7 */}
        <PolicySection
          icon="mail-outline"
          title="7. Contact & Support"
          body="If you have any questions, feedback, or requests regarding this Privacy Policy or your data, please contact developer support via email at prasmatic.help@gmail.com or through our website."
        />
      </View>
    </Screen>
  );
}

function PolicySection({
  icon,
  title,
  body,
  bulletPoints,
}: {
  icon: any;
  title: string;
  body: string;
  bulletPoints?: string[];
}) {
  return (
    <Card style={styles.sectionCard}>
      <Row gap={10} align="center" style={{ marginBottom: spacing.xs }}>
        <View style={styles.sectionIconWrap}>
          <Icon name={icon} size={16} color={colors.accent} />
        </View>
        <T variant="bodySemi" style={{ flex: 1 }}>
          {title}
        </T>
      </Row>
      <T variant="small" dim style={styles.sectionText}>
        {body}
      </T>
      {bulletPoints && bulletPoints.length > 0 ? (
        <View style={styles.bulletList}>
          {bulletPoints.map((item, i) => (
            <Row key={i} gap={8} align="flex-start" style={{ marginBottom: 6 }}>
              <T variant="small" accent style={{ lineHeight: 18 }}>
                •
              </T>
              <T variant="small" dim style={[{ flex: 1, lineHeight: 18 }]}>
                {item}
              </T>
            </Row>
          ))}
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.md,
    gap: spacing.md,
  },
  heroCard: {
    padding: spacing.md,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  heroIconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    gap: spacing.md,
  },
  sectionCard: {
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: colors.surface3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionText: {
    lineHeight: 20,
    marginTop: 2,
  },
  bulletList: {
    marginTop: spacing.sm,
    paddingLeft: spacing.xs,
  },
});
