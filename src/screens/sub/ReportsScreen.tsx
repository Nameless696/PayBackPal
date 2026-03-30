import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, Share, Dimensions } from 'react-native';
import { PieChart, BarChart } from 'react-native-chart-kit';
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
  const [chartView, setChartView] = useState<'pie' | 'bar'>('pie');

  const screenWidth = Dimensions.get('window').width;
  const colors = ['#6C63FF', '#22C55E', '#F59E0B', '#EF4444', '#3B82F6', '#EC4899', '#8B5CF6'];

  const chartConfig = {
    backgroundColor: '#1A1A2E',
    backgroundGradientFrom: '#1A1A2E',
    backgroundGradientTo: '#1A1A2E',
    color: (opacity = 1) => `rgba(108, 99, 255, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(184, 181, 209, ${opacity})`,
    propsForDots: { r: '6', strokeWidth: '2', stroke: '#4F9EFF' },
    barPercentage: 0.7,
  };

  function generateReport() {
    setSummary(generateExpenseSummary(expenses, startDate, endDate));
  }

  async function exportCSV() {
    const sorted = [...expenses].filter(e => {
      const d = new Date(e.date).toISOString().split('T')[0];
      return d >= startDate && d <= endDate;
    }).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    let csv = 'Date,Category,Description,Payer,Amount\n';
    sorted.forEach(exp => {
      const date = new Date(exp.date).toLocaleDateString();
      const cat = exp.category;
      const desc = `"${(exp.description || '').replace(/"/g, '""')}"`;
      const payerObj = groups.flatMap(g => g.members).find(m => m.id === exp.paidBy);
      const payer = `"${(payerObj?.name || exp.paidBy || '').replace(/"/g, '""')}"`;
      const amt = exp.amount; // Strict Numerical value directly mapped!
      csv += `${date},${cat},${desc},${payer},${amt}\n`;
    });

    try {
      await Share.share({ message: csv, title: `PayBackPal_Export_${startDate}_${endDate}.csv` });
    } catch (e) {
      console.warn('Share error', e);
    }
  }

  const groupName = (id: string) => groups.find(g => g.id === id)?.name ?? id;

  const pieData = summary ? Object.entries(summary.byCategory).sort((a,b) => b[1] - a[1]).map(([cat, amt], idx) => ({
    name: cat,
    population: amt,
    color: colors[idx % colors.length],
    legendFontColor: '#B8B5D1',
    legendFontSize: 12
  })) : [];

  const barData = summary ? {
    labels: Object.keys(summary.byCategory).map(c => c.charAt(0).toUpperCase() + c.slice(1, 4)),
    datasets: [{ data: Object.values(summary.byCategory) }]
  } : { labels: [], datasets: [{ data: [] }] };

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
            <View className="flex-row gap-3 mb-4">
              <TouchableOpacity className="flex-1 bg-green-500 rounded-xl py-3.5 items-center justify-center flex-row" onPress={exportCSV} style={{ backgroundColor: '#22C55E' }}>
                <Text className="text-white font-bold text-[15px]">📤 Dump to CSV</Text>
              </TouchableOpacity>
            </View>
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
                <View className="flex-row justify-between items-center mb-5">
                  <Text className="text-text-1 text-base font-bold">Category Distribution</Text>
                  <View className="flex-row bg-bg-body rounded-lg p-1 border border-border">
                    <TouchableOpacity onPress={() => setChartView('pie')} className={`px-3 py-1.5 rounded-md ${chartView === 'pie' ? 'bg-primary' : ''}`}>
                      <Text className={`text-[12px] font-bold tracking-wider ${chartView === 'pie' ? 'text-white' : 'text-text-muted'}`}>PIE</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setChartView('bar')} className={`px-3 py-1.5 rounded-md ${chartView === 'bar' ? 'bg-primary' : ''}`}>
                      <Text className={`text-[12px] font-bold tracking-wider ${chartView === 'bar' ? 'text-white' : 'text-text-muted'}`}>BAR</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {chartView === 'pie' ? (
                  <PieChart
                    data={pieData}
                    width={screenWidth - 64}
                    height={220}
                    chartConfig={chartConfig}
                    accessor="population"
                    backgroundColor="transparent"
                    paddingLeft="0"
                    center={[10, 0]}
                    absolute
                  />
                ) : (
                  <BarChart
                    data={barData}
                    width={screenWidth - 64}
                    height={260}
                    yAxisLabel=""
                    yAxisSuffix=""
                    chartConfig={chartConfig}
                    verticalLabelRotation={0}
                    showValuesOnTopOfBars={true}
                    fromZero={true}
                  />
                )}

                <View className="h-[1px] bg-border my-4" />
                
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
