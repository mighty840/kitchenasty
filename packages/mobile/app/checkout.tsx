import { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useCartStore } from '@/store/cart.store';
import { useAuthStore } from '@/store/auth.store';
import { orderApi, loyaltyApi, locationApi } from '@/api/endpoints';
import { formatCurrency, useCurrency } from '@/lib/formatters';
import { DEFAULT_DELIVERY_FEE } from '@/lib/constants';
import { calculateCartTotals, roundMoney } from '@kitchenasty/shared';
import Button from '@/components/ui/Button';
import TextInput from '@/components/ui/TextInput';
import EmptyState from '@/components/ui/EmptyState';

type OrderType = 'delivery' | 'pickup';
type PaymentMethod = 'cash' | 'stripe';

export default function CheckoutScreen() {
  const { t } = useTranslation();
  useCurrency();
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const { subtotal, tax } = calculateCartTotals(items);
  const clearCart = useCartStore((s) => s.clear);
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);

  const [orderType, setOrderType] = useState<OrderType>('delivery');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [address, setAddress] = useState({ line1: '', line2: '', city: '', state: '', zip: '' });
  const [comment, setComment] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Guest fields
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');

  // Loyalty
  const [loyaltyBalance, setLoyaltyBalance] = useState(0);
  const [loyaltyRedeem, setLoyaltyRedeem] = useState(0);
  const loyaltyDiscount = loyaltyRedeem / 100;

  // Busy
  const [isBusy, setIsBusy] = useState(false);

  const deliveryFee = orderType === 'delivery' ? DEFAULT_DELIVERY_FEE : 0;
  const total = roundMoney(subtotal + deliveryFee - loyaltyDiscount);

  useEffect(() => {
    locationApi
      .getAll()
      .then((res) => {
        const loc = res.data?.[0];
        if (loc?.isBusy) setIsBusy(true);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (token) {
      loyaltyApi
        .getBalance()
        .then((res) => {
          if (res.data) setLoyaltyBalance(res.data.points);
        })
        .catch(() => {});
    }
  }, [token]);

  if (items.length === 0) {
    return (
      <EmptyState
        title={t('checkout.emptyCart')}
        actionLabel={t('checkout.browseMenu')}
        onAction={() => router.replace('/(tabs)/menu')}
      />
    );
  }

  async function handlePlaceOrder() {
    setError('');
    setLoading(true);

    try {
      const orderItems = items.map((item) => ({
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        comment: item.comment,
        options: item.options.map((o) => ({
          menuOptionValueId: o.valueId,
          name: o.optionName,
          value: o.valueName,
          priceModifier: o.priceModifier,
        })),
      }));

      const body: Record<string, unknown> = {
        orderType: orderType.toUpperCase(),
        paymentMethod,
        items: orderItems,
        comment: comment || undefined,
        couponCode: couponCode || undefined,
      };

      if (orderType === 'delivery') {
        body.address = address;
      }

      if (!user) {
        body.guestName = guestName;
        body.guestEmail = guestEmail;
        body.guestPhone = guestPhone || undefined;
      }

      if (loyaltyRedeem > 0) {
        body.loyaltyPointsRedeem = loyaltyRedeem;
      }

      const res = await orderApi.place(body);
      clearCart();
      router.replace(`/order/${res.data!.id}`);
    } catch (err: any) {
      setError(err.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView className="flex-1 bg-gray-50" contentContainerStyle={{ padding: 16 }}>
      {error ? (
        <View className="bg-red-50 p-4 rounded-xl mb-4">
          <Text className="text-red-700 text-sm">{error}</Text>
        </View>
      ) : null}

      {isBusy && (
        <View className="bg-amber-50 p-4 rounded-xl mb-4">
          <Text className="text-amber-800 font-semibold">Currently Unavailable</Text>
        </View>
      )}

      {/* Order Type */}
      <View className="bg-white rounded-xl p-4 mb-4 border border-gray-100">
        <Text className="text-base font-semibold text-gray-900 mb-3">{t('checkout.orderType')}</Text>
        <View className="flex-row gap-3">
          <Pressable
            onPress={() => setOrderType('delivery')}
            className={`flex-1 py-3 rounded-lg border-2 items-center ${
              orderType === 'delivery' ? 'border-primary-600 bg-primary-50' : 'border-gray-200'
            }`}
          >
            <Text className={orderType === 'delivery' ? 'text-primary-700 font-semibold' : 'text-gray-600'}>
              {t('checkout.delivery')}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setOrderType('pickup')}
            className={`flex-1 py-3 rounded-lg border-2 items-center ${
              orderType === 'pickup' ? 'border-primary-600 bg-primary-50' : 'border-gray-200'
            }`}
          >
            <Text className={orderType === 'pickup' ? 'text-primary-700 font-semibold' : 'text-gray-600'}>
              {t('checkout.pickup')}
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Delivery Address */}
      {orderType === 'delivery' && (
        <View className="bg-white rounded-xl p-4 mb-4 border border-gray-100">
          <Text className="text-base font-semibold text-gray-900 mb-3">{t('checkout.deliveryAddress')}</Text>
          <TextInput
            placeholder={t('checkout.addressLine1')}
            value={address.line1}
            onChangeText={(v) => setAddress({ ...address, line1: v })}
          />
          <TextInput
            placeholder={t('checkout.addressLine2')}
            value={address.line2}
            onChangeText={(v) => setAddress({ ...address, line2: v })}
          />
          <View className="flex-row gap-2">
            <View className="flex-1">
              <TextInput placeholder={t('checkout.city')} value={address.city} onChangeText={(v) => setAddress({ ...address, city: v })} />
            </View>
            <View className="flex-1">
              <TextInput placeholder={t('checkout.state')} value={address.state} onChangeText={(v) => setAddress({ ...address, state: v })} />
            </View>
            <View className="flex-1">
              <TextInput placeholder={t('checkout.zipCode')} value={address.zip} onChangeText={(v) => setAddress({ ...address, zip: v })} />
            </View>
          </View>
        </View>
      )}

      {/* Notes */}
      <View className="bg-white rounded-xl p-4 mb-4 border border-gray-100">
        <TextInput
          label={t('checkout.orderNotes')}
          placeholder="Any special instructions..."
          value={comment}
          onChangeText={setComment}
          multiline
          numberOfLines={3}
        />
      </View>

      {/* Coupon */}
      <View className="bg-white rounded-xl p-4 mb-4 border border-gray-100">
        <Text className="text-base font-semibold text-gray-900 mb-3">{t('checkout.couponCode')}</Text>
        <View className="flex-row gap-2">
          <View className="flex-1">
            <TextInput
              placeholder="Enter code"
              value={couponCode}
              onChangeText={setCouponCode}
              autoCapitalize="characters"
            />
          </View>
          <Pressable className="bg-gray-100 px-4 rounded-lg justify-center">
            <Text className="text-gray-700 font-medium text-sm">{t('checkout.apply')}</Text>
          </Pressable>
        </View>
      </View>

      {/* Loyalty */}
      {user && loyaltyBalance > 0 && (
        <View className="bg-white rounded-xl p-4 mb-4 border border-gray-100">
          <Text className="text-base font-semibold text-gray-900 mb-2">Loyalty Points</Text>
          <Text className="text-sm text-gray-500 mb-3">
            You have <Text className="font-bold text-primary-600">{loyaltyBalance}</Text> points (100 = $1.00)
          </Text>
          <TextInput
            placeholder="Points to redeem"
            value={loyaltyRedeem > 0 ? String(loyaltyRedeem) : ''}
            onChangeText={(v) => setLoyaltyRedeem(Math.max(0, parseInt(v) || 0))}
            keyboardType="numeric"
          />
        </View>
      )}

      {/* Payment Method */}
      <View className="bg-white rounded-xl p-4 mb-4 border border-gray-100">
        <Text className="text-base font-semibold text-gray-900 mb-3">{t('checkout.paymentMethod')}</Text>
        <Pressable
          onPress={() => setPaymentMethod('cash')}
          className={`p-3 rounded-lg border-2 mb-2 ${
            paymentMethod === 'cash' ? 'border-primary-600 bg-primary-50' : 'border-gray-200'
          }`}
        >
          <Text className={paymentMethod === 'cash' ? 'text-primary-700 font-medium' : 'text-gray-600'}>
            {t('checkout.cashOnDelivery')}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setPaymentMethod('stripe')}
          className={`p-3 rounded-lg border-2 ${
            paymentMethod === 'stripe' ? 'border-primary-600 bg-primary-50' : 'border-gray-200'
          }`}
        >
          <Text className={paymentMethod === 'stripe' ? 'text-primary-700 font-medium' : 'text-gray-600'}>
            {t('checkout.creditCard')}
          </Text>
        </Pressable>
      </View>

      {/* Guest Info */}
      {!user && (
        <View className="bg-white rounded-xl p-4 mb-4 border border-gray-100">
          <Text className="text-base font-semibold text-gray-900 mb-3">Contact Information</Text>
          <Pressable onPress={() => router.push('/(auth)/login')} className="mb-3">
            <Text className="text-primary-600 text-sm font-medium underline">{t('nav.login')} for faster checkout</Text>
          </Pressable>
          <TextInput placeholder="Full name *" value={guestName} onChangeText={setGuestName} />
          <TextInput placeholder="Email address *" value={guestEmail} onChangeText={setGuestEmail} keyboardType="email-address" />
          <TextInput placeholder="Phone (optional)" value={guestPhone} onChangeText={setGuestPhone} keyboardType="phone-pad" />
        </View>
      )}

      {/* Order Summary */}
      <View className="bg-white rounded-xl p-4 mb-4 border border-gray-100">
        <Text className="text-base font-semibold text-gray-900 mb-3">{t('checkout.orderSummary')}</Text>
        {items.map((item) => {
          const optTotal = item.options.reduce((s, o) => s + o.priceModifier, 0);
          return (
            <View key={item.id} className="flex-row justify-between mb-2">
              <Text className="text-sm text-gray-700">
                <Text className="text-gray-400">{item.quantity}x </Text>
                {item.name}
              </Text>
              <Text className="text-sm font-medium">{formatCurrency((item.price + optTotal) * item.quantity)}</Text>
            </View>
          );
        })}
        <View className="border-t border-gray-100 mt-2 pt-2">
          <SummaryRow label={t('checkout.subtotal')} value={formatCurrency(subtotal)} />
          <SummaryRow label={t('pricing.includedTax')} value={formatCurrency(tax)} />
          {orderType === 'delivery' && (
            <SummaryRow label={t('checkout.deliveryFee')} value={formatCurrency(deliveryFee)} />
          )}
          {loyaltyDiscount > 0 && (
            <SummaryRow label="Loyalty Discount" value={`-${formatCurrency(loyaltyDiscount)}`} green />
          )}
          <View className="flex-row justify-between mt-2 pt-2 border-t border-gray-100">
            <Text className="text-base font-bold">{t('checkout.total')}</Text>
            <Text className="text-base font-bold text-primary-600">{formatCurrency(total)}</Text>
          </View>
        </View>
      </View>

      <View className="mb-8">
        <Button
          title={isBusy ? 'Currently Unavailable' : `${t('checkout.placeOrder')} - ${formatCurrency(total)}`}
          onPress={handlePlaceOrder}
          loading={loading}
          disabled={isBusy}
        />
      </View>
    </ScrollView>
  );
}

function SummaryRow({ label, value, green }: { label: string; value: string; green?: boolean }) {
  return (
    <View className="flex-row justify-between py-1">
      <Text className={`text-sm ${green ? 'text-green-600' : 'text-gray-600'}`}>{label}</Text>
      <Text className={`text-sm font-medium ${green ? 'text-green-600' : 'text-gray-900'}`}>{value}</Text>
    </View>
  );
}
