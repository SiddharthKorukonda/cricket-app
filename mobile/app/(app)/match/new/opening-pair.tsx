import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ScreenHeader, PrimaryButton, Chip, SectionLabel } from '../../../../src/components/UI';
import { api, Match, MatchPlayer } from '../../../../src/api/client';
import { colors } from '../../../../src/theme/colors';
import { playerDisplayName, playerInitials } from '../../../../src/utils/helpers';

export default function OpeningPairScreen() {
  const { matchId } = useLocalSearchParams<{ matchId: string }>();
  const router = useRouter();
  const [match, setMatch] = useState<Match | null>(null);
  const [strikerId, setStrikerId] = useState<string | null>(null);
  const [nonStrikerId, setNonStrikerId] = useState<string | null>(null);
  const [bowlerId, setBowlerId] = useState<string | null>(null);
  const [end, setEnd] = useState('Pavilion End');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get<Match>(`/matches/${matchId}`).then((m) => {
      setMatch(m);
      const batIdx =
        m.tossElected === 'bat'
          ? m.tossWinnerTeam!
          : m.tossWinnerTeam === 0
            ? 1
            : 0;
      const bowlIdx = batIdx === 0 ? 1 : 0;
      const batters = m.teams?.find((t) => t.teamIndex === batIdx)?.players.filter((p) => p.inPlayingXI) || [];
      const bowlers = m.teams?.find((t) => t.teamIndex === bowlIdx)?.players.filter((p) => p.inPlayingXI) || [];
      if (batters[0]) setStrikerId(batters[0].id);
      if (batters[1]) setNonStrikerId(batters[1].id);
      if (bowlers[0]) setBowlerId(bowlers[0].id);
    });
  }, [matchId]);

  const batIdx =
    match?.tossElected === 'bat'
      ? match.tossWinnerTeam!
      : match?.tossWinnerTeam === 0
        ? 1
        : 0;
  const bowlIdx = batIdx === 0 ? 1 : 0;
  const battingTeam = match?.teams?.find((t) => t.teamIndex === batIdx);
  const bowlingTeam = match?.teams?.find((t) => t.teamIndex === bowlIdx);
  const batters = battingTeam?.players.filter((p) => p.inPlayingXI) || [];
  const bowlers = bowlingTeam?.players.filter((p) => p.inPlayingXI) || [];

  const swapStrike = (id: string) => {
    if (id === strikerId) return;
    if (id === nonStrikerId) {
      setNonStrikerId(strikerId);
      setStrikerId(id);
    } else {
      setNonStrikerId(strikerId);
      setStrikerId(id);
    }
  };

  const handleStart = async () => {
    if (!strikerId || !nonStrikerId || !bowlerId) return;
    setLoading(true);
    try {
      await api.patch(`/matches/${matchId}/opening`, {
        strikerId,
        nonStrikerId,
        openingBowlerId: bowlerId,
        openingEnd: end,
      });
      await api.post(`/scoring/${matchId}/init`, { strikerId, nonStrikerId, bowlerId });
      router.replace(`/(app)/match/${matchId}/score`);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to start');
    } finally {
      setLoading(false);
    }
  };

  const PlayerCard = ({
    p,
    role,
    selected,
    onPress,
  }: {
    p: MatchPlayer;
    role?: string;
    selected?: boolean;
    onPress?: () => void;
  }) => (
    <TouchableOpacity
      style={[styles.card, selected && styles.cardSelected]}
      onPress={onPress}
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{playerInitials(p)}</Text>
      </View>
      <View style={styles.cardInfo}>
        <Text style={styles.cardName}>{playerDisplayName(p)}</Text>
        <Text style={styles.cardSub}>{p.battingHand === 'R' ? 'Right-hand bat' : 'Left-hand bat'}</Text>
      </View>
      {role && (
        <View style={styles.roleBadge}>
          {role === 'On strike' && <View style={styles.strikeDot} />}
          <Text style={[styles.roleText, role === 'On strike' && styles.roleActive]}>{role}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const oversLabel = match?.ballsPerSide
    ? `${match.ballsPerSide} balls`
    : `${match?.oversPerSide} overs`;

  return (
    <View style={styles.container}>
      <ScreenHeader label="READY TO START" title="Opening pair" />
      <ScrollView style={styles.body}>
        <SectionLabel title={`OPENING BATTERS — ${battingTeam?.name?.toUpperCase()}`} />
        {batters.map((p) => (
          <PlayerCard
            key={p.id}
            p={p}
            role={p.id === strikerId ? 'On strike' : p.id === nonStrikerId ? 'Non-striker' : undefined}
            selected={p.id === strikerId}
            onPress={() => swapStrike(p.id)}
          />
        ))}

        <SectionLabel title={`OPENING BOWLER — ${bowlingTeam?.name?.toUpperCase()}`} />
        {bowlers.map((p) => (
          <PlayerCard
            key={p.id}
            p={p}
            selected={p.id === bowlerId}
            onPress={() => setBowlerId(p.id)}
          />
        ))}

        <SectionLabel title="END" />
        <View style={styles.chips}>
          <Chip label="Pavilion End" selected={end === 'Pavilion End'} onPress={() => setEnd('Pavilion End')} />
          <Chip label="Members End" selected={end === 'Members End'} onPress={() => setEnd('Members End')} />
        </View>

        <View style={styles.summary}>
          <Text style={styles.summaryText}>
            {battingTeam?.name} bat first · {oversLabel}
          </Text>
          <Text style={styles.summaryCode}>Match code: {match?.uniqueCode}</Text>
        </View>

        <PrimaryButton title="Start match ↗" onPress={handleStart} loading={loading} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  body: { padding: 20, paddingBottom: 40 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardSelected: { borderColor: colors.green },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.bgInput,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: { color: colors.text, fontWeight: '700' },
  cardInfo: { flex: 1 },
  cardName: { color: colors.text, fontWeight: '600' },
  cardSub: { color: colors.textMuted, fontSize: 12 },
  roleBadge: { flexDirection: 'row', alignItems: 'center' },
  strikeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.green, marginRight: 4 },
  roleText: { color: colors.textMuted, fontSize: 12 },
  roleActive: { color: colors.greenLight },
  chips: { flexDirection: 'row', marginBottom: 16 },
  summary: {
    backgroundColor: colors.bgCard,
    borderRadius: 10,
    padding: 16,
    marginVertical: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  summaryText: { color: colors.text, fontWeight: '600' },
  summaryCode: { color: colors.textDim, fontSize: 12, marginTop: 4 },
});
