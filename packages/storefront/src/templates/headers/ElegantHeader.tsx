import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext.js';
import { useCart } from '../../context/CartContext.js';
import { useTheme } from '../../context/ThemeContext.js';
import LanguageSwitcher from '../../components/LanguageSwitcher.js';

export default function ElegantHeader() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const { itemCount, setIsOpen: openCart } = useCart();
  const { settings } = useTheme();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { to: '/', label: t('nav.home') },
    { to: '/locations', label: t('nav.locations') },
    { to: '/menu', label: t('nav.menu') },
    { to: '/gallery', label: t('nav.gallery') },
    { to: '/reservations', label: t('nav.reservations') },
  ];

  function isActive(path: string) {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  }

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 sticky top-0 z-50">
      {/* Centered logo top bar */}
      <div className="text-center py-3 border-b border-gray-100 dark:border-gray-800">
        <Link to="/" className="inline-flex items-center gap-2">
          {settings.logo ? (
            <img src={settings.logo} alt={settings.siteName} className="w-8 h-8 rounded-full object-cover" />
          ) : (
            <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">{settings.siteName.charAt(0)}</span>
            </div>
          )}
          <span className="text-2xl font-light tracking-widest text-gray-900 dark:text-white uppercase">{settings.siteName}</span>
        </Link>
      </div>

      {/* Centered nav */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-12">
          <nav className="hidden md:flex items-center gap-6 mx-auto">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`text-xs font-medium uppercase tracking-wider transition-colors ${
                  isActive(link.to)
                    ? 'text-primary-600 border-b-2 border-primary-600 pb-1'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-3 absolute right-4 lg:right-8">
            <LanguageSwitcher />
            <button onClick={() => openCart(true)} className="relative p-2 text-gray-500 hover:text-gray-900" aria-label={t('nav.openCart')}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" /></svg>
              {itemCount > 0 && <span className="absolute -top-0.5 -right-0.5 bg-primary-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-medium">{itemCount > 9 ? '9+' : itemCount}</span>}
            </button>
            {user ? (
              <>
                <Link to="/account" className="text-xs text-gray-500 hover:text-gray-900 uppercase tracking-wider">{user.name}</Link>
                <button onClick={logout} className="text-xs text-gray-400 hover:text-gray-600 uppercase tracking-wider">{t('nav.logout')}</button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-xs text-gray-500 hover:text-gray-900 uppercase tracking-wider">{t('nav.login')}</Link>
                <Link to="/register" className="text-xs bg-primary-600 text-white px-4 py-1.5 rounded-full hover:bg-primary-700 uppercase tracking-wider">{t('nav.signUp')}</Link>
              </>
            )}
          </div>

          {/* Mobile */}
          <div className="md:hidden flex items-center gap-1 ml-auto">
            <button onClick={() => openCart(true)} className="relative p-2 text-gray-600" aria-label={t('nav.openCart')}>
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" /></svg>
              {itemCount > 0 && <span className="absolute -top-0.5 -right-0.5 bg-primary-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-medium">{itemCount > 9 ? '9+' : itemCount}</span>}
            </button>
            <button className="p-2 text-gray-600" onClick={() => setMobileOpen(!mobileOpen)} aria-label={t('nav.toggleMenu')}>
              {mobileOpen ? (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              ) : (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
          <div className="px-4 py-3 space-y-1">
            {navLinks.map((link) => (
              <Link key={link.to} to={link.to} onClick={() => setMobileOpen(false)} className={`block px-3 py-2 text-sm uppercase tracking-wider ${isActive(link.to) ? 'text-primary-600' : 'text-gray-600 hover:text-gray-900'}`}>{link.label}</Link>
            ))}
            <div className="px-3 py-2"><LanguageSwitcher /></div>
            <div className="border-t border-gray-100 pt-3 mt-3">
              {user ? (
                <>
                  <Link to="/account" onClick={() => setMobileOpen(false)} className="block px-3 py-2 text-sm text-gray-600">{t('nav.myAccount')}</Link>
                  <button onClick={() => { logout(); setMobileOpen(false); }} className="block w-full text-left px-3 py-2 text-sm text-gray-500">{t('nav.logout')}</button>
                </>
              ) : (
                <>
                  <Link to="/login" onClick={() => setMobileOpen(false)} className="block px-3 py-2 text-sm text-gray-600">{t('nav.login')}</Link>
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
