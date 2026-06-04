/**
 * Renders the terms screen in the mobile app.
 * It composes UI components, hooks and API/store data for this route.
 */

import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../src/hooks/useTheme';
import { typography } from '../../src/theme/typography';

function Section({ title, body }: { title: string; body: string }) {
  const { colors } = useTheme();
  return (
    <View style={{ gap: 8 }}>
      <Text style={{ ...typography.bodyLg, color: colors.text, fontFamily: 'Inter_700Bold' }}>{title}</Text>
      <Text style={{ ...typography.body, color: colors.textMuted, lineHeight: 24 }}>{body}</Text>
    </View>
  );
}

export default function TermsScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 12,
        paddingTop: insets.top + 12, paddingBottom: 12,
        borderBottomWidth: 1, borderBottomColor: colors.border,
      }}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} style={{ padding: 4 }}>
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={{ ...typography.h3, color: colors.text, flex: 1, marginLeft: 8 }}>Términos y condiciones</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, gap: 20, paddingBottom: 60 }}>
        <Text style={{ ...typography.caption, color: colors.textMuted }}>Última actualización: abril de 2026</Text>

        <Section
          title="1. Aceptación de los términos"
          body="Al utilizar la aplicación móvil de Perreo FC, aceptas los presentes términos y condiciones de uso. Si no estás de acuerdo con alguno de ellos, deberás dejar de utilizar la aplicación."
        />
        <Section
          title="2. Uso de la aplicación"
          body="Esta aplicación es de uso exclusivo para socios y aficionados del club Perreo FC. Queda prohibido su uso con fines comerciales, fraudulentos o que atenten contra los valores del club."
        />
        <Section
          title="3. Privacidad y datos personales"
          body="Los datos personales recogidos (nombre, email, contraseña) son utilizados únicamente para gestionar tu cuenta dentro de la aplicación. No se ceden a terceros. Puedes solicitar la eliminación de tus datos en cualquier momento contactando con el club."
        />
        <Section
          title="4. Sistema de puntos"
          body="Los puntos (🍑) son una moneda virtual sin valor económico real. No son canjeables por dinero ni transferibles entre usuarios. El club se reserva el derecho a modificar el sistema de puntos en cualquier momento."
        />
        <Section
          title="5. Contenido generado por el usuario"
          body="El usuario se compromete a no publicar contenido ofensivo, falso o que vulnere derechos de terceros. El club podrá eliminar cualquier contenido sin previo aviso y suspender cuentas que incumplan estas normas."
        />
        <Section
          title="6. Limitación de responsabilidad"
          body="Perreo FC no se hace responsable de los daños derivados del uso o la imposibilidad de uso de la aplicación, incluyendo errores en los datos de partidos, clasificaciones o estadísticas."
        />
        <Section
          title="7. Modificaciones"
          body="El club se reserva el derecho a modificar estos términos en cualquier momento. Las modificaciones serán notificadas a través de la propia aplicación y entrarán en vigor en el momento de su publicación."
        />
        <Section
          title="8. Contacto"
          body="Para cualquier consulta sobre estos términos, puedes contactar con el club en info@perreofc.com o a través de la aplicación."
        />
      </ScrollView>
    </View>
  );
}
