/**
 * GlowButton — press-reactive orb button
 * Violet + rose glow orbs animate on PressIn, retract on PressOut.
 */
import React, { useRef } from 'react';
import { Animated, TouchableOpacity, View, Text, StyleSheet } from 'react-native';

type Props = {
  label:     string;
  onPress:   () => void;
  icon?:     React.ReactNode;
  width?:    number | string;
  style?:    object;
  textStyle?: object;
};

export default function GlowButton({ label, onPress, icon, width, style, textStyle }: Props) {
  const anim = useRef(new Animated.Value(0)).current;

  const pressIn  = () => Animated.spring(anim, {
    toValue: 1, useNativeDriver: false, speed: 30, bounciness: 4,
  }).start();

  const pressOut = () => Animated.spring(anim, {
    toValue: 0, useNativeDriver: false, speed: 20, bounciness: 0,
  }).start();

  /* ── Orb positions ─────────────────────────────── */
  const violetRight = anim.interpolate({ inputRange: [0, 1], outputRange: [4, 36] });
  const roseRight   = anim.interpolate({ inputRange: [0, 1], outputRange: [20, -8] });
  const roseTop     = anim.interpolate({ inputRange: [0, 1], outputRange: [6, 20] });

  /* ── Colour animations ──────────────────────────── */
  const textColor   = anim.interpolate({ inputRange: [0, 1], outputRange: ['#F9FAFB', '#FDA4AF'] });
  const borderColor = anim.interpolate({
    inputRange: [0, 1], outputRange: ['rgba(255,255,255,0.12)', 'rgba(253,164,175,0.45)'],
  });
  const scale = anim.interpolate({ inputRange: [0, 1], outputRange: [1, 0.97] });

  return (
    <Animated.View
      style={[
        s.wrapper,
        width ? { width } : undefined,
        { borderColor, transform: [{ scale }] },
        style,
      ]}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        activeOpacity={1}
        style={s.inner}>

        {/* ── Violet orb ── */}
        <Animated.View style={[s.violetOrb, { right: violetRight }]} />
        {/* ── Rose orb ── */}
        <Animated.View style={[s.roseOrb, { right: roseRight, top: roseTop }]} />

        {/* ── Content ── */}
        <View style={s.row}>
          {icon && <View style={s.iconBox}>{icon}</View>}
          <Animated.Text style={[s.label, { color: textColor }, textStyle]}>
            {label}
          </Animated.Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  wrapper: {
    height: 54,
    backgroundColor: '#1C1B2E',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    overflow: 'hidden',
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    zIndex: 10,
  },
  iconBox: { marginRight: 2 },
  label: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F9FAFB',
    textDecorationLine: 'underline',
    textDecorationStyle: 'solid',
    zIndex: 10,
  },
  violetOrb: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#8B5CF6',
    top: 4,
    opacity: 0.75,
  },
  roseOrb: {
    position: 'absolute',
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: '#EC4899',
    opacity: 0.55,
  },
});
