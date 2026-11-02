// Banter screen: join a room code with your rival and send roasts live.
// Why: watching is more fun when you can roast your friend the moment a wicket falls.

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FONT, THEME } from '../constants/theme';
import { useRoar } from '@/lib/store';
import { QUICK_LINES, roastLine, SPICES } from '@/lib/ai/captions';
import { rivalHere, sendRoast, useRival } from '@/lib/rival/room';
import { TEAM_TEXT } from '@/lib/teams';
import { hasServer } from '@/lib/api';
import { Button, Label, TabBar } from '@/components/ui';

export default function BanterScreen() {
    const profile = useRoar((s) => s.profile);
    const setProfile = useRoar((s) => s.setProfile);
    const lastMoment = useRoar((s) => s.lastMoment);
    const status = useRival((s) => s.status);
    const members = useRival((s) => s.members);
    const messages = useRival((s) => s.messages);

    const [code, setCode] = useState(profile.room);
    const [draft, setDraft] = useState('');
    const online = rivalHere(members);
    const inRoom = Boolean(profile.room);

    // Roast lines for the latest big moment, else a few generic ones.
    const lines = lastMoment ? SPICES.map((s) => roastLine(lastMoment, profile, s)) : QUICK_LINES;
    const tag = lastMoment ? `${lastMoment.label} · ${lastMoment.overText}` : '';

    const send = (text: string) => {
        if (text.trim()) sendRoast(text.trim(), tag);
    };

    let statusText = 'Not in a room';
    if (inRoom && status === 'connecting') statusText = 'Connecting to the roast server...';
    if (inRoom && status === 'online') statusText = online ? `${profile.rival} is here` : `Waiting for ${profile.rival} to join ${profile.room}`;
    if (!hasServer()) statusText = 'Live banter needs the ROAR server. In this web demo, roasts stay on your phone.';

    return (
        <SafeAreaView style={styles.safe} edges={['top']}>
            <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
                <View style={{ gap: 6 }}>
                    <Label>LIVE BANTER</Label>
                    <Text style={styles.title}>ROAST {profile.rival.toUpperCase()}</Text>
                    <View style={styles.row}>
                        <View style={[styles.dot, { backgroundColor: online ? THEME.mint : status === 'connecting' ? THEME.roar : THEME.dim }]} />
                        <Text style={styles.small}>{statusText}</Text>
                    </View>
                </View>

                {/* Room */}
                <View style={styles.card}>
                    <Label>ROOM CODE</Label>
                    <View style={styles.row}>
                        <TextInput
                            value={code}
                            onChangeText={(t) => setCode(t.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12))}
                            placeholder="e.g. FINAL19"
                            placeholderTextColor={THEME.dim}
                            autoCapitalize="characters"
                            accessibilityLabel="Room code"
                            style={styles.input}
                        />
                        {inRoom ? (
                            <Button title="Leave" kind="outline" onPress={() => setProfile({ room: '' })} style={{ height: 46 }} />
                        ) : (
                            <Button title="Join" onPress={() => code && setProfile({ room: code })} disabled={!code} style={{ height: 46 }} />
                        )}
                    </View>
                    <Text style={styles.small}>
                        Send {profile.rival} this code. You both join it, and roasts appear on each other&apos;s phone instantly.
                    </Text>
                    <View style={styles.switchRow}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.switchTitle}>Auto-roast on big moments</Text>
                            <Text style={styles.small}>When a wicket or six goes your way, ROAR roasts {profile.rival} for you.</Text>
                        </View>
                        <Switch
                            value={profile.autoRoast}
                            onValueChange={(v) => setProfile({ autoRoast: v })}
                            trackColor={{ true: THEME.roar, false: THEME.raised }}
                            thumbColor={THEME.text}
                            accessibilityLabel="Auto-roast on big moments"
                        />
                    </View>
                </View>

                {/* Fire a roast */}
                <View style={styles.card}>
                    <Label>{lastMoment ? `ROAST ABOUT ${tag}` : 'QUICK ROASTS'}</Label>
                    {lines.map((line) => (
                        <Pressable
                            key={line}
                            accessibilityRole="button"
                            disabled={!online}
                            onPress={() => send(line)}
                            style={({ pressed }) => [styles.line, pressed && { borderColor: THEME.roar }, !online && { opacity: 0.45 }]}
                        >
                            <Text style={styles.lineText}>{line}</Text>
                        </Pressable>
                    ))}
                    <View style={styles.row}>
                        <TextInput
                            value={draft}
                            onChangeText={setDraft}
                            placeholder="Write your own"
                            placeholderTextColor={THEME.dim}
                            accessibilityLabel="Write your own roast"
                            style={styles.input}
                            maxLength={280}
                        />
                        <Button
                            title="Send"
                            icon="send"
                            disabled={!online || !draft.trim()}
                            onPress={() => {
                                send(draft);
                                setDraft('');
                            }}
                            style={{ height: 46 }}
                        />
                    </View>
                </View>

                {/* Feed */}
                <Label>THE BANTER</Label>
                {messages.length === 0 ? (
                    <Text style={styles.small}>No roasts yet. The first wicket usually starts it.</Text>
                ) : (
                    messages.map((m) => (
                        <View key={m.id} style={[styles.msg, m.mine ? styles.msgMine : styles.msgTheirs]}>
                            <View style={styles.msgHead}>
                                <Text style={[styles.msgFrom, { color: m.mine ? THEME.roar : TEAM_TEXT[m.team] }]}>{m.mine ? 'YOU' : m.from.toUpperCase()}</Text>
                                {m.tag ? <Text style={styles.msgTag}>{m.tag}</Text> : null}
                            </View>
                            <Text style={styles.msgText}>{m.text}</Text>
                        </View>
                    ))
                )}
            </ScrollView>
            <TabBar />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: THEME.bg },
    page: { padding: 20, paddingTop: 16, gap: 14, paddingBottom: 28 },
    row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    title: { fontFamily: FONT.num, fontSize: 46, lineHeight: 44, color: THEME.text },
    dot: { width: 8, height: 8, borderRadius: 4 },
    small: { fontFamily: FONT.body, fontSize: 12, lineHeight: 17, color: THEME.muted },
    card: { backgroundColor: THEME.surface, borderWidth: 1, borderColor: THEME.line, borderRadius: 16, padding: 14, gap: 10 },
    input: { flex: 1, height: 46, borderRadius: 12, borderWidth: 1, borderColor: THEME.line, backgroundColor: THEME.surfaceCard, color: THEME.text, paddingHorizontal: 12, fontFamily: FONT.semi, fontSize: 15 },
    switchRow: { flexDirection: 'row', alignItems: 'center', gap: 12, borderTopWidth: 1, borderTopColor: THEME.raised, paddingTop: 10 },
    switchTitle: { fontFamily: FONT.bold, fontSize: 14, color: THEME.text },
    line: { borderWidth: 1, borderColor: THEME.line, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 },
    lineText: { fontFamily: FONT.numBold, fontSize: 16, lineHeight: 19, color: THEME.text, textTransform: 'uppercase' },
    msg: { borderRadius: 14, padding: 12, gap: 4, maxWidth: '88%' },
    msgMine: { alignSelf: 'flex-end', borderWidth: 1, borderColor: '#5A4E14', backgroundColor: '#1F1C10' },
    msgTheirs: { alignSelf: 'flex-start', borderWidth: 1, borderColor: THEME.line, backgroundColor: THEME.surface },
    msgHead: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
    msgFrom: { fontFamily: FONT.black, fontSize: 11, letterSpacing: 1.4 },
    msgTag: { fontFamily: FONT.numBold, fontSize: 13, color: THEME.muted },
    msgText: { fontFamily: FONT.semi, fontSize: 15, lineHeight: 20, color: THEME.text },
});
