import { useState, useEffect } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { orderApi } from '@/api/endpoints';
import type { Order } from '@/api/types';
import { formatCurrency, formatDateTime, useCurrency } from '@/lib/formatters';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ErrorView from '@/components/ui/ErrorView';
import Button from '@/components/ui/Button';

export default function OrderConfirmationScreen() {
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

  if (loading) return <LoadingSpinner fullScreen />;
  if (error || !order) return <ErrorView message={error} />;

  return (
    <ScrollView className="flex-1 bg-gray-50" contentContainerStyle={{ padding: 16 }}>
      {/* Success header */}
      <View className="items-center py-8">
        <View className="w-16 h-16 rounded-full bg-green-100 items-center justify-center mb-4">
          <Text className="text-green-600 text-3xl">{'\u2713'}</Text>
        </View>
        <Text className="text-2xl font-bold text-gray-900 mb-1">{t('orderConfirmation.title')}</Text>
        <Text className="text-gray-500 text-base">{t('orderConfirmation.thankYou')}</Text>
      </View>

      {/* Order details */}
      <View className="bg-white rounded-xl p-5 border border-gray-100 mb-4">
        <View className="flex-row justify-between mb-3">
          <Text className="text-gray-500 text-sm">{t('orderConfirmation.orderNumber')}</Text>
          <Text className="text-gray-900 font-bold text-base">#{order.orderNumber}</Text>
        </View>
        <View className="flex-row justify-between mb-3">
          <Text className="text-gray-500 text-sm">{t('orders.status')}</Text>
          <Text className="text-primary-600 font-semibold">{order.status}</Text>
        </View>
        <View className="flex-row justify-between">
          <Text className="text-gray-500 text-sm">{t('orders.total')}</Text>
          <Text className="text-gray-900 font-bold">{formatCurrency(order.total)}</Text>
        </View>
      </View>

      {/* Items */}
      <View className="bg-white rounded-xl p-5 border border-gray-100 mb-6">
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
      </View>

      {/* Actions */}
      <View className="gap-3 mb-8">
        <Button
          title={t('orderConfirmation.trackOrder')}
          onPress={() => router.replace(`/orders/${order.id}`)}
        />
        <Button
          title={t('orderConfirmation.orderMore')}
          variant="outline"
          onPress={() => router.replace('/(tabs)/menu')}
        />
      </View>
    </ScrollView>
  );
}
