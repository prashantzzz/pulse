import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { T } from '../components/Text';
import { Stepper, toast } from '../components/misc';
import { Button, Card, Row, Screen, ScreenHeader } from '../components/ui';
import { usePulse } from '../store/useStore';
import { colors, radius, spacing, useAccent } from '../theme';

export default function MeasureScreen() {
  useAccent();
  const addMeasurement = usePulse((s) => s.addMeasurement);
  const profile = usePulse((s) => s.profile);
  const setProfile = usePulse((s) => s.setProfile);
  const weightUnit = usePulse((s) => s.weightUnit);
  const measurements = usePulse((s) => s.measurements);

  const last = measurements[measurements.length - 1];
  const [height, setHeight] = useState(profile?.heightCm ?? 175);
  const [weight, setWeight] = useState(last?.weightKg ?? (profile?.weightKg ?? 70));
  const [bodyFat, setBodyFat] = useState<number>(last?.bodyFatPct ?? 20);
  const [chest, setChest] = useState<number>(last?.chestCm ?? 100);
  const [waist, setWaist] = useState<number>(last?.waistCm ?? 85);
  const [biceps, setBiceps] = useState<number>(last?.bicepsCm ?? 36);

  const heightM = height / 100;
  const liveBmi = heightM > 0.5 && weight > 20 ? Math.round((weight / (heightM * heightM)) * 10) / 10 : null;

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
    setProfile({ heightCm: height, weightKg: Math.round(weight * 10) / 10 });
    toast('Measurement & stats saved');
  };

  return (
    <Screen scroll>
      <ScreenHeader title="Body Measurement" subtitle="Track the changes that matter" back />
      <View style={{ gap: spacing.md }}>
        {/* Live BMI Banner */}
        {liveBmi ? (
          <Card style={{ padding: spacing.md, backgroundColor: colors.surface2 }}>
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
                  fontSize: 11,
                }}>
                  {liveBmi < 18.5 ? 'Underweight' : liveBmi < 25 ? 'Normal / Healthy' : liveBmi < 30 ? 'Overweight' : 'High BMI'}
                </T>
              </View>
            </Row>
          </Card>
        ) : null}

        <Card style={{ padding: spacing.lg, gap: spacing.xl }}>
          <Field
            label="Height (cm)"
            desc={`${Math.floor(height / 30.48)}'${Math.round((height % 30.48) / 2.54)}"`}
            value={height}
            onChange={setHeight}
            step={1}
          />
          <Field
            label={`Weight (${weightUnit === 'lbs' ? 'lbs' : 'kg'})`}
            desc={weightUnit === 'lbs' ? `~${(weight * 2.20462).toFixed(1)} lbs` : undefined}
            value={weight}
            onChange={setWeight}
            step={0.5}
            decimals={1}
          />
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

function Field({ label, desc, value, onChange, step, decimals }: { label: string; desc?: string; value: number; onChange: (v: number) => void; step: number; decimals?: number }) {
  return (
    <View>
      <Row align="space-between" style={{ marginBottom: spacing.sm }}>
        <T variant="label" dim>
          {label}
        </T>
        {desc ? (
          <T variant="micro" muted>
            {desc}
          </T>
        ) : null}
      </Row>
      <Stepper value={value} onChange={onChange} step={step} decimals={decimals} size="md" />
      <View style={styles.divider} />
    </View>
  );
}

const styles = StyleSheet.create({
  divider: { height: 1, backgroundColor: colors.border, marginTop: spacing.lg },
  bmiBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
});
