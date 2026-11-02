// Banter screen: join a room code with your rival and send roasts live.
// Why: watching is more fun when you can roast your friend the moment a wicket falls.

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, Switch, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FONT, THEME } from '../constants/theme';
import { useRoar } from '@/lib/store';
import { QUICK_LINES, SPICES } from '@/lib/ai/captions';
import { useBanter } from '@/lib/ai/live';
import { playSound, playVoice, SOUND_LABEL, SOUND_NAMES, type SoundName } from '@/lib/sounds';
import VoiceRoar from '@/components/VoiceRoar';
import StickerBurst, { STICKER_ONLY } from '@/components/StickerBurst';
import { randomStickers, STICKER_NAMES, STICKERS, type StickerName } from '@/lib/stickers';
import { rivalHere, sendRoast, useRival } from '@/lib/rival/room';
import { TEAM_TEXT } from '@/lib/teams';
import { hasServer, voiceUrl } from '@/lib/api';
import { Button, Label, TabBar } from '@/components/ui';

export default function BanterScreen() {
    const profile = useRoar((s) => s.profile);
    const setProfile = useRoar((s) => s.setProfile);
    const lastMoment = useRoar((s) => s.lastMoment);
    const status = useRival((s) => s.status);
    const members = useRival((s) => s.members);
    const messages = useRival((s) => s.messages);

    // Both friends get the same code from their two names, so nobody has to type or share one.
    const pairCode = makePairCode(profile.name, profile.rival);
    const [code, setCode] = useState(profile.room || pairCode);
    const [draft, setDraft] = useState('');
    const online = rivalHere(members); // your friend is in the room right now
    const inRoom = Boolean(profile.room);
    const connected = inRoom && status === 'online'; // you can send; your friend gets it now or when they join
    const later = connected && !online ? ` · ${profile.rival.toUpperCase()} GETS IT WHEN THEY JOIN` : '';

    // Roast lines for the latest big moment (AI when the server has it), else a few generic ones.
    const banter = useBanter(lastMoment, 'Hinglish', profile);
    const lines = banter ? SPICES.map((s) => `${banter.roasts[s].top} / ${banter.roasts[s].bottom}`) : QUICK_LINES;
    const tag = lastMoment ? `${lastMoment.label} · ${lastMoment.overText}` : '';

    const send = (text: string, sound?: SoundName, stickers?: string[]) => {
        if (text.trim()) sendRoast(text.trim(), tag, { sound, stickers });
    };

    // Stickers: one tap throws one; the storm throws five at once.
    const throwStickers = (names: StickerName[], text = 'STICKER') => {
        if (connected) sendRoast(text, tag || 'STICKER', { stickers: names });
    };

    // Sound board: plays here, and blasts the same sound on your friend's phone if they're in.
    const blast = (name: SoundName) => {
        playSound(name);
        if (connected) sendRoast(SOUND_LABEL[name].toUpperCase(), 'SOUND', { sound: name });
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
                    {!inRoom ? (
                        <Button title={`Quick join ${pairCode}`} icon="zap"
                            onPress={() => {
                                setCode(pairCode);
                                setProfile({ room: pairCode });
                            }}
                        />
                    ) : null}
                    <Text style={styles.small}>
                        {profile.rival}&apos;s phone makes the same code ({pairCode}) when their name and rival are set. Or type any code you both agree on.
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
                    <Label>{lastMoment ? `ROAST ABOUT ${tag}${banter?.byAI ? ' · WRITTEN BY AI' : ''}` : 'QUICK ROASTS'}</Label>
                    {lines.map((line) => (
                        <Pressable
                            key={line}
                            accessibilityRole="button"
                            disabled={!connected}
                            onPress={() => send(line, banter?.sound, banter?.stickers)}
                            style={({ pressed }) => [styles.line, pressed && { borderColor: THEME.roar }, !connected && { opacity: 0.45 }]}
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
                            disabled={!connected || !draft.trim()}
                            onPress={() => {
                                send(draft);
                                setDraft('');
                            }}
                            style={{ height: 46 }}
                        />
                    </View>
                </View>

                {/* Sticker tray */}
                <View style={styles.card}>
                    <Label>
                        {connected
                            ? `STICKERS · THROW THEM AT ${profile.rival.toUpperCase()}${later}`
                            : !hasServer()
                              ? 'STICKERS · OFF: THIS SITE HAS NO ROAR SERVER YET'
                              : 'STICKERS · JOIN A ROOM TO THROW'}
                    </Label>
                    <View style={styles.stickers}>
                        {STICKER_NAMES.map((name) => (
                            <Pressable
                                key={name}
                                accessibilityRole="button"
                                accessibilityLabel={`Send ${name} sticker`}
                                disabled={!connected}
                                onPress={() => throwStickers([name])}
                                style={({ pressed }) => [styles.sticker, pressed && { transform: [{ scale: 0.85 }] }, !connected && { opacity: 0.45 }]}
                            >
                                <Image source={STICKERS[name]} style={{ width: 40, height: 40 }} resizeMode="contain" />
                            </Pressable>
                        ))}
                    </View>
                    <Button
                        title="Sticker storm"
                        icon="zap"
                        kind="outline"
                        disabled={!connected}
                        onPress={() => throwStickers(randomStickers(5), 'STICKER STORM')}
                    />
                </View>

                {/* Sound board */}
                <View style={styles.card}>
                    <Label>{connected ? (online ? `SOUND BLAST · ${profile.rival.toUpperCase()} HEARS IT TOO` : `SOUND BLAST${later}`) : 'SOUND BOARD'}</Label>
                    <VoiceRoar online={connected} tag={tag} rival={profile.rival} />
                    <View style={styles.sounds}>
                        {SOUND_NAMES.map((name) => (
                            <Pressable
                                key={name}
                                accessibilityRole="button"
                                accessibilityLabel={`Play ${SOUND_LABEL[name]}`}
                                onPress={() => blast(name)}
                                style={({ pressed }) => [styles.sound, pressed && { borderColor: THEME.roar, backgroundColor: THEME.raised }]}
                            >
                                <Text style={styles.soundText} numberOfLines={1}>{SOUND_LABEL[name]}</Text>
                            </Pressable>
                        ))}
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
                            {m.voiceId ? (
                                <Pressable
                                    accessibilityRole="button"
                                    accessibilityLabel={`Play voice roast from ${m.mine ? 'you' : m.from}`}
                                    onPress={() => playVoice(voiceUrl(m.voiceId!))}
                                    style={styles.voice}
                                >
                                    <Text style={styles.voiceText}>PLAY VOICE ROAR</Text>
                                </Pressable>
                            ) : STICKER_ONLY.includes(m.text) ? null : (
                                <Text style={styles.msgText}>{m.text}</Text>
                            )}
                            {m.stickers?.length ? <StickerBurst names={m.stickers} size={40} animate={false} /> : null}
                        </View>
                    ))
                )}
            </ScrollView>
            <TabBar />
        </SafeAreaView>
    );
}

