import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext.js';

export default function SleekFooter() {
  const { t } = useTranslation();
  const { settings } = useTheme();

  return (
    <footer className="bg-gray-950 text-gray-500 relative overflow-hidden">
      {/* Glow accent */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-px bg-gradient-to-r from-transparent via-cyan-500 to-transparent" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-24 bg-cyan-500/5 blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-5">
              {settings.logo ? (
                <img src={settings.logo} alt={settings.siteName} className="w-9 h-9 rounded-lg object-cover" />
              ) : (
                <div className="w-9 h-9 bg-gray-800 rounded-lg flex items-center justify-center border border-gray-700">
                  <span className="text-cyan-400 font-bold text-sm">{settings.siteName.charAt(0)}</span>
                </div>
              )}
              <span className="text-xl font-semibold text-white">{settings.siteName}</span>
            </div>
            <p className="text-sm leading-relaxed">
              {t('footer.description')}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-gray-300 font-medium mb-4 text-sm">{t('footer.quickLinks')}</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/menu" className="hover:text-cyan-400 transition-colors">{t('nav.menu')}</Link></li>
              <li><Link to="/locations" className="hover:text-cyan-400 transition-colors">{t('nav.locations')}</Link></li>
              <li><Link to="/reservations" className="hover:text-cyan-400 transition-colors">{t('nav.reservations')}</Link></li>
            </ul>
          </div>

          {/* Account */}
          <div>
            <h3 className="text-gray-300 font-medium mb-4 text-sm">{t('footer.account')}</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/login" className="hover:text-cyan-400 transition-colors">{t('nav.login')}</Link></li>
              <li><Link to="/register" className="hover:text-cyan-400 transition-colors">{t('footer.createAccount')}</Link></li>
              <li><Link to="/account" className="hover:text-cyan-400 transition-colors">{t('nav.myAccount')}</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-gray-300 font-medium mb-4 text-sm">Legal</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/privacy-policy" className="hover:text-cyan-400 transition-colors">Privacy Policy</Link></li>
              <li><Link to="/impressum" className="hover:text-cyan-400 transition-colors">Impressum</Link></li>
              <li>
                <button
                  onClick={() => window.dispatchEvent(new Event('open-cookie-settings'))}
                  className="hover:text-cyan-400 transition-colors"
                >
                  Cookie Settings
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-8 text-center relative">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-800 to-transparent" />
          <p className="text-xs text-gray-600">
            &copy; {new Date().getFullYear()} {settings.siteName}. {t('footer.allRightsReserved')}
          </p>
        </div>
      </div>
    </footer>
  );
}
