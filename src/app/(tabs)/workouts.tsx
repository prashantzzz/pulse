import { Ionicons } from '@expo/vector-icons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Image, Linking, Pressable, StyleSheet, View } from 'react-native';

import { T } from '../../components/Text';
import { BottomSheet, EmptyState, toast } from '../../components/misc';
import { ExerciseThumb, planIcon } from '../../components/muscle-icon';
import { Button, Card, Chip, Row, Screen, Segmented, Tag } from '../../components/ui';
import { PlanCard } from '../../components/workout-card';
import { AnimatedChevron, CollapsibleContent, animateLayout } from '../../components/collapsible';
import { EXERCISE_MAP } from '../../data/exercises';
import {
  PROGRAM_TEMPLATES,
  SCIENTIFIC_CITATIONS,
  SCIENTIFIC_PRINCIPLES,
  templateToPlans,
  type ProgramTemplate,
  type TemplateDay,
} from '../../data/templates';
import {
  recommendTemplate,
  type CardioGuidance,
  type RecommendationResult,
} from '../../lib/recommendations';
import { usePulse } from '../../store/useStore';
import { colors, gradients, layout, radius, spacing, useAccent } from '../../theme';
import type { Difficulty, WorkoutPlan } from '../../types';

type ExperienceFilter = 'All' | Difficulty;
type DaysFilter = 'All' | '3 Days' | '4 Days' | '5 Days';

