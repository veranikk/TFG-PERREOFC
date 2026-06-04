/**
 * Renders the gallery screen in the mobile app.
 * It composes UI components, hooks and API/store data for this route.
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
} from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, router } from 'expo-router';
import { ChevronLeft, Plus, Camera, X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../../../../src/hooks/useTheme';
import { useRole } from '../../../../../../src/hooks/useRole';
import { api } from '../../../../../../src/services/api/index';
import { uploadFile } from '../../../../../../src/services/api/modules/upload';
import { ImageViewer } from '../../../../../../src/components/ui/ImageViewer';
import { BottomSheet } from '../../../../../../src/components/ui/BottomSheet';
import { Button } from '../../../../../../src/components/ui/Button';
import { Input } from '../../../../../../src/components/ui/Input';
import { typography } from '../../../../../../src/theme/typography';
import { brand, state } from '../../../../../../src/theme/colors';
import { PlayerImage } from '../../../../../../src/types';

const { width: SCREEN_W } = Dimensions.get('window');
const COLS = 3;
const GAP = 2;
const CELL = (SCREEN_W - GAP * (COLS - 1)) / COLS;

// ── AddPhotosSheet ─────────────────────────────────────────────────────────────
function AddPhotosSheet({
  visible, onClose, playerId, onAdded,
}: {
  visible: boolean;
  onClose: () => void;
  playerId: string;
  onAdded: (images: PlayerImage[]) => void;
}) {
  const { colors } = useTheme();
  const [picked, setPicked]               = useState<{ uri: string; isLocal: boolean }[]>([]);
  const [pickingLoading, setPickingLoading] = useState(false);
  const [description, setDescription]     = useState('');
  const [uploading, setUploading]         = useState(false);
  const [progress, setProgress]           = useState('');
  const [error, setError]                 = useState('');

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
    const added: PlayerImage[] = [];

    for (let i = 0; i < picked.length; i++) {
      setProgress(`Subiendo ${i + 1} / ${picked.length}...`);
      try {
        const result = await uploadFile(`/upload/player/${playerId}`, picked[i].uri);
        const newImg = await api.playerImages.addImage(playerId, {
          url: result.publicUrl,
          is_profile: false,
          description: description.trim() || undefined,
        });
        added.push(newImg);
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
                  <Image source={{ uri: img.uri }} style={{ width: 72, height: 72, borderRadius: 10 }} contentFit="cover" />
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

        <Input label="Descripción (opcional)" value={description} onChangeText={setDescription} placeholder="Descripción..." autoCapitalize="sentences" />

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

// ── PlayerGalleryScreen ────────────────────────────────────────────────────────

export default function PlayerGalleryScreen() {
  const { id, equipoId } = useLocalSearchParams<{ id: string; equipoId: string }>();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { canEdit } = useRole();

  const [images, setImages] = useState<PlayerImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [addPhotosVisible, setAddPhotosVisible] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [actionImage, setActionImage] = useState<PlayerImage | null>(null);
  const [actionVisible, setActionVisible] = useState(false);

  useEffect(() => {
    loadImages();
  }, [id]);

  async function loadImages() {
    setLoading(true);
    try {
      const data = await api.playerImages.getImages(id);
      setImages(data);
    } catch {
      // silencioso — estado vacío ya comunicado en UI
    } finally {
      setLoading(false);
    }
  }

  function openViewer(index: number) {
    setViewerIndex(index);
    setViewerOpen(true);
  }

  function openActionSheet(img: PlayerImage) {
    setActionImage(img);
    setActionVisible(true);
  }

  async function handleSetProfile() {
    if (!actionImage) return;
    setActionVisible(false);
    try {
      await api.playerImages.setProfile(id, actionImage.id);
      setImages((prev) =>
        prev.map((img) => ({ ...img, isProfile: img.id === actionImage.id }))
      );
    } catch {
      Alert.alert('Error', 'No se pudo establecer la foto de perfil.');
    }
  }

  async function handleDelete() {
    if (!actionImage) return;
    setActionVisible(false);
    Alert.alert(
      'Eliminar foto',
      '¿Seguro que quieres eliminar esta foto?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.playerImages.deleteImage(id, actionImage.id);
              setImages((prev) => prev.filter((img) => img.id !== actionImage.id));
            } catch {
              Alert.alert('Error', 'No se pudo eliminar la foto.');
            }
          },
        },
      ]
    );
  }

  const viewerImages = images.map((img) => ({
    id: img.id,
    url: img.url,
    description: img.description,
  }));

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Header */}
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
        <TouchableOpacity onPress={() => router.push(`/(main)/equipo/${equipoId}/jugador/${id}` as any)} activeOpacity={0.7} style={{ padding: 4 }}>
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={{ fontFamily: 'BebasNeue_400Regular', fontSize: 22, color: colors.text, marginLeft: 8, letterSpacing: 1 }}>
          GALERÍA
        </Text>
      </View>

      {loading ? (
        /* Skeleton: 9 grey squares */
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: GAP, padding: 0 }}>
          {Array.from({ length: 9 }).map((_, i) => (
            <View key={i} style={{ width: CELL, height: CELL * (4 / 3), backgroundColor: colors.cardAlt }} />
          ))}
        </View>
      ) : images.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 }}>
          <Camera size={40} color={colors.textMuted} />
          <Text style={{ ...typography.body, color: colors.textMuted }}>Sin fotos todavía</Text>
          {canEdit && (
            <Text style={{ ...typography.caption, color: colors.textMuted }}>
              Pulsa el botón + para añadir
            </Text>
          )}
        </View>
      ) : (
        <FlatList
          data={images}
          numColumns={COLS}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 100 }}
          columnWrapperStyle={{ gap: GAP }}
          ItemSeparatorComponent={() => <View style={{ height: GAP }} />}
          renderItem={({ item, index }) => (
            <TouchableOpacity
              onPress={() => openViewer(index)}
              onLongPress={() => canEdit && openActionSheet(item)}
              delayLongPress={400}
              activeOpacity={0.85}
            >
              <Image
                source={{ uri: item.url }}
                contentFit="cover"
                cachePolicy="memory-disk"
                style={{
                  width: CELL,
                  height: CELL * (4 / 3),
                  borderWidth: item.isProfile ? 3 : 0,
                  borderColor: item.isProfile ? colors.accent : 'transparent',
                }}
              />
            </TouchableOpacity>
          )}
        />
      )}

      {/* FAB: añadir foto */}
      {canEdit && (
        <TouchableOpacity
          onPress={() => setAddPhotosVisible(true)}
          activeOpacity={0.85}
          style={{
            position: 'absolute',
            bottom: Platform.OS === 'ios' ? 24 : 20,
            right: 20,
            width: 52, height: 52,
            borderRadius: 26,
            backgroundColor: colors.accent,
            alignItems: 'center', justifyContent: 'center',
            shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
            shadowOpacity: 0.25, shadowRadius: 6, elevation: 6,
          }}
        >
          <Plus size={24} color="#fff" />
        </TouchableOpacity>
      )}

      {/* Modal añadir fotos */}
      <AddPhotosSheet
        visible={addPhotosVisible}
        onClose={() => setAddPhotosVisible(false)}
        playerId={id}
        onAdded={(newImages) => setImages((prev) => [...newImages, ...prev])}
      />

      {/* Viewer fullscreen */}
      <ImageViewer
        images={viewerImages}
        initialIndex={viewerIndex}
        visible={viewerOpen}
        onClose={() => setViewerOpen(false)}
      />

      {/* Action sheet (long press) */}
      <BottomSheet
        visible={actionVisible}
        onClose={() => setActionVisible(false)}
        snapHeight={200}
      >
        <View style={{ gap: 10, paddingBottom: 16 }}>
          <Button
            label="Establecer como foto de perfil"
            variant="ghost"
            fullWidth
            onPress={handleSetProfile}
          />
          <Button
            label="Eliminar foto"
            variant="destructive"
            fullWidth
            onPress={handleDelete}
          />
        </View>
      </BottomSheet>
    </View>
  );
}
