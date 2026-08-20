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
} from 'react-native';
import { useRouter } from 'expo-router';
import { Settings, ChevronDown, LogOut, User, Activity } from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();

  const [stepsGoal, setStepsGoal] = useState('6,000');
  const [calorieGoal, setCalorieGoal] = useState('450 kcal');
  const [bedtimeEnabled, setBedtimeEnabled] = useState(true);
  const [getInBedTime, setGetInBedTime] = useState('11:00 pm');
  const [wakeUpTime, setWakeUpTime] = useState('7:00 am');

  const gender = user?.gender ? (user.gender.charAt(0).toUpperCase() + user.gender.slice(1)) : 'Not set';
  const weight = user?.weight ? `${user.weight} kg` : 'Not set';
  const height = user?.height ? `${user.height} cm` : 'Not set';
  const bmi = user?.bmi ? user.bmi.toFixed(1) : (user?.weight && user?.height ? ((user.weight / ((user.height / 100) ** 2)).toFixed(1)) : '22.0');

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>

        <View style={styles.headerRight}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>
              {user?.name ? user.name[0].toUpperCase() : 'A'}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* User Greeting Card */}
        <View style={styles.userCard}>
          <View style={styles.userAvatarWrap}>
            <User size={24} color="#00E5FF" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.userNameText}>{user?.name || 'ROVR Athlete'}</Text>
            <Text style={styles.userEmailText}>{user?.email || 'Active User'}</Text>
          </View>
          <View style={styles.bmiBadge}>
            <Text style={styles.bmiText}>BMI {bmi}</Text>
          </View>
        </View>

        {/* Section 1: Activity goals (Steps & Active Burn) */}
        <Text style={styles.sectionHeading}>Activity Goals</Text>
        <View style={styles.twoColRow}>
          {/* Daily Steps */}
          <TouchableOpacity activeOpacity={0.8} style={styles.outlinedFieldBox}>
            <Text style={styles.fieldFloatingLabel}>Daily Steps</Text>
            <View style={styles.fieldContentRow}>
              <Text style={styles.fieldValueText}>{stepsGoal}</Text>
              <ChevronDown size={18} color="#94A3B8" />
            </View>
          </TouchableOpacity>

          {/* Calorie Goal */}
          <TouchableOpacity activeOpacity={0.8} style={styles.outlinedFieldBox}>
            <Text style={styles.fieldFloatingLabel}>Active Burn Goal</Text>
            <View style={styles.fieldContentRow}>
              <Text style={styles.fieldValueText}>{calorieGoal}</Text>
              <ChevronDown size={18} color="#94A3B8" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Section 2: Bedtime schedule */}
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
          {/* Get in bed */}
          <TouchableOpacity activeOpacity={0.8} style={styles.outlinedFieldBox}>
            <Text style={styles.fieldFloatingLabel}>Target Bedtime</Text>
            <View style={styles.fieldContentRow}>
              <Text style={styles.fieldValueText}>{getInBedTime}</Text>
              <ChevronDown size={18} color="#94A3B8" />
            </View>
          </TouchableOpacity>

          {/* Wake up */}
          <TouchableOpacity activeOpacity={0.8} style={styles.outlinedFieldBox}>
            <Text style={styles.fieldFloatingLabel}>Target Wake-up</Text>
            <View style={styles.fieldContentRow}>
              <Text style={styles.fieldValueText}>{wakeUpTime}</Text>
              <ChevronDown size={18} color="#94A3B8" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Section 3: About you (Real Onboarding Data) */}
        <Text style={[styles.sectionHeading, { marginTop: 24 }]}>About You</Text>
        <View style={styles.twoColRow}>
          {/* Gender */}
          <View style={styles.outlinedFieldBox}>
            <Text style={styles.fieldFloatingLabel}>Gender</Text>
            <View style={styles.fieldContentRow}>
              <Text style={styles.fieldValueText}>{gender}</Text>
            </View>
          </View>

          {/* Limit Rating */}
          <View style={styles.outlinedFieldBox}>
            <Text style={styles.fieldFloatingLabel}>Limit Rating</Text>
            <View style={styles.fieldContentRow}>
              <Text style={styles.fieldValueText}>{user?.limitRating ? `${user.limitRating}/10` : '4/10'}</Text>
            </View>
          </View>
        </View>

        <View style={[styles.twoColRow, { marginTop: 12 }]}>
          {/* Weight */}
          <View style={styles.outlinedFieldBox}>
            <Text style={styles.fieldFloatingLabel}>Weight</Text>
            <View style={styles.fieldContentRow}>
              <Text style={styles.fieldValueText}>{weight}</Text>
            </View>
          </View>

          {/* Height */}
          <View style={styles.outlinedFieldBox}>
            <Text style={styles.fieldFloatingLabel}>Height</Text>
            <View style={styles.fieldContentRow}>
              <Text style={styles.fieldValueText}>{height}</Text>
            </View>
          </View>
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity
          style={styles.signOutBtn}
          onPress={() => signOut()}
        >
          <LogOut size={16} color="#EF4444" />
          <Text style={styles.signOutText}>Sign Out of ROVR</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#101014',
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
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#181820',
    borderRadius: 18,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  userAvatarWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 229, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  userNameText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  userEmailText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  bmiBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 212, 148, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 148, 0.3)',
  },
  bmiText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#00D494',
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 12,
  },
  twoColRow: {
    flexDirection: 'row',
    gap: 12,
  },

  // Outlined Field Box
  outlinedFieldBox: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#101014',
    borderWidth: 1.5,
    borderColor: '#38384A',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingTop: 16,
    paddingBottom: 12,
  },
  fieldFloatingLabel: {
    position: 'absolute',
    top: -9,
    left: 12,
    backgroundColor: '#101014',
    paddingHorizontal: 6,
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
  },
  fieldContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fieldValueText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Sign out
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 36,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  signOutText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#EF4444',
  },
});
