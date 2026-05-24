import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { api, User } from '../../../src/api/client';
import { colors } from '../../../src/theme/colors';

interface CareerStats {
  batting: Record<string, number | null | string>;
  bowling: Record<string, number | null | string>;
  keeping: Record<string, number | null | string>;
  fielding: Record<string, number | null | string>;
}

interface InningsEntry {
  runs: number;
  balls: number;
  matchTitle: string;
  isOut: boolean;
}

const TABS = ['Batting', 'Bowling', 'Fielding', 'Keeping'] as const;

export default function PlayerProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [tab, setTab] = useState<(typeof TABS)[number]>('Batting');
  const [formGames, setFormGames] = useState<3 | 5>(5);
  const [data, setData] = useState<{
    user: User;
    career: CareerStats;
    last5: InningsEntry[];
    last3: InningsEntry[];
  } | null>(null);

  useEffect(() => {
    api
      .get<{ user: User; career: CareerStats; last5: InningsEntry[]; last3: InningsEntry[] }>(
        `/matches/players/${id}/stats`
      )
      .then(setData);
  }, [id]);

  if (!data) return null;

  const { user, career, last5, last3 } = data;
  const form = formGames === 5 ? last5 : last3;
  const maxForm = Math.max(...form.map((f) => f.runs), 1);

  const StatCard = ({ label, value }: { label: string; value: string | number | null }) => (
    <View style={styles.statCard}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value ?? '—'}</Text>
    </View>
  );

  const renderBatting = () => {
    const b = career.batting;
    return (
      <>
        <Text style={styles.section}>CAREER BATTING</Text>
        <View style={styles.statGrid}>
          <StatCard label="Matches" value={b.mat as number} />
          <StatCard label="Inn" value={b.inn as number} />
          <StatCard label="NO" value={b.no as number} />
          <StatCard label="Runs" value={b.runs as number} />
          <StatCard label="HS" value={b.hs as number} />
          <StatCard label="Avg" value={b.avg as number} />
          <StatCard label="BF" value={b.bf as number} />
          <StatCard label="SR" value={b.sr as number} />
          <StatCard label="100s / 50s" value={`${b.hundreds} / ${b.fifties}`} />
          <StatCard label="Ducks" value={b.ducks as number} />
          <StatCard label="4s" value={b.fours as number} />
          <StatCard label="6s" value={b.sixes as number} />
        </View>
      </>
    );
  };

  const renderBowling = () => {
    const b = career.bowling;
    return (
      <>
        <Text style={styles.section}>CAREER BOWLING</Text>
        <View style={styles.statGrid}>
          <StatCard label="Mat" value={b.mat as number} />
          <StatCard label="Inn" value={b.inn as number} />
          <StatCard label="Overs" value={typeof b.overs === 'number' ? b.overs.toFixed(1) : b.overs} />
          <StatCard label="M" value={b.maidens as number} />
          <StatCard label="R" value={b.runs as number} />
          <StatCard label="W" value={b.wickets as number} />
          <StatCard label="BBI" value={b.bbi as string} />
          <StatCard label="Avg" value={b.avg as number} />
          <StatCard label="Econ" value={b.econ as number} />
          <StatCard label="SR" value={b.sr as number} />
          <StatCard label="4W / 5W" value={`${b.fourW} / ${b.fiveW}`} />
          <StatCard label="Wd / NB" value={`${b.wides} / ${b.noBalls}`} />
        </View>
      </>
    );
  };

  const renderFielding = () => {
    const f = career.fielding;
    return (
      <>
        <Text style={styles.section}>CAREER FIELDING</Text>
        <View style={styles.statGrid}>
          <StatCard label="Mat" value={f.mat as number} />
          <StatCard label="Ct" value={f.ct as number} />
          <StatCard label="RO" value={f.ro as number} />
          <StatCard label="Max Ct/Inn" value={f.maxCtInn as number} />
        </View>
      </>
    );
  };

  const renderKeeping = () => {
    const k = career.keeping;
    return (
      <>
        <Text style={styles.section}>WICKET-KEEPING</Text>
        <View style={styles.statGrid}>
          <StatCard label="Mat" value={k.mat as number} />
          <StatCard label="Inn" value={k.inn as number} />
          <StatCard label="Ct" value={k.ct as number} />
          <StatCard label="St" value={k.st as number} />
          <StatCard label="Ct+St" value={k.ctSt as number} />
          <StatCard label="Byes" value={k.byes as number} />
          <StatCard label="Max/Inn" value={k.maxDismissals as number} />
        </View>
      </>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user.firstName[0]}
            {user.lastName[0]}
          </Text>
        </View>
        <Text style={styles.name}>
          {user.firstName.charAt(0)} {user.lastName}
        </Text>
        <Text style={styles.subtitle}>
          BATTER · @{user.username.toUpperCase()}
        </Text>
      </View>

      <View style={styles.tabs}>
        {TABS.map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, tab === t && styles.tabActive]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.body}>
        {tab === 'Batting' && renderBatting()}
        {tab === 'Bowling' && renderBowling()}
        {tab === 'Fielding' && renderFielding()}
        {tab === 'Keeping' && renderKeeping()}

        <View style={styles.formHeader}>
          <Text style={styles.section}>FORM — LAST {formGames} INNINGS</Text>
          <View style={styles.formToggle}>
            <TouchableOpacity onPress={() => setFormGames(3)} style={[styles.formBtn, formGames === 3 && styles.formBtnActive]}>
              <Text style={styles.formBtnText}>3</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setFormGames(5)} style={[styles.formBtn, formGames === 5 && styles.formBtnActive]}>
              <Text style={styles.formBtnText}>5</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.chart}>
          {form.map((inn, i) => (
            <View key={i} style={styles.barWrap}>
              <View
                style={[
                  styles.bar,
                  { height: Math.max(4, (inn.runs / maxForm) * 100) },
                ]}
              />
              <Text style={styles.barLabel}>{inn.runs}</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 20 },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.bgInput,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: { color: colors.text, fontSize: 20, fontWeight: '700' },
  name: { color: colors.text, fontSize: 26, fontWeight: '700' },
  subtitle: { color: colors.greenLight, fontSize: 12, letterSpacing: 1, marginTop: 4 },
  tabs: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 16 },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: colors.bgCard,
  },
  tabActive: { backgroundColor: colors.green },
  tabText: { color: colors.textMuted, fontSize: 13 },
  tabTextActive: { color: colors.text, fontWeight: '600' },
  body: { paddingHorizontal: 20, paddingBottom: 40 },
  section: { color: colors.textMuted, fontSize: 11, letterSpacing: 1, marginBottom: 12, marginTop: 8 },
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: {
    width: '47%',
    backgroundColor: colors.bgCard,
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statLabel: { color: colors.textMuted, fontSize: 12 },
  statValue: { color: colors.text, fontSize: 22, fontWeight: '700', marginTop: 4 },
  formHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 24 },
  formToggle: { flexDirection: 'row', gap: 4 },
  formBtn: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8, backgroundColor: colors.bgCard },
  formBtnActive: { backgroundColor: colors.green },
  formBtnText: { color: colors.text, fontSize: 12 },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: 120,
    marginTop: 16,
    paddingBottom: 24,
  },
  barWrap: { alignItems: 'center', flex: 1 },
  bar: {
    width: 28,
    backgroundColor: colors.green,
    borderRadius: 4,
    minHeight: 4,
  },
  barLabel: { color: colors.text, fontSize: 12, marginTop: 6 },
});
