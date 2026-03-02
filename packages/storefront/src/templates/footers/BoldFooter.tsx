import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext.js';

export default function BoldFooter() {
  const { t } = useTranslation();
  const { settings } = useTheme();

  return (
    <footer className="bg-gray-950 text-gray-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-3 mb-5">
              {settings.logo ? (
                <img src={settings.logo} alt={settings.siteName} className="w-12 h-12 rounded-xl object-cover" />
              ) : (
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
                  <span className="text-gray-950 font-black text-xl">{settings.siteName.charAt(0)}</span>
                </div>
              )}
              <span className="text-3xl font-black text-white tracking-tight">{settings.siteName}</span>
            </div>
            <p className="text-base leading-relaxed font-medium">
              {t('footer.description')}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-black text-lg uppercase tracking-wider mb-5">{t('footer.quickLinks')}</h3>
            <ul className="space-y-3 text-base font-semibold">
              <li><Link to="/menu" className="hover:text-white transition-colors">{t('nav.menu')}</Link></li>
              <li><Link to="/locations" className="hover:text-white transition-colors">{t('nav.locations')}</Link></li>
              <li><Link to="/reservations" className="hover:text-white transition-colors">{t('nav.reservations')}</Link></li>
            </ul>
          </div>

          {/* Account */}
          <div>
            <h3 className="text-white font-black text-lg uppercase tracking-wider mb-5">{t('footer.account')}</h3>
            <ul className="space-y-3 text-base font-semibold">
              <li><Link to="/login" className="hover:text-white transition-colors">{t('nav.login')}</Link></li>
              <li><Link to="/register" className="hover:text-white transition-colors">{t('footer.createAccount')}</Link></li>
              <li><Link to="/account" className="hover:text-white transition-colors">{t('nav.myAccount')}</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-white font-black text-lg uppercase tracking-wider mb-5">Legal</h3>
            <ul className="space-y-3 text-base font-semibold">
              <li><Link to="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link to="/impressum" className="hover:text-white transition-colors">Impressum</Link></li>
              <li>
                <button
                  onClick={() => window.dispatchEvent(new Event('open-cookie-settings'))}
                  className="hover:text-white transition-colors font-semibold"
                >
                  Cookie Settings
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t-4 border-gray-800 mt-12 pt-8 text-center">
          <p className="text-lg font-bold text-gray-500">
            &copy; {new Date().getFullYear()} {settings.siteName}. {t('footer.allRightsReserved')}
          </p>
        </div>
      </div>
    </footer>
  );
}
