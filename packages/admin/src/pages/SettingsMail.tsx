import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

import { useTranslation } from 'react-i18next';

export default function SettingsMail() {
  const { t } = useTranslation();
  const token = localStorage.getItem('token') || '';
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [smtpHost, setSmtpHost] = useState('');
  const [smtpPort, setSmtpPort] = useState(587);
  const [smtpUser, setSmtpUser] = useState('');
  const [smtpPass, setSmtpPass] = useState('');
  const [senderName, setSenderName] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [encryption, setEncryption] = useState<'none' | 'tls' | 'ssl'>('none');

  const [testEmail, setTestEmail] = useState('');
  const [testSending, setTestSending] = useState(false);
  const [testResult, setTestResult] = useState('');

  useEffect(() => {
    fetch('/api/settings/mail', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((res) => {
        if (res.success && res.data) {
          const d = res.data;
          if (d.smtpHost) setSmtpHost(d.smtpHost);
          if (d.smtpPort) setSmtpPort(d.smtpPort);
          if (d.smtpUser) setSmtpUser(d.smtpUser);
          if (d.smtpPass) setSmtpPass(d.smtpPass);
          if (d.senderName) setSenderName(d.senderName);
          if (d.senderEmail) setSenderEmail(d.senderEmail);
          if (d.encryption) setEncryption(d.encryption);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  async function handleSave() {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch('/api/settings/mail', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ smtpHost, smtpPort, smtpUser, smtpPass, senderName, senderEmail, encryption }),
      });
      const data = await res.json();
      if (data.success) {
        if (data.data?.smtpPass) setSmtpPass(data.data.smtpPass);
        setSuccess(t('messages.mail_settings_updated'));
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(typeof data.error === 'string' ? data.error : t('messages.failed_to_save'));
      }
    } catch {
      setError(t('messages.network_error'));
    } finally {
      setSaving(false);
    }
  }

  async function handleTestEmail() {
    if (!testEmail) return;
    setTestSending(true);
    setTestResult('');
    try {
      const res = await fetch('/api/settings/mail/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ to: testEmail }),
      });
      const data = await res.json();
      setTestResult(data.success ? 'Test email sent!' : (data.error || 'Failed'));
    } catch {
      setTestResult('Network error');
    } finally {
      setTestSending(false);
    }
  }

  if (loading) return <div className="p-6 text-gray-500">{t('pages.settings_mail.loading')}</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link to="/settings" className="text-sm text-primary-600 hover:text-primary-700">&larr; Back to Settings</Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">{t('pages.settings_mail.mail_settings')}</h1>
        </div>
        <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50">
          {saving ? t('pages.settings_mail.saving') : t('pages.settings_mail.save_changes')}
        </button>
      </div>

      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}
      {success && <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">{success}</div>}

      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4 mb-6">
        <h2 className="text-lg font-semibold text-gray-900">{t('pages.settings_mail.smtp_configuration')}</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('pages.settings_mail.smtp_host')}</label>
            <input type="text" value={smtpHost} onChange={(e) => setSmtpHost(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500" placeholder={t('pages.settings_mail.smtp_example_com')} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('pages.settings_mail.smtp_port')}</label>
            <input type="number" value={smtpPort} onChange={(e) => setSmtpPort(parseInt(e.target.value) || 587)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('pages.settings_mail.smtp_user')}</label>
            <input type="text" value={smtpUser} onChange={(e) => setSmtpUser(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('pages.settings_mail.smtp_password')}</label>
            <input type="password" value={smtpPass} onChange={(e) => setSmtpPass(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('pages.settings_mail.encryption')}</label>
          <select value={encryption} onChange={(e) => setEncryption(e.target.value as any)} className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
            <option value="none">{t('pages.settings_mail.none')}</option>
            <option value="tls">{t('pages.settings_mail.tls')}</option>
            <option value="ssl">{t('pages.settings_mail.ssl')}</option>
          </select>
        </div>

        <h2 className="text-lg font-semibold text-gray-900 pt-4">{t('pages.settings_mail.sender')}</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('pages.settings_mail.sender_name')}</label>
            <input type="text" value={senderName} onChange={(e) => setSenderName(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500" placeholder={t('pages.settings_mail.kitchenasty')} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('pages.settings_mail.sender_email')}</label>
            <input type="email" value={senderEmail} onChange={(e) => setSenderEmail(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500" placeholder={t('pages.settings_mail.noreply_example_com')} />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('pages.settings_mail.send_test_email')}</h2>
        <div className="flex gap-3 items-end">
          <div className="flex-1 max-w-md">
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('pages.settings_mail.recipient_email')}</label>
            <input type="email" value={testEmail} onChange={(e) => setTestEmail(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500" placeholder={t('pages.settings_mail.test_example_com')} />
          </div>
          <button onClick={handleTestEmail} disabled={testSending || !testEmail} className="px-4 py-2 bg-gray-800 text-white rounded-lg text-sm font-medium hover:bg-gray-900 disabled:opacity-50">
            {testSending ? t('pages.settings_mail.sending') : t('pages.settings_mail.send_test')}
          </button>
        </div>
        {testResult && <p className={`mt-2 text-sm ${testResult.includes('sent') ? 'text-green-600' : 'text-red-600'}`}>{testResult}</p>}
      </div>
    </div>
  );
}
