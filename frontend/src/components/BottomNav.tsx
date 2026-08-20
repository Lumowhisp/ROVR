import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Dimensions,
} from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { BlurView } from 'expo-blur';
import Svg, { Path, Polyline, Circle, Polygon } from 'react-native-svg';
import * as Haptics from 'expo-haptics';

export type NavTab = 'home' | 'activity' | 'workout' | 'progress' | 'profile';

interface BottomNavProps {
  active?: NavTab;
  navigate?: (tab: NavTab) => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

function HomeIcon({ active }: { active: boolean }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"
        stroke={active ? '#111214' : 'rgba(255,255,255,0.4)'}
        strokeWidth={active ? 2.2 : 1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M9 21V12h6v9"
        stroke={active ? '#111214' : 'rgba(255,255,255,0.4)'}
        strokeWidth={active ? 2.2 : 1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ActivityIcon({ active }: { active: boolean }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Polyline
        points="22 12 18 12 15 21 9 3 6 12 2 12"
        stroke={active ? '#111214' : 'rgba(255,255,255,0.4)'}
        strokeWidth={active ? 2.2 : 1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function WorkoutIcon({ active }: { active: boolean }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Circle
        cx="12"
        cy="12"
        r="9"
        stroke={active ? '#111214' : 'rgba(255,255,255,0.4)'}
        strokeWidth={active ? 2.2 : 1.75}
      />
      <Polygon
        points="10,8 16,12 10,16"
        fill={active ? '#111214' : 'rgba(255,255,255,0.4)'}
      />
    </Svg>
  );
}

function ProgressIcon({ active }: { active: boolean }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 3v18h18"
        stroke={active ? '#111214' : 'rgba(255,255,255,0.4)'}
        strokeWidth={active ? 2.2 : 1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M7 16l4-6 4 4 4-6"
        stroke={active ? '#111214' : 'rgba(255,255,255,0.4)'}
        strokeWidth={active ? 2.2 : 1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ProfileIcon({ active }: { active: boolean }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Circle
        cx="12"
        cy="8"
        r="4"
        stroke={active ? '#111214' : 'rgba(255,255,255,0.4)'}
        strokeWidth={active ? 2.2 : 1.75}
      />
      <Path
        d="M4 20c0-4 3.6-7 8-7s8 3 8 7"
        stroke={active ? '#111214' : 'rgba(255,255,255,0.4)'}
        strokeWidth={active ? 2.2 : 1.75}
        strokeLinecap="round"
      />
    </Svg>
  );
}

const TABS: { id: NavTab; label: string; route: string; Icon: React.ComponentType<{ active: boolean }> }[] = [
  { id: 'home', label: 'Home', route: '/(main)/home', Icon: HomeIcon },
  { id: 'activity', label: 'Activity', route: '/(main)/activity-feed', Icon: ActivityIcon },
  { id: 'workout', label: 'Workout', route: '/(tracker)/workout', Icon: WorkoutIcon },
  { id: 'progress', label: 'Progress', route: '/(main)/progress', Icon: ProgressIcon },
  { id: 'profile', label: 'Profile', route: '/(main)/profile', Icon: ProfileIcon },
];

export default function BottomNav({ active, navigate }: BottomNavProps) {
  const router = useRouter();
  const pathname = usePathname();

  // Determine current active tab if not explicitly supplied
  const currentActive =
    active ||
    (pathname.includes('activity')
      ? 'activity'
      : pathname.includes('workout') || pathname.includes('tracker')
      ? 'workout'
      : pathname.includes('progress')
      ? 'progress'
      : pathname.includes('profile') || pathname.includes('achievements') || pathname.includes('settings')
      ? 'profile'
      : 'home');

  const handlePress = (tab: typeof TABS[0]) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    if (navigate) {
      navigate(tab.id);
    } else {
      router.push(tab.route as any);
    }
  };

  return (
    <View style={styles.outerContainer} pointerEvents="box-none">
      <View style={styles.pillWrapper}>
        {Platform.OS !== 'android' ? (
          <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
        ) : null}

        <View style={styles.navInner}>
          {TABS.map((tab) => {
            const isActive = currentActive === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                activeOpacity={0.88}
                onPress={() => handlePress(tab)}
                style={[
                  styles.tabItem,
                  isActive ? styles.tabItemActive : styles.tabItemInactive,
                ]}
              >
                <tab.Icon active={isActive} />
                {isActive && (
                  <Text style={styles.tabLabel} numberOfLines={1}>
                    {tab.label}
                  </Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 24 : 16,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  pillWrapper: {
    width: Math.min(SCREEN_WIDTH - 36, 360),
    height: 64,
    borderRadius: 40,
    backgroundColor: 'rgba(30, 32, 36, 0.92)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 28,
    elevation: 10,
    padding: 6,
    justifyContent: 'center',
  },
  navInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 4,
  },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
  },
  tabItemActive: {
    backgroundColor: '#F7F8F9',
    borderRadius: 28,
    paddingHorizontal: 16,
    gap: 7,
    flexGrow: 1,
  },
  tabItemInactive: {
    width: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  tabLabel: {
    color: '#111214',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
});
