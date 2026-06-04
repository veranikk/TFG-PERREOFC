/**
 * Renders the editar screen in the mobile app.
 * It composes UI components, hooks and API/store data for this route.
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Platform,
  Switch,
  KeyboardAvoidingView,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, Camera, X, Newspaper, AlertTriangle } from 'lucide-react-native';

import { useTheme } from '../../../src/hooks/useTheme';
import { useRole } from '../../../src/hooks/useRole';
import { api as newApi } from '../../../src/services/api/index';
import { fetchClient } from '../../../src/services/api/apiClient';
import { uploadFile } from '../../../src/services/api/modules/upload';
import { Input } from '../../../src/components/ui/Input';
import { Button } from '../../../src/components/ui/Button';
import { ArticleBody } from '../../../src/components/ui/ArticleBody';
import { typography } from '../../../src/theme/typography';
import { brand, state } from '../../../src/theme/colors';
import type { NewsCategory } from '../../../src/types';

// ── Tipos ──────────────────────────────────────────────────────────────────────
type Tab     = 'redactar' | 'preview';
type ImgMode = 'keep' | 'gallery';

type PickedImage = { uri: string; isLocal: boolean };

// ── Schema ─────────────────────────────────────────────────────────────────────
const schema = z.object({
  title: z.string().min(5, 'Mínimo 5 caracteres'),
  body:  z.string().min(20, 'Mínimo 20 caracteres'),
});
type FormData = z.infer<typeof schema>;

// ── Componente principal ───────────────────────────────────────────────────────
export default function EditarNoticiaScreen() {
  const { colors } = useTheme();
  const { canEdit } = useRole();
  const { id } = useLocalSearchParams<{ id: string }>();

  // ── Estado artículo original ───────────────────────────────────────────────
  const [loadingArticle, setLoadingArticle] = useState(true);
  const [existingImageUrl, setExistingImageUrl] = useState<string | undefined>();

  // ── Tabs ──────────────────────────────────────────────────────────────────
  const [tab, setTab] = useState<Tab>('redactar');

  // ── Categorías ────────────────────────────────────────────────────────────
  const [categories, setCategories]   = useState<NewsCategory[]>([]);
  const [loadingCats, setLoadingCats] = useState(true);
  const [selectedCat, setSelectedCat] = useState('');

  // ── Imagen ────────────────────────────────────────────────────────────────
  const [imgMode, setImgMode]           = useState<ImgMode>('keep');
  const [pickedImage, setPickedImage]   = useState<PickedImage | null>(null);
  const [loadingGallery, setLoadingGallery] = useState(false);

  // ── Featured ──────────────────────────────────────────────────────────────
  const [isFeatured, setIsFeatured] = useState(false);
  const [currentFeaturedTitle, setCurrentFeaturedTitle] = useState<string | null>(null);

  // ── Submit ────────────────────────────────────────────────────────────────
  const [submitting, setSubmitting]   = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // ── Form ──────────────────────────────────────────────────────────────────
  const { control, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { title: '', body: '' },
  });

  const watchedTitle = useWatch({ control, name: 'title' });
  const watchedBody  = useWatch({ control, name: 'body' });

  // ── Cargar artículo ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!id) return;
    Promise.all([
      newApi.news.getNewsById(id),
      newApi.news.getCategories(),
      fetchClient<any>('/news?page=1&limit=1&featured=true'),
    ]).then(([article, cats, featuredRes]) => {
      reset({ title: article.title, body: article.body });
      setIsFeatured((article as any).isFeatures ?? false);
      setExistingImageUrl(article.imageUrl ?? undefined);
      setCategories(cats);
      setSelectedCat(article.category);

      // Noticia destacada actual (si es distinta a la que estamos editando)
      const featuredItems: any[] = Array.isArray(featuredRes) ? featuredRes : (featuredRes?.data ?? []);
      const otherFeatured = featuredItems.find((n: any) => n.id !== id);
      setCurrentFeaturedTitle(otherFeatured?.title ?? null);
    }).catch(() => {
      // Si falla, volvemos atrás
      router.back();
    }).finally(() => {
      setLoadingArticle(false);
      setLoadingCats(false);
    });
  }, [id]);

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

  // ── Submit ────────────────────────────────────────────────────────────────
  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      await newApi.news.updateNews(id!, {
        title:      data.title,
        body:       data.body,
        category:   selectedCat,
        isFeatures: isFeatured,
      } as any);

      // Actualizar imagen solo si el usuario eligió una nueva
      if (imgMode === 'gallery' && pickedImage?.isLocal) {
        try {
          const result = await uploadFile(`/upload/news/${id}`, pickedImage.uri);
          await newApi.news.setNewsImage(id!, result.publicUrl);
        } catch { /* imagen no bloquea */ }
      }

      router.back();
    } catch (e: any) {
      setSubmitError(e?.data?.error ?? e?.message ?? 'Error al guardar los cambios');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Preview helpers ───────────────────────────────────────────────────────
  const previewCatColor = categories.find(c => c.name === selectedCat)?.color ?? brand.orange;
  const previewImageUri = imgMode === 'keep' ? existingImageUrl : pickedImage?.uri;
  const previewDate = format(new Date(), "d 'de' MMMM 'de' yyyy, HH:mm", { locale: es });

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loadingArticle) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

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
        <Text style={{ ...typography.h3, color: colors.text, marginLeft: 8, flex: 1 }}>Editar noticia</Text>
      </View>

      {/* ── Tab bar ── */}
      <View style={{
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        backgroundColor: colors.bg,
      }}>
        {([
          { key: 'redactar', label: 'Redactar' },
          { key: 'preview',  label: 'Vista previa' },
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
      {tab === 'redactar' ? (
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
              <Text style={{ ...typography.label, color: colors.textMuted }}>IMAGEN</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {([
                  { key: 'keep',    label: 'Mantener' },
                  { key: 'gallery', label: 'Galería' },
                ] as { key: ImgMode; label: string }[]).map(({ key, label }) => (
                  <TouchableOpacity
                    key={key}
                    onPress={() => { setImgMode(key); setPickedImage(null); }}
                    style={{
                      flex: 1,
                      paddingVertical: 8,
                      borderRadius: 10,
                      borderWidth: 1.5,
                      borderColor: imgMode === key ? colors.accent : colors.border,
                      backgroundColor: imgMode === key ? `${colors.accent}18` : colors.cardAlt,
                      alignItems: 'center',
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={{ ...typography.caption, color: imgMode === key ? colors.accent : colors.textMuted, fontFamily: 'Inter_600SemiBold', fontSize: 11 }}>
                      {label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Mantener: mostrar imagen actual */}
              {imgMode === 'keep' && existingImageUrl && (
                <View style={{ borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: colors.border }}>
                  <Image source={{ uri: existingImageUrl }} style={{ width: '100%', aspectRatio: 16 / 9 }} resizeMode="cover" />
                </View>
              )}
              {imgMode === 'keep' && !existingImageUrl && (
                <View style={{ height: 60, borderRadius: 12, backgroundColor: colors.cardAlt, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ ...typography.caption, color: colors.textMuted }}>Sin imagen actual</Text>
                </View>
              )}

              {/* Galería */}
              {imgMode === 'gallery' && (
                pickedImage ? (
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
                )
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
                backgroundColor: isFeatured ? `${brand.orange}14` : colors.cardAlt,
                borderRadius: 12,
                borderWidth: 1.5,
                borderColor: isFeatured ? `${brand.orange}55` : colors.border,
                padding: 14,
                gap: 12,
              }}>
                <View style={{ flex: 1, gap: 3 }}>
                  <Text style={{ ...typography.body, color: colors.text, fontFamily: 'Inter_600SemiBold' }}>
                    Noticia destacada
                  </Text>
                  <Text style={{ ...typography.caption, color: colors.textMuted, lineHeight: 18 }}>
                    {isFeatured
                      ? 'Aparecerá fijada en la parte superior de la sección de noticias.'
                      : 'Actívalo para fijarla al inicio. Solo puede haber una destacada.'}
                  </Text>
                </View>
                <Switch
                  value={isFeatured}
                  onValueChange={setIsFeatured}
                  trackColor={{ false: colors.border, true: brand.orange }}
                  thumbColor="#fff"
                />
              </View>
              {isFeatured && currentFeaturedTitle && (
                <View style={{
                  flexDirection: 'row', alignItems: 'flex-start', gap: 8,
                  backgroundColor: `${brand.orange}10`,
                  borderRadius: 8, padding: 10,
                  borderWidth: 1, borderColor: `${brand.orange}40`,
                }}>
                  <AlertTriangle size={14} color={brand.orange} style={{ marginTop: 2 }} />
                  <Text style={{ ...typography.caption, color: brand.orange, lineHeight: 18, flex: 1 }}>
                    Ya hay una destacada: <Text style={{ fontFamily: 'Inter_600SemiBold' }}>«{currentFeaturedTitle}»</Text>. Al guardar, se le quitará el destacado automáticamente.
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
              label={submitting ? 'Guardando...' : 'Guardar cambios'}
              loading={submitting}
              fullWidth
              onPress={handleSubmit(onSubmit)}
            />
          </ScrollView>
        </KeyboardAvoidingView>
      ) : (
        /* ── Vista previa ── */
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
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
            <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              {selectedCat ? (
                <View style={{ backgroundColor: `${previewCatColor}22`, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 }}>
                  <Text style={{ ...typography.label, color: previewCatColor, fontFamily: 'Inter_700Bold' }}>{selectedCat}</Text>
                </View>
              ) : null}
              {isFeatured && (
                <View style={{ backgroundColor: `${brand.orange}22`, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 }}>
                  <Text style={{ ...typography.label, color: brand.orange, fontFamily: 'Inter_700Bold' }}>DESTACADA</Text>
                </View>
              )}
            </View>

            <Text style={{ ...typography.h1, color: colors.text, lineHeight: 42, fontSize: 30 }}>
              {watchedTitle || 'Título de la noticia'}
            </Text>

            <Text style={{ ...typography.caption, color: colors.textMuted, textTransform: 'capitalize' }}>
              {previewDate}
            </Text>

            <View style={{ height: 1, backgroundColor: colors.border }} />

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
