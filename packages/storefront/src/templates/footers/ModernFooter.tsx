import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext.js';

export default function ModernFooter() {
  const { t } = useTranslation();
  const { settings } = useTheme();

  return (
    <footer className="relative bg-gray-900/80 backdrop-blur-xl text-gray-400 border-t border-white/10">
      {/* Gradient accent line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary-500 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-5">
              {settings.logo ? (
                <img src={settings.logo} alt={settings.siteName} className="w-9 h-9 rounded-lg object-cover ring-1 ring-white/20" />
              ) : (
                <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center ring-1 ring-white/20">
                  <span className="text-white font-bold text-sm">{settings.siteName.charAt(0)}</span>
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
            <h3 className="text-white font-medium mb-4 text-sm uppercase tracking-wider">{t('footer.quickLinks')}</h3>
            <ul className="space-y-3 text-sm">
              <li><Link to="/menu" className="hover:text-primary-400 transition-colors">{t('nav.menu')}</Link></li>
              <li><Link to="/locations" className="hover:text-primary-400 transition-colors">{t('nav.locations')}</Link></li>
              <li><Link to="/reservations" className="hover:text-primary-400 transition-colors">{t('nav.reservations')}</Link></li>
            </ul>
          </div>

          {/* Account */}
          <div>
            <h3 className="text-white font-medium mb-4 text-sm uppercase tracking-wider">{t('footer.account')}</h3>
            <ul className="space-y-3 text-sm">
              <li><Link to="/login" className="hover:text-primary-400 transition-colors">{t('nav.login')}</Link></li>
              <li><Link to="/register" className="hover:text-primary-400 transition-colors">{t('footer.createAccount')}</Link></li>
              <li><Link to="/account" className="hover:text-primary-400 transition-colors">{t('nav.myAccount')}</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-white font-medium mb-4 text-sm uppercase tracking-wider">Legal</h3>
            <ul className="space-y-3 text-sm">
              <li><Link to="/privacy-policy" className="hover:text-primary-400 transition-colors">Privacy Policy</Link></li>
              <li><Link to="/impressum" className="hover:text-primary-400 transition-colors">Impressum</Link></li>
              <li>
                <button
                  onClick={() => window.dispatchEvent(new Event('open-cookie-settings'))}
                  className="hover:text-primary-400 transition-colors"
                >
                  Cookie Settings
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 mt-10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-500">
            &copy; {new Date().getFullYear()} {settings.siteName}. {t('footer.allRightsReserved')}
          </p>
          <div className="h-1 w-16 rounded-full bg-gradient-to-r from-primary-500 to-primary-700" />
        </div>
      </div>
    </footer>
  );
}
