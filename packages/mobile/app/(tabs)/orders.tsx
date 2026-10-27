import { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, Pressable, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/auth.store';
import { orderApi } from '@/api/endpoints';
import type { Order } from '@/api/types';
import { formatCurrency, formatDateTime, useCurrency } from '@/lib/formatters';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Badge from '@/components/ui/Badge';

const STATUS_VARIANT: Record<string, 'default' | 'success' | 'warning' | 'error' | 'primary'> = {
  PENDING: 'warning',
  CONFIRMED: 'primary',
  PREPARING: 'primary',
  READY: 'success',
  OUT_FOR_DELIVERY: 'primary',
  DELIVERED: 'success',
  PICKED_UP: 'success',
  CANCELLED: 'error',
};

export default function OrdersScreen() {
  const { t } = useTranslation();
  useCurrency();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const res = await orderApi.getHistory({ limit: 20 });
      setOrders(res.data || []);
    } catch {}
    setLoading(false);
    setRefreshing(false);
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  if (!user) {
    return (
      <View className="flex-1 items-center justify-center p-6">
        <Text className="text-gray-500 text-center mb-4">
          {t('orders.pleaseLogin')} {t('orders.loginToView')} {t('orders.toViewOrders')}
        </Text>
        <Pressable onPress={() => router.push('/(auth)/login')} className="bg-primary-600 px-6 py-3 rounded-xl">
          <Text className="text-white font-semibold">{t('nav.login')}</Text>
        </Pressable>
      </View>
    );
  }

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <FlatList
      data={orders}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ padding: 16, flexGrow: 1 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
      ListEmptyComponent={
        <View className="flex-1 items-center justify-center py-12">
          <Text className="text-gray-500">{t('orders.noOrders')}</Text>
        </View>
      }
      ItemSeparatorComponent={() => <View className="h-3" />}
      renderItem={({ item }) => (
        <Pressable
          onPress={() => router.push(`/orders/${item.id}`)}
          className="bg-white rounded-xl p-4 border border-gray-100"
        >
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-gray-900 font-semibold">#{item.orderNumber}</Text>
            <Badge label={item.status} variant={STATUS_VARIANT[item.status] || 'default'} />
          </View>
          <View className="flex-row items-center justify-between">
            <Text className="text-gray-500 text-sm">{formatDateTime(item.createdAt)}</Text>
            <Text className="text-primary-600 font-bold">{formatCurrency(item.total)}</Text>
          </View>
          {item.location && (
            <Text className="text-gray-400 text-xs mt-1">{item.location.name}</Text>
          )}
        </Pressable>
      )}
    />
  );
}
