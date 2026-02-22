import { useState } from 'react';
import { api } from '../lib/api.js';

interface Customer {
  id: string;
  name: string;
  email: string;
  loyaltyPoints: number;
}

interface LoyaltyTransaction {
  id: string;
  type: string;
  points: number;
  description: string | null;
  createdAt: string;
  order: { orderNumber: string } | null;
}

export default function CustomerLoyalty() {
  const [searchEmail, setSearchEmail] = useState('');
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [transactions, setTransactions] = useState<LoyaltyTransaction[]>([]);
  const [adjustPoints, setAdjustPoints] = useState('');
  const [adjustDesc, setAdjustDesc] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const searchCustomer = async () => {
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      // Search using dashboard customers endpoint or a simple approach
      const res = await api.get<{ data: Customer[] }>(`/dashboard/customers?email=${encodeURIComponent(searchEmail)}`);
      if (res.data.length === 0) {
        setError('Customer not found');
        setCustomer(null);
        return;
      }
      setCustomer(res.data[0]);
      // We don't have a per-customer transaction endpoint from admin side, so we show what we have
      setTransactions([]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAdjust = async () => {
    if (!customer) return;
    const points = parseInt(adjustPoints);
    if (isNaN(points) || points === 0) {
      setError('Enter a valid points value');
      return;
    }

    setError('');
    setSuccess('');
    try {
      await api.post(`/loyalty/customers/${customer.id}/adjust`, {
        points,
        description: adjustDesc || undefined,
      });
      setCustomer({ ...customer, loyaltyPoints: customer.loyaltyPoints + points });
      setAdjustPoints('');
      setAdjustDesc('');
      setSuccess(`${points > 0 ? '+' : ''}${points} points adjusted successfully`);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Loyalty Points</h1>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Find Customer</h2>
        <div className="flex gap-2">
          <input
            type="email"
            placeholder="Customer email..."
            value={searchEmail}
            onChange={(e) => setSearchEmail(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && searchCustomer()}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"
            aria-label="Search customer by email"
          />
          <button
            onClick={searchCustomer}
            disabled={loading || !searchEmail}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </div>

      {error && <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-4">{error}</div>}
      {success && <div className="bg-green-50 text-green-700 p-4 rounded-lg mb-4">{success}</div>}

      {customer && (
        <>
          {/* Customer Info */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{customer.name}</h3>
                <p className="text-sm text-gray-500">{customer.email}</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-primary-600">{customer.loyaltyPoints}</p>
                <p className="text-sm text-gray-500">points (${(customer.loyaltyPoints / 100).toFixed(2)} value)</p>
              </div>
            </div>
          </div>

          {/* Adjust Points */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Adjust Points</h2>
            <div className="space-y-3">
              <div className="flex gap-3">
                <input
                  type="number"
                  placeholder="Points (+/-)"
                  value={adjustPoints}
                  onChange={(e) => setAdjustPoints(e.target.value)}
                  className="w-40 px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"
                  aria-label="Points to adjust"
                />
                <input
                  type="text"
                  placeholder="Reason (optional)"
                  value={adjustDesc}
                  onChange={(e) => setAdjustDesc(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"
                  aria-label="Adjustment reason"
                />
                <button
                  onClick={handleAdjust}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700"
                >
                  Adjust
                </button>
              </div>
              <p className="text-xs text-gray-400">Use positive numbers to add points, negative to deduct.</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
