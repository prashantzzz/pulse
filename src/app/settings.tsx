import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { BackHandler, Platform, Pressable, StyleSheet, Switch, TextInput, View } from 'react-native';

import { AccentPreview } from '../components/accent-preview';
import { T } from '../components/Text';
import { BottomSheet, toast } from '../components/misc';
import { Card, Icon, Row, Screen, ScreenHeader } from '../components/ui';
import { upsertProfile } from '../lib/auth';
import { parseWorkoutsCsv, workoutsToCsv, type CsvImportResult } from '../lib/csv';
import { isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from '../store/useAuth';
import { usePulse } from '../store/useStore';
import { ACCENTS, colors, radius, spacing, useAccent, type AccentKey } from '../theme';

const ACCENT_ORDER = Object.keys(ACCENTS) as AccentKey[];

export default function SettingsScreen() {
  useAccent();
  const router = useRouter();
  const user = useAuth((s) => s.user);
  const signOut = useAuth((s) => s.signOut);
  const isAuthenticated = useAuth((s) => s.isAuthenticated);
  const profile = usePulse((s) => s.profile);
  const setProfile = usePulse((s) => s.setProfile);
  const accentKey = usePulse((s) => s.accentKey);
  const setAccent = usePulse((s) => s.setAccent);
  const workouts = usePulse((s) => s.workouts);
  const importWorkouts = usePulse((s) => s.importWorkouts);
  const replaceWorkouts = usePulse((s) => s.replaceWorkouts);
  const clearAllData = usePulse((s) => s.clearAllData);
  const weightUnit = usePulse((s) => s.weightUnit);
  const setWeightUnit = usePulse((s) => s.setWeightUnit);

  const [editName, setEditName] = useState(false);
  const [nameDraft, setNameDraft] = useState(profile?.name ?? '');
  const [editGender, setEditGender] = useState(false);
  const [editAccent, setEditAccent] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const [haptics, setHaptics] = useState(true);
  const [autoRest, setAutoRest] = useState(true);
  const [importPreview, setImportPreview] = useState<CsvImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Intercept phone back button to dismiss open bottom sheets or return to Profile
  useEffect(() => {
    const onBackPress = () => {
      if (editName) {
        setEditName(false);
        return true;
      }
      if (editGender) {
        setEditGender(false);
        return true;
      }
      if (editAccent) {
        setEditAccent(false);
        return true;
      }
      if (confirmClear) {
        setConfirmClear(false);
        return true;
      }
      if (confirmSignOut) {
        setConfirmSignOut(false);
        return true;
      }
      if (importPreview) {
        setImportPreview(null);
        return true;
      }
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/(tabs)/profile' as never);
      }
      return true;
    };

    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [editName, editGender, editAccent, confirmClear, confirmSignOut, importPreview, router]);

  const exportCSV = async () => {
    if (workouts.length === 0) {
      toast('No workouts to export yet');
      return;
    }
    const csv = workoutsToCsv(workouts);
    try {
      if (Platform.OS === 'web') {
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'nextrep-workouts.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        try {
          await navigator.clipboard.writeText(csv);
          toast(`Exported ${workouts.length} workouts · file downloaded & copied`);
        } catch {
          toast(`Exported ${workouts.length} workouts · file downloaded`);
        }
      } else {
        const uri = `${FileSystem.cacheDirectory}nextrep-workouts.csv`;
        await FileSystem.writeAsStringAsync(uri, csv);
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri, { mimeType: 'text/csv', dialogTitle: 'Export workouts' });
        } else {
          await FileSystem.copyAsync({ from: uri, to: `${FileSystem.documentDirectory}nextrep-workouts.csv` });
          toast(`Saved ${workouts.length} workouts`);
        }
      }
    } catch {
      toast('Export failed');
    }
  };

  const pickImport = async () => {
    try {
      if (Platform.OS === 'web') {
        fileInputRef.current?.click();
      } else {
        const res = await DocumentPicker.getDocumentAsync({
          type: ['text/csv', 'text/comma-separated-values', 'application/csv'],
          copyToCacheDirectory: true,
        });
        if (res.canceled || !res.assets?.length) return;
        const text = await FileSystem.readAsStringAsync(res.assets[0].uri);
        handleImported(text);
      }
    } catch {
      toast('Import failed');
    }
  };

  const handleImported = (text: string) => {
    try {
      const result = parseWorkoutsCsv(text);
      if (result.error || !result.workouts.length) {
        toast(result.error ?? 'No workouts found in that file');
        return;
      }
      setImportPreview(result);
    } catch {
      toast('Failed to parse CSV. Check column headers.');
    }
  };

  const confirmImport = (wipeFirst = false) => {
    if (!importPreview) return;
    const n = importPreview.workouts.length;
    if (wipeFirst) {
      replaceWorkouts(importPreview.workouts);
      toast(`Wiped previous data & imported ${n} workout${n === 1 ? '' : 's'}`);
    } else {
      importWorkouts(importPreview.workouts);
      toast(`Merged ${n} workout${n === 1 ? '' : 's'}`);
    }
    setImportPreview(null);
  };

  const handleSignOut = async () => {
    setConfirmSignOut(false);
    await signOut();
    toast('Signed out');
    router.replace('/auth/login' as never);
  };

  const previewSets = importPreview?.workouts.reduce((acc, w) => acc + w.exercises.reduce((a, e) => a + e.sets.length, 0), 0) ?? 0;

  return (
    <Screen scroll>
      <ScreenHeader
        title="Settings"
        back
        onBack={() => {
          if (router.canGoBack()) {
            router.back();
          } else {
            router.replace('/(tabs)/profile' as never);
          }
        }}
      />

      <View style={{ gap: spacing.md }}>
        {/* Account / Cloud Section */}
        <Card style={{ padding: spacing.md }}>
          <T variant="label" dim style={{ marginBottom: spacing.sm }}>
            Account & Identity
          </T>
          <Row align="space-between" style={styles.settingRow}>
            <Row gap={12} style={{ flex: 1 }}>
              <View style={[styles.settingIcon, { backgroundColor: colors.accentSoft }]}>
                <Icon name="shield-checkmark-outline" size={18} color={colors.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <T variant="bodySemi">
                  {isAuthenticated ? (user?.email ?? 'Authenticated Athlete') : 'Guest Account'}
                </T>
                <T variant="micro" muted>
                  {isAuthenticated
                    ? isSupabaseConfigured
                      ? 'Cloud sync active'
                      : 'Logged in (Local Session)'
                    : 'Not signed in'}
                </T>
              </View>
            </Row>
          </Row>

          {isAuthenticated ? (
            <Pressable onPress={() => setConfirmSignOut(true)} style={[styles.settingRow, { marginTop: 4 }]}>
              <Row gap={12} style={{ flex: 1 }}>
                <View style={[styles.settingIcon, { backgroundColor: colors.dangerSoft2 }]}>
                  <Icon name="log-out-outline" size={18} color={colors.red} />
                </View>
                <View>
                  <T variant="bodySemi" style={{ color: colors.red }}>
                    Sign Out
                  </T>
                  <T variant="micro" muted>
                    Sign out of this device
                  </T>
                </View>
              </Row>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </Pressable>
          ) : (
            <Pressable onPress={() => router.push('/auth/login' as never)} style={[styles.settingRow, { marginTop: 4 }]}>
              <Row gap={12} style={{ flex: 1 }}>
                <View style={[styles.settingIcon, { backgroundColor: colors.accentSoft }]}>
                  <Icon name="log-in-outline" size={18} color={colors.accent} />
                </View>
                <View>
                  <T variant="bodySemi" style={{ color: colors.accent }}>
                    Sign In / Create Account
                  </T>
                  <T variant="micro" muted>
                    Link and sync your workouts
                  </T>
                </View>
              </Row>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </Pressable>
          )}
        </Card>

        {/* Profile Details */}
        <Card style={{ padding: spacing.md }}>
          <T variant="label" dim style={{ marginBottom: spacing.sm }}>
            Profile
          </T>
          <Pressable onPress={() => setEditName(true)} style={styles.settingRow}>
            <Row gap={12} style={{ flex: 1 }}>
              <View style={[styles.settingIcon, { backgroundColor: colors.accentSoft }]}>
                <Icon name="person-outline" size={18} color={colors.accent} />
              </View>
              <View>
                <T variant="bodySemi">{profile?.name ?? 'Athlete'}</T>
                <T variant="micro" muted>
                  {profile?.experience} · {profile?.goal?.join(', ') ?? 'Get Stronger'}
                </T>
              </View>
            </Row>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </Pressable>
          <Pressable onPress={() => setEditGender(true)} style={styles.settingRow}>
            <Row gap={12} style={{ flex: 1 }}>
              <View style={[styles.settingIcon, { backgroundColor: colors.accentSoft }]}>
                <Icon name="body-outline" size={18} color={colors.accent} />
              </View>
              <View>
                <T variant="bodySemi">Body model</T>
                <T variant="micro" muted>
                  Muscle map shows a {(profile?.gender ?? 'male') === 'male' ? 'male' : 'female'} figure
                </T>
              </View>
            </Row>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </Pressable>
        </Card>

        {/* Appearance */}
        <Card style={{ padding: spacing.md }}>
          <T variant="label" dim style={{ marginBottom: spacing.sm }}>
            Appearance
          </T>
          <Pressable onPress={() => setEditAccent(true)} style={styles.settingRow}>
            <Row gap={12} style={{ flex: 1 }}>
              <View style={[styles.settingIcon, { backgroundColor: colors.accentSoft }]}>
                <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: ACCENTS[accentKey].accent }} />
              </View>
              <View>
                <T variant="bodySemi">App color</T>
                <T variant="micro" muted>
                  {ACCENTS[accentKey].label} · dark-theme friendly
                </T>
              </View>
            </Row>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </Pressable>
        </Card>

        {/* Preferences */}
        <Card style={{ padding: spacing.md }}>
          <View style={[styles.settingRow, { alignItems: 'center' }]}>
            <View style={{ flex: 1 }}>
              <T variant="bodySemi">Weight Units</T>
              <T variant="micro" muted>
                {weightUnit === 'kg' ? 'Metric — Kilograms (kg)' : 'Imperial — Pounds (lbs)'}
              </T>
            </View>
            <View style={{ flexDirection: 'row', backgroundColor: colors.surface3, borderRadius: radius.pill, padding: 3, borderWidth: 1, borderColor: colors.border }}>
              <Pressable
                onPress={() => setWeightUnit('kg')}
                style={[{ paddingHorizontal: 12, paddingVertical: 5, borderRadius: radius.pill }, weightUnit === 'kg' && { backgroundColor: colors.accent }]}>
                <T variant="micro" style={{ color: weightUnit === 'kg' ? colors.bg : colors.textDim, fontWeight: '700' }}>
                  KG
                </T>
              </Pressable>
              <Pressable
                onPress={() => setWeightUnit('lbs')}
                style={[{ paddingHorizontal: 12, paddingVertical: 5, borderRadius: radius.pill }, weightUnit === 'lbs' && { backgroundColor: colors.accent }]}>
                <T variant="micro" style={{ color: weightUnit === 'lbs' ? colors.bg : colors.textDim, fontWeight: '700' }}>
                  LBS
                </T>
              </Pressable>
            </View>
          </View>
          <PrefRow label="Auto-start rest timer" desc="After completing a set" onToggle={() => setAutoRest((v) => !v)} switchValue={autoRest} />
          <PrefRow label="Haptic feedback" desc="Vibration on set completion" onToggle={() => setHaptics((v) => !v)} switchValue={haptics} />
        </Card>

        {/* Data Management */}
        <Card style={{ padding: spacing.md }}>
          <T variant="label" dim style={{ marginBottom: spacing.sm }}>
            Your Data
          </T>
          <Pressable onPress={exportCSV} style={styles.settingRow}>
            <Row gap={12} style={{ flex: 1 }}>
              <View style={[styles.settingIcon, { backgroundColor: colors.accentSoft }]}>
                <Icon name="download-outline" size={18} color={colors.accent} />
              </View>
              <View>
                <T variant="bodySemi">Export CSV</T>
                <T variant="micro" muted>
                  {workouts.length} workouts · standard tracker format
                </T>
              </View>
            </Row>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </Pressable>
          <Pressable onPress={pickImport} style={styles.settingRow}>
            <Row gap={12} style={{ flex: 1 }}>
              <View style={[styles.settingIcon, { backgroundColor: colors.accentSoft }]}>
                <Icon name="cloud-upload-outline" size={18} color={colors.accent} />
              </View>
              <View>
                <T variant="bodySemi">Import CSV</T>
                <T variant="micro" muted>
                  Bring in workouts from any tracker
                </T>
              </View>
            </Row>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </Pressable>
          <Pressable onPress={() => setConfirmClear(true)} style={styles.settingRow}>
            <Row gap={12} style={{ flex: 1 }}>
              <View style={[styles.settingIcon, { backgroundColor: colors.dangerSoft2 }]}>
                <Icon name="trash-outline" size={18} color={colors.red} />
              </View>
              <View>
                <T variant="bodySemi" style={{ color: colors.red }}>
                  Clear all data
                </T>
                <T variant="micro" muted>
                  Start completely fresh
                </T>
              </View>
            </Row>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </Pressable>
        </Card>

        <Card style={{ padding: spacing.md }}>
          <T variant="label" dim style={{ marginBottom: spacing.sm }}>
            About & Legal
          </T>
          <Row align="space-between" style={{ paddingBottom: 10 }}>
            <Row gap={12}>
              <View style={[styles.settingIcon, { backgroundColor: colors.accentSoft }]}>
                <Icon name="pulse" size={18} color={colors.accent} />
              </View>
              <View>
                <T variant="bodySemi">NextRep</T>
                <T variant="micro" muted>
                  Train smart. Get strong.
                </T>
              </View>
            </Row>
          </Row>

          <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 4 }} />

          <Pressable onPress={() => router.push('/privacy' as never)} style={styles.settingRow}>
            <Row gap={12} style={{ flex: 1 }}>
              <View style={[styles.settingIcon, { backgroundColor: colors.surface3 }]}>
                <Icon name="shield-checkmark-outline" size={18} color={colors.accent} />
              </View>
              <View>
                <T variant="bodySemi">Privacy Policy</T>
                <T variant="micro" muted>
                  Data safety, local storage & rights
                </T>
              </View>
            </Row>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </Pressable>

          <Pressable onPress={() => router.push('/terms' as never)} style={styles.settingRow}>
            <Row gap={12} style={{ flex: 1 }}>
              <View style={[styles.settingIcon, { backgroundColor: colors.surface3 }]}>
                <Icon name="document-text-outline" size={18} color={colors.accent} />
              </View>
              <View>
                <T variant="bodySemi">Terms of Service</T>
                <T variant="micro" muted>
                  Health disclaimer & terms of use
                </T>
              </View>
            </Row>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </Pressable>
        </Card>
      </View>

      {/* hidden web file input for CSV import */}
      {Platform.OS === 'web' ? (
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv,text/comma-separated-values"
          style={{ display: 'none' }}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              file
                .text()
                .then((text) => handleImported(text))
                .catch(() => toast('Could not read that file'));
            }
            e.target.value = '';
          }}
        />
      ) : null}

      {/* edit app color */}
      <BottomSheet visible={editAccent} onClose={() => setEditAccent(false)} title="App color">
        <T variant="small" dim style={{ marginBottom: spacing.md }}>
          Pick the accent that powers the whole app. Changes apply instantly.
        </T>
        <View style={styles.accentRow}>
          {ACCENT_ORDER.map((k) => {
            const sel = accentKey === k;
            return (
              <Pressable
                key={k}
                onPress={() => {
                  setAccent(k);
                  setEditAccent(false);
                  toast(`App color: ${ACCENTS[k].label}`);
                }}
                accessibilityLabel={`${ACCENTS[k].label} accent`}
                style={[styles.accentSwatchWrap, sel && styles.accentSwatchWrapSel]}>
                <View style={[styles.accentSwatch, { backgroundColor: ACCENTS[k].accent }]}>
                  {sel ? <Icon name="checkmark" size={16} color={colors.bg} /> : null}
                </View>
              </Pressable>
            );
          })}
        </View>
        <T variant="smallSemi" center style={{ marginTop: spacing.md, color: ACCENTS[accentKey].accent, textTransform: 'capitalize' }}>
          {ACCENTS[accentKey].label}
        </T>
        <View style={{ marginTop: spacing.md }}>
          <AccentPreview palette={ACCENTS[accentKey]} />
        </View>
      </BottomSheet>

      {/* edit body model */}
      <BottomSheet visible={editGender} onClose={() => setEditGender(false)} title="Body model">
        <T variant="small" dim style={{ marginBottom: spacing.sm }}>
          Used by the muscle map in Progress and exercise form guides.
        </T>
        {(['male', 'female'] as const).map((g) => (
          <Pressable
            key={g}
            onPress={() => {
              setProfile({ gender: g });
              if (user?.id) {
                upsertProfile(user.id, { gender: g });
              }
              setEditGender(false);
              toast(`Body model set to ${g}`);
            }}
            style={[styles.genderOption, (profile?.gender ?? 'male') === g && { borderColor: colors.accent, backgroundColor: colors.accentSoft }]}>
            <Icon name={g === 'male' ? 'male' : 'female'} size={20} color={(profile?.gender ?? 'male') === g ? colors.accent : colors.textDim} />
            <T variant="bodySemi" style={{ flex: 1, textTransform: 'capitalize' }}>
              {g}
            </T>
            {(profile?.gender ?? 'male') === g ? <Icon name="checkmark-circle" size={20} color={colors.accent} /> : null}
          </Pressable>
        ))}
      </BottomSheet>

      {/* edit name */}
      <BottomSheet visible={editName} onClose={() => setEditName(false)} title="Edit name">
        <TextInput
          value={nameDraft}
          onChangeText={setNameDraft}
          placeholder="Your name"
          placeholderTextColor={colors.textMuted}
          style={styles.nameInput}
        />
        <Pressable
          onPress={() => {
            const updatedName = nameDraft.trim() || 'Athlete';
            setProfile({ name: updatedName });
            if (user?.id) {
              upsertProfile(user.id, { name: updatedName, display_name: updatedName });
            }
            setEditName(false);
            toast('Profile updated');
          }}
          style={[styles.saveBtn, { backgroundColor: colors.accent }]}>
          <T variant="bodySemi" style={{ color: colors.bg }}>
            Save
          </T>
        </Pressable>
      </BottomSheet>

      {/* import preview */}
      <BottomSheet visible={!!importPreview} onClose={() => setImportPreview(null)} title="Import workouts">
        {importPreview ? (
          <View style={{ gap: spacing.md }}>
            <Row align="space-between" gap={8}>
              <ImportStat value={`${importPreview.workouts.length}`} label="Workouts" />
              <ImportStat value={`${previewSets}`} label="Sets" />
              <ImportStat value={`${importPreview.newExercises.length}`} label="New exercises" />
            </Row>
            <View style={styles.previewList}>
              {importPreview.workouts.slice(0, 5).map((w) => (
                <Row key={w.id} align="space-between" style={{ paddingVertical: 6 }}>
                  <T variant="bodySemi">{w.title}</T>
                  <T variant="smallMedium" dim>
                    {new Date(w.startTime).toLocaleDateString()}
                  </T>
                </Row>
              ))}
              {importPreview.workouts.length > 5 ? (
                <T variant="micro" muted>
                  + {importPreview.workouts.length - 5} more
                </T>
              ) : null}
            </View>
            {importPreview.newExercises.length > 0 ? (
              <T variant="micro" dim>
                {importPreview.newExercises.slice(0, 3).join(', ')}
                {importPreview.newExercises.length > 3 ? ' …' : ''} added to your exercise library.
              </T>
            ) : null}
            {workouts.length > 0 ? (
              <View style={{ backgroundColor: colors.dangerSoft2, borderRadius: radius.md, padding: spacing.md, borderWidth: 1, borderColor: `${colors.red}44` }}>
                <Row gap={8} align="center">
                  <Ionicons name="warning-outline" size={18} color={colors.red} />
                  <T variant="bodySemi" style={{ color: colors.red }}>
                    Existing Workouts Detected
                  </T>
                </Row>
                <T variant="small" dim style={{ marginTop: 4, fontSize: 12 }}>
                  You already have {workouts.length} workout{workouts.length === 1 ? '' : 's'} recorded. You can choose to wipe out your previous data and replace it entirely with this CSV, or merge them.
                </T>
              </View>
            ) : null}

            {workouts.length > 0 ? (
              <View style={{ gap: spacing.sm, marginTop: spacing.xs }}>
                <Pressable onPress={() => confirmImport(true)} style={[styles.saveBtn, { backgroundColor: colors.red, marginTop: 0 }]}>
                  <T variant="bodySemi" style={{ color: colors.bg }}>
                    Wipe Previous Data & Replace ({importPreview.workouts.length})
                  </T>
                </Pressable>
                <Pressable onPress={() => confirmImport(false)} style={[styles.saveBtn, { backgroundColor: colors.surface3, borderWidth: 1, borderColor: colors.border, marginTop: 0 }]}>
                  <T variant="bodySemi" style={{ color: colors.text }}>
                    Merge with Existing Data
                  </T>
                </Pressable>
              </View>
            ) : (
              <Pressable onPress={() => confirmImport(false)} style={[styles.saveBtn, { backgroundColor: colors.accent }]}>
                <T variant="bodySemi" style={{ color: colors.bg }}>
                  Import {importPreview.workouts.length} workout{importPreview.workouts.length === 1 ? '' : 's'}
                </T>
              </Pressable>
            )}
          </View>
        ) : null}
      </BottomSheet>

      {/* confirm clear */}
      <BottomSheet visible={confirmClear} onClose={() => setConfirmClear(false)} title="Clear all data?">
        <T variant="body" dim>
          This removes every workout, measurement and achievement from this device. This can&apos;t be undone.
        </T>
        <Pressable
          onPress={() => {
            clearAllData();
            setConfirmClear(false);
            toast('All data cleared');
          }}
          style={[styles.saveBtn, { backgroundColor: colors.red, marginTop: spacing.lg }]}>
          <T variant="bodySemi" style={{ color: colors.bg }}>
            Yes, clear everything
          </T>
        </Pressable>
      </BottomSheet>

      {/* confirm sign out */}
      <BottomSheet visible={confirmSignOut} onClose={() => setConfirmSignOut(false)} title="Sign out?">
        <T variant="body" dim>
          You will be signed out of your cloud account. Your local workout history on this device will remain safely stored.
        </T>
        <Pressable
          onPress={handleSignOut}
          style={[styles.saveBtn, { backgroundColor: colors.red, marginTop: spacing.lg }]}>
          <T variant="bodySemi" style={{ color: colors.bg }}>
            Sign Out
          </T>
        </Pressable>
      </BottomSheet>
    </Screen>
  );
}

