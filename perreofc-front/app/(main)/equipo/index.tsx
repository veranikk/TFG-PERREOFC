/**
 * Renders the index screen in the mobile app.
 * It composes UI components, hooks and API/store data for this route.
 */

import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Platform,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { MotiView } from 'moti';
import { CircleUserRound, Search, Users, X } from 'lucide-react-native';
import { Input } from '../../../src/components/ui/Input';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../../../src/hooks/useTheme';
import { api } from '../../../src/services/api';
import { haptics } from '../../../src/utils/haptics';
import { typography } from '../../../src/theme/typography';
import { brand } from '../../../src/theme/colors';
import { Player, StaffMember } from '../../../src/types';
import { PERREOFC_TEAM_ID as TEAM_ID } from '../../../src/config';

const { width: SCREEN_W } = Dimensions.get('window');

const POSITION_CHIP_COLORS: string[] = [
  '#F59E0B', '#3B82F6', '#10B981', brand.orange, '#EC4899', '#14B8A6', '#F97316', '#8B5CF6',
];

const STAFF_ROLE_LABELS: Record<string, string> = {
  entrenador:          'Entrenador',
  segundo_entrenador:  '2º Entrenador',
  preparador_fisico:   'Prep. Físico',
  delegado:            'Delegado',
  auxiliar:            'Auxiliar',
  otro:                'Otro',
};

// ── Skeleton ──────────────────────────────────────────────────────────────────
function Skeleton() {
  const { colors } = useTheme();
  const isWeb = Platform.OS === 'web';
  const maxW = isWeb ? Math.min(SCREEN_W, 800) : SCREEN_W;
  const COLS = isWeb ? 3 : 2;
  const cardW = (maxW - 32 - 10 * (COLS - 1)) / COLS;

  const block = (w: any, h: number, r = 10) => (
    <View style={{ width: w, height: h, borderRadius: r, backgroundColor: colors.cardAlt }} />
  );
  const card = () => (
    <View style={{ width: cardW, backgroundColor: colors.card, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: colors.border }}>
      {/* Imagen con mismo aspectRatio que la tarjeta real */}
      <View style={{ width: '100%', aspectRatio: 3 / 4, backgroundColor: colors.cardAlt }} />
      <View style={{ padding: 10, gap: 8 }}>
        {block('70%', 13)}
        {/* Fila de 3 stats: GOL / AST / PJ */}
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 2 }}>
          {[1, 2, 3].map((i) => (
            <View key={i} style={{ alignItems: 'center', gap: 3 }}>
              {block(22, 12)}
              {block(18, 8)}
            </View>
          ))}
        </View>
      </View>
    </View>
  );
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingVertical: 12 }}>
        {[80, 80, 70, 70, 90, 50].map((w, i) => <View key={i}>{block(w, 32, 999)}</View>)}
      </View>
      <View style={{ alignSelf: 'center', width: maxW, paddingHorizontal: 16, flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        {Array.from({ length: COLS * 3 }).map((_, i) => (
          <View key={i}>{card()}</View>
        ))}
      </View>
    </View>
  );
}

// ── Player Card ───────────────────────────────────────────────────────────────
function PlayerCard({ player, posColor }: { player: Player; posColor: string }) {
  const { colors } = useTheme();
  const posLabel = player.positionCode ?? player.position ?? '';
  const isWeb = Platform.OS === 'web';
  const maxW = isWeb ? Math.min(SCREEN_W, 800) : SCREEN_W;
  const COLS = isWeb ? 3 : 2;
  const cardW = (maxW - 32 - 10 * (COLS - 1)) / COLS;

  return (
    <TouchableOpacity
      onPress={() => router.push(`/(main)/equipo/${TEAM_ID}/jugador/${player.id}` as any)}
      activeOpacity={0.85}
      style={{
        width: cardW,
        backgroundColor: colors.card,
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <View style={{ position: 'relative', backgroundColor: colors.cardAlt }}>
        <Image
          source={player.photoUrl ? { uri: player.photoUrl } : null}
          placeholder={null}
          contentFit="cover"
          contentPosition="top"
          cachePolicy="memory-disk"
          style={{ width: '100%', aspectRatio: 3 / 4 }}
          transition={200}
        />
        {player.dorsal > 0 && (
          <View style={{ position: 'absolute', top: 8, left: 8, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 8, paddingHorizontal: 7, paddingVertical: 2 }}>
            <Text style={{ ...typography.label, color: '#fff', fontFamily: 'Inter_700Bold' }}>{player.dorsal}</Text>
          </View>
        )}
        {posLabel.length > 0 && (
          <View style={{ position: 'absolute', top: 8, right: 8, backgroundColor: `${posColor}CC`, borderRadius: 8, paddingHorizontal: 7, paddingVertical: 2 }}>
            <Text style={{ ...typography.label, color: '#fff', fontFamily: 'Inter_700Bold' }}>{posLabel}</Text>
          </View>
        )}
      </View>

      <View style={{ padding: 10, gap: 2 }}>
        <Text style={{ ...typography.body, color: colors.text, fontFamily: 'Inter_700Bold', fontSize: 13 }} numberOfLines={1}>
          {player.name} {player.lastName}
        </Text>
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ ...typography.label, color: colors.accent, fontFamily: 'Inter_700Bold' }}>{player.stats.goals}</Text>
            <Text style={{ fontSize: 9, color: colors.textMuted, fontFamily: 'Inter_400Regular' }}>GOL</Text>
          </View>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ ...typography.label, color: brand.blue, fontFamily: 'Inter_700Bold' }}>{player.stats.assists}</Text>
            <Text style={{ fontSize: 9, color: colors.textMuted, fontFamily: 'Inter_400Regular' }}>AST</Text>
          </View>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ ...typography.label, color: colors.textMuted, fontFamily: 'Inter_700Bold' }}>{player.stats.matches}</Text>
            <Text style={{ fontSize: 9, color: colors.textMuted, fontFamily: 'Inter_400Regular' }}>PJ</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ── Staff Card ────────────────────────────────────────────────────────────────
