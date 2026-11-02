// Keeps you in your rival's room and pops up incoming roasts on any screen.
// Why: a roast should reach you wherever you are in the app.

import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { FONT, THEME } from '../constants/theme';
import { useRoar } from '@/lib/store';
import { joinRoom, leaveRoom, useRival } from '@/lib/rival/room';
import { TEAM_COLOR } from '@/lib/teams';

const SHOW_MS = 5000;
const REJOIN_AFTER_TYPING_MS = 700;

export default function RoastBanner() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { room, name, team } = useRoar((s) => s.profile);
    const fanId = useRoar((s) => s.fanId);
    const toast = useRival((s) => s.toast);
    const dismissToast = useRival((s) => s.dismissToast);

    // Join (or leave) the room whenever the code, name or team changes. Waits a moment so
    // typing your name doesn't reconnect on every letter.
    useEffect(() => {
        const t = setTimeout(() => (room ? joinRoom(room, fanId, name, team) : leaveRoom()), REJOIN_AFTER_TYPING_MS);
        return () => clearTimeout(t);
    }, [room, fanId, name, team]);

    useEffect(() => {
        if (!toast) return;
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
        const t = setTimeout(dismissToast, SHOW_MS);
        return () => clearTimeout(t);
    }, [toast, dismissToast]);

    if (!toast) return null;

    return (
        <View pointerEvents="box-none" style={[styles.wrap, { top: insets.top + 8 }]}>
            <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Roast from ${toast.from}. Open Banter`}
                onPress={() => {
                    dismissToast();
                    router.navigate('/banter');
                }}
                style={[styles.banner, { borderColor: TEAM_COLOR[toast.team] }]}
            >
                <View style={styles.row}>
                    <Text style={[styles.from, { color: TEAM_COLOR[toast.team] }]}>{toast.from.toUpperCase()} ROASTED YOU</Text>
                    {toast.tag ? <Text style={styles.tag}>{toast.tag}</Text> : null}
                </View>
                <Text style={styles.text} numberOfLines={3}>
                    {toast.text}
                </Text>
                <Text style={styles.hint}>Tap to roast back</Text>
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    wrap: { position: 'absolute', left: 12, right: 12, zIndex: 100 },
    banner: { backgroundColor: THEME.surface, borderWidth: 1, borderRadius: 16, padding: 14, gap: 6 },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    from: { fontFamily: FONT.black, fontSize: 11, letterSpacing: 1.6 },
    tag: { fontFamily: FONT.numBold, fontSize: 14, color: THEME.muted },
    text: { fontFamily: FONT.num, fontSize: 20, lineHeight: 23, color: THEME.text, textTransform: 'uppercase' },
    hint: { fontFamily: FONT.semi, fontSize: 12, color: THEME.muted },
});
