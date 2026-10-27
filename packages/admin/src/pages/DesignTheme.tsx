import { useState, useEffect } from 'react';

import { useTranslation } from 'react-i18next';

function hexToHsl(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }
  return [h * 360, s * 100, l * 100];
}

function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function generatePalette(hex: string): Record<string, string> {
  const [h, s] = hexToHsl(hex);
  const shades: Record<string, number> = {
    '50': 96, '100': 90, '200': 80, '300': 70, '400': 60,
    '500': 50, '600': 40, '700': 33, '800': 26, '900': 20, '950': 12,
  };
  const result: Record<string, string> = {};
  for (const [key, lightness] of Object.entries(shades)) {
    result[key] = hslToHex(h, s, lightness);
  }
  return result;
}

export default function DesignTheme() {
  const { t } = useTranslation();
  const token = localStorage.getItem('token') || '';
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [colorPrimary, setColorPrimary] = useState('#ea580c');
  const [colorSecondary, setColorSecondary] = useState('#9333ea');
  const [darkMode, setDarkMode] = useState<'light' | 'dark' | 'system'>('light');

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((res) => {
        if (res.success && res.data) {
          setColorPrimary(res.data.colorPrimary);
          setColorSecondary(res.data.colorSecondary);
          setDarkMode(res.data.darkMode);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ colorPrimary, colorSecondary, darkMode }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(t('messages.theme_updated_successfully'));
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(typeof data.error === 'string' ? data.error : t('messages.failed_to_save'));
      }
    } catch {
      setError(t('messages.network_error'));
    } finally {
      setSaving(false);
    }
  }

  const primaryPalette = generatePalette(colorPrimary);
  const secondaryPalette = generatePalette(colorSecondary);

  if (loading) return <div className="p-6 text-gray-500">{t('pages.design_theme.loading')}</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('pages.design_theme.theme')}</h1>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50"
        >
          {saving ? t('pages.design_theme.saving') : t('pages.design_theme.save_changes')}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>
      )}
      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">{success}</div>
      )}

      {/* Colors */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('pages.design_theme.colors')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('pages.design_theme.primary_color')}</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={colorPrimary}
                onChange={(e) => setColorPrimary(e.target.value)}
                className="w-10 h-10 rounded cursor-pointer border border-gray-300"
              />
              <input
                type="text"
                value={colorPrimary}
                onChange={(e) => {
                  if (/^#[0-9a-fA-F]{6}$/.test(e.target.value)) setColorPrimary(e.target.value);
                }}
                className="w-28 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div className="mt-3 flex gap-1">
              {Object.entries(primaryPalette).map(([shade, color]) => (
                <div key={shade} className="flex-1 text-center">
                  <div className="h-8 rounded" style={{ backgroundColor: color }} />
                  <span className="text-[10px] text-gray-500">{shade}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('pages.design_theme.secondary_color')}</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={colorSecondary}
                onChange={(e) => setColorSecondary(e.target.value)}
                className="w-10 h-10 rounded cursor-pointer border border-gray-300"
              />
              <input
                type="text"
                value={colorSecondary}
                onChange={(e) => {
                  if (/^#[0-9a-fA-F]{6}$/.test(e.target.value)) setColorSecondary(e.target.value);
                }}
                className="w-28 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div className="mt-3 flex gap-1">
              {Object.entries(secondaryPalette).map(([shade, color]) => (
                <div key={shade} className="flex-1 text-center">
                  <div className="h-8 rounded" style={{ backgroundColor: color }} />
                  <span className="text-[10px] text-gray-500">{shade}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Dark Mode */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('pages.design_theme.dark_mode')}</h2>
        <div className="flex gap-4">
          {(['light', 'dark', 'system'] as const).map((mode) => (
            <label
              key={mode}
              className={`flex items-center gap-2 px-4 py-3 rounded-lg border-2 cursor-pointer transition-colors ${
                darkMode === mode
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type="radio"
                name="darkMode"
                value={mode}
                checked={darkMode === mode}
                onChange={() => setDarkMode(mode)}
                className="sr-only"
              />
              <span className="text-lg">
                {mode === 'light' ? '☀️' : mode === 'dark' ? '🌙' : '💻'}
              </span>
              <span className="text-sm font-medium text-gray-700 capitalize">{mode}</span>
            </label>
          ))}
        </div>
        <p className="mt-3 text-xs text-gray-500">

          {t('pages.design_theme.controls_the_default_appearance_of_the_storefront_syst')}
        </p>
      </div>
    </div>
  );
}
