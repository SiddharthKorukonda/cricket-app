import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  ScreenHeader,
  Input,
  PrimaryButton,
  SectionLabel,
  ProgressBar,
} from '../../../../src/components/UI';
import { api, Match, User } from '../../../../src/api/client';
import { colors, TEAM_COLORS } from '../../../../src/theme/colors';
import { playerDisplayName, playerInitials } from '../../../../src/utils/helpers';

interface LocalPlayer {
  id?: string;
  userId?: string;
  guestName?: string;
  isGuest: boolean;
  username?: string;
  user?: User;
}

export default function TeamSetupScreen() {
  const { matchId } = useLocalSearchParams<{ matchId: string }>();
  const router = useRouter();
  const [team1Name, setTeam1Name] = useState('Team 1');
  const [team2Name, setTeam2Name] = useState('Team 2');
  const [team1Color, setTeam1Color] = useState(TEAM_COLORS[0]);
  const [team1Players, setTeam1Players] = useState<LocalPlayer[]>([]);
  const [team2Players, setTeam2Players] = useState<LocalPlayer[]>([]);
  const [importModal, setImportModal] = useState<{ team: 0 | 1 } | null>(null);
  const [importUsername, setImportUsername] = useState('');
  const [guestModal, setGuestModal] = useState<{ team: 0 | 1 } | null>(null);
  const [guestName, setGuestName] = useState('');
  const [loading, setLoading] = useState(false);

  const importPlayer = async () => {
    if (!importUsername.trim()) return;
    try {
      const user = await api.get<User>(`/auth/lookup/${importUsername.trim()}`);
      const player: LocalPlayer = { userId: user.id, isGuest: false, user, username: user.username };
      if (importModal?.team === 0) {
        if (team1Players.some((p) => p.userId === user.id)) {
          Alert.alert('Already added');
          return;
        }
        setTeam1Players([...team1Players, player]);
      } else {
        if (team2Players.some((p) => p.userId === user.id)) {
          Alert.alert('Already added');
          return;
        }
        setTeam2Players([...team2Players, player]);
      }
      setImportModal(null);
      setImportUsername('');
    } catch {
      Alert.alert('Player not found', 'No account with that username. Add as guest instead.');
    }
  };

  const addGuest = () => {
    if (!guestName.trim()) return;
    const player: LocalPlayer = { guestName: guestName.trim(), isGuest: true };
    if (guestModal?.team === 0) setTeam1Players([...team1Players, player]);
    else setTeam2Players([...team2Players, player]);
    setGuestModal(null);
    setGuestName('');
  };

  const handleNext = async () => {
    if (team1Players.length === 0 || team2Players.length === 0) {
      Alert.alert('Add players', 'Each team needs at least one player');
      return;
    }
    setLoading(true);
    try {
      await api.patch(`/matches/${matchId}/teams`, {
        teams: [
          {
            teamIndex: 0,
            name: team1Name,
            color: team1Color,
            players: team1Players.map((p) => ({
              userId: p.userId,
              guestName: p.guestName,
              isGuest: p.isGuest,
            })),
          },
          {
            teamIndex: 1,
            name: team2Name,
            players: team2Players.map((p) => ({
              userId: p.userId,
              guestName: p.guestName,
              isGuest: p.isGuest,
            })),
          },
        ],
      });
      router.push({ pathname: '/(app)/match/new/toss', params: { matchId } });
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to save teams');
    } finally {
      setLoading(false);
    }
  };

  const renderTeam = (team: 0 | 1, name: string, setName: (s: string) => void, players: LocalPlayer[]) => (
    <View style={styles.teamSection}>
      <Input label={`TEAM ${team + 1}`} value={name} onChangeText={setName} />
      {team === 0 && (
        <>
          <SectionLabel title="TEAM 1 COLOR" />
          <View style={styles.colors}>
            {TEAM_COLORS.map((c) => (
              <TouchableOpacity
                key={c}
                style={[styles.colorSwatch, { backgroundColor: c }, team1Color === c && styles.colorSelected]}
                onPress={() => setTeam1Color(c)}
              />
            ))}
          </View>
        </>
      )}
      <SectionLabel title="IMPORT PLAYER" />
      <TouchableOpacity style={styles.importBtn} onPress={() => setImportModal({ team })}>
        <Text style={styles.importText}>Import by username</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.importBtn} onPress={() => setGuestModal({ team })}>
        <Text style={styles.importText}>Add guest player</Text>
      </TouchableOpacity>
      <SectionLabel title="SQUAD" />
      {players.map((p, i) => (
        <View key={i} style={styles.playerRow}>
          <View style={styles.playerAvatar}>
            <Text style={styles.playerAvatarText}>{playerInitials(p)}</Text>
          </View>
          <View>
            <Text style={styles.playerName}>{playerDisplayName(p)}</Text>
            <Text style={styles.playerMeta}>
              {p.isGuest ? 'Guest · stats not saved' : `@${p.username}`}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      <ScreenHeader label="STEP 1 OF 4" title="Team setup" />
      <ProgressBar step={1} total={4} />
      <ScrollView style={styles.body}>
        {renderTeam(0, team1Name, setTeam1Name, team1Players)}
        {renderTeam(1, team2Name, setTeam2Name, team2Players)}
        <PrimaryButton title="Next: toss →" onPress={handleNext} loading={loading} />
      </ScrollView>

      <Modal visible={!!importModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Import player</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Username"
              placeholderTextColor={colors.textDim}
              value={importUsername}
              onChangeText={setImportUsername}
              autoCapitalize="none"
            />
            <PrimaryButton title="Add player" onPress={importPlayer} />
            <TouchableOpacity onPress={() => setImportModal(null)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={!!guestModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Guest player</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Player name"
              placeholderTextColor={colors.textDim}
              value={guestName}
              onChangeText={setGuestName}
            />
            <PrimaryButton title="Add guest" onPress={addGuest} />
            <TouchableOpacity onPress={() => setGuestModal(null)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  body: { padding: 20, paddingBottom: 40 },
  teamSection: { marginBottom: 24 },
  colors: { flexDirection: 'row', marginBottom: 16 },
  colorSwatch: { width: 36, height: 36, borderRadius: 18, marginRight: 10 },
  colorSelected: { borderWidth: 3, borderColor: colors.text },
  importBtn: {
    backgroundColor: colors.bgCard,
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  importText: { color: colors.text, textAlign: 'center' },
  playerRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  playerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.bgInput,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  playerAvatarText: { color: colors.text, fontWeight: '700' },
  playerName: { color: colors.text, fontWeight: '600' },
  playerMeta: { color: colors.textMuted, fontSize: 12 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modal: { backgroundColor: colors.bgCard, padding: 24, borderTopLeftRadius: 16, borderTopRightRadius: 16 },
  modalTitle: { color: colors.text, fontSize: 18, fontWeight: '700', marginBottom: 16 },
  modalInput: {
    backgroundColor: colors.bgInput,
    borderRadius: 10,
    padding: 14,
    color: colors.text,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalCancel: { color: colors.textMuted, textAlign: 'center', marginTop: 16 },
});
