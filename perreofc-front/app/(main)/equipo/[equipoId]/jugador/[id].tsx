/**
 * Renders the id screen in the mobile app.
 * It composes UI components, hooks and API/store data for this route.
 */

import React, { useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, router, useFocusEffect } from 'expo-router';
import { ChevronLeft, Images, User } from 'lucide-react-native';
import { useTheme } from '../../../../../src/hooks/useTheme';
import { useRole } from '../../../../../src/hooks/useRole';
import { api } from '../../../../../src/services/api';
import { typography } from '../../../../../src/theme/typography';
import { brand } from '../../../../../src/theme/colors';
import { Player } from '../../../../../src/types';

// ── Helpers ───────────────────────────────────────────────────────────────────
const POSITION_COLORS: Record<string, string> = {
  PORTERO:    '#F59E0B',
  DEFENSA:    '#3B82F6',
  MEDIOCENTRO: '#10B981',
  DELANTERO:  brand.orange,
  'DELANTERO CENTRO': brand.orange,
  STAFF:      '#8B5CF6',
};

const POSITION_LABELS: Record<string, string> = {
  PORTERO:    'Portero',
  DEFENSA:    'Defensa',
  MEDIOCENTRO: 'Centrocampista',
  DELANTERO:  'Delantero',
  'DELANTERO CENTRO': 'Delantero Centro',
};


// ── Mini stat (dentro de category cards) ─────────────────────────────────────
function MiniStat({ label, value, color }: { label: string; value: string | number; color?: string }) {
  const { colors } = useTheme();
  const valColor = color ?? colors.text;
  return (
    <View style={{ alignItems: 'center', gap: 2, flex: 1 }}>
      <Text style={{ fontFamily: 'BebasNeue_400Regular', fontSize: 22, color: valColor, lineHeight: 24 }}>{value}</Text>
      <Text style={{ ...typography.caption, color: colors.textMuted, textAlign: 'center', fontSize: 10 }}>{label}</Text>
    </View>
  );
}

