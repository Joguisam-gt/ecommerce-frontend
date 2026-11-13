/**
 * Pantalla de gobernanza del superusuario (ruta SUPERUSER_PANEL, solo rol superuser).
 * AdminPage + TabBar con 4 pestanas: Personal, Configuracion, Auditoria y Purga.
 * Cada panel se monta la primera vez que se visita y despues solo se oculta, para conservar
 * su estado (por ejemplo, cambios sin guardar de la configuracion) al cambiar de pestana.
 */
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AdminPage, TabBar } from '../../components';
import { spacing } from '../../config/theme';
import { AuditLogPanel } from './governance/AuditLogPanel';
import { PurgePanel } from './governance/PurgePanel';
import { SettingsPanel } from './governance/SettingsPanel';
import { StaffPanel } from './governance/StaffPanel';

/** Pestanas de la pantalla y su panel. */
const TABS = [
  { key: 'staff', label: 'Personal', Panel: StaffPanel },
  { key: 'settings', label: 'Configuracion', Panel: SettingsPanel },
  { key: 'audit', label: 'Auditoria', Panel: AuditLogPanel },
  { key: 'purge', label: 'Purga', Panel: PurgePanel },
];

/** Opciones para TabBar (solo key y label). */
const TAB_OPTIONS = TABS.map(({ key, label }) => ({ key, label }));

export default function SuperuserGovernanceScreen() {
  const [active, setActive] = useState(TABS[0].key);
  // Pestanas ya visitadas (montaje diferido).
  const [visited, setVisited] = useState({ [TABS[0].key]: true });

  /** Cambia de pestana y la marca como visitada. */
  const handleChange = (key) => {
    setActive(key);
    setVisited((prev) => (prev[key] ? prev : { ...prev, [key]: true }));
  };

  return (
    <AdminPage title="Gobernanza" subtitle="Personal, configuracion global, auditoria y purga de registros">
      <TabBar tabs={TAB_OPTIONS} value={active} onChange={handleChange} />
      {/* Paneles: solo el activo es visible; los visitados permanecen montados. */}
      {TABS.map(({ key, Panel }) =>
        visited[key] ? (
          <View key={key} style={[styles.panel, key !== active && styles.hidden]}>
            <Panel />
          </View>
        ) : null,
      )}
    </AdminPage>
  );
}

const styles = StyleSheet.create({
  panel: { marginTop: spacing.lg },
  hidden: { display: 'none' },
});
