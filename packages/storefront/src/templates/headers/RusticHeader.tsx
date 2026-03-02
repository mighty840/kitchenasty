import { Link } from 'react-router-dom';
import LanguageSwitcher from '../../components/LanguageSwitcher.js';
import { useHeaderProps } from './useHeaderProps.js';

export default function RusticHeader() {
  const { t, user, logout, itemCount, openCart, settings, navLinks, isActive, mobileOpen, setMobileOpen } = useHeaderProps();

  return (
    <header className="bg-stone-100 dark:bg-stone-900 border-b-2 border-stone-300 dark:border-stone-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            {settings.logo ? (
              <img src={settings.logo} alt={settings.siteName} className="w-9 h-9 rounded-md object-cover border border-stone-300" />
            ) : (
              <div className="w-9 h-9 bg-stone-700 rounded-md flex items-center justify-center border border-stone-500">
                <span className="text-stone-100 font-bold text-sm">{settings.siteName.charAt(0)}</span>
              </div>
            )}
            <span className="text-xl font-bold text-stone-800 dark:text-stone-200" style={{ fontVariant: 'small-caps' }}>{settings.siteName}</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link key={link.to} to={link.to} className={`px-3 py-2 rounded text-sm font-medium transition-colors ${isActive(link.to) ? 'text-primary-700 bg-stone-200 dark:bg-stone-800 dark:text-primary-400' : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white hover:bg-stone-200 dark:hover:bg-stone-800'}`}>{link.label}</Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <LanguageSwitcher />
            <button onClick={() => openCart(true)} className="relative p-2 text-stone-600 hover:text-stone-900 hover:bg-stone-200 rounded" aria-label={t('nav.openCart')}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" /></svg>
              {itemCount > 0 && <span className="absolute -top-0.5 -right-0.5 bg-primary-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-medium">{itemCount > 9 ? '9+' : itemCount}</span>}
            </button>
            {user ? (
              <>
                <Link to="/account" className="text-sm text-stone-600 hover:text-stone-900">{user.name}</Link>
                <button onClick={logout} className="text-sm text-stone-500 hover:text-stone-700">{t('nav.logout')}</button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-sm text-stone-600 hover:text-stone-900">{t('nav.login')}</Link>
                <Link to="/register" className="text-sm bg-stone-700 text-stone-100 px-4 py-2 rounded hover:bg-stone-800 transition-colors">{t('nav.signUp')}</Link>
              </>
            )}
          </div>

          <div className="md:hidden flex items-center gap-1">
            <button onClick={() => openCart(true)} className="relative p-2 text-stone-600" aria-label={t('nav.openCart')}>
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" /></svg>
              {itemCount > 0 && <span className="absolute -top-0.5 -right-0.5 bg-primary-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-medium">{itemCount > 9 ? '9+' : itemCount}</span>}
            </button>
            <button className="p-2 text-stone-600" onClick={() => setMobileOpen(!mobileOpen)} aria-label={t('nav.toggleMenu')}>
              {mobileOpen ? <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg> : <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>}
            </button>
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-stone-200 dark:border-stone-700 bg-stone-100 dark:bg-stone-900">
          <div className="px-4 py-3 space-y-1">
            {navLinks.map((link) => (
              <Link key={link.to} to={link.to} onClick={() => setMobileOpen(false)} className={`block px-3 py-2 text-sm ${isActive(link.to) ? 'text-primary-700 bg-stone-200' : 'text-stone-600'}`}>{link.label}</Link>
            ))}
            <div className="px-3 py-2"><LanguageSwitcher /></div>
            <div className="border-t border-stone-200 pt-3 mt-3">
              {user ? (
                <>
                  <Link to="/account" onClick={() => setMobileOpen(false)} className="block px-3 py-2 text-sm text-stone-600">{t('nav.myAccount')}</Link>
                  <button onClick={() => { logout(); setMobileOpen(false); }} className="block w-full text-left px-3 py-2 text-sm text-stone-500">{t('nav.logout')}</button>
                </>
              ) : (
                <>
                  <Link to="/login" onClick={() => setMobileOpen(false)} className="block px-3 py-2 text-sm text-stone-600">{t('nav.login')}</Link>
                  <Link to="/register" onClick={() => setMobileOpen(false)} className="block px-3 py-2 text-sm text-primary-600">{t('nav.signUp')}</Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
