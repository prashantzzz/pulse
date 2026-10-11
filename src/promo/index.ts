/**
 */
export { PROMO, PROMO_ENABLED } from './config';
export type { PromoMotionMode } from './config';

export { PromoRoot } from './director';

export {
  PromoReveal,
  PromoScreen,
  PromoStagger,
  PromoPlayProvider,
  PromoCompactProvider,
  resetPromoSequence,
  usePromoPlay,
  usePromoCompact,
} from './reveal';
export type { RevealVariant, PromoPlayState } from './reveal';

export { PromoMetric, usePromoCountUp, parseMetric, formatMetric } from './metric';
export type { ParsedNumber } from './metric';

export { EASE, useReducedMotion, prefersReducedMotionSync, driveNumber } from './motion';
export { staggerDrive, setCssTransition, clearCssTransition } from './dataviz';

export { applyPromoData, forcePromoAuth, resetPromoData } from './install';
