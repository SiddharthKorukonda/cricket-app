import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenHeader } from '../../../src/components/UI';
import { api, User } from '../../../src/api/client';
import { colors } from '../../../src/theme/colors';

export default function PlayersScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<User[]>([]);

  const searchPlayers = async (q: string) => {
    setSearch(q);
    if (q.length < 2) {
      setResults([]);
      return;
    }
    try {
      const data = await api.get<User[]>(`/matches/players/search?q=${encodeURIComponent(q)}`);
      setResults(data);
    } catch {
      setResults([]);
    }
  };

  return (
    <View style={styles.container}>
      <ScreenHeader label="CRICSCORE" title="Players" />
      <ScrollView style={styles.body}>
        <View style={styles.searchWrap}>
          <Ionicons name="search" size={18} color={colors.textDim} style={styles.searchIcon} />
          <TextInput
            style={styles.search}
            placeholder="Search by name or username..."
            placeholderTextColor={colors.textDim}
            value={search}
            onChangeText={searchPlayers}
          />
        </View>

        {results.map((p) => (
          <TouchableOpacity
            key={p.id}
            style={styles.row}
            onPress={() => router.push(`/(app)/player/${p.id}`)}
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {p.firstName[0]}
                {p.lastName[0]}
              </Text>
            </View>
            <View>
              <Text style={styles.name}>
                {p.firstName} {p.lastName}
              </Text>
              <Text style={styles.username}>@{p.username}</Text>
            </View>
          </TouchableOpacity>
        ))}

        {search.length >= 2 && results.length === 0 && (
          <Text style={styles.empty}>No players found</Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  body: { padding: 20 },
  searchWrap: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  searchIcon: { position: 'absolute', left: 14, zIndex: 1 },
  search: {
    flex: 1,
    backgroundColor: colors.bgInput,
    borderRadius: 10,
    paddingLeft: 40,
    paddingVertical: 12,
    color: colors.text,
    fontSize: 15,
    borderWidth: 1,
    borderColor: colors.border,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.bgInput,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarText: { color: colors.text, fontWeight: '700' },
  name: { color: colors.text, fontSize: 16, fontWeight: '600' },
  username: { color: colors.textMuted, fontSize: 13 },
  empty: { color: colors.textMuted, textAlign: 'center', marginTop: 24 },
});