// ── Big stat card ─────────────────────────────────────────────────────────────
function BigStat({ value, label, color }: { value: number; label: string; color: string }) {
  const { colors } = useTheme();
  return (
    <View style={{
      flex: 1,
      backgroundColor: colors.card,
      borderRadius: 14,
      paddingVertical: 18,
      paddingHorizontal: 8,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      gap: 6,
    }}>
      <Text style={{ fontFamily: 'BebasNeue_400Regular', fontSize: 38, color, lineHeight: 40 }}>{value}</Text>
      <Text style={{ ...typography.caption, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</Text>
    </View>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function PlayerSkeleton() {
  const { colors } = useTheme();
  const block = (w: any, h: number, r = 10) => (
    <View style={{ width: w, height: h, borderRadius: r, backgroundColor: colors.cardAlt }} />
  );
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {block('100%', 300, 0)}
      <View style={{ padding: 20, gap: 14 }}>
        {block('40%', 22)}
        {block('70%', 32)}
        {block('50%', 18)}
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
          {[1,2,3,4].map((i) => <View key={i} style={{ flex: 1 }}>{block('100%', 72, 14)}</View>)}
        </View>
        {[1,2,3,4,5,6].map((i) => (
          <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
            {block('40%', 16)}
            {block('15%', 16)}
          </View>
        ))}
      </View>
    </View>
  );
}

// ── Pantalla ──────────────────────────────────────────────────────────────────
export default function JugadorScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { canEdit } = useRole();

  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);
  const prevIdRef = useRef<string | undefined>(undefined);

  useFocusEffect(
    useCallback(() => {
      const idChanged = prevIdRef.current !== id;
      prevIdRef.current = id;
      if (idChanged || !player) {
        setLoading(true);
        setPlayer(null);
      }
      api.getPlayer(id).then((p) => {
        setPlayer(p);
        setLoading(false);
      });
    }, [id])
  );

  if (loading) return <PlayerSkeleton />;

  if (!player || !player.stats) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
        <User size={48} color={colors.textMuted} />
        <Text style={{ ...typography.body, color: colors.textMuted }}>Jugador no encontrado</Text>
        <TouchableOpacity onPress={() => router.navigate('/(main)/equipo' as any)} style={{ padding: 8 }}>
          <Text style={{ ...typography.body, color: colors.accent }}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const posKey = (player.position ?? player.positionCode ?? '').toUpperCase();
  const posColor = POSITION_COLORS[posKey] ?? POSITION_COLORS[player.positionCode?.toUpperCase() ?? ''] ?? brand.orange;
  const posLabel = POSITION_LABELS[posKey] ?? player.position ?? player.positionCode ?? '';

  const minutosStr = `${player.stats.minutes}min`;

  const currentYear = new Date().getFullYear();
  const age = player.birthYear ? currentYear - player.birthYear : null;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Header */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingTop: 12, paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        backgroundColor: colors.bg,
      }}>
        <TouchableOpacity onPress={() => router.navigate('/(main)/equipo' as any)} activeOpacity={0.7} style={{ padding: 4 }}>
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={{ ...typography.h3, color: colors.text, flex: 1, marginLeft: 8 }} numberOfLines={1}>
          {player.name} {player.lastName}
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Hero foto */}
        <View style={{ position: 'relative', backgroundColor: '#fff', alignItems: 'center' }}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => router.push(`/(main)/equipo/${player.teamId}/jugador/${id}/gallery` as any)}
          >
            <Image
              source={player.photoUrl ? { uri: player.photoUrl } : null}
              placeholder={null}
              contentFit="contain"
              cachePolicy="memory-disk"
              transition={200}
              style={{ width: 220, height: 260, backgroundColor: '#fff' }}
            />
          </TouchableOpacity>
          {player.dorsal > 0 && (
            <View style={{
              position: 'absolute', bottom: 16, left: 16,
              backgroundColor: 'rgba(0,0,0,0.65)',
              borderRadius: 12, paddingHorizontal: 12, paddingVertical: 4,
            }}>
              <Text style={{ fontFamily: 'BebasNeue_400Regular', fontSize: 28, color: '#fff', lineHeight: 32 }}>
                #{player.dorsal}
              </Text>
            </View>
          )}
          {posLabel.length > 0 && (
            <View style={{
              position: 'absolute', bottom: 16, right: 16,
              backgroundColor: `${posColor}DD`,
              borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6,
            }}>
              <Text style={{ ...typography.label, color: '#fff', fontFamily: 'Inter_700Bold' }}>{posLabel.toUpperCase()}</Text>
            </View>
          )}
        </View>
        {canEdit && (
          <View style={{
            backgroundColor: colors.cardAlt,
            paddingVertical: 6,
            paddingHorizontal: 16,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
            alignItems: 'center',
          }}>
            <Text style={{ fontSize: 11, color: colors.textMuted, fontFamily: 'Inter_400Regular' }}>
              Mantén pulsada una foto en la galería para cambiarla
            </Text>
          </View>
        )}

        <View style={{ padding: 20, gap: 20 }}>
          {/* Nombre + posición */}
          <View style={{ gap: 6 }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <Text style={{ ...typography.h1, color: colors.text, fontSize: 28, lineHeight: 34, flex: 1 }}>
                {player.name} {player.lastName}
              </Text>
              {age && (
                <View style={{ alignItems: 'flex-end', gap: 1, paddingTop: 4 }}>
                  <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 16, color: colors.text, lineHeight: 20 }}>{age} años</Text>
                  <Text style={{ ...typography.caption, color: colors.textMuted }}>{player.birthYear}</Text>
                </View>
              )}
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              {posLabel.length > 0 && (
                <View style={{ backgroundColor: `${posColor}22`, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 }}>
                  <Text style={{ ...typography.label, color: posColor, fontFamily: 'Inter_700Bold' }}>{posLabel}</Text>
                </View>
              )}
              {player.dorsal > 0 && (
                <Text style={{ ...typography.body, color: colors.textMuted }}>Dorsal #{player.dorsal}</Text>
              )}
            </View>
          </View>

          {/* Big stats */}
          {player.position !== 'staff' && (
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <BigStat value={player.stats.goals}        label="Goles"    color={brand.orange} />
              <BigStat value={player.stats.matches}      label="Partidos" color={colors.text} />
              <BigStat value={player.stats.yellowCards}  label="TA"       color="#F59E0B" />
              <BigStat value={player.stats.redCards}     label="TR"       color="#EF4444" />
            </View>
          )}


          {/* Stats compactas — 3 categorías */}
          {player.position !== 'staff' && (
            <View style={{ gap: 10 }}>

              {/* Participación */}
              <View style={{ backgroundColor: colors.card, borderRadius: 14, borderWidth: 1, borderColor: colors.border, padding: 14 }}>
                <Text style={{ ...typography.caption, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10, fontFamily: 'Inter_600SemiBold' }}>
                  Participación
                </Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
                  <MiniStat label="Partidos" value={player.stats.matches} />
                  {player.stats.matchesCalled != null && <MiniStat label="Convoc." value={player.stats.matchesCalled} />}
                  {player.stats.matchesStarting != null && <MiniStat label="Titular" value={player.stats.matchesStarting} />}
                  {player.stats.matchesSubstitute != null && <MiniStat label="Suplente" value={player.stats.matchesSubstitute} />}
                  <MiniStat label="Tiempo" value={minutosStr} />
                </View>
              </View>

              {/* Ataque */}
              <View style={{ backgroundColor: colors.card, borderRadius: 14, borderWidth: 1, borderColor: colors.border, padding: 14 }}>
                <Text style={{ ...typography.caption, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10, fontFamily: 'Inter_600SemiBold' }}>
                  Ataque
                </Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
                  <MiniStat label="Goles" value={player.stats.goals} color={brand.orange} />
                  {player.stats.goalsAvg != null && <MiniStat label="Goles/partido" value={player.stats.goalsAvg.toFixed(2)} color={brand.orange} />}
                  <MiniStat label="Asistencias" value={player.stats.assists} color={brand.blue} />
                  {player.stats.minutesAvg != null && <MiniStat label="Min/partido" value={`${player.stats.minutesAvg.toFixed(0)}'`} />}
                </View>
              </View>

              {/* Disciplina */}
              <View style={{ backgroundColor: colors.card, borderRadius: 14, borderWidth: 1, borderColor: colors.border, padding: 14 }}>
                <Text style={{ ...typography.caption, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10, fontFamily: 'Inter_600SemiBold' }}>
                  Disciplina
                </Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
                  <MiniStat label="Amarillas" value={player.stats.yellowCards} color="#F59E0B" />
                  {player.stats.doubleYellowCards != null && player.stats.doubleYellowCards > 0 && (
                    <MiniStat label="Doble amarilla" value={player.stats.doubleYellowCards} color="#F59E0B" />
                  )}
                  <MiniStat label="Rojas" value={player.stats.redCards} color="#EF4444" />
                </View>
              </View>

            </View>
          )}

          {/* Últimos partidos */}
          {player.recentMatches && player.recentMatches.length > 0 && (
            <View style={{ gap: 8 }}>
              <Text style={{ ...typography.h3, color: colors.text }}>Últimos partidos</Text>
              <View style={{ backgroundColor: colors.card, borderRadius: 16, paddingHorizontal: 16, borderWidth: 1, borderColor: colors.border }}>
                {player.recentMatches.map((m, i) => (
                  <View key={m.matchId} style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingVertical: 12,
                    borderBottomWidth: i < player.recentMatches!.length - 1 ? 1 : 0,
                    borderBottomColor: colors.border,
                  }}>
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text style={{ ...typography.caption, color: colors.text, fontFamily: 'Inter_600SemiBold' }} numberOfLines={1}>
                        {m.homeTeamName} vs {m.awayTeamName}
                      </Text>
                      <Text style={{ fontSize: 11, color: colors.textMuted, fontFamily: 'Inter_400Regular' }}>
                        {new Date(m.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                        {' · '}{m.isStarter ? 'Titular' : 'Suplente'}
                      </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end', gap: 2 }}>
                      <Text style={{ ...typography.body, color: colors.text, fontFamily: 'Inter_700Bold' }}>{m.score}</Text>
                      {m.goals > 0 && (
                        <Text style={{ fontSize: 11, color: colors.accent, fontFamily: 'Inter_600SemiBold' }}>
                          {m.goals} gol{m.goals !== 1 ? 'es' : ''}
                        </Text>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Galería */}
          <TouchableOpacity
            onPress={() => router.push(`/(main)/equipo/${player.teamId}/jugador/${id}/gallery` as any)}
            activeOpacity={0.75}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              paddingVertical: 14,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: colors.card,
            }}
          >
            <Images size={18} color={colors.textMuted} />
            <Text style={{ ...typography.body, color: colors.textMuted, fontFamily: 'Inter_600SemiBold' }}>
              Ver galería de fotos
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

    </View>
  );
}
