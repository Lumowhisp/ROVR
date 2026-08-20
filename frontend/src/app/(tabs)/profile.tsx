import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  StatusBar,
  Switch,
  Platform,
  Alert,
} from 'react-native';
import {
  ChevronDown,
  LogOut,
  Scale,
  Shield,
  Footprints,
  Flame,
  Moon,
  Sun,
  User,
  Heart,
} from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();

  const [stepsGoal] = useState('6,000');
  const [calorieGoal] = useState('450 kcal');
  const [bedtimeEnabled, setBedtimeEnabled] = useState(true);
  const [getInBedTime] = useState('11:00 pm');
  const [wakeUpTime] = useState('7:00 am');

  const gender = user?.gender ? (user.gender.charAt(0).toUpperCase() + user.gender.slice(1)) : 'Not set';
  const weight = user?.weight ? `${user.weight} kg` : 'Not set';
  const height = user?.height ? `${user.height} cm` : 'Not set';
  const rawBmi = user?.bmi || (user?.weight && user?.height ? (user.weight / ((user.height / 100) ** 2)) : 22.0);
  const bmi = Number(rawBmi).toFixed(1);

  // Compute BMI Health Category & Accent Color
  const numBmi = Number(bmi);
  let bmiCategory = 'Normal Weight';
  let bmiStatusColor = '#00D494';
  let bmiStatusBg = 'rgba(0, 212, 148, 0.12)';

  if (numBmi < 18.5) {
    bmiCategory = 'Underweight';
    bmiStatusColor = '#00E5FF';
    bmiStatusBg = 'rgba(0, 229, 255, 0.12)';
  } else if (numBmi >= 25 && numBmi < 30) {
    bmiCategory = 'Overweight';
    bmiStatusColor = '#F59E0B';
    bmiStatusBg = 'rgba(245, 158, 11, 0.12)';
  } else if (numBmi >= 30) {
    bmiCategory = 'Obese';
    bmiStatusColor = '#EF4444';
    bmiStatusBg = 'rgba(239, 68, 68, 0.12)';
  }

  const handleSignOutPrompt = () => {
    Alert.alert(
      'Sign Out of ROVR',
      'Are you sure you want to end your current session?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: () => signOut() },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>

        <View style={styles.headerRight}>
          <View style={styles.avatarHeaderCircle}>
            <Text style={styles.avatarHeaderText}>
              {user?.name ? user.name[0].toUpperCase() : 'A'}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Athlete & BMI Card */}
        <View style={styles.heroCard}>
          <View style={styles.userRow}>
            <View style={styles.avatarGlowCircle}>
              <Text style={styles.avatarGlowText}>
                {user?.name ? user.name[0].toUpperCase() : 'A'}
              </Text>
            </View>

            <View style={styles.userMeta}>
              <Text style={styles.userNameText}>{user?.name || 'ROVR Athlete'}</Text>
              <Text style={styles.userEmailText} numberOfLines={1}>
                {user?.email || 'Active Athlete'}
              </Text>
            </View>

            <View style={styles.athleteBadge}>
              <Shield size={11} color="#00E5FF" />
              <Text style={styles.athleteBadgeText}>ATHLETE</Text>
            </View>
          </View>

          {/* BMI Health Meter */}
          <View style={styles.bmiHeroBox}>
            <View style={styles.bmiTopRow}>
              <View style={styles.bmiTitleWrap}>
                <Scale size={15} color="#00D494" />
                <Text style={styles.bmiTitle}>Body Mass Index</Text>
              </View>

              <View style={[styles.bmiStatusPill, { backgroundColor: bmiStatusBg }]}>
                <Text style={[styles.bmiStatusText, { color: bmiStatusColor }]}>{bmiCategory}</Text>
              </View>
            </View>

            <View style={styles.bmiValRow}>
              <Text style={styles.bmiBigVal}>{bmi}</Text>
              <Text style={styles.bmiUnit}>kg/m²</Text>
            </View>

            {/* Segmented Color Track */}
            <View style={styles.bmiMeterTrack}>
              <View style={[styles.bmiMeterSeg, { backgroundColor: '#00E5FF' }]} />
              <View style={[styles.bmiMeterSeg, { backgroundColor: '#00D494' }]} />
              <View style={[styles.bmiMeterSeg, { backgroundColor: '#F59E0B' }]} />
              <View style={[styles.bmiMeterSeg, { backgroundColor: '#EF4444' }]} />
            </View>

            <View style={styles.bmiRangeLabels}>
              <Text style={styles.bmiRangeText}>Under &lt;18.5</Text>
              <Text style={[styles.bmiRangeText, { color: '#00D494', fontWeight: '700' }]}>
                Normal 18.5–25
              </Text>
              <Text style={styles.bmiRangeText}>Over 25–30</Text>
              <Text style={styles.bmiRangeText}>Obese &gt;30</Text>
            </View>
          </View>

          {/* Quick Specs 3-Pill Strip */}
          <View style={styles.specsRow}>
            <View style={styles.specPill}>
              <Text style={styles.specLabel}>WEIGHT</Text>
              <Text style={styles.specValue}>{weight}</Text>
            </View>

            <View style={styles.specDivider} />

            <View style={styles.specPill}>
              <Text style={styles.specLabel}>HEIGHT</Text>
              <Text style={styles.specValue}>{height}</Text>
            </View>

            <View style={styles.specDivider} />

            <View style={styles.specPill}>
              <Text style={styles.specLabel}>LIMIT RATING</Text>
              <Text style={styles.specValue}>
                {user?.limitRating ? `${user.limitRating}/10` : '4/10'}
              </Text>
            </View>
          </View>
        </View>

        {/* Section 1: Activity Goals */}
        <Text style={styles.sectionHeading}>Activity Goals</Text>
        <View style={styles.twoColRow}>
          <TouchableOpacity activeOpacity={0.8} style={styles.metricCard}>
            <View style={styles.metricTopRow}>
              <View style={[styles.metricIconWrap, { backgroundColor: 'rgba(0, 229, 255, 0.12)' }]}>
                <Footprints size={14} color="#00E5FF" />
              </View>
              <ChevronDown size={16} color="#64748B" />
            </View>
            <Text style={styles.metricLabel}>Daily Steps</Text>
            <Text style={styles.metricValue}>{stepsGoal}</Text>
          </TouchableOpacity>

          <TouchableOpacity activeOpacity={0.8} style={styles.metricCard}>
            <View style={styles.metricTopRow}>
              <View style={[styles.metricIconWrap, { backgroundColor: 'rgba(255, 107, 74, 0.12)' }]}>
                <Flame size={14} color="#FF6B4A" />
              </View>
              <ChevronDown size={16} color="#64748B" />
            </View>
            <Text style={styles.metricLabel}>Active Burn Goal</Text>
            <Text style={styles.metricValue}>{calorieGoal}</Text>
          </TouchableOpacity>
        </View>

        {/* Section 2: Sleep & Recovery */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeading}>Sleep & Recovery</Text>
          <Switch
            value={bedtimeEnabled}
            onValueChange={setBedtimeEnabled}
            trackColor={{ false: '#334155', true: '#00D494' }}
            thumbColor={bedtimeEnabled ? '#FFFFFF' : '#94A3B8'}
          />
        </View>

        <View style={styles.twoColRow}>
          <TouchableOpacity activeOpacity={0.8} style={styles.metricCard}>
            <View style={styles.metricTopRow}>
              <View style={[styles.metricIconWrap, { backgroundColor: 'rgba(168, 85, 247, 0.12)' }]}>
                <Moon size={14} color="#C084FC" />
              </View>
              <ChevronDown size={16} color="#64748B" />
            </View>
            <Text style={styles.metricLabel}>Target Bedtime</Text>
            <Text style={styles.metricValue}>{getInBedTime}</Text>
          </TouchableOpacity>

          <TouchableOpacity activeOpacity={0.8} style={styles.metricCard}>
            <View style={styles.metricTopRow}>
              <View style={[styles.metricIconWrap, { backgroundColor: 'rgba(245, 158, 11, 0.12)' }]}>
                <Sun size={14} color="#F59E0B" />
              </View>
              <ChevronDown size={16} color="#64748B" />
            </View>
            <Text style={styles.metricLabel}>Target Wake-up</Text>
            <Text style={styles.metricValue}>{wakeUpTime}</Text>
          </TouchableOpacity>
        </View>

        {/* Section 3: Personal Profile Specs */}
        <Text style={[styles.sectionHeading, { marginTop: 24 }]}>Personal Details</Text>
        <View style={styles.twoColRow}>
          <View style={styles.metricCard}>
            <View style={styles.metricTopRow}>
              <View style={[styles.metricIconWrap, { backgroundColor: 'rgba(0, 212, 148, 0.12)' }]}>
                <User size={14} color="#00D494" />
              </View>
            </View>
            <Text style={styles.metricLabel}>Gender</Text>
            <Text style={styles.metricValue}>{gender}</Text>
          </View>

          <View style={styles.metricCard}>
            <View style={styles.metricTopRow}>
              <View style={[styles.metricIconWrap, { backgroundColor: 'rgba(0, 229, 255, 0.12)' }]}>
                <Heart size={14} color="#00E5FF" />
              </View>
            </View>
            <Text style={styles.metricLabel}>Athletic Limit</Text>
            <Text style={styles.metricValue}>
              {user?.limitRating ? `${user.limitRating}/10` : '4/10'}
            </Text>
          </View>
        </View>

        {/* Premium Destructive Sign Out Button */}
        <TouchableOpacity
          style={styles.signOutBtn}
          activeOpacity={0.85}
          onPress={handleSignOutPrompt}
        >
          <View style={styles.signOutIconWrap}>
            <LogOut size={16} color="#FF5757" />
          </View>
          <Text style={styles.signOutText}>Sign Out of ROVR</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0F',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 56 : 46,
    paddingBottom: 14,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarHeaderCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#1E293B',
    borderWidth: 1.5,
    borderColor: 'rgba(0, 229, 255, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarHeaderText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#00E5FF',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },

  // Hero Card
  heroCard: {
    backgroundColor: 'rgba(20, 22, 34, 0.75)',
    borderRadius: 22,
    padding: 18,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderTopColor: 'rgba(255, 255, 255, 0.16)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 6,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarGlowCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 229, 255, 0.12)',
    borderWidth: 2,
    borderColor: '#00E5FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    shadowColor: '#00E5FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
  },
  avatarGlowText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#00E5FF',
  },
  userMeta: {
    flex: 1,
  },
  userNameText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  userEmailText: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  athleteBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 229, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.25)',
  },
  athleteBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#00E5FF',
    letterSpacing: 0.8,
  },

  // BMI Hero Box
  bmiHeroBox: {
    backgroundColor: 'rgba(12, 14, 22, 0.7)',
    borderRadius: 16,
    padding: 14,
    marginTop: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  bmiTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bmiTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  bmiTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
  },
  bmiStatusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  bmiStatusText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  bmiValRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginTop: 8,
    marginBottom: 10,
  },
  bmiBigVal: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -1,
  },
  bmiUnit: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  bmiMeterTrack: {
    flexDirection: 'row',
    height: 5,
    borderRadius: 3,
    overflow: 'hidden',
    gap: 3,
    marginBottom: 6,
  },
  bmiMeterSeg: {
    flex: 1,
    borderRadius: 2,
  },
  bmiRangeLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  bmiRangeText: {
    fontSize: 9,
    color: '#64748B',
    fontWeight: '600',
  },

  // Specs 3-Pill Strip
  specsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(12, 14, 22, 0.5)',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginTop: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  specPill: {
    flex: 1,
    alignItems: 'center',
  },
  specLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  specValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 2,
  },
  specDivider: {
    width: 1,
    height: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },

  // Headings
  sectionHeading: {
    fontSize: 13,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 22,
    marginBottom: 12,
  },
  twoColRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },

  // Metric Cards
  metricCard: {
    flex: 1,
    backgroundColor: 'rgba(20, 22, 34, 0.75)',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    borderTopColor: 'rgba(255, 255, 255, 0.12)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 3,
  },
  metricTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  metricIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    marginBottom: 3,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },

  // Sign out
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 28,
    marginBottom: 24,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 18,
    backgroundColor: 'rgba(20, 22, 34, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(255, 87, 87, 0.22)',
    borderTopColor: 'rgba(255, 87, 87, 0.35)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 3,
  },
  signOutIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 87, 87, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  signOutText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FF5757',
    letterSpacing: 0.3,
  },
});
