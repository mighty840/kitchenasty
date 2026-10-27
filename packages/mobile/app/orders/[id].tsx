import { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { orderApi } from '@/api/endpoints';
import { useOrderSocket } from '@/hooks/useOrderSocket';
import type { Order } from '@/api/types';
import { formatCurrency, formatDateTime, useCurrency } from '@/lib/formatters';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ErrorView from '@/components/ui/ErrorView';
import Button from '@/components/ui/Button';

const DELIVERY_STEPS = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED'];
const PICKUP_STEPS = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'PICKED_UP'];

const STEP_LABELS: Record<string, string> = {
  PENDING: 'Placed',
  CONFIRMED: 'Confirmed',
  PREPARING: 'Preparing',
  READY: 'Ready',
  OUT_FOR_DELIVERY: 'Out for Delivery',
  DELIVERED: 'Delivered',
  PICKED_UP: 'Picked Up',
};

export default function LiveOrderStatusScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  useCurrency();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    orderApi
      .getById(id)
      .then((res) => setOrder(res.data!))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  // Real-time updates
  const onStatusUpdate = useCallback((data: { id: string; status: string }) => {
    setOrder((prev) => (prev ? { ...prev, status: data.status } : prev));
  }, []);

  useOrderSocket(id, onStatusUpdate);

  if (loading) return <LoadingSpinner fullScreen />;
  if (error || !order) return <ErrorView message={error} />;

  const isCancelled = order.status === 'CANCELLED';
  const steps = order.orderType === 'DELIVERY' ? DELIVERY_STEPS : PICKUP_STEPS;
  const currentStep = steps.indexOf(order.status);

  return (
    <ScrollView className="flex-1 bg-gray-50" contentContainerStyle={{ padding: 16 }}>
      {/* Header */}
      <View className="flex-row justify-between items-center mb-6">
        <View>
          <Text className="text-xl font-bold text-gray-900">#{order.orderNumber}</Text>
          <Text className="text-gray-500 text-sm">{formatDateTime(order.createdAt)}</Text>
        </View>
      </View>

      {/* Status tracker */}
      <View className="bg-white rounded-xl p-5 border border-gray-100 mb-4">
        <Text className="text-base font-semibold text-gray-900 mb-4">{t('orders.status')}</Text>

        {isCancelled ? (
          <View className="bg-red-50 p-4 rounded-lg">
            <Text className="text-red-700 font-medium">{t('orderStatus.cancelledMessage')}</Text>
          </View>
        ) : (
          <View>
            {steps.map((step, idx) => {
              const isComplete = idx <= currentStep;
              const isCurrent = idx === currentStep;
              return (
                <View key={step} className="flex-row items-center mb-3">
                  <View
                    className={`w-8 h-8 rounded-full items-center justify-center mr-3 ${
                      isComplete ? 'bg-primary-600' : 'bg-gray-200'
                    } ${isCurrent ? 'border-2 border-primary-300' : ''}`}
                  >
                    {isComplete ? (
                      <Text className="text-white text-sm font-bold">{'\u2713'}</Text>
                    ) : (
                      <Text className="text-gray-500 text-sm">{idx + 1}</Text>
                    )}
                  </View>
                  <Text
                    className={`text-sm ${isComplete ? 'text-primary-700 font-medium' : 'text-gray-400'}`}
                  >
                    {STEP_LABELS[step] || step}
                  </Text>
                </View>
              );
            })}
          </View>
        )}
      </View>

      {/* Order Items */}
      <View className="bg-white rounded-xl p-5 border border-gray-100 mb-4">
        <Text className="text-base font-semibold text-gray-900 mb-3">{t('orders.items')}</Text>
        {order.items.map((item) => (
          <View key={item.id} className="flex-row justify-between py-2 border-b border-gray-50">
            <View className="flex-1">
              <Text className="text-gray-900 text-sm">
                <Text className="text-gray-400">{item.quantity}x </Text>
                {item.name}
              </Text>
              {item.surchargeAmount > 0 && (
                <Text className="text-gray-500 text-xs">{t('pricing.surcharge')}: {formatCurrency(item.surchargeAmount)} / {t('pricing.unit')}</Text>
              )}
              {item.options.length > 0 && (
                <Text className="text-gray-400 text-xs">
                  {item.options.map((o) => `${o.name}: ${o.value}`).join(', ')}
                </Text>
              )}
            </View>
            <Text className="text-gray-900 text-sm font-medium">{formatCurrency(item.subtotal)}</Text>
          </View>
        ))}
        <View className="mt-3 pt-3 border-t border-gray-100">
          <SummaryRow label={t('checkout.subtotal')} value={formatCurrency(order.subtotal)} />
          <SummaryRow label={t('checkout.tax')} value={formatCurrency(order.tax)} />
          {order.deliveryFee > 0 && (
            <SummaryRow label={t('checkout.deliveryFee')} value={formatCurrency(order.deliveryFee)} />
          )}
          {order.discount > 0 && (
            <SummaryRow label={t('checkout.discount')} value={`-${formatCurrency(order.discount)}`} />
          )}
          <View className="flex-row justify-between mt-2 pt-2 border-t border-gray-100">
            <Text className="text-base font-bold">{t('checkout.total')}</Text>
            <Text className="text-base font-bold text-primary-600">{formatCurrency(order.total)}</Text>
          </View>
        </View>
      </View>

      {/* Actions */}
      <View className="gap-3 mb-8">
        <Button title={t('home.viewMenu')} onPress={() => router.push('/(tabs)/menu')} />
        <Button title={t('orders.title')} variant="outline" onPress={() => router.push('/(tabs)/orders')} />
      </View>
    </ScrollView>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between py-1">
      <Text className="text-sm text-gray-600">{label}</Text>
      <Text className="text-sm font-medium text-gray-900">{value}</Text>
    </View>
  );
}
