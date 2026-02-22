import { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { menuApi } from '@/api/endpoints';
import type { MenuItemDetail, MenuOption, MenuOptionValue } from '@/api/types';
import { useCartStore } from '@/store/cart.store';
import { formatCurrency } from '@/lib/formatters';
import { API_BASE_URL } from '@/lib/constants';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ErrorView from '@/components/ui/ErrorView';
import Button from '@/components/ui/Button';

export default function ItemDetailScreen() {
  const { itemId } = useLocalSearchParams<{ itemId: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const addItem = useCartStore((s) => s.addItem);

  const [item, setItem] = useState<MenuItemDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string[]>>({});

  useEffect(() => {
    if (!itemId) return;
    menuApi
      .getItem(itemId)
      .then((res) => {
        setItem(res.data!);
        // Pre-select default values
        const defaults: Record<string, string[]> = {};
        for (const opt of res.data!.options) {
          const defaultVal = opt.values.find((v: MenuOptionValue) => v.isDefault);
          if (defaultVal) {
            defaults[opt.id] = [defaultVal.id];
          }
        }
        setSelectedOptions(defaults);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [itemId]);

  if (loading) return <LoadingSpinner fullScreen />;
  if (error || !item) return <ErrorView message={error} />;

  const optionsTotal = Object.entries(selectedOptions).reduce((sum, [optId, valIds]) => {
    const opt = item.options.find((o) => o.id === optId);
    if (!opt) return sum;
    return sum + valIds.reduce((s, vid) => {
      const val = opt.values.find((v) => v.id === vid);
      return s + (val?.priceModifier || 0);
    }, 0);
  }, 0);

  const totalPrice = (item.price + optionsTotal) * quantity;

  function handleSelectOption(option: MenuOption, value: MenuOptionValue) {
    setSelectedOptions((prev) => {
      const current = prev[option.id] || [];
      if (option.displayType === 'CHECKBOX') {
        // Toggle
        if (current.includes(value.id)) {
          return { ...prev, [option.id]: current.filter((id) => id !== value.id) };
        }
        if (option.maxSelect && current.length >= option.maxSelect) return prev;
        return { ...prev, [option.id]: [...current, value.id] };
      }
      // Single select (SELECT, RADIO)
      return { ...prev, [option.id]: [value.id] };
    });
  }

  function handleAddToCart() {
    const cartOptions = Object.entries(selectedOptions).flatMap(([optId, valIds]) => {
      const opt = item!.options.find((o) => o.id === optId);
      if (!opt) return [];
      return valIds.map((vid) => {
        const val = opt.values.find((v) => v.id === vid)!;
        return {
          optionId: opt.id,
          optionName: opt.name,
          valueId: val.id,
          valueName: val.name,
          priceModifier: val.priceModifier,
        };
      });
    });

    addItem({
      menuItemId: item!.id,
      name: item!.name,
      price: item!.price,
      quantity,
      options: cartOptions,
    });

    router.back();
  }

  return (
    <View className="flex-1 bg-white">
      <ScrollView>
        {/* Image */}
        {item.image ? (
          <Image
            source={{ uri: item.image.startsWith('http') ? item.image : `${API_BASE_URL}${item.image}` }}
            className="h-64 w-full"
            resizeMode="cover"
          />
        ) : (
          <View className="h-48 bg-primary-100 items-center justify-center">
            <Text className="text-primary-400 text-5xl">{'\u{1F37D}'}</Text>
          </View>
        )}

        <View className="p-5">
          {/* Name & price */}
          <View className="flex-row items-start justify-between mb-2">
            <Text className="text-2xl font-bold text-gray-900 flex-1">{item.name}</Text>
            <Text className="text-xl font-bold text-primary-600 ml-4">{formatCurrency(item.price)}</Text>
          </View>
          {item.description && (
            <Text className="text-gray-500 text-base mb-4">{item.description}</Text>
          )}

          {/* Allergens */}
          {item.allergens.length > 0 && (
            <View className="flex-row flex-wrap gap-2 mb-4">
              <Text className="text-xs font-medium text-gray-500 mr-1">{t('menu.allergens')}:</Text>
              {item.allergens.map((a) => (
                <View key={a.allergen.id} className="bg-amber-50 px-2 py-0.5 rounded-full">
                  <Text className="text-amber-700 text-xs">{a.allergen.name}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Options */}
          {item.options.map((opt) => (
            <View key={opt.id} className="mb-5">
              <View className="flex-row items-center mb-2">
                <Text className="text-base font-semibold text-gray-900">{opt.name}</Text>
                {opt.isRequired && (
                  <Text className="text-red-500 text-xs ml-2">{t('common.required')}</Text>
                )}
              </View>
              <View className="gap-2">
                {opt.values.map((val) => {
                  const isSelected = (selectedOptions[opt.id] || []).includes(val.id);
                  return (
                    <Pressable
                      key={val.id}
                      onPress={() => handleSelectOption(opt, val)}
                      className={`flex-row items-center justify-between p-3 rounded-lg border-2 ${
                        isSelected ? 'border-primary-600 bg-primary-50' : 'border-gray-200'
                      }`}
                    >
                      <Text className={`text-sm font-medium ${isSelected ? 'text-primary-700' : 'text-gray-700'}`}>
                        {val.name}
                      </Text>
                      {val.priceModifier > 0 && (
                        <Text className="text-sm text-gray-500">+{formatCurrency(val.priceModifier)}</Text>
                      )}
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ))}

          {/* Quantity */}
          <View className="flex-row items-center justify-center my-4">
            <Pressable
              onPress={() => setQuantity((q) => Math.max(1, q - 1))}
              className="w-10 h-10 rounded-full bg-gray-200 items-center justify-center"
            >
              <Text className="text-xl font-bold text-gray-700">-</Text>
            </Pressable>
            <Text className="mx-6 text-xl font-bold text-gray-900">{quantity}</Text>
            <Pressable
              onPress={() => setQuantity((q) => q + 1)}
              className="w-10 h-10 rounded-full bg-gray-200 items-center justify-center"
            >
              <Text className="text-xl font-bold text-gray-700">+</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      {/* Bottom bar */}
      <View className="p-4 border-t border-gray-200 bg-white">
        <Button
          title={`${t('menu.addToCart')} - ${formatCurrency(totalPrice)}`}
          onPress={handleAddToCart}
        />
      </View>
    </View>
  );
}
