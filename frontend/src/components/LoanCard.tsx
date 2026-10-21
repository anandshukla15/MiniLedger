import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Loan } from '../types';
import { formatCurrency, formatDate, getDueStatusInfo, getInitials } from '../utils/formatters';
import { theme } from '../theme';

interface LoanCardProps {
  loan: Loan;
  onMarkRepaid: (id: string) => void;
  onDelete: (id: string) => void;
  onViewReceipt: (receiptUrl: string) => void;
}

export const LoanCard: React.FC<LoanCardProps> = ({
  loan,
  onMarkRepaid,
  onDelete,
  onViewReceipt,
}) => {
  const statusInfo = getDueStatusInfo(loan.due_date, loan.is_repaid, loan.repaid_at);
  const isOverdue = statusInfo.isOverdue;

  const handleRepayPress = () => {
    if (Platform.OS === 'web') {
      if (window.confirm(`Mark loan of ${formatCurrency(loan.amount)} to ${loan.friend_name} as repaid?`)) {
        onMarkRepaid(loan.id);
      }
    } else {
      Alert.alert(
        'Confirm Repayment',
        `Mark loan of ${formatCurrency(loan.amount)} to ${loan.friend_name} as repaid?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Yes, Mark Repaid', onPress: () => onMarkRepaid(loan.id) },
        ]
      );
    }
  };

  const handleDeletePress = () => {
    if (Platform.OS === 'web') {
      if (window.confirm(`Delete entry for ${loan.friend_name}?`)) {
        onDelete(loan.id);
      }
    } else {
      Alert.alert('Delete Entry', `Are you sure you want to delete this record?`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => onDelete(loan.id) },
      ]);
    }
  };

  return (
    <View
      style={[
        styles.card,
        isOverdue && styles.overdueCard,
        loan.is_repaid && styles.repaidCard,
      ]}
    >
      {/* Top Banner for Overdue status */}
      {isOverdue && (
        <View style={styles.overdueAlertBanner}>
          <Ionicons name="alert-circle" size={14} color="#DC2626" />
          <Text style={styles.overdueAlertText}>PAYMENT OVERDUE</Text>
        </View>
      )}

      <View style={styles.mainContent}>
        {/* Left: Avatar + Friend info */}
        <View style={styles.leftSection}>
          <View
            style={[
              styles.avatar,
              isOverdue ? styles.avatarOverdue : loan.is_repaid ? styles.avatarRepaid : styles.avatarNormal,
            ]}
          >
            <Text
              style={[
                styles.avatarText,
                isOverdue ? styles.avatarTextOverdue : loan.is_repaid ? styles.avatarTextRepaid : styles.avatarTextNormal,
              ]}
            >
              {getInitials(loan.friend_name)}
            </Text>
          </View>

          <View style={styles.friendDetails}>
            <View style={styles.nameRow}>
              <Text style={styles.friendName} numberOfLines={1}>
                {loan.friend_name}
              </Text>
              {loan.receipt_url && (
                <TouchableOpacity
                  onPress={() => onViewReceipt(loan.receipt_url!)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  style={styles.receiptIconBadge}
                >
                  <Ionicons name="document-attach" size={14} color={theme.colors.primary} />
                </TouchableOpacity>
              )}
            </View>

            {loan.notes ? (
              <Text style={styles.notesText} numberOfLines={1}>
                {loan.notes}
              </Text>
            ) : null}

            {/* Date and Due status badge */}
            <View style={styles.dateRow}>
              <Ionicons name="calendar-outline" size={12} color={theme.colors.textMuted} />
              <Text style={styles.dateText}>Due: {formatDate(loan.due_date)}</Text>
              <View style={[styles.statusBadge, { backgroundColor: statusInfo.badgeBg }]}>
                <Text style={[styles.statusBadgeText, { color: statusInfo.color }]}>
                  {statusInfo.label}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Right: Amount & Actions */}
        <View style={styles.rightSection}>
          <Text
            style={[
              styles.amountText,
              isOverdue && styles.amountOverdue,
              loan.is_repaid && styles.amountRepaid,
            ]}
          >
            {formatCurrency(loan.amount)}
          </Text>

          <View style={styles.actionRow}>
            {!loan.is_repaid ? (
              <TouchableOpacity
                onPress={handleRepayPress}
                activeOpacity={0.7}
                style={[
                  styles.repayButton,
                  isOverdue ? styles.repayButtonOverdue : styles.repayButtonNormal,
                ]}
              >
                <Ionicons name="checkmark-done" size={14} color="#FFFFFF" />
                <Text style={styles.repayButtonText}>Repaid</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.repaidPill}>
                <Ionicons name="checkmark-circle" size={14} color={theme.colors.success} />
                <Text style={styles.repaidPillText}>Settled</Text>
              </View>
            )}

            <TouchableOpacity
              onPress={handleDeletePress}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={styles.deleteButton}
            >
              <Ionicons name="trash-outline" size={16} color={theme.colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    marginHorizontal: theme.spacing.lg,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
    ...theme.shadows.sm,
  },
  overdueCard: {
    borderColor: theme.colors.danger,
    borderWidth: 1.5,
    backgroundColor: '#FFFBFB',
    ...theme.shadows.overdue,
  },
  repaidCard: {
    opacity: 0.85,
    backgroundColor: '#FAFAFA',
    borderColor: '#E5E7EB',
  },
  overdueAlertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEE2E2',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 3,
  },
  overdueAlertText: {
    color: '#DC2626',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  mainContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: theme.spacing.md,
    alignItems: 'center',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarNormal: {
    backgroundColor: theme.colors.primaryLight,
  },
  avatarOverdue: {
    backgroundColor: '#FEE2E2',
  },
  avatarRepaid: {
    backgroundColor: '#ECFDF5',
  },
  avatarText: {
    fontSize: 15,
    fontWeight: '700',
  },
  avatarTextNormal: {
    color: theme.colors.primary,
  },
  avatarTextOverdue: {
    color: '#DC2626',
  },
  avatarTextRepaid: {
    color: '#059669',
  },
  friendDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  friendName: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text,
  },
  receiptIconBadge: {
    backgroundColor: theme.colors.primaryLight,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  notesText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
    flexWrap: 'wrap',
  },
  dateText: {
    fontSize: 11,
    color: theme.colors.textMuted,
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 4,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  rightSection: {
    alignItems: 'flex-end',
    marginLeft: 12,
  },
  amountText: {
    fontSize: 17,
    fontWeight: '800',
    color: theme.colors.text,
    letterSpacing: -0.3,
  },
  amountOverdue: {
    color: '#DC2626',
  },
  amountRepaid: {
    color: theme.colors.textMuted,
    textDecorationLine: 'line-through',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  repayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: theme.borderRadius.sm,
  },
  repayButtonNormal: {
    backgroundColor: theme.colors.primary,
  },
  repayButtonOverdue: {
    backgroundColor: '#DC2626',
  },
  repayButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  repaidPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.sm,
  },
  repaidPillText: {
    color: theme.colors.success,
    fontSize: 11,
    fontWeight: '700',
  },
  deleteButton: {
    padding: 4,
  },
});
