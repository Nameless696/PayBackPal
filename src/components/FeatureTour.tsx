/**
 * FeatureTour.tsx
 * A cool, skippable tooltip-card tour that slides up from the bottom.
 * Shows on first login; re-launchable from Settings.
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Modal,
  Animated, Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { Home, Users, Plus, Bell, User, X, ChevronRight } from 'lucide-react-native';

const { height: SCREEN_H } = Dimensions.get('window');

export interface TourStep {
  icon: React.ReactNode;
  title: string;
  description: string;
  accent: string;
}

const STEPS: TourStep[] = [
  {
    icon: <Home color="#6C63FF" size={32} />,
    title: 'Your Dashboard',
    description: 'See exactly who owes you and what you owe — all in one glance. Your balance card updates in real time.',
    accent: '#6C63FF',
  },
  {
    icon: <Users color="#4F9EFF" size={32} />,
    title: 'Groups',
    description: 'Create a group for trips, rent, a party — anything shared. Invite friends with a code or by email.',
    accent: '#4F9EFF',
  },
  {
    icon: <Plus color="#A78BFA" size={32} />,
    title: 'Add Expense',
    description: 'Tap the big + button anytime to log a shared expense. Choose who paid and split it among the group.',
    accent: '#A78BFA',
  },
  {
    icon: <Bell color="#F59E0B" size={32} />,
    title: 'Alerts',
    description: 'Get notified whenever someone adds an expense, settles up, or invites you to a group.',
    accent: '#F59E0B',
  },
  {
    icon: <User color="#34D399" size={32} />,
    title: 'Your Profile',
    description: 'View your spending stats, update your photo, change your password, and manage app settings.',
    accent: '#34D399',
  },
];

interface Props {
  visible: boolean;
  onDismiss: () => void;
}

export default function FeatureTour({ visible, onDismiss }: Props) {
  const [step, setStep] = useState(0);
  const slideAnim = useRef(new Animated.Value(SCREEN_H)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(0.92)).current;

  useEffect(() => {
    if (visible) {
      setStep(0);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 60, friction: 10 }),
        Animated.spring(cardScale, { toValue: 1, useNativeDriver: true, tension: 60, friction: 10 }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: SCREEN_H, duration: 250, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const animateStep = (nextStep: number) => {
    Animated.sequence([
      Animated.timing(cardScale, { toValue: 0.95, duration: 100, useNativeDriver: true }),
      Animated.spring(cardScale, { toValue: 1, useNativeDriver: true, tension: 70, friction: 8 }),
    ]).start();
    setStep(nextStep);
  };

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <Modal visible={visible} transparent statusBarTranslucent animationType="none">
      {/* Dim overlay */}
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        {/* Skip button top-right */}
        <TouchableOpacity style={styles.skipTop} onPress={onDismiss}>
          <View style={styles.skipChip}>
            <X color="rgba(255,255,255,0.7)" size={14} />
            <Text style={styles.skipChipTxt}>Skip tour</Text>
          </View>
        </TouchableOpacity>

        {/* Step indicator dots at top */}
        <View style={styles.dotsRow}>
          {STEPS.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i === step && { width: 20, backgroundColor: current.accent },
                i < step  && { backgroundColor: 'rgba(255,255,255,0.5)' },
              ]}
            />
          ))}
        </View>

        {/* Slide-up card */}
        <Animated.View style={[styles.cardWrap, { transform: [{ translateY: slideAnim }, { scale: cardScale }] }]}>
          {/* Accent gradient top strip */}
          <LinearGradient
            colors={[current.accent + '33', 'transparent']}
            style={styles.cardGlow}
            start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }}
          />

          {/* Icon badge */}
          <View style={[styles.iconBadge, { borderColor: current.accent + '44', backgroundColor: current.accent + '18' }]}>
            {current.icon}
          </View>

          <Text style={styles.stepNum}>{step + 1} of {STEPS.length}</Text>
          <Text style={styles.cardTitle}>{current.title}</Text>
          <Text style={styles.cardDesc}>{current.description}</Text>

          {/* Action buttons */}
          <View style={styles.actionRow}>
            {step > 0 && (
              <TouchableOpacity style={styles.backBtn} onPress={() => animateStep(step - 1)}>
                <Text style={styles.backTxt}>← Back</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.nextBtn, { flex: 1 }]}
              onPress={() => isLast ? onDismiss() : animateStep(step + 1)}
            >
              <LinearGradient
                colors={[current.accent, current.accent + 'BB']}
                style={styles.nextGrad}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              >
                <Text style={styles.nextTxt}>{isLast ? '🎉 Got it!' : 'Next'}</Text>
                {!isLast && <ChevronRight color="#FFF" size={16} />}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
    paddingBottom: 32,
  },
  skipTop: {
    position: 'absolute',
    top: 56,
    right: 20,
    zIndex: 10,
  },
  skipChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  skipChipTxt: { color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: '600' },
  dotsRow: {
    flexDirection: 'row', gap: 6, justifyContent: 'center',
    marginBottom: 20,
  },
  dot: {
    height: 6, width: 6, borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  cardWrap: {
    marginHorizontal: 16,
    backgroundColor: '#1A1A2E',
    borderRadius: 28,
    padding: 28,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  cardGlow: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 80,
    borderRadius: 28,
  },
  iconBadge: {
    width: 72, height: 72, borderRadius: 22,
    borderWidth: 1.5,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 16, alignSelf: 'flex-start',
  },
  stepNum: {
    color: 'rgba(255,255,255,0.35)', fontSize: 12, fontWeight: '600',
    marginBottom: 6,
  },
  cardTitle: {
    color: '#FFF', fontSize: 24, fontWeight: '800',
    marginBottom: 10,
  },
  cardDesc: {
    color: 'rgba(255,255,255,0.6)', fontSize: 15, lineHeight: 23,
    marginBottom: 28,
  },
  actionRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  backBtn: {
    paddingVertical: 14, paddingHorizontal: 16,
    borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
  },
  backTxt: { color: 'rgba(255,255,255,0.6)', fontWeight: '600', fontSize: 14 },
  nextBtn: { borderRadius: 14, overflow: 'hidden' },
  nextGrad: {
    paddingVertical: 14, paddingHorizontal: 20,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6,
  },
  nextTxt: { color: '#FFF', fontWeight: '700', fontSize: 15 },
});
