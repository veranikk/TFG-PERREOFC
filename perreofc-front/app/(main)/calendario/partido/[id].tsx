/**
 * Renders the id screen in the mobile app.
 * It composes UI components, hooks and API/store data for this route.
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  ActivityIndicator,
  Modal,
  Pressable,
  KeyboardAvoidingView,
  Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { ChevronLeft, MapPin, Clock, Star, Trophy, AlertTriangle, ChevronDown, Check, Trash2, ClipboardList } from 'lucide-react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { haptics } from '../../../../src/utils/haptics';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { useTheme } from '../../../../src/hooks/useTheme';
import { useRole } from '../../../../src/hooks/useRole';
import { useAuth } from '../../../../src/hooks/useAuth';
import { useAuthStore } from '../../../../src/store/useAuthStore';
import { api as newApi } from '../../../../src/services/api/index';
import { MatchHero } from '../../../../src/components/match/MatchHero';
import { Lineup } from '../../../../src/components/match/Lineup';
import { Button } from '../../../../src/components/ui/Button';
import { Card } from '../../../../src/components/ui/Card';
import { PointsModal } from '../../../../src/components/ui/PointsModal';
import { typography } from '../../../../src/theme/typography';
import { Match, PlayerLineup, MatchStaffEntry } from '../../../../src/types';
import { brand, state } from '../../../../src/theme/colors';
import { PERREOFC_TEAM_ID_NUM } from '../../../../src/config';
import { Calendar } from 'react-native-calendars';
import type { SquadCall, SquadCallPlayer, KitSlot } from '../../../../src/services/api/modules/squadCalls';

type MatchTab = 'resumen' | 'alineacion' | 'aficionado';

const OWN_TEAM_ID = PERREOFC_TEAM_ID_NUM;
const RFFM_BASE = 'https://www.rffm.es';
function normalizeRffmUrl(url?: string | null): string | undefined {
  if (!url) return undefined;
  return url.startsWith('/') ? `${RFFM_BASE}${url}` : url;
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function SkeletonBlock({ width, height, style }: { width?: number | string; height: number; style?: any }) {
  const { colors } = useTheme();
  return <View style={[{ width: width ?? '100%', height, borderRadius: 10, backgroundColor: colors.cardAlt }, style]} />;
}

function MatchSkeleton() {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <SkeletonBlock width={24} height={24} style={{ borderRadius: 12 }} />
        <SkeletonBlock height={20} style={{ flex: 1 }} />
      </View>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        <SkeletonBlock height={160} style={{ borderRadius: 20 }} />
        <SkeletonBlock height={44} style={{ borderRadius: 12 }} />
        <SkeletonBlock height={220} style={{ borderRadius: 16 }} />
        <SkeletonBlock height={140} style={{ borderRadius: 16 }} />
      </ScrollView>
    </View>
  );
}

// ── Tab bar ───────────────────────────────────────────────────────────────────
function MatchTabBar({
  active,
  onChange,
  match,
  isPlayer,
  isAdmin,
}: {
  active: MatchTab;
  onChange: (t: MatchTab) => void;
  match: Match;
  isPlayer: boolean;
  isAdmin: boolean;
}) {
  const { colors } = useTheme();

  const thirdLabel = (() => {
    if (isAdmin) return match.status === 'upcoming' ? 'Convocatoria' : 'MVP';
    if (isPlayer) return 'Convocatoria';
    return match.status === 'upcoming' ? 'Apuestas' : 'MVP';
  })();

  const tabs: Array<{ key: MatchTab; label: string }> = [
    { key: 'resumen',    label: 'Resumen' },
    { key: 'alineacion', label: 'Alineación' },
    { key: 'aficionado', label: thirdLabel },
  ];

  return (
    <View style={{ flexDirection: 'row', backgroundColor: colors.cardAlt, borderRadius: 12, padding: 4 }}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.key}
          onPress={() => onChange(tab.key)}
          style={{
            flex: 1, paddingVertical: 8, borderRadius: 9,
            backgroundColor: active === tab.key ? colors.card : 'transparent',
            alignItems: 'center',
          }}
          activeOpacity={0.7}
        >
          <Text style={{
            ...typography.label,
            color: active === tab.key ? colors.text : colors.textMuted,
            fontFamily: active === tab.key ? 'Inter_600SemiBold' : 'Inter_500Medium',
          }}>
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ── Timeline de eventos del partido ──────────────────────────────────────────
function EventTimeline({ events }: { events: any[] }) {
  const { colors } = useTheme();
  if (!events || events.length === 0) {
    return (
      <Text style={{ ...typography.caption, color: colors.textMuted, textAlign: 'center', paddingVertical: 12 }}>
        Sin eventos registrados
      </Text>
    );
  }
  return (
    <View style={{ gap: 8 }}>
      {events.map((ev, i) => {
        const isGoal = ev.type === 'goal';
        const isHome = ev.side === 'home';
        const icon = isGoal
          ? ev.isOwnGoal ? '⚽ (p.p.)' : '⚽'
          : ev.cardType === 100 ? '🟨' : '🟥';
        return (
          <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{ width: 36, alignItems: 'center' }}>
              <Text style={{ ...typography.caption, color: colors.textMuted, fontFamily: 'Inter_700Bold' }}>
                {ev.minute ?? '?'}'
              </Text>
            </View>
            <View style={{ flex: 1, flexDirection: isHome ? 'row' : 'row-reverse', alignItems: 'center', gap: 6 }}>
              <Text style={{ fontSize: 14 }}>{icon}</Text>
              <Text style={{
                ...typography.caption, color: colors.text,
                fontFamily: 'Inter_500Medium', flex: 1,
                textAlign: isHome ? 'left' : 'right',
              }}>
                {ev.playerName ?? 'Desconocido'}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

// ── Kit color swatch row ──────────────────────────────────────────────────────
function KitRow({ label, color, color1 }: { label: string; color: string | null; color1?: string | null }) {
  const { colors } = useTheme();
  const displayColor = color ?? color1 ?? '#888';
  return (
    <View style={{
      flexDirection: 'row', alignItems: 'center',
      paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border,
    }}>
      <View style={{
        width: 32, height: 32, borderRadius: 6,
        backgroundColor: displayColor,
        borderWidth: 1, borderColor: colors.border,
        marginRight: 12,
      }} />
      <Text style={{ ...typography.caption, color: colors.textMuted, flex: 1 }}>{label}</Text>
      <Text style={{ ...typography.caption, color: colors.text, fontFamily: 'Inter_600SemiBold', textTransform: 'capitalize' }}>
        {displayColor}
      </Text>
    </View>
  );
}

// ── Bloque convocatoria — vista jugador ───────────────────────────────────────
function ConvocatoriaPlayerBlock({
  matchId,
  match,
  playerId,
}: {
  matchId: string;
  match: Match;
  playerId: number | null;
}) {
  const { colors } = useTheme();
  const [squadCall, setSquadCall] = useState<SquadCall | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    newApi.squadCalls.getSquadCall(matchId)
      .then((res: any) => setSquadCall(res ?? null))
      .catch(() => setSquadCall(null))
      .finally(() => setLoading(false));
  }, [matchId]);

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

  const isCalled = playerId != null
    ? (squadCall.players ?? []).some((p) => p.playerId === playerId)
    : null; // null = no se puede determinar (jugador sin player_id vinculado)

  return (
    <Card>
      <View style={{ gap: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <ClipboardList size={20} color={colors.text} />
          <Text style={{ ...typography.h3, color: colors.text }}>CONVOCATORIA</Text>
        </View>

        {/* Badge estado jugador */}
        {isCalled === null ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#6B7280' }} />
            <Text style={{ ...typography.body, color: '#6B7280', fontFamily: 'Inter_600SemiBold' }}>
              Sin jugador vinculado
            </Text>
          </View>
        ) : (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{
              width: 10, height: 10, borderRadius: 5,
              backgroundColor: isCalled ? '#22C55E' : '#EF4444',
            }} />
            <Text style={{
              ...typography.body,
              color: isCalled ? '#22C55E' : '#EF4444',
              fontFamily: 'Inter_600SemiBold',
            }}>
              {isCalled ? 'Estás convocado' : 'No estás convocado'}
            </Text>
          </View>
        )}

        {/* Info convocatoria (siempre visible) */}
        <View style={{ gap: 6 }}>
          {squadCall.reportTime && (
            <Text style={{ ...typography.caption, color: colors.textMuted }}>
              Presentación:{' '}
              <Text style={{ color: colors.text, fontFamily: 'Inter_500Medium' }}>
                {squadCall.reportTime}
              </Text>
            </Text>
          )}

          {squadCall.location && (
            <Text style={{ ...typography.caption, color: colors.textMuted }}>
              Lugar:{' '}
              <Text style={{ color: colors.text, fontFamily: 'Inter_500Medium' }}>
                {squadCall.location}
              </Text>
            </Text>
          )}

          <Text style={{ ...typography.caption, color: colors.textMuted }}>
            Equipación:{' '}
            <Text style={{ color: colors.text, fontFamily: 'Inter_500Medium' }}>
              {squadCall.kitSlot === 'titular' ? 'Titular' : 'Alternativa'}
            </Text>
          </Text>
        </View>

        {/* Lista de jugadores convocados */}
        {(squadCall.players ?? []).length > 0 && (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {(squadCall.players ?? []).map((p) => {
              const isMe = playerId != null && p.playerId === playerId;
              return (
                <View
                  key={p.playerId}
                  style={{
                    borderRadius: 9999,
                    paddingHorizontal: 10, paddingVertical: 5,
                    backgroundColor: isMe ? colors.accent : colors.cardAlt,
                    borderWidth: 1,
                    borderColor: isMe ? colors.accent : colors.border,
                  }}
                >
                  <Text style={{
                    ...typography.caption,
                    color: isMe ? '#fff' : colors.text,
                    fontFamily: isMe ? 'Inter_700Bold' : 'Inter_500Medium',
                  }}>
                    {p.playerName}
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        {/* Equipación kit */}
        {squadCall.kit && (
          <View style={{ marginTop: 4 }}>
            <KitRow label="Camiseta"   color={squadCall.kit.shirtColor}  color1={squadCall.kit.shirtColor1} />
            <KitRow label="Pantalón"   color={squadCall.kit.shortsColor} color1={squadCall.kit.shortsColor1} />
            <KitRow label="Calcetines" color={squadCall.kit.socksColor}  color1={squadCall.kit.socksColor1} />
          </View>
        )}
      </View>
    </Card>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function shortPlayerName(fullName: string): string {
  // Format "APELLIDO1 APELLIDO2, NOMBRE" → "NOMBRE APELLIDO1"
  if (fullName.includes(',')) {
    const [surnames, firstNames] = fullName.split(',').map((s) => s.trim());
    const firstName = firstNames.split(' ')[0];
    const firstSurname = surnames.split(' ')[0];
    return `${firstName} ${firstSurname}`;
  }
  // Format "NOMBRE APELLIDO1 APELLIDO2" → "NOMBRE APELLIDO1"
  const parts = fullName.trim().split(' ');
  return parts.length >= 2 ? `${parts[0]} ${parts[1]}` : fullName;
}

export type KitChoice = { shirt: string; shorts: string; socks: string };
type KitColorOption = { hex: string; name: string };
type KitOptions = { shirt: KitColorOption[]; shorts: KitColorOption[]; socks: KitColorOption[] };

function buildKitOptions(kits: Array<{
  shirt1: string | null; shirt1Hex: string | null;
  shirt2: string | null; shirt2Hex: string | null;
  short1: string | null; short1Hex: string | null;
  short2: string | null; short2Hex: string | null;
  socks:  string | null; socksHex:  string | null;
}>): KitOptions {
  const unique = (pairs: Array<[string | null, string | null]>): KitColorOption[] => {
    const seen = new Set<string>();
    const out: KitColorOption[] = [];
    for (const [name, hex] of pairs) {
      if (name && hex && !seen.has(hex.toUpperCase())) {
        seen.add(hex.toUpperCase());
        out.push({ hex, name });
      }
    }
    return out;
  };
  return {
    shirt:  unique(kits.flatMap((k) => [[k.shirt1, k.shirt1Hex], [k.shirt2, k.shirt2Hex]])),
    shorts: unique(kits.flatMap((k) => [[k.short1, k.short1Hex], [k.short2, k.short2Hex]])),
    socks:  unique(kits.flatMap((k) => [[k.socks,  k.socksHex]])),
  };
}

// ── Selector equipación (admin form) ─────────────────────────────────────────
function KitSelector({
  value,
  onChange,
  options,
}: {
  value: KitChoice;
  onChange: (v: KitChoice) => void;
  options: KitOptions;
}) {
  const { colors } = useTheme();

  const ColorBtn = ({
    hex,
    name,
    active,
    onPress,
  }: {
    hex: string;
    name: string;
    active: boolean;
    onPress: () => void;
  }) => {
    const isLight = ['#FFFFFF', '#FFF', '#ffffff'].includes(hex);
    const activeBg = hex;
    const activeText = isLight ? '#333' : '#fff';
    const activeBorder = isLight ? '#999' : hex;
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        style={{
          paddingHorizontal: 14, paddingVertical: 7,
          borderRadius: 20,
          backgroundColor: active ? activeBg : colors.card,
          borderWidth: 1,
          borderColor: active ? activeBorder : colors.border,
          minWidth: 80, alignItems: 'center',
        }}
      >
        <Text style={{
          fontSize: 12, lineHeight: 16,
          color: active ? activeText : colors.text,
          fontFamily: active ? 'Inter_700Bold' : 'Inter_500Medium',
          letterSpacing: 0.3,
          textTransform: 'uppercase',
        }}>
          {name}
        </Text>
      </TouchableOpacity>
    );
  };

  const PieceRow = ({
    label,
    opts,
    selected,
    onSelect,
  }: {
    label: string;
    opts: KitColorOption[];
    selected: string;
    onSelect: (hex: string) => void;
  }) => (
    <View style={{
      flexDirection: 'row', alignItems: 'center',
      paddingVertical: 10,
      borderBottomWidth: 1, borderBottomColor: colors.border,
      gap: 8,
    }}>
      <View style={{ flexDirection: 'row', gap: 8, flex: 1 }}>
        {opts[0] ? (
          <ColorBtn hex={opts[0].hex} name={opts[0].name} active={selected === opts[0].hex} onPress={() => onSelect(opts[0]!.hex)} />
        ) : null}
        {opts[1] ? (
          <ColorBtn hex={opts[1].hex} name={opts[1].name} active={selected === opts[1].hex} onPress={() => onSelect(opts[1]!.hex)} />
        ) : null}
      </View>
      <Text style={{ ...typography.caption, color: colors.textMuted, textAlign: 'right', minWidth: 70 }}>
        {label}
      </Text>
    </View>
  );

  const shirtName  = options.shirt.find((o) => o.hex === value.shirt)?.name  ?? value.shirt;
  const shortsName = options.shorts.find((o) => o.hex === value.shorts)?.name ?? value.shorts;
  const socksName  = options.socks.find((o) => o.hex === value.socks)?.name  ?? value.socks;

  return (
    <View style={{
      borderRadius: 10, borderWidth: 1, borderColor: colors.border,
      backgroundColor: colors.cardAlt, overflow: 'hidden',
      paddingHorizontal: 12,
    }}>
      <PieceRow label="Camiseta"   opts={options.shirt}  selected={value.shirt}  onSelect={(hex) => onChange({ ...value, shirt: hex })} />
      <PieceRow label="Pantalón"   opts={options.shorts} selected={value.shorts} onSelect={(hex) => onChange({ ...value, shorts: hex })} />
      <PieceRow label="Calcetines" opts={options.socks}  selected={value.socks}  onSelect={(hex) => onChange({ ...value, socks: hex })} />

      {/* Resumen */}
      <View style={{ paddingVertical: 10, alignItems: 'center' }}>
        <View style={{
          paddingHorizontal: 16, paddingVertical: 7,
          borderRadius: 20, borderWidth: 1, borderColor: colors.border,
          backgroundColor: colors.card,
        }}>
          <Text style={{ ...typography.caption, color: colors.text, fontFamily: 'Inter_600SemiBold', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            {shirtName} - {shortsName} - {socksName}
          </Text>
        </View>
      </View>
    </View>
  );
}

// ── Formulario convocatoria (admin/superadmin) ────────────────────────────────
function AdminSquadCallForm({
  matchId,
  match,
  existingCall,
  onSaved,
  onCancel,
}: {
  matchId: string;
  match: Match;
  existingCall: SquadCall | null;
  onSaved: (call: SquadCall | null) => void;
  onCancel?: () => void;
}) {
  const { colors } = useTheme();

  const [allPlayers, setAllPlayers] = useState<any[]>([]);
  const [loadingPlayers, setLoadingPlayers] = useState(true);
  const [kitOptions, setKitOptions] = useState<KitOptions>({ shirt: [], shorts: [], socks: [] });
  const [selectedPlayers, setSelectedPlayers] = useState<SquadCallPlayer[]>(existingCall?.players ?? []);
  const [reportTime, setReportTime] = useState(existingCall?.reportTime ?? '');
  const [location, setLocation] = useState(existingCall?.location ?? '');
  const [kitChoice, setKitChoice] = useState<KitChoice>({
    shirt:  existingCall?.shirtColor  ?? '',
    shorts: existingCall?.shortsColor ?? '',
    socks:  existingCall?.socksColor  ?? '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showList, setShowList] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const parsedHour   = reportTime ? parseInt(reportTime.split(':')[0], 10) : (match.time ? parseInt(match.time.slice(0, 2), 10) : 9);
  const parsedMinute = reportTime ? parseInt(reportTime.split(':')[1], 10) : (match.time ? parseInt(match.time.slice(3, 5), 10) : 30);
  const [pickerHour,   setPickerHour]   = useState(isNaN(parsedHour)   ? 9  : parsedHour);
  const [pickerMinute, setPickerMinute] = useState(isNaN(parsedMinute) ? 30 : parsedMinute);

  useEffect(() => {
    newApi.teams.getTeamSquad(String(OWN_TEAM_ID))
      .then((res: any) => {
        const list = Array.isArray(res) ? res : (res?.players ?? res?.data ?? []);
        setAllPlayers(list);
      })
      .catch(() => {})
      .finally(() => setLoadingPlayers(false));

    newApi.teams.getTeamKits(String(OWN_TEAM_ID))
      .then((kits: any[]) => {
        const opts = buildKitOptions(kits);
        setKitOptions(opts);
        // Set defaults if no existing choice
        setKitChoice((prev) => ({
          shirt:  prev.shirt  || opts.shirt[0]?.hex  || '',
          shorts: prev.shorts || opts.shorts[0]?.hex || '',
          socks:  prev.socks  || opts.socks[0]?.hex  || '',
        }));
      })
      .catch(() => {});
  }, []);

  const filteredPlayers = allPlayers.filter((p: any) => {
    const name = (p.fullName ?? p.name ?? `${p.firstName ?? ''} ${p.lastName ?? ''}`).toLowerCase();
    return name.includes(searchQuery.toLowerCase());
  });

  const togglePlayer = (p: any) => {
    const pid = Number(p.id);
    const name = (p.fullName ?? p.name ?? `${p.firstName ?? ''} ${p.lastName ?? ''}`.trim()) as string;
    if (selectedPlayers.some((sp) => sp.playerId === pid)) {
      setSelectedPlayers((prev) => prev.filter((sp) => sp.playerId !== pid));
    } else {
      if (selectedPlayers.length >= 18) return;
      setSelectedPlayers((prev) => [...prev, { playerId: pid, playerName: name }]);
    }
  };

  const handleSubmit = async () => {
    if (selectedPlayers.length === 0) { setError('Selecciona al menos 1 jugador'); return; }
    if (reportTime && !/^\d{2}:\d{2}$/.test(reportTime)) { setError('Formato de hora inválido (HH:MM)'); return; }
    setSubmitting(true);
    setError(null);
    try {
      // Derive kitSlot from shirt color: first kit option = titular, else suplente
      const derivedKitSlot: KitSlot = kitChoice.shirt === (kitOptions.shirt[0]?.hex ?? '') ? 'titular' : 'suplente';
      const result = await newApi.squadCalls.upsertSquadCall(matchId, {
        reportTime:  reportTime.trim() || null,
        location:    location.trim() || null,
        kitSlot:     derivedKitSlot,
        shirtColor:  kitChoice.shirt  || null,
        shortsColor: kitChoice.shorts || null,
        socksColor:  kitChoice.socks  || null,
        players:     selectedPlayers,
      });
      haptics.success();
      onSaved(result as SquadCall);
    } catch (e: any) {
      setError(e?.data?.error ?? e?.message ?? 'Error al guardar');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Eliminar convocatoria',
      '¿Seguro que quieres eliminar esta convocatoria?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            setError(null);
            setDeleting(true);
            try {
              await newApi.squadCalls.deleteSquadCall(matchId);
              haptics.error();
              onSaved(null);
            } catch (e: any) {
              setError(e?.data?.error ?? e?.message ?? 'Error al eliminar');
            } finally {
              setDeleting(false);
            }
          },
        },
      ],
    );
  };

  return (
    <Card>
      <View style={{ gap: 14 }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <ClipboardList size={20} color={colors.text} />
            <Text style={{ ...typography.h3, color: colors.text }}>
              {existingCall ? 'EDITAR CONVOCATORIA' : 'NUEVA CONVOCATORIA'}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            {onCancel && (
              <TouchableOpacity onPress={onCancel} style={{ padding: 4 }}>
                <Text style={{ ...typography.caption, color: colors.textMuted }}>Cancelar</Text>
              </TouchableOpacity>
            )}
            {existingCall && (
              <TouchableOpacity onPress={handleDelete} disabled={deleting} style={{ padding: 4 }}>
                <Trash2 size={18} color={state.error} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Jugadores */}
        <View style={{ gap: 6 }}>
          <Text style={{ ...typography.label, color: colors.textMuted }}>
            JUGADORES CONVOCADOS ({selectedPlayers.length}/18)
          </Text>

          <TouchableOpacity
            onPress={() => setShowList((v) => !v)}
            style={{
              flexDirection: 'row', alignItems: 'center',
              backgroundColor: colors.cardAlt, borderRadius: 10,
              borderWidth: 1, borderColor: colors.border,
              paddingHorizontal: 12, height: 44,
            }}
            activeOpacity={0.8}
          >
            <TextInput
              value={searchQuery}
              onChangeText={(t) => { setSearchQuery(t); setShowList(true); }}
              placeholder="Buscar jugador..."
              placeholderTextColor={colors.textMuted}
              style={{
                flex: 1, ...typography.body, color: colors.text,
                ...(Platform.OS === 'web' ? { outline: 'none' } as any : {}),
              }}
              onFocus={() => setShowList(true)}
            />
            <ChevronDown size={16} color={colors.textMuted} />
          </TouchableOpacity>

          {showList && !loadingPlayers && (
            <View style={{
              borderRadius: 10, borderWidth: 1, borderColor: colors.border,
              backgroundColor: colors.card, maxHeight: 220, overflow: 'hidden',
            }}>
              <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled">
                {filteredPlayers.length === 0 ? (
                  <Text style={{ ...typography.caption, color: colors.textMuted, padding: 12, textAlign: 'center' }}>
                    Sin resultados
                  </Text>
                ) : filteredPlayers.map((p: any) => {
                  const pid = Number(p.id);
                  const isSelected = selectedPlayers.some((sp) => sp.playerId === pid);
                  const name = (p.fullName ?? p.name ?? `${p.firstName ?? ''} ${p.lastName ?? ''}`.trim()) as string;
                  return (
                    <TouchableOpacity
                      key={p.id}
                      onPress={() => { togglePlayer(p); setSearchQuery(''); }}
                      style={{
                        flexDirection: 'row', alignItems: 'center',
                        paddingHorizontal: 12, paddingVertical: 10,
                        borderBottomWidth: 1, borderBottomColor: colors.border,
                        backgroundColor: isSelected ? `${colors.accent}12` : 'transparent',
                      }}
                      activeOpacity={0.7}
                    >
                      <View style={{
                        width: 22, height: 22, borderRadius: 11,
                        backgroundColor: isSelected ? colors.accent : colors.cardAlt,
                        alignItems: 'center', justifyContent: 'center', marginRight: 10,
                      }}>
                        {isSelected
                          ? <Check size={12} color="#fff" />
                          : <Text style={{ fontSize: 10, color: colors.textMuted }}>{p.dorsal ?? '?'}</Text>
                        }
                      </View>
                      <Text style={{
                        ...typography.body,
                        color: isSelected ? colors.accent : colors.text,
                        fontFamily: isSelected ? 'Inter_600SemiBold' : 'Inter_400Regular',
                        flex: 1,
                      }}>
                        {name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {selectedPlayers.length > 0 && (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
              {selectedPlayers.map((sp) => (
                <TouchableOpacity
                  key={sp.playerId}
                  onPress={() => setSelectedPlayers((prev) => prev.filter((p) => p.playerId !== sp.playerId))}
                  style={{
                    flexDirection: 'row', alignItems: 'center', gap: 3,
                    backgroundColor: `${colors.accent}18`,
                    borderRadius: 9999, paddingHorizontal: 8, paddingVertical: 3,
                    borderWidth: 1, borderColor: `${colors.accent}44`,
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={{ fontSize: 10, lineHeight: 14, color: colors.accent, fontFamily: 'Inter_500Medium' }}>
                    {shortPlayerName(sp.playerName)}
                  </Text>
                  <Text style={{ color: colors.accent, fontSize: 10, lineHeight: 14 }}>✕</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Horario convocatoria */}
        <View style={{ gap: 6 }}>
          <Text style={{ ...typography.label, color: colors.textMuted }}>HORARIO DE CONVOCATORIA</Text>
          <TouchableOpacity
            onPress={() => setShowTimePicker(true)}
            style={{
              flexDirection: 'row', alignItems: 'center',
              backgroundColor: colors.cardAlt, borderRadius: 10,
              borderWidth: 1, borderColor: colors.border,
              paddingHorizontal: 12, height: 44,
            }}
            activeOpacity={0.8}
          >
            <Clock size={14} color={colors.textMuted} style={{ marginRight: 8 }} />
            <Text style={{
              flex: 1, ...typography.body,
              color: reportTime ? colors.text : colors.textMuted,
            }}>
              {reportTime || (match.time ? `Partido: ${match.time.slice(0, 5)}` : 'HH:MM')}
            </Text>
          </TouchableOpacity>
          {match.time && (
            <Text style={{ ...typography.caption, color: colors.textMuted }}>
              Partido a las {match.time.slice(0, 5)}
            </Text>
          )}
        </View>

        {/* Time picker modal */}
        <Modal
          visible={showTimePicker}
          transparent
          animationType="fade"
          onRequestClose={() => setShowTimePicker(false)}
        >
          <Pressable
            style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}
            onPress={() => setShowTimePicker(false)}
          >
            <Pressable
              style={{
                backgroundColor: colors.card, borderRadius: 16, padding: 24,
                width: 280, gap: 20,
              }}
              onPress={(e) => e.stopPropagation()}
            >
              <Text style={{ ...typography.h3, color: colors.text, textAlign: 'center' }}>
                HORA DE CONVOCATORIA
              </Text>

              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                {/* Horas */}
                <View style={{ alignItems: 'center', gap: 8 }}>
                  <TouchableOpacity
                    onPress={() => setPickerHour((h) => (h + 1) % 24)}
                    style={{ padding: 8 }}
                  >
                    <Text style={{ fontSize: 20, color: colors.accent }}>▲</Text>
                  </TouchableOpacity>
                  <View style={{
                    width: 72, height: 52, borderRadius: 10,
                    backgroundColor: colors.cardAlt, borderWidth: 1, borderColor: colors.accent,
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Text style={{ ...typography.h2, color: colors.text, fontFamily: 'Inter_700Bold' }}>
                      {String(pickerHour).padStart(2, '0')}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setPickerHour((h) => (h - 1 + 24) % 24)}
                    style={{ padding: 8 }}
                  >
                    <Text style={{ fontSize: 20, color: colors.accent }}>▼</Text>
                  </TouchableOpacity>
                </View>

                <Text style={{ ...typography.h2, color: colors.text, fontFamily: 'Inter_700Bold', marginBottom: 4 }}>:</Text>

                {/* Minutos */}
                <View style={{ alignItems: 'center', gap: 8 }}>
                  <TouchableOpacity
                    onPress={() => setPickerMinute((m) => (m + 5) % 60)}
                    style={{ padding: 8 }}
                  >
                    <Text style={{ fontSize: 20, color: colors.accent }}>▲</Text>
                  </TouchableOpacity>
                  <View style={{
                    width: 72, height: 52, borderRadius: 10,
                    backgroundColor: colors.cardAlt, borderWidth: 1, borderColor: colors.accent,
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Text style={{ ...typography.h2, color: colors.text, fontFamily: 'Inter_700Bold' }}>
                      {String(pickerMinute).padStart(2, '0')}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setPickerMinute((m) => (m - 5 + 60) % 60)}
                    style={{ padding: 8 }}
                  >
                    <Text style={{ fontSize: 20, color: colors.accent }}>▼</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity
                  onPress={() => { setReportTime(''); setShowTimePicker(false); }}
                  style={{
                    flex: 1, padding: 12, borderRadius: 10,
                    borderWidth: 1, borderColor: colors.border,
                    alignItems: 'center',
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={{ ...typography.body, color: colors.textMuted }}>Borrar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    setReportTime(`${String(pickerHour).padStart(2, '0')}:${String(pickerMinute).padStart(2, '0')}`);
                    setShowTimePicker(false);
                  }}
                  style={{
                    flex: 2, padding: 12, borderRadius: 10,
                    backgroundColor: colors.accent,
                    alignItems: 'center',
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={{ ...typography.body, color: '#fff', fontFamily: 'Inter_600SemiBold' }}>Confirmar</Text>
                </TouchableOpacity>
              </View>
            </Pressable>
          </Pressable>
        </Modal>

        {/* Lugar */}
        <View style={{ gap: 6 }}>
          <Text style={{ ...typography.label, color: colors.textMuted }}>LUGAR DE PRESENTACIÓN</Text>
          <View style={{
            flexDirection: 'row', alignItems: 'flex-start',
            backgroundColor: colors.cardAlt, borderRadius: 10,
            borderWidth: 1, borderColor: colors.border,
            paddingHorizontal: 12, minHeight: 44,
          }}>
            <MapPin size={14} color={colors.textMuted} style={{ marginRight: 8, marginTop: 13 }} />
            <TextInput
              value={location}
              onChangeText={setLocation}
              placeholder={match.location ?? 'Lugar de presentación...'}
              placeholderTextColor={colors.textMuted}
              multiline
              style={{
                flex: 1, ...typography.body, color: colors.text, paddingVertical: 10,
                ...(Platform.OS === 'web' ? { outline: 'none' } as any : {}),
              }}
            />
          </View>
        </View>

        {/* Equipación */}
        <View style={{ gap: 6 }}>
          <Text style={{ ...typography.label, color: colors.textMuted }}>EQUIPACIÓN</Text>
          <KitSelector value={kitChoice} onChange={setKitChoice} options={kitOptions} />
          <Text style={{ ...typography.caption, color: colors.textMuted }}>
            Por defecto se selecciona la equipación principal (naranja). Cámbiala si el partido se juega con la alternativa.
          </Text>
        </View>

        {error && <Text style={{ ...typography.caption, color: state.error }}>{error}</Text>}

        <Button
          label={submitting ? 'Guardando...' : existingCall ? 'Actualizar convocatoria' : 'Publicar convocatoria'}
          fullWidth
          loading={submitting}
          disabled={submitting || deleting}
          onPress={handleSubmit}
        />
      </View>
    </Card>
  );
}

// ── Vista resumen convocatoria (admin) ────────────────────────────────────────
function AdminSquadCallView({
  squadCall,
  onEdit,
}: {
  squadCall: SquadCall;
  onEdit: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Card>
      <View style={{ gap: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <ClipboardList size={20} color={colors.text} />
            <Text style={{ ...typography.h3, color: colors.text }}>CONVOCATORIA</Text>
          </View>
          <TouchableOpacity
            onPress={onEdit}
            style={{ borderRadius: 9999, paddingHorizontal: 12, paddingVertical: 5, backgroundColor: `${colors.accent}18` }}
          >
            <Text style={{ ...typography.caption, color: colors.accent, fontFamily: 'Inter_600SemiBold' }}>Editar</Text>
          </TouchableOpacity>
        </View>

        <View style={{ gap: 4 }}>
          {squadCall.reportTime && (
            <Text style={{ ...typography.caption, color: colors.textMuted }}>
              Presentación: <Text style={{ color: colors.text, fontFamily: 'Inter_500Medium' }}>{squadCall.reportTime}</Text>
            </Text>
          )}
          {squadCall.location && (
            <Text style={{ ...typography.caption, color: colors.textMuted }}>
              Lugar: <Text style={{ color: colors.text, fontFamily: 'Inter_500Medium' }}>{squadCall.location}</Text>
            </Text>
          )}
          <Text style={{ ...typography.caption, color: colors.textMuted }}>
            Equipación: <Text style={{ color: colors.text, fontFamily: 'Inter_500Medium', textTransform: 'capitalize' }}>
              {squadCall.kitSlot === 'titular' ? 'Titular' : 'Alternativa'}
            </Text>
          </Text>
        </View>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
          {(squadCall.players ?? []).map((p) => (
            <View
              key={p.playerId}
              style={{
                backgroundColor: colors.cardAlt, borderRadius: 9999,
                paddingHorizontal: 10, paddingVertical: 5,
                borderWidth: 1, borderColor: colors.border,
              }}
            >
              <Text style={{ ...typography.caption, color: colors.text, fontFamily: 'Inter_500Medium' }}>
                {p.playerName}
              </Text>
            </View>
          ))}
        </View>

        {squadCall.kit && (
          <View style={{ marginTop: 4 }}>
            <KitRow label="Camiseta"   color={squadCall.kit.shirtColor}  color1={squadCall.kit.shirtColor1} />
            <KitRow label="Pantalón"   color={squadCall.kit.shortsColor} color1={squadCall.kit.shortsColor1} />
            <KitRow label="Calcetines" color={squadCall.kit.socksColor}  color1={squadCall.kit.socksColor1} />
          </View>
        )}
      </View>
    </Card>
  );
}

// ── Apuesta (aficionado + upcoming) ──────────────────────────────────────────
function BetBlock({ match, onInputFocus }: { match: Match; onInputFocus?: () => void }) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const addPoints = useAuthStore((s) => s.addPoints);

  const [existingBet, setExistingBet] = useState<any>(null);
  const [loadingBet, setLoadingBet] = useState(true);
  const [bet, setBet] = useState<'home' | 'draw' | 'away' | null>(null);
  const [amount, setAmount] = useState('50');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const balance = user?.points ?? 0;
  const parsedAmount = parseInt(amount) || 0;
  const exceedsBalance = parsedAmount > balance;
  const betAmt = Math.min(Math.max(1, parsedAmount), balance);
  const multipliers: Record<'home' | 'draw' | 'away', number> = { home: 2, draw: 3, away: 2 };
  const payout = bet ? betAmt * multipliers[bet] : 0;
  const options: Array<{ key: 'home' | 'draw' | 'away'; label: string }> = [
    { key: 'home', label: match.homeTeam },
    { key: 'draw', label: 'Empate' },
    { key: 'away', label: match.awayTeam },
  ];

  useEffect(() => {
    newApi.bets.getBetsByMatch(match.id)
      .then((res: any) => {
        const list: any[] = Array.isArray(res) ? res : (res?.data ?? []);
        if (list.length > 0) setExistingBet(list[0]);
      })
      .catch(() => {})
      .finally(() => setLoadingBet(false));
  }, [match.id]);

  const handleConfirm = async () => {
    if (!bet || betAmt <= 0) return;
    setSubmitting(true);
    setError(null);
    try {
      await newApi.bets.createBet({ matchId: match.id, prediction: bet, pointsWagered: betAmt });
      haptics.success();
      addPoints(-betAmt);
      const res: any = await newApi.bets.getBetsByMatch(match.id);
      const list: any[] = Array.isArray(res) ? res : (res?.data ?? []);
      if (list.length > 0) setExistingBet(list[0]);
    } catch (e: any) {
      setError(e?.data?.error ?? e?.message ?? 'Error al registrar apuesta');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingBet) return <Card><ActivityIndicator color={colors.accent} /></Card>;

  if (existingBet) {
    const predLabel = options.find(o => o.key === existingBet.prediction)?.label ?? existingBet.prediction;
    const resultColors: Record<string, string> = { win: brand.green, loss: state.error, pending: colors.accent };
    const resultLabels: Record<string, string> = { win: 'Ganada', loss: 'Perdida', pending: 'Pendiente' };
    const result = existingBet.result ?? 'pending';
    return (
      <Card>
        <View style={{ gap: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={{ fontSize: 18 }}>🍑</Text>
            <Text style={{ ...typography.h3, color: colors.text }}>TU APUESTA</Text>
            <View style={{ marginLeft: 'auto' as any, backgroundColor: `${resultColors[result]}22`, borderRadius: 9999, paddingHorizontal: 10, paddingVertical: 3 }}>
              <Text style={{ ...typography.caption, color: resultColors[result], fontFamily: 'Inter_700Bold' }}>{resultLabels[result]}</Text>
            </View>
          </View>
          <Text style={{ ...typography.body, color: colors.textMuted }}>
            Apostaste <Text style={{ color: colors.text, fontFamily: 'Inter_600SemiBold' }}>{existingBet.pointsWagered ?? existingBet.points_wagered} 🍑</Text>{' '}
            por <Text style={{ color: colors.text, fontFamily: 'Inter_600SemiBold' }}>«{predLabel}»</Text>
          </Text>
          {result === 'win' && (
            <Text style={{ ...typography.caption, color: brand.green }}>
              Ganaste {existingBet.pointsWon ?? existingBet.points_won ?? 0} 🍑
            </Text>
          )}
        </View>
      </Card>
    );
  }

  return (
    <Card>
      <View style={{ gap: 12 }}>
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

        <View style={{ gap: 8 }}>
          {options.map((opt) => {
            const active = bet === opt.key;
            return (
              <TouchableOpacity
                key={opt.key}
                onPress={() => setBet(opt.key)}
                style={{
                  padding: 12, borderRadius: 12, borderWidth: 2,
                  borderColor: active ? colors.accent : colors.border,
                  backgroundColor: active ? `${colors.accent}18` : colors.cardAlt,
                  flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                }}
              >
                <Text style={{ ...typography.body, color: active ? colors.accent : colors.text, fontFamily: active ? 'Inter_600SemiBold' : 'Inter_400Regular' }}>
                  {opt.label}
                </Text>
                <Text style={{ ...typography.caption, color: colors.textMuted }}>×{multipliers[opt.key]}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {bet && (
          <View style={{ gap: 8 }}>
            <Text style={{ ...typography.label, color: colors.textMuted }}>CANTIDAD (máx. {balance} 🍑)</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={{
                flex: 1, flexDirection: 'row', alignItems: 'center',
                backgroundColor: colors.cardAlt, borderRadius: 12, borderWidth: 1,
                borderColor: exceedsBalance ? state.error : colors.border, paddingHorizontal: 14, height: 48,
              }}>
                <TextInput
                  value={amount}
                  onChangeText={(t) => { setError(null); setAmount(t.replace(/[^0-9]/g, '')); }}
                  keyboardType="numeric"
                  onFocus={onInputFocus}
                  style={{ flex: 1, ...typography.body, color: colors.text, ...(Platform.OS === 'web' ? { outline: 'none' } as any : {}) }}
                  placeholderTextColor={colors.textMuted}
                />
                <Text style={{ ...typography.body, color: colors.textMuted }}>🍑</Text>
              </View>
              <View style={{ backgroundColor: exceedsBalance ? `${state.error}18` : `${colors.accent}18`, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12 }}>
                <Text style={{ ...typography.label, color: exceedsBalance ? state.error : colors.accent, fontFamily: 'Inter_700Bold' }}>→ {payout} 🍑</Text>
              </View>
            </View>
            {exceedsBalance && <Text style={{ ...typography.caption, color: state.error }}>No tienes suficientes 🍑. Máximo: {balance}</Text>}
            {error && !exceedsBalance && <Text style={{ ...typography.caption, color: state.error }}>{error}</Text>}
            <Button
              label={submitting ? 'Apostando...' : `Apostar ${betAmt} 🍑`}
              fullWidth loading={submitting}
              disabled={betAmt <= 0 || balance <= 0 || submitting || exceedsBalance}
              onPress={handleConfirm}
            />
          </View>
        )}
      </View>
    </Card>
  );
}

// ── MVP vote ──────────────────────────────────────────────────────────────────
function MvpVoteBlock({ match, lineup, canVote = true }: { match: Match; lineup: any; canVote?: boolean }) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { isAdmin } = useRole();
  const updateUser = useAuthStore((s) => s.updateUser);

  const [voteResult, setVoteResult] = useState<any>(null);
  const [loadingVote, setLoadingVote] = useState(true);
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [votePointsResult, setVotePointsResult] = useState<{ pointsAwarded: number; newBalance: number; playerName: string } | null>(null);
  const [voteModalVisible, setVoteModalVisible] = useState(false);

  // Admin: fijar fecha límite de votación MVP
  const [deadlineInput, setDeadlineInput] = useState('');        // YYYY-MM-DD seleccionado
  const [calendarVisible, setCalendarVisible] = useState(false); // Modal del calendario
  const [savingDeadline, setSavingDeadline] = useState(false);
  const [deadlineSaved, setDeadlineSaved] = useState(false);
  const [deadlineError, setDeadlineError] = useState<string | null>(null);

  const perreoIsHome = match.homeTeamId === OWN_TEAM_ID
    ? true
    : match.awayTeamId === OWN_TEAM_ID
    ? false
    : match.homeTeam.toUpperCase().includes('PERREO');
  const perreoPlayers: any[] = perreoIsHome ? (lineup?.home?.players ?? []) : (lineup?.away?.players ?? []);
  // Mostrar todos: titulares, suplentes que entraron y convocados en banco
  const displayPlayers = perreoPlayers;

  useEffect(() => {
    if (!user?.id) { setLoadingVote(false); return; }
    newApi.home.getMvpVotes(match.id)
      .then((res: any) => {
        setVoteResult(res);
        // Prerellenar el input de deadline admin con la fecha actual si existe
        if (res?.mvpVotingDeadline) {
          const d = new Date(res.mvpVotingDeadline);
          const yyyy = d.getFullYear();
          const mm = String(d.getMonth() + 1).padStart(2, '0');
          const dd = String(d.getDate()).padStart(2, '0');
          setDeadlineInput(`${yyyy}-${mm}-${dd}`);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingVote(false));
  }, [match.id, user?.id]);

  const handleSetDeadline = async () => {
    if (!deadlineInput) return;
    setSavingDeadline(true);
    setDeadlineError(null);
    try {
      const res = await newApi.home.setMvpDeadline(match.id, deadlineInput);
      setVoteResult((prev: any) => ({ ...prev, mvpVotingDeadline: res.mvpVotingDeadline }));
      setDeadlineSaved(true);
      setTimeout(() => setDeadlineSaved(false), 3000);
    } catch (e: any) {
      setDeadlineError(e?.data?.error ?? e?.message ?? 'Error al guardar la fecha');
    } finally {
      setSavingDeadline(false);
    }
  };

  const handleVote = async () => {
    if (!selectedPlayer) return;
    setConfirmVisible(false);
    setSubmitting(true);
    setError(null);
    try {
      const voteRes: any = await newApi.home.voteMvp({ matchId: match.id, playerId: selectedPlayer });
      haptics.success();
      if (voteRes?.newBalance !== undefined) {
        updateUser({ points: voteRes.newBalance });
      }
      if (voteRes?.pointsAwarded) {
        setVotePointsResult({
          pointsAwarded: voteRes.pointsAwarded,
          newBalance: voteRes.newBalance,
          playerName: voteRes.playerName ?? '',
        });
        setVoteModalVisible(true);
      }
      const res: any = await newApi.home.getMvpVotes(match.id);
      setVoteResult(res);
    } catch (e: any) {
      setError(e?.data?.error ?? e?.message ?? 'Error al enviar voto');
    } finally {
      setSubmitting(false);
    }
  };

  const userVotedPlayerId = voteResult?.myVote?.playerId ?? voteResult?.userVote?.playerId ?? voteResult?.user_vote?.player_id;
  const hasVoted = !!userVotedPlayerId;

  // Deadline de votación MVP
  const mvpVotingDeadline: string | null = voteResult?.mvpVotingDeadline ?? null;
  const deadlinePassed = mvpVotingDeadline ? new Date() > new Date(mvpVotingDeadline) : false;

  const formatDeadline = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }) + ' a las 23:59';
  };

  // Panel admin para fijar la fecha de cierre de votación MVP
  const adminDeadlinePanel = isAdmin ? (
    <View style={{ marginTop: 16, paddingTop: 14, borderTopWidth: 1, borderTopColor: colors.border, gap: 10 }}>
      <Text style={{ ...typography.caption, color: colors.textMuted, fontFamily: 'Inter_600SemiBold' }}>
        Admin · Fecha límite votación MVP
      </Text>

      {/* Botón que abre el calendario */}
      <TouchableOpacity
        onPress={() => setCalendarVisible(true)}
        style={{
          flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
          height: 44, borderRadius: 10, borderWidth: 1,
          borderColor: deadlineError ? state.error : colors.border,
          backgroundColor: colors.cardAlt, paddingHorizontal: 14,
        }}
      >
        <Text style={{ ...typography.body, color: deadlineInput ? colors.text : colors.textMuted }}>
          {deadlineInput
            ? new Date(deadlineInput + 'T12:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
            : 'Seleccionar fecha…'}
        </Text>
        <ChevronDown size={16} color={colors.textMuted} />
      </TouchableOpacity>

      {/* Botón guardar */}
      <TouchableOpacity
        onPress={handleSetDeadline}
        disabled={savingDeadline || !deadlineInput}
        style={{
          height: 40, borderRadius: 10,
          backgroundColor: deadlineSaved ? brand.green : colors.accent,
          alignItems: 'center', justifyContent: 'center',
          opacity: savingDeadline || !deadlineInput ? 0.5 : 1,
        }}
      >
        <Text style={{ ...typography.body, color: '#fff', fontFamily: 'Inter_600SemiBold' }}>
          {savingDeadline ? 'Guardando…' : deadlineSaved ? '✓ Fecha guardada' : 'Guardar fecha límite'}
        </Text>
      </TouchableOpacity>

      {deadlineError && <Text style={{ ...typography.caption, color: state.error }}>{deadlineError}</Text>}
      <Text style={{ ...typography.caption, color: colors.textMuted }}>
        La votación cerrará a las 23:59 del día elegido.
      </Text>

      {/* Modal con calendario */}
      <Modal transparent animationType="slide" visible={calendarVisible} onRequestClose={() => setCalendarVisible(false)}>
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}
          onPress={() => setCalendarVisible(false)}
        >
          <Pressable style={{ backgroundColor: colors.bg, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 32 }}>
            {/* Header */}
            <View style={{
              flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
              paddingHorizontal: 20, paddingVertical: 16,
              borderBottomWidth: 1, borderBottomColor: colors.border,
            }}>
              <Text style={{ ...typography.h3, color: colors.text }}>Fecha límite votación</Text>
              <TouchableOpacity onPress={() => setCalendarVisible(false)}>
                <Text style={{ ...typography.body, color: colors.textMuted }}>Cerrar</Text>
              </TouchableOpacity>
            </View>

            <Calendar
              current={deadlineInput || new Date().toISOString().slice(0, 10)}
              onDayPress={(day: { dateString: string }) => {
                setDeadlineInput(day.dateString);
                setDeadlineError(null);
                setCalendarVisible(false);
              }}
              markedDates={deadlineInput ? {
                [deadlineInput]: { selected: true, selectedColor: colors.accent },
              } : {}}
              theme={{
                backgroundColor: colors.bg,
                calendarBackground: colors.bg,
                textSectionTitleColor: colors.textMuted,
                selectedDayBackgroundColor: colors.accent,
                selectedDayTextColor: '#fff',
                todayTextColor: colors.accent,
                dayTextColor: colors.text,
                textDisabledColor: colors.border,
                arrowColor: colors.accent,
                monthTextColor: colors.text,
                indicatorColor: colors.accent,
                textDayFontFamily: 'Inter_400Regular',
                textMonthFontFamily: 'Inter_700Bold',
                textDayHeaderFontFamily: 'Inter_500Medium',
                textDayFontSize: 14,
                textMonthFontSize: 16,
              }}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  ) : null;

  // El PointsModal se define aquí y se incluye en TODOS los paths de render,
  // para que no se desmonte cuando el componente cambia de vista tras el voto.
  const pointsModal = (
    <PointsModal
      visible={voteModalVisible}
      onClose={() => setVoteModalVisible(false)}
      title="¡Voto registrado!"
      description={votePointsResult?.playerName ? `Has votado a ${votePointsResult.playerName} como MVP` : 'Has votado al MVP del partido'}
      pointsAwarded={votePointsResult?.pointsAwarded ?? 0}
      newBalance={votePointsResult?.newBalance}
      emoji="⭐"
    />
  );

  if (loadingVote) return <>{<Card><ActivityIndicator color={colors.accent} /></Card>}{pointsModal}</>;

  // Votación cerrada por tiempo — muestra ganador final prominentemente
  if (deadlinePassed) {
    const winner = voteResult?.winner;
    const totalVotes = voteResult?.totalVotes ?? voteResult?.total_votes ?? 0;
    const results: any[] = voteResult?.results ?? voteResult?.votes ?? [];
    return (
      <>
        <Card>
          <View style={{ gap: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Trophy size={18} color={brand.orange} />
              <Text style={{ ...typography.h3, color: colors.text }}>MVP DEL PARTIDO</Text>
              <View style={{ marginLeft: 'auto' as any, backgroundColor: `${state.error}18`, borderRadius: 9999, paddingHorizontal: 8, paddingVertical: 3 }}>
                <Text style={{ ...typography.caption, color: state.error, fontFamily: 'Inter_600SemiBold' }}>Cerrada</Text>
              </View>
            </View>
            {winner ? (
              <View style={{ alignItems: 'center', gap: 6, paddingVertical: 12, backgroundColor: `${brand.orange}10`, borderRadius: 12 }}>
                <Trophy size={36} color={brand.orange} />
                <Text style={{ ...typography.h3, color: colors.text }}>{winner.playerName ?? winner.player_name}</Text>
                <Text style={{ ...typography.caption, color: colors.textMuted }}>{winner.percentage ?? winner.votePercentage ?? 0}% · {totalVotes} votos</Text>
              </View>
            ) : (
              <Text style={{ ...typography.caption, color: colors.textMuted, textAlign: 'center' }}>No se registraron votos</Text>
            )}
            {results.length > 0 && (
              <View style={{ gap: 8 }}>
                {results.map((v: any, i: number) => {
                  const pct = v.percentage ?? v.votePercentage ?? 0;
                  const name = v.playerName ?? v.player_name ?? 'Jugador';
                  const count = v.votes ?? v.voteCount ?? v.count ?? 0;
                  const isMyVote = String(v.playerId ?? v.player_id) === String(userVotedPlayerId);
                  const isWinner = i === 0;
                  return (
                    <View key={i} style={{ gap: 4 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={{ ...typography.caption, color: isMyVote ? colors.accent : colors.text, fontFamily: isWinner ? 'Inter_700Bold' : isMyVote ? 'Inter_600SemiBold' : 'Inter_400Regular' }}>
                          {isWinner ? '🏆 ' : ''}{name}{isMyVote ? ' ✓' : ''}
                        </Text>
                        <Text style={{ ...typography.caption, color: colors.textMuted }}>{count} ({pct}%)</Text>
                      </View>
                      <View style={{ height: 6, borderRadius: 3, backgroundColor: colors.border }}>
                        <View style={{ height: 6, borderRadius: 3, backgroundColor: isMyVote ? colors.accent : brand.orange, width: `${pct}%` as any }} />
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
            {mvpVotingDeadline && (
              <Text style={{ ...typography.caption, color: colors.textMuted, textAlign: 'center' }}>
                Votación cerrada el {formatDeadline(mvpVotingDeadline)}
              </Text>
            )}
            {adminDeadlinePanel}
          </View>
        </Card>
        {pointsModal}
      </>
    );
  }

  if (!canVote) {
    const winner = voteResult?.winner;
    const totalVotes = voteResult?.totalVotes ?? voteResult?.total_votes ?? 0;
    const votes: any[] = voteResult?.votes ?? voteResult?.results ?? [];
    return (
      <>
        <Card>
          <View style={{ gap: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Trophy size={18} color={brand.orange} />
              <Text style={{ ...typography.h3, color: colors.text }}>VOTACIÓN MVP</Text>
              <View style={{ marginLeft: 'auto' as any, backgroundColor: `${colors.textMuted}18`, borderRadius: 9999, paddingHorizontal: 8, paddingVertical: 3 }}>
                <Text style={{ ...typography.caption, color: colors.textMuted }}>{totalVotes} votos</Text>
              </View>
            </View>
            {mvpVotingDeadline && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: `${brand.orange}12`, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 }}>
                <Text style={{ ...typography.caption, color: brand.orange }}>Cierra el {formatDeadline(mvpVotingDeadline)}</Text>
              </View>
            )}
            {winner ? (
              <View style={{ alignItems: 'center', gap: 6, paddingVertical: 8 }}>
                <Trophy size={32} color={brand.orange} />
                <Text style={{ ...typography.body, color: colors.text, fontFamily: 'Inter_700Bold' }}>{winner.playerName ?? winner.player_name}</Text>
                <Text style={{ ...typography.caption, color: colors.textMuted }}>{winner.percentage ?? winner.votePercentage ?? 0}% de {totalVotes} votos</Text>
              </View>
            ) : (
              <Text style={{ ...typography.caption, color: colors.textMuted, textAlign: 'center' }}>Sin votos aún</Text>
            )}
            {votes.length > 0 && (
              <View style={{ gap: 8 }}>
                {votes.map((v: any, i: number) => {
                  const pct = v.percentage ?? v.votePercentage ?? 0;
                  const name = v.playerName ?? v.player_name ?? 'Jugador';
                  const count = v.votes ?? v.voteCount ?? v.count ?? 0;
                  return (
                    <View key={i} style={{ gap: 4 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={{ ...typography.caption, color: colors.text }}>{name}</Text>
                        <Text style={{ ...typography.caption, color: colors.textMuted }}>{count} votos ({pct}%)</Text>
                      </View>
                      <View style={{ height: 6, borderRadius: 3, backgroundColor: colors.border }}>
                        <View style={{ height: 6, borderRadius: 3, backgroundColor: brand.orange, width: `${pct}%` as any }} />
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
            {adminDeadlinePanel}
          </View>
        </Card>
        {pointsModal}
      </>
    );
  }

  if (hasVoted) {
    const winner = voteResult?.winner;
    const totalVotes = voteResult?.totalVotes ?? voteResult?.total_votes ?? 0;
    const results: any[] = voteResult?.results ?? voteResult?.votes ?? [];
    return (
      <>
        <Card>
          <View style={{ gap: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Star size={18} color={brand.orange} />
              <Text style={{ ...typography.h3, color: colors.text }}>VOTACIÓN MVP</Text>
              <View style={{ marginLeft: 'auto' as any, backgroundColor: `${colors.textMuted}18`, borderRadius: 9999, paddingHorizontal: 8, paddingVertical: 3 }}>
                <Text style={{ ...typography.caption, color: colors.textMuted }}>{totalVotes} votos</Text>
              </View>
            </View>
            {mvpVotingDeadline && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: `${brand.orange}12`, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 }}>
                <Text style={{ ...typography.caption, color: brand.orange }}>Cierra el {formatDeadline(mvpVotingDeadline)}</Text>
              </View>
            )}
            {winner && (
              <View style={{ alignItems: 'center', gap: 6, paddingVertical: 8 }}>
                <Trophy size={32} color={brand.orange} />
                <Text style={{ ...typography.body, color: colors.text, fontFamily: 'Inter_700Bold' }}>{winner.playerName ?? winner.player_name}</Text>
                <Text style={{ ...typography.caption, color: colors.textMuted }}>{winner.percentage ?? winner.votePercentage ?? 0}% de {totalVotes} votos</Text>
              </View>
            )}
            {results.length > 0 && (
              <View style={{ gap: 8 }}>
                {results.map((v: any, i: number) => {
                  const pct = v.percentage ?? v.votePercentage ?? 0;
                  const name = v.playerName ?? v.player_name ?? 'Jugador';
                  const count = v.votes ?? v.voteCount ?? v.count ?? 0;
                  const isMyVote = String(v.playerId ?? v.player_id) === String(userVotedPlayerId);
                  return (
                    <View key={i} style={{ gap: 4 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={{ ...typography.caption, color: isMyVote ? colors.accent : colors.text, fontFamily: isMyVote ? 'Inter_600SemiBold' : 'Inter_400Regular' }}>
                          {name}{isMyVote ? ' ✓' : ''}
                        </Text>
                        <Text style={{ ...typography.caption, color: colors.textMuted }}>{count} ({pct}%)</Text>
                      </View>
                      <View style={{ height: 6, borderRadius: 3, backgroundColor: colors.border }}>
                        <View style={{ height: 6, borderRadius: 3, backgroundColor: isMyVote ? colors.accent : brand.orange, width: `${pct}%` as any }} />
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
            {adminDeadlinePanel}
          </View>
        </Card>
        {pointsModal}
      </>
    );
  }

  if (displayPlayers.length === 0) return pointsModal;

  return (
    <>
      <Card>
        <View style={{ gap: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Star size={18} color={brand.orange} />
            <Text style={{ ...typography.h3, color: colors.text }}>VOTAR MVP</Text>
            <View style={{ marginLeft: 'auto' as any, backgroundColor: `${colors.accent}18`, borderRadius: 9999, paddingHorizontal: 8, paddingVertical: 3 }}>
              <Text style={{ ...typography.caption, color: colors.accent, fontFamily: 'Inter_700Bold' }}>+50 🍑</Text>
            </View>
          </View>
          <Text style={{ ...typography.caption, color: colors.textMuted }}>¿Quién fue el mejor del partido?</Text>
          {mvpVotingDeadline ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: `${brand.orange}12`, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 }}>
              <Text style={{ ...typography.caption, color: brand.orange }}>Cierra el {formatDeadline(mvpVotingDeadline)}</Text>
            </View>
          ) : null}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {displayPlayers.map((p: any) => {
              const pid = String(p.playerId ?? p.player_id ?? p.id);
              const active = selectedPlayer === pid;
              return (
                <TouchableOpacity
                  key={pid}
                  onPress={() => setSelectedPlayer(pid)}
                  style={{
                    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 2,
                    borderColor: active ? colors.accent : colors.border,
                    backgroundColor: active ? `${colors.accent}18` : colors.cardAlt,
                    flexDirection: 'row', alignItems: 'center', gap: 6,
                  }}
                >
                  <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: active ? colors.accent : colors.textMuted, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontSize: 10, color: '#fff', fontFamily: 'Inter_700Bold' }}>{p.dorsal ?? '?'}</Text>
                  </View>
                  <Text style={{ ...typography.caption, color: active ? colors.accent : colors.text, fontFamily: 'Inter_500Medium' }}>
                    {p.playerName ?? p.player_name ?? p.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {error && <Text style={{ ...typography.caption, color: state.error }}>{error}</Text>}
          {selectedPlayer && (
            <Button label={submitting ? 'Enviando...' : 'Enviar voto'} fullWidth loading={submitting} disabled={submitting} onPress={() => setConfirmVisible(true)} />
          )}
          {adminDeadlinePanel}
        </View>

        <Modal transparent animationType="fade" visible={confirmVisible} onRequestClose={() => setConfirmVisible(false)}>
          <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 }} onPress={() => setConfirmVisible(false)}>
            <Pressable style={{ backgroundColor: colors.card, borderRadius: 16, padding: 24, width: '100%', maxWidth: 340, gap: 16 }}>
              <Text style={{ ...typography.h3, color: colors.text, textAlign: 'center' }}>Confirmar voto</Text>
              <Text style={{ ...typography.body, color: colors.textMuted, textAlign: 'center' }}>
                Vas a votar a{' '}
                <Text style={{ color: colors.accent, fontFamily: 'Inter_700Bold' }}>
                  {displayPlayers.find((p: any) => String(p.playerId ?? p.player_id ?? p.id) === selectedPlayer)?.playerName ?? 'este jugador'}
                </Text>
                {' '}como MVP. No podrás cambiarlo después.
              </Text>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity onPress={() => setConfirmVisible(false)} style={{ flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: colors.border, alignItems: 'center' }}>
                  <Text style={{ ...typography.body, color: colors.textMuted }}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleVote} style={{ flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: colors.accent, alignItems: 'center' }}>
                  <Text style={{ ...typography.body, color: '#fff', fontFamily: 'Inter_700Bold' }}>Votar</Text>
                </TouchableOpacity>
              </View>
            </Pressable>
          </Pressable>
        </Modal>
      </Card>
      {pointsModal}
    </>
  );
}

// ── Pantalla principal ────────────────────────────────────────────────────────
export default function PartidoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { isAficionado, isPlayer, isAdmin } = useRole();
  const { user } = useAuth();

  const scrollRef = useRef<ScrollView>(null);
  const [match, setMatch] = useState<Match | null>(null);
  const [lineup, setLineup] = useState<any>(null);
  const [matchEvents, setMatchEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<MatchTab>('resumen');

  // Estado convocatoria admin
  const [squadCall, setSquadCall] = useState<SquadCall | null | undefined>(undefined);
  const [editingSquadCall, setEditingSquadCall] = useState(false);

  const loadMatch = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [rawMatch, rawLineup, rawEvents] = await Promise.all([
        newApi.matches.getMatchById(id) as Promise<any>,
        newApi.matches.getMatchLineups(id).catch(() => null) as Promise<any>,
        newApi.matches.getMatchEvents(id).catch(() => null) as Promise<any>,
      ]);

      const m: Match = {
        id:             String(rawMatch.id ?? id),
        homeTeam:       rawMatch.home_team_name ?? rawMatch.homeTeam ?? '',
        awayTeam:       rawMatch.away_team_name ?? rawMatch.awayTeam ?? '',
        homeTeamId:     rawMatch.home_team_id ?? rawMatch.homeTeamId ?? undefined,
        awayTeamId:     rawMatch.away_team_id ?? rawMatch.awayTeamId ?? undefined,
        homeShieldUrl:  normalizeRffmUrl(rawMatch.home_shield_url ?? rawMatch.homeShieldUrl),
        awayShieldUrl:  normalizeRffmUrl(rawMatch.away_shield_url ?? rawMatch.awayShieldUrl),
        homeScore:      rawMatch.home_score    ?? rawMatch.homeScore,
        awayScore:      rawMatch.away_score    ?? rawMatch.awayScore,
        status:         (rawMatch.status === 'finished' || rawMatch.status === 'played') ? 'finished'
                      : rawMatch.status === 'live' ? 'live' : 'upcoming',
        date:           (rawMatch.date ?? '').slice(0, 10),
        time:           rawMatch.time,
        location:       rawMatch.venue_name ?? rawMatch.location,
        competition:    rawMatch.competition_name ?? rawMatch.competition,
        homeFormation:  rawMatch.home_formation ?? rawMatch.homeFormation ?? undefined,
        awayFormation:  rawMatch.away_formation ?? rawMatch.awayFormation ?? undefined,
        homeCoachName:  rawMatch.home_coach_name ?? rawMatch.homeCoachName ?? undefined,
        awayCoachName:  rawMatch.away_coach_name ?? rawMatch.awayCoachName ?? undefined,
        isSuspended:    rawMatch.is_suspended ?? false,
      };

      setMatch(m);
      setLineup(rawLineup ?? null);
      setMatchEvents(rawEvents?.events ?? []);

      if ((isAdmin || isPlayer) && m.status === 'upcoming') {
        try {
          const sc = await newApi.squadCalls.getSquadCall(id) as any;
          setSquadCall(sc ?? null);
        } catch {
          setSquadCall(null);
        }
      }
    } catch {
      // partido no encontrado
    } finally {
      setLoading(false);
    }
  }, [id, isAdmin, isPlayer]);

  useEffect(() => { loadMatch(); }, [loadMatch]);

  const mapLineupPlayer = (p: any): PlayerLineup => ({
    playerId:     String(p.playerId ?? p.player_id),
    name:         p.playerName ?? p.player_name ?? '',
    dorsal:       p.dorsal ?? 0,
    position:     p.position ?? '',
    x:            p.posX ?? p.pos_x ?? 50,
    y:            p.posY ?? p.pos_y ?? 50,
    isStarter:    p.isStarter    ?? p.is_starter    ?? undefined,
    isSubstitute: p.isSubstitute ?? p.is_substitute ?? undefined,
    isCaptain:    p.isCaptain    ?? p.is_captain    ?? false,
    isGoalkeeper: p.isGoalkeeper ?? p.is_goalkeeper ?? false,
  });

  const mappedStaff: MatchStaffEntry[] = lineup
    ? [
        ...(lineup.home?.staff ?? []).map((s: any): MatchStaffEntry => ({
          staffId:         s.staffId ?? s.staff_id ? String(s.staffId ?? s.staff_id) : undefined,
          staffName:       s.staffName ?? s.staff_name ?? '',
          roleDescription: s.roleDescription ?? s.role_description ?? undefined,
          side:            'home',
        })),
        ...(lineup.away?.staff ?? []).map((s: any): MatchStaffEntry => ({
          staffId:         s.staffId ?? s.staff_id ? String(s.staffId ?? s.staff_id) : undefined,
          staffName:       s.staffName ?? s.staff_name ?? '',
          roleDescription: s.roleDescription ?? s.role_description ?? undefined,
          side:            'away',
        })),
      ]
    : [];

  const matchWithLineup: Match | null = match
    ? {
        ...match,
        staff: mappedStaff.length > 0 ? mappedStaff : undefined,
        lineup: lineup
          ? {
              home: (lineup.home?.players ?? []).map(mapLineupPlayer),
              away: (lineup.away?.players ?? []).map(mapLineupPlayer),
            }
          : undefined,
      }
    : null;

  if (loading) return <MatchSkeleton />;

  if (!match) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
        <Ionicons name="football" size={48} color={colors.textMuted} />
        <Text style={{ ...typography.body, color: colors.textMuted }}>Partido no encontrado</Text>
        <Button label="Volver" variant="ghost" onPress={() => router.back()} />
      </View>
    );
  }

  const formattedDate = (() => {
    try {
      const d = parseISO(match.date);
      const datePart = format(d, "EEEE d 'de' MMMM", { locale: es });
      return match.time ? `${datePart}, ${match.time.slice(0, 5)}` : datePart;
    } catch { return match.date; }
  })();

  // Jugador siempre ve Convocatoria en tab 3 (upcoming = info pre-partido, finished = histórico)
  const showConvocatoria = isAdmin ? match.status === 'upcoming' : isPlayer;
  const showBet          = isAficionado && match.status === 'upcoming';
  const showMvp          = !isPlayer && (match.status === 'finished' || match.status === 'live');
  const canVoteMvp       = isAficionado && showMvp;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={{
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 12, paddingTop: 12, paddingBottom: 12,
        borderBottomWidth: 1, borderBottomColor: colors.border,
        backgroundColor: colors.bg,
      }}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} style={{ padding: 4 }}>
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={{ ...typography.h3, color: colors.text, flex: 1, marginLeft: 8 }} numberOfLines={1}>
          {match.homeTeam} vs {match.awayTeam}
        </Text>
      </View>

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 300 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Fecha y lugar */}
        <View style={{ gap: 4 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Clock size={13} color={colors.textMuted} />
            <Text style={{ ...typography.caption, color: colors.textMuted, textTransform: 'capitalize' }}>{formattedDate}</Text>
          </View>
          {match.location && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <MapPin size={13} color={colors.textMuted} />
              <Text style={{ ...typography.caption, color: colors.textMuted }}>{match.location}</Text>
            </View>
          )}
        </View>

        <MatchHero match={match} />

        <MatchTabBar
          active={activeTab}
          onChange={setActiveTab}
          match={match}
          isPlayer={isPlayer}
          isAdmin={isAdmin}
        />

        {/* Resumen */}
        {activeTab === 'resumen' && (
          <>
            {match.isSuspended && (
              <Card>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <AlertTriangle size={20} color={state.error} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ ...typography.label, color: state.error }}>PARTIDO SUSPENDIDO</Text>
                    <Text style={{ ...typography.caption, color: colors.textMuted, marginTop: 2 }}>
                      Este partido ha sido suspendido. Consulta las novedades.
                    </Text>
                  </View>
                </View>
              </Card>
            )}

            {match.status !== 'upcoming' && (match.homeFormation || match.awayFormation || match.homeCoachName || match.awayCoachName || match.homeTeamId === OWN_TEAM_ID || match.awayTeamId === OWN_TEAM_ID) && (() => {
              const perreoIsHome = match.homeTeamId === OWN_TEAM_ID ? true : match.awayTeamId === OWN_TEAM_ID ? false : match.homeTeam.toUpperCase().includes('PERREO');
              return (
                <Card>
                  <Text style={{ ...typography.label, color: colors.textMuted, marginBottom: 10 }}>DATOS TÉCNICOS</Text>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <View style={{ flex: 1, gap: 4 }}>
                      <Text style={{ ...typography.caption, color: colors.text, fontFamily: 'Inter_600SemiBold' }} numberOfLines={1}>{match.homeTeam}</Text>
                      {(perreoIsHome ? '1-4-3-3' : match.homeFormation) && <Text style={{ ...typography.caption, color: colors.textMuted }}>Formación: <Text style={{ color: colors.text, fontFamily: 'Inter_600SemiBold' }}>{perreoIsHome ? '1-4-3-3' : match.homeFormation}</Text></Text>}
                      {match.homeCoachName && <Text style={{ ...typography.caption, color: colors.textMuted }} numberOfLines={1}>{match.homeCoachName}</Text>}
                    </View>
                    <View style={{ width: 1, backgroundColor: colors.border }} />
                    <View style={{ flex: 1, gap: 4, alignItems: 'flex-end' }}>
                      <Text style={{ ...typography.caption, color: colors.text, fontFamily: 'Inter_600SemiBold' }} numberOfLines={1}>{match.awayTeam}</Text>
                      {(perreoIsHome ? match.awayFormation : '1-4-3-3') && <Text style={{ ...typography.caption, color: colors.textMuted, textAlign: 'right' }}>Formación: <Text style={{ color: colors.text, fontFamily: 'Inter_600SemiBold' }}>{perreoIsHome ? match.awayFormation : '1-4-3-3'}</Text></Text>}
                      {match.awayCoachName && <Text style={{ ...typography.caption, color: colors.textMuted }} numberOfLines={1}>{match.awayCoachName}</Text>}
                    </View>
                  </View>
                </Card>
              );
            })()}

            <Card>
              <Text style={{ ...typography.label, color: colors.textMuted, marginBottom: 10 }}>CRONOLOGÍA</Text>
              <EventTimeline events={matchEvents} />
            </Card>

            {match.status === 'upcoming' && !lineup && (
              <Card>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Text style={{ fontSize: 20 }}>⏳</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ ...typography.label, color: colors.text }}>ALINEACIÓN PENDIENTE</Text>
                    <Text style={{ ...typography.caption, color: colors.textMuted, marginTop: 2 }}>
                      El staff publicará la convocatoria antes del partido.
                    </Text>
                  </View>
                </View>
              </Card>
            )}
          </>
        )}

        {/* Alineación */}
        {activeTab === 'alineacion' && match.status !== 'upcoming' && matchWithLineup?.lineup && (
          <Card><Lineup match={matchWithLineup} /></Card>
        )}
        {activeTab === 'alineacion' && match.status === 'upcoming' && (
          <Card>
            <Text style={{ ...typography.label, color: colors.textMuted, marginBottom: 10 }}>ALINEACIÓN</Text>
            <Text style={{ ...typography.caption, color: colors.textMuted, textAlign: 'center', paddingVertical: 12 }}>
              El staff publicará la convocatoria antes del partido.
            </Text>
          </Card>
        )}
        {activeTab === 'alineacion' && match.status !== 'upcoming' && !lineup && (
          <Card>
            <Text style={{ ...typography.label, color: colors.textMuted, marginBottom: 10 }}>ALINEACIÓN</Text>
            <Text style={{ ...typography.caption, color: colors.textMuted, textAlign: 'center', paddingVertical: 12 }}>
              No hay datos de alineación para este partido.
            </Text>
          </Card>
        )}

        {/* Tab 3: Convocatoria / Apuestas / MVP */}
        {activeTab === 'aficionado' && (
          <>
            {/* ADMIN: formulario o vista resumen */}
            {showConvocatoria && isAdmin && (
              squadCall === undefined ? (
                <Card><ActivityIndicator color={colors.accent} /></Card>
              ) : editingSquadCall ? (
                <AdminSquadCallForm
                  matchId={id!}
                  match={match}
                  existingCall={squadCall}
                  onSaved={(sc) => { setSquadCall(sc); setEditingSquadCall(false); }}
                  onCancel={() => setEditingSquadCall(false)}
                />
              ) : squadCall !== null ? (
                <AdminSquadCallView
                  squadCall={squadCall}
                  onEdit={() => setEditingSquadCall(true)}
                />
              ) : (
                <Card>
                  <View style={{ gap: 10 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <ClipboardList size={20} color={colors.text} />
                      <Text style={{ ...typography.h3, color: colors.text }}>CONVOCATORIA</Text>
                    </View>
                    <Text style={{ ...typography.caption, color: colors.textMuted, textAlign: 'center', paddingVertical: 8 }}>
                      No hay convocatoria para este partido.
                    </Text>
                    <TouchableOpacity
                      onPress={() => setEditingSquadCall(true)}
                      style={{
                        borderRadius: 10, paddingVertical: 10, alignItems: 'center',
                        backgroundColor: `${colors.accent}18`,
                        borderWidth: 1, borderColor: `${colors.accent}44`,
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={{ ...typography.caption, color: colors.accent, fontFamily: 'Inter_600SemiBold' }}>
                        Crear convocatoria
                      </Text>
                    </TouchableOpacity>
                  </View>
                </Card>
              )
            )}

            {/* JUGADOR: vista convocatoria */}
            {showConvocatoria && isPlayer && (
              <ConvocatoriaPlayerBlock
                matchId={id!}
                match={match}
                playerId={user?.playerId ?? null}
              />
            )}

            {/* AFICIONADO: apuestas */}
            {showBet && (
              <BetBlock match={match} onInputFocus={() => scrollRef.current?.scrollToEnd({ animated: true })} />
            )}

            {/* Todos: MVP */}
            {showMvp && <MvpVoteBlock match={match} lineup={lineup} canVote={canVoteMvp} />}
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
