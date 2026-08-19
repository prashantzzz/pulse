import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { AccentPreview } from '../components/accent-preview';
import { T } from '../components/Text';
import { Button, Chip, Icon, Row } from '../components/ui';
import { ACCENTS, accentTint, colors, gradients, radius, spacing, useAccent, type AccentKey } from '../theme';
import { useAuth } from '../store/useAuth';
import { usePulse } from '../store/useStore';
import { upsertProfile } from '../lib/auth';
import { addFriendConnection, getPendingInvite, joinCloudChallenge } from '../lib/social';
import type { UserProfile } from '../types';

const GENDERS = [
  { label: 'male', icon: 'male-outline', desc: 'Standard body model' },
  { label: 'female', icon: 'female-outline', desc: 'Female body model' },
] as const;

const GOALS = [
  { icon: 'barbell-outline', label: 'Build Muscle' },
  { icon: 'flame-outline', label: 'Lose Weight' },
  { icon: 'trending-up-outline', label: 'Get Stronger' },
  { icon: 'heart-outline', label: 'Improve Endurance' },
  { icon: 'shield-checkmark-outline', label: 'Stay Healthy' },
  { icon: 'sparkles-outline', label: 'Other Goal' },
] as const;

const EXPERIENCE = [
  { label: 'Beginner', desc: 'New to the gym', icon: 'leaf-outline' },
  { label: 'Intermediate', desc: 'Training 6+ months', icon: 'rocket-outline' },
  { label: 'Advanced', desc: '2+ years consistent', icon: 'flash-outline' },
] as const;

const FREQUENCY = ['2-3 / week', '3-4 / week', '4-5 / week', '5+ / week'];
const EQUIPMENT = ['Barbell', 'Dumbbell', 'Machine', 'Cable', 'Bodyweight', 'Band', 'Cardio'];
const STYLES = ['Push / Pull / Legs', 'Full Body', 'Upper / Lower', 'Cardio + Lifting'];

const ACCENT_ORDER = Object.keys(ACCENTS) as AccentKey[];

