import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Loan, LoanSummary, FilterStatus, CreateLoanInput } from '../types';
import { SummaryCards } from '../components/SummaryCards';
import { LoanCard } from '../components/LoanCard';
import { FilterTabs } from '../components/FilterTabs';
import { SearchBar } from '../components/SearchBar';
import { AddLoanModal } from '../components/AddLoanModal';
import { ReceiptModal } from '../components/ReceiptModal';
import { theme } from '../theme';

export const HomeScreen: React.FC = () => {
  const { user, logout } = useAuth();

  const [loans, setLoans] = useState<Loan[]>([]);
  const [summary, setSummary] = useState<LoanSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [selectedReceipt, setSelectedReceipt] = useState<string | null>(null);

  // Fetch summary and loans
  const fetchData = useCallback(async () => {
    try {
      const [summaryRes, loansRes] = await Promise.all([
        api.loans.getSummary(),
        api.loans.getAll({ status: filter, search: searchQuery }),
      ]);
      setSummary(summaryRes.data.summary);
      setLoans(loansRes.data.loans);
    } catch (err: any) {
      console.error('Failed to fetch ledger data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter, searchQuery]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleAddLoan = async (data: CreateLoanInput) => {
    await api.loans.create(
      {
        friend_name: data.friend_name,
        amount: data.amount,
        due_date: data.due_date,
        notes: data.notes,
      },
      data.receiptUri
    );
    fetchData();
  };

  const handleMarkRepaid = async (id: string) => {
    try {
      await api.loans.markAsRepaid(id);
      fetchData();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not mark loan as repaid.');
    }
  };

  const handleDeleteLoan = async (id: string) => {
    try {
      await api.loans.delete(id);
      fetchData();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not delete entry.');
    }
  };

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to log out?')) {
        logout();
      }
    } else {
      Alert.alert('Sign Out', 'Are you sure you want to log out?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Log Out', style: 'destructive', onPress: logout },
      ]);
    }
  };

  // Compute counts for filter badges
  const filterCounts = {
    all: summary ? summary.activeLoansCount + summary.repaidLoansCount : loans.length,
    pending: summary?.activeLoansCount ?? 0,
    overdue: summary?.overdueLoansCount ?? 0,
    repaid: summary?.repaidLoansCount ?? 0,
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />

      {/* App Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.appIconBadge}>
            <Ionicons name="book" size={20} color="#FFFFFF" />
          </View>
          <View>
            <Text style={styles.appName}>MiniLedger</Text>
            <Text style={styles.userPhoneText}>
              <Ionicons name="call" size={10} color={theme.colors.textMuted} /> {user?.phone}
            </Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            onPress={() => setIsAddModalOpen(true)}
            style={styles.headerAddButton}
          >
            <Ionicons name="add" size={18} color="#FFFFFF" />
            <Text style={styles.headerAddText}>Add Loan</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleLogout}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={styles.logoutButton}
          >
            <Ionicons name="log-out-outline" size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content List */}
      {loading && !refreshing ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading your ledger...</Text>
        </View>
      ) : (
        <FlatList
          data={loans}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />
          }
          ListHeaderComponent={
            <View>
              {/* Summary Cards Component at the top as requested */}
              <SummaryCards
                summary={summary}
                onRefresh={onRefresh}
                onCardPress={(selected) => setFilter(selected)}
              />

              {/* Search Bar */}
              <SearchBar
                value={searchQuery}
                onChangeText={setSearchQuery}
                onClear={() => setSearchQuery('')}
              />

              {/* Filter Tabs */}
              <FilterTabs
                currentFilter={filter}
                onSelectFilter={setFilter}
                counts={filterCounts}
              />

              <View style={styles.listSectionHeader}>
                <Text style={styles.listSectionTitle}>
                  {filter === 'all'
                    ? 'All Entries'
                    : filter === 'overdue'
                    ? '⚠️ Overdue Loans'
                    : filter === 'pending'
                    ? 'Pending Repayments'
                    : 'Completed Settlements'}
                </Text>
                <Text style={styles.listSectionCount}>
                  {loans.length} {loans.length === 1 ? 'record' : 'records'}
                </Text>
              </View>
            </View>
          }
          renderItem={({ item }) => (
            <LoanCard
              loan={item}
              onMarkRepaid={handleMarkRepaid}
              onDelete={handleDeleteLoan}
              onViewReceipt={(url) => setSelectedReceipt(url)}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Ionicons
                  name={
                    filter === 'overdue'
                      ? 'shield-checkmark-outline'
                      : filter === 'repaid'
                      ? 'receipt-outline'
                      : 'wallet-outline'
                  }
                  size={42}
                  color={filter === 'overdue' ? theme.colors.success : theme.colors.primary}
                />
              </View>
              <Text style={styles.emptyTitle}>
                {filter === 'overdue'
                  ? 'No Overdue Loans! 🎉'
                  : searchQuery
                  ? `No friends matching "${searchQuery}"`
                  : 'No loan records found'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {filter === 'overdue'
                  ? 'All your lent money is either on track or already repaid.'
                  : 'Tap the "+ Add Loan" button to track a new loan to a friend.'}
              </Text>
              <TouchableOpacity
                onPress={() => setIsAddModalOpen(true)}
                style={styles.emptyAddButton}
              >
                <Ionicons name="add-circle-outline" size={18} color="#FFFFFF" />
                <Text style={styles.emptyAddText}>Record First Loan</Text>
              </TouchableOpacity>
            </View>
          }
          contentContainerStyle={styles.listContent}
        />
      )}

      {/* Floating Action Button (FAB) */}
      <TouchableOpacity
        onPress={() => setIsAddModalOpen(true)}
        activeOpacity={0.85}
        style={styles.fab}
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Add Loan Modal Form */}
      <AddLoanModal
        visible={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddLoan}
      />

      {/* Receipt Photo Modal (Bonus) */}
      <ReceiptModal
        visible={!!selectedReceipt}
        receiptUrl={selectedReceipt}
        onClose={() => setSelectedReceipt(null)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  appIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.sm,
  },
  appName: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.text,
    letterSpacing: -0.3,
  },
  userPhoneText: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: theme.borderRadius.sm,
    ...theme.shadows.sm,
  },
  headerAddText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  logoutButton: {
    padding: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: theme.borderRadius.sm,
  },
  listContent: {
    paddingBottom: 100,
  },
  listSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.xs,
  },
  listSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  listSectionCount: {
    fontSize: 12,
    color: theme.colors.textMuted,
    fontWeight: '600',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
    paddingHorizontal: theme.spacing.xl,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    maxWidth: 280,
    lineHeight: 18,
  },
  emptyAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: theme.borderRadius.md,
    marginTop: theme.spacing.lg,
    ...theme.shadows.sm,
  },
  emptyAddText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.lg,
  },
});
