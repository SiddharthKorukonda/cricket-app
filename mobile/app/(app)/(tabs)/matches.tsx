import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenHeader, Chip } from '../../../src/components/UI';
import { api, Match } from '../../../src/api/client';
import { colors } from '../../../src/theme/colors';

const FILTERS = ['All', 'T20', 'ODI', 'Test', 'T10', '100'] as const;

export default function MatchesScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<string>('All');
  const [matches, setMatches] = useState<Match[]>([]);

  const load = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (filter !== 'All') params.set('format', filter);
      const data = await api.get<Match[]>(`/matches?${params}`);
      setMatches(data);
    } catch {
      /* ignore */
    }
  };

  useFocusEffect(useCallback(() => { load(); }, [search, filter]));

  return (
    <View style={styles.container}>
      <ScreenHeader label="CRICSCORE" title="Match history" />
      <ScrollView style={styles.body}>
        <View style={styles.searchWrap}>
          <Ionicons name="search" size={18} color={colors.textDim} style={styles.searchIcon} />
          <TextInput
            style={styles.search}
            placeholder="Search matches, teams, or code..."
            placeholderTextColor={colors.textDim}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filters}>
          {FILTERS.map((f) => (
            <Chip key={f} label={f} selected={filter === f} onPress={() => setFilter(f)} />
          ))}
        </ScrollView>

        {matches.map((m) => {
          const team = m.teams?.[0];
          const abbr = team?.name?.slice(0, 3).toUpperCase() || 'MTC';
          const inn = m.innings?.[0];
          const inn2 = m.innings?.[1];
          const scoreText =
            inn && inn2
              ? `${inn.totalRuns}/${inn.totalWickets} vs ${inn2.totalRuns}`
              : inn
                ? `${inn.totalRuns}/${inn.totalWickets}`
                : m.uniqueCode;

          const winner = m.teams?.find((t) => t.teamIndex === m.winnerTeamIndex);
          const tag = winner ? `${winner.name.slice(0, 3).toUpperCase()} won` : m.status === 'live' ? 'Live' : 'Draw';

          return (
            <TouchableOpacity
              key={m.id}
              style={styles.row}
              onPress={() => router.push(`/(app)/match/${m.id}/summary`)}
            >
              <View style={styles.icon}>
                <Text style={styles.iconText}>{abbr}</Text>
              </View>
              <View style={styles.info}>
                <Text style={styles.title}>{m.title}</Text>
                <Text style={styles.meta}>
                  {m.format} · {new Date(m.matchDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                  {m.venue ? ` · ${m.venue.split(',')[0]}` : ''}
                </Text>
                <Text style={styles.code}>{m.uniqueCode}</Text>
              </View>
              <View style={styles.right}>
                <View style={[styles.tag, m.status === 'live' && styles.tagLive]}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
                <Text style={styles.score}>{scoreText}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  body: { padding: 20 },
  searchWrap: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  searchIcon: { position: 'absolute', left: 14, zIndex: 1 },
  search: {
    flex: 1,
    backgroundColor: colors.bgInput,
    borderRadius: 10,
    paddingLeft: 40,
    paddingRight: 14,
    paddingVertical: 12,
    color: colors.text,
    fontSize: 15,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filters: { marginBottom: 16 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.bgInput,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  iconText: { color: colors.text, fontWeight: '700', fontSize: 12 },
  info: { flex: 1 },
  title: { color: colors.text, fontSize: 15, fontWeight: '600' },
  meta: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  code: { color: colors.textDim, fontSize: 10, marginTop: 2 },
  right: { alignItems: 'flex-end' },
  tag: {
    backgroundColor: colors.green,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginBottom: 4,
  },
  tagLive: { backgroundColor: colors.red },
  tagText: { color: colors.text, fontSize: 10, fontWeight: '600' },
  score: { color: colors.textMuted, fontSize: 12 },
});
