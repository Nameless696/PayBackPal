import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useApp } from '../../context/AppContext';
import { generateExpenseSummary } from '../../utils/calculations';
import { categoryIcons } from '../../constants/categories';

export default function ReportsScreen() {
  const navigation = useNavigation();
  const { expenses, groups, fmt } = useApp();

  const today      = new Date().toISOString().split('T')[0];
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(monthStart);
  const [endDate,   setEndDate]   = useState(today);
  const [summary,   setSummary]   = useState<ReturnType<typeof generateExpenseSummary> | null>(null);

  function generateReport() {
    setSummary(generateExpenseSummary(expenses, startDate, endDate));
  }

  const groupName = (id: string) => groups.find(g => g.id === id)?.name ?? id;

  return (
    <SafeAreaView className="flex-1 bg-bg-body">
      <View className="flex-row justify-between items-center p-4">
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text className="text-primary text-[15px]">← Back</Text>
        </TouchableOpacity>
        <Text className="text-text-1 text-lg font-bold">Reports</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {/* Date range card */}
        <View className="bg-bg-card rounded-2xl p-4 mb-4 border border-border">
          <Text className="text-text-1 text-base font-bold mb-3">Date Range</Text>
          <View className="flex-row items-center justify-around mb-4">
            <View className="bg-bg-surface rounded-[10px] p-3 items-center min-w-[120px]">
              <Text className="text-text-muted text-[11px] mb-1">From</Text>
              <Text className="text-text-1 text-sm font-semibold">{startDate}</Text>
            </View>
            <Text className="text-text-muted text-lg">→</Text>
            <View className="bg-bg-surface rounded-[10px] p-3 items-center min-w-[120px]">
              <Text className="text-text-muted text-[11px] mb-1">To</Text>
              <Text className="text-text-1 text-sm font-semibold">{endDate}</Text>
            </View>
          </View>
          <Text className="text-text-muted text-xs mb-[14px] leading-[18px]">
            Note: Date range uses the current month by default. To change, edit the date strings in code (date picker coming in v4).
          </Text>
          <TouchableOpacity className="bg-primary rounded-xl py-[14px] items-center" onPress={generateReport}>
            <Text className="text-white font-bold text-[15px]">Generate Report</Text>
          </TouchableOpacity>
        </View>

        {summary && (
          <>
            {/* Summary card */}
            <View className="bg-bg-card rounded-2xl p-4 mb-4 border border-border">
              <Text className="text-text-1 text-base font-bold mb-3">Summary</Text>
              {[
                { label: 'Total Expenses',       val: String(summary.totalExpenses),      color: '' },
                { label: 'Total Amount',          val: fmt(summary.totalAmount),           color: 'text-primary' },
                { label: 'Average per Expense',   val: fmt(summary.averageExpense),        color: '' },
                ...(summary.highestExpense ? [{
                  label: 'Highest',
                  val:   `${fmt(summary.highestExpense.amount)} — ${summary.highestExpense.description}`,
                  color: 'text-error',
                }] : []),
              ].map(({ label, val, color }) => (
                <View key={label} className="flex-row justify-between py-1.5 border-b border-border">
                  <Text className="text-text-2 text-sm">{label}</Text>
                  <Text className={`text-sm font-semibold ${color || 'text-text-1'}`}>{val}</Text>
                </View>
              ))}
            </View>

            {/* By Category */}
            {Object.keys(summary.byCategory).length > 0 && (
              <View className="bg-bg-card rounded-2xl p-4 mb-4 border border-border">
                <Text className="text-text-1 text-base font-bold mb-3">By Category</Text>
                {Object.entries(summary.byCategory).sort((a, b) => b[1] - a[1]).map(([cat, amt]) => {
                  const pct = Math.round((amt / summary.totalAmount) * 100);
                  return (
                    <View key={cat} className="mb-2.5">
                      <View className="flex-row justify-between mb-1">
                        <Text className="text-text-1 text-[13px] capitalize">
                          {categoryIcons[cat] ?? '📦'} {cat}
                        </Text>
                        <Text className="text-primary text-[13px] font-semibold">{fmt(amt)}</Text>
                      </View>
                      <View className="h-1.5 bg-bg-surface rounded-[3px]">
                        <View className="h-1.5 bg-primary rounded-[3px]" style={{ width: `${pct}%` as any }} />
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            {/* By Group */}
            {Object.keys(summary.byGroup).length > 0 && (
              <View className="bg-bg-card rounded-2xl p-4 mb-4 border border-border">
                <Text className="text-text-1 text-base font-bold mb-3">By Group</Text>
                {Object.entries(summary.byGroup).sort((a, b) => b[1] - a[1]).map(([gId, amt]) => (
                  <View key={gId} className="flex-row justify-between py-1.5 border-b border-border">
                    <Text className="text-text-2 text-sm">{groupName(gId)}</Text>
                    <Text className="text-text-1 text-sm font-semibold">{fmt(amt)}</Text>
                  </View>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
