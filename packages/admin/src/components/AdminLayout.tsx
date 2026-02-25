import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';

type Role = 'SUPER_ADMIN' | 'MANAGER' | 'STAFF';

interface NavItem {
  path: string;
  label: string;
  icon: string;
  roles: Role[];
  children?: { path: string; label: string }[];
}

const navItems: NavItem[] = [
  { path: '/', label: 'Dashboard', icon: '\u25A1', roles: ['SUPER_ADMIN', 'MANAGER', 'STAFF'] },
  { path: '/orders', label: 'Orders', icon: '\uD83D\uDCCB', roles: ['SUPER_ADMIN', 'MANAGER', 'STAFF'] },
  { path: '/reservations', label: 'Reservations', icon: '\uD83D\uDDD3', roles: ['SUPER_ADMIN', 'MANAGER', 'STAFF'] },
  { path: '/reviews', label: 'Reviews', icon: '\u2B50', roles: ['SUPER_ADMIN', 'MANAGER', 'STAFF'] },
  { path: '/kitchen', label: 'Kitchen', icon: '\uD83C\uDF73', roles: ['SUPER_ADMIN', 'MANAGER', 'STAFF'] },
  { path: '/locations', label: 'Locations', icon: '\u25CE', roles: ['SUPER_ADMIN', 'MANAGER'] },
  {
    path: '/menu',
    label: 'Menu',
    icon: '\u2630',
    roles: ['SUPER_ADMIN', 'MANAGER'],
    children: [
      { path: '/menu/items', label: 'Items' },
      { path: '/menu/categories', label: 'Categories' },
    ],
  },
  { path: '/coupons', label: 'Coupons', icon: '\uD83C\uDFF7', roles: ['SUPER_ADMIN', 'MANAGER'] },
  { path: '/automation', label: 'Automation', icon: '\u26A1', roles: ['SUPER_ADMIN', 'MANAGER'] },
  { path: '/loyalty', label: 'Loyalty', icon: '\uD83C\uDF81', roles: ['SUPER_ADMIN', 'MANAGER'] },
  {
    path: '/design',
    label: 'Design',
    icon: '\uD83C\uDFA8',
    roles: ['SUPER_ADMIN', 'MANAGER'],
    children: [
      { path: '/design/landing', label: 'Landing Page' },
      { path: '/design/branding', label: 'Branding' },
      { path: '/design/theme', label: 'Theme' },
    ],
  },
  {
    path: '/legal',
    label: 'Legal',
    icon: '\u2696',
    roles: ['SUPER_ADMIN', 'MANAGER'],
    children: [
      { path: '/legal/pages', label: 'Pages' },
      { path: '/legal/cookies', label: 'Cookie Categories' },
      { path: '/legal/consent', label: 'Consent Log' },
    ],
  },
  { path: '/settings', label: 'Settings', icon: '\u2699', roles: ['SUPER_ADMIN', 'MANAGER'] },
  { path: '/staff', label: 'Staff', icon: '\uD83D\uDC65', roles: ['SUPER_ADMIN'] },
];

const ROLE_COLORS: Record<Role, string> = {
  SUPER_ADMIN: 'bg-red-500/20 text-red-300',
  MANAGER: 'bg-blue-500/20 text-blue-300',
  STAFF: 'bg-gray-500/20 text-gray-300',
};

const ROLE_LABELS: Record<Role, string> = {
  SUPER_ADMIN: 'Super Admin',
  MANAGER: 'Manager',
  STAFF: 'Staff',
};

export default function AdminLayout({ children, onLogout }: { children: React.ReactNode; onLogout?: () => void }) {
  const location = useLocation();
  const { user, token } = useAuth();
  const [pendingCount, setPendingCount] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filteredNav = user
    ? navItems.filter((item) => item.roles.includes(user.role))
    : [];

  // Poll pending order count
  useEffect(() => {
    if (!token) return;

    async function fetchPending() {
      try {
        const res = await fetch('/api/dashboard', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success && data.data) {
          setPendingCount(data.data.pendingOrders ?? 0);
        }
      } catch { /* ignore */ }
    }

    fetchPending();
    const interval = setInterval(fetchPending, 60000);
    return () => clearInterval(interval);
  }, [token]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const isManagerPlus = user && (user.role === 'SUPER_ADMIN' || user.role === 'MANAGER');

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white flex flex-col" role="navigation" aria-label="Main navigation">
        <div className="px-6 py-4 border-b border-gray-700">
          <h1 className="text-xl font-bold text-primary-400">KitchenAsty</h1>
          <p className="text-xs text-gray-400 mt-1">Admin Panel</p>
        </div>
        <nav className="flex-1 py-4">
          {filteredNav.map((item) => {
            const isActive =
              item.path === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(item.path);
            return (
              <div key={item.path}>
                <Link
                  to={item.children ? item.children[0].path : item.path}
                  className={`flex items-center px-6 py-3 text-sm transition-colors ${isActive
                    ? 'bg-gray-800 text-primary-400 border-r-2 border-primary-400'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                    }`}
                >
                  <span className="mr-3">{item.icon}</span>
                  {item.label}
                </Link>
                {item.children && isActive && (
                  <div className="bg-gray-950">
                    {item.children.map((child) => (
                      <Link
                        key={child.path}
                        to={child.path}
                        className={`block pl-14 pr-6 py-2 text-xs transition-colors ${location.pathname.startsWith(child.path)
                          ? 'text-primary-400'
                          : 'text-gray-400 hover:text-white'
                          }`}
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* User info at bottom of sidebar */}
        {user && (
          <div className="px-6 py-4 border-t border-gray-700">
            <p className="text-sm font-medium text-white truncate">{user.name}</p>
            <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_COLORS[user.role]}`}>
              {ROLE_LABELS[user.role]}
            </span>
          </div>
        )}
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
          <div />
          <div className="flex items-center gap-3">
            {/* Notifications bell */}
            <Link
              to="/orders?status=PENDING"
              className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors"
              title="Pending orders"
              aria-label="Pending orders"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="sr-only" aria-live="polite">
                {pendingCount > 0 ? `${pendingCount} pending order${pendingCount === 1 ? '' : 's'}` : ''}
              </span>
              {pendingCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-red-500 rounded-full" aria-hidden="true">
                  {pendingCount > 99 ? '99+' : pendingCount}
                </span>
              )}
            </Link>

            {/* Settings gear */}
            {isManagerPlus && (
              <Link
                to="/settings"
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                title="Settings"
                aria-label="Settings"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </Link>
            )}

            {/* Separator */}
            <div className="w-px h-6 bg-gray-200" />

            {/* User avatar + dropdown */}
            {user && (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 p-1 rounded-lg hover:bg-gray-100 transition-colors"
                  aria-label="User menu"
                  aria-expanded={dropdownOpen}
                  aria-haspopup="true"
                >
                  <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-semibold">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm text-gray-700 font-medium hidden sm:block">{user.name}</span>
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                    {isManagerPlus && (
                      <Link
                        to="/settings"
                        onClick={() => setDropdownOpen(false)}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        Settings
                      </Link>
                    )}
                    {onLogout && (
                      <button
                        onClick={() => {
                          setDropdownOpen(false);
                          onLogout();
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        Logout
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
