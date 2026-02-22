import { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, FlatList, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/auth.store';
import { reservationApi, locationApi } from '@/api/endpoints';
import type { Reservation, Location, TimeSlot } from '@/api/types';
import { formatDate } from '@/lib/formatters';
import TextInput from '@/components/ui/TextInput';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Badge from '@/components/ui/Badge';

export default function ReservationsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);

  const [locations, setLocations] = useState<Location[]>([]);
  const [myReservations, setMyReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

  // Form
  const [selectedLocationId, setSelectedLocationId] = useState('');
  const [date, setDate] = useState('');
  const [partySize, setPartySize] = useState(2);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [selectedTime, setSelectedTime] = useState('');
  const [comment, setComment] = useState('');
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    locationApi.getAll().then((res) => {
      setLocations((res.data || []).filter((l: Location) => l.isActive));
    });
    if (token) {
      reservationApi.getMine().then((res) => {
        setMyReservations(res.data || []);
      });
    }
    setLoading(false);
  }, [token]);

  useEffect(() => {
    if (!selectedLocationId || !date) return;
    setSlotsLoading(true);
    reservationApi
      .getSlots(selectedLocationId, date, partySize)
      .then((res) => setSlots(res.data || []))
      .catch(() => setSlots([]))
      .finally(() => setSlotsLoading(false));
  }, [selectedLocationId, date, partySize]);

  if (!user) {
    return (
      <View className="flex-1 items-center justify-center p-6">
        <Text className="text-gray-500 text-center mb-4">{t('reservations.loginRequired')}</Text>
        <Button title={t('nav.login')} onPress={() => router.push('/(auth)/login')} />
      </View>
    );
  }

  async function handleBook() {
    if (!selectedLocationId || !date || !selectedTime) return;
    setSubmitting(true);
    try {
      await reservationApi.create({
        locationId: selectedLocationId,
        date,
        time: selectedTime,
        partySize,
        comment: comment || undefined,
      });
      Alert.alert('Success', 'Reservation booked!');
      setSelectedTime('');
      setComment('');
      const res = await reservationApi.getMine();
      setMyReservations(res.data || []);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to book');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <ScrollView className="flex-1 bg-gray-50" contentContainerStyle={{ padding: 16 }}>
      {/* Book a table */}
      <View className="bg-white rounded-xl p-5 border border-gray-100 mb-6">
        <Text className="text-lg font-bold text-gray-900 mb-4">{t('reservations.bookTable')}</Text>

        {/* Location picker */}
        <Text className="text-sm font-medium text-gray-700 mb-2">{t('reservations.selectLocation')}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
          {locations.map((loc) => (
            <Pressable
              key={loc.id}
              onPress={() => setSelectedLocationId(loc.id)}
              className={`px-4 py-2 rounded-full mr-2 ${
                selectedLocationId === loc.id ? 'bg-primary-600' : 'bg-gray-200'
              }`}
            >
              <Text className={`text-sm font-medium ${selectedLocationId === loc.id ? 'text-white' : 'text-gray-700'}`}>
                {loc.name}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Date */}
        <TextInput
          label={t('reservations.date')}
          placeholder="YYYY-MM-DD"
          value={date}
          onChangeText={setDate}
        />

        {/* Party size */}
        <View className="flex-row items-center mb-4">
          <Text className="text-sm font-medium text-gray-700 mr-4">{t('reservations.partySize')}</Text>
          <View className="flex-row items-center">
            <Pressable
              onPress={() => setPartySize((p) => Math.max(1, p - 1))}
              className="w-8 h-8 rounded-full bg-gray-200 items-center justify-center"
            >
              <Text className="font-bold text-gray-600">-</Text>
            </Pressable>
            <Text className="mx-4 text-base font-semibold">{partySize}</Text>
            <Pressable
              onPress={() => setPartySize((p) => p + 1)}
              className="w-8 h-8 rounded-full bg-gray-200 items-center justify-center"
            >
              <Text className="font-bold text-gray-600">+</Text>
            </Pressable>
          </View>
        </View>

        {/* Time slots */}
        {selectedLocationId && date ? (
          slotsLoading ? (
            <LoadingSpinner size="small" />
          ) : slots.length === 0 ? (
            <Text className="text-gray-500 text-sm mb-4">{t('reservations.noSlots')}</Text>
          ) : (
            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-2">{t('reservations.availableSlots')}</Text>
              <View className="flex-row flex-wrap gap-2">
                {slots.filter((s) => s.available).map((slot) => (
                  <Pressable
                    key={slot.time}
                    onPress={() => setSelectedTime(slot.time)}
                    className={`px-4 py-2 rounded-lg border ${
                      selectedTime === slot.time ? 'border-primary-600 bg-primary-50' : 'border-gray-200'
                    }`}
                  >
                    <Text className={selectedTime === slot.time ? 'text-primary-700 font-medium' : 'text-gray-700'}>
                      {slot.time}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )
        ) : (
          <Text className="text-gray-400 text-sm mb-4">{t('reservations.selectDateFirst')}</Text>
        )}

        <TextInput
          label={t('reservations.specialRequests')}
          placeholder="Any special requests..."
          value={comment}
          onChangeText={setComment}
          multiline
        />

        <Button
          title={submitting ? t('reservations.booking') : t('reservations.bookNow')}
          onPress={handleBook}
          loading={submitting}
          disabled={!selectedLocationId || !date || !selectedTime}
        />
      </View>

      {/* My reservations */}
      {myReservations.length > 0 && (
        <View>
          <Text className="text-lg font-bold text-gray-900 mb-3">{t('reservations.myReservations')}</Text>
          {myReservations.map((res) => (
            <View key={res.id} className="bg-white rounded-xl p-4 border border-gray-100 mb-3">
              <View className="flex-row justify-between items-center mb-2">
                <Text className="text-gray-900 font-semibold">{res.location.name}</Text>
                <Badge label={res.status} variant={res.status === 'CONFIRMED' ? 'success' : 'default'} />
              </View>
              <Text className="text-gray-500 text-sm">
                {formatDate(res.date)} at {res.time} · {res.partySize} guests
              </Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
