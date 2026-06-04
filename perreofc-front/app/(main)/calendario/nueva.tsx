/**
 * Renders the nueva screen in the mobile app.
 * It composes UI components, hooks and API/store data for this route.
 */

import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Switch,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Pressable,
} from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import { router, useLocalSearchParams } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronDown, ChevronUp, Check, Trash2, Clock } from 'lucide-react-native';

import { useTheme } from '../../../src/hooks/useTheme';
import { useRole } from '../../../src/hooks/useRole';
import { api } from '../../../src/services/api';
import { api as newApi } from '../../../src/services/api/index';
import { Input } from '../../../src/components/ui/Input';
import { Button } from '../../../src/components/ui/Button';
import { typography } from '../../../src/theme/typography';
import { brand, state } from '../../../src/theme/colors';
import { EventType, EventVisibility, EventCategory } from '../../../src/types';

// ── Constantes ────────────────────────────────────────────────────────────────
type Tab = 'redactar' | 'tipos';
type RecType = 'weekly' | 'monthly' | 'custom';

const WEEKDAYS = [
  { key: 1, label: 'L' },
  { key: 2, label: 'M' },
  { key: 3, label: 'X' },
  { key: 4, label: 'J' },
  { key: 5, label: 'V' },
  { key: 6, label: 'S' },
  { key: 0, label: 'D' },
] as const;

const EVENT_TYPE_LABELS: Record<EventType, string> = {
  match:    'Partido',
  friendly: 'Amistoso',
  training: 'Entrenamiento',
  medical:  'Médico',
  dinner:   'Cena',
  meeting:  'Reunión',
  other:    'Otro',
};

const EVENT_TYPE_COLORS: Record<EventType, string> = {
  match:    brand.orange,
  friendly: brand.orange,
  training: brand.green,
  medical:  '#EC4899',
  dinner:   '#8B5CF6',
  meeting:  brand.blue,
  other:    brand.grey,
};

const EVENT_TYPES = Object.keys(EVENT_TYPE_LABELS) as EventType[];

const CATEGORY_PALETTE = [
  { hex: '#FE6128' },
  { hex: '#75A8E0' },
  { hex: '#3AAA35' },
  { hex: '#9F9CA5' },
  { hex: '#EF4444' },
  { hex: '#F59E0B' },
  { hex: '#8B5CF6' },
  { hex: '#1E3A8A' },
] as const;

const TODAY = format(new Date(), 'yyyy-MM-dd');

function formatDateHeader(dateStr: string): string {
  try {
    return format(parseISO(dateStr), "EEEE, d 'de' MMMM", { locale: es });
  } catch {
    return dateStr;
  }
}

// ── Schema ────────────────────────────────────────────────────────────────────
const schema = z.object({
  title:       z.string().min(3, 'Mínimo 3 caracteres'),
  description: z.string().optional(),
  location:    z.string().optional(),
});
type FormData = z.infer<typeof schema>;

