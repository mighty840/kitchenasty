import { lazy } from 'react';
import type { TemplateId } from '../index.js';

const ElegantHeader = lazy(() => import('./ElegantHeader.js'));
const BoldHeader = lazy(() => import('./BoldHeader.js'));
const MinimalHeader = lazy(() => import('./MinimalHeader.js'));
const CozyHeader = lazy(() => import('./CozyHeader.js'));
const ModernHeader = lazy(() => import('./ModernHeader.js'));
const RusticHeader = lazy(() => import('./RusticHeader.js'));
const VibrantHeader = lazy(() => import('./VibrantHeader.js'));
const SleekHeader = lazy(() => import('./SleekHeader.js'));
const RetroHeader = lazy(() => import('./RetroHeader.js'));

export const headerVariants: Partial<Record<TemplateId, React.ComponentType>> = {
  elegant: ElegantHeader,
  bold: BoldHeader,
  minimal: MinimalHeader,
  cozy: CozyHeader,
  modern: ModernHeader,
  rustic: RusticHeader,
  vibrant: VibrantHeader,
  sleek: SleekHeader,
  retro: RetroHeader,
};
