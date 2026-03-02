import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext.js';

export default function CozyFooter() {
  const { t } = useTranslation();
  const { settings } = useTheme();

  return (
    <footer className="bg-amber-50 text-amber-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              {settings.logo ? (
                <img src={settings.logo} alt={settings.siteName} className="w-10 h-10 rounded-2xl object-cover" />
              ) : (
                <div className="w-10 h-10 bg-amber-600 rounded-2xl flex items-center justify-center">
                  <span className="text-white font-bold text-lg">{settings.siteName.charAt(0)}</span>
                </div>
              )}
              <span className="text-xl font-bold text-amber-900">{settings.siteName}</span>
            </div>
            <p className="text-sm leading-relaxed text-amber-700">
              {t('footer.description')}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-amber-900 font-semibold mb-4">{t('footer.quickLinks')}</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/menu" className="hover:text-amber-950 transition-colors bg-amber-100 rounded-full px-3 py-1 inline-block">
                  {t('nav.menu')}
                </Link>
              </li>
              <li>
                <Link to="/locations" className="hover:text-amber-950 transition-colors bg-amber-100 rounded-full px-3 py-1 inline-block">
                  {t('nav.locations')}
                </Link>
              </li>
              <li>
                <Link to="/reservations" className="hover:text-amber-950 transition-colors bg-amber-100 rounded-full px-3 py-1 inline-block">
                  {t('nav.reservations')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Account */}
          <div>
            <h3 className="text-amber-900 font-semibold mb-4">{t('footer.account')}</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/login" className="hover:text-amber-950 transition-colors bg-amber-100 rounded-full px-3 py-1 inline-block">
                  {t('nav.login')}
                </Link>
              </li>
              <li>
                <Link to="/register" className="hover:text-amber-950 transition-colors bg-amber-100 rounded-full px-3 py-1 inline-block">
                  {t('footer.createAccount')}
                </Link>
              </li>
              <li>
                <Link to="/account" className="hover:text-amber-950 transition-colors bg-amber-100 rounded-full px-3 py-1 inline-block">
                  {t('nav.myAccount')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-amber-900 font-semibold mb-4">Legal</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/privacy-policy" className="hover:text-amber-950 transition-colors bg-amber-100 rounded-full px-3 py-1 inline-block">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/impressum" className="hover:text-amber-950 transition-colors bg-amber-100 rounded-full px-3 py-1 inline-block">
                  Impressum
                </Link>
              </li>
              <li>
                <button
                  onClick={() => window.dispatchEvent(new Event('open-cookie-settings'))}
                  className="hover:text-amber-950 transition-colors bg-amber-100 rounded-full px-3 py-1 inline-block"
                >
                  Cookie Settings
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-amber-200 mt-10 pt-8 text-center">
          <p className="text-sm text-amber-600">
            &copy; {new Date().getFullYear()} {settings.siteName}. {t('footer.allRightsReserved')}
          </p>
        </div>
      </div>
    </footer>
  );
}
