/**
 * Renders the index screen in the mobile app.
 * It composes UI components, hooks and API/store data for this route.
 */

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  AppState,
} from 'react-native';
import { Calendar, DateData, LocaleConfig } from 'react-native-calendars';

LocaleConfig.locales['es'] = {
  monthNames: ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'],
  monthNamesShort: ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'],
  dayNames: ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'],
  dayNamesShort: ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'],
  today: 'Hoy',
};
LocaleConfig.defaultLocale = 'es';
import { router } from 'expo-router';
import { Plus, X, Trophy, Clock, MapPin, CalendarOff } from 'lucide-react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { useTheme } from '../../../src/hooks/useTheme';
import { useRole } from '../../../src/hooks/useRole';
import { useAuth } from '../../../src/hooks/useAuth';
import { api } from '../../../src/services/api';
import { useEventsStore } from '../../../src/store/useEventsStore';
import { EventCard, TYPE_COLORS } from '../../../src/components/calendar/EventCard';
import { typography } from '../../../src/theme/typography';
import { rf, rs } from '../../../src/theme/responsive';
import { Event, EventVisibility, Match } from '../../../src/types';
import { brand, state } from '../../../src/theme/colors';
import { PERREOFC_TEAM_ID } from '../../../src/config';

// ── Constantes ────────────────────────────────────────────────────────────────
const EVENT_TYPE_COLORS = TYPE_COLORS;

const TODAY = format(new Date(), 'yyyy-MM-dd');

function formatDateHeader(dateStr: string): string {
  try {
    return format(parseISO(dateStr), "EEEE, d 'de' MMMM", { locale: es });
  } catch {
    return dateStr;
  }
}

