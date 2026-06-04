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
} from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, router } from 'expo-router';
import { ChevronLeft, Plus, Camera } from 'lucide-react-native';
import { useTheme } from '../../../../src/hooks/useTheme';
import { useRole } from '../../../../src/hooks/useRole';
import { api } from '../../../../src/services/api/index';
import { ImagePickerSheet } from '../../../../src/components/ui/ImagePickerSheet';
import { ImageViewer } from '../../../../src/components/ui/ImageViewer';
import { BottomSheet } from '../../../../src/components/ui/BottomSheet';
import { Button } from '../../../../src/components/ui/Button';
import { useImageUpload } from '../../../../src/hooks/useImageUpload';
import { typography } from '../../../../src/theme/typography';
import { StaffImage } from '../../../../src/types';

const { width: SCREEN_W } = Dimensions.get('window');
const COLS = 3;
const GAP = 2;
const CELL = (SCREEN_W - GAP * (COLS - 1)) / COLS;

export default function StaffGalleryScreen() {
  const { id, fullName, photoUrl, role, roleDescription } = useLocalSearchParams<{
    id: string;
    fullName?: string;
    photoUrl?: string;
    role?: string;
    roleDescription?: string;
  }>();
  const { colors } = useTheme();
  const { canEdit } = useRole();
  const { uploadMany, isLoading: uploading } = useImageUpload();

  const [images, setImages] = useState<StaffImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [actionImage, setActionImage] = useState<StaffImage | null>(null);
  const [actionVisible, setActionVisible] = useState(false);

  useEffect(() => { loadImages(); }, [id]);

  async function loadImages() {
    setLoading(true);
    try {
      const data = await api.staffImages.getImages(id);
      setImages(data);
    } catch {
      setImages([]);
    } finally {
      setLoading(false);
    }
  }

  function openViewer(index: number) { setViewerIndex(index); setViewerOpen(true); }
  function openActionSheet(img: StaffImage) { setActionImage(img); setActionVisible(true); }

  async function handleSetProfile() {
    if (!actionImage) return;
    setActionVisible(false);
    try {
      await api.staffImages.setProfile(id, actionImage.id);
      setImages((prev) => prev.map((img) => ({ ...img, isProfile: img.id === actionImage.id })));
    } catch {
      Alert.alert('Error', 'No se pudo establecer la foto de perfil.');
    }
  }

  async function handleDelete() {
    if (!actionImage) return;
    setActionVisible(false);
    Alert.alert('Eliminar foto', '¿Seguro que quieres eliminar esta foto?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar', style: 'destructive',
        onPress: async () => {
          try {
            await api.staffImages.deleteImage(id, actionImage.id);
            setImages((prev) => prev.filter((img) => img.id !== actionImage.id));
          } catch {
            Alert.alert('Error', 'No se pudo eliminar la foto.');
          }
        },
      },
    ]);
  }

  const viewerImages = images.map((img) => ({ id: img.id, url: img.url, description: img.description }));

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Header */}
      <View style={{
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 12, paddingTop: 12, paddingBottom: 12,
        borderBottomWidth: 1, borderBottomColor: colors.border,
        backgroundColor: colors.bg,
      }}>
        <TouchableOpacity
          onPress={() => router.push({ pathname: '/(main)/staff/[id]' as any, params: { id, fullName, photoUrl, role, roleDescription } })}
          activeOpacity={0.7} style={{ padding: 4 }}
        >
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={{ fontFamily: 'BebasNeue_400Regular', fontSize: 22, color: colors.text, marginLeft: 8, letterSpacing: 1 }}>
          GALERÍA
        </Text>
      </View>

      {loading ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: GAP }}>
          {Array.from({ length: 9 }).map((_, i) => (
            <View key={i} style={{ width: CELL, height: CELL * (4 / 3), backgroundColor: colors.cardAlt }} />
          ))}
        </View>
      ) : images.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 }}>
          <Camera size={40} color={colors.textMuted} />
          <Text style={{ ...typography.body, color: colors.textMuted }}>Sin fotos todavía</Text>
          {canEdit && <Text style={{ ...typography.caption, color: colors.textMuted }}>Pulsa el botón + para añadir</Text>}
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
                  width: CELL, height: CELL * (4 / 3),
                  borderWidth: item.isProfile ? 3 : 0,
                  borderColor: item.isProfile ? colors.accent : 'transparent',
                }}
              />
            </TouchableOpacity>
          )}
        />
      )}

      {canEdit && (
        <TouchableOpacity
          onPress={() => setPickerVisible(true)}
          activeOpacity={0.85}
          style={{
            position: 'absolute', bottom: Platform.OS === 'ios' ? 24 : 20, right: 20,
            width: 52, height: 52, borderRadius: 26,
            backgroundColor: uploading ? colors.cardAlt : colors.accent,
            alignItems: 'center', justifyContent: 'center',
            shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
            shadowOpacity: 0.25, shadowRadius: 6, elevation: 6,
          }}
        >
          {uploading ? <ActivityIndicator color={colors.accent} /> : <Plus size={24} color="#fff" />}
        </TouchableOpacity>
      )}

      <ImagePickerSheet
        visible={pickerVisible}
        onClose={() => setPickerVisible(false)}
        title="Añadir fotos"
        allowsMultiple
        onPick={async (imgs) => {
          setPickerVisible(false);
          const urls = await uploadMany(imgs, { kind: 'staff', id });
          for (const publicUrl of urls) {
            try {
              const newImg = await api.staffImages.addImage(id, { url: publicUrl, is_profile: false });
              setImages((prev) => [newImg, ...prev]);
            } catch {
              Alert.alert('Error', 'Imagen subida pero no se pudo registrar.');
            }
          }
        }}
      />

      <ImageViewer images={viewerImages} initialIndex={viewerIndex} visible={viewerOpen} onClose={() => setViewerOpen(false)} />

      <BottomSheet visible={actionVisible} onClose={() => setActionVisible(false)} snapHeight={200}>
        <View style={{ gap: 10, paddingBottom: 16 }}>
          <Button label="Establecer como foto de perfil" variant="ghost" fullWidth onPress={handleSetProfile} />
          <Button label="Eliminar foto" variant="destructive" fullWidth onPress={handleDelete} />
        </View>
      </BottomSheet>
    </View>
  );
}