function StaffCard({ member }: { member: StaffMember }) {
  const { colors } = useTheme();
  const isWeb = Platform.OS === 'web';
  const maxW = isWeb ? Math.min(SCREEN_W, 800) : SCREEN_W;
  const COLS = isWeb ? 3 : 2;
  const cardW = (maxW - 32 - 10 * (COLS - 1)) / COLS;
  const roleLabel = STAFF_ROLE_LABELS[member.role] ?? member.role ?? 'Staff';

  const staffParams = {
    id: member.id,
    fullName: member.fullName,
    photoUrl: member.photoUrl ?? '',
    role: member.role,
    roleDescription: member.roleDescription ?? '',
  };

  return (
    <View style={{ width: cardW, backgroundColor: colors.card, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: colors.border }}>
      <TouchableOpacity
        onPress={() => router.push({ pathname: '/(main)/staff/[id]' as any, params: staffParams })}
        activeOpacity={0.85}
      >
        <View style={{ position: 'relative', backgroundColor: colors.cardAlt }}>
          <Image
            source={member.photoUrl ? { uri: member.photoUrl } : null}
            placeholder={null}
            contentFit="cover"
            contentPosition="top"
            cachePolicy="memory-disk"
            style={{ width: '100%', aspectRatio: 3 / 4 }}
            transition={200}
          />
          <View style={{ position: 'absolute', top: 8, right: 8, backgroundColor: '#8B5CF6CC', borderRadius: 8, paddingHorizontal: 7, paddingVertical: 2 }}>
            <Text style={{ ...typography.label, color: '#fff', fontFamily: 'Inter_700Bold' }}>STAFF</Text>
          </View>
        </View>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => router.push({ pathname: '/(main)/staff/[id]' as any, params: staffParams })}
        activeOpacity={0.85}
      >
        <View style={{ padding: 10, gap: 2 }}>
          <Text style={{ ...typography.body, color: colors.text, fontFamily: 'Inter_700Bold', fontSize: 13 }} numberOfLines={1}>
            {member.fullName}
          </Text>
          <Text style={{ ...typography.caption, color: colors.textMuted }} numberOfLines={1}>
            {roleLabel}
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

// ── Pantalla ──────────────────────────────────────────────────────────────────
export default function EquipoScreen() {
  const { colors } = useTheme();
  const [players, setPlayers] = useState<Player[]>([]);
  const [staff, setStaff]     = useState<StaffMember[]>([]);
  const [posTab, setPosTab]   = useState<string>('todos');
  const [search, setSearch]   = useState('');
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      Promise.all([api.getPlayers(TEAM_ID), api.getStaff(TEAM_ID)]).then(([p, s]) => {
        setPlayers(p);
        setStaff(s);
        setLoading(false);
      });
    }, [])
  );

  // Dynamic chips: unique positions from DB + fixed 'todos' and 'staff'
  const STAFF_ROLE_ORDER = ['entrenador', 'segundo_entrenador', 'preparador_fisico', 'delegado', 'auxiliar', 'otro'];

  // Mapea cualquier valor de posición a un índice de orden (portero=0, defensa=1, medio=2, delantero=3)
  const posIndex = (pos: string): number => {
    const p = (pos ?? '').toLowerCase();
    if (['goalkeeper', 'portero', 'por', 'gk', 'pt'].includes(p)) return 0;
    if (['defender', 'defensa', 'def', 'cb', 'lb', 'rb', 'df'].includes(p)) return 1;
    if (['midfielder', 'mediocentro', 'medio', 'med', 'mf', 'mc', 'mco'].includes(p)) return 2;
    if (['forward', 'delantero', 'del', 'fw', 'st', 'cf', 'lw', 'rw'].includes(p)) return 3;
    return 999;
  };

  const uniquePositions: string[] = Array.from(new Set(players.map((p) => p.position).filter(Boolean)))
    .sort((a, b) => posIndex(a) - posIndex(b));
  const posColorMap: Record<string, string> = {};
  uniquePositions.forEach((pos, i) => {
    posColorMap[pos] = POSITION_CHIP_COLORS[i % POSITION_CHIP_COLORS.length];
  });

  const staffSorted: StaffMember[] = [...staff].sort((a, b) => {
    const ia = STAFF_ROLE_ORDER.indexOf(a.role ?? '');
    const ib = STAFF_ROLE_ORDER.indexOf(b.role ?? '');
    return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
  });

  const norm = (s: string) =>
    s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const q = norm(search.trim());

  const playersSorted: Player[] = posTab === 'todos'
    ? [...players].sort((a, b) => posIndex(a.position ?? '') - posIndex(b.position ?? ''))
    : players;

  const filteredPlayers = (posTab === 'staff'
    ? []
    : posTab === 'todos'
    ? playersSorted
    : players.filter((p) => p.position === posTab)
  ).filter((p) =>
    !q || norm(`${p.name} ${p.lastName}`).includes(q) || String(p.dorsal).startsWith(q)
  );

  const showStaff = posTab === 'todos' || posTab === 'staff';

  const filteredStaff = showStaff
    ? staffSorted.filter((m) => !q || norm(m.fullName).includes(q))
    : [];

  const isWeb = Platform.OS === 'web';
  const maxW  = isWeb ? Math.min(SCREEN_W, 800) : SCREEN_W;

  if (loading) return <Skeleton />;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 90 }}>
        {/* ── Search bar ── */}
        <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
          <Input
            placeholder="Buscar jugador o staff..."
            value={search}
            onChangeText={setSearch}
            autoCapitalize="none"
            leftIcon={<Search size={18} color={colors.textMuted} />}
            rightIcon={
              search.length > 0 ? (
                <TouchableOpacity onPress={() => setSearch('')} activeOpacity={0.7}>
                  <X size={18} color={colors.textMuted} />
                </TouchableOpacity>
              ) : undefined
            }
          />
        </View>

        {/* ── Position chips (dynamic) ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12, gap: 8 }}
        >
          {/* Todos */}
          {([ { key: 'todos', label: 'Todos', count: players.length + staff.length, color: colors.accent } ] as { key: string; label: string; count: number; color: string }[])
            .concat(
              uniquePositions.map((pos) => ({
                key: pos,
                label: pos.charAt(0) + pos.slice(1).toLowerCase(),
                count: players.filter((p) => p.position === pos).length,
                color: posColorMap[pos],
              }))
            )
            .concat(staff.length > 0 ? [{ key: 'staff', label: 'Staff', count: staff.length, color: '#8B5CF6' }] : [])
            .map(({ key, label, count, color }) => {
              const active = posTab === key;
              return (
                <TouchableOpacity
                  key={key}
                  onPress={() => { haptics.light(); setPosTab(key); }}
                  activeOpacity={0.75}
                  style={{
                    flexDirection: 'row', alignItems: 'center', gap: 5,
                    paddingHorizontal: 14, paddingVertical: 7,
                    borderRadius: 9999,
                    backgroundColor: active ? color : colors.cardAlt,
                    borderWidth: 1,
                    borderColor: active ? color : colors.border,
                  }}
                >
                  <Text style={{
                    ...typography.label,
                    color: active ? '#fff' : colors.textMuted,
                    fontFamily: active ? 'Inter_700Bold' : 'Inter_400Regular',
                  }}>
                    {label}
                  </Text>
                  <View style={{
                    backgroundColor: active ? 'rgba(255,255,255,0.25)' : `${color}22`,
                    borderRadius: 9999, width: 20, height: 20, alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Text style={{ fontSize: 10, color: active ? '#fff' : color, fontFamily: 'Inter_700Bold' }}>{count}</Text>
                  </View>
                </TouchableOpacity>
              );
            })
          }
        </ScrollView>

        {/* ── Player + Staff grid ── */}
        {filteredPlayers.length === 0 && filteredStaff.length === 0 ? (
          <View style={{ alignItems: 'center', marginTop: 40, gap: 8 }}>
            {q ? (
              <>
                <Search size={40} color={colors.textMuted} />
                <Text style={{ ...typography.body, color: colors.textMuted }}>Sin resultados para "{search.trim()}"</Text>
              </>
            ) : !showStaff ? (
              <>
                <Ionicons name="football" size={40} color={colors.textMuted} />
                <Text style={{ ...typography.body, color: colors.textMuted }}>Sin jugadores en esta posición</Text>
              </>
            ) : (
              <>
                <Users size={40} color={colors.textMuted} />
                <Text style={{ ...typography.body, color: colors.textMuted }}>Sin miembros de staff</Text>
              </>
            )}
          </View>
        ) : (
          <View style={{ alignSelf: 'center', width: maxW, paddingHorizontal: 16, flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {filteredPlayers.map((player, i) => (
              <MotiView
                key={player.id}
                from={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'timing', duration: 260, delay: i * 50 }}
              >
                <PlayerCard player={player} posColor={posColorMap[player.position] ?? brand.orange} />
              </MotiView>
            ))}
            {filteredStaff.map((member, i) => (
              <MotiView
                key={`staff-${member.id}`}
                from={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'timing', duration: 260, delay: (filteredPlayers.length + i) * 50 }}
              >
                <StaffCard member={member} />
              </MotiView>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
