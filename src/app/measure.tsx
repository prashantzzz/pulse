import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { T } from '../components/Text';
import { Stepper, toast } from '../components/misc';
import { Button, Card, Screen, ScreenHeader } from '../components/ui';
import { usePulse } from '../store/useStore';
import { colors, radius, spacing } from '../theme';

export default function MeasureScreen() {
  const addMeasurement = usePulse((s) => s.addMeasurement);
  const measurements = usePulse((s) => s.measurements);
  const last = measurements[measurements.length - 1];
  const [weight, setWeight] = useState(last?.weightKg ?? 80);
  const [bodyFat, setBodyFat] = useState<number>(last?.bodyFatPct ?? 20);
  const [chest, setChest] = useState<number>(last?.chestCm ?? 100);
  const [waist, setWaist] = useState<number>(last?.waistCm ?? 85);
  const [biceps, setBiceps] = useState<number>(last?.bicepsCm ?? 36);

  const save = () => {
    addMeasurement({
      id: `m${Date.now()}`,
      date: new Date().toISOString(),
      weightKg: Math.round(weight * 10) / 10,
      bodyFatPct: Math.round(bodyFat * 10) / 10,
      chestCm: chest,
      waistCm: waist,
      bicepsCm: biceps,
    });
    toast('Measurement saved');
  };

  return (
    <Screen scroll>
      <ScreenHeader title="Body Measurement" subtitle="Track the changes that matter" back />
      <View style={{ paddingHorizontal: spacing.lg }}>
        <Card style={{ padding: spacing.lg, gap: spacing.xl }}>
          <Field label="Weight (kg)" value={weight} onChange={setWeight} step={0.5} decimals={1} />
          <Field label="Body fat (%)" value={bodyFat} onChange={setBodyFat} step={0.5} decimals={1} />
          <Field label="Chest (cm)" value={chest} onChange={setChest} step={1} />
          <Field label="Waist (cm)" value={waist} onChange={setWaist} step={1} />
          <Field label="Biceps (cm)" value={biceps} onChange={setBiceps} step={0.5} decimals={1} />
        </Card>
        <Button label="Save Measurement" icon="checkmark" full size="lg" style={{ marginTop: spacing.lg }} onPress={save} />
      </View>
    </Screen>
  );
}

function Field({ label, value, onChange, step, decimals }: { label: string; value: number; onChange: (v: number) => void; step: number; decimals?: number }) {
  return (
    <View>
      <T variant="label" dim style={{ marginBottom: spacing.sm }}>
        {label}
      </T>
      <Stepper value={value} onChange={onChange} step={step} decimals={decimals} size="md" />
      <View style={styles.divider} />
    </View>
  );
}

const styles = StyleSheet.create({
  divider: { height: 1, backgroundColor: colors.border, marginTop: spacing.lg },
});
