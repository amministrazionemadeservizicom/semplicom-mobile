/**
 * Auth Layout - Stack navigation per schermate non autenticate
 */

import { Stack } from 'expo-router';
import { colors } from '../../styles/colors';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: colors.background,
        },
      }}
    >
      <Stack.Screen
        name="login"
        options={{
          title: 'Accedi',
        }}
      />
    </Stack>
  );
}