// ── Componente principal ──────────────────────────────────────────────────────
export default function NuevoEventoScreen() {
  const { colors } = useTheme();
  const { isSuperAdmin } = useRole();
  const { id: editId } = useLocalSearchParams<{ id?: string }>();

  // ── Tabs ──────────────────────────────────────────────────────────────────
  const [tab, setTab] = useState<Tab>('redactar');

  // ── Tipo ──────────────────────────────────────────────────────────────────
  const [selectedType, setSelectedType] = useState<EventType>('training');

  // ── Fecha principal ───────────────────────────────────────────────────────
  const [pickedDate, setPickedDate] = useState(TODAY);
  const [showCal, setShowCal]       = useState(false);

  // ── Hora — modal spinner ──────────────────────────────────────────────────
  const [pickerHour, setPickerHour]     = useState(9);
  const [pickerMinute, setPickerMinute] = useState(0);
  const [timeValue, setTimeValue]       = useState('');   // '' = sin hora
  const [showTimePicker, setShowTimePicker] = useState(false);

  // ── Visibilidad ───────────────────────────────────────────────────────────
  const [visAficionado, setVisAficionado] = useState(true);
  const [visJugador, setVisJugador]       = useState(true);

  // ── Recurrencia ───────────────────────────────────────────────────────────
  const [isRecurring, setIsRecurring]     = useState(false);
  const [recType, setRecType]             = useState<RecType>('weekly');
  const [recInterval, setRecInterval]     = useState('1');
  const [recDays, setRecDays]             = useState<number[]>([]);   // días semana para 'custom'
  const [recEndDate, setRecEndDate]       = useState('');
  const [showRecEndCal, setShowRecEndCal] = useState(false);

  // ── Tipos de evento extra (superadmin) ───────────────────────────────────
  const [eventTypes, setEventTypes]   = useState<EventCategory[]>([]);
  const [loadingTypes, setLoadingTypes] = useState(true);
  const [newTypeName, setNewTypeName] = useState('');
  const [newTypeColor, setNewTypeColor] = useState(CATEGORY_PALETTE[0].hex);
  const [addingType, setAddingType]   = useState(false);
  const [addTypeError, setAddTypeError] = useState('');

  // ── Submit ────────────────────────────────────────────────────────────────
  const [submitting, setSubmitting]   = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // ── Form ──────────────────────────────────────────────────────────────────
  const { control, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { title: '', description: '', location: '' },
  });

  // ── Cargar tipos extra ────────────────────────────────────────────────────
  useEffect(() => {
    newApi.events.getEventCategories()
      .then(setEventTypes)
      .catch(() => setEventTypes([]))
      .finally(() => setLoadingTypes(false));
  }, []);

  // ── Pre-rellenar campos si estamos editando ───────────────────────────────
  useEffect(() => {
    if (!editId) return;
    newApi.events.getEventById(editId).then((event) => {
      reset({ title: event.title, description: event.description ?? '', location: event.location ?? '' });
      setSelectedType(event.type as EventType);
      setPickedDate(event.date);
      if (event.time) {
        const [h, m] = event.time.split(':').map(Number);
        setPickerHour(h);
        setPickerMinute(m);
        setTimeValue(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
      }
      setVisAficionado(event.visibility?.includes('aficionado') ?? false);
      setVisJugador(event.visibility?.includes('jugador') ?? false);
      if (event.recurrence) {
        setIsRecurring(true);
        setRecType(event.recurrence.type as RecType);
        setRecInterval(String(event.recurrence.interval ?? 1));
        setRecEndDate(event.recurrence.endDate ?? '');
      }
    }).catch(() => {});
  }, [editId]);

  // ── Calendar theme ────────────────────────────────────────────────────────
  const calTheme = useMemo(() => ({
    calendarBackground: colors.cardAlt,
    textSectionTitleColor: colors.textMuted,
    selectedDayBackgroundColor: colors.accent,
    selectedDayTextColor: '#FDFFFF',
    todayTextColor: colors.accent,
    dayTextColor: colors.text,
    textDisabledColor: `${colors.textMuted}66`,
    arrowColor: colors.accent,
    monthTextColor: colors.text,
    textDayFontFamily: 'Inter_400Regular',
    textMonthFontFamily: 'BebasNeue_400Regular',
    textDayHeaderFontFamily: 'Inter_500Medium',
    textDayFontSize: 13,
    textMonthFontSize: 18,
    textDayHeaderFontSize: 11,
  }), [colors]);

  const markedMain   = useMemo(() => ({ [pickedDate]: { selected: true, selectedColor: colors.accent } }), [pickedDate, colors.accent]);
  const markedRecEnd = useMemo(() => (recEndDate ? { [recEndDate]: { selected: true, selectedColor: colors.accent } } : {}), [recEndDate, colors.accent]);

  // ── Handlers tipos ────────────────────────────────────────────────────────
  const handleCreateType = async () => {
    const name = newTypeName.trim().toUpperCase();
    if (!name) { setAddTypeError('El nombre no puede estar vacío'); return; }
    setAddingType(true);
    setAddTypeError('');
    try {
      const created = await newApi.events.createEventCategory({ name, color: newTypeColor });
      setEventTypes((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
      setNewTypeName('');
      setNewTypeColor(CATEGORY_PALETTE[0].hex);
    } catch (e: any) {
      setAddTypeError(e?.data?.error ?? e?.message ?? 'Error al crear el tipo');
    } finally {
      setAddingType(false);
    }
  };

  const handleDeleteType = async (t: EventCategory) => {
    try {
      await newApi.events.deleteEventCategory(t.id);
      setEventTypes((prev) => prev.filter((c) => c.id !== t.id));
    } catch (e: any) {
      Alert.alert('No se puede eliminar', e?.data?.error ?? e?.message ?? 'Error');
    }
  };

  // ── Confirmar hora ────────────────────────────────────────────────────────
  const confirmTime = () => {
    setTimeValue(`${String(pickerHour).padStart(2, '0')}:${String(pickerMinute).padStart(2, '0')}`);
    setShowTimePicker(false);
  };

  const clearTime = () => {
    setTimeValue('');
    setShowTimePicker(false);
  };

  // ── Toggle día de la semana ───────────────────────────────────────────────
  const toggleDay = (day: number) => {
    setRecDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const onSubmit = async (data: FormData) => {
    const vis: EventVisibility[] = ['admin', 'superadmin'];
    if (visAficionado) vis.unshift('aficionado');
    if (visJugador) vis.splice(visAficionado ? 1 : 0, 0, 'jugador');

    const recurrence = isRecurring ? {
      type:     recType,
      interval: parseInt(recInterval, 10) || 1,
      days:     recType === 'custom' ? recDays : undefined,
      endDate:  recEndDate || undefined,
    } : undefined;

    setSubmitting(true);
    setSubmitError(null);
    try {
      if (editId) {
        await newApi.events.updateEvent(editId, {
          title:       data.title,
          description: data.description || undefined,
          type:        selectedType,
          date:        pickedDate,
          time:        timeValue || undefined,
          location:    data.location || undefined,
          visibility:  vis,
          recurrence,
        } as any);
      } else {
        await api.createEvent({
          title:       data.title,
          description: data.description || undefined,
          type:        selectedType,
          date:        pickedDate,
          time:        timeValue || undefined,
          location:    data.location || undefined,
          visibility:  vis,
          color:       EVENT_TYPE_COLORS[selectedType],
          recurrence,
        } as any);
      }
      router.back();
    } catch (e: any) {
      setSubmitError(e?.data?.error ?? e?.message ?? (editId ? 'Error al actualizar el evento' : 'Error al crear el evento'));
    } finally {
      setSubmitting(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>

      {/* ── Header ── */}
      <View style={{
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 12, paddingTop: 12, paddingBottom: 12,
        borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.bg,
      }}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} style={{ padding: 4 }}>
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={{ ...typography.h3, color: colors.text, marginLeft: 8, flex: 1 }}>{editId ? 'Editar evento' : 'Nuevo evento'}</Text>
      </View>

      {/* ── Tab bar ── */}
      <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.bg }}>
        {([
          { key: 'redactar', label: 'Evento' },
          ...(isSuperAdmin ? [{ key: 'tipos', label: 'Tipos de evento' }] : []),
        ] as { key: Tab; label: string }[]).map(({ key, label }) => (
          <TouchableOpacity
            key={key}
            onPress={() => setTab(key)}
            activeOpacity={0.7}
            style={{ flex: 1, alignItems: 'center', paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: tab === key ? brand.orange : 'transparent' }}
          >
            <Text style={{ ...typography.label, color: tab === key ? brand.orange : colors.textMuted, fontFamily: tab === key ? 'Inter_700Bold' : 'Inter_500Medium' }}>
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Modal time picker ── */}
      <Modal visible={showTimePicker} transparent animationType="fade" onRequestClose={() => setShowTimePicker(false)}>
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}
          onPress={() => setShowTimePicker(false)}
        >
          <Pressable
            style={{ backgroundColor: colors.card, borderRadius: 16, padding: 24, width: 280, gap: 20 }}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={{ ...typography.h3, color: colors.text, textAlign: 'center' }}>HORA DEL EVENTO</Text>

            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
              {/* Horas */}
              <View style={{ alignItems: 'center', gap: 8 }}>
                <TouchableOpacity onPress={() => setPickerHour((h) => (h + 1) % 24)} style={{ padding: 8 }}>
                  <Text style={{ fontSize: 20, color: colors.accent }}>▲</Text>
                </TouchableOpacity>
                <View style={{ width: 72, height: 52, borderRadius: 10, backgroundColor: colors.cardAlt, borderWidth: 1, borderColor: colors.accent, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ ...typography.h2, color: colors.text, fontFamily: 'Inter_700Bold' }}>
                    {String(pickerHour).padStart(2, '0')}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setPickerHour((h) => (h - 1 + 24) % 24)} style={{ padding: 8 }}>
                  <Text style={{ fontSize: 20, color: colors.accent }}>▼</Text>
                </TouchableOpacity>
              </View>

              <Text style={{ ...typography.h2, color: colors.text, fontFamily: 'Inter_700Bold', marginBottom: 4 }}>:</Text>

              {/* Minutos */}
              <View style={{ alignItems: 'center', gap: 8 }}>
                <TouchableOpacity onPress={() => setPickerMinute((m) => (m + 5) % 60)} style={{ padding: 8 }}>
                  <Text style={{ fontSize: 20, color: colors.accent }}>▲</Text>
                </TouchableOpacity>
                <View style={{ width: 72, height: 52, borderRadius: 10, backgroundColor: colors.cardAlt, borderWidth: 1, borderColor: colors.accent, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ ...typography.h2, color: colors.text, fontFamily: 'Inter_700Bold' }}>
                    {String(pickerMinute).padStart(2, '0')}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setPickerMinute((m) => (m - 5 + 60) % 60)} style={{ padding: 8 }}>
                  <Text style={{ fontSize: 20, color: colors.accent }}>▼</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity
                onPress={clearTime}
                style={{ flex: 1, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: colors.border, alignItems: 'center' }}
                activeOpacity={0.7}
              >
                <Text style={{ ...typography.body, color: colors.textMuted }}>Borrar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={confirmTime}
                style={{ flex: 2, padding: 12, borderRadius: 10, backgroundColor: colors.accent, alignItems: 'center' }}
                activeOpacity={0.7}
              >
                <Text style={{ ...typography.body, color: '#fff', fontFamily: 'Inter_600SemiBold' }}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ── Contenido ── */}
      {tab === 'tipos' ? (

        /* ── Pestaña Tipos de evento (solo superadmin) ── */
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
            <Text style={{ ...typography.label, color: colors.textMuted }}>TIPOS PERSONALIZADOS</Text>

            {loadingTypes ? (
              <ActivityIndicator color={colors.accent} style={{ marginTop: 12 }} />
            ) : eventTypes.length === 0 ? (
              <Text style={{ ...typography.body, color: colors.textMuted, textAlign: 'center', paddingVertical: 16 }}>
                No hay tipos personalizados todavía
              </Text>
            ) : (
              eventTypes.map((t) => (
                <View
                  key={t.id}
                  style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.cardAlt, borderRadius: 12, padding: 12, gap: 12, borderWidth: 1, borderColor: colors.border }}
                >
                  <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: t.color }} />
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={{ ...typography.body, color: colors.text, fontFamily: 'Inter_600SemiBold' }}>{t.name}</Text>
                    <Text style={{ ...typography.caption, color: t.color }}>{t.color}</Text>
                  </View>
                  <TouchableOpacity onPress={() => handleDeleteType(t)} activeOpacity={0.7} style={{ padding: 6 }}>
                    <Trash2 size={18} color={state.error} />
                  </TouchableOpacity>
                </View>
              ))
            )}

            {/* Añadir nuevo tipo */}
            <View style={{ gap: 12, backgroundColor: colors.card, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: colors.border, marginTop: 8 }}>
              <Text style={{ ...typography.label, color: colors.textMuted }}>NUEVO TIPO</Text>
              <Input
                label="Nombre"
                value={newTypeName}
                onChangeText={(t) => { setNewTypeName(t); setAddTypeError(''); }}
                placeholder="EJEMPLO: VIAJE"
                autoCapitalize="characters"
                error={addTypeError}
              />
              <View style={{ gap: 8 }}>
                <Text style={{ ...typography.caption, color: colors.textMuted }}>COLOR</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                  {CATEGORY_PALETTE.map(({ hex }) => {
                    const selected = newTypeColor === hex;
                    return (
                      <TouchableOpacity
                        key={hex}
                        onPress={() => setNewTypeColor(hex)}
                        style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: hex, borderWidth: selected ? 3 : 1.5, borderColor: selected ? colors.text : `${hex}99` }}
                      />
                    );
                  })}
                </View>
                {newTypeName.trim().length > 0 && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
                    <Text style={{ ...typography.caption, color: colors.textMuted }}>Vista previa:</Text>
                    <View style={{ backgroundColor: `${newTypeColor}22`, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 }}>
                      <Text style={{ ...typography.label, color: newTypeColor, fontFamily: 'Inter_700Bold' }}>
                        {newTypeName.trim().toUpperCase()}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
              <Button label={addingType ? 'Añadiendo...' : 'Añadir tipo'} loading={addingType} fullWidth onPress={handleCreateType} />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>

      ) : (

        /* ── Pestaña Evento ── */
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">

            {/* Título */}
            <Controller
              control={control}
              name="title"
              render={({ field: { onChange, value } }) => (
                <Input label="Título *" value={value} onChangeText={onChange} error={errors.title?.message} autoCapitalize="sentences" />
              )}
            />

            {/* Tipo de evento */}
            <View style={{ gap: 8 }}>
              <Text style={{ ...typography.label, color: colors.textMuted }}>TIPO DE EVENTO *</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {EVENT_TYPES.map((t) => {
                  const c = EVENT_TYPE_COLORS[t];
                  const active = selectedType === t;
                  return (
                    <TouchableOpacity
                      key={t}
                      onPress={() => setSelectedType(t)}
                      style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 9999, backgroundColor: active ? c : `${c}22`, borderWidth: 1.5, borderColor: active ? c : `${c}66` }}
                    >
                      <Text style={{ ...typography.label, color: active ? '#fff' : c, fontFamily: 'Inter_600SemiBold' }}>
                        {EVENT_TYPE_LABELS[t]}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>


            {/* Fecha */}
            <View style={{ gap: 8 }}>
              <Text style={{ ...typography.label, color: colors.textMuted }}>FECHA *</Text>
              <TouchableOpacity
                onPress={() => setShowCal(v => !v)}
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.cardAlt, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1, borderColor: showCal ? colors.accent : colors.border }}
                activeOpacity={0.7}
              >
                <Text style={{ ...typography.body, color: colors.text, textTransform: 'capitalize' }}>
                  {formatDateHeader(pickedDate)}
                </Text>
                {showCal ? <ChevronUp size={18} color={colors.textMuted} /> : <ChevronDown size={18} color={colors.textMuted} />}
              </TouchableOpacity>
              {showCal && (
                <View style={{ borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: colors.border }}>
                  <Calendar
                    current={pickedDate}
                    onDayPress={(day: DateData) => { setPickedDate(day.dateString); setShowCal(false); }}
                    markedDates={markedMain as any}
                    theme={calTheme as any}
                    firstDay={1}
                  />
                </View>
              )}
            </View>

            {/* Hora — trigger modal spinner */}
            <View style={{ gap: 8 }}>
              <Text style={{ ...typography.label, color: colors.textMuted }}>HORA (OPCIONAL)</Text>
              <TouchableOpacity
                onPress={() => setShowTimePicker(true)}
                style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.cardAlt, borderRadius: 10, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12, height: 44 }}
                activeOpacity={0.8}
              >
                <Clock size={14} color={colors.textMuted} style={{ marginRight: 8 }} />
                <Text style={{ flex: 1, ...typography.body, color: timeValue ? colors.text : colors.textMuted }}>
                  {timeValue || 'HH:MM'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Descripción */}
            <Controller
              control={control}
              name="description"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Descripción (opcional)"
                  value={value ?? ''}
                  onChangeText={onChange}
                  placeholder="Añade más detalles sobre el evento..."
                  multiline
                  numberOfLines={4}
                  autoCapitalize="sentences"
                />
              )}
            />

            {/* Lugar */}
            <Controller
              control={control}
              name="location"
              render={({ field: { onChange, value } }) => (
                <Input label="Lugar" value={value ?? ''} onChangeText={onChange} placeholder="Campo Municipal..." />
              )}
            />

            {/* Visibilidad — checkboxes */}
            <View style={{ gap: 10 }}>
              <Text style={{ ...typography.label, color: colors.textMuted }}>QUIÉN LO VE</Text>
              {([
                { key: 'aficionado', label: 'Aficionados', val: visAficionado, toggle: () => setVisAficionado(v => !v) },
                { key: 'jugador',    label: 'Jugadores',   val: visJugador,    toggle: () => setVisJugador(v => !v) },
              ] as const).map(({ key, label, val, toggle }) => (
                <TouchableOpacity key={key} onPress={toggle} activeOpacity={0.7} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={{ width: 22, height: 22, borderRadius: 4, borderWidth: 2, borderColor: val ? colors.accent : colors.border, backgroundColor: val ? colors.accent : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
                    {val && <Check size={14} color="#fff" />}
                  </View>
                  <Text style={{ ...typography.body, color: colors.text }}>{label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Recurrencia */}
            <View style={{ backgroundColor: isRecurring ? `${colors.accent}10` : colors.cardAlt, borderRadius: 12, borderWidth: 1.5, borderColor: isRecurring ? `${colors.accent}55` : colors.border, padding: 14, gap: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={{ ...typography.body, color: colors.text, fontFamily: 'Inter_600SemiBold' }}>Evento recurrente</Text>
                  <Text style={{ ...typography.caption, color: colors.textMuted }}>
                    {isRecurring ? 'Se repetirá según la frecuencia elegida.' : 'Actívalo para repetir el evento periódicamente.'}
                  </Text>
                </View>
                <Switch value={isRecurring} onValueChange={setIsRecurring} trackColor={{ false: colors.border, true: colors.accent }} thumbColor="#fff" />
              </View>

              {isRecurring && (
                <View style={{ gap: 12 }}>
                  {/* Tipo recurrencia */}
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {([
                      { key: 'weekly',  label: 'Semanal' },
                      { key: 'monthly', label: 'Mensual' },
                      { key: 'custom',  label: 'Días concretos' },
                    ] as { key: RecType; label: string }[]).map(({ key, label }) => {
                      const active = recType === key;
                      return (
                        <TouchableOpacity
                          key={key}
                          onPress={() => setRecType(key)}
                          style={{ flex: 1, paddingVertical: 7, borderRadius: 10, backgroundColor: active ? colors.accent : colors.cardAlt, borderWidth: 1.5, borderColor: active ? colors.accent : colors.border, alignItems: 'center' }}
                          activeOpacity={0.7}
                        >
                          <Text style={{ ...typography.caption, color: active ? '#fff' : colors.textMuted, fontFamily: 'Inter_600SemiBold' }}>
                            {label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {/* Semanal: cada X semanas */}
                  {recType === 'weekly' && (
                    <Input label="Cada X semanas" value={recInterval} onChangeText={setRecInterval} keyboardType="numeric" placeholder="1" />
                  )}

                  {/* Mensual: fijo */}
                  {recType === 'monthly' && (
                    <Text style={{ ...typography.body, color: colors.textMuted }}>1 vez al mes, el mismo día del mes</Text>
                  )}

                  {/* Días concretos: selector L M X J V S D */}
                  {recType === 'custom' && (
                    <View style={{ gap: 8 }}>
                      <Text style={{ ...typography.caption, color: colors.textMuted }}>DÍAS DE LA SEMANA</Text>
                      <View style={{ flexDirection: 'row', gap: 8 }}>
                        {WEEKDAYS.map(({ key, label }) => {
                          const active = recDays.includes(key);
                          return (
                            <TouchableOpacity
                              key={key}
                              onPress={() => toggleDay(key)}
                              style={{
                                flex: 1,
                                height: 40,
                                borderRadius: 8,
                                backgroundColor: active ? colors.accent : colors.cardAlt,
                                borderWidth: 1.5,
                                borderColor: active ? colors.accent : colors.border,
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                              activeOpacity={0.7}
                            >
                              <Text style={{ ...typography.label, color: active ? '#fff' : colors.textMuted, fontFamily: 'Inter_700Bold' }}>
                                {label}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                      {recDays.length === 0 && (
                        <Text style={{ ...typography.caption, color: state.error }}>Selecciona al menos un día</Text>
                      )}
                    </View>
                  )}

                  {/* Fecha fin */}
                  <View style={{ gap: 8 }}>
                    <Text style={{ ...typography.label, color: colors.textMuted }}>FECHA FIN (OPCIONAL)</Text>
                    <TouchableOpacity
                      onPress={() => setShowRecEndCal(v => !v)}
                      style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.bg, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1, borderColor: showRecEndCal ? colors.accent : colors.border }}
                      activeOpacity={0.7}
                    >
                      <Text style={{ ...typography.body, color: recEndDate ? colors.text : colors.textMuted, textTransform: 'capitalize' }}>
                        {recEndDate ? formatDateHeader(recEndDate) : 'Sin fecha fin'}
                      </Text>
                      {showRecEndCal ? <ChevronUp size={18} color={colors.textMuted} /> : <ChevronDown size={18} color={colors.textMuted} />}
                    </TouchableOpacity>
                    {recEndDate ? (
                      <TouchableOpacity onPress={() => setRecEndDate('')} activeOpacity={0.7}>
                        <Text style={{ ...typography.caption, color: colors.textMuted }}>Quitar fecha fin</Text>
                      </TouchableOpacity>
                    ) : null}
                    {showRecEndCal && (
                      <View style={{ borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: colors.border }}>
                        <Calendar
                          current={recEndDate || pickedDate}
                          onDayPress={(day: DateData) => { setRecEndDate(day.dateString); setShowRecEndCal(false); }}
                          markedDates={markedRecEnd as any}
                          theme={calTheme as any}
                          firstDay={1}
                          minDate={pickedDate}
                        />
                      </View>
                    )}
                  </View>
                </View>
              )}
            </View>

            {submitError && (
              <Text style={{ ...typography.caption, color: state.error, textAlign: 'center' }}>{submitError}</Text>
            )}

            <Button label={submitting ? 'Guardando...' : (editId ? 'Actualizar evento' : 'Crear evento')} loading={submitting} fullWidth onPress={handleSubmit(onSubmit)} />
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </View>
  );
}
