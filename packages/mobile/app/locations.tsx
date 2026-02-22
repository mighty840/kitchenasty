import { useState, useEffect } from 'react';
import { View, Text, FlatList, Image, Pressable, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { locationApi } from '@/api/endpoints';
import type { Location } from '@/api/types';
import { API_BASE_URL } from '@/lib/constants';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function LocationsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    locationApi
      .getAll()
      .then((res) => setLocations((res.data || []).filter((l: Location) => l.isActive)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <FlatList
      data={locations}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ padding: 16, flexGrow: 1 }}
      ItemSeparatorComponent={() => <View className="h-4" />}
      ListEmptyComponent={
        <View className="flex-1 items-center justify-center py-12">
          <Text className="text-gray-500">{t('locations.noLocations')}</Text>
        </View>
      }
      renderItem={({ item }) => (
        <View className="bg-white rounded-xl overflow-hidden border border-gray-100">
          {item.image ? (
            <Image
              source={{ uri: item.image.startsWith('http') ? item.image : `${API_BASE_URL}${item.image}` }}
              className="h-40 w-full"
              resizeMode="cover"
            />
          ) : (
            <View className="h-32 bg-primary-100 items-center justify-center">
              <Text className="text-primary-400 text-4xl">{'\u{1F3E2}'}</Text>
            </View>
          )}
          <View className="p-4">
            <Text className="text-lg font-bold text-gray-900 mb-1">{item.name}</Text>
            <Text className="text-gray-500 text-sm mb-1">{item.address}</Text>
            <Text className="text-gray-400 text-sm">{item.city}{item.state ? `, ${item.state}` : ''} {item.postalCode}</Text>
            {item.phone && (
              <Pressable onPress={() => Linking.openURL(`tel:${item.phone}`)} className="mt-2">
                <Text className="text-primary-600 text-sm font-medium">{item.phone}</Text>
              </Pressable>
            )}
            {item.isBusy && (
              <View className="bg-amber-50 p-2 rounded-lg mt-3">
                <Text className="text-amber-700 text-xs font-medium">
                  {item.busyMessage || 'Currently busy'}
                </Text>
              </View>
            )}
            <Pressable
              onPress={() => router.push('/(tabs)/menu')}
              className="bg-primary-600 py-2.5 rounded-lg items-center mt-3"
            >
              <Text className="text-white font-semibold text-sm">{t('locations.viewMenu')}</Text>
            </Pressable>
          </View>
        </View>
      )}
    />
  );
}
