import { lazy } from 'react';
import type { TemplateId } from '../index.js';

const ElegantFooter = lazy(() => import('./ElegantFooter.js'));
const BoldFooter = lazy(() => import('./BoldFooter.js'));
const MinimalFooter = lazy(() => import('./MinimalFooter.js'));
const CozyFooter = lazy(() => import('./CozyFooter.js'));
const ModernFooter = lazy(() => import('./ModernFooter.js'));
const RusticFooter = lazy(() => import('./RusticFooter.js'));
const VibrantFooter = lazy(() => import('./VibrantFooter.js'));
const SleekFooter = lazy(() => import('./SleekFooter.js'));
const RetroFooter = lazy(() => import('./RetroFooter.js'));

export const footerVariants: Partial<Record<TemplateId, React.ComponentType>> = {
  elegant: ElegantFooter,
  bold: BoldFooter,
  minimal: MinimalFooter,
  cozy: CozyFooter,
  modern: ModernFooter,
  rustic: RusticFooter,
  vibrant: VibrantFooter,
  sleek: SleekFooter,
  retro: RetroFooter,
};
