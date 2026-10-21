import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LoanSummary } from '../types';
import { formatCurrency } from '../utils/formatters';
import { theme } from '../theme';

interface SummaryCardsProps {
  summary: LoanSummary | null;
  onRefresh?: () => void;
  onCardPress?: (filter: 'all' | 'pending' | 'overdue' | 'repaid') => void;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({
  summary,
  onRefresh,
  onCardPress,
}) => {
  const totalLent = summary?.totalLent || 0;
  const totalRepaid = summary?.totalRepaid || 0;
  const overdueAmount = summary?.overdueAmount || 0;
  const pendingAmount = summary?.pendingAmount || 0;
  const overdueCount = summary?.overdueLoansCount || 0;

  // Percentage repaid calculation
  const repaidPercent = totalLent > 0 ? Math.round((totalRepaid / totalLent) * 100) : 0;

  return (
    <View style={styles.container}>
      {/* Primary Hero Card: Total Lent */}
      <View style={styles.heroCard}>
        <View style={styles.heroHeader}>
          <View style={styles.heroTitleRow}>
            <View style={styles.heroIconBadge}>
              <Ionicons name="wallet-outline" size={18} color="#FFFFFF" />
            </View>
            <Text style={styles.heroTitle}>Total Money Lent</Text>
          </View>
          {onRefresh && (
            <TouchableOpacity
              onPress={onRefresh}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={styles.refreshButton}
            >
              <Ionicons name="refresh" size={18} color="rgba(255,255,255,0.85)" />
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.heroAmount}>{formatCurrency(totalLent)}</Text>

        <View style={styles.progressContainer}>
          <View style={styles.progressBarBackground}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${Math.min(repaidPercent, 100)}%` },
              ]}
            />
          </View>
          <View style={styles.progressMeta}>
            <Text style={styles.progressText}>
              {repaidPercent}% recovered so far
            </Text>
            <Text style={styles.progressCountText}>
              {summary?.activeLoansCount ?? 0} active loan{(summary?.activeLoansCount ?? 0) === 1 ? '' : 's'}
            </Text>
          </View>
        </View>
      </View>

      {/* Triplet Sub-Metrics Cards */}
      <View style={styles.metricsRow}>
        {/* Total Repaid */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => onCardPress && onCardPress('repaid')}
          style={[styles.metricCard, styles.repaidCard]}
        >
          <View style={styles.metricHeader}>
            <View style={[styles.miniIconBadge, { backgroundColor: theme.colors.successLight }]}>
              <Ionicons name="checkmark-circle" size={16} color={theme.colors.success} />
            </View>
            <Text style={styles.metricLabel}>Total Repaid</Text>
          </View>
          <Text style={[styles.metricAmount, { color: theme.colors.success }]}>
            {formatCurrency(totalRepaid)}
          </Text>
          <Text style={styles.metricSubtext}>
            {summary?.repaidLoansCount ?? 0} completed
          </Text>
        </TouchableOpacity>

        {/* Overdue Amount (Highlighted in Red) */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => onCardPress && onCardPress('overdue')}
          style={[
            styles.metricCard,
            styles.overdueCard,
            overdueAmount > 0 && styles.overdueActiveBorder,
          ]}
        >
          <View style={styles.metricHeader}>
            <View style={[styles.miniIconBadge, { backgroundColor: theme.colors.dangerLight }]}>
              <Ionicons name="alert-circle" size={16} color={theme.colors.danger} />
            </View>
            <Text style={[styles.metricLabel, overdueAmount > 0 && { color: theme.colors.danger }]}>
              Overdue
            </Text>
          </View>
          <Text style={[styles.metricAmount, { color: theme.colors.danger }]}>
            {formatCurrency(overdueAmount)}
          </Text>
          <Text style={[styles.metricSubtext, overdueAmount > 0 && { color: theme.colors.danger }]}>
            {overdueCount} {overdueCount === 1 ? 'entry' : 'entries'} overdue
          </Text>
        </TouchableOpacity>

        {/* Pending Amount */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => onCardPress && onCardPress('pending')}
          style={[styles.metricCard, styles.pendingCard]}
        >
          <View style={styles.metricHeader}>
            <View style={[styles.miniIconBadge, { backgroundColor: theme.colors.warningLight }]}>
              <Ionicons name="time-outline" size={16} color={theme.colors.warning} />
            </View>
            <Text style={styles.metricLabel}>Pending</Text>
          </View>
          <Text style={[styles.metricAmount, { color: theme.colors.warning }]}>
            {formatCurrency(pendingAmount)}
          </Text>
          <Text style={styles.metricSubtext}>To be collected</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: theme.spacing.lg,
    marginVertical: theme.spacing.md,
  },
  heroCard: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    ...theme.shadows.lg,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  heroIconBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroTitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  refreshButton: {
    padding: 4,
  },
  heroAmount: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '800',
    marginTop: theme.spacing.sm,
    letterSpacing: -0.5,
  },
  progressContainer: {
    marginTop: theme.spacing.lg,
  },
  progressBarBackground: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#34D399',
    borderRadius: 3,
  },
  progressMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.spacing.xs,
  },
  progressText: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 12,
    fontWeight: '500',
  },
  progressCountText: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 12,
    fontWeight: '600',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: theme.spacing.md,
  },
  metricCard: {
    flex: 1,
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.sm,
  },
  repaidCard: {
    backgroundColor: '#F0FDF4',
    borderColor: theme.colors.successBorder,
  },
  overdueCard: {
    backgroundColor: '#FFF1F2',
    borderColor: theme.colors.dangerBorder,
  },
  overdueActiveBorder: {
    borderColor: theme.colors.danger,
    borderWidth: 1.5,
    ...theme.shadows.overdue,
  },
  pendingCard: {
    backgroundColor: '#FFFBEB',
    borderColor: theme.colors.warningBorder,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  miniIconBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  metricAmount: {
    fontSize: 15,
    fontWeight: '800',
  },
  metricSubtext: {
    fontSize: 10,
    color: theme.colors.textMuted,
    marginTop: 2,
    fontWeight: '500',
  },
});
