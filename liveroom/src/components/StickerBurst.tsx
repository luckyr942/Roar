// A row of stickers that pop in one after another with a bounce (or sit still in the feed).
// Why: an incoming sticker should feel like it was thrown at you, not just appear.

import React, { useEffect, useRef } from 'react';
import { Animated, Image, StyleSheet, View } from 'react-native';
import { STICKERS, isStickerName } from '@/lib/stickers';

export const STICKER_ONLY = ['STICKER', 'STICKER STORM'];

export default function StickerBurst({ names, size = 64, animate = true }: { names: string[]; size?: number; animate?: boolean }) {
    const stickers = names.filter(isStickerName);
    const scales = useRef(stickers.map(() => new Animated.Value(animate ? 0.2 : 1))).current;

    useEffect(() => {
        if (!animate) return;
        Animated.stagger(
            90,
            scales.map((scale) => Animated.spring(scale, { toValue: 1, friction: 4, tension: 140, useNativeDriver: true })),
        ).start();
    }, [animate, scales]);

    if (stickers.length === 0) return null;

    return (
        <View style={styles.row} accessibilityLabel={`Stickers: ${stickers.join(', ')}`}>
            {stickers.map((name, i) => (
                <Animated.View
                    key={`${name}-${i}`}
                    style={{ transform: [{ scale: scales[i] ?? 1 }, { rotate: `${(i % 2 ? 1 : -1) * (6 + i * 3)}deg` }] }}
                >
                    <Image source={STICKERS[name]} style={{ width: size, height: size }} resizeMode="contain" />
                </Animated.View>
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    row: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, alignItems: 'center' },
});
