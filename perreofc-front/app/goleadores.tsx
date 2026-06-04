/**
 * Renders the goleadores screen in the mobile app.
 * It composes UI components, hooks and API/store data for this route.
 */

import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { router } from 'expo-router';
import { ChevronLeft, ChevronRight, Trophy, Search, X } from 'lucide-react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MotiView } from 'moti';
import { useTheme } from '../src/hooks/useTheme';
import { api as newApi } from '../src/services/api/index';
import { typography } from '../src/theme/typography';
import { brand } from '../src/theme/colors';
import { rf, rs } from '../src/theme/responsive';
import { TopScorerEntry } from '../src/types';

// ── Column widths — escalan con el ancho de pantalla ──────────────────────────
const SCORERS_COL = {
  pos:   rs(22),
  gap:   rs(6),
  team:  rs(110),
  pj:    rs(26),
  goals: rs(40),
};

function formatPlayerName(raw: string): string {
  // La API devuelve "APELLIDOS, NOMBRE" → convertir a "Nombre Apellidos"
  if (!raw) return raw;
  const parts = raw.split(',');
  if (parts.length < 2) return toTitleCase(raw);
  const apellidos = parts[0].trim();
  const nombre = parts.slice(1).join(',').trim();
  return toTitleCase(`${nombre} ${apellidos}`);
}

function toTitleCase(str: string): string {
  // Divide por espacios y capitaliza cada palabra individualmente
  // para manejar correctamente letras con tilde (ñ, á, é, etc.)
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.length > 0 ? word.charAt(0).toUpperCase() + word.slice(1) : word)
    .join(' ');
}

const PAGE_SIZE = 13;

function ScorersHeader() {
  const { colors } = useTheme();

  const hcell = (label: string, w: number) => (
    <Text key={label} style={{
      width: w,
      ...typography.label,
      color: colors.textMuted,
      textAlign: 'center',
      fontSize: rf(11),
    }}>
      {label}
    </Text>
  );

  return (
    <View style={{
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: rs(12),
      paddingVertical: rs(9),
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.cardAlt,
    }}>
      {hcell('#', SCORERS_COL.pos)}
      <View style={{ width: SCORERS_COL.gap }} />
      <Text style={{ flex: 1, ...typography.label, color: colors.textMuted, fontSize: rf(11) }}>Jugador</Text>
      {hcell('Equipo', SCORERS_COL.team)}
      {hcell('PJ', SCORERS_COL.pj)}
      {hcell('G', SCORERS_COL.goals)}
    </View>
  );
}

function ScorerRow({ entry, isOwn }: { entry: TopScorerEntry; isOwn: boolean }) {
  const { colors } = useTheme();

  return (
    <View style={{
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: rs(12),
      paddingVertical: rs(11),
      backgroundColor: isOwn ? `${brand.orange}10` : 'transparent',
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    }}>
      <Text style={{
        width: SCORERS_COL.pos,
        ...typography.body,
        fontSize: rf(13),
        color: isOwn ? brand.orange : colors.textMuted,
        fontFamily: isOwn ? 'Inter_700Bold' : 'Inter_400Regular',
        textAlign: 'center',
      }}>
        {entry.position}
      </Text>

      <View style={{ width: SCORERS_COL.gap }} />

      <Text style={{
        flex: 1,
        ...typography.body,
        fontSize: rf(13),
        color: isOwn ? brand.orange : colors.text,
        fontFamily: isOwn ? 'Inter_700Bold' : 'Inter_600SemiBold',
      }} numberOfLines={1}>
        {formatPlayerName(entry.playerName)}
      </Text>

      <Text style={{
        width: SCORERS_COL.team,
        ...typography.body,
        fontSize: rf(11),
        color: isOwn ? brand.orange : colors.textMuted,
        fontFamily: isOwn ? 'Inter_600SemiBold' : 'Inter_400Regular',
        textAlign: 'center',
      }} numberOfLines={1}>
        {entry.teamName}
      </Text>

      <Text style={{
        width: SCORERS_COL.pj,
        ...typography.body,
        fontSize: rf(13),
        color: isOwn ? brand.orange : colors.text,
        fontFamily: isOwn ? 'Inter_700Bold' : 'Inter_400Regular',
        textAlign: 'center',
      }}>
        {entry.matchesPlayed}
      </Text>

      <View style={{ width: SCORERS_COL.goals, alignItems: 'center' }}>
        <View style={{
          backgroundColor: isOwn ? `${brand.orange}22` : `${colors.accent}15`,
          borderRadius: rs(8),
          paddingHorizontal: rs(5),
          paddingVertical: rs(2),
          minWidth: rs(28),
          alignItems: 'center',
        }}>
          <Text style={{
            ...typography.body,
            fontSize: rf(13),
            color: isOwn ? brand.orange : colors.accent,
            fontFamily: 'Inter_700Bold',
          }} numberOfLines={1}>
            {entry.goals}
          </Text>
        </View>
      </View>
    </View>
  );
}