export default function WorkoutsScreen() {
  useAccent();
  const router = useRouter();
  const startWorkout = usePulse((s) => s.startWorkout);
  const plans = usePulse((s) => s.plans);
  const setPlans = usePulse((s) => s.setPlans);
  const profile = usePulse((s) => s.profile);

  const params = useLocalSearchParams<{ tab?: string }>();
  const [tab, setTab] = useState<'My Plans' | 'Templates'>(params.tab === 'templates' ? 'Templates' : 'My Plans');

  // Allow deep-linking straight to the Templates segment (e.g. from the Log hub).
  useEffect(() => {
    if (params.tab === 'templates') setTab('Templates');
  }, [params.tab]);

  // Compute personalized template recommendation from canonical user profile
  const recommendation = useMemo(() => {
    return recommendTemplate({
      experienceLevel: profile?.experience,
      daysPerWeek: profile?.frequencyPerWeek,
      goals: profile?.goal,
    });
  }, [profile?.experience, profile?.frequencyPerWeek, profile?.goal]);

  // Default filters to the user's current onboarding profile for instant relevance
  const defaultExp: ExperienceFilter = profile?.experience ?? 'All';
  const defaultDays: DaysFilter =
    profile?.frequencyPerWeek === 3
      ? '3 Days'
      : profile?.frequencyPerWeek === 4
      ? '4 Days'
      : profile?.frequencyPerWeek === 5
      ? '5 Days'
      : 'All';

  const [expFilter, setExpFilter] = useState<ExperienceFilter>(defaultExp);
  const [daysFilter, setDaysFilter] = useState<DaysFilter>(defaultDays);

  // Modal states
  const [replaceTarget, setReplaceTarget] = useState<ProgramTemplate | null>(null);
  const [sourcesOpen, setSourcesOpen] = useState(false);

  const begin = (plan: WorkoutPlan) => {
    const w = startWorkout(plan.title, plan.exercises, plan.id);
    router.push(`/workout/${w.id}`);
  };

  const handleApplyTemplate = (template: ProgramTemplate) => {
    if (plans.length > 0) {
      setReplaceTarget(template);
    } else {
      applyTemplateDirectly(template);
    }
  };

  const applyTemplateDirectly = (template: ProgramTemplate) => {
    const newPlans = templateToPlans(template, usePulse.getState().exerciseDefaults);
    setPlans(newPlans);
    toast(`${template.title} activated!`);
    setTab('My Plans');
    setReplaceTarget(null);
  };

  // Filter templates for the "All Templates" browsing section
  const filteredTemplates = PROGRAM_TEMPLATES.filter((t) => {
    if (expFilter !== 'All' && t.experience !== expFilter) return false;
    if (daysFilter !== 'All') {
      const daysCount = parseInt(daysFilter.split(' ')[0], 10);
      if (t.daysPerWeek !== daysCount) return false;
    }
    return true;
  });

  return (
    <Screen
      scroll
      onSwipeRight={() => router.navigate('/(tabs)/home' as never)}
      onSwipeLeft={() => router.navigate('/(tabs)/progress' as never)}
      contentStyle={{ paddingBottom: layout.tabContentBottomPad, paddingTop: layout.screenTopPad }}>
      {/* Header */}
      <Row align="space-between" style={{ marginBottom: spacing.md }}>
        <View style={{ flex: 1 }}>
          <T variant="h2">My Workouts</T>
          <T variant="small" dim style={{ marginTop: 2 }}>
            {tab === 'My Plans'
              ? plans.length > 0
                ? `${plans.length} plan${plans.length > 1 ? 's' : ''} · active routine`
                : 'No active plan · choose a template'
              : `${PROGRAM_TEMPLATES.length} evidence-based programs`}
          </T>
        </View>
        <Row gap={8}>
          {tab === 'Templates' ? (
            <Pressable
              style={styles.iconBtn}
              onPress={() => setSourcesOpen(true)}
              accessibilityRole="button"
              accessibilityLabel="Scientific sources and evidence guidelines">
              <Ionicons name="information-circle-outline" size={22} color={colors.accent} />
            </Pressable>
          ) : null}
          <Pressable style={styles.iconBtn} onPress={() => router.push('/library' as never)}>
            <Ionicons name="search" size={20} color={colors.textDim} />
          </Pressable>
          <Pressable style={styles.iconBtn} onPress={() => router.push('/builder' as never)}>
            <Ionicons name="add" size={22} color={colors.accent} />
          </Pressable>
        </Row>
      </Row>

      {/* Main Tabs: My Plans | Templates */}
      <Segmented options={['My Plans', 'Templates']} value={tab} onChange={setTab} />

      {/* Tab: My Plans */}
      {tab === 'My Plans' ? (
        <View style={{ marginTop: spacing.lg, gap: spacing.md }}>
          {plans.length === 0 ? (
            <View style={{ marginTop: 10 }}>
              <EmptyState
                icon="barbell-outline"
                title="No Active Workout Plan"
                body="Select an evidence-based routine from our templates or build your own custom split."
                cta="Browse Workout Templates"
                onCta={() => setTab('Templates')}
              />
              <View style={{ marginTop: spacing.md }}>
                <Button
                  label="Build a Custom Workout"
                  icon="create-outline"
                  variant="outline"
                  full
                  onPress={() => router.push('/builder' as never)}
                />
              </View>
            </View>
          ) : (
            <>
              {plans.map((p) => (
                <PlanCard
                  key={p.id}
                  plan={p}
                  onStart={() => begin(p)}
                  onEdit={() => router.push(`/builder?plan=${p.id}` as never)}
                />
              ))}

              <View style={{ marginTop: spacing.md }}>
                <Button
                  label="Add Custom Workout Day"
                  icon="create-outline"
                  variant="outline"
                  full
                  onPress={() => router.push('/builder' as never)}
                />
              </View>
            </>
          )}
        </View>
      ) : (
        /* Tab: Templates */
        <View style={{ marginTop: spacing.lg, gap: spacing.xl }}>
          {/* Top Section: Recommended Hero Card */}
          <View style={{ gap: spacing.sm }}>
            <Row align="space-between" style={{ paddingHorizontal: 2 }}>
              <T variant="label" accent style={{ letterSpacing: 0.8 }}>
                YOUR RECOMMENDED PLAN
              </T>
              <T variant="micro" dim>
                Based on your profile
              </T>
            </Row>

            <RecommendedHeroCard
              recommendation={recommendation}
              onUse={() => handleApplyTemplate(recommendation.modifiedTemplate)}
            />
          </View>

          {/* Bottom Section: All Templates Browser */}
          <View style={{ gap: spacing.md, marginTop: spacing.sm }}>
            <View style={{ gap: 4 }}>
              <T variant="h3">All Templates</T>
              <T variant="micro" dim>
                Browse all 9 evidence-based splits or filter by experience and days
              </T>
            </View>

            {/* Filter 1: Experience */}
            <View style={{ gap: 6 }}>
              <T variant="micro" dim style={{ textTransform: 'uppercase', letterSpacing: 0.8 }}>
                Experience Level
              </T>
              <Row gap={8} wrap>
                {(['All', 'Beginner', 'Intermediate', 'Advanced'] as const).map((lvl) => (
                  <Chip
                    key={lvl}
                    label={lvl}
                    selected={expFilter === lvl}
                    onPress={() => setExpFilter(lvl)}
                  />
                ))}
              </Row>
            </View>

            {/* Filter 2: Days / Week */}
            <View style={{ gap: 6, marginTop: 2 }}>
              <T variant="micro" dim style={{ textTransform: 'uppercase', letterSpacing: 0.8 }}>
                Training Frequency
              </T>
              <Row gap={8} wrap>
                {(['All', '3 Days', '4 Days', '5 Days'] as const).map((d) => (
                  <Chip
                    key={d}
                    label={d}
                    selected={daysFilter === d}
                    onPress={() => setDaysFilter(d)}
                  />
                ))}
              </Row>
            </View>

            {/* Template Cards List */}
            <View style={{ marginTop: spacing.xs, gap: spacing.lg }}>
              {filteredTemplates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onUse={() => handleApplyTemplate(template)}
                />
              ))}

              {filteredTemplates.length === 0 ? (
                <Card style={{ padding: spacing.xl, alignItems: 'center' }}>
                  <Ionicons name="filter-outline" size={32} color={colors.textMuted} />
                  <T variant="body" dim center style={{ marginTop: 8 }}>
                    No templates match the selected filter combination.
                  </T>
                </Card>
              ) : null}
            </View>
          </View>
        </View>
      )}

      {/* Replace Plan Confirmation BottomSheet */}
      <BottomSheet
        visible={replaceTarget != null}
        onClose={() => setReplaceTarget(null)}
        title="Replace your current plan?">
        {replaceTarget ? (
          <View style={{ gap: spacing.md }}>
            <View style={styles.warningBox}>
              <Ionicons name="alert-circle" size={22} color={colors.gold} />
              <View style={{ flex: 1 }}>
                <T variant="bodySemi" style={{ color: colors.gold }}>
                  Existing Plan Overwrite
                </T>
                <T variant="small" dim style={{ marginTop: 4, lineHeight: 18 }}>
                  This will replace your existing workout plan with{' '}
                  <T variant="smallSemi" style={{ color: colors.text }}>
                    {replaceTarget.title} ({replaceTarget.days.length} days)
                  </T>
                  . Your completed workout history will not be deleted.
                </T>
              </View>
            </View>

            <T variant="micro" muted style={{ lineHeight: 16 }}>
              ✓ Your logged workout history, PRs, and personal records remain completely untouched and safe.
            </T>

            <Row gap={10} style={{ marginTop: spacing.sm }}>
              <Button
                label="Cancel"
                variant="outline"
                style={{ flex: 1 }}
                onPress={() => setReplaceTarget(null)}
              />
              <Button
                label="Replace Plan"
                variant="primary"
                style={{ flex: 1.2 }}
                onPress={() => applyTemplateDirectly(replaceTarget)}
              />
            </Row>
          </View>
        ) : null}
      </BottomSheet>

      {/* Scientific Sources & Principles BottomSheet */}
      <BottomSheet
        visible={sourcesOpen}
        onClose={() => setSourcesOpen(false)}
        title="Evidence-Based Programming">
        <View style={{ gap: spacing.md, paddingBottom: spacing.md }}>
          <View style={styles.bannerImageWrap}>
            <Image
              source={require('../../../assets/images/template-calculation.png')}
              style={styles.bannerImage}
              resizeMode="contain"
            />
          </View>

          <T variant="small" dim style={{ lineHeight: 20 }}>
            NextRep&apos;s workout templates are synthesized from peer-reviewed sports science, progressive overload
            principles, and the latest resistance training consensus.
          </T>

          <T variant="label" accent style={{ marginTop: 4 }}>
            CORE PRINCIPLES
          </T>
          <View style={{ gap: 8 }}>
            {SCIENTIFIC_PRINCIPLES.map((p, i) => (
              <View key={i} style={styles.principleRow}>
                <View style={styles.principleDot} />
                <View style={{ flex: 1 }}>
                  <T variant="smallSemi">{p.title}</T>
                  <T variant="micro" dim style={{ marginTop: 2, lineHeight: 16 }}>
                    {p.desc}
                  </T>
                </View>
              </View>
            ))}
          </View>

          <T variant="label" accent style={{ marginTop: 6 }}>
            RESEARCH CITATIONS
          </T>
          <View style={{ gap: 6 }}>
            {SCIENTIFIC_CITATIONS.map((cit) => (
              <Pressable
                key={cit.id}
                onPress={() => Linking.openURL(cit.url).catch(() => toast('Could not open link'))}
                style={({ pressed }) => [styles.citationCard, pressed && { opacity: 0.85 }]}>
                <Row align="space-between" style={{ width: '100%' }}>
                  <T variant="smallSemi" numberOfLines={1} style={{ flex: 1, marginRight: spacing.sm }}>
                    {cit.title}
                  </T>
                  <Row gap={4} align="center">
                    <T variant="micro" accent>
                      {cit.sourceName}
                    </T>
                    <Ionicons name="open-outline" size={13} color={colors.accent} />
                  </Row>
                </Row>
              </Pressable>
            ))}
          </View>

          <Button label="Got It" variant="outline" full onPress={() => setSourcesOpen(false)} />
        </View>
      </BottomSheet>
    </Screen>
  );
}

