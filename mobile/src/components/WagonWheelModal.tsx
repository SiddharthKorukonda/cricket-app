import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  GestureResponderEvent,
} from 'react-native';
import Svg, { Circle, Line, Rect, G } from 'react-native-svg';
import { colors, SHOT_TYPES, SHOT_COLORS } from '../theme/colors';
import {
  getZoneFromAngle,
  getDistanceFromTap,
  getAngleFromTap,
  formatAngleLabel,
} from '../utils/helpers';

const SIZE = Dimensions.get('window').width - 40;
const CENTER = SIZE / 2;
const MAX_R = CENTER - 20;

interface Props {
  batterName: string;
  onConfirm: (data: {
    shotType: string;
    distance: number;
    zone: string;
    angle: number;
    x: number;
    y: number;
  }) => void;
  onCancel: () => void;
}

export function WagonWheelModal({ batterName, onConfirm, onCancel }: Props) {
  const [shotType, setShotType] = useState('Drive');
  const [tap, setTap] = useState<{ x: number; y: number } | null>(null);
  const [metrics, setMetrics] = useState({ distance: 0, zone: '', angle: 0 });

  const handleTap = (e: GestureResponderEvent) => {
    const { locationX, locationY } = e.nativeEvent;
    const dx = locationX - CENTER;
    const dy = locationY - CENTER;
    if (Math.sqrt(dx * dx + dy * dy) > MAX_R) return;

    setTap({ x: locationX, y: locationY });
    const distance = getDistanceFromTap(locationX, locationY, CENTER, CENTER, MAX_R);
    const angle = getAngleFromTap(locationX, locationY, CENTER, CENTER);
    const zone = getZoneFromAngle(angle);
    setMetrics({ distance, zone, angle });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.batter}>
          Batter: <Text style={styles.batterName}>{batterName}</Text>
        </Text>
        <TouchableOpacity onPress={onCancel}>
          <Text style={styles.cancel}>Cancel</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.shotRow}>
        {SHOT_TYPES.map((s) => (
          <TouchableOpacity
            key={s}
            style={[styles.shotChip, shotType === s && styles.shotChipActive]}
            onPress={() => setShotType(s)}
          >
            <View style={[styles.shotDot, { backgroundColor: SHOT_COLORS[s] }]} />
            <Text style={styles.shotText}>{s}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View
        style={styles.wheelWrap}
        onStartShouldSetResponder={() => true}
        onResponderRelease={handleTap}
      >
        <Svg width={SIZE} height={SIZE}>
          <Circle cx={CENTER} cy={CENTER} r={MAX_R} fill="#1a3d2a" stroke={colors.border} />
          {[0.25, 0.5, 0.75, 1].map((r, i) => (
            <Circle
              key={r}
              cx={CENTER}
              cy={CENTER}
              r={MAX_R * r}
              fill="none"
              stroke="rgba(255,255,255,0.15)"
              strokeWidth={1}
            />
          ))}
          {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
            const rad = (deg * Math.PI) / 180;
            return (
              <Line
                key={deg}
                x1={CENTER}
                y1={CENTER}
                x2={CENTER + MAX_R * Math.cos(rad)}
                y2={CENTER - MAX_R * Math.sin(rad)}
                stroke="rgba(255,255,255,0.1)"
                strokeWidth={1}
              />
            );
          })}
          <Rect
            x={CENTER - 4}
            y={CENTER - 14}
            width={8}
            height={28}
            fill="rgba(255,255,255,0.3)"
            rx={2}
          />
          <Circle cx={CENTER} cy={CENTER} r={3} fill="#FFD700" />
          {tap && <Circle cx={tap.x} cy={tap.y} r={6} fill={colors.green} />}
        </Svg>
      </View>

      <View style={styles.metrics}>
        <Text style={styles.metric}>
          Distance: <Text style={styles.metricVal}>{tap ? `${metrics.distance}m` : '—'}</Text>
        </Text>
        <Text style={styles.metric}>
          Zone: <Text style={styles.metricVal}>{tap ? metrics.zone : '—'}</Text>
        </Text>
        <Text style={styles.metric}>
          Angle: <Text style={styles.metricVal}>{tap ? formatAngleLabel(metrics.angle) : '—'}</Text>
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.confirmBtn, !tap && styles.confirmDisabled]}
        disabled={!tap}
        onPress={() =>
          tap &&
          onConfirm({
            shotType,
            distance: metrics.distance,
            zone: metrics.zone,
            angle: metrics.angle,
            x: tap.x / SIZE,
            y: tap.y / SIZE,
          })
        }
      >
        <Text style={styles.confirmText}>Confirm shot</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingTop: 56,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  batter: { color: colors.textMuted, fontSize: 14 },
  batterName: { color: colors.text, fontWeight: '700' },
  cancel: { color: colors.greenLight, fontSize: 14 },
  shotRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 },
  shotChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 6,
    marginBottom: 6,
  },
  shotChipActive: { borderColor: colors.green, backgroundColor: 'rgba(29,121,72,0.2)' },
  shotDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  shotText: { color: colors.text, fontSize: 12 },
  wheelWrap: { alignSelf: 'center', marginVertical: 8 },
  metrics: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  metric: { color: colors.textMuted, fontSize: 13 },
  metricVal: { color: colors.text, fontWeight: '600' },
  confirmBtn: {
    backgroundColor: colors.green,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  confirmDisabled: { opacity: 0.4 },
  confirmText: { color: colors.text, fontSize: 16, fontWeight: '700' },
});
