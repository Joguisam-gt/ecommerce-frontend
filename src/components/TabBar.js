/**
 * Barra de pestanas internas de una pantalla, desplazable en horizontal si no cabe.
 */
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, MIN_TOUCH_SIZE, spacing, typography } from '../config/theme';

/**
 * @param {{ tabs: { key: string, label: string }[], value: string,
 *   onChange: (key: string) => void, style?: object }} props
 */
export function TabBar({ tabs = [], value, onChange, style }) {
  return (
    <View style={[styles.wrapper, style]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
        accessibilityRole="tablist"
      >
        {tabs.map((tab) => {
          const selected = tab.key === value;
          return (
            <TouchableOpacity
              key={tab.key}
              accessibilityRole="tab"
              accessibilityLabel={tab.label}
              accessibilityState={{ selected }}
              onPress={() => onChange && !selected && onChange(tab.key)}
              activeOpacity={0.85}
              style={[styles.tab, selected && styles.tabSelected]}
            >
              <Text style={[styles.label, selected && styles.labelSelected]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { borderBottomWidth: 1, borderBottomColor: colors.border, marginBottom: spacing.lg },
  row: { flexDirection: 'row', columnGap: spacing.xs },
  tab: {
    minHeight: MIN_TOUCH_SIZE,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
    borderBottomWidth: 3,
    borderBottomColor: colors.background,
  },
  tabSelected: { borderBottomColor: colors.primary },
  label: { fontSize: typography.body, color: colors.textSecondary, fontWeight: '600' },
  labelSelected: { color: colors.textPrimary, fontWeight: '700' },
});

export default TabBar;
