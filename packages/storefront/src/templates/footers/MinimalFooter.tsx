import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext.js';

export default function MinimalFooter() {
  const { t } = useTranslation();
  const { settings } = useTheme();

  return (
    <footer className="bg-white text-gray-500 border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Single row with brand and links */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            {settings.logo ? (
              <img src={settings.logo} alt={settings.siteName} className="w-6 h-6 rounded object-cover" />
            ) : (
              <div className="w-6 h-6 bg-gray-900 rounded flex items-center justify-center">
                <span className="text-white text-xs font-medium">{settings.siteName.charAt(0)}</span>
              </div>
            )}
            <span className="text-sm font-medium text-gray-900">{settings.siteName}</span>
            <span className="text-xs text-gray-400 hidden sm:inline">&mdash; {t('footer.description')}</span>
          </div>

          <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs">
            <Link to="/menu" className="hover:text-gray-900 transition-colors">{t('nav.menu')}</Link>
            <Link to="/locations" className="hover:text-gray-900 transition-colors">{t('nav.locations')}</Link>
            <Link to="/reservations" className="hover:text-gray-900 transition-colors">{t('nav.reservations')}</Link>
            <span className="text-gray-300">|</span>
            <Link to="/login" className="hover:text-gray-900 transition-colors">{t('nav.login')}</Link>
            <Link to="/register" className="hover:text-gray-900 transition-colors">{t('footer.createAccount')}</Link>
            <Link to="/account" className="hover:text-gray-900 transition-colors">{t('nav.myAccount')}</Link>
            <span className="text-gray-300">|</span>
            <Link to="/privacy-policy" className="hover:text-gray-900 transition-colors">Privacy Policy</Link>
            <Link to="/impressum" className="hover:text-gray-900 transition-colors">Impressum</Link>
            <button
              onClick={() => window.dispatchEvent(new Event('open-cookie-settings'))}
              className="hover:text-gray-900 transition-colors"
            >
              Cookie Settings
            </button>
          </nav>
        </div>

        <div className="mt-4 text-center md:text-right">
          <p className="text-xs text-gray-400">
            &copy; {new Date().getFullYear()} {settings.siteName}. {t('footer.allRightsReserved')}
          </p>
        </div>
      </div>
    </footer>
  );
}
