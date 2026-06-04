/**
 * Renders the nueva screen in the mobile app.
 * It composes UI components, hooks and API/store data for this route.
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Platform,
  Switch,
  Alert,
  KeyboardAvoidingView,
} from 'react-native';
import { router } from 'expo-router';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, Camera, X, Trash2, Newspaper, AlertTriangle } from 'lucide-react-native';

import { useTheme } from '../../../src/hooks/useTheme';
import { useRole } from '../../../src/hooks/useRole';
import { useAuth } from '../../../src/hooks/useAuth';
import { api as newApi } from '../../../src/services/api/index';
import { fetchClient } from '../../../src/services/api/apiClient';
import { api } from '../../../src/services/api';
import { uploadFile } from '../../../src/services/api/modules/upload';
import { Input } from '../../../src/components/ui/Input';
import { Button } from '../../../src/components/ui/Button';
import { ArticleBody } from '../../../src/components/ui/ArticleBody';
import { typography } from '../../../src/theme/typography';
import { brand, state } from '../../../src/theme/colors';
import type { NewsCategory } from '../../../src/types';

// ── Constantes ─────────────────────────────────────────────────────────────────
type Tab = 'redactar' | 'preview' | 'categorias';

type PickedImage = { uri: string; isLocal: boolean };

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

// ── Schema ─────────────────────────────────────────────────────────────────────
const schema = z.object({
  title: z.string().min(5, 'Mínimo 5 caracteres'),
  body:  z.string().min(20, 'Mínimo 20 caracteres'),
});
type FormData = z.infer<typeof schema>;

// ── Componente principal ───────────────────────────────────────────────────────
export default function NuevaNoticiaScreen() {
  const { colors } = useTheme();
  const { canEdit, isSuperAdmin } = useRole();
  const { user } = useAuth();

  // ── Tabs ──────────────────────────────────────────────────────────────────
  const [tab, setTab] = useState<Tab>('redactar');

  // ── Categorías ────────────────────────────────────────────────────────────
  const [categories, setCategories]   = useState<NewsCategory[]>([]);
  const [loadingCats, setLoadingCats] = useState(true);
  const [selectedCat, setSelectedCat] = useState('');

  // ── Gestión de categorías ─────────────────────────────────────────────────
  const [newCatName, setNewCatName]   = useState('');
  const [newCatColor, setNewCatColor] = useState(CATEGORY_PALETTE[0].hex);
  const [addingCat, setAddingCat]     = useState(false);
  const [addCatError, setAddCatError] = useState('');

  // ── Imagen ────────────────────────────────────────────────────────────────
  const [pickedImage, setPickedImage]   = useState<PickedImage | null>(null);
  const [loadingGallery, setLoadingGallery] = useState(false);

  // ── Featured ──────────────────────────────────────────────────────────────
  const [isFeatures, setIsFeatures] = useState(false);
  const [currentFeaturedTitle, setCurrentFeaturedTitle] = useState<string | null>(null);

  // ── Submit ────────────────────────────────────────────────────────────────
  const [submitting, setSubmitting]   = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // ── Form ──────────────────────────────────────────────────────────────────
  const { control, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { title: '', body: '' },
  });

  const watchedTitle = useWatch({ control, name: 'title' });
  const watchedBody  = useWatch({ control, name: 'body' });

  // ── Cargar categorías y noticia destacada actual ───────────────────────────
  useEffect(() => {
    newApi.news.getCategories()
      .then((cats) => {
        setCategories(cats);
        if (cats.length > 0) setSelectedCat(cats[0].name);
      })
      .catch(() => setCategories([]))
      .finally(() => setLoadingCats(false));

    // Buscar si ya hay una noticia destacada
    fetchClient<any>('/news?page=1&limit=1&featured=true')
      .then((res) => {
        const items: any[] = Array.isArray(res) ? res : (res?.data ?? []);
        setCurrentFeaturedTitle(items[0]?.title ?? null);
      })
      .catch(() => {});
  }, []);

  // ── Handlers imagen ───────────────────────────────────────────────────────
  const handleOpenGallery = async () => {
    setLoadingGallery(true);
    try {
      if (Platform.OS !== 'web') {
        const { status } = await (await import('expo-image-picker')).requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') return;
      }
      const ImagePicker = await import('expo-image-picker');
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.85,
        allowsMultipleSelection: false,
      });
      if (!result.canceled && result.assets.length > 0) {
        setPickedImage({ uri: result.assets[0].uri, isLocal: true });
      }
    } catch { /* silencioso */ } finally {
      setLoadingGallery(false);
    }
  };

  // ── Handlers categorías ───────────────────────────────────────────────────
  const handleCreateCategory = async () => {
    const name = newCatName.trim().toUpperCase();
    if (!name) { setAddCatError('El nombre no puede estar vacío'); return; }
    setAddingCat(true);
    setAddCatError('');
    try {
      const created = await newApi.news.createCategory({ name, color: newCatColor });
      const updated = [...categories, created].sort((a, b) => a.name.localeCompare(b.name));
      setCategories(updated);
      setSelectedCat(created.name);
      setNewCatName('');
      setNewCatColor(CATEGORY_PALETTE[0].hex);
    } catch (e: any) {
      setAddCatError(e?.data?.error ?? e?.message ?? 'Error al crear la categoría');
    } finally {
      setAddingCat(false);
    }
  };

  const handleDeleteCategory = async (cat: NewsCategory) => {
    try {
      await newApi.news.deleteCategory(cat.id);
      const remaining = categories.filter(c => c.id !== cat.id);
      setCategories(remaining);
      if (selectedCat === cat.name) {
        setSelectedCat(remaining[0]?.name ?? '');
      }
    } catch (e: any) {
      const msg = e?.data?.error ?? e?.message ?? 'No se pudo eliminar la categoría';
      Alert.alert('No se puede eliminar', msg);
    }
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const created = await api.createNews({
        title:      data.title,
        body:       data.body,
        category:   selectedCat,
        publishedAt: new Date().toISOString(),
        isFeatures,
      });

      if (created?.id && pickedImage?.isLocal) {
        try {
          const result = await uploadFile(`/upload/news/${created.id}`, pickedImage.uri);
          await newApi.news.setNewsImage(created.id, result.publicUrl);
        } catch { /* imagen no bloquea */ }
      }

      router.back();
    } catch (e: any) {
      setSubmitError(e?.data?.error ?? e?.message ?? 'Error al publicar la noticia');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Preview helpers ───────────────────────────────────────────────────────
  const previewCatColor = categories.find(c => c.name === selectedCat)?.color ?? brand.orange;
  const previewImageUri = pickedImage?.uri;
  const previewDate = format(new Date(), "d 'de' MMMM 'de' yyyy, HH:mm", { locale: es });

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>

      {/* ── Header ── */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingTop: 12,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        backgroundColor: colors.bg,
      }}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} style={{ padding: 4 }}>
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={{ ...typography.h3, color: colors.text, marginLeft: 8, flex: 1 }}>Nueva noticia</Text>
      </View>

      {/* ── Tab bar ── */}
      <View style={{
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        backgroundColor: colors.bg,
      }}>
        {([
          { key: 'redactar',    label: 'Redactar' },
          { key: 'preview',     label: 'Vista previa' },
          ...(isSuperAdmin ? [{ key: 'categorias', label: 'Categorías' }] : []),
        ] as { key: Tab; label: string }[]).map(({ key, label }) => (
          <TouchableOpacity
            key={key}
            onPress={() => setTab(key)}
            activeOpacity={0.7}
            style={{
              flex: 1,
              alignItems: 'center',
              paddingVertical: 12,
              borderBottomWidth: 2,
              borderBottomColor: tab === key ? brand.orange : 'transparent',
            }}
          >
            <Text style={{
              ...typography.label,
              color: tab === key ? brand.orange : colors.textMuted,
              fontFamily: tab === key ? 'Inter_700Bold' : 'Inter_500Medium',
            }}>
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Contenido ── */}
      {tab === 'categorias' ? (
        /* ── Pestaña Categorías (solo superadmin) ── */
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 40 }}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={{ ...typography.label, color: colors.textMuted }}>CATEGORÍAS EXISTENTES</Text>

            {loadingCats ? (
              <ActivityIndicator color={colors.accent} style={{ marginTop: 12 }} />
            ) : categories.length === 0 ? (
              <Text style={{ ...typography.body, color: colors.textMuted, textAlign: 'center', paddingVertical: 16 }}>
                No hay categorías todavía
              </Text>
            ) : (
              categories.map((cat) => (
                <View
                  key={cat.id}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: colors.cardAlt,
                    borderRadius: 12,
                    padding: 12,
                    gap: 12,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: cat.color }} />
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={{ ...typography.body, color: colors.text, fontFamily: 'Inter_600SemiBold' }}>{cat.name}</Text>
                    <Text style={{ ...typography.caption, color: cat.color }}>{cat.color}</Text>
                  </View>
                  <TouchableOpacity onPress={() => handleDeleteCategory(cat)} activeOpacity={0.7} style={{ padding: 6 }}>
                    <Trash2 size={18} color={state.error} />
                  </TouchableOpacity>
                </View>
              ))
            )}

            {/* Añadir nueva categoría */}
            <View style={{ gap: 12, backgroundColor: colors.card, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: colors.border, marginTop: 8 }}>
              <Text style={{ ...typography.label, color: colors.textMuted }}>NUEVA CATEGORÍA</Text>
              <Input
                label="Nombre"
                value={newCatName}
                onChangeText={(t) => { setNewCatName(t); setAddCatError(''); }}
                placeholder="EJEMPLO: FICHAJE"
                autoCapitalize="characters"
                error={addCatError}
              />

              <View style={{ gap: 8 }}>
                <Text style={{ ...typography.caption, color: colors.textMuted }}>COLOR</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                  {CATEGORY_PALETTE.map(({ hex }) => {
                    const selected = newCatColor === hex;
                    return (
                      <TouchableOpacity
                        key={hex}
                        onPress={() => setNewCatColor(hex)}
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: 17,
                          backgroundColor: hex,
                          borderWidth: selected ? 3 : 1.5,
                          borderColor: selected ? colors.text : `${hex}99`,
                        }}
                      />
                    );
                  })}
                </View>
                {/* Preview de la nueva categoría */}
                {newCatName.trim().length > 0 && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
                    <Text style={{ ...typography.caption, color: colors.textMuted }}>Vista previa:</Text>
                    <View style={{ backgroundColor: `${newCatColor}22`, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 }}>
                      <Text style={{ ...typography.label, color: newCatColor, fontFamily: 'Inter_700Bold' }}>
                        {newCatName.trim().toUpperCase()}
                      </Text>
                    </View>
                  </View>
                )}
              </View>

              <Button
                label={addingCat ? 'Añadiendo...' : 'Añadir categoría'}
                loading={addingCat}
                fullWidth
                onPress={handleCreateCategory}
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      ) : tab === 'redactar' ? (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={0}
        >
          <ScrollView
            contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 40 }}
            keyboardShouldPersistTaps="handled"
          >
            {/* Título */}
            <Controller
              control={control}
              name="title"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Título *"
                  value={value}
                  onChangeText={onChange}
                  error={errors.title?.message}
                  autoCapitalize="sentences"
                />
              )}
            />

            {/* Categoría */}
            <View style={{ gap: 8 }}>
              <Text style={{ ...typography.label, color: colors.textMuted }}>CATEGORÍA *</Text>
              {loadingCats ? (
                <ActivityIndicator color={colors.accent} />
              ) : (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {categories.map((cat) => {
                    const active = selectedCat === cat.name;
                    return (
                      <TouchableOpacity
                        key={cat.id}
                        onPress={() => setSelectedCat(cat.name)}
                        style={{
                          paddingHorizontal: 12,
                          paddingVertical: 6,
                          borderRadius: 9999,
                          backgroundColor: active ? cat.color : `${cat.color}22`,
                          borderWidth: 1.5,
                          borderColor: active ? cat.color : `${cat.color}66`,
                        }}
                      >
                        <Text style={{ ...typography.label, color: active ? '#fff' : cat.color, fontFamily: 'Inter_600SemiBold' }}>
                          {cat.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>

            {/* Imagen */}
            <View style={{ gap: 8 }}>
              <Text style={{ ...typography.label, color: colors.textMuted }}>IMAGEN (OPCIONAL)</Text>

              {pickedImage ? (
                <View style={{ borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: colors.border }}>
                  <Image source={{ uri: pickedImage.uri }} style={{ width: '100%', aspectRatio: 16 / 9 }} resizeMode="cover" />
                  <TouchableOpacity
                    onPress={() => setPickedImage(null)}
                    style={{ position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 16, padding: 4 }}
                  >
                    <X size={16} color="#fff" />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  onPress={handleOpenGallery}
                  style={{
                    height: 80,
                    borderRadius: 12,
                    borderWidth: 1.5,
                    borderStyle: 'dashed',
                    borderColor: colors.border,
                    backgroundColor: colors.cardAlt,
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                  }}
                  activeOpacity={0.75}
                >
                  {loadingGallery
                    ? <ActivityIndicator color={colors.accent} />
                    : <>
                        <Camera size={22} color={colors.textMuted} />
                        <Text style={{ ...typography.caption, color: colors.textMuted }}>Toca para abrir la galería</Text>
                      </>
                  }
                </TouchableOpacity>
              )}
            </View>

            {/* Contenido */}
            <Controller
              control={control}
              name="body"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Contenido *"
                  value={value}
                  onChangeText={onChange}
                  multiline
                  numberOfLines={8}
                  error={errors.body?.message}
                  autoCapitalize="sentences"
                  placeholder="Escribe el contenido de la noticia..."
                />
              )}
            />

            {/* Toggle destacada */}
            <View style={{ gap: 6 }}>
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: isFeatures ? `${brand.orange}14` : colors.cardAlt,
                borderRadius: 12,
                borderWidth: 1.5,
                borderColor: isFeatures ? `${brand.orange}55` : colors.border,
                padding: 14,
                gap: 12,
              }}>
                <View style={{ flex: 1, gap: 3 }}>
                  <Text style={{ ...typography.body, color: colors.text, fontFamily: 'Inter_600SemiBold' }}>
                    Noticia destacada
                  </Text>
                  <Text style={{ ...typography.caption, color: colors.textMuted, lineHeight: 18 }}>
                    {isFeatures
                      ? 'Aparecerá fijada en la parte superior de la sección de noticias.'
                      : 'Actívalo para fijarla al inicio. Solo puede haber una destacada.'}
                  </Text>
                </View>
                <Switch
                  value={isFeatures}
                  onValueChange={setIsFeatures}
                  trackColor={{ false: colors.border, true: brand.orange }}
                  thumbColor="#fff"
                />
              </View>
              {isFeatures && currentFeaturedTitle && (
                <View style={{
                  flexDirection: 'row', alignItems: 'flex-start', gap: 8,
                  backgroundColor: `${brand.orange}10`,
                  borderRadius: 8, padding: 10,
                  borderWidth: 1, borderColor: `${brand.orange}40`,
                }}>
                  <AlertTriangle size={14} color={brand.orange} style={{ marginTop: 2 }} />
                  <Text style={{ ...typography.caption, color: brand.orange, lineHeight: 18, flex: 1 }}>
                    Ya hay una destacada: <Text style={{ fontFamily: 'Inter_600SemiBold' }}>«{currentFeaturedTitle}»</Text>. Al publicar, se le quitará el destacado automáticamente.
                  </Text>
                </View>
              )}
            </View>

            {/* Error submit */}
            {submitError && (
              <Text style={{ ...typography.caption, color: state.error, textAlign: 'center' }}>
                {submitError}
              </Text>
            )}

            <Button
              label={submitting ? 'Publicando...' : 'Publicar noticia'}
              loading={submitting}
              fullWidth
              onPress={handleSubmit(onSubmit)}
            />
          </ScrollView>
        </KeyboardAvoidingView>
      ) : (
        /* ── Vista previa ── */
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
          {/* Imagen hero */}
          {previewImageUri ? (
            <Image
              source={{ uri: previewImageUri }}
              style={{ width: '100%', aspectRatio: 16 / 9 }}
              resizeMode="cover"
            />
          ) : (
            <View style={{ width: '100%', aspectRatio: 16 / 9, backgroundColor: colors.cardAlt, alignItems: 'center', justifyContent: 'center' }}>
              <Newspaper size={48} color={colors.textMuted} />
            </View>
          )}

          <View style={{ padding: 20, gap: 16 }}>
            {/* Badge categoría */}
            <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              {selectedCat ? (
                <View style={{ backgroundColor: `${previewCatColor}22`, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 }}>
                  <Text style={{ ...typography.label, color: previewCatColor, fontFamily: 'Inter_700Bold' }}>{selectedCat}</Text>
                </View>
              ) : null}
              {isFeatures && (
                <View style={{ backgroundColor: `${brand.orange}22`, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 }}>
                  <Text style={{ ...typography.label, color: brand.orange, fontFamily: 'Inter_700Bold' }}>DESTACADA</Text>
                </View>
              )}
            </View>

            {/* Título */}
            <Text style={{ ...typography.h1, color: colors.text, lineHeight: 42, fontSize: 30 }}>
              {watchedTitle || 'Título de la noticia'}
            </Text>

            {/* Fecha y autor */}
            <Text style={{ ...typography.caption, color: colors.textMuted, textTransform: 'capitalize' }}>
              {previewDate}
            </Text>

            {/* Separador */}
            <View style={{ height: 1, backgroundColor: colors.border }} />

            {/* Cuerpo */}
            <ArticleBody
              text={watchedBody || '_(sin contenido aún)_'}
              colors={colors}
            />
          </View>
        </ScrollView>
      )}
    </View>
  );
}
