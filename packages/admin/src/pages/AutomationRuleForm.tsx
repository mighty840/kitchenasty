import { useState, useEffect, FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';

import { useTranslation } from 'react-i18next';

const EVENTS = [
  { value: 'order.created', label: 'events.orderCreated' },
  { value: 'order.statusChanged', label: 'events.orderStatusChanged' },
  { value: 'reservation.created', label: 'events.reservationCreated' },
  { value: 'review.submitted', label: 'events.reviewSubmitted' },
];

const ACTION_TYPES = ['email', 'webhook', 'sms'];

interface ActionItem {
  type: string;
  to?: string;
  subject?: string;
  body?: string;
  url?: string;
}

export default function AutomationRuleForm() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = !id || id === 'new';

  const [name, setName] = useState('');
  const [event, setEvent] = useState('order.created');
  const [conditionsJson, setConditionsJson] = useState('');
  const [actions, setActions] = useState<ActionItem[]>([{ type: 'email', to: 'customer', subject: '', body: '' }]);
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isNew) {
      api.get<{ data: any }>(`/automation-rules/${id}`)
        .then((res) => {
          const rule = res.data;
          setName(rule.name);
          setEvent(rule.event);
          setConditionsJson(rule.conditions ? JSON.stringify(rule.conditions, null, 2) : '');
          setActions(rule.actions || []);
          setIsActive(rule.isActive);
        })
        .catch((err) => setError(err.message));
    }
  }, [id, isNew]);

  const updateAction = (index: number, field: string, value: string) => {
    setActions((prev) => prev.map((a, i) => i === index ? { ...a, [field]: value } : a));
  };

  const addAction = () => {
    setActions((prev) => [...prev, { type: 'email', to: '', subject: '', body: '' }]);
  };

  const removeAction = (index: number) => {
    setActions((prev) => prev.filter((_, i) => i !== index));
  };

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let conditions = null;
      if (conditionsJson.trim()) {
        try {
          conditions = JSON.parse(conditionsJson);
        } catch {
          setError(t('messages.invalid_json_for_conditions'));
          setLoading(false);
          return;
        }
      }

      const body = { name, event, conditions, actions, isActive };

      if (isNew) {
        await api.post('/automation-rules', body);
      } else {
        await api.patch(`/automation-rules/${id}`, body);
      }

      navigate('/automation');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        {isNew ? t('pages.automation_rule_form.new_automation_rule') : t('pages.automation_rule_form.edit_automation_rule')}
      </h1>

      {error && <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-4">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('pages.automation_rule_form.name')}</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm"
              placeholder={t('pages.automation_rule_form.e_g_send_order_confirmation_email')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('pages.automation_rule_form.event')}</label>
            <select
              value={event}
              onChange={(e) => setEvent(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm"
            >
              {EVENTS.map((ev) => (
                <option key={ev.value} value={ev.value}>{t(ev.label)}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">

              {t('pages.automation_rule_form.conditions_json_optional')}
            </label>
            <textarea
              value={conditionsJson}
              onChange={(e) => setConditionsJson(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm font-mono"
              placeholder={t('pages.automation_rule_form.e_g_order_status_confirmed')}
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="accent-primary-600"
            />
            <span className="text-sm text-gray-700">{t('pages.automation_rule_form.active')}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">{t('pages.automation_rule_form.actions')}</h2>
            <button
              type="button"
              onClick={addAction}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >

              {t('pages.automation_rule_form.add_action')}
            </button>
          </div>

          <div className="space-y-4">
            {actions.map((action, i) => (
              <div key={i} className="border border-gray-200 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <select
                    value={action.type}
                    onChange={(e) => updateAction(i, 'type', e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none"
                  >
                    {ACTION_TYPES.map((type) => (
                      <option key={type} value={type}>{t(`actionTypes.${type}`)}</option>
                    ))}
                  </select>
                  {actions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeAction(i)}
                      className="text-red-500 hover:text-red-700 text-xs"
                    >

                      {t('pages.automation_rule_form.remove')}
                    </button>
                  )}
                </div>

                {(action.type === 'email' || action.type === 'sms') && (
                  <>
                    <input
                      type="text"
                      placeholder={t('pages.automation_rule_form.to_e_g_customer_or_email_phone')}
                      value={action.to || ''}
                      onChange={(e) => updateAction(i, 'to', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none"
                    />
                    {action.type === 'email' && (
                      <input
                        type="text"
                        placeholder={t('pages.automation_rule_form.subject_supports_order_ordernumber', { skipInterpolation: true })}
                        value={action.subject || ''}
                        onChange={(e) => updateAction(i, 'subject', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none"
                      />
                    )}
                    <textarea
                      placeholder={t('pages.automation_rule_form.body_supports_order_ordernumber_order_status', { skipInterpolation: true })}
                      value={action.body || ''}
                      onChange={(e) => updateAction(i, 'body', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none resize-none"
                    />
                  </>
                )}

                {action.type === 'webhook' && (
                  <input
                    type="url"
                    placeholder={t('pages.automation_rule_form.webhook_url')}
                    value={action.url || ''}
                    onChange={(e) => updateAction(i, 'url', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none"
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="bg-primary-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50"
          >
            {loading ? t('pages.automation_rule_form.saving') : isNew ? t('pages.automation_rule_form.create_rule') : t('pages.automation_rule_form.update_rule')}
          </button>
          <button
            type="button"
            onClick={() => navigate('/automation')}
            className="px-6 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
          >

            {t('pages.automation_rule_form.cancel')}
          </button>
        </div>
      </form>
    </div>
  );
}
