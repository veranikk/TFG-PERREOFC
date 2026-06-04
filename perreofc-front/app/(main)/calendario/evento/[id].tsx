/**
 * Renders the id screen in the mobile app.
 * It composes UI components, hooks and API/store data for this route.
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, router, useFocusEffect } from 'expo-router';
import { ChevronLeft, MapPin, Calendar, Trash2, Pencil, Star, ClipboardList, LockKeyhole } from 'lucide-react-native';
import { haptics } from '../../../../src/utils/haptics';
import { format, parseISO, isBefore, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { useTheme } from '../../../../src/hooks/useTheme';
import { useRole } from '../../../../src/hooks/useRole';
import { useAuth } from '../../../../src/hooks/useAuth';
import { useAuthStore } from '../../../../src/store/useAuthStore';
import { useEventsStore } from '../../../../src/store/useEventsStore';
import { api } from '../../../../src/services/api';
import { api as newApi } from '../../../../src/services/api/index';
import { MatchHero } from '../../../../src/components/match/MatchHero';
import { Lineup } from '../../../../src/components/match/Lineup';
import { Stats } from '../../../../src/components/match/Stats';
import { Pill } from '../../../../src/components/ui/Pill';
import { Button } from '../../../../src/components/ui/Button';
import { Card } from '../../../../src/components/ui/Card';
import { typography } from '../../../../src/theme/typography';
import { Event, Match, EventType } from '../../../../src/types';
import type { SquadCall } from '../../../../src/services/api/modules/squadCalls';
import { brand, state } from '../../../../src/theme/colors';

// ── Helpers ───────────────────────────────────────────────────────────────────
type MatchTab = 'resumen' | 'alineacion' | 'estadisticas';

const TYPE_COLORS: Record<EventType, string> = {
  match:    brand.orange,
  friendly: brand.blue,
  training: brand.green,
  medical:  state.warning,
  dinner:   '#8B5CF6',
  meeting:  brand.blue,
  other:    brand.grey,
};
const TYPE_LABELS: Record<EventType, string> = {
  match:    'PARTIDO',
  friendly: 'AMISTOSO',
  training: 'ENTRENAMIENTO',
  medical:  'MÉDICO',
  dinner:   'CENA',
  meeting:  'REUNIÓN',
  other:    'EVENTO',
};

function formatLongDate(dateStr: string, time?: string): string {
  try {
    const d = parseISO(dateStr);
    const datePart = format(d, "EEEE d 'de' MMMM 'de' yyyy", { locale: es });
    return time ? `${datePart}, ${time}` : datePart;
  } catch {
    return dateStr;
  }
}

function isPastEvent(dateStr: string): boolean {
  try {
    return isBefore(startOfDay(parseISO(dateStr)), startOfDay(new Date()));
  } catch {
    return false;
  }
}

// ── Skeleton loader ───────────────────────────────────────────────────────────
function SkeletonBlock({ width, height, style }: { width?: number | string; height: number; style?: any }) {
  const { colors } = useTheme();
  return (
    <View style={[{
      width: width ?? '100%',
      height,
      borderRadius: 10,
      backgroundColor: colors.cardAlt,
    }, style]} />
  );
}

function EventSkeleton() {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Fake header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <SkeletonBlock width={24} height={24} style={{ borderRadius: 12 }} />
        <SkeletonBlock height={20} style={{ flex: 1 }} />
      </View>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        <SkeletonBlock width={80} height={24} style={{ borderRadius: 9999 }} />
        <SkeletonBlock height={18} />
        <SkeletonBlock width="60%" height={18} />
        <SkeletonBlock height={160} style={{ borderRadius: 16, marginTop: 8 }} />
        <SkeletonBlock height={44} style={{ borderRadius: 12 }} />
        <SkeletonBlock height={220} style={{ borderRadius: 16 }} />
      </ScrollView>
    </View>
  );
}

// ── Modal de confirmación (sin Alert.alert → funciona en web) ─────────────────
function ConfirmModal({
  visible,
  title,
  message,
  confirmLabel,
  onCancel,
  onConfirm,
  destructive,
  loading,
}: {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
  destructive?: boolean;
  loading?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 32 }}>
        <View style={{ backgroundColor: colors.card, borderRadius: 20, padding: 24, gap: 14 }}>
          <Text style={{ ...typography.h3, color: colors.text }}>{title}</Text>
          <Text style={{ ...typography.body, color: colors.textMuted }}>{message}</Text>
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
            <Button label="Cancelar" variant="ghost" onPress={onCancel} style={{ flex: 1 }} disabled={loading} />
            <Button
              label={loading ? 'Eliminando...' : confirmLabel}
              loading={loading}
              variant={destructive ? 'destructive' : 'primary'}
              onPress={onConfirm}
              style={{ flex: 1 }}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ── Bloque de apuesta con monedas ─────────────────────────────────────────────
function BetBlock({ match }: { match: Match }) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const addPoints = useAuthStore((s) => s.addPoints);
  const [bet, setBet] = useState<'home' | 'draw' | 'away' | null>(null);
  const [amount, setAmount] = useState('50');
  const [confirmed, setConfirmed] = useState(false);

  const balance  = user?.points ?? 0;
  const betAmt   = Math.min(Math.max(1, parseInt(amount) || 0), balance);

  // Multiplicadores simples
  const multipliers: Record<'home' | 'draw' | 'away', number> = { home: 2, draw: 3, away: 2 };
  const payout = bet ? betAmt * multipliers[bet] : 0;

  const options: Array<{ key: 'home' | 'draw' | 'away'; label: string }> = [
    { key: 'home', label: `${match.homeTeam}` },
    { key: 'draw', label: 'Empate' },
    { key: 'away', label: `${match.awayTeam}` },
  ];

  const handleConfirm = () => {
    haptics.success();
    addPoints(-betAmt);
    setConfirmed(true);
  };

  if (confirmed) {
    return (
      <Card>
        <View style={{ gap: 8, alignItems: 'center' }}>
          <Text style={{ fontSize: 32 }}>🍑</Text>
          <Text style={{ ...typography.body, color: colors.text, fontFamily: 'Inter_700Bold', textAlign: 'center' }}>
            ¡Apuesta registrada!
          </Text>
          <Text style={{ ...typography.caption, color: colors.textMuted, textAlign: 'center' }}>
            Has apostado {betAmt} 🍑 por «{options.find(o => o.key === bet)?.label}».{'\n'}
            Si aciertas ganarás {payout} 🍑.
          </Text>
        </View>
      </Card>
    );
  }

  return (
    <Card>
      <View style={{ gap: 12 }}>
        {/* Header con saldo */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={{ fontSize: 18 }}>🍑</Text>
            <Text style={{ ...typography.h3, color: colors.text }}>HACER APUESTA</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: `${colors.accent}18`, borderRadius: 9999, paddingHorizontal: 10, paddingVertical: 4 }}>
            <Text style={{ ...typography.label, color: colors.accent, fontFamily: 'Inter_700Bold' }}>{balance}</Text>
            <Text style={{ fontSize: 12 }}>🍑</Text>
          </View>
        </View>

        {/* Opciones */}
        <View style={{ gap: 8 }}>
          {options.map((opt) => {
            const mult = multipliers[opt.key];
            const active = bet === opt.key;
            return (
              <TouchableOpacity
                key={opt.key}
                onPress={() => setBet(opt.key)}
                style={{
                  padding: 12,
                  borderRadius: 12,
                  borderWidth: 2,
                  borderColor: active ? colors.accent : colors.border,
                  backgroundColor: active ? `${colors.accent}18` : colors.cardAlt,
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Text style={{ ...typography.body, color: active ? colors.accent : colors.text, fontFamily: active ? 'Inter_600SemiBold' : 'Inter_400Regular' }}>
                  {opt.label}
                </Text>
                <Text style={{ ...typography.caption, color: colors.textMuted }}>×{mult}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Cantidad a apostar */}
        {bet && (
          <View style={{ gap: 8 }}>
            <Text style={{ ...typography.label, color: colors.textMuted }}>CANTIDAD A APOSTAR (máx. {balance} 🍑)</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: colors.cardAlt,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: colors.border,
                paddingHorizontal: 14,
                height: 48,
              }}>
                <TextInput
                  value={amount}
                  onChangeText={(t) => setAmount(t.replace(/[^0-9]/g, ''))}
                  keyboardType="numeric"
                  style={{
                    flex: 1,
                    ...typography.body,
                    color: colors.text,
                    ...(Platform.OS === 'web' ? { outline: 'none' } as any : {}),
                  }}
                  placeholderTextColor={colors.textMuted}
                />
                <Text style={{ ...typography.body, color: colors.textMuted }}>🍑</Text>
              </View>
              <View style={{ backgroundColor: `${colors.accent}18`, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12 }}>
                <Text style={{ ...typography.label, color: colors.accent, fontFamily: 'Inter_700Bold' }}>
                  → {payout} 🍑
                </Text>
              </View>
            </View>
            <Button
              label={`Apostar ${betAmt} 🍑`}
              fullWidth
              disabled={betAmt <= 0 || balance <= 0}
              onPress={handleConfirm}
            />
          </View>
        )}
      </View>
    </Card>
  );
}

// ── Bloque votar MVP (aficionado + partido terminado) ─────────────────────────
function MvpVoteBlock({ match }: { match: Match }) {
  const { colors } = useTheme();
  const addPoints = useAuthStore((s) => s.addPoints);
  const [voted, setVoted] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  const perreoIsHome = match.homeTeam === 'Perreo FC';
  const players = perreoIsHome ? (match.lineup?.home ?? []) : (match.lineup?.away ?? []);

  if (players.length === 0) return null;

  const MVP_REWARD = 50;

  const handleVote = () => {
    haptics.success();
    addPoints(MVP_REWARD);
    setConfirmed(true);
  };

  if (confirmed) {
    return (
      <Card>
        <View style={{ gap: 6, alignItems: 'center' }}>
          <Star size={32} color={brand.orange} />
          <Text style={{ ...typography.body, color: colors.text, fontFamily: 'Inter_700Bold', textAlign: 'center' }}>
            ¡Gracias por votar!
          </Text>
          <Text style={{ ...typography.caption, color: colors.textMuted, textAlign: 'center' }}>
            Has votado a {players.find(p => p.playerId === voted)?.name} como MVP.{'\n'}
            Has ganado {MVP_REWARD} 🍑.
          </Text>
        </View>
      </Card>
    );
  }

  return (
    <Card>
      <View style={{ gap: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Star size={18} color={brand.orange} />
          <Text style={{ ...typography.h3, color: colors.text }}>VOTAR MVP</Text>
          <View style={{ marginLeft: 'auto' as any, backgroundColor: `${colors.accent}18`, borderRadius: 9999, paddingHorizontal: 8, paddingVertical: 3 }}>
            <Text style={{ ...typography.caption, color: colors.accent, fontFamily: 'Inter_700Bold' }}>+{MVP_REWARD} 🍑</Text>
          </View>
        </View>
        <Text style={{ ...typography.caption, color: colors.textMuted }}>¿Quién fue el mejor del partido?</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {players.map((p) => (
            <TouchableOpacity
              key={p.playerId}
              onPress={() => setVoted(p.playerId)}
              style={{
                paddingHorizontal: 12, paddingVertical: 8,
                borderRadius: 10,
                borderWidth: 2,
                borderColor: voted === p.playerId ? colors.accent : colors.border,
                backgroundColor: voted === p.playerId ? `${colors.accent}18` : colors.cardAlt,
                flexDirection: 'row', alignItems: 'center', gap: 6,
              }}
            >
              <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: voted === p.playerId ? colors.accent : colors.textMuted, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 10, color: '#fff', fontFamily: 'Inter_700Bold' }}>{p.dorsal}</Text>
              </View>
              <Text style={{ ...typography.caption, color: voted === p.playerId ? colors.accent : colors.text, fontFamily: 'Inter_500Medium' }}>
                {p.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {voted && <Button label="Enviar voto" fullWidth onPress={handleVote} />}
      </View>
    </Card>
  );
}

// ── Bloque convocatoria (jugador) — conectado a API ───────────────────────────
function ConvocatoriaBlock({ match, playerId }: { match: Match; playerId: number | null }) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [squadCall, setSquadCall] = useState<SquadCall | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!match.id) return;
    newApi.squadCalls.getSquadCall(match.id)
      .then((res: any) => setSquadCall(res ?? null))
      .catch(() => setSquadCall(null))
      .finally(() => setLoading(false));
  }, [match.id]);

  if (loading) return <Card><ActivityIndicator color={colors.accent} /></Card>;

  if (!squadCall) {
    return (
      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Text style={{ fontSize: 20 }}>⏳</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ ...typography.label, color: colors.text }}>CONVOCATORIA PENDIENTE</Text>
            <Text style={{ ...typography.caption, color: colors.textMuted, marginTop: 2 }}>
              El staff publicará la convocatoria antes del partido.
            </Text>
          </View>
        </View>
      </Card>
    );
  }

  const effectivePlayerId = playerId ?? user?.playerId ?? null;
  const isCalled = effectivePlayerId != null
    ? squadCall.players.some((p) => p.playerId === effectivePlayerId)
    : false;

  return (
    <Card>
      <View style={{ gap: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <ClipboardList size={20} color={colors.text} />
          <Text style={{ ...typography.h3, color: colors.text }}>MI CONVOCATORIA</Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: isCalled ? '#22C55E' : '#EF4444' }} />
          <Text style={{ ...typography.body, color: isCalled ? '#22C55E' : '#EF4444', fontFamily: 'Inter_600SemiBold' }}>
            {isCalled ? 'Estás convocado' : 'No estás convocado'}
          </Text>
        </View>

        {isCalled && (
          <View style={{ gap: 6 }}>
            <Text style={{ ...typography.caption, color: colors.textMuted }}>
              Equipación:{' '}
              <Text style={{ color: colors.text, fontFamily: 'Inter_500Medium' }}>
                {squadCall.kitSlot === 'titular' ? 'Titular' : 'Alternativa'}
              </Text>
            </Text>
            {squadCall.reportTime && (
              <Text style={{ ...typography.caption, color: colors.textMuted }}>
                Presentación:{' '}
                <Text style={{ color: colors.text, fontFamily: 'Inter_500Medium' }}>{squadCall.reportTime}</Text>
              </Text>
            )}
            {squadCall.location && (
              <Text style={{ ...typography.caption, color: colors.textMuted }}>
                Lugar:{' '}
                <Text style={{ color: colors.text, fontFamily: 'Inter_500Medium' }}>{squadCall.location}</Text>
              </Text>
            )}
            {squadCall.kit && (
              <View style={{ marginTop: 8 }}>
                <Text style={{ ...typography.label, color: colors.textMuted, marginBottom: 6 }}>EQUIPACIÓN</Text>
                {[
                  { label: 'Camiseta',   color: squadCall.kit.shirtColor  ?? squadCall.kit.shirtColor1 },
                  { label: 'Pantalón',   color: squadCall.kit.shortsColor ?? squadCall.kit.shortsColor1 },
                  { label: 'Calcetines', color: squadCall.kit.socksColor  ?? squadCall.kit.socksColor1 },
                ].map((item) => (
                  <View key={item.label} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                    <View style={{ width: 28, height: 28, borderRadius: 6, backgroundColor: item.color ?? '#888', borderWidth: 1, borderColor: colors.border, marginRight: 10 }} />
                    <Text style={{ ...typography.caption, color: colors.textMuted, flex: 1 }}>{item.label}</Text>
                    <Text style={{ ...typography.caption, color: colors.text, fontFamily: 'Inter_600SemiBold' }}>{item.color ?? '—'}</Text>
                  </View>
                ))}
                <View style={{ marginTop: 10, padding: 10, borderRadius: 10, backgroundColor: colors.cardAlt, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={{ ...typography.caption, color: colors.textMuted }}>Resumen:</Text>
                  <Text style={{ ...typography.caption, color: colors.text, fontFamily: 'Inter_600SemiBold' }}>
                    {[squadCall.kit.shirtColor, squadCall.kit.shortsColor, squadCall.kit.socksColor].filter(Boolean).join(' – ')}
                  </Text>
                </View>
              </View>
            )}
          </View>
        )}
      </View>
    </Card>
  );
}

// ── Tab bar de partido ────────────────────────────────────────────────────────
function MatchTabBar({ active, onChange }: { active: MatchTab; onChange: (t: MatchTab) => void }) {
  const { colors } = useTheme();
  const tabs: Array<{ key: MatchTab; label: string }> = [
    { key: 'resumen',      label: 'Resumen' },
    { key: 'alineacion',   label: 'Alineación' },
    { key: 'estadisticas', label: 'Estadísticas' },
  ];
  return (
    <View style={{ flexDirection: 'row', backgroundColor: colors.cardAlt, borderRadius: 12, padding: 4 }}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.key}
          onPress={() => onChange(tab.key)}
          style={{ flex: 1, paddingVertical: 8, borderRadius: 9, backgroundColor: active === tab.key ? colors.card : 'transparent', alignItems: 'center' }}
          activeOpacity={0.7}
        >
          <Text style={{ ...typography.label, color: active === tab.key ? colors.text : colors.textMuted, fontFamily: active === tab.key ? 'Inter_600SemiBold' : 'Inter_500Medium' }}>
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ── Pantalla principal ────────────────────────────────────────────────────────
export default function EventoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { isAficionado, isPlayer, isSuperAdmin, canEdit } = useRole();
  const { user } = useAuth();
  const deleteEventFromStore = useEventsStore((s) => s.deleteEvent);

  const [event, setEvent] = useState<Event | null>(null);
  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<MatchTab>('resumen');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Recarga el evento cada vez que la pantalla gana foco (incluye volver de edición)
  useFocusEffect(
    useCallback(() => {
      if (!id) return;
      setLoading(true);
      setEvent(null);
      setMatch(null);
      setActiveTab('resumen');

      api.getEvent(id).then(async (e) => {
        setEvent(e);
        if (e?.matchId) {
          const m = await api.getMatch(e.matchId);
          setMatch(m);
        }
        setLoading(false);
      });
    }, [id])
  );

  const handleDelete = async () => {
    if (!event) return;
    setDeleting(true);
    try {
      await api.deleteEvent(event.id);
      haptics.error();
      deleteEventFromStore(event.id);
      setShowDeleteConfirm(false);
      router.back();
    } catch (e: any) {
      setShowDeleteConfirm(false);
      setDeleteError(e?.data?.error ?? 'No se pudo eliminar el evento. Inténtalo de nuevo.');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <EventSkeleton />;

  if (!event) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
        <Text style={{ fontSize: 48 }}>📭</Text>
        <Text style={{ ...typography.body, color: colors.textMuted }}>Evento no encontrado</Text>
        <Button label="Volver" variant="ghost" onPress={() => router.back()} />
      </View>
    );
  }

  const accentColor  = TYPE_COLORS[event.type];
  const isMatchEvent = event.type === 'match' || event.type === 'friendly';
  const isPast       = isPastEvent(event.date);
  const canEditThis  = canEdit && !isPast;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Barra superior */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingTop: 12, paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        backgroundColor: colors.bg,
      }}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} style={{ padding: 4 }}>
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={{ ...typography.h3, color: colors.text, flex: 1, marginLeft: 8 }} numberOfLines={1}>
          {event.title}
        </Text>
        {/* Lápiz solo si es futuro */}
        {canEditThis && (
          <TouchableOpacity
            activeOpacity={0.7}
            style={{ padding: 4 }}
            onPress={() => router.push(`/calendario/nueva?id=${event.id}` as any)}
          >
            <Pencil size={20} color={colors.textMuted} />
          </TouchableOpacity>
        )}
        {/* Borrar solo superadmin */}
        {isSuperAdmin && (
          <TouchableOpacity
            onPress={() => setShowDeleteConfirm(true)}
            activeOpacity={0.7}
            style={{ padding: 4, marginLeft: 4 }}
          >
            <Trash2 size={20} color="#EF4444" />
          </TouchableOpacity>
        )}
      </View>

      {deleteError && (
        <View style={{
          margin: 16,
          backgroundColor: '#EF444420',
          borderRadius: 12,
          borderWidth: 1,
          borderColor: '#EF4444',
          padding: 12,
        }}>
          <Text style={{ ...typography.body, color: '#EF4444', textAlign: 'center' }}>{deleteError}</Text>
        </View>
      )}

      {canEdit && isPast && (
        <View style={{
          marginHorizontal: 16, marginTop: 12,
          backgroundColor: `${colors.textMuted}18`,
          borderRadius: 10,
          borderWidth: 1,
          borderColor: colors.border,
          paddingHorizontal: 12, paddingVertical: 8,
          flexDirection: 'row', alignItems: 'center', gap: 8,
        }}>
          <LockKeyhole size={14} color={colors.textMuted} />
          <Text style={{ ...typography.caption, color: colors.textMuted, flex: 1 }}>
            Este evento ya ha pasado y no se puede editar.
          </Text>
        </View>
      )}

      <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 32 }}>
        {/* Meta del evento */}
        <View style={{ gap: 10 }}>
          <Pill label={TYPE_LABELS[event.type]} variant="custom" color={accentColor} bgColor={`${accentColor}22`} />
          <View style={{ gap: 6 }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
              <Calendar size={15} color={colors.textMuted} />
              <Text style={{ ...typography.body, color: colors.text, flex: 1, textTransform: 'capitalize' }}>
                {formatLongDate(event.date, event.time)}
              </Text>
            </View>
            {event.location && (
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
                <MapPin size={15} color={colors.textMuted} />
                <Text style={{ ...typography.body, color: colors.text, flex: 1 }}>{event.location}</Text>
              </View>
            )}
          </View>
          {event.description && (
            <Text style={{ ...typography.body, color: colors.textMuted, lineHeight: 22 }}>
              {event.description}
            </Text>
          )}
        </View>

        {/* Contenido de partido */}
        {isMatchEvent && match && (
          <View style={{ gap: 16 }}>
            <MatchHero match={match} />
            <MatchTabBar active={activeTab} onChange={setActiveTab} />

            {activeTab === 'resumen' && match.weather && (
              <Card>
                <Text style={{ ...typography.label, color: colors.textMuted, marginBottom: 6 }}>CONDICIONES</Text>
                <Text style={{ ...typography.body, color: colors.text }}>
                  {match.weather.icon} {match.weather.description} · {match.weather.temp}°C · {match.weather.humidity}% · {match.weather.wind} km/h
                </Text>
              </Card>
            )}

            {activeTab === 'alineacion' && (
              <Card>
                <Lineup match={match} />
              </Card>
            )}

            {activeTab === 'estadisticas' && (
              <Card>
                <Stats match={match} />
              </Card>
            )}
          </View>
        )}

        {/* Bloques por rol */}
        {isMatchEvent && match && (
          <>
            {isAficionado && match.status === 'upcoming' && <BetBlock match={match} />}
            {isAficionado && (match.status === 'finished' || match.status === 'live') && <MvpVoteBlock match={match} />}
            {isPlayer && <ConvocatoriaBlock match={match} playerId={user?.playerId ?? null} />}
          </>
        )}
      </ScrollView>

      {/* Modal confirmación de borrado */}
      <ConfirmModal
        visible={showDeleteConfirm}
        title="¿Eliminar evento?"
        message={`«${event.title}» se eliminará permanentemente.`}
        confirmLabel="Eliminar"
        destructive
        loading={deleting}
        onCancel={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
      />
    </View>
  );
}
