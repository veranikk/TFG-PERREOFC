/**
 * Renders the design system screen in the mobile app.
 * It composes UI components, hooks and API/store data for this route.
 */

// Pantalla de referencia del design system — solo accesible en DEV
// Navega a ella desde app/index.tsx en modo desarrollo
import React, { useState } from 'react';
import { ScrollView, View, Text } from 'react-native';
import { useTheme } from '../../src/hooks/useTheme';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { Card } from '../../src/components/ui/Card';
import { Pill } from '../../src/components/ui/Pill';
import { Avatar } from '../../src/components/ui/Avatar';
import { Switch } from '../../src/components/ui/Switch';
import { BottomSheet } from '../../src/components/ui/BottomSheet';
import { Logo } from '../../src/components/brand/Logo';
import { Mascota } from '../../src/components/brand/Mascota';
import { typography } from '../../src/theme/typography';
import { brand, state } from '../../src/theme/colors';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={{ gap: 12 }}>
      <Text style={{ ...typography.h2, color: colors.accent }}>{title}</Text>
      {children}
    </View>
  );
}

export default function DesignSystemScreen() {
  const { colors, isDark, toggle } = useTheme();
  const [inputVal, setInputVal] = useState('');
  const [switchVal, setSwitchVal] = useState(false);
  const [sheetVisible, setSheetVisible] = useState(false);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: 20, paddingTop: 60, gap: 32 }}
    >
      {/* Header */}
      <View style={{ alignItems: 'center', gap: 8 }}>
        <Text style={{ ...typography.h1, color: colors.text, textAlign: 'center' }}>
          DESIGN SYSTEM
        </Text>
        <Text style={{ ...typography.body, color: colors.textMuted, textAlign: 'center' }}>
          Perreo FC · {isDark ? 'Tema oscuro' : 'Tema claro'}
        </Text>
        <Button label={`Cambiar a ${isDark ? 'claro' : 'oscuro'}`} onPress={toggle} size="sm" />
      </View>

      {/* TIPOGRAFÍA */}
      <Section title="TIPOGRAFÍA">
        <Text style={{ ...typography.h1, color: colors.text }}>H1 — Bebas Neue 36</Text>
        <Text style={{ ...typography.h2, color: colors.text }}>H2 — Bebas Neue 26</Text>
        <Text style={{ ...typography.h3, color: colors.text }}>H3 — Bebas Neue 19</Text>
        <Text style={{ ...typography.bodyLg, color: colors.text }}>Body Lg — Inter 400 16</Text>
        <Text style={{ ...typography.body, color: colors.text }}>Body — Inter 400 15</Text>
        <Text style={{ ...typography.label, color: colors.textMuted }}>LABEL — Inter 500 12</Text>
        <Text style={{ ...typography.caption, color: colors.textMuted }}>Caption — Inter 400 12</Text>
        <Text style={{ ...typography.button, color: colors.accent }}>Button — Inter 600 15</Text>
      </Section>

      {/* COLORES */}
      <Section title="COLORES">
        {[
          { name: 'Orange (accent)', color: brand.orange },
          { name: 'Blue', color: brand.blue },
          { name: 'Green', color: brand.green },
          { name: 'Grey', color: brand.grey },
          { name: 'Success', color: state.success },
          { name: 'Error', color: state.error },
          { name: 'Warning', color: state.warning },
          { name: 'bg', color: colors.bg },
          { name: 'bgAlt', color: colors.bgAlt },
          { name: 'card', color: colors.card },
          { name: 'border', color: colors.border },
        ].map(({ name, color }) => (
          <View key={name} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                backgroundColor: color,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            />
            <View>
              <Text style={{ ...typography.body, color: colors.text }}>{name}</Text>
              <Text style={{ ...typography.caption, color: colors.textMuted }}>{color}</Text>
            </View>
          </View>
        ))}
      </Section>

      {/* BOTONES */}
      <Section title="BOTONES">
        <Button label="Primario" variant="primary" fullWidth />
        <Button label="Secundario" variant="secondary" fullWidth />
        <Button label="Ghost" variant="ghost" fullWidth />
        <Button label="Destructivo" variant="destructive" fullWidth />
        <Button label="Cargando..." loading fullWidth />
        <Button label="Desactivado" disabled fullWidth />
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Button label="Small" size="sm" />
          <Button label="Medium" size="md" />
          <Button label="Large" size="lg" />
        </View>
      </Section>

      {/* INPUTS */}
      <Section title="INPUTS">
        <Input
          label="Email"
          placeholder="tu@email.com"
          value={inputVal}
          onChangeText={setInputVal}
          keyboardType="email-address"
        />
        <Input
          label="Contraseña"
          placeholder="Tu contraseña"
          secureTextEntry
        />
        <Input
          label="Con error"
          placeholder="Campo con error"
          error="Este campo es obligatorio"
        />
        <Input
          label="Multiline"
          placeholder="Escribe aquí..."
          multiline
          numberOfLines={3}
        />
      </Section>

      {/* CARDS */}
      <Section title="CARDS">
        <Card>
          <Text style={{ ...typography.h3, color: colors.text }}>Card normal</Text>
          <Text style={{ ...typography.body, color: colors.textMuted, marginTop: 4 }}>
            Con borde en light, sin borde en dark.
          </Text>
        </Card>
        <Card style={{ backgroundColor: colors.cardAlt }}>
          <Text style={{ ...typography.body, color: colors.text }}>Card alt background</Text>
        </Card>
      </Section>

      {/* PILLS */}
      <Section title="PILLS">
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          <Pill label="Próximo" variant="upcoming" />
          <Pill label="Victoria" variant="win" />
          <Pill label="Derrota" variant="loss" />
          <Pill label="Empate" variant="draw" />
          <Pill label="En directo" variant="live" />
          <Pill label="Info" variant="info" />
          <Pill label="Custom" variant="custom" color="#8B5CF6" bgColor="#8B5CF622" />
        </View>
      </Section>

      {/* AVATARES */}
      <Section title="AVATARES">
        <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-end' }}>
          <Avatar name="Vera García" size="xs" />
          <Avatar name="Vera García" size="sm" />
          <Avatar name="Vera García" size="md" />
          <Avatar name="Vera García" size="lg" />
          <Avatar name="Vera García" size="xl" />
        </View>
        <Avatar
          uri="https://i.pravatar.cc/150?img=5"
          name="Con foto"
          size="lg"
        />
      </Section>

      {/* SWITCH */}
      <Section title="SWITCH">
        <Switch
          value={switchVal}
          onValueChange={setSwitchVal}
          label="Notificaciones push"
          description="Recibe alertas en tiempo real"
        />
        <Switch value={true} onValueChange={() => {}} label="Activado" />
        <Switch value={false} onValueChange={() => {}} label="Desactivado" />
      </Section>

      {/* BRAND */}
      <Section title="BRAND">
        <View style={{ flexDirection: 'row', gap: 16, alignItems: 'center' }}>
          <Logo size="xs" />
          <Logo size="sm" />
          <Logo size="md" />
          <Logo size="lg" />
        </View>
        <View style={{ flexDirection: 'row', gap: 16, alignItems: 'center' }}>
          <Mascota size="sm" />
          <Mascota size="md" />
          <Mascota size="lg" />
        </View>
      </Section>

      {/* BOTTOM SHEET */}
      <Section title="BOTTOM SHEET">
        <Button label="Abrir Bottom Sheet" onPress={() => setSheetVisible(true)} fullWidth />
        <BottomSheet
          visible={sheetVisible}
          onClose={() => setSheetVisible(false)}
          title="Ejemplo de Bottom Sheet"
        >
          <View style={{ gap: 12, paddingBottom: 20 }}>
            <Text style={{ ...typography.body, color: colors.text }}>
              Este es el contenido del bottom sheet. Puede tener cualquier componente dentro.
            </Text>
            <Input label="Campo de ejemplo" placeholder="Escribe algo..." />
            <Button label="Acción principal" fullWidth onPress={() => setSheetVisible(false)} />
            <Button
              label="Cancelar"
              variant="secondary"
              fullWidth
              onPress={() => setSheetVisible(false)}
            />
          </View>
        </BottomSheet>
      </Section>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}