// ---------------------------------------------------------------------------
// Recommended Hero Card Component
// ---------------------------------------------------------------------------

function RecommendedHeroCard({
  recommendation,
  onUse,
}: {
  recommendation: RecommendationResult;
  onUse: () => void;
}) {
  const [tipsOpen, setTipsOpen] = useState(false);
  const template = recommendation.modifiedTemplate;
  const totalExercises = template.days.reduce((sum, d) => sum + d.exercises.length, 0);
  const totalSets = template.days.reduce(
    (sum, d) => sum + d.exercises.reduce((sSum, e) => sSum + e.sets, 0),
    0,
  );
  const allMuscles = [...new Set(template.days.flatMap((d) => d.muscles))];

  return (
    <View style={styles.heroCard}>
      {/* Header Banner */}
      <View style={styles.templateHeader}>
        <Row align="space-between">
          <Row gap={6} wrap style={{ flex: 1 }}>
            <Tag label="Recommended Pick" color={colors.gold} bg={colors.goldSoft} />
            <Tag label={template.experience} color={colors.accent} bg={colors.accentSoft} />
            <Tag label={`${template.daysPerWeek} Days`} color={colors.textDim} bg={colors.surface3} />
            <Tag label={recommendation.emphasisBadge} color={colors.cyan} bg={`${colors.cyan}1E`} />
          </Row>
          <T variant="micro" muted>
            {template.durationLabel}
          </T>
        </Row>

        <T variant="h2" style={{ marginTop: 12 }}>
          {template.title}
        </T>

        <T variant="small" dim style={{ marginTop: 4, lineHeight: 19 }}>
          {recommendation.emphasisDescription}
        </T>

        <Row gap={4} wrap style={{ marginTop: 10 }}>
          {allMuscles.map((m) => (
            <Tag key={m} label={m} color={colors.textDim} bg={colors.surface3} />
          ))}
        </Row>

        <Row align="space-between" style={{ marginTop: 10 }}>
          <T variant="micro" muted>
            {template.days.length} workouts · {totalExercises} exercises · {totalSets} weekly sets
          </T>
        </Row>
      </View>

      {/* Plan Coaching Tips Accordion */}
      <View style={styles.heroTipsSection}>
        <Pressable
          onPress={() => {
            animateLayout();
            setTipsOpen((o) => !o);
          }}
          style={styles.heroTipsHeader}>
          <Row gap={8} align="center" style={{ flex: 1 }}>
            <Ionicons name="bulb-outline" size={16} color={colors.gold} />
            <T variant="smallSemi" style={{ color: colors.gold }}>
              Plan Tips & Guidelines ({recommendation.coachingTips.length})
            </T>
          </Row>
          <AnimatedChevron isOpen={tipsOpen} size={16} color={colors.gold} />
        </Pressable>

        <CollapsibleContent isOpen={tipsOpen} style={styles.heroTipsBody}>
          <View style={{ gap: 8, paddingTop: 6 }}>
            {recommendation.coachingTips.map((tip, i) => (
              <View key={i} style={styles.tipCard}>
                <T variant="micro" accent style={{ fontWeight: '700' }}>
                  {tip.title}
                </T>
                <T variant="micro" dim style={{ marginTop: 2, lineHeight: 16 }}>
                  {tip.desc}
                </T>
              </View>
            ))}
          </View>
        </CollapsibleContent>
      </View>

      {/* Dedicated Cardio & Activity Guidance (outside resistance exercises) */}
      {recommendation.cardioGuidance ? (
        <CardioGuidanceCard guidance={recommendation.cardioGuidance} />
      ) : null}

      {/* Divider */}
      <View style={styles.templateDivider} />

      {/* Collapsible Day Preview Cards */}
      <View style={styles.daysListWrap}>
        <T variant="label" dim style={{ marginBottom: 4 }}>
          WORKOUT DAYS ({template.days.length})
        </T>
        {template.days.map((day, idx) => (
          <CollapsibleTemplateDay key={day.id} day={day} index={idx} />
        ))}
      </View>

      {/* Hero CTA Button */}
      <View style={styles.templateFooter}>
        <Pressable
          onPress={onUse}
          style={({ pressed }) => [styles.useTemplateBtn, pressed && { opacity: 0.88 }]}>
          <LinearGradient
            colors={[...gradients.accent]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[StyleSheet.absoluteFill, { borderRadius: radius.pill }]}
          />
          <T variant="bodySemi" style={{ color: colors.bg, fontSize: 14.5 }}>
            Use This Template
          </T>
          <Ionicons name="arrow-forward" size={16} color={colors.bg} />
        </Pressable>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Dedicated Cardio Guidance Card Component
// ---------------------------------------------------------------------------

function CardioGuidanceCard({ guidance }: { guidance: CardioGuidance }) {
  const [open, setOpen] = useState(false);

  return (
    <View style={styles.cardioCard}>
      <Pressable
        onPress={() => {
          animateLayout();
          setOpen((o) => !o);
        }}
        style={styles.cardioHeader}>
        <Row gap={8} align="center" style={{ flex: 1 }}>
          <View style={styles.cardioIconWrap}>
            <Ionicons name="heart-outline" size={16} color={colors.cyan} />
          </View>
          <View style={{ flex: 1 }}>
            <Row gap={6} align="center">
              <T variant="smallSemi">{guidance.title}</T>
              <Tag label={guidance.weeklySessions} color={colors.cyan} bg={`${colors.cyan}1E`} />
            </Row>
            <T variant="micro" dim numberOfLines={1} style={{ marginTop: 2 }}>
              {guidance.subtitle}
            </T>
          </View>
        </Row>
        <AnimatedChevron isOpen={open} size={16} color={colors.cyan} />
      </Pressable>

      <CollapsibleContent isOpen={open} style={styles.cardioBody}>
        <View style={{ gap: 8, paddingTop: 6 }}>
          {guidance.sessions.map((sess, idx) => (
            <View key={idx} style={styles.cardioSessionRow}>
              <Row align="space-between">
                <T variant="smallSemi" style={{ color: colors.text }}>
                  {sess.name}
                </T>
                <T variant="micro" accent>
                  {sess.duration}
                </T>
              </Row>
              <T variant="micro" dim style={{ marginTop: 2 }}>
                {sess.activity} · <T variant="micro" muted>{sess.intensity}</T>
              </T>
              <T variant="micro" muted style={{ marginTop: 4, lineHeight: 15 }}>
                {sess.notes}
              </T>
            </View>
          ))}

          {guidance.coachingNotes.map((note, idx) => (
            <T key={idx} variant="micro" dim style={{ lineHeight: 16, fontStyle: 'italic' }}>
              💡 {note}
            </T>
          ))}
        </View>
      </CollapsibleContent>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Template Card with in-place Collapsible Days and Exercises
// ---------------------------------------------------------------------------

function TemplateCard({
  template,
  onUse,
}: {
  template: ProgramTemplate;
  onUse: () => void;
}) {
  const totalExercises = template.days.reduce((sum, d) => sum + d.exercises.length, 0);
  const totalSets = template.days.reduce(
    (sum, d) => sum + d.exercises.reduce((sSum, e) => sSum + e.sets, 0),
    0,
  );

  // Collect all unique muscle groups targeted in this template
  const allMuscles = [...new Set(template.days.flatMap((d) => d.muscles))];

  return (
    <View style={styles.templateCard}>
      {/* Top Banner */}
      <View style={styles.templateHeader}>
        <Row align="space-between">
          <Row gap={6} wrap style={{ flex: 1 }}>
            {template.isRecommended ? (
              <Tag
                label={template.scientificBadge ?? 'Recommended'}
                color={colors.gold}
                bg={colors.goldSoft}
              />
            ) : null}
            <Tag label={template.experience} color={colors.accent} bg={colors.accentSoft} />
            <Tag label={`${template.daysPerWeek} Days`} color={colors.textDim} bg={colors.surface3} />
          </Row>
          <T variant="micro" muted>
            {template.durationLabel}
          </T>
        </Row>

        <T variant="h2" style={{ marginTop: 10 }}>
          {template.title}
        </T>

        <T variant="small" dim style={{ marginTop: 4, lineHeight: 19 }}>
          {template.description}
        </T>

        <Row gap={4} wrap style={{ marginTop: 8 }}>
          {allMuscles.map((m) => (
            <Tag key={m} label={m} color={colors.textDim} bg={colors.surface3} />
          ))}
        </Row>

        <Row align="space-between" style={{ marginTop: 10 }}>
          <T variant="micro" muted>
            {template.days.length} workouts · {totalExercises} exercises · {totalSets} weekly sets
          </T>
        </Row>
      </View>

      {/* Divider */}
      <View style={styles.templateDivider} />

      {/* Collapsible Day Preview Cards */}
      <View style={styles.daysListWrap}>
        <T variant="label" dim style={{ marginBottom: 4 }}>
          WORKOUT DAYS ({template.days.length})
        </T>
        {template.days.map((day, idx) => (
          <CollapsibleTemplateDay key={day.id} day={day} index={idx} />
        ))}
      </View>

      {/* CTA Button */}
      <View style={styles.templateFooter}>
        <Pressable
          onPress={onUse}
          style={({ pressed }) => [styles.useTemplateBtn, pressed && { opacity: 0.88 }]}>
          <LinearGradient
            colors={[...gradients.accent]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[StyleSheet.absoluteFill, { borderRadius: radius.pill }]}
          />
          <T variant="bodySemi" style={{ color: colors.bg, fontSize: 14.5 }}>
            Use This Template
          </T>
          <Ionicons name="arrow-forward" size={16} color={colors.bg} />
        </Pressable>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Collapsible Template Day Component
// ---------------------------------------------------------------------------

function CollapsibleTemplateDay({
  day,
  index,
}: {
  day: TemplateDay;
  index: number;
}) {
  const [open, setOpen] = useState(false);
  const daySets = day.exercises.reduce((acc, e) => acc + e.sets, 0);

  const toggleOpen = () => {
    animateLayout();
    setOpen((o) => !o);
  };

  return (
    <View style={styles.dayCard}>
      <Pressable
        onPress={toggleOpen}
        accessibilityRole="button"
        accessibilityLabel={`${day.title}, ${day.exercises.length} exercises`}
        accessibilityState={{ expanded: open }}
        style={({ pressed }) => [styles.dayHeader, pressed && { opacity: 0.85 }]}>
        <Row gap={8} align="center" style={{ flex: 1 }}>
          <View style={styles.dayEmojiWrap}>
            <MaterialCommunityIcons name={planIcon(day.emoji)} size={16} color={colors.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Row gap={6} align="center">
              <T variant="bodySemi" style={{ fontSize: 14 }}>
                {day.title}
              </T>
            </Row>
            <T variant="micro" dim numberOfLines={1} style={{ marginTop: 1 }}>
              {day.exercises.length} exercises · {daySets} sets
              {day.focusDescription ? ` · ${day.focusDescription}` : ''}
            </T>
          </View>
        </Row>
        <AnimatedChevron
          isOpen={open}
          size={18}
          color={open ? colors.accent : colors.textMuted}
        />
      </Pressable>

      {/* Expandable exercises list */}
      <CollapsibleContent isOpen={open} style={styles.dayExercisesWrap}>
        <View style={styles.dayExercisesDivider} />
        {day.exercises.map((spec, i) => {
          const ex = EXERCISE_MAP[spec.exerciseId];
          if (!ex) return null;
          return (
            <View key={`${spec.exerciseId}-${i}`} style={styles.exRow}>
              <ExerciseThumb muscle={ex.muscleGroup} size={28} />
              <View style={{ flex: 1 }}>
                <T variant="smallSemi" numberOfLines={1}>
                  {ex.name}
                </T>
                <T variant="micro" muted>
                  {ex.equipment} · {ex.muscleGroup}
                </T>
              </View>
              <View style={styles.repBadge}>
                <T variant="micro" accent style={{ fontWeight: '600' }}>
                  {spec.sets} × {spec.targetReps}
                </T>
              </View>
            </View>
          );
        })}
      </CollapsibleContent>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1.5,
    borderColor: `${colors.accent}55`,
    overflow: 'hidden',
  },
  heroTipsSection: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    backgroundColor: colors.surface2,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: `${colors.gold}33`,
    overflow: 'hidden',
  },
  heroTipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  heroTipsBody: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  tipCard: {
    backgroundColor: colors.surface3,
    padding: spacing.sm,
    borderRadius: radius.sm,
  },
  cardioCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    backgroundColor: colors.surface2,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: `${colors.cyan}33`,
    overflow: 'hidden',
  },
  cardioHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  cardioIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: `${colors.cyan}22`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardioBody: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  cardioSessionRow: {
    backgroundColor: colors.surface3,
    padding: spacing.sm,
    borderRadius: radius.sm,
  },
  templateCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  templateHeader: {
    padding: spacing.lg,
  },
  templateDivider: {
    height: 1,
    backgroundColor: colors.border,
  },
  daysListWrap: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.xs,
  },
  dayCard: {
    backgroundColor: colors.surface2,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  dayEmojiWrap: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: colors.surface3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayExercisesWrap: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    gap: 4,
  },
  dayExercisesDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginBottom: 4,
  },
  exRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 4,
  },
  repBadge: {
    backgroundColor: colors.accentSoft,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  templateFooter: {
    padding: spacing.lg,
    paddingTop: spacing.xs,
  },
  useTemplateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: colors.goldSoft,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.gold,
  },
  principleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: colors.surface3,
    padding: spacing.sm,
    borderRadius: radius.md,
  },
  principleDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accent,
    marginTop: 6,
  },
  bannerImageWrap: {
    width: '100%',
    aspectRatio: 1805 / 793,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#080A0E',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  citationCard: {
    backgroundColor: colors.surface3,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
