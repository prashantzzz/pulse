import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { BackHandler, Pressable, StyleSheet, View } from 'react-native';

import { CountdownRing } from '../../../components/ring';
import { T } from '../../../components/Text';
import { BottomSheet, Stepper, toast } from '../../../components/misc';
import { Button, Screen } from '../../../components/ui';
import { PromoReveal } from '../../../promo/reveal';
import { colors, layout, spacing, useAccent } from '../../../theme';

const PRESETS = [30, 60, 90, 120];

export default function RestTimerScreen() {
  useAccent();
  const { id, sec, next } = useLocalSearchParams<{ id: string; sec?: string; next?: string }>();
  const router = useRouter();
  const [total, setTotal] = useState(Number(sec) || 90);
  const [remaining, setRemaining] = useState(Number(sec) || 90);
  const [paused, setPaused] = useState(false);
  const [done, setDone] = useState(false);
  const [customOpen, setCustomOpen] = useState(false);
  const [customSec, setCustomSec] = useState(150);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace(`/workout/${id}` as never);
    }
  };

  useEffect(() => {
    const onBackPress = () => {
      if (customOpen) {
        setCustomOpen(false);
        return true;
      }
      handleBack();
      return true;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [customOpen, router, id]);

  useEffect(() => {
    if (paused || done) return;
    const t = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(t);
          setDone(true);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [paused, done, total]);

  const pick = (s: number) => {
    setTotal(s);
    setRemaining(s);
    setDone(false);
    setPaused(false);
  };

  return (
    <View style={styles.root}>
      <Screen scroll contentStyle={{ paddingTop: layout.screenTopPad, alignItems: 'center' }}>
        {/* header */}
        <PromoReveal variant="fade" observe={false}>
        <View style={styles.header}>
          <Pressable onPress={handleBack} style={styles.backBtn} hitSlop={8}>
            <Ionicons name="chevron-back" size={22} color={colors.textDim} />
          </Pressable>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <T variant="label" dim>
              Rest Time
            </T>
            <T variant="small" muted style={{ fontSize: 12, marginTop: 2 }}>
              Next: {next ? decodeURIComponent(next) : 'Next set'}
            </T>
          </View>
          <View style={{ width: 38 }} />
        </View>
        </PromoReveal>

        <PromoReveal variant="hero" delay={80} observe={false}>
        <View style={{ marginTop: 40 }}>
          <CountdownRing
            totalSec={total}
            remainingSec={remaining}
            onComplete={() => {
              setDone(true);
            }}>
            {done ? null : (
              <Pressable onPress={() => setPaused((p) => !p)} style={styles.pauseBtn} hitSlop={10}>
                <Ionicons name={paused ? 'play' : 'pause'} size={26} color={colors.text} />
              </Pressable>
            )}
          </CountdownRing>
        </View>
        </PromoReveal>

        {done ? (
          <View style={{ alignItems: 'center', marginTop: spacing.xl }}>
            <T variant="h3" accent>
              Rest over — let&apos;s go!
            </T>
            <Button label="Next Set" icon="arrow-forward" full size="lg" style={{ marginTop: spacing.md, minWidth: 220 }} onPress={() => router.replace(`/workout/${id}` as never)} />
          </View>
        ) : (
          <>
            <PromoReveal delay={140} observe={false}>
            <View style={styles.presets}>
              {PRESETS.map((p) => (
                <Pressable
                  key={p}
                  onPress={() => {
                    pick(p);
                    toast(`${p}s rest started`);
                  }}
                  style={[styles.preset, total === p && { backgroundColor: colors.accent, borderColor: colors.accent }]}>
                  <T variant="smallSemi" style={{ color: total === p ? colors.bg : colors.text }}>
                    {p}s
                  </T>
                </Pressable>
              ))}
            </View>
            </PromoReveal>
            <Button label="+ Custom" variant="ghost" onPress={() => setCustomOpen(true)} style={{ marginTop: spacing.sm }} />
            <Pressable onPress={() => router.replace(`/workout/${id}` as never)} style={{ marginTop: spacing.lg }}>
              <T variant="smallMedium" dim>
                Skip rest
              </T>
            </Pressable>
          </>
        )}
      </Screen>

      <BottomSheet visible={customOpen} onClose={() => setCustomOpen(false)} title="Custom rest time">
        <Stepper value={customSec} onChange={setCustomSec} step={15} min={15} max={600} unit="seconds" />
        <Button
          label="Start Timer"
          full
          size="lg"
          style={{ marginTop: spacing.xl }}
          onPress={() => {
            pick(customSec);
            setCustomOpen(false);
          }}
        />
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pauseBtn: {
    position: 'absolute',
    bottom: -44,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.surface3,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderBright,
  },
  presets: { flexDirection: 'row', gap: 10, marginTop: 40 },
  preset: {
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
  },

});