// "Lucky" + "Aman" and "Aman" + "Lucky" both give AMANLUCKY: names sorted, letters only, 12 max.
function makePairCode(name: string, rival: string): string {
    const clean = (n: string) => n.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 6);
    return [clean(name), clean(rival)].sort().join('') || 'FINAL19';
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
    sounds: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    stickers: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
    sticker: { width: 52, height: 52, alignItems: 'center', justifyContent: 'center', borderRadius: 12 },
    sound: { minHeight: 44, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: THEME.line, borderRadius: 22, paddingHorizontal: 14 },
    soundText: { fontFamily: FONT.bold, fontSize: 14, color: THEME.text },
    msg: { borderRadius: 14, padding: 12, gap: 4, maxWidth: '88%' },
    msgMine: { alignSelf: 'flex-end', borderWidth: 1, borderColor: '#5A4E14', backgroundColor: '#1F1C10' },
    msgTheirs: { alignSelf: 'flex-start', borderWidth: 1, borderColor: THEME.line, backgroundColor: THEME.surface },
    msgHead: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
    msgFrom: { fontFamily: FONT.black, fontSize: 11, letterSpacing: 1.4 },
    msgTag: { fontFamily: FONT.numBold, fontSize: 13, color: THEME.muted },
    msgText: { fontFamily: FONT.semi, fontSize: 15, lineHeight: 20, color: THEME.text },
    voice: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 14, borderRadius: 12, backgroundColor: THEME.roar },
    voiceText: { fontFamily: FONT.num, fontSize: 16, color: THEME.bg },
});
