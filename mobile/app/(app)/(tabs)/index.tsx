import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuth } from '../../../src/context/AuthContext';
import { ProfileMenu } from '../../../src/components/ProfileMenu';
import { api, Match } from '../../../src/api/client';
import { colors } from '../../../src/theme/colors';
import { greeting, timeAgo, formatOvers } from '../../../src/utils/helpers';

export default function HomeScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [liveMatch, setLiveMatch] = useState<Match | null>(null);
  const [recentMatches, setRecentMatches] = useState<Match[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const [live, all] = await Promise.all([
        api.get<Match | null>('/matches/live'),
        api.get<Match[]>('/matches?status=completed'),
      ]);
      setLiveMatch(live);
      setRecentMatches(all.slice(0, 5));
    } catch {
      /* offline */
    }
  };

  useFocusEffect(
    useCallback(() => {
      load();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const currentInnings = liveMatch?.innings?.[liveMatch.innings.length - 1];
  const battingTeam = liveMatch?.teams?.find((t) => t.teamIndex === currentInnings?.battingTeamIndex);
  const bowlingTeam = liveMatch?.teams?.find((t) => t.teamIndex !== currentInnings?.battingTeamIndex);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.green} />}
    >
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.brand}>CRICSCORE</Text>
            <Text style={styles.greeting}>
              {greeting()}, {user?.firstName}
            </Text>
          </View>
          <ProfileMenu />
        </View>
      </View>

      <View style={styles.body}>
        <Text style={styles.sectionTitle}>LIVE MATCH</Text>
        {liveMatch ? (
          <View style={styles.liveCard}>
            <View style={styles.liveHeader}>
              <Text style={styles.matchTitle}>{liveMatch.title}</Text>
              <View style={styles.liveBadge}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>Live</Text>
              </View>
            </View>
            <View style={styles.scoreRow}>
              <View style={styles.teamScore}>
                <Text style={styles.teamName}>{battingTeam?.name}</Text>
                <Text style={styles.score}>
                  {currentInnings?.totalRuns}/{currentInnings?.totalWickets}
                </Text>
                <Text style={styles.overs}>{formatOvers(currentInnings?.totalOvers || 0)} ov</Text>
              </View>
              <Text style={styles.vs}>vs</Text>
              <View style={styles.teamScore}>
                <Text style={styles.teamName}>{bowlingTeam?.name}</Text>
                <Text style={styles.score}>—</Text>
                <Text style={styles.overs}>bowling</Text>
              </View>
            </View>
            <Text style={styles.matchCode}>Code: {liveMatch.uniqueCode}</Text>
            <TouchableOpacity
              style={styles.continueBtn}
              onPress={() => router.push(`/(app)/match/${liveMatch.id}/score`)}
            >
              <Text style={styles.continueText}>Continue scoring ↗</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No live match right now</Text>
            <Text style={styles.emptySub}>Start a new match to begin scoring</Text>
          </View>
        )}

        <Text style={styles.sectionTitle}>RECENT MATCHES</Text>
        {recentMatches.length === 0 ? (
          <Text style={styles.emptySub}>No completed matches yet</Text>
        ) : (
          recentMatches.map((m) => {
            const team = m.teams?.[0];
            const abbr = team?.name?.slice(0, 3).toUpperCase() || 'MTC';
            return (
              <TouchableOpacity
                key={m.id}
                style={styles.recentRow}
                onPress={() => router.push(`/(app)/match/${m.id}/summary`)}
              >
                <View style={styles.teamIcon}>
                  <Text style={styles.teamIconText}>{abbr}</Text>
                </View>
                <View style={styles.recentInfo}>
                  <Text style={styles.recentTitle}>{m.title}</Text>
                  <Text style={styles.recentMeta}>
                    {timeAgo(m.matchDate)} · {m.format}
                  </Text>
                </View>
                <Text style={styles.result}>{m.resultSummary || 'Completed'}</Text>
              </TouchableOpacity>
            );
          })
        )}

        <Text style={styles.sectionTitle}>QUICK ACTIONS</Text>
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.newMatchBtn}
            onPress={() => router.push('/(app)/match/new/details')}
          >
            <Text style={styles.newMatchText}>+ New match</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.historyBtn} onPress={() => router.push('/(app)/(tabs)/matches')}>
            <Text style={styles.historyText}>Match history</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { backgroundColor: colors.header, paddingTop: 56, paddingBottom: 24, paddingHorizontal: 20 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  brand: { color: colors.greenMuted, fontSize: 13, fontWeight: '700', letterSpacing: 2 },
  greeting: { color: colors.text, fontSize: 26, fontWeight: '700', marginTop: 4 },
  body: { padding: 20 },
  sectionTitle: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.5,
    marginBottom: 12,
    marginTop: 8,
  },
  liveCard: {
    backgroundColor: colors.bgCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.green,
    padding: 16,
    marginBottom: 24,
  },
  liveHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  matchTitle: { color: colors.text, fontSize: 16, fontWeight: '700', flex: 1 },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(231,76,60,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.red, marginRight: 6 },
  liveText: { color: colors.red, fontSize: 12, fontWeight: '600' },
  scoreRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', marginBottom: 12 },
  teamScore: { alignItems: 'center', flex: 1 },
  teamName: { color: colors.textMuted, fontSize: 13, marginBottom: 4 },
  score: { color: colors.text, fontSize: 28, fontWeight: '700' },
  overs: { color: colors.textMuted, fontSize: 12 },
  vs: { color: colors.textDim, fontSize: 14 },
  matchCode: { color: colors.textDim, fontSize: 11, textAlign: 'center', marginBottom: 12 },
  continueBtn: {
    borderWidth: 1,
    borderColor: colors.green,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  continueText: { color: colors.greenLight, fontWeight: '600' },
  emptyCard: {
    backgroundColor: colors.bgCard,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyText: { color: colors.text, fontSize: 16 },
  emptySub: { color: colors.textMuted, fontSize: 13, marginTop: 4 },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  teamIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.bgInput,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  teamIconText: { color: colors.text, fontSize: 12, fontWeight: '700' },
  recentInfo: { flex: 1 },
  recentTitle: { color: colors.text, fontSize: 15, fontWeight: '600' },
  recentMeta: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  result: { color: colors.text, fontSize: 12, maxWidth: 100, textAlign: 'right' },
  actionsRow: { flexDirection: 'row', gap: 12, marginBottom: 32 },
  newMatchBtn: {
    flex: 1,
    backgroundColor: colors.green,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  newMatchText: { color: colors.text, fontWeight: '700', fontSize: 15 },
  historyBtn: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 16,
    alignItems: 'center',
    backgroundColor: colors.bgCard,
  },
  historyText: { color: colors.text, fontWeight: '600', fontSize: 15 },
});
