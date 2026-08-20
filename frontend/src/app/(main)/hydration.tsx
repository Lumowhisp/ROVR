import React, { useState, useCallback } from 'react';
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
import { useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Path } from 'react-native-svg';
import { ProgressRing } from '@/components/ui';
import BottomNav from '@/components/BottomNav';
import { hydrationAPI } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import * as Haptics from 'expo-haptics';

interface HydrationLog {
  id: string;
  time: string;
  ml: number;
}

function DropletIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="#22D3EE">
      <Path d="M12 2C6 8 4 13 4 16a8 8 0 0016 0c0-3-2-8-8-14z" />
    </Svg>
  );
}

export default function HydrationScreen() {
  const { user } = useAuth();
  const [goal, setGoal] = useState(2800);
  const [consumed, setConsumed] = useState(0);
  const [logs, setLogs] = useState<HydrationLog[]>([]);

  const todayKey = `rovr_hydration_${new Date().toISOString().split('T')[0]}`;
  const pct = goal > 0 ? Math.min(Math.round((consumed / goal) * 100), 100) : 0;

  const loadData = useCallback(async () => {
    try {
      // Calculate daily goal based on weight if available
      const calculatedGoal = user?.weight ? Math.round(user.weight * 35) : 2800;
      setGoal(calculatedGoal);

      // Try syncing with backend daily record
      try {
        const dailyRes = await hydrationAPI.createDaily();
        if (dailyRes && dailyRes.goal) {
          setGoal(dailyRes.goal);
          if (dailyRes.consumed > 0) {
            setConsumed(dailyRes.consumed);
          }
        }
      } catch (err) {
        console.log('Backend daily hydration record sync error:', err);
      }

      // Load saved logs for today from AsyncStorage
      const stored = await AsyncStorage.getItem(todayKey);
      if (stored) {
        const parsed: HydrationLog[] = JSON.parse(stored);
        setLogs(parsed);
        const total = parsed.reduce((sum, item) => sum + item.ml, 0);
        setConsumed(total);
      }
    } catch (err) {
      console.log('Hydration load error:', err);
    }
  }, [user, todayKey]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleAddWater = async (amount = 250) => {
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch {}

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const newLog: HydrationLog = {
      id: Date.now().toString(),
      time: timeStr,
      ml: amount,
    };

    const updatedLogs = [newLog, ...logs];
    const newTotal = consumed + amount;

    setLogs(updatedLogs);
    setConsumed(newTotal);

    try {
      await AsyncStorage.setItem(todayKey, JSON.stringify(updatedLogs));
    } catch (err) {
      console.log('Failed saving hydration log:', err);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent />
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Hydration</Text>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Main Water Ring Gauge Card */}
          <View style={styles.mainGaugeCard}>
            <ProgressRing
              size={156}
              stroke={9}
              progress={pct}
              color="#22D3EE"
              trackColor="rgba(34, 211, 238, 0.12)"
            >
              <View style={styles.gaugeInner}>
                <Text style={styles.gaugeVolume}>
                  {(consumed / 1000).toFixed(1)}
                </Text>
                <Text style={styles.gaugeGoal}>
                  of {(goal / 1000).toFixed(1)} L
                </Text>
              </View>
            </ProgressRing>

            <Text style={styles.gaugeCaption}>Daily Target</Text>

            <View style={styles.summaryRow}>
              <View style={styles.summaryBox}>
                <Text style={styles.summaryVal}>{(goal / 1000).toFixed(1)} L</Text>
                <Text style={styles.summaryLbl}>Daily Goal</Text>
              </View>
              <View style={styles.summaryBox}>
                <Text style={styles.summaryVal}>{(consumed / 1000).toFixed(1)} L</Text>
                <Text style={styles.summaryLbl}>Today Consumed</Text>
              </View>
            </View>
          </View>

          {/* Quick Add Buttons */}
          <View style={styles.addBtnContainer}>
            <TouchableOpacity
              activeOpacity={0.88}
              onPress={() => handleAddWater(250)}
              style={styles.addBtn}
            >
              <Text style={styles.addBtnText}>+ 250 ml</Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.88}
              onPress={() => handleAddWater(500)}
              style={[styles.addBtn, styles.addBtnSecondary]}
            >
              <Text style={[styles.addBtnText, styles.addBtnTextSecondary]}>+ 500 ml</Text>
            </TouchableOpacity>
          </View>

          {/* Today's Log */}
          {logs.length > 0 ? (
            <>
              <Text style={styles.sectionHeader}>TODAY&apos;S LOG</Text>
              <View style={styles.logsList}>
                {logs.map((l) => (
                  <View key={l.id} style={styles.logCard}>
                    <View style={styles.dropletBadge}>
                      <DropletIcon />
                    </View>
                    <Text style={styles.logTime}>{l.time}</Text>
                    <Text style={styles.logAmount}>{l.ml} ml</Text>
                  </View>
                ))}
              </View>
            </>
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>Tap above to log your first water intake today!</Text>
            </View>
          )}
        </ScrollView>

        <BottomNav active="home" />
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
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 12,
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: '#F7F8F9',
    letterSpacing: -0.5,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 110,
  },
  mainGaugeCard: {
    padding: 24,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    alignItems: 'center',
    marginBottom: 18,
  },
  gaugeInner: {
    alignItems: 'center',
  },
  gaugeVolume: {
    fontSize: 34,
    fontWeight: '900',
    color: '#22D3EE',
    lineHeight: 38,
  },
  gaugeGoal: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.4)',
  },
  gaugeCaption: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.4)',
    marginTop: 12,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  summaryBox: {
    flex: 1,
    padding: 14,
    borderRadius: 18,
    backgroundColor: 'rgba(34, 211, 238, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(34, 211, 238, 0.14)',
    alignItems: 'center',
  },
  summaryVal: {
    fontSize: 16,
    fontWeight: '800',
    color: '#F7F8F9',
    marginBottom: 2,
  },
  summaryLbl: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.4)',
    fontWeight: '500',
  },
  addBtnContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 22,
  },
  addBtn: {
    backgroundColor: '#22D3EE',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 20,
    shadowColor: '#22D3EE',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 4,
  },
  addBtnSecondary: {
    backgroundColor: 'rgba(34, 211, 238, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(34, 211, 238, 0.3)',
    shadowOpacity: 0,
    elevation: 0,
  },
  addBtnText: {
    color: '#0E172A',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  addBtnTextSecondary: {
    color: '#22D3EE',
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.4)',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  logsList: {
    gap: 8,
  },
  logCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  dropletBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(34, 211, 238, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  logTime: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: '#F7F8F9',
  },
  logAmount: {
    fontSize: 14,
    fontWeight: '800',
    color: '#F7F8F9',
  },
  emptyCard: {
    padding: 24,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    alignItems: 'center',
    marginTop: 8,
  },
  emptyText: {
    color: 'rgba(255, 255, 255, 0.35)',
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
});
