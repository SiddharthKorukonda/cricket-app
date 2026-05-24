import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  ScreenHeader,
  Input,
  PrimaryButton,
  Chip,
  ProgressBar,
  SectionLabel,
} from '../../../../src/components/UI';
import { api, Match } from '../../../../src/api/client';
import { colors } from '../../../../src/theme/colors';
import { playerDisplayName } from '../../../../src/utils/helpers';

export default function TossScreen() {
  const { matchId } = useLocalSearchParams<{ matchId: string }>();
  const router = useRouter();
  const [match, setMatch] = useState<Match | null>(null);
  const [coinResult, setCoinResult] = useState<'heads' | 'tails' | null>(null);
  const [flipping, setFlipping] = useState(false);
  const [tossWinner, setTossWinner] = useState<number>(0);
  const [elected, setElected] = useState<'bat' | 'bowl'>('bat');
  const [captain, setCaptain] = useState('');
  const spin = useState(new Animated.Value(0))[0];

  useEffect(() => {
    api.get<Match>(`/matches/${matchId}`).then(setMatch);
  }, [matchId]);

  const flipCoin = () => {
    setFlipping(true);
    const result = Math.random() < 0.5 ? 'heads' : 'tails';
    Animated.sequence([
      Animated.timing(spin, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(spin, { toValue: 0, duration: 0, useNativeDriver: true }),
    ]).start(() => {
      setCoinResult(result);
      setFlipping(false);
    });
  };

  const team0 = match?.teams?.find((t) => t.teamIndex === 0);
  const team1 = match?.teams?.find((t) => t.teamIndex === 1);
  const winnerName = tossWinner === 0 ? team0?.name : team1?.name;
  const electedLabel = elected === 'bat' ? 'bat first' : 'field first';

  const handleNext = async () => {
    await api.patch(`/matches/${matchId}/toss`, {
      tossWinnerTeam: tossWinner,
      tossElected: elected,
      tossCaptain: captain,
      coinResult,
    });
    router.push({
      pathname: '/(app)/match/new/playing-xi',
      params: { matchId, teamIndex: '0' },
    });
  };

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '720deg'] });

  return (
    <View style={styles.container}>
      <ScreenHeader label="STEP 2 OF 4" title="Toss" />
      <ProgressBar step={2} total={4} />
      <ScrollView style={styles.body}>
        <TouchableOpacity style={styles.coinWrap} onPress={flipCoin} disabled={flipping}>
          <Animated.View style={[styles.coin, { transform: [{ rotateY: rotate }] }]}>
            <Text style={styles.coinText}>{coinResult ? (coinResult === 'heads' ? 'H' : 'T') : '$'}</Text>
          </Animated.View>
          <Text style={styles.coinHint}>
            {flipping ? 'Flipping...' : coinResult ? `Result: ${coinResult}` : 'Tap coin to flip'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.question}>Who won the toss?</Text>
        <View style={styles.teamBtns}>
          <TouchableOpacity
            style={[styles.teamBtn, tossWinner === 0 && styles.teamBtnActive]}
            onPress={() => setTossWinner(0)}
          >
            <Text style={styles.teamBtnText}>{team0?.name || 'Team 1'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.teamBtn, tossWinner === 1 && styles.teamBtnActive]}
            onPress={() => setTossWinner(1)}
          >
            <Text style={styles.teamBtnText}>{team1?.name || 'Team 2'}</Text>
          </TouchableOpacity>
        </View>

        <SectionLabel title="ELECTED TO" />
        <View style={styles.chips}>
          <Chip label="Bat" selected={elected === 'bat'} onPress={() => setElected('bat')} />
          <Chip label="Bowl" selected={elected === 'bowl'} onPress={() => setElected('bowl')} />
        </View>

        <Input
          label="TOSS WINNER CAPTAIN"
          value={captain}
          onChangeText={setCaptain}
          placeholder="Captain name"
        />

        <View style={styles.summary}>
          <Text style={styles.summaryTitle}>Toss result</Text>
          <Text style={styles.summaryText}>
            {winnerName} won the toss and elected to {electedLabel}
          </Text>
        </View>

        <PrimaryButton title="Next: playing XI →" onPress={handleNext} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  body: { padding: 20, paddingBottom: 40 },
  coinWrap: { alignItems: 'center', marginVertical: 24 },
  coin: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgCard,
  },
  coinText: { color: colors.green, fontSize: 32, fontWeight: '700' },
  coinHint: { color: colors.textMuted, marginTop: 12 },
  question: { color: colors.text, fontSize: 18, textAlign: 'center', marginBottom: 16 },
  teamBtns: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  teamBtn: {
    flex: 1,
    backgroundColor: colors.bgCard,
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  teamBtnActive: { backgroundColor: colors.green, borderColor: colors.green },
  teamBtnText: { color: colors.text, fontWeight: '600' },
  chips: { flexDirection: 'row', marginBottom: 16 },
  summary: {
    backgroundColor: colors.bgCard,
    borderRadius: 10,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  summaryTitle: { color: colors.text, fontWeight: '700', marginBottom: 4 },
  summaryText: { color: colors.textMuted },
});