export default function GoleadoresScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [scorers, setScorers] = useState<TopScorerEntry[]>([]);
  const [ownTeamId, setOwnTeamId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    Promise.all([
      (newApi.home.getQuickTopScorers() as Promise<any>),
      (newApi.home.getQuickClassification() as Promise<any>),
    ]).then(([scorersRes, classRes]) => {
      const entries: any[] = Array.isArray(scorersRes)
        ? scorersRes
        : (scorersRes?.entries ?? []);

      setScorers(entries.map((e: any) => ({
        position:      e.position      ?? 0,
        playerId:      e.playerId      ?? e.player_id ?? '',
        playerName:    e.playerName    ?? e.player_name ?? '',
        teamId:        e.teamId        ?? e.team_id ?? '',
        teamName:      e.teamName      ?? e.team_name ?? '',
        matchesPlayed: e.matchesPlayed ?? e.matches_played ?? 0,
        goals:         e.goals         ?? 0,
        penaltyGoals:  e.penaltyGoals  ?? e.penalty_goals ?? 0,
      })));

      const rawClass: any[] = Array.isArray(classRes) ? classRes : (classRes?.entries ?? []);
      const own = rawClass.find((e: any) => e.isOwnTeam ?? e.isOwn);
      if (own) setOwnTeamId(String(own.teamId ?? own.team_id ?? ''));

      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? scorers.filter(e =>
      e.playerName.toLowerCase().includes(q) ||
      formatPlayerName(e.playerName).toLowerCase().includes(q)
    ) : scorers;
  }, [scorers, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Header */}
      <View style={{
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 12,
        paddingTop: insets.top + 12, paddingBottom: 12,
        borderBottomWidth: 1, borderBottomColor: colors.border,
        backgroundColor: colors.bg,
      }}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} style={{ padding: 4 }}>
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, marginLeft: 8 }}>
          <Trophy size={20} color={brand.orange} />
          <Text style={{ ...typography.h3, color: colors.text }}>Goleadores</Text>
        </View>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : scorers.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <Ionicons name="football" size={32} color={colors.textMuted} />
          <Text style={{ ...typography.body, color: colors.textMuted }}>Sin datos de goleadores</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 12, paddingTop: 10, paddingBottom: insets.bottom + 24 }}>
          {/* Buscador */}
          <View style={{
            flexDirection: 'row', alignItems: 'center', gap: 8,
            backgroundColor: colors.cardAlt,
            borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10,
            borderWidth: 1, borderColor: colors.border,
            marginBottom: 12,
          }}>
            <Search size={16} color={colors.textMuted} />
            <TextInput
              value={search}
              onChangeText={t => { setSearch(t); setPage(1); }}
              placeholder="Buscar jugador..."
              placeholderTextColor={colors.textMuted}
              style={{
                flex: 1,
                ...typography.body,
                color: colors.text,
                fontSize: 14,
                padding: 0,
              }}
              autoCorrect={false}
              autoCapitalize="none"
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => { setSearch(''); setPage(1); }} activeOpacity={0.7}>
                <X size={16} color={colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          <View style={{
            borderWidth: 1, borderColor: colors.border,
            borderRadius: 12, overflow: 'hidden',
          }}>
            <ScorersHeader />
            {visible.map((entry, i) => {
              const isOwn = ownTeamId != null && String(entry.teamId) === ownTeamId;
              return (
                <MotiView
                  key={`${entry.playerId}-${entry.position}`}
                  from={{ opacity: 0, translateX: -6 }}
                  animate={{ opacity: 1, translateX: 0 }}
                  transition={{ type: 'timing', duration: 250, delay: i * 30 }}
                >
                  <ScorerRow entry={entry} isOwn={isOwn} />
                </MotiView>
              );
            })}
          </View>

          {/* Paginación */}
          {totalPages > 1 && (
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 16,
              marginTop: 14,
            }}>
              <TouchableOpacity
                onPress={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                activeOpacity={0.7}
                style={{
                  padding: 8, borderRadius: 8,
                  backgroundColor: page === 1 ? colors.border : `${colors.accent}20`,
                }}
              >
                <ChevronLeft size={18} color={page === 1 ? colors.textMuted : colors.accent} />
              </TouchableOpacity>

              <Text style={{ ...typography.body, color: colors.textMuted, fontSize: 13 }}>
                {page} / {totalPages}
              </Text>

              <TouchableOpacity
                onPress={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                activeOpacity={0.7}
                style={{
                  padding: 8, borderRadius: 8,
                  backgroundColor: page === totalPages ? colors.border : `${colors.accent}20`,
                }}
              >
                <ChevronRight size={18} color={page === totalPages ? colors.textMuted : colors.accent} />
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}
