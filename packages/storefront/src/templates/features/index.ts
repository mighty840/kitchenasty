import { lazy } from 'react';
import type { TemplateId } from '../index.js';

export interface FeaturesProps {
  features: Array<{ icon: string; title: string; description: string }> | null;
  t: (key: string) => string;
}

const ElegantFeatures = lazy(() => import('./ElegantFeatures.js'));
const BoldFeatures = lazy(() => import('./BoldFeatures.js'));
const MinimalFeatures = lazy(() => import('./MinimalFeatures.js'));
const CozyFeatures = lazy(() => import('./CozyFeatures.js'));
const ModernFeatures = lazy(() => import('./ModernFeatures.js'));
const RusticFeatures = lazy(() => import('./RusticFeatures.js'));
const VibrantFeatures = lazy(() => import('./VibrantFeatures.js'));
const SleekFeatures = lazy(() => import('./SleekFeatures.js'));
const RetroFeatures = lazy(() => import('./RetroFeatures.js'));

export const featureVariants: Partial<Record<TemplateId, React.ComponentType<FeaturesProps>>> = {
  elegant: ElegantFeatures,
  bold: BoldFeatures,
  minimal: MinimalFeatures,
  cozy: CozyFeatures,
  modern: ModernFeatures,
  rustic: RusticFeatures,
  vibrant: VibrantFeatures,
  sleek: SleekFeatures,
  retro: RetroFeatures,
};
