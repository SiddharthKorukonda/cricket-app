import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { ScreenHeader } from '../../../../src/components/UI';
import { api, Match } from '../../../../src/api/client';
import { colors } from '../../../../src/theme/colors';
import { formatOvers } from '../../../../src/utils/helpers';

export default function MatchSummaryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [match, setMatch] = useState<Match | null>(null);

  useEffect(() => {
    api.get<Match>(`/matches/${id}`).then(setMatch);
  }, [id]);

  if (!match) return null;

  const inn1 = match.innings?.[0];
  const inn2 = match.innings?.[1];
  const team1 = match.teams?.find((t) => t.teamIndex === 0);
  const team2 = match.teams?.find((t) => t.teamIndex === 1);

  return (
    <View style={styles.container}>
      <ScreenHeader label="MATCH SUMMARY" title={match.title} />
      <ScrollView style={styles.body}>
        <View style={styles.metaCard}>
          <Text style={styles.meta}>{match.format} · {match.competitionType}</Text>
          <Text style={styles.meta}>{match.venue}</Text>
          <Text style={styles.code}>{match.uniqueCode}</Text>
          <Text style={styles.date}>{new Date(match.matchDate).toLocaleDateString()}</Text>
        </View>

        {inn1 && (
          <View style={styles.inningsCard}>
            <Text style={styles.inningsTeam}>
              {match.teams?.find((t) => t.teamIndex === inn1.battingTeamIndex)?.name}
            </Text>
            <Text style={styles.inningsScore}>
              {inn1.totalRuns}/{inn1.totalWickets} ({formatOvers(inn1.totalOvers)} ov)
            </Text>
          </View>
        )}

        {inn2 && (
          <View style={styles.inningsCard}>
            <Text style={styles.inningsTeam}>
              {match.teams?.find((t) => t.teamIndex === inn2.battingTeamIndex)?.name}
            </Text>
            <Text style={styles.inningsScore}>
              {inn2.totalRuns}/{inn2.totalWickets} ({formatOvers(inn2.totalOvers)} ov)
            </Text>
          </View>
        )}

        {match.resultSummary && (
          <View style={styles.resultCard}>
            <Text style={styles.result}>{match.resultSummary}</Text>
          </View>
        )}

        <Text style={styles.section}>TEAMS</Text>
        <Text style={styles.teamLine}>{team1?.name}: {team1?.players.length} players</Text>
        <Text style={styles.teamLine}>{team2?.name}: {team2?.players.length} players</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  body: { padding: 20 },
  metaCard: {
    backgroundColor: colors.bgCard,
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  meta: { color: colors.textMuted, fontSize: 14 },
  code: { color: colors.greenLight, fontWeight: '700', fontSize: 16, marginTop: 8, letterSpacing: 1 },
  date: { color: colors.textDim, fontSize: 12, marginTop: 4 },
  inningsCard: {
    backgroundColor: colors.bgCard,
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inningsTeam: { color: colors.textMuted, fontSize: 13 },
  inningsScore: { color: colors.text, fontSize: 24, fontWeight: '700', marginTop: 4 },
  resultCard: {
    backgroundColor: colors.green,
    borderRadius: 10,
    padding: 16,
    marginVertical: 16,
    alignItems: 'center',
  },
  result: { color: colors.text, fontSize: 18, fontWeight: '700' },
  section: { color: colors.textMuted, fontSize: 11, letterSpacing: 1, marginTop: 16, marginBottom: 8 },
  teamLine: { color: colors.text, fontSize: 15, marginBottom: 4 },
});
