import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext.js';

export default function RetroFooter() {
  const { t } = useTranslation();
  const { settings } = useTheme();

  return (
    <footer className="bg-amber-950 text-amber-300/70">
      {/* Decorative top border */}
      <div className="h-1 bg-amber-600" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
        <div className="border-b border-dashed border-amber-700 h-0" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-5">
              {settings.logo ? (
                <img src={settings.logo} alt={settings.siteName} className="w-10 h-10 rounded object-cover border-2 border-amber-600" />
              ) : (
                <div className="w-10 h-10 bg-amber-800 rounded flex items-center justify-center border-2 border-amber-600">
                  <span className="text-amber-100 font-bold text-lg">{settings.siteName.charAt(0)}</span>
                </div>
              )}
              <span className="text-xl font-bold text-amber-100 tracking-wider uppercase">{settings.siteName}</span>
            </div>
            <p className="text-sm leading-relaxed italic">
              {t('footer.description')}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-amber-200 font-bold uppercase tracking-widest text-xs mb-5 border-b border-amber-800 pb-2">
              {t('footer.quickLinks')}
            </h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/menu" className="hover:text-amber-100 transition-colors">{t('nav.menu')}</Link></li>
              <li><Link to="/locations" className="hover:text-amber-100 transition-colors">{t('nav.locations')}</Link></li>
              <li><Link to="/reservations" className="hover:text-amber-100 transition-colors">{t('nav.reservations')}</Link></li>
            </ul>
          </div>

          {/* Account */}
          <div>
            <h3 className="text-amber-200 font-bold uppercase tracking-widest text-xs mb-5 border-b border-amber-800 pb-2">
              {t('footer.account')}
            </h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/login" className="hover:text-amber-100 transition-colors">{t('nav.login')}</Link></li>
              <li><Link to="/register" className="hover:text-amber-100 transition-colors">{t('footer.createAccount')}</Link></li>
              <li><Link to="/account" className="hover:text-amber-100 transition-colors">{t('nav.myAccount')}</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-amber-200 font-bold uppercase tracking-widest text-xs mb-5 border-b border-amber-800 pb-2">
              Legal
            </h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/privacy-policy" className="hover:text-amber-100 transition-colors">Privacy Policy</Link></li>
              <li><Link to="/impressum" className="hover:text-amber-100 transition-colors">Impressum</Link></li>
              <li>
                <button
                  onClick={() => window.dispatchEvent(new Event('open-cookie-settings'))}
                  className="hover:text-amber-100 transition-colors"
                >
                  Cookie Settings
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 text-center">
          <div className="border-t border-dashed border-amber-800 mb-6" />
          <p className="text-xs uppercase tracking-[0.3em] text-amber-500">
            &copy; {new Date().getFullYear()} {settings.siteName}. {t('footer.allRightsReserved')}
          </p>
        </div>
      </div>
    </footer>
  );
}
