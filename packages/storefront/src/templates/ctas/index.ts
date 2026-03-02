import { lazy } from 'react';
import type { TemplateId } from '../index.js';

interface CtaProps {
  cta: { title?: string; description?: string; buttonText?: string; buttonLink?: string } | null;
  t: (key: string) => string;
}

const ElegantCta = lazy(() => import('./ElegantCta.js'));
const BoldCta = lazy(() => import('./BoldCta.js'));
const MinimalCta = lazy(() => import('./MinimalCta.js'));
const CozyCta = lazy(() => import('./CozyCta.js'));
const ModernCta = lazy(() => import('./ModernCta.js'));
const RusticCta = lazy(() => import('./RusticCta.js'));
const VibrantCta = lazy(() => import('./VibrantCta.js'));
const SleekCta = lazy(() => import('./SleekCta.js'));
const RetroCta = lazy(() => import('./RetroCta.js'));

export const ctaVariants: Partial<Record<TemplateId, React.ComponentType<CtaProps>>> = {
  elegant: ElegantCta,
  bold: BoldCta,
  minimal: MinimalCta,
  cozy: CozyCta,
  modern: ModernCta,
  rustic: RusticCta,
  vibrant: VibrantCta,
  sleek: SleekCta,
  retro: RetroCta,
};

export type { CtaProps };