function ImportStat({ value, label }: { value: string; label: string }) {
  return (
    <View style={{ flex: 1, backgroundColor: colors.surface2, borderRadius: radius.md, padding: spacing.md, alignItems: 'center' }}>
      <T variant="h3" accent>
        {value}
      </T>
      <T variant="micro" muted>
        {label}
      </T>
    </View>
  );
}

function PrefRow({ label, desc, switchValue, onToggle, right }: { label: string; desc: string; switchValue: boolean; onToggle: () => void; right?: React.ReactNode }) {
  return (
    <View style={[styles.settingRow, { alignItems: 'center' }]}>
      <View style={{ flex: 1 }}>
        <T variant="bodySemi">{label}</T>
        <T variant="micro" muted>
          {desc}
        </T>
      </View>
      {right ?? <Switch value={switchValue} onValueChange={onToggle} trackColor={{ true: colors.accentDim, false: colors.surface4 }} thumbColor={switchValue ? colors.accent : colors.textMuted} />}
    </View>
  );
}

const styles = StyleSheet.create({
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameInput: {
    backgroundColor: colors.surface2,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    color: colors.text,
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
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
  genderOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.xs,
  },
  saveBtn: {
    marginTop: spacing.md,
    borderRadius: 999,
    paddingVertical: 15,
    alignItems: 'center',
  },
  previewList: {
    backgroundColor: colors.surface2,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  unitPill: {
    flexDirection: 'row',
    backgroundColor: colors.surface2,
    borderRadius: radius.pill,
    padding: 3,
    borderWidth: 1,
    borderColor: colors.border,
  },
  unitPillBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heightInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface2,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    gap: 8,
  },
  heightInput: {
    flex: 1,
    color: colors.text,
    fontSize: 20,
    fontFamily: 'SpaceGrotesk_600SemiBold',
  },
});
