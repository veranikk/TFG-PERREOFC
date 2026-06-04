/**
 * Renders the index screen in the mobile app.
 * It composes UI components, hooks and API/store data for this route.
 */

import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  ActivityIndicator,
  Platform,
  Alert,
  TextInput,
  PanResponder,
} from 'react-native';
import {
  Plus, ChevronLeft, FolderOpen, Newspaper, Camera,
  Star, Trash2, Edit3, Image as ImageIcon, FolderPlus,
  Crown, X, Link, CalendarDays, ChevronDown, ChevronUp,
} from 'lucide-react-native';
import { Calendar, type DateData } from 'react-native-calendars';
import { router, useFocusEffect } from 'expo-router';
import { MotiView } from 'moti';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { useTheme } from '../../../src/hooks/useTheme';
import { useRole } from '../../../src/hooks/useRole';
import { api } from '../../../src/services/api';
import { uploadAlbumPhoto } from '../../../src/services/api/modules/upload';
import { BottomSheet } from '../../../src/components/ui/BottomSheet';
import { Input } from '../../../src/components/ui/Input';
import { Button } from '../../../src/components/ui/Button';
import * as ImagePicker from 'expo-image-picker';
import { ImagePickerSheet, PickedImage } from '../../../src/components/ui/ImagePickerSheet';
import { ImageViewer } from '../../../src/components/ui/ImageViewer';
import { typography } from '../../../src/theme/typography';
import { brand, state } from '../../../src/theme/colors';
import type { NewsArticle } from '../../../src/types';
import type { Album, AlbumDetail, Photo } from '../../../src/services/api/modules/albums';

// ── Constantes ────────────────────────────────────────────────────────────────
const { width: SCREEN_W } = Dimensions.get('window');
const COLS  = 3;
const GAP   = 2;
const cellW = (SCREEN_W - GAP * (COLS - 1)) / COLS;

const CATEGORY_COLORS: Record<string, string> = {
  'VICTORIA': brand.green, 'DERROTA': state.error, 'EMPATE': brand.grey,
  'CRÓNICA': brand.orange, 'ANÁLISIS': brand.blue, 'ENTREVISTA': '#8B5CF6',
  'FICHAJE': state.warning, 'CLUB': brand.grey, 'PREVIA': brand.blue, 'EN DIRECTO': state.error,
};
function categoryColor(cat: string) { return CATEGORY_COLORS[cat.toUpperCase()] ?? brand.orange; }
function formatDate(iso: string) {
  try { return format(parseISO(iso), "d MMM yyyy", { locale: es }); } catch { return iso; }
}

