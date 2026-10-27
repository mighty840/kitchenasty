import { useTranslation } from 'react-i18next';

export interface OrderPayment {
  id: string;
  method: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  amount: number;
  transactionId: string | null;
  createdAt: string;
}

const COLORS: Record<string, string> = {
  COMPLETED: 'bg-green-100 text-green-800',
  PENDING: 'bg-yellow-100 text-yellow-800',
  FAILED: 'bg-red-100 text-red-800',
  REFUNDED: 'bg-gray-200 text-gray-700',
};

// Summarises an order's payments: paid wins, otherwise the latest attempt decides.
export function summarizePayment(payments: OrderPayment[] | undefined): OrderPayment['status'] | 'NONE' {
  if (!payments || payments.length === 0) return 'NONE';
  if (payments.some((p) => p.status === 'COMPLETED')) return 'COMPLETED';
  return payments[0].status;
}

export function PaymentBadge({ payments, className = '' }: { payments: OrderPayment[] | undefined; className?: string }) {
  const { t } = useTranslation();
  const status = summarizePayment(payments);
  const color = COLORS[status] || 'bg-gray-100 text-gray-600';
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${color} ${className}`}>
      {t(`pages.order_detail.payment_${status.toLowerCase()}`)}
    </span>
  );
}
