import { lazy } from 'react';
import type { TemplateId } from '../index.js';

export interface HeroProps {
  hero: { title?: string; subtitle?: string; ctaPrimaryText?: string; ctaPrimaryLink?: string; ctaSecondaryText?: string; ctaSecondaryLink?: string; backgroundImage?: string } | null;
  t: (key: string) => string;
}

const ElegantHero = lazy(() => import('./ElegantHero.js'));
const BoldHero = lazy(() => import('./BoldHero.js'));
const MinimalHero = lazy(() => import('./MinimalHero.js'));
const CozyHero = lazy(() => import('./CozyHero.js'));
const ModernHero = lazy(() => import('./ModernHero.js'));
const RusticHero = lazy(() => import('./RusticHero.js'));
const VibrantHero = lazy(() => import('./VibrantHero.js'));
const SleekHero = lazy(() => import('./SleekHero.js'));
const RetroHero = lazy(() => import('./RetroHero.js'));

export const heroVariants: Partial<Record<TemplateId, React.ComponentType<HeroProps>>> = {
  elegant: ElegantHero,
  bold: BoldHero,
  minimal: MinimalHero,
  cozy: CozyHero,
  modern: ModernHero,
  rustic: RusticHero,
  vibrant: VibrantHero,
  sleek: SleekHero,
  retro: RetroHero,
};
