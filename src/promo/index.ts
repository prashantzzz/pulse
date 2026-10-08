/**
 * Promo layer public API (promo/kinetic branch only).
 */
export { PROMO, PROMO_ENABLED } from './config';
export { PromoRoot } from './director';
export { PromoReveal, PromoPlayProvider, resetPromoSequence, usePromoPlay } from './reveal';
export { usePromoCountUp } from './count-up';
export { applyPromoData, forcePromoAuth, resetPromoData } from './install';
