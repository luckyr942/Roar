// Home screen: pick your army, see your stats and memories, start the match.
// Why: it sets who you are before the first ball, so every moment is personal.

import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { FONT, THEME } from '../constants/theme';
import { useRoar } from '@/lib/store';
import type { Team } from '@/lib/match/types';
import { ARMY_NAME, LABEL_COLOR, TEAM_COLOR, TEAM_FULL } from '@/lib/teams';
import { Button, Chip, Label, Segmented, TabBar } from '@/components/ui';

const TEAMS: Team[] = ['MI', 'CSK'];

export default function HomeScreen() {
    const router = useRouter();
    const profile = useRoar((s) => s.profile);
    const setProfile = useRoar((s) => s.setProfile);
    const countMatch = useRoar((s) => s.countMatch);
    const memories = useRoar((s) => s.memories);
    const matchesLived = useRoar((s) => s.matchesLived);
    const team = profile.team;
    const onWall = memories.filter((m) => m.posted).length;
    const armyTitle = team === 'MI' ? 'MI Paltan' : 'CSK Army';

    const startMatch = (jump: boolean) => {
        countMatch();
        router.push({ pathname: '/match', params: jump ? { jump: 'lastover' } : {} });
    };

    return (
        <SafeAreaView style={styles.safe} edges={['top']}>
            <ScrollView contentContainerStyle={styles.page}>
                <View style={styles.header}>
                    <Text style={styles.logo}>ROAR</Text>
                    <Pressable accessibilityRole="button" accessibilityLabel="Open profile" onPress={() => router.navigate('/me')} style={styles.avatarRow}>
                        <Text style={styles.level}>Lv {1 + memories.length}</Text>
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>{profile.name.charAt(0).toUpperCase() || 'F'}</Text>
                        </View>
                    </Pressable>
                </View>

                {/* Your army */}
                <View style={styles.army}>
                    <View style={styles.armyTop}>
                        <View style={{ flex: 1 }}>
                            <Label>YOUR ARMY · {profile.name.toUpperCase()}</Label>
                            <Text style={[styles.armyName, { color: TEAM_COLOR[team] }]}>{ARMY_NAME[team]}</Text>
                        </View>
                        <View style={{ width: 110 }}>
                            <Segmented options={TEAMS} value={team} onChange={(t) => setProfile({ team: t })} activeBg={TEAM_COLOR[team]} />
                        </View>
                    </View>
                    <View style={styles.stats}>
                        <Stat value={matchesLived} label="matches lived" />
                        <Stat value={memories.length} label="memories" divider />
                        <Stat value={onWall} label="on the wall" divider />
                    </View>
                </View>

                {/* The match */}
                <View style={styles.matchCard}>
                    <View style={styles.rowBetween}>
                        <Label>IPL 2019 · FINAL</Label>
                        <View style={styles.spoiler}>
                            <Text style={styles.spoilerText}>REPLAY · SPOILER-FREE</Text>
                        </View>
                    </View>
                    <View style={styles.vs}>
                        <View>
                            <Text style={[styles.teamBig, { color: THEME.mi }]}>MI</Text>
                            <Text style={styles.teamFull}>{TEAM_FULL.MI}</Text>
                        </View>
                        <Text style={styles.vsText}>VS</Text>
                        <View style={{ alignItems: 'flex-end' }}>
                            <Text style={[styles.teamBig, { color: THEME.csk }]}>CSK</Text>
                            <Text style={styles.teamFull}>{TEAM_FULL.CSK}</Text>
                        </View>
                    </View>
                    <View style={styles.venue}>
                        <Feather name="map-pin" size={13} color={THEME.muted} />
                        <Text style={styles.venueText}>12 May 2019 · Rajiv Gandhi Intl. Stadium, Hyderabad</Text>
                    </View>
                    <Text style={styles.blurb}>
                        Prop your phone up next to the TV. When the chase gets tight, ROAR arms the front camera and catches your real
                        reaction.
                    </Text>
                    <Button title={`Start match as ${armyTitle}`} icon="arrow-right" onPress={() => startMatch(false)} />
                    <Pressable accessibilityRole="button" onPress={() => startMatch(true)} style={styles.jump}>
                        <Text style={styles.jumpText}>Jump to the last over</Text>
                    </Pressable>
                </View>

                {/* Moments you lived */}
                <View style={styles.rowBetween}>
                    <Text style={styles.h2}>Moments you lived</Text>
                    <Pressable accessibilityRole="button" onPress={() => router.navigate('/me')}>
                        <Text style={styles.seeAll}>See all</Text>
                    </Pressable>
                </View>
                {memories.length === 0 ? (
                    <Text style={styles.empty}>Nothing yet. Start the match and live the last over: your first scream lands here.</Text>
                ) : (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
                        {memories.slice(0, 10).map((m) => (
                            <Pressable
                                key={m.id}
                                accessibilityRole="button"
                                onPress={() => router.push({ pathname: '/memory', params: { id: m.id } })}
                                style={styles.momentCard}
                            >
                                <View style={styles.rowBetween}>
                                    <Chip label={m.moment.label} color={LABEL_COLOR[m.moment.label] ?? THEME.roar} />
                                    <Text style={styles.over}>{m.moment.overText}</Text>
                                </View>
                                <Text style={styles.momentTitle} numberOfLines={2}>
                                    {m.moment.title}
                                </Text>
                                <Text style={styles.momentMeta}>
                                    Hype {m.hype} · {m.moment.outcome ?? m.moment.detail.split(' · ')[1]}
                                </Text>
                            </Pressable>
                        ))}
                    </ScrollView>
                )}
            </ScrollView>
            <TabBar />
        </SafeAreaView>
    );
}

