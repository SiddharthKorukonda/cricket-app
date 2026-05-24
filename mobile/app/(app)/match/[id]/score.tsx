import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useFocusEffect, useRouter } from 'expo-router';
import { api, Match, Innings, MatchPlayer, Ball } from '../../../../src/api/client';
import { colors } from '../../../../src/theme/colors';
import { WagonWheelModal } from '../../../../src/components/WagonWheelModal';
import { playerDisplayName, formatOvers } from '../../../../src/utils/helpers';

interface LiveState {
  strikerId: string;
  nonStrikerId: string;
  bowlerId: string;
  currentOver: number;
  currentBall: number;
}

interface ScoringState {
  match: Match;
  innings: Innings;
  liveState: LiveState;
  battingTeam: { name: string; players: MatchPlayer[] };
  bowlingTeam: { name: string; players: MatchPlayer[] };
}

export default function ScoreScreen() {
  const { id: matchId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [state, setState] = useState<ScoringState | null>(null);
  const [wagonVisible, setWagonVisible] = useState(false);
  const [pendingRuns, setPendingRuns] = useState<number>(0);

  const load = async () => {
    try {
      const data = await api.get<ScoringState>(`/scoring/${matchId}/state`);
      setState(data);
      if (data.match.status === 'completed') {
        router.replace(`/(app)/match/${matchId}/summary`);
      }
    } catch {
      /* ignore */
    }
  };

  useFocusEffect(useCallback(() => { load(); }, [matchId]));

  const getPlayer = (id: string) =>
    [...(state?.battingTeam?.players || []), ...(state?.bowlingTeam?.players || [])].find((p) => p.id === id);

  const recordBall = async (
    payload: Record<string, unknown>,
    wagon?: { shotType: string; distance: number; zone: string; angle: number; x: number; y: number }
  ) => {
    await api.post(`/scoring/${matchId}/ball`, {
      autoRotateStrike: true,
      ...payload,
      ...(wagon && {
        shotType: wagon.shotType,
        shotDistance: wagon.distance,
        shotZone: wagon.zone,
        shotAngle: wagon.angle,
        shotX: wagon.x,
        shotY: wagon.y,
      }),
    });
    setWagonVisible(false);
    await load();
  };

  const onRunPress = (runs: number) => {
    setPendingRuns(runs);
    setWagonVisible(true);
  };

  const onWagonConfirm = (wagon: {
    shotType: string;
    distance: number;
    zone: string;
    angle: number;
    x: number;
    y: number;
  }) => {
    recordBall({ type: 'runs', runs: pendingRuns }, wagon);
  };

  const onDot = () => recordBall({ type: 'runs', runs: 0 });
  const onExtra = (extrasType: string, extrasRuns = 1) =>
    recordBall({ type: 'extra', extrasType, extrasRuns, runs: 0 });
  const onWicket = () => {
    Alert.alert('Wicket', 'Record wicket?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Out',
        onPress: () =>
          recordBall({
            type: 'wicket',
            runs: 0,
            dismissedId: state?.liveState.strikerId,
            wicketType: 'bowled',
          }),
      },
    ]);
  };

  if (!state) {
    return (
      <View style={styles.loading}>
        <Text style={styles.loadingText}>Loading match...</Text>
      </View>
    );
  }

  const { match, innings, liveState, battingTeam, bowlingTeam } = state;
  const striker = getPlayer(liveState.strikerId);
  const nonStriker = getPlayer(liveState.nonStrikerId);
  const bowler = getPlayer(liveState.bowlerId);

  const currentOverBalls = (innings.balls || []).filter((b: Ball) => b.overNumber === liveState.currentOver);
  const crr =
    innings.totalOvers > 0
      ? ((innings.totalRuns / (Math.floor(innings.totalOvers) + (innings.totalOvers % 1) * 10 / 6)) * 6).toFixed(2)
      : '0.00';

  const batterStats = (p: MatchPlayer | undefined) => {
    if (!p) return '0(0) 0×4 0×6 SR 0.0';
    const faced = (innings.balls || []).filter((b) => b.batsmanId === p.id);
    const runs = faced.reduce((s, b) => s + b.runsOffBat, 0);
    const balls = faced.filter((b) => b.isLegalDelivery).length;
    const fours = faced.filter((b) => b.runsOffBat === 4).length;
    const sixes = faced.filter((b) => b.runsOffBat === 6).length;
    const sr = balls > 0 ? ((runs / balls) * 100).toFixed(1) : '0.0';
    return `${runs}(${balls}) ${fours}×4 ${sixes}×6 SR ${sr}`;
  };

  const bowlerStats = () => {
    if (!bowler) return '0.0-0-0-0 Econ 0.00';
    const bowled = (innings.balls || []).filter((b) => b.bowlerId === bowler.id);
    const runs = bowled.reduce((s, b) => s + b.runsOffBat + b.extrasRuns, 0);
    const wkts = bowled.filter((b) => b.isWicket).length;
    const legal = bowled.filter((b) => b.isLegalDelivery).length;
    const overs = Math.floor(legal / 6) + (legal % 6) / 10;
    const econ = legal > 0 ? ((runs / legal) * 6).toFixed(2) : '0.00';
    return `${formatOvers(overs)}-${0}-${runs}-${wkts} Econ ${econ}`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.matchTitle}>{match.title.toUpperCase()}</Text>
        <View style={styles.scoreHeader}>
          <View>
            <Text style={styles.bigScore}>
              {innings.totalRuns}/{innings.totalWickets}
            </Text>
            <Text style={styles.oversLine}>Overs: {formatOvers(innings.totalOvers)}</Text>
          </View>
          <Text style={styles.crr}>CRR: {crr}</Text>
        </View>
      </View>

      <ScrollView style={styles.body}>
        <View style={styles.playerStats}>
          <View style={styles.batterRow}>
            <View style={styles.strikeIndicator} />
            <Text style={styles.batterName}>{playerDisplayName(striker!)}</Text>
            <Text style={styles.batterFigures}>{batterStats(striker)}</Text>
          </View>
          <View style={styles.batterRow}>
            <Text style={styles.batterName}>{playerDisplayName(nonStriker!)}</Text>
            <Text style={styles.batterFigures}>{batterStats(nonStriker)}</Text>
          </View>
          <Text style={styles.bowlerLine}>
            {playerDisplayName(bowler!)} · {bowlerStats()}
          </Text>
        </View>

        <View style={styles.overRow}>
          <Text style={styles.overLabel}>This over:</Text>
          <View style={styles.overBalls}>
            {currentOverBalls.map((b, i) => (
              <Text key={i} style={styles.overBall}>
                {b.isWicket ? 'W' : b.runsOffBat + b.extrasRuns || '·'}
              </Text>
            ))}
          </View>
          <TouchableOpacity onPress={() => api.post(`/scoring/${matchId}/undo`, {}).then(load)}>
            <Text style={styles.undo}>↩ Undo</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.section}>RUNS OFF BAT</Text>
        <View style={styles.runGrid}>
          <TouchableOpacity style={styles.runBtn} onPress={onDot}>
            <Text style={styles.runText}>·</Text>
          </TouchableOpacity>
          {[1, 2, 3, 4, 5, 6].map((r) => (
            <TouchableOpacity
              key={r}
              style={[styles.runBtn, (r === 4 || r === 6) && styles.runBtnBoundary]}
              onPress={() => onRunPress(r)}
            >
              <Text style={[styles.runText, (r === 4 || r === 6) && styles.runTextBoundary]}>{r}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.section}>EXTRAS</Text>
        <View style={styles.extraGrid}>
          <TouchableOpacity style={styles.extraBtn} onPress={() => onExtra('wide')}>
            <Text style={[styles.extraText, { color: colors.orange }]}>W Wide</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.extraBtn} onPress={() => onExtra('noball')}>
            <Text style={[styles.extraText, { color: colors.red }]}>NB No Ball</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.extraBtn} onPress={() => onExtra('legbye', 1)}>
            <Text style={[styles.extraText, { color: colors.purple }]}>LB Leg Bye</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.extraBtn} onPress={() => onExtra('bye', 1)}>
            <Text style={[styles.extraText, { color: colors.blue }]}>B Bye</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.extraBtn} onPress={() => onExtra('penalty', 5)}>
            <Text style={[styles.extraText, { color: colors.red }]}>+5 Penalty</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.section}>MATCH EVENTS</Text>
        <View style={styles.eventGrid}>
          <TouchableOpacity style={styles.wicketBtn} onPress={onWicket}>
            <Text style={styles.wicketText}>W Wicket</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.eventBtn}
            onPress={() => api.post(`/scoring/${matchId}/end-over`, { bowlerId: liveState.bowlerId }).then(load)}
          >
            <Text style={styles.eventText}>End Over</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.extrasSummary}>
          Extras: Wd {innings.extrasWide} NB {innings.extrasNoBall} LB {innings.extrasLegBye} B {innings.extrasBye}{' '}
          Pen {innings.extrasPenalty}
        </Text>
      </ScrollView>

      <Modal visible={wagonVisible} animationType="slide">
        <WagonWheelModal
          batterName={playerDisplayName(striker!)}
          onConfirm={onWagonConfirm}
          onCancel={() => setWagonVisible(false)}
        />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  loadingText: { color: colors.textMuted },
  header: { backgroundColor: colors.header, paddingTop: 56, paddingBottom: 16, paddingHorizontal: 16 },
  matchTitle: { color: colors.textMuted, fontSize: 11, letterSpacing: 1, marginBottom: 8 },
  scoreHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  bigScore: { color: colors.text, fontSize: 36, fontWeight: '700' },
  oversLine: { color: colors.textMuted, fontSize: 13 },
  crr: { color: colors.textMuted, fontSize: 14 },
  body: { flex: 1, padding: 12 },
  playerStats: {
    backgroundColor: colors.bgCard,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  batterRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  strikeIndicator: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.green, marginRight: 8 },
  batterName: { color: colors.text, fontWeight: '600', flex: 1 },
  batterFigures: { color: colors.textMuted, fontSize: 12 },
  bowlerLine: { color: colors.textMuted, fontSize: 12, marginTop: 4 },
  overRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  overLabel: { color: colors.textMuted, fontSize: 12, marginRight: 8 },
  overBalls: { flex: 1, flexDirection: 'row', flexWrap: 'wrap' },
  overBall: { color: colors.text, marginRight: 6, fontWeight: '600' },
  undo: { color: colors.greenLight, fontSize: 13 },
  section: { color: colors.textMuted, fontSize: 11, letterSpacing: 1, marginBottom: 8, marginTop: 8 },
  runGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  runBtn: {
    width: '30%',
    backgroundColor: colors.bgCard,
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  runBtnBoundary: { borderColor: colors.green },
  runText: { color: colors.text, fontSize: 20, fontWeight: '700' },
  runTextBoundary: { color: colors.greenLight },
  extraGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  extraBtn: {
    width: '47%',
    backgroundColor: colors.bgCard,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  extraText: { fontWeight: '600' },
  eventGrid: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  wicketBtn: {
    flex: 1,
    backgroundColor: 'rgba(231,76,60,0.2)',
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.red,
  },
  wicketText: { color: colors.red, fontWeight: '700', fontSize: 16 },
  eventBtn: {
    flex: 1,
    backgroundColor: colors.bgCard,
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  eventText: { color: colors.text },
  extrasSummary: { color: colors.textDim, fontSize: 11, textAlign: 'center', marginBottom: 24 },
});
