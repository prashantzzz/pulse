import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { BackHandler, StyleSheet, View } from 'react-native';
import { T } from '../components/Text';
import { Card, Icon, Row, Screen, ScreenHeader } from '../components/ui';
import { colors, radius, spacing, useAccent } from '../theme';

export default function TermsOfServiceScreen() {
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
        title="Terms of Service"
        subtitle="Last updated: September 2026"
        back
        onBack={handleBack}
      />

      <Card style={styles.heroCard}>
        <Row gap={12} align="center">
          <View style={styles.heroIconWrap}>
            <Icon name="document-lock-outline" size={24} color={colors.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <T variant="bodySemi">Terms of Use</T>
            <T variant="micro" muted>
              Please review the terms governing your use of the NextRep workout application.
            </T>
          </View>
        </Row>
      </Card>

      <View style={styles.content}>
        {/* Section 1 */}
        <TermsSection
          icon="checkmark-circle-outline"
          title="1. Agreement to Terms"
          body="By installing, accessing, or using NextRep ('the App'), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the App."
        />

        {/* Section 2 - Health Disclaimer */}
        <TermsSection
          icon="medkit-outline"
          title="2. Health & Fitness Disclaimer"
          body="NextRep is an informational tool for tracking personal workouts. It does NOT provide medical advice, diagnosis, or treatment plans:"
          bulletPoints={[
            'Physical Risk: Weightlifting and intense physical exercise involve inherent risks of injury.',
            'Medical Clearance: Consult with a physician or healthcare provider before beginning any new exercise regimen, especially if you have pre-existing medical conditions.',
            'Assumption of Risk: You voluntarily participate in any exercise or routine tracked through the App and assume all responsibility for your personal safety.',
          ]}
        />

        {/* Section 3 */}
        <TermsSection
          icon="person-outline"
          title="3. User Accounts & Integrity"
          body="When creating an optional account, you agree to provide accurate information and safeguard your credentials. You are responsible for all activities that occur under your account."
        />

        {/* Section 4 */}
        <TermsSection
          icon="hardware-chip-outline"
          title="4. Software License & Intellectual Property"
          body="NextRep grants you a personal, non-transferable, revocable license to use the app for personal, non-commercial workout tracking. You agree not to decompile, reverse engineer, or attempt to extract source code from the software."
        />

        {/* Section 5 */}
        <TermsSection
          icon="shield-outline"
          title="5. Limitation of Liability"
          body="To the maximum extent permitted by applicable law, NextRep and its developers shall not be liable for any direct, indirect, incidental, or consequential damages resulting from the use or inability to use the App, including physical injury or data loss."
        />

        {/* Section 6 */}
        <TermsSection
          icon="refresh-outline"
          title="6. Updates & Modifications"
          body="We may update features or modify these terms periodically to reflect app improvements or regulatory updates. Continued use of the App following any changes constitutes your acceptance of the updated terms."
        />

        {/* Section 7 */}
        <TermsSection
          icon="mail-outline"
          title="7. Contact Information"
          body="For inquiries regarding these Terms of Service, please contact prasmatic.help@gmail.com."
        />
      </View>
    </Screen>
  );
}

function TermsSection({
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
