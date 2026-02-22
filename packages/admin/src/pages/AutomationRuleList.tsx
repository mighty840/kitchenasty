import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api.js';

interface AutomationRule {
  id: string;
  name: string;
  event: string;
  conditions: Record<string, unknown> | null;
  actions: Array<{ type: string;[key: string]: unknown }>;
  isActive: boolean;
  createdAt: string;
}

const EVENT_LABELS: Record<string, string> = {
  'order.created': 'Order Created',
  'order.statusChanged': 'Order Status Changed',
  'reservation.created': 'Reservation Created',
  'review.submitted': 'Review Submitted',
};

export default function AutomationRuleList() {
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get<{ data: AutomationRule[] }>('/automation-rules')
      .then((res) => setRules(res.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const toggleActive = async (rule: AutomationRule) => {
    try {
      await api.patch(`/automation-rules/${rule.id}`, { isActive: !rule.isActive });
      setRules((prev) =>
        prev.map((r) => r.id === rule.id ? { ...r, isActive: !r.isActive } : r)
      );
    } catch (err: any) {
      setError(err.message);
    }
  };

  const deleteRule = async (id: string) => {
    if (!confirm('Delete this automation rule?')) return;
    try {
      await api.delete(`/automation-rules/${id}`);
      setRules((prev) => prev.filter((r) => r.id !== id));
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Automation Rules</h1>
        <Link
          to="/automation/new"
          className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
        >
          Add Rule
        </Link>
      </div>

      {error && <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-4">{error}</div>}

      {loading && (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" role="status" aria-label="Loading" />
        </div>
      )}

      {!loading && rules.length === 0 && (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500 mb-4">No automation rules yet.</p>
          <Link to="/automation/new" className="text-primary-600 hover:text-primary-700 font-medium">
            Create your first rule
          </Link>
        </div>
      )}

      {!loading && rules.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Event</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rules.map((rule) => (
                <tr key={rule.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{rule.name}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">
                      {EVENT_LABELS[rule.event] || rule.event}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {rule.actions.map((a, i) => (
                      <span key={i} className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 mr-1">
                        {a.type}
                      </span>
                    ))}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleActive(rule)}
                      className={`text-xs px-2.5 py-1 rounded-full font-medium ${rule.isActive
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-500'
                        }`}
                      aria-label={`${rule.isActive ? 'Deactivate' : 'Activate'} rule ${rule.name}`}
                    >
                      {rule.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <Link
                      to={`/automation/${rule.id}`}
                      className="text-primary-600 hover:text-primary-700 text-xs font-medium"
                      aria-label={`Edit rule ${rule.name}`}
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => deleteRule(rule.id)}
                      className="text-red-600 hover:text-red-700 text-xs font-medium"
                      aria-label={`Delete rule ${rule.name}`}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