export default function OnboardingScreen() {
  useAccent();
  const router = useRouter();
  const user = useAuth((s) => s.user);
  const completeOnboarding = usePulse((s) => s.completeOnboarding);
  const addMeasurement = usePulse((s) => s.addMeasurement);
  const accentKey = usePulse((s) => s.accentKey);
  const setAccent = usePulse((s) => s.setAccent);
  const [step, setStep] = useState(0);
  const [gender, setGender] = useState<UserProfile['gender'] | null>(null);
  const [unitMode, setUnitMode] = useState<'metric' | 'imperial'>('metric');
  const [heightCm, setHeightCm] = useState('175');
  const [weightKg, setWeightKg] = useState('68');
  const [heightFt, setHeightFt] = useState('5');
  const [heightIn, setHeightIn] = useState('9');
  const [weightLbs, setWeightLbs] = useState('150');
  const [goals, setGoals] = useState<string[]>([]);
  const [experience, setExperience] = useState<UserProfile['experience'] | null>(null);
  const [frequency, setFrequency] = useState<string | null>(null);
  const [equipment, setEquipment] = useState<string[]>([]);
  const [styles2, setStyles2] = useState<string[]>([]);
  const initialName = user?.user_metadata?.full_name ?? user?.user_metadata?.name ?? user?.user_metadata?.display_name ?? '';
  const [name, setName] = useState(initialName);

  const steps = [
    { title: 'Welcome to NextRep', subtitle: 'Your personal training companion.', body: "Let's build a stronger you.", cta: 'Get Started' },
    { title: "What's your gender?", subtitle: 'We match your muscle map to a body like yours', body: '', cta: 'Next' },
    { title: 'Pick your accent', subtitle: 'The color that powers NextRep', body: '', cta: 'Next' },
    { title: 'Height & Weight', subtitle: 'Calculate your BMI and set your baseline', body: '', cta: 'Next' },
    { title: "What's your goal?", subtitle: 'Choose up to 2', body: '', cta: 'Next' },
    { title: 'How experienced are you?', subtitle: 'We tailor your training plan', body: '', cta: 'Next' },
    { title: 'How often do you train?', subtitle: 'A typical week for you', body: '', cta: 'Next' },
    { title: 'What equipment do you have?', subtitle: 'Select all that apply', body: '', cta: 'Next' },
    { title: 'Favorite training style?', subtitle: 'Select all that apply', body: '', cta: 'Next' },
    { title: 'What should we call you?', subtitle: 'Almost there', body: '', cta: 'Build My Dashboard' },
  ];
  const s = steps[step];

  const parsedHeightCm = unitMode === 'metric' ? parseFloat(heightCm) || 0 : (parseFloat(heightFt) || 0) * 30.48 + (parseFloat(heightIn) || 0) * 2.54;
  const parsedWeightKg = unitMode === 'metric' ? parseFloat(weightKg) || 0 : (parseFloat(weightLbs) || 0) * 0.453592;
  const heightM = parsedHeightCm / 100;
  const liveBmi = heightM > 0.5 && parsedWeightKg > 20 ? Math.round((parsedWeightKg / (heightM * heightM)) * 10) / 10 : null;

  const canNext = () => {
    if (step === 0) return true;
    if (step === 1) return !!gender;
    if (step === 2) return true;
    if (step === 3) return parsedHeightCm >= 100 && parsedWeightKg >= 30;
    if (step === 4) return goals.length > 0;
    if (step === 5) return !!experience;
    if (step === 6) return !!frequency;
    if (step === 7) return equipment.length > 0;
    if (step === 8) return styles2.length > 0;
    return name.trim().length > 1;
  };

  const finish = async (profile: UserProfile) => {
    completeOnboarding(profile);
    if (profile.weightKg) {
      addMeasurement({
        id: `m-initial-${Date.now()}`,
        date: new Date().toISOString(),
        weightKg: profile.weightKg,
        bodyFatPct: null,
        chestCm: null,
        waistCm: null,
        bicepsCm: null,
      });
    }
    if (user?.id) {
      upsertProfile(user.id, profile).catch(() => {});
    }

    const pending = await getPendingInvite();
    if (pending && user?.id) {
      await addFriendConnection(user.id, pending.fromUserId).catch(() => {});
      if (pending.challengeId) {
        await joinCloudChallenge(pending.challengeId, user.id).catch(() => {});
      }
      router.replace('/challenge' as never);
    } else {
      router.replace('/(tabs)/home');
    }
  };

  const defaultProfile = (): UserProfile => ({
    name: name.trim() || 'Athlete',
    gender: gender ?? 'male',
    goal: goals.length ? goals : ['Build Muscle'],
    experience: experience ?? 'Beginner',
    frequencyPerWeek: Number.parseInt(frequency ?? '3', 10) || 3,
    equipment,
    style: styles2,
    trainingAgeMonths: experience === 'Advanced' ? 26 : experience === 'Intermediate' ? 12 : 3,
    onboarded: true,
    heightCm: Math.round(parsedHeightCm) || 175,
    weightKg: Math.round(parsedWeightKg * 10) / 10 || 68,
    weightUnit: unitMode === 'imperial' ? 'lbs' : 'kg',
  });

  const next = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
      return;
    }
    finish(defaultProfile());
  };

  return (
    <View style={styles.root}>
      <LinearGradient colors={[accentTint(colors.accent, 0.12), colors.bg]} style={StyleSheet.absoluteFill} />
      {step > 0 ? (
        <Pressable onPress={() => setStep(step - 1)} style={styles.backBtn} hitSlop={10}>
          <Icon name="chevron-back" size={20} />
        </Pressable>
      ) : null}

      {/* progress */}
      <View style={styles.progressRow}>
        {steps.map((_, i) => (
          <View key={i} style={[styles.progressDot, i <= step && { backgroundColor: colors.accent, width: 22 }]} />
        ))}
      </View>

      <View style={styles.content}>
        <T variant="label" accent style={{ marginBottom: 10 }}>
          {step === 0 ? 'NextRep' : `Step ${step} of ${steps.length - 1}`}
        </T>
        <T variant="h1">{s.title}</T>
        {s.subtitle ? (
          <T variant="body" dim style={{ marginTop: 8 }}>
            {s.subtitle}
          </T>
        ) : null}

        {/* Step bodies */}
        {step === 1 ? (
          <View style={{ gap: spacing.sm, marginTop: spacing.xl }}>
            {GENDERS.map((g) => (
              <Pressable
                key={g.label}
                onPress={() => setGender(g.label)}
                style={[styles.optionCard, gender === g.label && { borderColor: colors.accent, backgroundColor: colors.accentSoft }]}>
                <Icon name={g.icon} size={22} color={gender === g.label ? colors.accent : colors.textDim} />
                <View style={{ flex: 1 }}>
                  <T variant="bodySemi" style={{ textTransform: 'capitalize' }}>
                    {g.label}
                  </T>
                  <T variant="small" muted>
                    {g.desc}
                  </T>
                </View>
                {gender === g.label ? <Icon name="checkmark-circle" size={22} color={colors.accent} /> : null}
              </Pressable>
            ))}
          </View>
        ) : null}

        {step === 0 ? (
          <View style={styles.welcome}>
            <LinearGradient colors={[...gradients.charcoal]} style={styles.welcomeArt} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <T variant="hero" accent style={{ fontSize: 52 }}>
                N
              </T>
            </LinearGradient>
            <T variant="h3" center style={{ marginTop: spacing.lg }}>
              A coach in your pocket — teach, track, analyze and motivate.
            </T>
          </View>
        ) : null}

        {step === 2 ? (
          <View style={{ marginTop: spacing.xl }}>
            <View style={styles.accentRow}>
              {ACCENT_ORDER.map((k) => {
                const p = ACCENTS[k];
                const sel = accentKey === k;
                return (
                  <Pressable
                    key={k}
                    onPress={() => setAccent(k)}
                    accessibilityLabel={`${p.label} accent`}
                    style={[styles.accentSwatchWrap, sel && styles.accentSwatchWrapSel]}>
                    <View style={[styles.accentSwatch, { backgroundColor: p.accent }]}>
                      {sel ? <Icon name="checkmark" size={16} color={colors.bg} /> : null}
                    </View>
                  </Pressable>
                );
              })}
            </View>
            <T variant="smallSemi" center style={{ marginTop: spacing.md, color: ACCENTS[accentKey].accent, textTransform: 'capitalize' }}>
              {ACCENTS[accentKey].label}
            </T>
            <T variant="small" dim center style={{ marginTop: 2 }}>
              {ACCENTS[accentKey].accent} · dark-theme friendly
            </T>
            <View style={{ marginTop: spacing.lg }}>
              <AccentPreview palette={ACCENTS[accentKey]} />
            </View>
          </View>
        ) : null}

        {step === 3 ? (
          <View style={{ gap: spacing.md, marginTop: spacing.lg }}>
            {/* Unit selector pill */}
            <View style={styles.unitToggle}>
              <Pressable
                onPress={() => setUnitMode('metric')}
                style={[styles.unitToggleBtn, unitMode === 'metric' && { backgroundColor: colors.accent }]}>
                <T variant="smallSemi" style={{ color: unitMode === 'metric' ? colors.bg : colors.textDim }}>
                  Metric (cm / kg)
                </T>
              </Pressable>
              <Pressable
                onPress={() => setUnitMode('imperial')}
                style={[styles.unitToggleBtn, unitMode === 'imperial' && { backgroundColor: colors.accent }]}>
                <T variant="smallSemi" style={{ color: unitMode === 'imperial' ? colors.bg : colors.textDim }}>
                  Imperial (ft-in / lbs)
                </T>
              </Pressable>
            </View>

            {/* Inputs */}
            {unitMode === 'metric' ? (
              <View style={{ gap: spacing.sm }}>
                <View style={styles.metricInputCard}>
                  <T variant="micro" muted>HEIGHT</T>
                  <Row align="center" gap={8} style={{ marginTop: 4 }}>
                    <TextInput
                      value={heightCm}
                      onChangeText={setHeightCm}
                      keyboardType="numeric"
                      maxLength={3}
                      style={styles.metricInputText}
                      placeholder="175"
                      placeholderTextColor={colors.textMuted}
                    />
                    <T variant="bodySemi" dim>cm</T>
                  </Row>
                </View>
                <View style={styles.metricInputCard}>
                  <T variant="micro" muted>CURRENT WEIGHT</T>
                  <Row align="center" gap={8} style={{ marginTop: 4 }}>
                    <TextInput
                      value={weightKg}
                      onChangeText={setWeightKg}
                      keyboardType="numeric"
                      maxLength={5}
                      style={styles.metricInputText}
                      placeholder="68"
                      placeholderTextColor={colors.textMuted}
                    />
                    <T variant="bodySemi" dim>kg</T>
                  </Row>
                </View>
              </View>
            ) : (
              <View style={{ gap: spacing.sm }}>
                <View style={styles.metricInputCard}>
                  <T variant="micro" muted>HEIGHT</T>
                  <Row align="center" gap={12} style={{ marginTop: 4 }}>
                    <Row align="center" gap={4}>
                      <TextInput
                        value={heightFt}
                        onChangeText={setHeightFt}
                        keyboardType="numeric"
                        maxLength={1}
                        style={styles.metricInputTextSmall}
                        placeholder="5"
                        placeholderTextColor={colors.textMuted}
                      />
                      <T variant="bodySemi" dim>ft</T>
                    </Row>
                    <Row align="center" gap={4}>
                      <TextInput
                        value={heightIn}
                        onChangeText={setHeightIn}
                        keyboardType="numeric"
                        maxLength={2}
                        style={styles.metricInputTextSmall}
                        placeholder="9"
                        placeholderTextColor={colors.textMuted}
                      />
                      <T variant="bodySemi" dim>in</T>
                    </Row>
                  </Row>
                </View>
                <View style={styles.metricInputCard}>
                  <T variant="micro" muted>CURRENT WEIGHT</T>
                  <Row align="center" gap={8} style={{ marginTop: 4 }}>
                    <TextInput
                      value={weightLbs}
                      onChangeText={setWeightLbs}
                      keyboardType="numeric"
                      maxLength={4}
                      style={styles.metricInputText}
                      placeholder="150"
                      placeholderTextColor={colors.textMuted}
                    />
                    <T variant="bodySemi" dim>lbs</T>
                  </Row>
                </View>
              </View>
            )}

            {/* Live BMI Preview Card */}
            {liveBmi ? (
              <View style={styles.bmiCard}>
                <Row align="space-between">
                  <View>
                    <T variant="micro" muted>CALCULATED BMI</T>
                    <T variant="h2" accent style={{ marginTop: 2 }}>{liveBmi}</T>
                  </View>
                  <View style={[styles.bmiBadge, {
                    backgroundColor: liveBmi < 18.5 ? `${colors.cyan}1A` : liveBmi < 25 ? `${colors.accent}1A` : liveBmi < 30 ? `${colors.gold}1A` : `${colors.red}1A`,
                    borderColor: liveBmi < 18.5 ? `${colors.cyan}44` : liveBmi < 25 ? `${colors.accent}44` : liveBmi < 30 ? `${colors.gold}44` : `${colors.red}44`,
                  }]}>
                    <T variant="smallSemi" style={{
                      color: liveBmi < 18.5 ? colors.cyan : liveBmi < 25 ? colors.accent : liveBmi < 30 ? colors.gold : colors.red,
                    }}>
                      {liveBmi < 18.5 ? 'Underweight' : liveBmi < 25 ? 'Normal / Healthy' : liveBmi < 30 ? 'Overweight' : 'High BMI'}
                    </T>
                  </View>
                </Row>
                <T variant="small" dim style={{ marginTop: 6, fontSize: 12 }}>
                  {liveBmi < 18.5
                    ? 'Target nutrient-dense meals & progressive strength overload.'
                    : liveBmi < 25
                    ? 'Optimal metabolic baseline for lean muscle growth & strength.'
                    : liveBmi < 30
                    ? 'Great foundation to build dense muscle and body recomposition.'
                    : 'Focus on regular training consistency and caloric balance.'}
                </T>
              </View>
            ) : null}
          </View>
        ) : null}

        {step === 4 ? (
          <View style={styles.grid}>
            {GOALS.map((g) => {
              const sel = goals.includes(g.label);
              return (
                <Pressable
                  key={g.label}
                  onPress={() =>
                    setGoals((prev) => (sel ? prev.filter((x) => x !== g.label) : prev.length >= 2 ? prev : [...prev, g.label]))
                  }
                  style={[styles.goalCard, sel && { borderColor: colors.accent, backgroundColor: colors.accentSoft }]}>
                  <Icon name={g.icon} size={24} color={sel ? colors.accent : colors.textDim} />
                  <T variant="bodySemi" style={{ fontSize: 14, marginTop: 8 }}>
                    {g.label}
                  </T>
                  {sel ? (
                    <View style={[styles.check, { backgroundColor: colors.accent }]}>
                      <Icon name="checkmark" size={12} color={colors.bg} />
                    </View>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        ) : null}

        {step === 5 ? (
          <View style={{ gap: spacing.sm, marginTop: spacing.xl }}>
            {EXPERIENCE.map((e) => (
              <Pressable
                key={e.label}
                onPress={() => setExperience(e.label as UserProfile['experience'])}
                style={[styles.optionCard, experience === e.label && { borderColor: colors.accent, backgroundColor: colors.accentSoft }]}>
                <Icon name={e.icon} size={22} color={experience === e.label ? colors.accent : colors.textDim} />
                <View style={{ flex: 1 }}>
                  <T variant="bodySemi">{e.label}</T>
                  <T variant="small" muted>
                    {e.desc}
                  </T>
                </View>
                {experience === e.label ? <Icon name="checkmark-circle" size={22} color={colors.accent} /> : null}
              </Pressable>
            ))}
          </View>
        ) : null}

        {step === 6 ? (
          <View style={styles.chipWrap}>
            {FREQUENCY.map((f) => (
              <Chip key={f} label={f} selected={frequency === f} onPress={() => setFrequency(f)} style={{ paddingHorizontal: 22, paddingVertical: 14 }} />
            ))}
          </View>
        ) : null}

        {step === 7 || step === 8 ? (
          <View style={styles.chipWrap}>
            {(step === 7 ? EQUIPMENT : STYLES).map((e) => {
              const list = step === 7 ? equipment : styles2;
              const setList = step === 7 ? setEquipment : setStyles2;
              const sel = list.includes(e);
              return (
                <Chip
                  key={e}
                  label={e}
                  selected={sel}
                  onPress={() => setList((prev: string[]) => (sel ? prev.filter((x) => x !== e) : [...prev, e]))}
                  style={{ paddingHorizontal: 18, paddingVertical: 13 }}
                />
              );
            })}
          </View>
        ) : null}

        {step === 9 ? (
          <View style={{ marginTop: spacing.xl }}>
            <View style={styles.inputWrap}>
              <Icon name="person-outline" size={20} color={colors.textMuted} />
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Your name"
                placeholderTextColor={colors.textMuted}
                style={styles.input}
                autoFocus
              />
            </View>
          </View>
        ) : null}
      </View>

      <View style={styles.footer}>
        <Button label={s.cta} onPress={next} disabled={!canNext()} full size="lg" iconRight="arrow-forward" />
        <Pressable
          onPress={() => {
            // Skipping must still seed the demo data and profile so the app
            // isn't left empty — only the questionnaire is bypassed.
            finish(defaultProfile());
          }}
          style={{ marginTop: 14 }}>
          <T variant="smallMedium" dim center>
            Skip for now
          </T>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: spacing.lg, paddingTop: 60 },
  backBtn: {
    position: 'absolute',
    top: 52,
    left: spacing.md,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  progressRow: { flexDirection: 'row', gap: 6, marginBottom: spacing.xl, justifyContent: 'center' },
  progressDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.surface3 },
  content: { flex: 1 },
  welcome: { alignItems: 'center', marginTop: spacing.xxl },
  welcomeArt: {
    width: 120,
    height: 120,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.xl },
  goalCard: {
    width: '47%',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 108,
  },
  accentRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: spacing.sm },
  accentSwatchWrap: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  accentSwatchWrapSel: { borderColor: colors.text, transform: [{ scale: 1.06 }] },
  accentSwatch: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  check: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.xl },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderBright,
    paddingHorizontal: spacing.md,
  },
  input: { flex: 1, paddingVertical: 16, color: colors.text, fontSize: 16, fontFamily: 'Inter_500Medium' },
  unitToggle: {
    flexDirection: 'row',
    backgroundColor: colors.surface2,
    borderRadius: radius.pill,
    padding: 3,
    borderWidth: 1,
    borderColor: colors.border,
  },
  unitToggleBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricInputCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
  },
  metricInputText: {
    fontSize: 22,
    color: colors.text,
    fontFamily: 'SpaceGrotesk_600SemiBold',
    minWidth: 70,
  },
  metricInputTextSmall: {
    fontSize: 22,
    color: colors.text,
    fontFamily: 'SpaceGrotesk_600SemiBold',
    minWidth: 35,
  },
  bmiCard: {
    backgroundColor: colors.surface2,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginTop: spacing.xs,
  },
  bmiBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  footer: { paddingBottom: 40, alignItems: 'center' },
});
