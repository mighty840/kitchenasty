import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

interface Coupon {
  id: string;
  code: string;
  type: string;
  value: number;
  minOrder: number;
  maxDiscount: number | null;
  usageLimit: number | null;
  usageCount: number;
  perCustomer: number;
  startsAt: string | null;
  expiresAt: string | null;
  isActive: boolean;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const TYPE_LABELS: Record<string, string> = {
  PERCENTAGE: '% Off',
  FIXED: '$ Off',
  FREE_DELIVERY: 'Free Delivery',
};

export default function CouponList() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);

  const token = localStorage.getItem('token') || '';

  useEffect(() => {
    setLoading(true);
    fetch(`/api/coupons?page=${page}&limit=20`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load coupons');
        return res.json();
      })
      .then((data) => {
        setCoupons(data.data);
        setPagination(data.pagination);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [page, token]);

  async function toggleActive(id: string, isActive: boolean) {
    try {
      const res = await fetch(`/api/coupons/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ isActive }),
      });
      if (!res.ok) throw new Error('Failed to update');
      setCoupons((prev) => prev.map((c) => (c.id === id ? { ...c, isActive } : c)));
    } catch (err: any) {
      setError(err.message);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Coupons</h1>
        <Link
          to="/coupons/new"
          className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
        >
          + New Coupon
        </Link>
      </div>

      {loading && (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" role="status" aria-label="Loading" />
        </div>
      )}

      {error && <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-4">{error}</div>}

      {!loading && !error && coupons.length === 0 && (
        <p className="text-gray-500 text-center py-12">No coupons yet.</p>
      )}

      {!loading && coupons.length > 0 && (
        <>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Code</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Type</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Value</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Min Order</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Usage</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {coupons.map((coupon) => (
                  <tr key={coupon.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs font-bold">{coupon.code}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-gray-100 text-gray-700">
                        {TYPE_LABELS[coupon.type] || coupon.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium">
                      {coupon.type === 'PERCENTAGE'
                        ? `${coupon.value}%`
                        : coupon.type === 'FIXED'
                          ? `$${coupon.value.toFixed(2)}`
                          : '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {coupon.minOrder > 0 ? `$${coupon.minOrder.toFixed(2)}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {coupon.usageCount}{coupon.usageLimit ? ` / ${coupon.usageLimit}` : ''}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleActive(coupon.id, !coupon.isActive)}
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${coupon.isActive
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-500'
                          }`}
                        aria-label={`${coupon.isActive ? 'Deactivate' : 'Activate'} coupon ${coupon.code}`}
                      >
                        {coupon.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        to={`/coupons/${coupon.id}`}
                        className="text-primary-600 hover:text-primary-700 text-xs font-medium"
                        aria-label={`Edit coupon ${coupon.code}`}
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-6">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50"
              >
                Previous
              </button>
              <span className="text-sm text-gray-600">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
