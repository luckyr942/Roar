// Me screen: your name, rival, settings and every memory you have kept.
// Why: one place to change your profile and find old reactions.

import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { FONT, THEME } from '../constants/theme';
import { useRoar } from '@/lib/store';
import { ARM_CAMERA_AT } from '@/lib/match/tension';
import { ARMY_NAME, LABEL_COLOR, TEAM_COLOR, TEAM_TEXT, rivalTeam } from '@/lib/teams';
import { Chip, Label, TabBar } from '@/components/ui';

export default function MeScreen() {
    const router = useRouter();
    const profile = useRoar((s) => s.profile);
    const setProfile = useRoar((s) => s.setProfile);
    const memories = useRoar((s) => s.memories);
    const matchesLived = useRoar((s) => s.matchesLived);
    const delayMs = useRoar((s) => s.delayMs);

    return (
        <SafeAreaView style={styles.safe} edges={['top']}>
            <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
                <View style={styles.header}>
                    <View style={[styles.avatar, { backgroundColor: profile.team === 'MI' ? THEME.miBand : THEME.csk }]}>
                        <Text style={[styles.avatarText, profile.team === 'CSK' && { color: THEME.bg }]}>{profile.name.charAt(0).toUpperCase() || 'F'}</Text>
                    </View>
                    <View>
                        <Text style={styles.name}>{profile.name.toUpperCase() || 'FAN'}</Text>
                        <Text style={styles.small}>
                            <Text style={{ color: TEAM_TEXT[profile.team], fontFamily: FONT.bold }}>{ARMY_NAME[profile.team]}</Text> · Lv{' '}
                            {1 + memories.length} · {matchesLived} matches lived
                        </Text>
                    </View>
                </View>

                <View style={{ gap: 6 }}>
                    <Label>YOUR NAME</Label>
                    <TextInput value={profile.name} onChangeText={(name) => setProfile({ name })} style={styles.input} accessibilityLabel="Your name" />
                </View>
                <View style={{ gap: 6 }}>
                    <Label>YOUR RIVAL · {rivalTeam(profile.team)} FAN</Label>
                    <TextInput value={profile.rival} onChangeText={(rival) => setProfile({ rival })} style={styles.input} accessibilityLabel="Your rival" />
                </View>

                <View style={styles.card}>
                    <Setting icon="tv" title="TV delay" value={`${delayMs / 1000} seconds`} hint="Tap TV sync on the match screen" />
                    <Setting icon="camera" title="Camera arms at" value={`Tension ${ARM_CAMERA_AT}`} divider />
                    <Setting icon="send" title="Auto-roast" value={profile.autoRoast ? 'On' : 'Off'} divider onPress={() => setProfile({ autoRoast: !profile.autoRoast })} />
                    <Setting icon="message-square" title="Banter room" value={profile.room || 'None'} divider onPress={() => router.navigate('/banter')} />
                </View>

                <View style={styles.rowBetween}>
                    <Text style={styles.h2}>All memories</Text>
                    <Text style={styles.small}>{memories.length}</Text>
                </View>
                <View style={styles.grid}>
                    {memories.map((m) => (
                        <Pressable
                            key={m.id}
                            accessibilityRole="button"
                            accessibilityLabel={`${m.moment.label} ${m.moment.overText}, ${m.moment.title}`}
                            onPress={() => router.push({ pathname: '/memory', params: { id: m.id } })}
                            style={styles.tile}
                        >
                            {m.frameUri ? <Image source={{ uri: m.frameUri }} style={[StyleSheet.absoluteFill, { opacity: 0.55 }]} /> : null}
                            <Chip label={m.moment.label} color={LABEL_COLOR[m.moment.label] ?? THEME.roar} />
                            <View>
                                <Text style={styles.tileOver}>{m.moment.overText}</Text>
                                <Text style={styles.tileTitle} numberOfLines={2}>
                                    {m.moment.title}
                                </Text>
                            </View>
                        </Pressable>
                    ))}
                    <View style={[styles.tile, styles.tileEmpty]}>
                        <Text style={[styles.small, { textAlign: 'center', color: TEAM_COLOR[profile.team] }]}>Your next scream</Text>
                    </View>
                </View>
            </ScrollView>
            <TabBar />
        </SafeAreaView>
    );
}

function Setting({
    icon,
    title,
    value,
    hint,
    divider,
    onPress,
}: {
    icon: React.ComponentProps<typeof Feather>['name'];
    title: string;
    value: string;
    hint?: string;
    divider?: boolean;
    onPress?: () => void;
}) {
    return (
        <Pressable accessibilityRole={onPress ? 'button' : 'text'} disabled={!onPress} onPress={onPress} style={[styles.setting, divider && styles.settingDivider]}>
            <Feather name={icon} size={17} color={THEME.muted} />
            <View style={{ flex: 1 }}>
                <Text style={styles.settingTitle}>{title}</Text>
                {hint ? <Text style={styles.hint}>{hint}</Text> : null}
            </View>
            <Text style={styles.settingValue}>{value}</Text>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: THEME.bg },
    page: { padding: 20, paddingTop: 16, gap: 16, paddingBottom: 28 },
    rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
    header: { flexDirection: 'row', alignItems: 'center', gap: 14 },
    avatar: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
    avatarText: { fontFamily: FONT.num, fontSize: 28, color: THEME.text },
    name: { fontFamily: FONT.num, fontSize: 32, lineHeight: 32, color: THEME.text },
    small: { fontFamily: FONT.body, fontSize: 13, color: THEME.muted },
    input: { height: 46, borderRadius: 12, borderWidth: 1, borderColor: THEME.line, backgroundColor: THEME.surface, color: THEME.text, paddingHorizontal: 14, fontFamily: FONT.semi, fontSize: 15 },
    card: { backgroundColor: THEME.surface, borderWidth: 1, borderColor: THEME.line, borderRadius: 16 },
    setting: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 13 },
    settingDivider: { borderTopWidth: 1, borderTopColor: THEME.raised },
    settingTitle: { fontFamily: FONT.semi, fontSize: 14, color: THEME.text },
    hint: { fontFamily: FONT.body, fontSize: 11, color: THEME.dim },
    settingValue: { fontFamily: FONT.semi, fontSize: 14, color: THEME.muted },
    h2: { fontFamily: FONT.bold, fontSize: 17, color: THEME.text },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    tile: { width: '31.8%', height: 118, borderRadius: 12, backgroundColor: THEME.surfaceCard, borderWidth: 1, borderColor: THEME.line, padding: 8, justifyContent: 'space-between', overflow: 'hidden' },
    tileEmpty: { borderStyle: 'dashed', borderColor: '#3A3A44', backgroundColor: 'transparent', alignItems: 'center', justifyContent: 'center' },
    tileOver: { fontFamily: FONT.numBold, fontSize: 18, color: THEME.muted },
    tileTitle: { fontFamily: FONT.bold, fontSize: 12, color: THEME.text },
});
