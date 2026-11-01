// Shared building blocks: label, chip, card, button, segmented control, tab bar.
// Why: every screen uses the same pieces, so the app looks consistent.

import React from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import { FONT, THEME } from '../constants/theme';

type IconName = React.ComponentProps<typeof Feather>['name'];

// Small spaced-out caps label: "YOUR ARMY", "MOMENTS SO FAR".
export function Label({ children, color = THEME.muted, style }: { children: React.ReactNode; color?: string; style?: StyleProp<TextStyle> }) {
    return <Text style={[styles.label, { color }, style]}>{children}</Text>;
}

// Solid badge: "WICKET", "RUN OUT", "SIX".
export function Chip({ label, color, textColor = THEME.bg }: { label: string; color: string; textColor?: string }) {
    return (
        <View style={[styles.chip, { backgroundColor: color }]}>
            <Text style={[styles.chipText, { color: textColor }]}>{label}</Text>
        </View>
    );
}

export function Card({ children, style, armed }: { children: React.ReactNode; style?: StyleProp<ViewStyle>; armed?: boolean }) {
    return <View style={[styles.card, armed && styles.cardArmed, style]}>{children}</View>;
}

type ButtonProps = {
    title: string;
    onPress: () => void;
    kind?: 'primary' | 'outline';
    icon?: IconName;
    color?: string; // outline accent
    disabled?: boolean;
    style?: StyleProp<ViewStyle>;
};

export function Button({ title, onPress, kind = 'primary', icon, color, disabled, style }: ButtonProps) {
    const primary = kind === 'primary';
    const fg = primary ? THEME.bg : (color ?? THEME.text);
    return (
        <Pressable
            accessibilityRole="button"
            onPress={onPress}
            disabled={disabled}
            style={({ pressed }) => [
                styles.button,
                primary ? styles.buttonPrimary : [styles.buttonOutline, color ? { borderColor: color } : null],
                (pressed || disabled) && { opacity: disabled ? 0.4 : 0.8 },
                style,
            ]}
        >
            {icon ? <Feather name={icon} size={18} color={fg} /> : null}
            <Text style={[styles.buttonText, { color: fg }]}>{title}</Text>
        </Pressable>
    );
}

// Segmented control: speed, team, language, roast level.
export function Segmented<T extends string | number>({
    options,
    value,
    onChange,
    label = (o: T) => String(o),
    activeBg = THEME.roar,
    activeText = THEME.bg,
    height = 32,
}: {
    options: T[];
    value: T;
    onChange: (v: T) => void;
    label?: (o: T) => string;
    activeBg?: string;
    activeText?: string;
    height?: number;
}) {
    return (
        <View accessibilityRole="radiogroup" style={styles.segment}>
            {options.map((o) => {
                const on = o === value;
                return (
                    <Pressable
                        key={String(o)}
                        accessibilityRole="radio"
                        accessibilityState={{ checked: on }}
                        onPress={() => onChange(o)}
                        style={[styles.segmentItem, { height }, on && { backgroundColor: activeBg }]}
                    >
                        <Text style={[styles.segmentText, { color: on ? activeText : THEME.muted, fontFamily: on ? FONT.black : FONT.bold }]}>
                            {label(o)}
                        </Text>
                    </Pressable>
                );
            })}
        </View>
    );
}

export function IconButton({ icon, onPress, label }: { icon: IconName; onPress: () => void; label: string }) {
    return (
        <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={styles.iconButton}>
            <Feather name={icon} size={18} color={THEME.text} />
        </Pressable>
    );
}

const TABS: { path: '/' | '/banter' | '/wall' | '/me'; title: string; icon: IconName }[] = [
    { path: '/', title: 'Match', icon: 'play-circle' },
    { path: '/banter', title: 'Banter', icon: 'message-square' },
    { path: '/wall', title: 'Wall', icon: 'grid' },
    { path: '/me', title: 'Me', icon: 'user' },
];

export function TabBar() {
    const router = useRouter();
    const path = usePathname();
    return (
        <View style={styles.tabBar}>
            {TABS.map((t) => {
                const on = path === t.path;
                const color = on ? THEME.roar : THEME.muted;
                return (
                    <Pressable
                        key={t.path}
                        accessibilityRole="tab"
                        accessibilityState={{ selected: on }}
                        onPress={() => !on && router.navigate(t.path)}
                        style={[styles.tab, on && styles.tabOn]}
                    >
                        <Feather name={t.icon} size={21} color={color} />
                        <Text style={[styles.tabText, { color, fontFamily: on ? FONT.bold : FONT.semi }]}>{t.title}</Text>
                    </Pressable>
                );
            })}
        </View>
    );
}

export const styles = StyleSheet.create({
    label: { fontFamily: FONT.black, fontSize: 11, letterSpacing: 1.8 },
    chip: { alignSelf: 'flex-start', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 3 },
    chipText: { fontFamily: FONT.black, fontSize: 10, letterSpacing: 1 },
    card: { backgroundColor: THEME.surface, borderWidth: 1, borderColor: THEME.line, borderRadius: 16, padding: 14 },
    cardArmed: { backgroundColor: THEME.dropTint, borderColor: THEME.dropLine },
    button: { height: 52, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 14 },
    buttonPrimary: { backgroundColor: THEME.roar },
    buttonOutline: { borderWidth: 1, borderColor: THEME.line },
    buttonText: { fontFamily: FONT.black, fontSize: 15 },
    segment: { flexDirection: 'row', backgroundColor: THEME.bg, borderWidth: 1, borderColor: THEME.line, borderRadius: 10, padding: 2 },
    segmentItem: { flex: 1, minWidth: 34, paddingHorizontal: 10, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
    segmentText: { fontSize: 12 },
    iconButton: { width: 40, height: 40, borderRadius: 10, borderWidth: 1, borderColor: THEME.line, alignItems: 'center', justifyContent: 'center' },
    tabBar: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: THEME.line, backgroundColor: THEME.bg },
    tab: { flex: 1, height: 64, alignItems: 'center', justifyContent: 'center', gap: 3 },
    tabOn: { borderTopWidth: 2, borderTopColor: THEME.roar, marginTop: -1 },
    tabText: { fontSize: 11 },
});
