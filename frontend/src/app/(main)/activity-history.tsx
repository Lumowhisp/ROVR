import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Platform,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Footprints, Bike, Compass, Mountain, ArrowLeft } from 'lucide-react-native';
import BottomNav from '@/components/BottomNav';
import * as Haptics from 'expo-haptics';

const FILTERS = ['All', 'Running', 'Cycling', 'Walking', 'Hiking'];

const ACTIVITIES = [
  { id: '1', type: 'Running', label: 'Morning Run', dist: '8.8 km', time: '45:32', cal: '412', date: 'Today', icon: Footprints },
  { id: '2', type: 'Cycling', label: 'Evening Ride', dist: '24.5 km', time: '1:12:15', cal: '680', date: 'Yesterday', icon: Bike },
  { id: '3', type: 'Running', label: 'Interval Run', dist: '5.2 km', time: '28:44', cal: '290', date: 'Mon', icon: Footprints },
  { id: '4', type: 'Running', label: 'Easy Run', dist: '6.4 km', time: '35:10', cal: '348', date: 'Sat', icon: Footprints },
  { id: '5', type: 'Cycling', label: 'Morning Ride', dist: '18.3 km', time: '52:00', cal: '510', date: 'Fri', icon: Bike },
  { id: '6', type: 'Walking', label: 'Sunset Walk', dist: '4.2 km', time: '48:10', cal: '190', date: 'Thu', icon: Compass },
  { id: '7', type: 'Running', label: 'Long Run', dist: '12.1 km', time: '1:05:22', cal: '620', date: 'Wed', icon: Footprints },
  { id: '8', type: 'Hiking', label: 'Hill Trail', dist: '7.5 km', time: '1:45:00', cal: '520', date: 'Last Sun', icon: Mountain },
];

export default function ActivityHistoryScreen() {
  const router = useRouter();
  const [filter, setFilter] = useState('All');

  const handleSelectFilter = (f: string) => {
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
    setFilter(f);
  };

  const filtered =
    filter === 'All'
      ? ACTIVITIES
      : ACTIVITIES.filter((a) => a.type.toLowerCase() === filter.toLowerCase());

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent />
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.circleBtn}
            onPress={() => router.push('/(main)/activity-feed' as any)}
          >
            <ArrowLeft size={16} color="rgba(255, 255, 255, 0.45)" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Activity History</Text>
          <View style={{ width: 38 }} />
        </View>

        {/* Filter Chips Carousel */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {FILTERS.map((f) => {
            const isSel = filter === f;
            return (
              <TouchableOpacity
                key={f}
                activeOpacity={0.85}
                onPress={() => handleSelectFilter(f)}
                style={[
                  styles.filterChip,
                  isSel ? styles.filterChipActive : styles.filterChipInactive,
                ]}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    isSel ? styles.filterChipTextActive : styles.filterChipTextInactive,
                  ]}
                >
                  {f}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Activities List */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.list}>
            {filtered.map((a) => {
              const Icon = a.icon;
              return (
                <View key={a.id} style={styles.card}>
                  <View style={styles.iconWrap}>
                    <Icon size={18} color="rgba(255, 255, 255, 0.5)" />
                  </View>
                  <View style={styles.infoCol}>
                    <Text style={styles.cardLabel}>{a.label}</Text>
                    <Text style={styles.cardSub}>{a.date} · {a.cal} kcal</Text>
                  </View>
                  <View style={styles.metricCol}>
                    <Text style={styles.cardDist}>{a.dist}</Text>
                    <Text style={styles.cardTime}>{a.time}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </ScrollView>

        <BottomNav active="activity" />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#25272A',
  },
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 20 : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  circleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F7F8F9',
  },
  filterRow: {
    paddingHorizontal: 20,
    paddingBottom: 14,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  filterChipActive: {
    backgroundColor: '#F7F8F9',
  },
  filterChipInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  filterChipTextActive: {
    color: '#111214',
  },
  filterChipTextInactive: {
    color: 'rgba(255, 255, 255, 0.45)',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 110,
  },
  list: {
    gap: 10,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  infoCol: {
    flex: 1,
  },
  cardLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F7F8F9',
    marginBottom: 2,
  },
  cardSub: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.4)',
  },
  metricCol: {
    alignItems: 'flex-end',
  },
  cardDist: {
    fontSize: 15,
    fontWeight: '800',
    color: '#F7F8F9',
    marginBottom: 2,
  },
  cardTime: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.4)',
  },
});
