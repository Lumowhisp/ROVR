import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  SafeAreaView,
  StatusBar,
  Modal,
  ScrollView,
  Platform,
} from 'react-native';
import { Settings, Play, Pause, Square, Map as MapIcon } from 'lucide-react-native';
import { MapType } from 'react-native-maps';
import { ActivityMapView } from '@/components/map/ActivityMapView';
import { useWorkoutTracker, ActivityMode } from '@/hooks/useWorkoutTracker';

const ACTIVITY_MODES: ActivityMode[] = ['Cycling', 'Running', 'Walking', 'Hiking'];
const MAP_TYPES: MapType[] = ['standard', 'satellite', 'terrain', 'hybrid'];

export default function ActivityScreen() {
  const {
    mode,
    setMode,
    status,
    formattedTime,
    distanceKm,
    formattedPace,
    caloriesBurned,
    currentLocation,
    routeCoordinates,
    startWorkout,
    pauseWorkout,
    resumeWorkout,
    stopWorkout,
    resetWorkout,
  } = useWorkoutTracker('Cycling');

  const [settingsVisible, setSettingsVisible] = useState(false);
  const [mapType, setMapType] = useState<MapType>('standard');
  const [isDarkMode, setIsDarkMode] = useState(true);

  const handleModeChange = (newMode: ActivityMode) => {
    if (status === 'idle') {
      setMode(newMode);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0F" />
      <View style={styles.container}>
        {/* Top Header */}
        <View style={styles.header}>
          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle}>{mode}</Text>
          </View>
          <Pressable
            style={({ pressed }) => [styles.settingsBtn, pressed && styles.btnPressed]}
            onPress={() => setSettingsVisible(true)}
            accessibilityLabel="Settings"
          >
            <Settings size={22} color="#FFFFFF" />
          </Pressable>
        </View>

        {/* Activity Mode Selector Pills */}
        <View style={styles.modeSelectorWrap}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.modeSelectorScroll}
          >
            {ACTIVITY_MODES.map((m) => {
              const selected = mode === m;
              return (
                <Pressable
                  key={m}
                  disabled={status !== 'idle'}
                  style={[
                    styles.modeChip,
                    selected && styles.modeChipSelected,
                    status !== 'idle' && !selected && styles.modeChipDisabled,
                  ]}
                  onPress={() => handleModeChange(m)}
                >
                  <Text style={[styles.modeChipText, selected && styles.modeChipTextSelected]}>
                    {m}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Map Container */}
        <View style={styles.mapContainer}>
          <ActivityMapView
            currentLocation={currentLocation}
            routeCoordinates={routeCoordinates}
            isTracking={status === 'active'}
            mapType={mapType}
            isDarkMode={isDarkMode}
          />
        </View>

        {/* Primary Metrics Card */}
        <View style={styles.metricsContainer}>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Distance</Text>
            <Text style={styles.metricValue}>
              {distanceKm.toFixed(2)}{' '}
              <Text style={styles.metricUnit}>km</Text>
            </Text>
          </View>

          <View style={styles.metricDivider} />

          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Time</Text>
            <Text style={styles.metricValue}>{formattedTime}</Text>
          </View>
        </View>

        {/* Secondary Metrics Row */}
        <View style={styles.secondaryMetricsRow}>
          <View style={styles.subMetricBox}>
            <Text style={styles.subMetricLabel}>Avg Pace</Text>
            <Text style={styles.subMetricVal}>{formattedPace}</Text>
          </View>
          <View style={styles.subMetricBox}>
            <Text style={styles.subMetricLabel}>Est. Calories</Text>
            <Text style={styles.subMetricVal}>{caloriesBurned} <Text style={styles.subMetricUnit}>kcal</Text></Text>
          </View>
        </View>

        {/* Workout Control Button */}
        <View style={styles.controlsWrap}>
          {status === 'idle' && (
            <Pressable
              style={({ pressed }) => [styles.actionButton, styles.startBtn, pressed && styles.btnPressed]}
              onPress={startWorkout}
            >
              <Play size={20} color="#FFFFFF" fill="#FFFFFF" style={styles.btnIcon} />
              <Text style={styles.startBtnText}>START WORKOUT</Text>
            </Pressable>
          )}

          {status === 'active' && (
            <Pressable
              style={({ pressed }) => [styles.actionButton, styles.pauseBtn, pressed && styles.btnPressed]}
              onPress={pauseWorkout}
            >
              <Pause size={20} color="#FFFFFF" fill="#FFFFFF" style={styles.btnIcon} />
              <Text style={styles.actionBtnText}>PAUSE WORKOUT</Text>
            </Pressable>
          )}

          {status === 'paused' && (
            <View style={styles.pausedControlsRow}>
              <Pressable
                style={({ pressed }) => [styles.actionButton, styles.resumeBtn, pressed && styles.btnPressed]}
                onPress={resumeWorkout}
              >
                <Play size={18} color="#FFFFFF" fill="#FFFFFF" style={styles.btnIcon} />
                <Text style={styles.actionBtnText}>RESUME</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [styles.actionButton, styles.stopBtn, pressed && styles.btnPressed]}
                onPress={stopWorkout}
              >
                <Square size={18} color="#FFFFFF" fill="#FFFFFF" style={styles.btnIcon} />
                <Text style={styles.actionBtnText}>FINISH</Text>
              </Pressable>
            </View>
          )}

          {status === 'finished' && (
            <Pressable
              style={({ pressed }) => [styles.actionButton, styles.resetBtn, pressed && styles.btnPressed]}
              onPress={resetWorkout}
            >
              <Text style={styles.startBtnText}>NEW WORKOUT</Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* Settings Modal */}
      <Modal
        visible={settingsVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSettingsVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Map Settings</Text>
              <Pressable onPress={() => setSettingsVisible(false)}>
                <Text style={styles.modalCloseText}>Done</Text>
              </Pressable>
            </View>

            <Text style={styles.sectionHeading}>MAP TYPE</Text>
            <View style={styles.mapTypeGrid}>
              {MAP_TYPES.map((t) => (
                <Pressable
                  key={t}
                  style={[styles.mapTypeOption, mapType === t && styles.mapTypeSelected]}
                  onPress={() => setMapType(t)}
                >
                  <MapIcon size={18} color={mapType === t ? '#6C63FF' : '#A0A0B0'} />
                  <Text style={[styles.mapTypeText, mapType === t && styles.mapTypeTextSelected]}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.sectionHeading}>THEME</Text>
            <Pressable
              style={styles.settingRow}
              onPress={() => setIsDarkMode((prev) => !prev)}
            >
              <Text style={styles.settingRowLabel}>Dark Mode Map</Text>
              <Text style={styles.settingRowValue}>{isDarkMode ? 'Enabled' : 'Disabled'}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0A0A0F',
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 12 : 0,
    paddingBottom: 24,
    backgroundColor: '#0A0A0F',
  },
  header: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    position: 'relative',
  },
  headerTitleWrap: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  settingsBtn: {
    position: 'absolute',
    right: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnPressed: {
    opacity: 0.7,
  },
  modeSelectorWrap: {
    marginBottom: 12,
  },
  modeSelectorScroll: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  modeChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#161622',
    borderWidth: 1,
    borderColor: '#262638',
  },
  modeChipSelected: {
    backgroundColor: '#6C63FF',
    borderColor: '#6C63FF',
  },
  modeChipDisabled: {
    opacity: 0.4,
  },
  modeChipText: {
    color: '#A0A0B0',
    fontSize: 13,
    fontWeight: '600',
  },
  modeChipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  mapContainer: {
    flex: 1,
    minHeight: 280,
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1E1E2E',
  },
  metricsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#12121A',
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#1E1E2C',
    marginBottom: 12,
  },
  metricItem: {
    alignItems: 'center',
    flex: 1,
  },
  metricLabel: {
    fontSize: 12,
    color: '#8A8A9E',
    fontWeight: '500',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  metricUnit: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8A8A9E',
  },
  metricDivider: {
    width: 1,
    height: 36,
    backgroundColor: '#242436',
  },
  secondaryMetricsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  subMetricBox: {
    flex: 1,
    backgroundColor: '#12121A',
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#1E1E2C',
    alignItems: 'center',
  },
  subMetricLabel: {
    fontSize: 11,
    color: '#8A8A9E',
    fontWeight: '500',
    marginBottom: 2,
  },
  subMetricVal: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  subMetricUnit: {
    fontSize: 11,
    color: '#8A8A9E',
  },
  controlsWrap: {
    width: '100%',
  },
  actionButton: {
    height: 56,
    borderRadius: 28,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  startBtn: {
    backgroundColor: '#000000',
    borderWidth: 1,
    borderColor: '#333344',
  },
  startBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  btnIcon: {
    marginRight: 8,
  },
  pauseBtn: {
    backgroundColor: '#E53935',
  },
  pausedControlsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  resumeBtn: {
    flex: 1,
    backgroundColor: '#4CAF50',
  },
  stopBtn: {
    flex: 1,
    backgroundColor: '#E53935',
  },
  resetBtn: {
    backgroundColor: '#6C63FF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#161622',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    minHeight: 300,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  modalCloseText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6C63FF',
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8A8A9E',
    letterSpacing: 1,
    marginBottom: 12,
    marginTop: 8,
  },
  mapTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  mapTypeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#202030',
    borderWidth: 1,
    borderColor: '#2A2A40',
  },
  mapTypeSelected: {
    borderColor: '#6C63FF',
    backgroundColor: 'rgba(108, 99, 255, 0.15)',
  },
  mapTypeText: {
    fontSize: 13,
    color: '#A0A0B0',
    fontWeight: '600',
  },
  mapTypeTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#242436',
  },
  settingRowLabel: {
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  settingRowValue: {
    fontSize: 14,
    color: '#6C63FF',
    fontWeight: '700',
  },
});
