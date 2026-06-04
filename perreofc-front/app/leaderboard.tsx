/**
 * Renders the leaderboard screen in the mobile app.
 * It composes UI components, hooks and API/store data for this route.
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { ChevronLeft, Trophy } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MotiView } from 'moti';
import { useTheme } from '../src/hooks/useTheme';
import { useAuthStore } from '../src/store/useAuthStore';
import { api } from '../src/services/api';
import { typography } from '../src/theme/typography';
import { brand } from '../src/theme/colors';
import { haptics } from '../src/utils/haptics';
import { LeaderboardEntry } from '../src/types';
import { Avatar } from '../src/components/ui/Avatar';

const { width: SCREEN_W } = Dimensions.get('window');

type Period = 'total' | 'mensual' | 'semanal';

function getMensualSublabel(): string {
  const now = new Date();
  return now.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
    .replace(/^./, (c) => c.toUpperCase()); // "Junio 2026"
}

function getWeekMonday(): Date {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function getSemanalSublabel(): string {
  const monday = getWeekMonday();
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const sameMonth = monday.getMonth() === sunday.getMonth();
  const monthShort = (d: Date) => d.toLocaleDateString('es-ES', { month: 'short' }).replace('.', '');

  if (sameMonth) {
    return `${monday.getDate()} – ${sunday.getDate()} ${monthShort(sunday)}`;
  }
  return `${monday.getDate()} ${monthShort(monday)} – ${sunday.getDate()} ${monthShort(sunday)}`;
}

const PERIODS: { key: Period; label: string; sublabel: string }[] = [
  { key: 'total',   label: 'Total',    sublabel: 'Temporada 2025-26' },
  { key: 'mensual', label: 'Mensual',  sublabel: getMensualSublabel() },
  { key: 'semanal', label: 'Semanal',  sublabel: getSemanalSublabel() },
];

const MEDALS = ['🥇', '🥈', '🥉'];
const MEDAL_COLORS = ['#F59E0B', '#94A3B8', '#CD7F32'];

// ── Podium card ───────────────────────────────────────────────────────────────
function PodiumCard({ entry, rank }: { entry: LeaderboardEntry; rank: 1 | 2 | 3 }) {
  const { colors } = useTheme();
  const medalColor = MEDAL_COLORS[rank - 1];
  const isFirst = rank === 1;
  const avatarSize = isFirst ? 68 : 54;
  const podiumH = [120, 90, 75][rank - 1];
  const isMe = !!entry.isCurrentUser;

  return (
    <View style={{ alignItems: 'center', flex: isFirst ? 1.2 : 1, gap: 5 }}>
      <Avatar
        uri={entry.avatarUrl}
        name={entry.username}
        style={{
          width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2,
          borderWidth: isMe ? 2.5 : 2,
          borderColor: isMe ? brand.orange : medalColor,
        }}
      />
      <Text style={{ fontSize: isFirst ? 22 : 18 }}>{MEDALS[rank - 1]}</Text>
      <Text style={{ ...typography.caption, color: colors.text, fontFamily: 'Inter_700Bold', textAlign: 'center' }} numberOfLines={1}>
        {entry.username}{isMe ? ' (tú)' : ''}
      </Text>
      <Text style={{ ...typography.label, color: brand.orange, fontFamily: 'Inter_700Bold' }}>
        {entry.points.toLocaleString('es-ES')} 🍑
      </Text>
      <View style={{
        width: '90%', height: podiumH,
        backgroundColor: `${medalColor}22`,
        borderTopLeftRadius: 10, borderTopRightRadius: 10,
        borderWidth: 1.5, borderColor: `${medalColor}55`, borderBottomWidth: 0,
        alignItems: 'center', paddingTop: 10,
      }}>
        <Text style={{ fontFamily: 'BebasNeue_400Regular', fontSize: 30, color: `${medalColor}88` }}>{rank}</Text>
      </View>
    </View>
  );
}

// ── List row ──────────────────────────────────────────────────────────────────
function LeaderboardRow({ entry }: { entry: LeaderboardEntry }) {
  const { colors } = useTheme();
  const isMe = !!entry.isCurrentUser;

  return (
    <View style={{
      flexDirection: 'row', alignItems: 'center',
      paddingVertical: 11, paddingHorizontal: 16,
      backgroundColor: isMe ? `${brand.orange}12` : 'transparent',
      borderRadius: isMe ? 12 : 0,
      borderWidth: isMe ? 1 : 0,
      borderColor: isMe ? `${brand.orange}44` : 'transparent',
      marginHorizontal: isMe ? 4 : 0,
      gap: 12,
    }}>
      <Text style={{ width: 28, ...typography.body, color: isMe ? brand.orange : colors.textMuted, fontFamily: 'Inter_700Bold', textAlign: 'center' }}>
        {entry.rank}
      </Text>
      <Avatar
        uri={entry.avatarUrl}
        name={entry.username}
        size="sm"
        style={{ borderWidth: isMe ? 1.5 : 0, borderColor: brand.orange }}
      />
      <Text style={{ flex: 1, ...typography.body, color: colors.text, fontFamily: isMe ? 'Inter_700Bold' : 'Inter_400Regular' }} numberOfLines={1}>
        {entry.username}{isMe ? ' (tú)' : ''}
      </Text>
      <Text style={{ ...typography.body, color: isMe ? brand.orange : colors.textMuted, fontFamily: 'Inter_700Bold' }}>
        {entry.points.toLocaleString('es-ES')} 🍑
      </Text>
    </View>
  );
}

// ── Pantalla ──────────────────────────────────────────────────────────────────
export default function LeaderboardScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const [period, setPeriod] = useState<Period>('total');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.getLeaderboard(period)
      .then((data) => {
        const marked = data.map((e) => ({
          ...e,
          isCurrentUser: e.userId === user?.id || e.isCurrentUser,
        }));
        setEntries(marked);
      })
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  }, [period, user?.id]);

  const hasPodium = entries.length >= 3;
  const top3 = hasPodium ? entries.slice(0, 3) : [];
  const rest  = hasPodium ? entries.slice(3) : entries;
  const myEntry = entries.find((e) => e.isCurrentUser);
  const myRank  = myEntry?.rank ?? null;

  const activePeriod = PERIODS.find((p) => p.key === period)!;
  const maxW = Platform.OS === 'web' ? Math.min(SCREEN_W, 600) : SCREEN_W;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Header */}
      <View style={{
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 12,
        paddingTop: insets.top + 12, paddingBottom: 12,
        borderBottomWidth: 1, borderBottomColor: colors.border,
      }}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} style={{ padding: 4 }}>
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, marginLeft: 8 }}>
          <Trophy size={20} color={brand.orange} />
          <Text style={{ ...typography.h3, color: colors.text }}>Top Fans</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={{ alignSelf: 'center', width: maxW }}>

          {/* ── Period selector ── */}
          <View style={{
            flexDirection: 'row',
            backgroundColor: colors.cardAlt,
            borderRadius: 14,
            margin: 16,
            padding: 4,
            borderWidth: 1,
            borderColor: colors.border,
          }}>
            {PERIODS.map(({ key, label }) => {
              const active = period === key;
              return (
                <TouchableOpacity
                  key={key}
                  onPress={() => { haptics.light(); setPeriod(key); }}
                  activeOpacity={0.75}
                  style={{
                    flex: 1,
                    paddingVertical: 9,
                    borderRadius: 11,
                    backgroundColor: active ? colors.bg : 'transparent',
                    alignItems: 'center',
                    shadowColor: active ? '#000' : 'transparent',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: active ? 0.08 : 0,
                    shadowRadius: 3,
                    elevation: active ? 2 : 0,
                  }}
                >
                  <Text style={{
                    ...typography.body,
                    fontSize: 14,
                    color: active ? colors.accent : colors.textMuted,
                    fontFamily: active ? 'Inter_700Bold' : 'Inter_400Regular',
                  }}>
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Sublabel */}
          <View style={{ alignItems: 'center', marginBottom: 4 }}>
            <Text style={{ ...typography.caption, color: colors.textMuted }}>{activePeriod.sublabel}</Text>
          </View>

          {loading ? (
            <View style={{ paddingTop: 60, alignItems: 'center' }}>
              <ActivityIndicator color={colors.accent} />
            </View>
          ) : entries.length === 0 ? (
            <View style={{ paddingTop: 60, alignItems: 'center', gap: 12, paddingHorizontal: 32 }}>
              <Text style={{ fontSize: 40 }}>🍑</Text>
              <Text style={{ ...typography.h3, color: colors.text, textAlign: 'center' }}>
                Sin actividad aún
              </Text>
              <Text style={{ ...typography.body, color: colors.textMuted, textAlign: 'center' }}>
                {period === 'semanal'
                  ? 'Nadie ha acumulado puntos esta semana todavía.'
                  : period === 'mensual'
                  ? 'Nadie ha acumulado puntos este mes todavía.'
                  : 'Aún no hay fans con puntos.'}
              </Text>
            </View>
          ) : (
            <>
              {/* ── Podium ── */}
              {hasPodium && (
                <View style={{ flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 12, marginTop: 16, gap: 4 }}>
                  <PodiumCard entry={top3[1]} rank={2} />
                  <PodiumCard entry={top3[0]} rank={1} />
                  <PodiumCard entry={top3[2]} rank={3} />
                </View>
              )}

              {/* ── My position summary (if outside top 3) ── */}
              {myEntry && (myRank ?? 0) > 3 && (
                <View style={{
                  marginHorizontal: 16, marginTop: 16,
                  backgroundColor: `${brand.orange}12`,
                  borderRadius: 14, borderWidth: 1, borderColor: `${brand.orange}44`,
                  padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12,
                }}>
                  <Text style={{ ...typography.label, color: brand.orange, fontFamily: 'Inter_700Bold' }}>TU POSICIÓN</Text>
                  <Text style={{ ...typography.h3, color: brand.orange, flex: 1 }}>#{myRank}</Text>
                  <Text style={{ ...typography.body, color: brand.orange, fontFamily: 'Inter_700Bold' }}>
                    {myEntry.points.toLocaleString('es-ES')} 🍑
                  </Text>
                </View>
              )}

              {/* ── Rest of list ── */}
              <View style={{ marginTop: 12, marginHorizontal: 8 }}>
                {rest.map((entry, i) => (
                  <MotiView
                    key={`${period}-${entry.userId}`}
                    from={{ opacity: 0, translateY: 8 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ type: 'timing', duration: 280, delay: i * 40 }}
                  >
                    <LeaderboardRow entry={entry} />
                  </MotiView>
                ))}
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
