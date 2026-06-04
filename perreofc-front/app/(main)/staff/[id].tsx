/**
 * Renders the id screen in the mobile app.
 * It composes UI components, hooks and API/store data for this route.
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, router } from 'expo-router';
import { ChevronLeft, Camera, Images } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../src/hooks/useTheme';
import { useRole } from '../../../src/hooks/useRole';
import { api } from '../../../src/services/api/index';
import { ImagePickerSheet } from '../../../src/components/ui/ImagePickerSheet';
import { ImageViewer } from '../../../src/components/ui/ImageViewer';
import { useImageUpload } from '../../../src/hooks/useImageUpload';
import { typography } from '../../../src/theme/typography';

const STAFF_ROLE_LABELS: Record<string, string> = {
  entrenador:         'Entrenador',
  segundo_entrenador: '2º Entrenador',
  preparador_fisico:  'Prep. Físico',
  delegado:           'Delegado',
  auxiliar:           'Auxiliar',
  otro:               'Otro',
};

export default function StaffMemberScreen() {
  const { id, fullName, photoUrl, role, roleDescription } = useLocalSearchParams<{
    id: string;
    fullName: string;
    photoUrl: string;
    role: string;
    roleDescription: string;
  }>();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { canEdit } = useRole();
  const [pickerVisible, setPickerVisible] = useState(false);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [currentPhotoUrl, setCurrentPhotoUrl] = useState<string | undefined>(photoUrl || undefined);
  const { upload, isLoading: uploading, error: uploadError, reset: resetUpload } = useImageUpload();
  const roleLabel = STAFF_ROLE_LABELS[role] ?? role ?? 'Staff';

  useEffect(() => {
    setCurrentPhotoUrl(photoUrl || undefined);
  }, [id]);

  useEffect(() => {
    if (uploadError) {
      Alert.alert('Error al subir imagen', uploadError, [{ text: 'OK', onPress: resetUpload }]);
    }
  }, [uploadError]);

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
        <TouchableOpacity onPress={() => router.navigate('/(main)/equipo' as any)} activeOpacity={0.7} style={{ padding: 4 }}>
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={{ ...typography.h3, color: colors.text, flex: 1, marginLeft: 8 }} numberOfLines={1}>
          {fullName}
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Hero foto */}
        <View style={{ position: 'relative', backgroundColor: '#fff' }}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => currentPhotoUrl && setViewerVisible(true)}
          >
            <Image
              source={currentPhotoUrl ? { uri: currentPhotoUrl } : null}
              placeholder={null}
              contentFit="contain"
              cachePolicy="memory-disk"
              transition={200}
              style={{ width: '100%', aspectRatio: 3 / 4, maxHeight: 360, backgroundColor: '#fff' }}
            />
          </TouchableOpacity>
          <View style={{
            position: 'absolute', bottom: 16, right: 16,
            backgroundColor: '#8B5CF6DD',
            borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6,
          }}>
            <Text style={{ ...typography.label, color: '#fff', fontFamily: 'Inter_700Bold' }}>STAFF</Text>
          </View>
          {canEdit && (
            <TouchableOpacity
              onPress={() => setPickerVisible(true)}
              activeOpacity={0.8}
              style={{
                position: 'absolute',
                bottom: 16,
                alignSelf: 'center',
                left: '50%',
                marginLeft: -22,
                backgroundColor: 'rgba(0,0,0,0.65)',
                width: 44, height: 44, borderRadius: 22,
                alignItems: 'center', justifyContent: 'center',
                borderWidth: 1.5, borderColor: colors.accent,
              }}
            >
              {uploading
                ? <ActivityIndicator color={colors.accent} size="small" />
                : <Camera size={20} color={colors.accent} />
              }
            </TouchableOpacity>
          )}
        </View>

        <View style={{ padding: 20, gap: 20 }}>
          {/* Nombre + rol */}
          <View style={{ gap: 6 }}>
            <Text style={{ ...typography.h1, color: colors.text, fontSize: 28, lineHeight: 34 }}>
              {fullName}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={{ backgroundColor: '#8B5CF622', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 }}>
                <Text style={{ ...typography.label, color: '#8B5CF6', fontFamily: 'Inter_700Bold' }}>{roleLabel}</Text>
              </View>
            </View>
            {roleDescription ? (
              <Text style={{ ...typography.body, color: colors.textMuted, marginTop: 4 }}>{roleDescription}</Text>
            ) : null}
          </View>

          {/* Galería */}
          <TouchableOpacity
            onPress={() => router.push({ pathname: '/(main)/staff/[id]/gallery' as any, params: { id, fullName, photoUrl: currentPhotoUrl ?? '', role, roleDescription } })}
            activeOpacity={0.75}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              paddingVertical: 14,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: colors.card,
            }}
          >
            <Images size={18} color={colors.textMuted} />
            <Text style={{ ...typography.body, color: colors.textMuted, fontFamily: 'Inter_600SemiBold' }}>
              Ver galería de fotos
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {currentPhotoUrl && (
        <ImageViewer
          images={[{ id: id, url: currentPhotoUrl, description: fullName }]}
          initialIndex={0}
          visible={viewerVisible}
          onClose={() => setViewerVisible(false)}
        />
      )}

      <ImagePickerSheet
        visible={pickerVisible}
        onClose={() => setPickerVisible(false)}
        title="Cambiar foto del staff"
        onPick={async (imgs) => {
          setPickerVisible(false);
          const img = imgs[0];
          if (!img) return;
          const publicUrl = await upload(img, { kind: 'staff', id });
          if (publicUrl) {
            try {
              await api.staffImages.addImage(id, { url: publicUrl, is_profile: true });
              setCurrentPhotoUrl(publicUrl);
            } catch {
              Alert.alert('Error', 'Imagen subida pero no se pudo registrar en la galería.');
            }
          }
        }}
      />
    </View>
  );
}
