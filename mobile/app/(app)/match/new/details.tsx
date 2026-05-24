import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Text } from 'react-native';
import { useRouter } from 'expo-router';
import {
  ScreenHeader,
  Input,
  Chip,
  PrimaryButton,
  SectionLabel,
} from '../../../../src/components/UI';
import { api, Match } from '../../../../src/api/client';
import { colors, FORMAT_DEFAULTS, COMPETITION_TYPES } from '../../../../src/theme/colors';

const FORMATS = ['T20', 'ODI', 'Test', 'T10', '100', 'Custom'] as const;

export default function MatchDetailsScreen() {
  const router = useRouter();
  const [format, setFormat] = useState<string>('T20');
  const [oversPerSide, setOversPerSide] = useState('20');
  const [ballsPerSide, setBallsPerSide] = useState('');
  const [title, setTitle] = useState('');
  const [venue, setVenue] = useState('');
  const [date, setDate] = useState(new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }));
  const [competitionType, setCompetitionType] = useState('Friendly');
  const [loading, setLoading] = useState(false);
  const [matchCode, setMatchCode] = useState<string | null>(null);

  const onFormatChange = (f: string) => {
    setFormat(f);
    const def = FORMAT_DEFAULTS[f];
    if (def) {
      setOversPerSide(String(def.overs));
      setBallsPerSide(def.balls ? String(def.balls) : '');
    }
  };

  const handleNext = async () => {
    setLoading(true);
    try {
      const match = await api.post<Match>('/matches', {
        title: title || `${format} Match`,
        venue,
        matchDate: new Date().toISOString(),
        format,
        oversPerSide: parseFloat(oversPerSide) || 20,
        ballsPerSide: ballsPerSide ? parseInt(ballsPerSide, 10) : null,
        competitionType,
      });
      setMatchCode(match.uniqueCode);
      router.push({ pathname: '/(app)/match/new/team-setup', params: { matchId: match.id } });
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to create match');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScreenHeader label="NEW MATCH" title="Match details" />
      <ScrollView style={styles.body} keyboardShouldPersistTaps="handled">
        <SectionLabel title="FORMAT" />
        <View style={styles.chips}>
          {FORMATS.map((f) => (
            <Chip key={f} label={f} selected={format === f} onPress={() => onFormatChange(f)} />
          ))}
        </View>

        <Input
          label={format === '100' ? 'BALLS PER SIDE' : 'OVERS PER SIDE'}
          value={format === '100' ? ballsPerSide : oversPerSide}
          onChangeText={format === '100' ? setBallsPerSide : setOversPerSide}
          keyboardType="numeric"
        />
        {format === 'Custom' && (
          <Input label="OVERS PER SIDE" value={oversPerSide} onChangeText={setOversPerSide} keyboardType="numeric" />
        )}

        <Input label="MATCH TITLE" value={title} onChangeText={setTitle} placeholder="India vs Australia" />
        <Input label="VENUE" value={venue} onChangeText={setVenue} placeholder="Stadium name" />
        <Input label="DATE" value={date} onChangeText={setDate} />

        <SectionLabel title="COMPETITION TYPE" />
        <View style={styles.chips}>
          {COMPETITION_TYPES.map((c) => (
            <Chip key={c} label={c} selected={competitionType === c} onPress={() => setCompetitionType(c)} />
          ))}
        </View>

        {matchCode && (
          <View style={styles.codeBox}>
            <Text style={styles.codeLabel}>MATCH CODE (unique & permanent)</Text>
            <Text style={styles.codeValue}>{matchCode}</Text>
          </View>
        )}

        <PrimaryButton title="Next: team setup →" onPress={handleNext} loading={loading} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  body: { padding: 20, paddingBottom: 40 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 },
  codeBox: {
    backgroundColor: colors.bgCard,
    borderRadius: 10,
    padding: 16,
    marginVertical: 16,
    borderWidth: 1,
    borderColor: colors.green,
  },
  codeLabel: { color: colors.textMuted, fontSize: 11, letterSpacing: 1, marginBottom: 4 },
  codeValue: { color: colors.greenLight, fontSize: 20, fontWeight: '700', letterSpacing: 2 },
});
