/**
 * Master Dashboard - Dashboard per ruolo Master
 * Redirect alla dashboard normale (condividono la stessa vista)
 */

import { Redirect } from 'expo-router';

export default function MasterDashboard() {
  return <Redirect href="/(tabs)/dashboard" />;
}
