import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Platform,
  StatusBar,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, ChevronRight } from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';
import * as Haptics from 'expo-haptics';

const SECTIONS = [
  {
    title: 'ACCOUNT',
    items: ['Edit Profile', 'Personal Information', 'Connected Accounts'],
  },
  {
    title: 'PREFERENCES',
    items: ['Notifications', 'Units', 'Theme', 'Privacy'],
  },
  {
    title: 'FITNESS',
    items: ['Goals', 'Hydration', 'Activity Preferences'],
  },
  {
    title: 'SUPPORT',
    items: ['Help Center', 'Report a Problem', 'About ROVR'],
  },
];

export default function SettingsScreen() {
  const router = useRouter();
  const { signOut } = useAuth();

  const handleSignOut = () => {
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch {}
    Alert.alert('Sign Out', 'Are you sure you want to sign out of ROVR?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/(auth)/sign-in' as any);
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent />
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.circleBtn}
            onPress={() => router.push('/(main)/profile' as any)}
          >
            <ArrowLeft size={16} color="rgba(255, 255, 255, 0.45)" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Settings</Text>
          <View style={{ width: 38 }} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {SECTIONS.map((sec) => (
            <View key={sec.title} style={styles.sectionWrap}>
              <Text style={styles.sectionTitle}>{sec.title}</Text>
              <View style={styles.sectionCard}>
                {sec.items.map((item, i) => (
                  <View key={item}>
                    <TouchableOpacity style={styles.rowItem} activeOpacity={0.7}>
                      <Text style={styles.itemText}>{item}</Text>
                      <ChevronRight
                        size={16}
                        color="rgba(255, 255, 255, 0.35)"
                      />
                    </TouchableOpacity>
                    {i < sec.items.length - 1 && <View style={styles.divider} />}
                  </View>
                ))}
              </View>
            </View>
          ))}

          {/* Sign Out Button */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleSignOut}
            style={styles.signOutBtn}
          >
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 40,
  },
  sectionWrap: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.4)',
    letterSpacing: 1,
    marginBottom: 8,
  },
  sectionCard: {
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    overflow: 'hidden',
  },
  rowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  itemText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#F7F8F9',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginLeft: 18,
  },
  signOutBtn: {
    backgroundColor: 'rgba(220, 38, 38, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(220, 38, 38, 0.16)',
    borderRadius: 20,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  signOutText: {
    color: '#F87171',
    fontSize: 15,
    fontWeight: '800',
  },
});
