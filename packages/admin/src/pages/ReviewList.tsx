import { useState, useEffect } from 'react';

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  isApproved: boolean;
  createdAt: string;
  customer: { id: string; name: string };
  location: { id: string; name: string };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="text-yellow-400" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} aria-hidden="true">{i < rating ? '★' : '☆'}</span>
      ))}
    </span>
  );
}

export default function ReviewList() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState('');

  const token = localStorage.getItem('token') || '';

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '20' });
    if (filter) params.set('isApproved', filter);

    fetch(`/api/reviews?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load reviews');
        return res.json();
      })
      .then((data) => {
        setReviews(data.data);
        setPagination(data.pagination);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [page, filter, token]);

  async function moderate(id: string, isApproved: boolean) {
    try {
      const res = await fetch(`/api/reviews/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ isApproved }),
      });
      if (!res.ok) throw new Error('Failed to update');
      setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, isApproved } : r)));
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function deleteReview(id: string) {
    try {
      const res = await fetch(`/api/reviews/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to delete');
      setReviews((prev) => prev.filter((r) => r.id !== id));
    } catch (err: any) {
      setError(err.message);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Reviews</h1>
      </div>

      <div className="flex gap-3 mb-6">
        <select
          value={filter}
          onChange={(e) => { setFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
          aria-label="Filter by approval status"
        >
          <option value="">All Reviews</option>
          <option value="true">Approved</option>
          <option value="false">Pending</option>
        </select>
      </div>

      {loading && (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" role="status" aria-label="Loading" />
        </div>
      )}

      {error && <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-4">{error}</div>}

      {!loading && !error && reviews.length === 0 && (
        <p className="text-gray-500 text-center py-12">No reviews found.</p>
      )}

      {!loading && reviews.length > 0 && (
        <>
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{review.customer.name}</span>
                      <StarRating rating={review.rating} />
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {review.location.name} &middot; {new Date(review.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${review.isApproved ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                    {review.isApproved ? 'Approved' : 'Pending'}
                  </span>
                </div>
                {review.comment && (
                  <p className="text-sm text-gray-600 mt-2">{review.comment}</p>
                )}
                <div className="flex gap-2 mt-3">
                  {!review.isApproved && (
                    <button
                      onClick={() => moderate(review.id, true)}
                      className="text-xs px-3 py-1 bg-green-50 text-green-700 rounded hover:bg-green-100"
                      aria-label={`Approve review by ${review.customer.name}`}
                    >
                      Approve
                    </button>
                  )}
                  {review.isApproved && (
                    <button
                      onClick={() => moderate(review.id, false)}
                      className="text-xs px-3 py-1 bg-yellow-50 text-yellow-700 rounded hover:bg-yellow-100"
                      aria-label={`Unapprove review by ${review.customer.name}`}
                    >
                      Unapprove
                    </button>
                  )}
                  <button
                    onClick={() => deleteReview(review.id)}
                    className="text-xs px-3 py-1 bg-red-50 text-red-700 rounded hover:bg-red-100"
                    aria-label={`Delete review by ${review.customer.name}`}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
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
