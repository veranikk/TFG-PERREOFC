/**
 * Renders the id screen in the mobile app.
 * It composes UI components, hooks and API/store data for this route.
 */

import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { Button } from '../../../src/components/ui/Button';
import { useLocalSearchParams, router, useFocusEffect } from 'expo-router';
import { ChevronLeft, Trash2, Pencil, Newspaper } from 'lucide-react-native';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { useTheme } from '../../../src/hooks/useTheme';
import { useRole } from '../../../src/hooks/useRole';
import { api } from '../../../src/services/api';
import { typography } from '../../../src/theme/typography';
import { NewsArticle } from '../../../src/types';
import { brand, state } from '../../../src/theme/colors';
import { ArticleBody } from '../../../src/components/ui/ArticleBody';
import { ImageViewer } from '../../../src/components/ui/ImageViewer';

// ── Helpers ───────────────────────────────────────────────────────────────────
const CATEGORY_COLORS: Record<string, string> = {
  'VICTORIA':   brand.green,
  'DERROTA':    state.error,
  'EMPATE':     brand.grey,
  'CRÓNICA':    brand.orange,
  'ANÁLISIS':   brand.blue,
  'ENTREVISTA': '#8B5CF6',
  'FICHAJE':    state.warning,
  'CLUB':       brand.grey,
  'PREVIA':     brand.blue,
  'EN DIRECTO': state.error,
};

function categoryColor(cat: string): string {
  return CATEGORY_COLORS[cat.toUpperCase()] ?? brand.orange;
}


// ── Skeleton ──────────────────────────────────────────────────────────────────
function ArticleSkeleton() {
  const { colors } = useTheme();
  const block = (w: any, h: number, r = 10) => (
    <View style={{ width: w, height: h, borderRadius: r, backgroundColor: colors.cardAlt }} />
  );
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        {block(24, 24, 12)}
        {block('60%', 18)}
      </View>
      <ScrollView contentContainerStyle={{ gap: 16 }}>
        {block('100%', 220, 0)}
        <View style={{ paddingHorizontal: 16, gap: 12 }}>
          {block(80, 22, 9999)}
          {block('90%', 28)}
          {block('70%', 28)}
          {block('100%', 16)}
          {block('100%', 16)}
          {block('80%', 16)}
          {block('100%', 16)}
          {block('100%', 16)}
          {block('60%', 16)}
        </View>
      </ScrollView>
    </View>
  );
}

// ── Pantalla ──────────────────────────────────────────────────────────────────
export default function NoticiaScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { canEdit } = useRole();
  const [article, setArticle] = useState<NewsArticle | null>(null);
  const [loading, setLoading]  = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [viewerVisible, setViewerVisible] = useState(false);

  const handleDelete = async () => {
    if (!article) return;
    setDeleting(true);
    try {
      await api.deleteNews(article.id);
      setShowDeleteConfirm(false);
      router.replace('/(main)/noticias' as any);
    } catch (e: any) {
      setShowDeleteConfirm(false);
      // Error silencioso — podría mostrarse un banner pero mantenemos simple
    } finally {
      setDeleting(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (!id) return;
      setLoading(true);
      setArticle(null);
      api.getNewsArticle(id).then((a) => {
        setArticle(a);
        setLoading(false);
      });
    }, [id])
  );

  if (loading) return <ArticleSkeleton />;

  if (!article) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
        <Text style={{ fontSize: 48 }}>📭</Text>
        <Text style={{ ...typography.body, color: colors.textMuted }}>Noticia no encontrada</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 8 }}>
          <Text style={{ ...typography.body, color: colors.accent }}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const catColor = categoryColor(article.category);
  const dateStr  = (() => {
    try {
      return format(parseISO(article.publishedAt), "d 'de' MMMM 'de' yyyy, HH:mm", { locale: es });
    } catch {
      return article.publishedAt;
    }
  })();

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
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} style={{ padding: 4 }}>
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 8 }}>
          <View style={{ backgroundColor: `${catColor}22`, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2, alignSelf: 'flex-start' }}>
            <Text style={{ ...typography.label, color: catColor, fontFamily: 'Inter_700Bold' }}>{article.category}</Text>
          </View>
        </View>
        {canEdit && (
          <View style={{ flexDirection: 'row', gap: 4 }}>
            <TouchableOpacity
              onPress={() => router.push(`/(main)/noticias/editar?id=${article.id}` as any)}
              activeOpacity={0.7}
              style={{ padding: 4 }}
            >
              <Pencil size={20} color={colors.text} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowDeleteConfirm(true)}
              activeOpacity={0.7}
              style={{ padding: 4 }}
            >
              <Trash2 size={20} color="#EF4444" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Imagen hero */}
        {article.imageUrl ? (
          <TouchableOpacity activeOpacity={0.92} onPress={() => setViewerVisible(true)}>
            <Image
              source={{ uri: article.imageUrl }}
              style={{ width: '100%', aspectRatio: 16 / 9 }}
              resizeMode="cover"
            />
          </TouchableOpacity>
        ) : (
          <View style={{ width: '100%', aspectRatio: 16 / 9, backgroundColor: colors.cardAlt, alignItems: 'center', justifyContent: 'center' }}>
            <Newspaper size={48} color={colors.textMuted} />
          </View>
        )}

        <View style={{ padding: 20, gap: 16 }}>
          {/* Título */}
          <Text style={{ ...typography.h1, color: colors.text, lineHeight: 42, fontSize: 30 }}>
            {article.title}
          </Text>

          {/* Meta */}
          <Text style={{ ...typography.caption, color: colors.textMuted, textTransform: 'capitalize' }}>{dateStr}</Text>

          {/* Separador */}
          <View style={{ height: 1, backgroundColor: colors.border }} />

          {/* Cuerpo del artículo */}
          <ArticleBody text={article.body} colors={colors} />
        </View>
      </ScrollView>

      {/* Visor de imagen hero */}
      {article.imageUrl && (
        <ImageViewer
          images={[{ id: article.id, url: article.imageUrl, description: article.title }]}
          initialIndex={0}
          visible={viewerVisible}
          onClose={() => setViewerVisible(false)}
        />
      )}

      {/* Modal confirmación de borrado */}
      <Modal visible={showDeleteConfirm} transparent animationType="fade" onRequestClose={() => setShowDeleteConfirm(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 32 }}>
          <View style={{ backgroundColor: colors.card, borderRadius: 20, padding: 24, gap: 14 }}>
            <Text style={{ ...typography.h3, color: colors.text }}>¿Eliminar noticia?</Text>
            <Text style={{ ...typography.body, color: colors.textMuted }}>
              «{article.title}» se eliminará permanentemente.
            </Text>
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
              <Button label="Cancelar" variant="ghost" onPress={() => setShowDeleteConfirm(false)} style={{ flex: 1 }} disabled={deleting} />
              <Button
                label={deleting ? 'Eliminando...' : 'Eliminar'}
                loading={deleting}
                variant="destructive"
                onPress={handleDelete}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