// ── NewsCard ──────────────────────────────────────────────────────────────────
function NewsCard({ article, compact }: { article: NewsArticle; compact?: boolean }) {
  const { colors } = useTheme();
  const catColor = categoryColor(article.category);
  return (
    <TouchableOpacity
      onPress={() => router.push(`/(main)/noticias/${article.id}` as any)}
      activeOpacity={0.85}
      style={{ backgroundColor: colors.card, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: colors.border, flex: 1 }}
    >
      <View>
        {article.imageUrl
          ? <Image source={{ uri: article.imageUrl }} style={{ width: '100%', aspectRatio: 16 / 9 }} resizeMode="cover" />
          : <View style={{ width: '100%', aspectRatio: 16 / 9, backgroundColor: colors.cardAlt, alignItems: 'center', justifyContent: 'center' }}>
              <Newspaper size={compact ? 24 : 32} color={colors.textMuted} />
            </View>
        }
        {article.isFeatures && (
          <View style={{ position: 'absolute', top: 8, right: 8, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: brand.orange, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}>
            <Star size={10} color="#fff" fill="#fff" />
            <Text style={{ ...typography.label, color: '#fff', fontFamily: 'Inter_700Bold', fontSize: 10 }}>DESTACADO</Text>
          </View>
        )}
      </View>
      <View style={{ padding: compact ? 10 : 14, gap: compact ? 6 : 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <View style={{ backgroundColor: `${catColor}22`, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 }}>
            <Text style={{ ...typography.label, color: catColor, fontFamily: 'Inter_700Bold' }}>{article.category}</Text>
          </View>
        </View>
        <Text style={{ ...typography.bodyLg, color: colors.text, fontFamily: 'Inter_700Bold', lineHeight: 22, fontSize: compact ? 13 : 15 }} numberOfLines={compact ? 2 : 3}>
          {article.title}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <Text style={{ ...typography.caption, color: colors.textMuted }}>{article.author}</Text>
          <Text style={{ ...typography.caption, color: colors.border }}>·</Text>
          <Text style={{ ...typography.caption, color: colors.textMuted }}>{formatDate(article.publishedAt)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ── AlbumFormSheet — crear / editar álbum ─────────────────────────────────────
function AlbumFormSheet({
  visible, onClose, onSave, initial,
}: {
  visible: boolean;
  onClose: () => void;
  onSave: (data: { title: string; description: string; eventDate: string }) => Promise<void>;
  initial?: Album | null;
}) {
  const { colors } = useTheme();
  const [title, setTitle]             = useState('');
  const [description, setDescription] = useState('');
  const [eventDate, setEventDate]     = useState('');
  const [showCal, setShowCal]         = useState(false);
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState('');

  useEffect(() => {
    if (visible) {
      setTitle(initial?.title ?? '');
      setDescription(initial?.description ?? '');
      setEventDate(initial?.eventDate ?? '');
      setShowCal(false);
      setError('');
      setSaving(false);
    }
  }, [visible, initial]);

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

  const markedDates = useMemo(() => (
    eventDate ? { [eventDate]: { selected: true, selectedColor: colors.accent } } : {}
  ), [eventDate, colors.accent]);

  const displayDate = eventDate
    ? format(new Date(eventDate + 'T12:00:00'), "d 'de' MMMM 'de' yyyy", { locale: es })
    : 'Sin fecha';

  const handleSave = async () => {
    if (!title.trim()) { setError('El nombre es obligatorio'); return; }
    setSaving(true); setError('');
    try {
      await onSave({ title: title.trim(), description: description.trim(), eventDate });
      onClose();
    } catch (e: any) {
      setError(e?.data?.error ?? e?.message ?? 'Error al guardar el álbum');
    } finally { setSaving(false); }
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title={initial ? 'Editar álbum' : 'Nuevo álbum'}
      snapHeight={showCal ? 620 : 380}
      keyboardAware
    >
      <View style={{ gap: 14, paddingBottom: 8 }}>
        <Input
          label="Nombre del álbum *"
          value={title}
          onChangeText={(t) => { setTitle(t); setError(''); }}
          placeholder="Jornada 5 · Entrenamiento..."
          autoCapitalize="sentences"
        />
        <Input
          label="Descripción"
          value={description}
          onChangeText={setDescription}
          placeholder="Fotos del partido contra..."
          autoCapitalize="sentences"
          multiline
          numberOfLines={2}
        />

        {/* Selector de fecha */}
        <View style={{ gap: 6 }}>
          <Text style={{ ...typography.label, color: colors.textMuted }}>FECHA DEL EVENTO</Text>
          <TouchableOpacity
            onPress={() => setShowCal((v) => !v)}
            activeOpacity={0.7}
            style={{
              flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
              backgroundColor: colors.cardAlt, borderRadius: 12,
              paddingHorizontal: 14, paddingVertical: 12,
              borderWidth: 1, borderColor: showCal ? colors.accent : colors.border,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <CalendarDays size={16} color={eventDate ? colors.accent : colors.textMuted} />
              <Text style={{ ...typography.body, color: eventDate ? colors.text : colors.textMuted, textTransform: 'capitalize' }}>
                {displayDate}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              {eventDate ? (
                <TouchableOpacity
                  onPress={(e) => { e.stopPropagation(); setEventDate(''); setShowCal(false); }}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  activeOpacity={0.7}
                >
                  <X size={14} color={colors.textMuted} />
                </TouchableOpacity>
              ) : null}
              {showCal
                ? <ChevronUp size={16} color={colors.textMuted} />
                : <ChevronDown size={16} color={colors.textMuted} />
              }
            </View>
          </TouchableOpacity>

          {showCal && (
            <View style={{ borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: colors.border }}>
              <Calendar
                current={eventDate || undefined}
                onDayPress={(day: DateData) => { setEventDate(day.dateString); setShowCal(false); }}
                markedDates={markedDates as any}
                theme={calTheme as any}
                firstDay={1}
              />
            </View>
          )}
        </View>

        {!!error && <Text style={{ ...typography.caption, color: state.error, textAlign: 'center' }}>{error}</Text>}
        <Button label={saving ? 'Guardando...' : (initial ? 'Guardar cambios' : 'Crear álbum')} fullWidth loading={saving} onPress={handleSave} />
      </View>
    </BottomSheet>
  );
}

// ── AddPhotosSheet — subir varias fotos a un álbum ───────────────────────────
function AddPhotosSheet({
  visible, onClose, albumId, onAdded,
}: {
  visible: boolean;
  onClose: () => void;
  albumId: string;
  onAdded: (photos: Photo[]) => void;
}) {
  const { colors } = useTheme();
  const [picked, setPicked]           = useState<PickedImage[]>([]);
  const [pickingLoading, setPickingLoading] = useState(false);
  const [description, setDescription] = useState('');
  const [uploading, setUploading]     = useState(false);
  const [progress, setProgress]       = useState('');
  const [error, setError]             = useState('');

  const reset = () => {
    setPicked([]); setDescription(''); setUploading(false); setProgress(''); setError('');
  };
  const handleClose = () => { reset(); onClose(); };

  const handlePickFromGallery = async () => {
    setPickingLoading(true);
    try {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.85,
        allowsMultipleSelection: true,
      });
      if (!result.canceled && result.assets.length > 0) {
        setPicked((prev) => [...prev, ...result.assets.map((a) => ({ uri: a.uri, isLocal: true }))]);
      }
    } catch {
      // usuario canceló o sin permisos
    } finally {
      setPickingLoading(false);
    }
  };

  const handleAdd = async () => {
    setError('');
    if (picked.length === 0) { setError('Selecciona al menos una foto'); return; }

    setUploading(true);
    const added: Photo[] = [];

    for (let i = 0; i < picked.length; i++) {
      setProgress(`Subiendo ${i + 1} / ${picked.length}...`);
      try {
        const photo = await uploadAlbumPhoto(albumId, picked[i].uri, description.trim() || null);
        added.push(photo);
      } catch { /* continúa con la siguiente */ }
    }

    setUploading(false); setProgress('');
    if (added.length > 0) { onAdded(added); handleClose(); }
    else setError('No se pudo subir ninguna imagen');
  };

  return (
    <BottomSheet visible={visible} onClose={handleClose} title="Añadir fotos" snapHeight={420} keyboardAware>
        <View style={{ gap: 12, paddingBottom: 8 }}>
          {/* Miniaturas seleccionadas */}
          {picked.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }}>
              <View style={{ flexDirection: 'row', gap: 8, paddingVertical: 4 }}>
                {picked.map((img, i) => (
                  <View key={i} style={{ position: 'relative' }}>
                    <Image source={{ uri: img.uri }} style={{ width: 72, height: 72, borderRadius: 10 }} resizeMode="cover" />
                    <TouchableOpacity
                      onPress={() => setPicked((prev) => prev.filter((_, idx) => idx !== i))}
                      style={{ position: 'absolute', top: -6, right: -6, backgroundColor: state.error, borderRadius: 10, padding: 2 }}
                    >
                      <X size={12} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </ScrollView>
          )}

          {/* Botón seleccionar */}
          <TouchableOpacity
            onPress={handlePickFromGallery}
            disabled={pickingLoading}
            style={{
              height: 76, borderRadius: 12, borderWidth: 1.5, borderStyle: 'dashed',
              borderColor: colors.border, backgroundColor: colors.cardAlt,
              alignItems: 'center', justifyContent: 'center', gap: 6,
            }}
            activeOpacity={0.75}
          >
            {pickingLoading
              ? <ActivityIndicator size="small" color={colors.textMuted} />
              : <Camera size={22} color={colors.textMuted} />
            }
            <Text style={{ ...typography.caption, color: colors.textMuted }}>
              {picked.length > 0 ? `${picked.length} seleccionada${picked.length > 1 ? 's' : ''} · Añadir más` : 'Toca para elegir fotos'}
            </Text>
          </TouchableOpacity>

          <Input label="Descripción (opcional)" value={description} onChangeText={setDescription} placeholder="Partido vs..." autoCapitalize="sentences" />

          {!!error    && <Text style={{ ...typography.caption, color: state.error, textAlign: 'center' }}>{error}</Text>}
          {!!progress && <Text style={{ ...typography.caption, color: colors.textMuted, textAlign: 'center' }}>{progress}</Text>}

          <Button
            label={uploading ? (progress || 'Subiendo...') : (picked.length > 1 ? `Subir ${picked.length} fotos` : 'Añadir foto')}
            fullWidth
            loading={uploading}
            onPress={handleAdd}
          />
        </View>
    </BottomSheet>
  );
}

// ── PhotoGrid — grid de fotos con long-press para portada ───────────────────
function PhotoGrid({
  album, photos, canEdit,
  onAddPhotos, onDeletePhoto, onSetCover,
}: {
  album: AlbumDetail;
  photos: Photo[];
  canEdit: boolean;
  onAddPhotos: () => void;
  onDeletePhoto: (photoId: string) => void;
  onSetCover: (photoId: string) => void;
}) {
  const { colors } = useTheme();
  const [viewerOpen, setViewerOpen]   = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);

  const viewerImages = photos.map((p) => ({ id: p.id, url: p.url, description: p.description ?? undefined, location: undefined }));

  const handleLongPress = (photoId: string, url: string) => {
    if (!canEdit) return;
    const isCover = album.coverUrl === url;
    Alert.alert(
      'Opciones de foto',
      isCover ? 'Esta foto ya es la portada del álbum.' : '¿Qué quieres hacer?',
      [
        ...(!isCover ? [{ text: 'Poner como portada', onPress: () => onSetCover(photoId) }] : []),
        { text: 'Eliminar foto', style: 'destructive' as const, onPress: () => {
          Alert.alert('Eliminar foto', '¿Seguro que quieres eliminar esta foto?', [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Eliminar', style: 'destructive', onPress: () => onDeletePhoto(photoId) },
          ]);
        }},
        { text: 'Cancelar', style: 'cancel' as const },
      ],
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 90 }}>
        {photos.length === 0 && (
          <View style={{ alignItems: 'center', marginTop: 48, gap: 8 }}>
            <Camera size={40} color={colors.textMuted} />
            <Text style={{ ...typography.body, color: colors.textMuted }}>Sin fotos en este álbum</Text>
            {canEdit && <Text style={{ ...typography.caption, color: colors.textMuted }}>Pulsa + para añadir las primeras</Text>}
          </View>
        )}
        {Array.from({ length: Math.ceil(photos.length / COLS) }, (_, ri) => (
          <View key={ri} style={{ flexDirection: 'row', gap: GAP, marginBottom: GAP }}>
            {photos.slice(ri * COLS, ri * COLS + COLS).map((photo, ci) => {
              const isCover = album.coverUrl === photo.url;
              return (
                <TouchableOpacity
                  key={photo.id}
                  onPress={() => { setViewerIndex(ri * COLS + ci); setViewerOpen(true); }}
                  onLongPress={() => handleLongPress(photo.id, photo.url)}
                  delayLongPress={350}
                  activeOpacity={0.85}
                  style={{ position: 'relative' }}
                >
                  <Image source={{ uri: photo.url }} style={{ width: cellW, height: cellW }} resizeMode="cover" />
                  {isCover && (
                    <View style={{
                      position: 'absolute', bottom: 4, right: 4,
                      backgroundColor: brand.orange, borderRadius: 8,
                      paddingHorizontal: 6, paddingVertical: 2,
                      flexDirection: 'row', alignItems: 'center', gap: 3,
                    }}>
                      <Crown size={10} color="#fff" />
                      <Text style={{ ...typography.label, color: '#fff', fontSize: 9, fontFamily: 'Inter_700Bold' }}>PORTADA</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </ScrollView>

      {canEdit && (
        <TouchableOpacity
          onPress={onAddPhotos}
          activeOpacity={0.85}
          style={{
            position: 'absolute', bottom: Platform.OS === 'ios' ? 24 : 20, right: 20,
            width: 52, height: 52, borderRadius: 26, backgroundColor: colors.accent,
            alignItems: 'center', justifyContent: 'center',
            shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.25, shadowRadius: 6, elevation: 6,
          }}
        >
          <Plus size={24} color="#FDFFFF" />
        </TouchableOpacity>
      )}

      <ImageViewer images={viewerImages} initialIndex={viewerIndex} visible={viewerOpen} onClose={() => setViewerOpen(false)} />
    </View>
  );
}

// ── AlbumsView — lista de álbumes ─────────────────────────────────────────────
function AlbumsView({
  albums, loading, canEdit,
  onOpenAlbum, onCreateAlbum, onEditAlbum, onDeleteAlbum,
}: {
  albums: Album[];
  loading: boolean;
  canEdit: boolean;
  onOpenAlbum: (a: Album) => void;
  onCreateAlbum: () => void;
  onEditAlbum: (a: Album) => void;
  onDeleteAlbum: (a: Album) => void;
}) {
  const { colors } = useTheme();

  if (loading) {
    return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={colors.accent} /></View>;
  }

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 90 }}>
        {albums.length === 0 && (
          <View style={{ alignItems: 'center', marginTop: 48, gap: 8 }}>
            <FolderOpen size={48} color={colors.textMuted} />
            <Text style={{ ...typography.body, color: colors.textMuted }}>Sin álbumes todavía</Text>
            {canEdit && <Text style={{ ...typography.caption, color: colors.textMuted }}>Pulsa + para crear el primero</Text>}
          </View>
        )}
        {albums.map((album, i) => (
          <MotiView key={album.id} from={{ opacity: 0, translateY: 8 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'timing', duration: 250, delay: i * 50 }}>
            <TouchableOpacity
              onPress={() => onOpenAlbum(album)}
              activeOpacity={0.85}
              style={{
                backgroundColor: colors.card, borderRadius: 16, overflow: 'hidden',
                borderWidth: 1, borderColor: colors.border,
                flexDirection: 'row', alignItems: 'center', gap: 14, padding: 12,
              }}
            >
              {album.coverUrl
                ? <Image source={{ uri: album.coverUrl }} style={{ width: 68, height: 68, borderRadius: 10 }} resizeMode="cover" />
                : <View style={{ width: 68, height: 68, borderRadius: 10, backgroundColor: colors.cardAlt, alignItems: 'center', justifyContent: 'center' }}>
                    <FolderOpen size={28} color={colors.textMuted} />
                  </View>
              }
              <View style={{ flex: 1, gap: 3 }}>
                <Text style={{ ...typography.body, color: colors.text, fontFamily: 'Inter_600SemiBold' }} numberOfLines={1}>{album.title}</Text>
                {album.description
                  ? <Text style={{ ...typography.caption, color: colors.textMuted }} numberOfLines={1}>{album.description}</Text>
                  : null
                }
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                  <Text style={{ ...typography.caption, color: colors.textMuted }}>
                    {album.photoCount ?? 0} foto{(album.photoCount ?? 0) !== 1 ? 's' : ''}
                  </Text>
                  {album.eventDate && (
                    <>
                      <Text style={{ ...typography.caption, color: colors.border }}>·</Text>
                      <Text style={{ ...typography.caption, color: colors.textMuted }}>
                        {formatDate(album.eventDate)}
                      </Text>
                    </>
                  )}
                </View>
              </View>

              {canEdit ? (
                <View style={{ flexDirection: 'row', gap: 4 }}>
                  <TouchableOpacity
                    onPress={() => onEditAlbum(album)}
                    style={{ padding: 8, borderRadius: 8, backgroundColor: `${colors.accent}18` }}
                    activeOpacity={0.7}
                  >
                    <Edit3 size={16} color={colors.accent} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => onDeleteAlbum(album)}
                    style={{ padding: 8, borderRadius: 8, backgroundColor: `${state.error}18` }}
                    activeOpacity={0.7}
                  >
                    <Trash2 size={16} color={state.error} />
                  </TouchableOpacity>
                </View>
              ) : (
                <ChevronLeft size={18} color={colors.textMuted} style={{ transform: [{ rotate: '180deg' }] }} />
              )}
            </TouchableOpacity>
          </MotiView>
        ))}
      </ScrollView>

      {canEdit && (
        <TouchableOpacity
          onPress={onCreateAlbum}
          activeOpacity={0.85}
          style={{
            position: 'absolute', bottom: Platform.OS === 'ios' ? 24 : 20, right: 20,
            width: 52, height: 52, borderRadius: 26, backgroundColor: colors.accent,
            alignItems: 'center', justifyContent: 'center',
            shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.25, shadowRadius: 6, elevation: 6,
          }}
        >
          <FolderPlus size={24} color="#FDFFFF" />
        </TouchableOpacity>
      )}
    </View>
  );
}

// ── Pantalla principal ────────────────────────────────────────────────────────
type MainTab = 'noticias' | 'imagenes';

export default function NoticiasScreen() {
  const { colors } = useTheme();
  const { canEdit } = useRole();

  const isWeb      = Platform.OS === 'web';
  const contentMaxW = isWeb ? Math.min(SCREEN_W, 800) : SCREEN_W;
  const NEWS_GAP    = 12;

  const [activeTab, setActiveTab] = useState<MainTab>('noticias');

  // ── Noticias ──────────────────────────────────────────────────────────────
  const [news, setNews]     = useState<NewsArticle[]>([]);
  const [newsLoading, setNewsLoading] = useState(true);

  // ── Álbumes ───────────────────────────────────────────────────────────────
  const [albums, setAlbums]         = useState<Album[]>([]);
  const [albumsLoading, setAlbumsLoading] = useState(false);
  const [openAlbum, setOpenAlbum]   = useState<AlbumDetail | null>(null);
  const [albumLoading, setAlbumLoading] = useState(false);

  // Sheets
  const [showAlbumForm, setShowAlbumForm]   = useState(false);
  const [editingAlbum, setEditingAlbum]     = useState<Album | null>(null);
  const [showAddPhotos, setShowAddPhotos]   = useState(false);

  useFocusEffect(useCallback(() => {
    setNewsLoading(true);
    api.getNews().then((n) => {
      setNews(n.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt)));
      setNewsLoading(false);
    });
  }, []));

  // Cargar álbumes cuando se activa la pestaña
  useEffect(() => {
    if (activeTab === 'imagenes' && albums.length === 0 && !albumsLoading) {
      loadAlbums();
    }
  }, [activeTab]);

  const loadAlbums = async () => {
    setAlbumsLoading(true);
    try {
      const res = await api.getAlbums(1, 50);
      const sorted = [...res.data].sort((a, b) => {
        const dateA = a.eventDate ?? a.createdAt;
        const dateB = b.eventDate ?? b.createdAt;
        return dateB.localeCompare(dateA);
      });
      setAlbums(sorted);
    } catch { /* silencioso */ }
    finally { setAlbumsLoading(false); }
  };

  const openAlbumDetail = async (album: Album) => {
    setAlbumLoading(true);
    try {
      const detail = await api.getAlbum(album.id);
      if (detail) setOpenAlbum(detail);
    } catch { /* silencioso */ }
    finally { setAlbumLoading(false); }
  };

  // ── Handlers álbumes ──────────────────────────────────────────────────────
  const handleSaveAlbum = async (data: { title: string; description: string; eventDate: string }) => {
    if (editingAlbum) {
      const updated = await api.updateAlbum(editingAlbum.id, {
        title:       data.title,
        description: data.description || null,
        eventDate:   data.eventDate   || null,
      });
      setAlbums((prev) => prev.map((a) => a.id === updated.id ? updated : a));
      if (openAlbum?.id === updated.id) setOpenAlbum((prev) => prev ? { ...prev, ...updated } : prev);
    } else {
      const created = await api.createAlbum({
        title:       data.title,
        description: data.description || null,
        eventDate:   data.eventDate   || null,
      });
      setAlbums((prev) => [created, ...prev]);
    }
    setEditingAlbum(null);
  };

  const handleDeleteAlbum = (album: Album) => {
    Alert.alert(
      'Eliminar álbum',
      `¿Eliminar «${album.title}»?\n\nSe eliminarán también todas las fotos del álbum. Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: async () => {
          try {
            await api.deleteAlbum(album.id);
            setAlbums((prev) => prev.filter((a) => a.id !== album.id));
            if (openAlbum?.id === album.id) setOpenAlbum(null);
          } catch { /* silencioso */ }
        }},
      ],
    );
  };

  const handlePhotosAdded = (photos: Photo[]) => {
    if (!openAlbum) return;
    const updated: AlbumDetail = {
      ...openAlbum,
      photos: [...openAlbum.photos, ...photos],
      photoCount: (openAlbum.photoCount ?? 0) + photos.length,
      coverUrl: openAlbum.coverUrl ?? photos[0]?.url ?? null,
    };
    setOpenAlbum(updated);
    setAlbums((prev) => prev.map((a) => a.id === updated.id ? { ...a, photoCount: updated.photoCount, coverUrl: updated.coverUrl } : a));
  };

  const handleDeletePhoto = async (photoId: string) => {
    if (!openAlbum) return;
    try {
      await api.deleteAlbumPhoto(openAlbum.id, photoId);
      const remaining = openAlbum.photos.filter((p) => p.id !== photoId);
      const newCover = remaining.find((p) => p.url === openAlbum.coverUrl)?.url ?? remaining[0]?.url ?? null;
      const updated: AlbumDetail = { ...openAlbum, photos: remaining, photoCount: remaining.length, coverUrl: newCover };
      setOpenAlbum(updated);
      setAlbums((prev) => prev.map((a) => a.id === updated.id ? { ...a, photoCount: remaining.length, coverUrl: newCover } : a));
    } catch { /* silencioso */ }
  };

  const handleSetCover = async (photoId: string) => {
    if (!openAlbum) return;
    try {
      await api.setAlbumCover(openAlbum.id, photoId);
      const photo = openAlbum.photos.find((p) => p.id === photoId);
      if (!photo) return;
      const updated: AlbumDetail = { ...openAlbum, coverUrl: photo.url };
      setOpenAlbum(updated);
      setAlbums((prev) => prev.map((a) => a.id === updated.id ? { ...a, coverUrl: photo.url } : a));
    } catch { /* silencioso */ }
  };

  // ── Swipe-back desde álbum a lista ────────────────────────────────────────
  // Usamos un ref para evitar closures obsoletas en el PanResponder (creado una sola vez)
  const closeAlbumRef = useRef<() => void>(() => {});
  closeAlbumRef.current = () => setOpenAlbum(null);

  const albumSwipePan = useRef(
    PanResponder.create({
      // Solo capturamos el gesto si el movimiento es claramente horizontal
      onMoveShouldSetPanResponder: (_, g) =>
        g.dx > 12 && Math.abs(g.dy) < Math.abs(g.dx),
      onPanResponderRelease: (_, g) => {
        if (g.dx > 50 && g.vx > 0.15) {
          closeAlbumRef.current();
        }
      },
    })
  ).current;

  // ── News helpers ──────────────────────────────────────────────────────────
  const featuredNews = news.find((n) => n.isFeatures);
  const restNews     = news.filter((n) => n.id !== featuredNews?.id);
  const leftNews: NewsArticle[]  = [];
  const rightNews: NewsArticle[] = [];
  restNews.forEach((a, i) => { if (i % 2 === 0) leftNews.push(a); else rightNews.push(a); });

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* ── Tab bar principal ── */}
      <View style={{ flexDirection: 'row', backgroundColor: colors.bg, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        {(['noticias', 'imagenes'] as MainTab[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={{ flex: 1, alignItems: 'center', paddingVertical: 14, borderBottomWidth: 2.5, borderBottomColor: activeTab === tab ? colors.accent : 'transparent' }}
            activeOpacity={0.7}
          >
            <Text style={{ ...typography.body, color: activeTab === tab ? colors.accent : colors.textMuted, fontFamily: activeTab === tab ? 'Inter_600SemiBold' : 'Inter_400Regular' }}>
              {tab === 'noticias' ? 'Noticias' : 'Imágenes'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === 'noticias' ? (
        /* ── Tab Noticias ── */
        <View style={{ flex: 1 }}>
          {newsLoading ? (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={colors.accent} /></View>
          ) : (
            <ScrollView contentContainerStyle={{ paddingBottom: 90 }}>
              <View style={{ alignSelf: 'center', width: contentMaxW, padding: 16, gap: 12 }}>
                {!featuredNews && restNews.length === 0 && (
                  <MotiView from={{ opacity: 0, translateY: 12 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'timing', duration: 400 }} style={{ alignItems: 'center', marginTop: 48, gap: 10 }}>
                    <Newspaper size={48} color={colors.textMuted} />
                    <Text style={{ ...typography.body, color: colors.textMuted }}>Sin noticias publicadas</Text>
                  </MotiView>
                )}
                {featuredNews && (
                  <MotiView from={{ opacity: 0, translateY: 10 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'timing', duration: 300 }}>
                    <NewsCard article={featuredNews} />
                  </MotiView>
                )}
                {isWeb ? (
                  <View style={{ flexDirection: 'row', gap: NEWS_GAP, alignItems: 'flex-start' }}>
                    <View style={{ flex: 1, gap: NEWS_GAP }}>
                      {leftNews.map((a, i) => <MotiView key={a.id} from={{ opacity: 0, translateY: 8 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'timing', duration: 280, delay: i * 60 }}><NewsCard article={a} compact /></MotiView>)}
                    </View>
                    <View style={{ flex: 1, gap: NEWS_GAP }}>
                      {rightNews.map((a, i) => <MotiView key={a.id} from={{ opacity: 0, translateY: 8 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'timing', duration: 280, delay: i * 60 + 30 }}><NewsCard article={a} compact /></MotiView>)}
                    </View>
                  </View>
                ) : (
                  restNews.map((a, i) => <MotiView key={a.id} from={{ opacity: 0, translateY: 8 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'timing', duration: 280, delay: i * 60 }}><NewsCard article={a} /></MotiView>)
                )}
              </View>
            </ScrollView>
          )}
          {canEdit && (
            <TouchableOpacity
              onPress={() => router.push('/(main)/noticias/nueva' as any)}
              activeOpacity={0.85}
              style={{ position: 'absolute', bottom: Platform.OS === 'ios' ? 24 : 20, right: 20, width: 52, height: 52, borderRadius: 26, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.25, shadowRadius: 6, elevation: 6 }}
            >
              <Plus size={24} color="#FDFFFF" />
            </TouchableOpacity>
          )}
        </View>
      ) : openAlbum ? (
        /* ── Dentro de un álbum ── */
        <View style={{ flex: 1 }}>
          {/* Zona de swipe-back: borde izquierdo invisible, captura deslizamiento a la derecha */}
          <View
            {...albumSwipePan.panHandlers}
            style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 28, zIndex: 20 }}
          />
          <View style={{
            flexDirection: 'row', alignItems: 'center', gap: 8,
            paddingHorizontal: 12, paddingVertical: 10,
            borderBottomWidth: 1, borderBottomColor: colors.border,
          }}>
            <TouchableOpacity onPress={() => setOpenAlbum(null)} activeOpacity={0.7} style={{ padding: 4 }}>
              <ChevronLeft size={22} color={colors.accent} />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={{ ...typography.body, color: colors.text, fontFamily: 'Inter_700Bold' }} numberOfLines={1}>{openAlbum.title}</Text>
              {openAlbum.description
                ? <Text style={{ ...typography.caption, color: colors.textMuted }} numberOfLines={1}>{openAlbum.description}</Text>
                : null
              }
            </View>
            {canEdit && (
              <TouchableOpacity
                onPress={() => { setEditingAlbum(openAlbum as unknown as Album); setShowAlbumForm(true); }}
                style={{ padding: 6, borderRadius: 8, backgroundColor: `${colors.accent}18` }}
                activeOpacity={0.7}
              >
                <Edit3 size={16} color={colors.accent} />
              </TouchableOpacity>
            )}
          </View>
          {albumLoading
            ? <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={colors.accent} /></View>
            : <PhotoGrid
                album={openAlbum}
                photos={openAlbum.photos}
                canEdit={canEdit}
                onAddPhotos={() => setShowAddPhotos(true)}
                onDeletePhoto={handleDeletePhoto}
                onSetCover={handleSetCover}
              />
          }
        </View>
      ) : (
        /* ── Lista de álbumes ── */
        <AlbumsView
          albums={albums}
          loading={albumsLoading}
          canEdit={canEdit}
          onOpenAlbum={openAlbumDetail}
          onCreateAlbum={() => { setEditingAlbum(null); setShowAlbumForm(true); }}
          onEditAlbum={(a) => { setEditingAlbum(a); setShowAlbumForm(true); }}
          onDeleteAlbum={handleDeleteAlbum}
        />
      )}

      {/* ── Sheets globales ── */}
      <AlbumFormSheet
        visible={showAlbumForm}
        onClose={() => { setShowAlbumForm(false); setEditingAlbum(null); }}
        onSave={handleSaveAlbum}
        initial={editingAlbum}
      />

      {openAlbum && (
        <AddPhotosSheet
          visible={showAddPhotos}
          onClose={() => setShowAddPhotos(false)}
          albumId={openAlbum.id}
          onAdded={handlePhotosAdded}
        />
      )}
    </View>
  );
}
