import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  ScreenHeader,
  PrimaryButton,
  ProgressBar,
  Chip,
} from '../../../../src/components/UI';
import { api, Match, MatchPlayer } from '../../../../src/api/client';
import { colors } from '../../../../src/theme/colors';
import { playerDisplayName } from '../../../../src/utils/helpers';

export default function PlayingXIScreen() {
  const { matchId, teamIndex: teamIndexStr } = useLocalSearchParams<{ matchId: string; teamIndex: string }>();
  const teamIndex = parseInt(teamIndexStr || '0', 10);
  const router = useRouter();
  const [match, setMatch] = useState<Match | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [captainId, setCaptainId] = useState<string | null>(null);
  const [wkId, setWkId] = useState<string | null>(null);

  useEffect(() => {
    api.get<Match>(`/matches/${matchId}`).then((m) => {
      setMatch(m);
      const team = m.teams?.find((t) => t.teamIndex === teamIndex);
      if (team) {
        const players = team.players;
        if (players.length <= 11) {
          setSelected(new Set(players.map((p) => p.id)));
        } else {
          setSelected(new Set(players.slice(0, 11).map((p) => p.id)));
        }
      }
    });
  }, [matchId, teamIndex]);

  const team = match?.teams?.find((t) => t.teamIndex === teamIndex);
  const players = team?.players || [];
  const otherTeamIndex = teamIndex === 0 ? 1 : 0;

  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) {
      next.delete(id);
    } else if (next.size < 11) {
      next.add(id);
    } else {
      Alert.alert('Maximum 11 players in Playing XI');
      return;
    }
    setSelected(next);
  };

  const handleNext = async () => {
    if (selected.size === 0) {
      Alert.alert('Select at least one player');
      return;
    }
    await api.patch(`/matches/${matchId}/playing-xi`, {
      teamIndex,
      playerIds: Array.from(selected),
      captainId,
      wicketKeeperId: wkId,
    });

    if (teamIndex === 0) {
      router.push({
        pathname: '/(app)/match/new/playing-xi',
        params: { matchId, teamIndex: '1' },
      });
    } else {
      router.push({ pathname: '/(app)/match/new/opening-pair', params: { matchId } });
    }
  };

  return (
    <View style={styles.container}>
      <ScreenHeader label={`STEP 3 OF 4`} title={`Playing XI — ${team?.name || ''}`} />
      <ProgressBar step={3} total={4} />
      <ScrollView style={styles.body}>
        <View style={styles.instructionRow}>
          <Text style={styles.instruction}>
            {players.length > 11 ? 'Select 11 players' : 'All players selected'} · tap to toggle
          </Text>
          <View style={styles.counter}>
            <Text style={styles.counterText}>{selected.size} / 11</Text>
          </View>
        </View>

        {players.map((p: MatchPlayer, i: number) => {
          const isSelected = selected.has(p.id);
          return (
            <TouchableOpacity key={p.id} style={styles.playerRow} onPress={() => toggle(p.id)}>
              <View style={[styles.orderBadge, !isSelected && styles.orderBadgeOff]}>
                <Text style={styles.orderText}>{isSelected ? i + 1 : '—'}</Text>
              </View>
              <View style={styles.playerInfo}>
                <Text style={styles.playerName}>
                  {playerDisplayName(p)}
                  {captainId === p.id ? ' (c)' : ''}
                </Text>
                <Text style={styles.playerRole}>{p.role} · {p.battingHand}</Text>
              </View>
              {wkId === p.id && <View style={styles.wkBadge}><Text style={styles.wkText}>WK</Text></View>}
              <View style={[styles.toggle, isSelected && styles.toggleOn]}>
                {isSelected && <View style={styles.toggleDot} />}
              </View>
            </TouchableOpacity>
          );
        })}

        <Text style={styles.alsoSet}>ALSO SET</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {players.filter((p) => selected.has(p.id)).map((p) => (
            <View key={p.id} style={styles.setChips}>
              <Chip
                label={`Captain: ${playerDisplayName(p)}`}
                selected={captainId === p.id}
                onPress={() => setCaptainId(p.id)}
              />
              <Chip
                label={`WK: ${playerDisplayName(p)}`}
                selected={wkId === p.id}
                onPress={() => setWkId(p.id)}
              />
            </View>
          ))}
        </ScrollView>

        <PrimaryButton
          title={teamIndex === 0 ? 'Next: Team 2 XI →' : 'Next: opening pair →'}
          onPress={handleNext}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  body: { padding: 20, paddingBottom: 40 },
  instructionRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  instruction: { color: colors.textMuted, fontSize: 13 },
  counter: { backgroundColor: colors.bgInput, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  counterText: { color: colors.text, fontSize: 12 },
  playerRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  orderBadge: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  orderBadgeOff: { backgroundColor: colors.bgInput },
  orderText: { color: colors.text, fontWeight: '700' },
  playerInfo: { flex: 1 },
  playerName: { color: colors.text, fontWeight: '600' },
  playerRole: { color: colors.textMuted, fontSize: 12 },
  wkBadge: { backgroundColor: colors.blue, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginRight: 8 },
  wkText: { color: colors.text, fontSize: 10, fontWeight: '700' },
  toggle: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  toggleOn: { borderColor: colors.green, backgroundColor: colors.green },
  toggleDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.text },
  alsoSet: { color: colors.textMuted, fontSize: 11, letterSpacing: 1, marginVertical: 16 },
  setChips: { flexDirection: 'row' },
});
