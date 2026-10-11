import { useRef } from 'react';
import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

import { usePromoCountUp } from '../promo/count-up';
import { colors, type } from '../theme';

export type TextVariant = keyof typeof type;

export interface TextProps extends RNTextProps {
  variant?: TextVariant;
  color?: string;
  /** dim secondary color */
  dim?: boolean;
  muted?: boolean;
  accent?: boolean;
  center?: boolean;
  weight?: 'regular' | 'medium' | 'semibold' | 'bold';
}

const weightMap = {
  regular: { fontWeight: '400' },
  medium: { fontWeight: '500' },
  semibold: { fontWeight: '600' },
  bold: { fontWeight: '700' },
} as const;

export function T({
  variant = 'body',
  color,
  dim,
  muted,
  accent,
  center,
  weight,
  style,
  children,
  ...rest
}: TextProps) {
  // Promo build: numeric metric labels count up on appear (no-op otherwise).
  const nodeRef = useRef<unknown>(null);
  const isNumericVariant = variant === 'num' || variant === 'numLg' || variant === 'numSm';
  const shownChildren = usePromoCountUp(children, isNumericVariant, nodeRef);
  const a11yLabel =
    rest.accessibilityLabel ??
    (isNumericVariant && (typeof children === 'string' || typeof children === 'number')
      ? String(children)
      : undefined);

  return (
    <RNText
      ref={nodeRef as never}
      accessibilityLabel={a11yLabel}
      style={[
        type[variant],
        // PULSE is a dark theme — light text is the default so no text ever
        // renders invisible on a dark surface. Override with dim/muted/accent
        // or an explicit `color` (e.g. dark text on lime buttons).
        { color: colors.text },
        dim && { color: colors.textDim },
        muted && { color: colors.textMuted },
        accent && { color: colors.accent },
        color && { color },
        center && { textAlign: 'center' },
        weight && weightMap[weight],
        style,
      ]}
      {...rest}>
      {shownChildren}
    </RNText>
  );
}
