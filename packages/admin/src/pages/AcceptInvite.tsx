import { useState, useEffect, FormEvent } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import LanguageSwitcher from '../components/LanguageSwitcher.js';
import { translateRole } from '../i18n/index.js';
import { useTranslation } from 'react-i18next';

export default function AcceptInvite() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();

  const tokenParam = searchParams.get('token') || '';

  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [validating, setValidating] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [tokenError, setTokenError] = useState('');

  useEffect(() => {
    if (!tokenParam) {
      setTokenError(t('messages.no_invite_token_provided'));
      setValidating(false);
      return;
    }

    fetch(`/api/staff/invite/${tokenParam}`)
      .then((res) => res.json())
      .then((data) => {
        if (!data.success) throw new Error(data.error || t('messages.invalid_invite'));
        setEmail(data.data.email);
        setRole(data.data.role);
      })
      .catch((err) => setTokenError(err.message))
      .finally(() => setValidating(false));
  }, [tokenParam, t]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError(t('messages.passwords_do_not_match'));
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch('/api/staff/accept-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: tokenParam, name, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t('messages.failed_to_accept_invite'));

      login(data.data.token);
      navigate('/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (validating) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="fixed right-4 top-4 z-10">
          <LanguageSwitcher />
        </div>
        <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (tokenError) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
        <div className="fixed right-4 top-4 z-10">
          <LanguageSwitcher />
        </div>
        <div className="w-full max-w-sm text-center">
          <h1 className="text-3xl font-bold text-primary-400 mb-8">{t('pages.accept_invite.kitchenasty')}</h1>
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl text-red-600">!</span>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">{t('pages.accept_invite.invalid_invitation')}</h2>
            <p className="text-gray-600">{tokenError}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="fixed right-4 top-4 z-10">
        <LanguageSwitcher />
      </div>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary-400">{t('pages.accept_invite.kitchenasty')}</h1>
          <p className="text-gray-400 mt-1 text-sm">{t('pages.accept_invite.accept_your_invitation')}</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-8 space-y-5">
          <div className="text-center mb-2">
            <p className="text-sm text-gray-600">

              {t('pages.accept_invite.you_ve_been_invited_as')} <strong>{translateRole(t, role)}</strong>
            </p>
            <p className="text-xs text-gray-400 mt-1">{email}</p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg">{error}</div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('pages.accept_invite.your_name')}</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('pages.accept_invite.password')}</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('pages.accept_invite.confirm_password')}</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-primary-600 text-white py-2.5 rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50"
          >
            {submitting ? t('pages.accept_invite.creating_account') : t('pages.accept_invite.create_account')}
          </button>
        </form>
      </div>
    </div>
  );
}