function Stat({ value, label, divider }: { value: number; label: string; divider?: boolean }) {
    return (
        <View style={[styles.stat, divider && styles.statDivider]}>
            <Text style={styles.statValue}>{value}</Text>
            <Text style={styles.statLabel}>{label}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: THEME.bg },
    page: { padding: 20, paddingTop: 16, gap: 20, paddingBottom: 28 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    logo: { fontFamily: FONT.num, fontSize: 32, letterSpacing: 2, color: THEME.roar },
    avatarRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    level: { fontFamily: FONT.semi, fontSize: 12, color: THEME.muted },
    avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: THEME.raised, borderWidth: 1, borderColor: THEME.line, alignItems: 'center', justifyContent: 'center' },
    avatarText: { fontFamily: FONT.bold, fontSize: 14, color: THEME.text },
    army: { gap: 14 },
    armyTop: { flexDirection: 'row', alignItems: 'flex-end', gap: 12 },
    armyName: { fontFamily: FONT.num, fontSize: 52, lineHeight: 52, marginTop: 6 },
    stats: { flexDirection: 'row', borderTopWidth: 1, borderBottomWidth: 1, borderColor: THEME.line },
    stat: { flex: 1, paddingVertical: 12 },
    statDivider: { borderLeftWidth: 1, borderLeftColor: THEME.line, paddingLeft: 14 },
    statValue: { fontFamily: FONT.numBold, fontSize: 30, lineHeight: 32, color: THEME.text },
    statLabel: { fontFamily: FONT.body, fontSize: 12, color: THEME.muted, marginTop: 2 },
    matchCard: { backgroundColor: THEME.surface, borderWidth: 1, borderColor: THEME.line, borderRadius: 18, padding: 18, gap: 16 },
    rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    spoiler: { borderWidth: 1, borderColor: THEME.dropLine, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 4 },
    spoilerText: { fontFamily: FONT.black, fontSize: 10, letterSpacing: 1.2, color: THEME.dropText },
    vs: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    teamBig: { fontFamily: FONT.num, fontSize: 46, lineHeight: 46 },
    teamFull: { fontFamily: FONT.body, fontSize: 12, color: THEME.muted, marginTop: 4 },
    vsText: { fontFamily: FONT.bold, fontSize: 12, color: THEME.dim },
    venue: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    venueText: { fontFamily: FONT.body, fontSize: 12, color: THEME.muted, flex: 1 },
    blurb: { fontFamily: FONT.body, fontSize: 14, lineHeight: 20, color: '#D4D4DA' },
    jump: { alignSelf: 'center', paddingVertical: 4, paddingHorizontal: 8 },
    jumpText: { fontFamily: FONT.semi, fontSize: 13, color: THEME.roar },
    h2: { fontFamily: FONT.bold, fontSize: 17, color: THEME.text },
    seeAll: { fontFamily: FONT.semi, fontSize: 13, color: THEME.muted },
    empty: { fontFamily: FONT.body, fontSize: 13, lineHeight: 19, color: THEME.muted },
    momentCard: { width: 172, backgroundColor: THEME.surface, borderWidth: 1, borderColor: THEME.line, borderRadius: 14, padding: 12, gap: 8 },
    over: { fontFamily: FONT.numBold, fontSize: 18, color: THEME.muted },
    momentTitle: { fontFamily: FONT.bold, fontSize: 14, lineHeight: 18, color: THEME.text },
    momentMeta: { fontFamily: FONT.body, fontSize: 12, color: THEME.muted },
});
