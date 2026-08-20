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
import { ArrowLeft, SlidersHorizontal, Heart, MessageSquare, Bookmark } from 'lucide-react-native';
import Svg, { Rect, Path, Circle } from 'react-native-svg';
import BottomNav from '@/components/BottomNav';
import * as Haptics from 'expo-haptics';

const POSTS = [
  {
    id: '1',
    avatar: 'SC',
    name: 'Sarah Chen',
    activity: 'Running',
    emoji: '🏃',
    ago: '2 hours ago',
    title: 'Morning Run',
    dist: '10.35km',
    duration: '52:12',
    pace: '7:20/km',
    elev: '+120m',
    likes: 25,
    comments: 10,
    mapColor: '#9BEA20',
  },
  {
    id: '2',
    avatar: 'MR',
    name: 'Mike Rodriguez',
    activity: 'Cycling',
    emoji: '🚴',
    ago: '5 hours ago',
    title: 'Evening Cycle',
    dist: '32.05km',
    duration: '1:22:00',
    pace: '23.4km/h',
    elev: '+245m',
    likes: 18,
    comments: 6,
    mapColor: '#55DE78',
  },
  {
    id: '3',
    avatar: 'PD',
    name: 'Priya Das',
    activity: 'Trail Hike',
    emoji: '🥾',
    ago: 'Yesterday',
    title: 'Weekend Trail',
    dist: '8.7km',
    duration: '2:10:00',
    pace: '14:55/km',
    elev: '+640m',
    likes: 41,
    comments: 12,
    mapColor: '#22D3EE',
  },
];

function FeedMapSvg({ color = '#9BEA20' }: { color?: string }) {
  return (
    <Svg width="100%" height="100%" viewBox="0 0 200 120">
      <Rect width="200" height="120" fill="#1A1E28" />
      {[18, 42, 66, 90].map((y) => (
        <Rect key={y} x="0" y={y} width="200" height="7" fill="#222736" />
      ))}
      {[30, 75, 120, 165].map((x) => (
        <Rect key={x} x={x} y="0" width="7" height="120" fill="#222736" />
      ))}
      {/* Route Path */}
      <Circle cx="40" cy="60" r="5" fill="none" stroke={color} strokeWidth="1.5" opacity={0.6} />
      <Circle cx="40" cy="60" r="2.5" fill={color} />
      <Path
        d="M 40 60 C 50 55 55 50 65 48 C 80 44 90 55 100 52 C 115 48 125 42 140 38"
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.9}
      />
      <Circle cx="140" cy="38" r="3.5" fill={color} />
    </Svg>
  );
}

export default function ActivityFeedScreen() {
  const router = useRouter();
  const [likesState, setLikesState] = useState<Record<string, { count: number; liked: boolean }>>({
    '1': { count: 25, liked: false },
    '2': { count: 18, liked: false },
    '3': { count: 41, liked: false },
  });

  const toggleLike = (id: string) => {
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
    setLikesState((prev) => {
      const current = prev[id] || { count: 0, liked: false };
      return {
        ...prev,
        [id]: {
          count: current.liked ? current.count - 1 : current.count + 1,
          liked: !current.liked,
        },
      };
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent />
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.circleBtn}
            onPress={() => router.push('/(main)/home' as any)}
          >
            <ArrowLeft size={16} color="rgba(255, 255, 255, 0.45)" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Activity Feed</Text>

          <TouchableOpacity
            style={styles.circleBtn}
            onPress={() => router.push('/(main)/activity-history' as any)}
          >
            <SlidersHorizontal size={16} color="rgba(255, 255, 255, 0.45)" />
          </TouchableOpacity>
        </View>

        {/* Feed Posts */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.postsList}>
            {POSTS.map((p) => {
              const likeInfo = likesState[p.id] || { count: p.likes, liked: false };
              return (
                <View key={p.id} style={styles.postCard}>
                  {/* Author Header */}
                  <View style={styles.authorRow}>
                    <View style={styles.authorAvatar}>
                      <Text style={styles.authorAvatarText}>{p.avatar}</Text>
                    </View>
                    <View style={styles.authorMeta}>
                      <Text style={styles.authorName}>{p.name}</Text>
                      <Text style={styles.authorSub}>
                        <Text style={{ color: '#9BEA20' }}>{p.emoji}</Text> {p.ago} · {p.activity}
                      </Text>
                    </View>
                  </View>

                  {/* Map + Metric Split */}
                  <View style={styles.mapMetricsRow}>
                    <View style={styles.mapWrapper}>
                      <FeedMapSvg color={p.mapColor} />
                    </View>

                    <View style={styles.metricsColumn}>
                      <View style={styles.metricItem}>
                        <Text style={styles.metricVal}>{p.dist}</Text>
                        <Text style={styles.metricLbl}>Distance</Text>
                      </View>
                      <View style={styles.metricItem}>
                        <Text style={styles.metricVal}>{p.duration}</Text>
                        <Text style={styles.metricLbl}>Duration</Text>
                      </View>
                      <View style={styles.metricItem}>
                        <Text style={styles.metricVal}>{p.pace}</Text>
                        <Text style={styles.metricLbl}>Pace</Text>
                      </View>
                    </View>
                  </View>

                  {/* Title & Elevation */}
                  <View style={styles.postInfo}>
                    <Text style={styles.postTitle}>{p.title}</Text>
                    <Text style={styles.postElevation}>Elevation: {p.elev}</Text>
                  </View>

                  {/* Actions Row */}
                  <View style={styles.actionsRow}>
                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={() => toggleLike(p.id)}
                    >
                      <Heart
                        size={16}
                        color={likeInfo.liked ? '#F87171' : 'rgba(255, 255, 255, 0.45)'}
                        fill={likeInfo.liked ? '#F87171' : 'none'}
                      />
                      <Text style={[styles.actionText, likeInfo.liked && { color: '#F87171' }]}>
                        {likeInfo.count}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionBtn}>
                      <MessageSquare size={16} color="rgba(255, 255, 255, 0.45)" />
                      <Text style={styles.actionText}>{p.comments}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.actionBtn, { marginLeft: 'auto' }]}>
                      <Bookmark size={16} color="rgba(255, 255, 255, 0.45)" />
                    </TouchableOpacity>
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
    fontSize: 17,
    fontWeight: '800',
    color: '#F7F8F9',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 110,
  },
  postsList: {
    gap: 14,
  },
  postCard: {
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    overflow: 'hidden',
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  authorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  authorAvatarText: {
    color: '#F7F8F9',
    fontSize: 13,
    fontWeight: '800',
  },
  authorMeta: {
    flex: 1,
  },
  authorName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#F7F8F9',
    marginBottom: 2,
  },
  authorSub: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.4)',
  },
  mapMetricsRow: {
    flexDirection: 'row',
    height: 120,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
  },
  mapWrapper: {
    flex: 1,
    overflow: 'hidden',
  },
  metricsColumn: {
    width: 104,
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(255, 255, 255, 0.07)',
    justifyContent: 'space-around',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  metricItem: {},
  metricVal: {
    fontSize: 14,
    fontWeight: '800',
    color: '#F7F8F9',
  },
  metricLbl: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.4)',
    marginTop: 1,
  },
  postInfo: {
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  postTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#F7F8F9',
    marginBottom: 2,
  },
  postElevation: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.4)',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    gap: 20,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.4)',
  },
});
