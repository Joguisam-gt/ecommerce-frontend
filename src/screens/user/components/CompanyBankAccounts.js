/**
 * Lista de cuentas bancarias oficiales de la empresa (desde la configuracion
 * publica) a las que el cliente debe transferir.
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../../../config/theme';

/** Etiquetas legibles del tipo de cuenta. */
const ACCOUNT_TYPE_LABELS = {
  monetaria: 'Monetaria',
  ahorro: 'Ahorro',
  checking: 'Monetaria',
  savings: 'Ahorro',
};

/**
 * @param {{ accounts: Array<{ bankName: string, accountType?: string, accountNumber: string, accountHolder: string }> }} props
 */
export default function CompanyBankAccounts({ accounts }) {
  const list = Array.isArray(accounts) ? accounts : [];

  return (
    <View style={styles.wrapper}>
      <Text style={styles.title} accessibilityRole="header">
        Cuentas oficiales para transferir
      </Text>

      {list.length === 0 ? (
        /* Sin cuentas configuradas */
        <Text style={styles.empty}>
          No hay cuentas bancarias configuradas por el momento. Contacta a la tienda antes de transferir.
        </Text>
      ) : (
        /* Una tarjeta por cuenta */
        list.map((account) => (
          <View
            key={`${account.bankName}-${account.accountNumber}`}
            style={styles.account}
            accessible
            accessibilityLabel={`Banco ${account.bankName}, cuenta ${account.accountNumber}, a nombre de ${account.accountHolder}`}
          >
            <Text style={styles.bank}>{account.bankName}</Text>
            <Text style={styles.line}>
              Tipo: {ACCOUNT_TYPE_LABELS[String(account.accountType || '').toLowerCase()] || account.accountType || 'No indicado'}
            </Text>
            <Text style={styles.line} selectable>
              Numero: <Text style={styles.number}>{account.accountNumber}</Text>
            </Text>
            <Text style={styles.line}>A nombre de: {account.accountHolder}</Text>
          </View>
        ))
      )}
    </View>
  );
}

/* Estilos de la lista de cuentas */
const styles = StyleSheet.create({
  wrapper: {
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: typography.body,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  empty: {
    fontSize: typography.small,
    color: colors.danger,
  },
  account: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    backgroundColor: colors.background,
  },
  bank: {
    fontSize: typography.body,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  line: {
    fontSize: typography.small,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  number: {
    fontWeight: '700',
    color: colors.textPrimary,
  },
});
