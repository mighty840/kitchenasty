import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext.js';

export default function RusticFooter() {
  const { t } = useTranslation();
  const { settings } = useTheme();

  return (
    <footer className="bg-stone-800 text-stone-400">
      {/* Textured top border */}
      <div className="h-2 bg-gradient-to-r from-stone-700 via-amber-800 to-stone-700" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-5">
              {settings.logo ? (
                <img src={settings.logo} alt={settings.siteName} className="w-10 h-10 rounded object-cover border-2 border-stone-600" />
              ) : (
                <div className="w-10 h-10 bg-amber-800 rounded flex items-center justify-center border-2 border-stone-600">
                  <span className="text-stone-100 font-bold text-lg">{settings.siteName.charAt(0)}</span>
                </div>
              )}
              <span className="text-xl font-bold text-stone-200 tracking-wide">{settings.siteName}</span>
            </div>
            <p className="text-sm leading-relaxed">
              {t('footer.description')}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-stone-200 font-semibold mb-4 border-b border-stone-600 pb-2">{t('footer.quickLinks')}</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/menu" className="hover:text-amber-400 transition-colors">{t('nav.menu')}</Link></li>
              <li><Link to="/locations" className="hover:text-amber-400 transition-colors">{t('nav.locations')}</Link></li>
              <li><Link to="/reservations" className="hover:text-amber-400 transition-colors">{t('nav.reservations')}</Link></li>
            </ul>
          </div>

          {/* Account */}
          <div>
            <h3 className="text-stone-200 font-semibold mb-4 border-b border-stone-600 pb-2">{t('footer.account')}</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/login" className="hover:text-amber-400 transition-colors">{t('nav.login')}</Link></li>
              <li><Link to="/register" className="hover:text-amber-400 transition-colors">{t('footer.createAccount')}</Link></li>
              <li><Link to="/account" className="hover:text-amber-400 transition-colors">{t('nav.myAccount')}</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-stone-200 font-semibold mb-4 border-b border-stone-600 pb-2">Legal</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/privacy-policy" className="hover:text-amber-400 transition-colors">Privacy Policy</Link></li>
              <li><Link to="/impressum" className="hover:text-amber-400 transition-colors">Impressum</Link></li>
              <li>
                <button
                  onClick={() => window.dispatchEvent(new Event('open-cookie-settings'))}
                  className="hover:text-amber-400 transition-colors"
                >
                  Cookie Settings
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-stone-700 mt-10 pt-8 text-center">
          <p className="text-sm text-stone-500">
            &copy; {new Date().getFullYear()} {settings.siteName}. {t('footer.allRightsReserved')}
          </p>
        </div>
      </div>
    </footer>
  );
}
