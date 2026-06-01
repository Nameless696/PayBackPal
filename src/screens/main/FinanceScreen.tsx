import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, SafeAreaView, StyleSheet,
  RefreshControl, Dimensions, Alert, Animated, Easing, StatusBar, Platform,
} from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import LinearGradient from 'react-native-linear-gradient';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { useModal } from '../../context/ModalContext';
import { useThemeColors } from '../../hooks/useThemeColors';
import { getCategoryIcon } from '../../constants/categories';
import type { PersonalTransaction } from '../../types';

const W = Dimensions.get('window').width;
const PIE_COLORS = ['#6C63FF', '#22C55E', '#F59E0B', '#EF4444', '#3B82F6', '#EC4899', '#8B5CF6', '#14B8A6'];

export default function FinanceScreen() {
  const { personalTransactions, deletePersonalTransaction, budget, setBudget, fmt, syncAll, isSyncing } = useApp();
  const { user } = useAuth();
  const modal = useModal();
  const C = useThemeColors();
  const [period, setPeriod] = useState<'week' | 'month'>('month');
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (user) await syncAll(user);
    setRefreshing(false);
  }, [user, syncAll]);

  // Filter transactions by period
  const filtered = useMemo(() => {
    const now = new Date();
    let start: Date;
    if (period === 'week') {
      start = new Date(now);
      start.setDate(now.getDate() - 7);
      start.setHours(0, 0, 0, 0);
    } else {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
    }
    return personalTransactions.filter(t => new Date(t.date) >= start);
  }, [personalTransactions, period]);

  const totalIncome  = filtered.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = filtered.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const netBalance   = totalIncome - totalExpense;

  // Category breakdown for expenses
  const byCategory = useMemo(() => {
    const map: Record<string, number> = {};
    filtered.filter(t => t.type === 'expense').forEach(t => {
      map[t.category] = (map[t.category] || 0) + t.amount;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [filtered]);

  const pieData = byCategory.map(([cat, amt], i) => ({
    name: cat.charAt(0).toUpperCase() + cat.slice(1),
    population: amt,
    color: PIE_COLORS[i % PIE_COLORS.length],
    legendFontColor: C.muted,
    legendFontSize: 11,
  }));

  // Budget progress
  const budgetUsed = budget ? Math.min(totalExpense / budget.monthlyLimit, 1) : 0;
  const budgetColor = budgetUsed > 0.9 ? '#EF4444' : budgetUsed > 0.7 ? '#F59E0B' : '#22C55E';

  // Animated budget bar fill
  const budgetAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(budgetAnim, {
      toValue: budgetUsed,
      duration: 800,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [budgetUsed]);

  async function handleSetBudget() {
    const val = await modal.showPrompt('Enter your monthly spending limit:', {
      title: 'Set Monthly Budget',
      prefix: fmt(0).charAt(0), // currency symbol
      placeholder: budget?.monthlyLimit?.toString() || '50000',
    });
    if (val && parseFloat(val) > 0) setBudget(parseFloat(val));
  }

  function handleDeleteTx(tx: PersonalTransaction) {
    Alert.alert('Delete', `Delete "${tx.description}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deletePersonalTransaction(tx.id) },
    ]);
  }

  return (
    <SafeAreaView style={[s.root, { backgroundColor: C.bg }]}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6C63FF" colors={['#6C63FF']} />}
      >
        {/* Header */}
        <View style={[s.header, { paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 8 : 16 }]}>
          <Text style={[s.headerTitle, { color: C.text1 }]}>My Finance</Text>
        </View>

        {/* Period Toggle */}
        <View style={s.toggleRow}>
          {(['week', 'month'] as const).map(p => (
            <TouchableOpacity
              key={p}
              style={[s.toggleBtn, period === p && s.toggleBtnActive]}
              onPress={() => setPeriod(p)}
              accessibilityLabel={`Show ${p === 'week' ? 'this week' : 'this month'}`}
              accessibilityRole="tab"
              accessibilityState={{ selected: period === p }}
            >
              <Text style={[s.toggleTxt, period === p && s.toggleTxtActive]}>
                {p === 'week' ? 'This Week' : 'This Month'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Summary Cards */}
        <View style={s.cardsRow}>
          <LinearGradient colors={['#166534', '#15803d']} style={s.card}>
            <Text style={s.cardLabel}>Income</Text>
            <Text style={s.cardValue}>{fmt(totalIncome)}</Text>
          </LinearGradient>
          <LinearGradient colors={['#991b1b', '#dc2626']} style={s.card}>
            <Text style={s.cardLabel}>Expenses</Text>
            <Text style={s.cardValue}>{fmt(totalExpense)}</Text>
          </LinearGradient>
        </View>

        <View style={[s.netCard, { backgroundColor: C.card, borderColor: C.border }]}>
          <Text style={[s.netLabel, { color: C.muted }]}>Net Balance</Text>
          <Text style={[s.netValue, { color: netBalance >= 0 ? '#22C55E' : '#EF4444' }]}>
            {netBalance >= 0 ? '+' : ''}{fmt(netBalance)}
          </Text>
        </View>

        {/* Budget Progress */}
        <View style={[s.section, { backgroundColor: C.card, borderColor: C.border }]}>
          <View style={s.sectionHeader}>
            <Text style={[s.sectionTitle, { color: C.text1 }]}>Monthly Budget</Text>
            <TouchableOpacity onPress={handleSetBudget} accessibilityLabel={budget ? 'Edit monthly budget' : 'Set monthly budget'} accessibilityRole="button">
              <Text style={s.editLink}>{budget ? 'Edit' : 'Set Budget'}</Text>
            </TouchableOpacity>
          </View>
          {budget ? (
            <>
              <View style={s.budgetBarBg}>
                <Animated.View style={[s.budgetBarFill, {
                  width: budgetAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
                  backgroundColor: budgetColor,
                }]} />
              </View>
              <View style={s.budgetLabels}>
                <Text style={{ color: C.muted, fontSize: 12 }}>{fmt(totalExpense)} spent</Text>
                <Text style={{ color: C.muted, fontSize: 12 }}>of {fmt(budget.monthlyLimit)}</Text>
              </View>
              {budgetUsed > 0.9 && (
                <Text style={s.budgetWarn}>⚠️ You've used {Math.round(budgetUsed * 100)}% of your budget!</Text>
              )}
            </>
          ) : (
            <>
            <Text style={{ color: C.muted, fontSize: 13 }}>Tap "Set Budget" to track your spending against a monthly limit.</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 6 }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#22C55E' }} />
              <Text style={{ color: C.muted, fontSize: 11 }}>Safe</Text>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#F59E0B' }} />
              <Text style={{ color: C.muted, fontSize: 11 }}>Warning</Text>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444' }} />
              <Text style={{ color: C.muted, fontSize: 11 }}>Over</Text>
            </View>
            </>
          )}
        </View>

        {/* Analytics Pie Chart */}
        {byCategory.length > 0 && (
          <View style={[s.section, { backgroundColor: C.card, borderColor: C.border }]}>
            <Text style={[s.sectionTitle, { color: C.text1, marginBottom: 12 }]}>Spending by Category</Text>
            <PieChart
              data={pieData}
              width={W - 64}
              height={180}
              chartConfig={{
                color: (o = 1) => `rgba(108, 99, 255, ${o})`,
                labelColor: () => C.muted,
              }}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="0"
              absolute
            />
          </View>
        )}

        {/* Transaction List */}
        <View style={[s.section, { backgroundColor: C.card, borderColor: C.border }]}>
          <Text style={[s.sectionTitle, { color: C.text1, marginBottom: 12 }]}>
            Transactions ({filtered.length})
          </Text>
          {filtered.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 32 }}>
              <Text style={{ fontSize: 48, marginBottom: 8 }}>💳</Text>
              <Text style={{ color: C.text1, fontSize: 16, fontWeight: '700', marginBottom: 4 }}>No transactions yet</Text>
              <Text style={{ color: C.muted, fontSize: 13, textAlign: 'center' }}>Tap "+ Add" to record your income{"\n"}and expenses for this period.</Text>
            </View>
          ) : (
            filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(tx => (
              <TouchableOpacity key={tx.id} style={[s.txRow, { borderBottomColor: C.border }]} onLongPress={() => handleDeleteTx(tx)} accessibilityLabel={`${tx.type === 'income' ? 'Income' : 'Expense'}: ${tx.description}, ${fmt(tx.amount)}`} accessibilityHint="Long press to delete">
                <View style={[s.txIcon, { backgroundColor: tx.type === 'income' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)' }]}>
                  <Text style={{ fontSize: 18 }}>{tx.type === 'income' ? '💰' : getCategoryIcon(tx.category)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.txDesc, { color: C.text1 }]}>{tx.description}</Text>
                  <Text style={{ color: C.muted, fontSize: 11 }}>
                    {tx.category} · {new Date(tx.date).toLocaleDateString()}
                    {tx.isRecurring ? ' · 🔄 Recurring' : ''}
                  </Text>
                </View>
                <Text style={[s.txAmt, { color: tx.type === 'income' ? '#22C55E' : '#EF4444' }]}>
                  {tx.type === 'income' ? '+' : '-'}{fmt(tx.amount)}
                </Text>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      {/* Extended FAB — Issue 4 fix */}
      <TouchableOpacity
        style={s.fab}
        onPress={() => modal.openAddTransaction()}
        accessibilityLabel="Add new transaction"
        accessibilityRole="button"
        activeOpacity={0.85}
      >
        <Text style={s.fabIcon}>+</Text>
        <Text style={s.fabLabel}>Add Transaction</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 8 },
  headerTitle: { fontSize: 24, fontWeight: '800' },
  toggleRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 10, marginBottom: 16 },
  toggleBtn: { flex: 1, paddingVertical: 10, borderRadius: 12, backgroundColor: 'rgba(108,99,255,0.08)', alignItems: 'center' },
  toggleBtnActive: { backgroundColor: '#6C63FF' },
  toggleTxt: { color: '#6B6890', fontWeight: '600', fontSize: 13 },
  toggleTxtActive: { color: '#FFF' },
  cardsRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 12, marginBottom: 12 },
  card: { flex: 1, borderRadius: 16, padding: 16 },
  cardLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '600' },
  cardValue: { color: '#FFF', fontSize: 20, fontWeight: '800', marginTop: 4 },
  netCard: { marginHorizontal: 20, borderRadius: 16, padding: 16, borderWidth: 1, marginBottom: 16, alignItems: 'center' },
  netLabel: { fontSize: 12, fontWeight: '600' },
  netValue: { fontSize: 28, fontWeight: '900', marginTop: 2 },
  section: { marginHorizontal: 20, borderRadius: 16, padding: 16, borderWidth: 1, marginBottom: 16 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 15, fontWeight: '700' },
  editLink: { color: '#6C63FF', fontSize: 13, fontWeight: '600' },
  budgetBarBg: { height: 14, backgroundColor: 'rgba(108,99,255,0.1)', borderRadius: 7, overflow: 'hidden', marginBottom: 6 },
  budgetBarFill: { height: '100%', borderRadius: 7 },
  budgetLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  budgetWarn: { color: '#EF4444', fontSize: 12, fontWeight: '600', marginTop: 6, textAlign: 'center' },
  txRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1 },
  txIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  txDesc: { fontSize: 14, fontWeight: '600' },
  txAmt: { fontSize: 14, fontWeight: '800' },
  fab: { position: 'absolute', bottom: 90, right: 16, flexDirection: 'row', alignItems: 'center', backgroundColor: '#6C63FF', paddingHorizontal: 20, paddingVertical: 14, borderRadius: 28, elevation: 8, shadowColor: '#6C63FF', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 8, gap: 8 },
  fabIcon: { color: '#FFF', fontSize: 22, fontWeight: '700', lineHeight: 24 },
  fabLabel: { color: '#FFF', fontSize: 14, fontWeight: '700' },
});
