import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { FilterStatus } from '../types';
import { theme } from '../theme';

interface FilterTabsProps {
  currentFilter: FilterStatus;
  onSelectFilter: (filter: FilterStatus) => void;
  counts?: {
    all: number;
    pending: number;
    overdue: number;
    repaid: number;
  };
}

export const FilterTabs: React.FC<FilterTabsProps> = ({
  currentFilter,
  onSelectFilter,
  counts,
}) => {
  const tabs: { key: FilterStatus; label: string; count?: number }[] = [
    { key: 'all', label: 'All', count: counts?.all },
    { key: 'overdue', label: 'Overdue', count: counts?.overdue },
    { key: 'pending', label: 'Pending', count: counts?.pending },
    { key: 'repaid', label: 'Repaid', count: counts?.repaid },
  ];

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {tabs.map((tab) => {
          const isActive = currentFilter === tab.key;
          const isOverdueTab = tab.key === 'overdue';

          return (
            <TouchableOpacity
              key={tab.key}
              onPress={() => onSelectFilter(tab.key)}
              style={[
                styles.tab,
                isActive && styles.activeTab,
                isActive && isOverdueTab && styles.activeOverdueTab,
              ]}
            >
              <Text
                style={[
                  styles.tabText,
                  isActive && styles.activeTabText,
                  isActive && isOverdueTab && styles.activeOverdueTabText,
                ]}
              >
                {tab.label}
              </Text>
              {tab.count !== undefined && (
                <View
                  style={[
                    styles.countBadge,
                    isActive && styles.activeCountBadge,
                    isOverdueTab && tab.count > 0 && styles.overdueCountBadge,
                  ]}
                >
                  <Text
                    style={[
                      styles.countText,
                      isActive && styles.activeCountText,
                      isOverdueTab && tab.count > 0 && styles.overdueCountText,
                    ]}
                  >
                    {tab.count}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: theme.spacing.sm,
  },
  scroll: {
    paddingHorizontal: theme.spacing.lg,
    gap: 8,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: theme.borderRadius.full,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  activeTab: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  activeOverdueTab: {
    backgroundColor: '#DC2626',
    borderColor: '#DC2626',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  activeOverdueTabText: {
    color: '#FFFFFF',
  },
  countBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  activeCountBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  overdueCountBadge: {
    backgroundColor: '#FEE2E2',
  },
  countText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.textSecondary,
  },
  activeCountText: {
    color: '#FFFFFF',
  },
  overdueCountText: {
    color: '#DC2626',
  },
});
