import { View, Text, FlatList, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useCartStore } from '@/store/cart.store';
import { formatCurrency, useCurrency } from '@/lib/formatters';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import { calculateLineTotals } from '@kitchenasty/shared';

export default function CartScreen() {
  const { t } = useTranslation();
  useCurrency();
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const subtotal = useCartStore((s) => s.subtotal());

  if (items.length === 0) {
    return (
      <EmptyState
        title={t('cart.empty')}
        actionLabel={t('cart.browsMenu')}
        onAction={() => {
          router.dismiss();
          router.push('/(tabs)/menu');
        }}
      />
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        ItemSeparatorComponent={() => <View className="h-3" />}
        renderItem={({ item }) => {
          const line = calculateLineTotals(item);

          return (
            <View className="bg-white rounded-xl p-4 border border-gray-100">
              <View className="flex-row justify-between mb-1">
                <Text className="text-gray-900 font-semibold text-base flex-1">{item.name}</Text>
                <Text className="text-primary-600 font-bold">{formatCurrency(line.subtotal)}</Text>
              </View>

              {line.surchargeAmount > 0 && (
                <Text className="text-gray-500 text-xs">{t('pricing.surcharge')}: {formatCurrency(line.surchargeAmount)} / {t('pricing.unit')}</Text>
              )}
              {item.options.length > 0 && (
                <Text className="text-gray-400 text-xs mb-2">
                  {item.options.map((o) => o.valueName).join(', ')}
                </Text>
              )}

              <View className="flex-row items-center justify-between mt-2">
                {/* Quantity controls */}
                <View className="flex-row items-center">
                  <Pressable
                    onPress={() => updateQuantity(item.id, item.quantity - 1)}
                    className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center"
                  >
                    <Text className="text-gray-600 font-bold">-</Text>
                  </Pressable>
                  <Text className="mx-4 text-base font-semibold text-gray-900">{item.quantity}</Text>
                  <Pressable
                    onPress={() => updateQuantity(item.id, item.quantity + 1)}
                    className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center"
                  >
                    <Text className="text-gray-600 font-bold">+</Text>
                  </Pressable>
                </View>

                <Pressable onPress={() => removeItem(item.id)}>
                  <Text className="text-red-500 text-sm font-medium">{t('cart.remove')}</Text>
                </Pressable>
              </View>
            </View>
          );
        }}
      />

      {/* Bottom bar */}
      <View className="p-4 border-t border-gray-200 bg-white">
        <View className="flex-row justify-between mb-3">
          <Text className="text-gray-600 text-base">{t('cart.subtotal')}</Text>
          <Text className="text-gray-900 text-lg font-bold">{formatCurrency(subtotal)}</Text>
        </View>
        <Button
          title={t('cart.checkout')}
          onPress={() => {
            router.dismiss();
            router.push('/checkout');
          }}
        />
      </View>
    </View>
  );
}
