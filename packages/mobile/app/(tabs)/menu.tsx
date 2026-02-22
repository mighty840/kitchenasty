import { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, FlatList, Image, TextInput, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useDebounce } from '@/hooks/useDebounce';
import { menuApi } from '@/api/endpoints';
import type { Category, MenuItem } from '@/api/types';
import { formatCurrency } from '@/lib/formatters';
import { API_BASE_URL } from '@/lib/constants';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function MenuScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadCategories = useCallback(async () => {
    try {
      const res = await menuApi.getCategories();
      setCategories((res.data || []).filter((c: Category) => c.isActive && !c.parentId));
    } catch {}
  }, []);

  const loadItems = useCallback(async () => {
    try {
      const res = await menuApi.getItems({
        categoryId: selectedCategory || undefined,
        search: debouncedSearch || undefined,
        limit: 50,
      });
      setItems((res.data || []).filter((i: MenuItem) => i.isActive && (!i.trackStock || i.stockQty > 0)));
    } catch {}
    setLoading(false);
    setRefreshing(false);
  }, [selectedCategory, debouncedSearch]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    setLoading(true);
    loadItems();
  }, [loadItems]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadCategories();
    loadItems();
  }, [loadCategories, loadItems]);

  return (
    <View className="flex-1 bg-gray-50">
      {/* Search */}
      <View className="px-4 pt-4 pb-2">
        <TextInput
          placeholder={t('menu.searchPlaceholder')}
          value={search}
          onChangeText={setSearch}
          className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-base"
          placeholderTextColor="#9CA3AF"
          autoCapitalize="none"
          returnKeyType="search"
        />
      </View>

      {/* Category pills */}
      <View className="px-4 pb-3">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="gap-2">
          <Pressable
            onPress={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-full mr-2 ${
              !selectedCategory ? 'bg-primary-600' : 'bg-gray-200'
            }`}
          >
            <Text className={`text-sm font-medium ${!selectedCategory ? 'text-white' : 'text-gray-700'}`}>
              {t('menu.allCategories')}
            </Text>
          </Pressable>
          {categories.map((cat) => (
            <Pressable
              key={cat.id}
              onPress={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-full mr-2 ${
                selectedCategory === cat.id ? 'bg-primary-600' : 'bg-gray-200'
              }`}
            >
              <Text
                className={`text-sm font-medium ${
                  selectedCategory === cat.id ? 'text-white' : 'text-gray-700'
                }`}
              >
                {cat.name}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Items grid */}
      {loading ? (
        <LoadingSpinner />
      ) : (
        <FlatList
          data={items}
          numColumns={2}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 12 }}
          columnWrapperStyle={{ gap: 12 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ItemSeparatorComponent={() => <View className="h-3" />}
          ListEmptyComponent={
            <View className="items-center py-12">
              <Text className="text-gray-500">{t('menu.noItems')}</Text>
            </View>
          }
          renderItem={({ item }) => (
            <Pressable
              onPress={() => router.push(`/menu/${item.id}`)}
              className="flex-1 bg-white rounded-xl overflow-hidden border border-gray-100"
            >
              {item.image ? (
                <Image
                  source={{ uri: item.image.startsWith('http') ? item.image : `${API_BASE_URL}${item.image}` }}
                  className="h-28 w-full"
                  resizeMode="cover"
                />
              ) : (
                <View className="h-28 bg-primary-100 items-center justify-center">
                  <Text className="text-primary-400 text-3xl">{'\u{1F37D}'}</Text>
                </View>
              )}
              <View className="p-3">
                <Text className="text-gray-900 font-semibold text-sm" numberOfLines={1}>
                  {item.name}
                </Text>
                {item.description && (
                  <Text className="text-gray-400 text-xs mt-0.5" numberOfLines={2}>
                    {item.description}
                  </Text>
                )}
                <View className="flex-row items-center justify-between mt-2">
                  <Text className="text-primary-600 font-bold">{formatCurrency(item.price)}</Text>
                  {item._count.options > 0 && (
                    <View className="bg-primary-50 px-2 py-0.5 rounded-full">
                      <Text className="text-primary-600 text-xs">{t('menu.options')}</Text>
                    </View>
                  )}
                </View>
              </View>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}