// ── MatchCard ─────────────────────────────────────────────────────────────────
function MatchCard({ match }: { match: Match }) {
  const { colors } = useTheme();
  const isFinished = match.status === 'finished';
  const isLive     = match.status === 'live';

  const accentColor = isLive     ? state.error
                    : isFinished ? brand.green
                    : brand.blue;

  const statusLabel = isLive     ? 'EN DIRECTO'
                    : isFinished ? 'FINALIZADO'
                    : 'PRÓXIMO';

  return (
    <TouchableOpacity
      onPress={() => router.push(`/(main)/calendario/partido/${match.id}` as any)}
      activeOpacity={0.85}
      style={{
        backgroundColor: colors.card,
        borderRadius: 14,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: colors.border,
        borderLeftWidth: 4,
        borderLeftColor: accentColor,
      }}
    >
      <View style={{ padding: 14, gap: 8 }}>
        {/* Badge estado */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Ionicons name="football" size={16} color={accentColor} />
          <View style={{ backgroundColor: `${accentColor}22`, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 }}>
            <Text style={{ ...typography.label, color: accentColor, fontFamily: 'Inter_700Bold' }}>
              {statusLabel}
            </Text>
          </View>
          {match.competition && (
            <Text style={{ ...typography.caption, color: colors.textMuted }}>{match.competition}</Text>
          )}
        </View>

        {/* Equipos y marcador */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            {match.homeShieldUrl ? (
              <Image source={{ uri: match.homeShieldUrl }} style={{ width: 24, height: 24, borderRadius: 4 }} resizeMode="contain" />
            ) : null}
            <Text style={{ ...typography.body, color: colors.text, fontFamily: 'Inter_600SemiBold', flex: 1 }} numberOfLines={1}>
              {match.homeTeam}
            </Text>
          </View>
          {isFinished || isLive ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={{ ...typography.h3, color: colors.text, fontFamily: 'Inter_700Bold', minWidth: 22, textAlign: 'center' }}>
                {match.homeScore ?? '-'}
              </Text>
              <Text style={{ ...typography.body, color: colors.textMuted }}>–</Text>
              <Text style={{ ...typography.h3, color: colors.text, fontFamily: 'Inter_700Bold', minWidth: 22, textAlign: 'center' }}>
                {match.awayScore ?? '-'}
              </Text>
            </View>
          ) : (
            <Text style={{ ...typography.label, color: colors.textMuted }}>VS</Text>
          )}
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
            <Text style={{ ...typography.body, color: colors.text, fontFamily: 'Inter_600SemiBold', flex: 1, textAlign: 'right' }} numberOfLines={1}>
              {match.awayTeam}
            </Text>
            {match.awayShieldUrl ? (
              <Image source={{ uri: match.awayShieldUrl }} style={{ width: 24, height: 24, borderRadius: 4 }} resizeMode="contain" />
            ) : null}
          </View>
        </View>

        {/* Hora y lugar */}
        {(match.time || match.location) && (
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {match.time && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Clock size={11} color={colors.textMuted} />
                <Text style={{ ...typography.caption, color: colors.textMuted }}>{match.time.slice(0, 5)}</Text>
              </View>
            )}
            {match.location && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <MapPin size={11} color={colors.textMuted} />
                <Text style={{ ...typography.caption, color: colors.textMuted }} numberOfLines={1}>{match.location}</Text>
              </View>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

// ── Pantalla principal ────────────────────────────────────────────────────────
export default function CalendarioScreen() {
  const { colors, scheme } = useTheme();
  const { canEdit } = useRole();
  const { user } = useAuth();

  const { events, loaded, deletedEvent, setEvents, addEvent, undoDelete, clearDeleted } =
    useEventsStore();

  const [loadingInit, setLoadingInit] = useState(!loaded);
  const [selectedDate, setSelectedDate] = useState(TODAY);
  const [calendarKey, setCalendarKey] = useState(0);
  const [visibleMonth, setVisibleMonth] = useState(TODAY.slice(0, 7)); // 'yyyy-MM'
  const [matches, setMatches] = useState<Match[]>([]);

  // Carga inicial (solo una vez)
  useEffect(() => {
    const loadAll = async () => {
      try {
        const [eventsData, teamMatches] = await Promise.all([
          api.getEvents(),
          api.getTeamMatches(PERREOFC_TEAM_ID),
        ]);
        setEvents(eventsData);
        setMatches(teamMatches);
      } catch {
        // silencioso — se muestra empty state
      } finally {
        setLoadingInit(false);
      }
    };
    loadAll();
  }, []);

  const reloadEvents = useCallback(() => {
    api.getEvents().then((e) => setEvents(e));
  }, []);

  // Polling cada 30 s + recarga al volver a primer plano
  useEffect(() => {
    const interval = setInterval(reloadEvents, 30_000);
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') reloadEvents();
    });
    return () => {
      clearInterval(interval);
      sub.remove();
    };
  }, [reloadEvents]);

  // Auto-limpiar banner de deshacer tras 5 s
  useEffect(() => {
    if (!deletedEvent) return;
    const t = setTimeout(() => clearDeleted(), 5000);
    return () => clearTimeout(t);
  }, [deletedEvent]);

  // Filtrar eventos por visibilidad según rol del usuario
  const visibleEvents = useMemo(() => {
    if (!user) return [];
    return events.filter((e) =>
      e.visibility.includes(user.role as EventVisibility),
    );
  }, [events, user]);

  // Color de punto para cada partido según estado
  const matchDotColor = (m: Match) =>
    m.status === 'live'     ? state.error
    : m.status === 'finished' ? brand.green
    : brand.blue;

  // Marcadores del calendario — eventos + partidos
  const markedDates = useMemo(() => {
    const marks: Record<string, any> = {};

    // Días con eventos: dots con color real del evento
    visibleEvents.forEach((event) => {
      const dotColor = event.color ?? EVENT_TYPE_COLORS[event.type];
      if (!marks[event.date]) marks[event.date] = { dots: [] };
      marks[event.date].dots.push({
        key: event.id,
        color: dotColor,
        selectedColor: '#FDFFFF',
      });
    });

    // Partidos — naranja siempre
    matches.forEach((m) => {
      if (!m.date) return;
      if (!marks[m.date]) marks[m.date] = { dots: [] };
      marks[m.date].dots.push({
        key: `match-${m.id}`,
        color: brand.orange,
        selectedColor: '#FDFFFF',
      });
    });

    const d = marks[selectedDate];
    marks[selectedDate] = {
      ...(d ?? { dots: [] }),
      selected: true,
      selectedColor: colors.accent,
    };
    return marks;
  }, [visibleEvents, matches, selectedDate, colors.accent]);

  const dayEvents = useMemo(
    () =>
      visibleEvents
        .filter((e) => e.date === selectedDate)
        .sort((a, b) => (a.time ?? '').localeCompare(b.time ?? '')),
    [visibleEvents, selectedDate],
  );

  // Partidos del día seleccionado
  const dayMatches = useMemo(
    () => matches.filter((m) => m.date === selectedDate),
    [matches, selectedDate],
  );

  const handleDayPress = useCallback((day: DateData) => {
    setSelectedDate(day.dateString);
  }, []);

  const goToToday = useCallback(() => {
    setSelectedDate(TODAY);
    setVisibleMonth(TODAY.slice(0, 7));
    setCalendarKey((k) => k + 1);
  }, []);

  const calTheme = {
    backgroundColor: colors.bg,
    calendarBackground: colors.bg,
    textSectionTitleColor: colors.textMuted,
    selectedDayBackgroundColor: colors.accent,
    selectedDayTextColor: '#FDFFFF',
    todayTextColor: colors.accent,
    dayTextColor: colors.text,
    textDisabledColor: `${colors.textMuted}88`,
    dotColor: colors.accent,
    selectedDotColor: '#FDFFFF',
    arrowColor: colors.accent,
    monthTextColor: colors.text,
    indicatorColor: colors.accent,
    textDayFontFamily: 'Inter_400Regular',
    textMonthFontFamily: 'BebasNeue_400Regular',
    textDayHeaderFontFamily: 'Inter_500Medium',
    textDayFontSize: rf(14),
    textMonthFontSize: rf(20),
    textDayHeaderFontSize: rf(11),
  };

  // Componente de día personalizado para resaltar días con eventos
  const DayComponent = useCallback(({ date, state: dayState, marking }: any) => {
    const dateStr = date?.dateString ?? '';
    const isSelected = marking?.selected;
    const isToday = dateStr === TODAY;
    const dots: { key: string; color: string }[] = marking?.dots ?? [];
    const hasEvents = dots.length > 0;
    const isDisabled = dayState === 'disabled';
    // Color dominante del día = primer dot (orden inserción: eventos primero, luego partidos)
    const dominantColor = dots[0]?.color ?? colors.accent;

    const textColor = isSelected
      ? '#FDFFFF'
      : isDisabled
      ? `${colors.textMuted}55`
      : isToday && !hasEvents
      ? colors.accent
      : colors.text;

    return (
      <TouchableOpacity
        onPress={() => !isDisabled && handleDayPress({ dateString: dateStr } as any)}
        activeOpacity={0.7}
        style={{ alignItems: 'center', justifyContent: 'center', width: rs(34), height: rs(40) }}
      >
        <View style={{
          width: rs(30),
          height: rs(30),
          borderRadius: rs(15),
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: isSelected
            ? dominantColor
            : hasEvents && !isDisabled
            ? `${dominantColor}22`
            : 'transparent',
          borderWidth: isSelected ? 0 : hasEvents && !isDisabled ? 1.5 : 0,
          borderColor: hasEvents && !isSelected && !isDisabled ? `${dominantColor}55` : 'transparent',
        }}>
          <Text style={{
            fontFamily: isToday || hasEvents ? 'Inter_700Bold' : 'Inter_400Regular',
            fontSize: rf(13),
            color: textColor,
          }}>
            {date?.day}
          </Text>
        </View>
        {/* Dots de colores debajo del número */}
        {hasEvents && !isSelected && (
          <View style={{ flexDirection: 'row', gap: 2, marginTop: 1 }}>
            {dots.slice(0, 3).map((dot) => (
              <View
                key={dot.key}
                style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: dot.color }}
              />
            ))}
          </View>
        )}
      </TouchableOpacity>
    );
  }, [colors, handleDayPress]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Botones clasificación, goleadores y hoy */}
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: rs(8), marginHorizontal: rs(12), marginTop: rs(8), marginBottom: 2 }}>
        <TouchableOpacity
          onPress={() => router.push('/clasificacion' as any)}
          activeOpacity={0.8}
          style={{
            flexDirection: 'row', alignItems: 'center', gap: rs(5),
            backgroundColor: colors.cardAlt,
            borderRadius: rs(10), paddingHorizontal: rs(10), paddingVertical: rs(6),
            borderWidth: 1, borderColor: colors.border,
          }}
        >
          <Trophy size={rs(13)} color={colors.textMuted} />
          <Text style={{ ...typography.label, color: colors.textMuted }}>Clasificación</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push('/goleadores' as any)}
          activeOpacity={0.8}
          style={{
            flexDirection: 'row', alignItems: 'center', gap: rs(5),
            backgroundColor: colors.cardAlt,
            borderRadius: rs(10), paddingHorizontal: rs(10), paddingVertical: rs(6),
            borderWidth: 1, borderColor: colors.border,
          }}
        >
          <Ionicons name="football" size={rs(13)} color={colors.textMuted} />
          <Text style={{ ...typography.label, color: colors.textMuted }}>Goleadores</Text>
        </TouchableOpacity>

      </View>

      {/* Banner "Volver a hoy" — visible cuando el día seleccionado no es hoy O el mes visible no es el actual */}
      {(selectedDate !== TODAY || visibleMonth !== TODAY.slice(0, 7)) && (
        <TouchableOpacity
          onPress={goToToday}
          activeOpacity={0.8}
          style={{
            alignSelf: 'center',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 5,
            backgroundColor: `${colors.accent}18`,
            borderRadius: 8,
            paddingHorizontal: 12,
            paddingVertical: 5,
            marginBottom: 4,
            borderWidth: 1,
            borderColor: `${colors.accent}44`,
          }}
        >
          <Text style={{ ...typography.label, color: colors.accent, fontFamily: 'Inter_600SemiBold' }}>
            Ir a hoy
          </Text>
        </TouchableOpacity>
      )}

      {/* Calendario */}
      <Calendar
        key={`${calendarKey}-${scheme}`}
        current={TODAY}
        onDayPress={handleDayPress}
        onMonthChange={(month: DateData) => setVisibleMonth(month.dateString.slice(0, 7))}
        markedDates={markedDates as any}
        markingType={'multi-dot' as any}
        dayComponent={DayComponent}
        theme={calTheme as any}
        style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}
        enableSwipeMonths
        firstDay={1}
      />

      {/* Lista de eventos del día */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: rs(12), gap: rs(8), paddingBottom: 90 }}
      >
        <Text style={{ ...typography.h3, color: colors.text, marginBottom: 4, textTransform: 'capitalize' }}>
          {formatDateHeader(selectedDate)}
        </Text>

        {loadingInit && (
          <ActivityIndicator color={colors.accent} style={{ marginTop: 24 }} />
        )}

        {!loadingInit && dayEvents.length === 0 && dayMatches.length === 0 && (
          <View style={{ alignItems: 'center', marginTop: 32, gap: 8 }}>
            <CalendarOff size={32} color={colors.textMuted} />
            <Text style={{ ...typography.body, color: colors.textMuted }}>Sin eventos este día</Text>
          </View>
        )}

        {/* Partidos del día */}
        {dayMatches.length > 0 && (
          <View style={{ gap: 8 }}>
            <Text style={{ ...typography.label, color: colors.textMuted }}>PARTIDOS</Text>
            {dayMatches.map((m) => (
              <MatchCard key={m.id} match={m} />
            ))}
          </View>
        )}

        {/* Eventos del día */}
        {dayEvents.length > 0 && dayMatches.length > 0 && (
          <Text style={{ ...typography.label, color: colors.textMuted, marginTop: 4 }}>EVENTOS</Text>
        )}
        {dayEvents.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}

      </ScrollView>

      {/* FAB — admin/superadmin */}
      {canEdit && (
        <TouchableOpacity
          onPress={() => router.push('/(main)/calendario/nueva' as any)}
          activeOpacity={0.85}
          style={{
            position: 'absolute',
            bottom: Platform.OS === 'ios' ? rs(20) : rs(16),
            right: rs(16),
            width: rs(48),
            height: rs(48),
            borderRadius: rs(24),
            backgroundColor: colors.accent,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: 0.25,
            shadowRadius: 6,
            elevation: 6,
          }}
        >
          <Plus size={24} color="#FDFFFF" />
        </TouchableOpacity>
      )}

      {/* Banner de deshacer borrado */}
      {deletedEvent && (
        <View style={{
          position: 'absolute',
          bottom: canEdit ? 84 : 16,
          left: 16,
          right: 16,
          backgroundColor: colors.card,
          borderRadius: 14,
          padding: 14,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          borderWidth: 1,
          borderColor: colors.border,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.15,
          shadowRadius: 8,
          elevation: 4,
        }}>
          <Text style={{ ...typography.body, color: colors.text, flex: 1 }} numberOfLines={1}>
            «{deletedEvent.title}» eliminado
          </Text>
          <TouchableOpacity onPress={undoDelete} activeOpacity={0.7}>
            <Text style={{ ...typography.body, color: colors.accent, fontFamily: 'Inter_700Bold' }}>
              Deshacer
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={clearDeleted} activeOpacity={0.7} style={{ padding: 2 }}>
            <X size={16} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
      )}

    </View>
  );
}
