import { useState, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { api } from '../lib/api.js';

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  comment: string | null;
  options: { name: string; value: string }[];
}

interface KitchenOrder {
  id: string;
  orderNumber: string;
  orderType: string;
  status: string;
  comment: string | null;
  createdAt: string;
  scheduledAt: string | null;
  customer: { name: string } | null;
  items: OrderItem[];
}

const KITCHEN_STATUSES = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY'];

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; next: string | null }> = {
  PENDING: { label: 'New', color: 'text-yellow-800', bg: 'bg-yellow-50 border-yellow-300', next: 'CONFIRMED' },
  CONFIRMED: { label: 'Confirmed', color: 'text-blue-800', bg: 'bg-blue-50 border-blue-300', next: 'PREPARING' },
  PREPARING: { label: 'Preparing', color: 'text-purple-800', bg: 'bg-purple-50 border-purple-300', next: 'READY' },
  READY: { label: 'Ready', color: 'text-green-800', bg: 'bg-green-50 border-green-300', next: null },
};

const NEXT_ACTION: Record<string, string> = {
  PENDING: 'Confirm',
  CONFIRMED: 'Start Preparing',
  PREPARING: 'Mark Ready',
};

export default function KitchenDisplay() {
  const [orders, setOrders] = useState<KitchenOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const fetchOrders = useCallback(() => {
    // Fetch active orders (non-completed, non-cancelled)
    const statuses = KITCHEN_STATUSES.join(',');
    api.get<{ data: KitchenOrder[] }>(`/orders?limit=50&includeItems=true&status=${statuses}`)
      .then((res) => {
        setOrders(res.data);
        setLastRefresh(new Date());
      })
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Socket.IO connection for real-time updates
  useEffect(() => {
    const s = io({ path: '/socket.io', transports: ['websocket', 'polling'] });
    setSocket(s);

    s.emit('join:kitchen');

    s.on('order:new', () => {
      fetchOrders();
    });

    s.on('order:statusUpdate', (data: { id: string; status: string }) => {
      setOrders((prev) => {
        // Remove completed/cancelled orders from display
        if (!KITCHEN_STATUSES.includes(data.status)) {
          return prev.filter((o) => o.id !== data.id);
        }
        // Update status of existing order
        return prev.map((o) => o.id === data.id ? { ...o, status: data.status } : o);
      });
    });

    return () => {
      s.emit('leave:kitchen');
      s.disconnect();
    };
  }, [fetchOrders]);

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    setUpdating(orderId);
    try {
      await api.patch(`/orders/${orderId}/status`, { status: newStatus });
      // Optimistic update — socket will also fire
      setOrders((prev) => {
        if (!KITCHEN_STATUSES.includes(newStatus)) {
          return prev.filter((o) => o.id !== orderId);
        }
        return prev.map((o) => o.id === orderId ? { ...o, status: newStatus } : o);
      });
    } catch {
      // Refresh on error
      fetchOrders();
    } finally {
      setUpdating(null);
    }
  };

  const handleComplete = async (orderId: string, orderType: string) => {
    const completedStatus = orderType === 'DELIVERY' ? 'OUT_FOR_DELIVERY' : 'PICKED_UP';
    setUpdating(orderId);
    try {
      await api.patch(`/orders/${orderId}/status`, { status: completedStatus });
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
    } catch {
      fetchOrders();
    } finally {
      setUpdating(null);
    }
  };

  const getTimeSince = (dateStr: string) => {
    const mins = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    return `${Math.floor(mins / 60)}h ${mins % 60}m ago`;
  };

  // Separate scheduled vs immediate orders
  const scheduledOrders = orders
    .filter((o) => o.scheduledAt && new Date(o.scheduledAt) > new Date())
    .sort((a, b) => new Date(a.scheduledAt!).getTime() - new Date(b.scheduledAt!).getTime());
  const immediateOrders = orders.filter((o) => !o.scheduledAt || new Date(o.scheduledAt) <= new Date());

  const ordersByStatus = KITCHEN_STATUSES.map((status) => ({
    status,
    config: STATUS_CONFIG[status],
    orders: immediateOrders.filter((o) => o.status === status).sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    ),
  }));

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-gray-900 text-white px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-bold text-primary-400">Kitchen Display</h1>
          <div className="flex items-center gap-2" role="status">
            <div className={`w-2 h-2 rounded-full ${socket?.connected ? 'bg-green-400' : 'bg-red-400'}`} />
            <span className="text-xs text-gray-400">
              {socket?.connected ? 'Live' : 'Disconnected'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-gray-400">
            {orders.length} active orders | Updated {lastRefresh.toLocaleTimeString()}
          </span>
          <button
            onClick={fetchOrders}
            className="text-xs bg-gray-700 hover:bg-gray-600 px-3 py-1.5 rounded transition-colors"
            aria-label="Refresh orders"
          >
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" role="status" aria-label="Loading" />
        </div>
      ) : (
        <>
          {/* Scheduled orders banner */}
          {scheduledOrders.length > 0 && (
            <div className="mx-4 mt-4 bg-indigo-50 border border-indigo-200 rounded-lg p-4">
              <h3 className="text-sm font-bold text-indigo-800 mb-2">
                Scheduled Orders ({scheduledOrders.length})
              </h3>
              <div className="flex flex-wrap gap-3">
                {scheduledOrders.map((order) => (
                  <div key={order.id} className="bg-white rounded-lg border border-indigo-200 px-3 py-2 text-xs">
                    <span className="font-mono font-bold text-gray-900">#{order.orderNumber}</span>
                    <span className={`ml-2 px-1.5 py-0.5 rounded font-medium ${order.orderType === 'DELIVERY' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                      }`}>
                      {order.orderType}
                    </span>
                    <span className="ml-2 text-indigo-600 font-medium">
                      {new Date(order.scheduledAt!).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {order.customer && <span className="ml-2 text-gray-500">{order.customer.name}</span>}
                    <span className="ml-2 text-gray-400">{order.items.length} items</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="grid grid-cols-4 gap-4 p-4 h-[calc(100vh-52px)] overflow-hidden">
            {ordersByStatus.map(({ status, config, orders: statusOrders }) => (
              <div key={status} className="flex flex-col min-h-0">
                {/* Column header */}
                <div className={`rounded-t-lg px-4 py-2 border-b-2 ${config.bg}`}>
                  <div className="flex items-center justify-between">
                    <h2 className={`font-bold text-sm ${config.color}`}>{config.label}</h2>
                    <span className={`text-xs font-bold ${config.color} bg-white/50 px-2 py-0.5 rounded-full`}>
                      {statusOrders.length}
                    </span>
                  </div>
                </div>

                {/* Order cards */}
                <div className="flex-1 overflow-y-auto space-y-3 py-3">
                  {statusOrders.length === 0 && (
                    <p className="text-center text-gray-400 text-sm py-8">No orders</p>
                  )}
                  {statusOrders.map((order) => (
                    <div
                      key={order.id}
                      className={`bg-white rounded-lg shadow-sm border p-4 mx-1 ${updating === order.id ? 'opacity-50' : ''
                        }`}
                    >
                      {/* Order header */}
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <span className="font-mono text-sm font-bold text-gray-900">
                            #{order.orderNumber}
                          </span>
                          <span className={`ml-2 text-xs px-1.5 py-0.5 rounded font-medium ${order.orderType === 'DELIVERY'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-green-100 text-green-700'
                            }`}>
                            {order.orderType}
                          </span>
                        </div>
                        <span className="text-xs text-gray-400">{getTimeSince(order.createdAt)}</span>
                      </div>

                      {/* Customer */}
                      {order.customer && (
                        <p className="text-xs text-gray-500 mb-2">{order.customer.name}</p>
                      )}

                      {/* Items */}
                      <div className="space-y-1 mb-3">
                        {order.items.map((item) => (
                          <div key={item.id} className="text-sm">
                            <div className="flex items-start gap-2">
                              <span className="font-bold text-gray-600 text-xs min-w-[20px]">
                                {item.quantity}x
                              </span>
                              <div className="flex-1">
                                <span className="font-medium text-gray-900">{item.name}</span>
                                {item.options.length > 0 && (
                                  <p className="text-xs text-gray-500">
                                    {item.options.map((o) => `${o.name}: ${o.value}`).join(', ')}
                                  </p>
                                )}
                                {item.comment && (
                                  <p className="text-xs text-amber-600 italic">{item.comment}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Order comment */}
                      {order.comment && (
                        <div className="bg-amber-50 border border-amber-200 rounded p-2 mb-3">
                          <p className="text-xs text-amber-700">{order.comment}</p>
                        </div>
                      )}

                      {/* Action buttons */}
                      <div className="flex gap-2">
                        {config.next && (
                          <button
                            onClick={() => handleStatusUpdate(order.id, config.next!)}
                            disabled={updating === order.id}
                            className="flex-1 bg-primary-600 text-white text-xs font-medium py-2 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
                            aria-label={`${NEXT_ACTION[status]} order ${order.orderNumber}`}
                          >
                            {NEXT_ACTION[status]}
                          </button>
                        )}
                        {status === 'READY' && (
                          <button
                            onClick={() => handleComplete(order.id, order.orderType)}
                            disabled={updating === order.id}
                            className="flex-1 bg-green-600 text-white text-xs font-medium py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                            aria-label={`Mark order ${order.orderNumber} as ${order.orderType === 'DELIVERY' ? 'out for delivery' : 'picked up'}`}
                          >
                            {order.orderType === 'DELIVERY' ? 'Out for Delivery' : 'Picked Up'}
                          </button>
                        )}
                        <button
                          onClick={() => handleStatusUpdate(order.id, 'CANCELLED')}
                          disabled={updating === order.id}
                          className="text-red-500 hover:text-red-700 text-xs font-medium px-2 py-2 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                          aria-label={`Cancel order ${order.orderNumber}`}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
