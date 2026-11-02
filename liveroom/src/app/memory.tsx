// Memory card screen: your photo, the moment and a caption, plus roasts to share or send live.
// Why: the card is what fans share, so it has to look good and be one tap away.

import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { FONT, THEME } from '../constants/theme';
import { useRoar } from '@/lib/store';
import { captionFor, roastLine, roastsFor, LANGS, SPICES, type Lang, type Spice } from '@/lib/ai/captions';
import { ARMY_NAME, LABEL_COLOR, rivalTeam } from '@/lib/teams';
import { rivalHere, sendRoast, useRival } from '@/lib/rival/room';
import { Button, Chip, IconButton, Label, Segmented } from '@/components/ui';

export default function MemoryScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id?: string }>();
    const memory = useRoar((s) => s.memories.find((m) => m.id === id) ?? s.memories[0]);
    const profile = useRoar((s) => s.profile);
    const updateMemory = useRoar((s) => s.updateMemory);
    const rivalOnline = useRival((s) => rivalHere(s.members));

    const [lang, setLang] = useState<Lang>('Hinglish');
    const [spice, setSpice] = useState<Spice>('Spicy');
    const [note, setNote] = useState('');
    const cardRef = useRef<React.ComponentRef<typeof View>>(null);

    if (!memory) {
        return (
            <SafeAreaView style={[styles.safe, styles.emptyWrap]}>
                <Text style={styles.title}>No memories yet</Text>
                <Text style={styles.small}>Start a match. ROAR saves your reaction when it gets tight.</Text>
                <Button title="Start a match" onPress={() => router.replace('/match')} />
            </SafeAreaView>
        );
    }

    const { moment } = memory;
    const roast = roastsFor(moment, profile)[spice];
    const isMI = profile.team === 'MI';
    const bandText = isMI ? '#FFFFFF' : THEME.bg;
    const bandSub = isMI ? '#DCE8FF' : '#3A3000';

    const sendLive = () => {
        const ok = sendRoast(roastLine(moment, profile, spice), `${moment.label} · ${moment.overText}`);
        setNote(ok ? `Sent to ${profile.rival}.` : `Not connected. Join a room on Banter first.`);
    };

    // Turn the card into a PNG and open the share sheet (WhatsApp, Instagram, ...).
    const shareImage = async () => {
        try {
            const uri = await captureRef(cardRef, { format: 'png', quality: 0.9 });
            if (!(await Sharing.isAvailableAsync())) {
                setNote('The share sheet opens on your phone. Try it in Expo Go.');
                return;
            }
            await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: `Send to ${profile.rival}` });
            updateMemory(memory.id, { shared: true });
            setNote('');
        } catch {
            setNote('Could not share this time. Try again.');
        }
    };

    const postToWall = () => {
        updateMemory(memory.id, { posted: true });
        router.push({ pathname: '/wall', params: { id: memory.id } });
    };

    return (
        <SafeAreaView style={styles.safe}>
            <ScrollView contentContainerStyle={styles.page}>
                <View style={styles.topBar}>
                    <IconButton icon="chevron-left" label="Back" onPress={() => router.dismissTo('/')} />
                    <View style={styles.row}>
                        <Feather name="check" size={14} color={THEME.mint} />
                        <Label color={THEME.mint}>MEMORY SAVED</Label>
                    </View>
                    <View style={{ width: 40 }} />
                </View>

                {/* The card. This exact view becomes the shared image. */}
                <View ref={cardRef} collapsable={false} style={styles.card}>
                    <View style={styles.photo}>
                        {memory.frameUri ? (
                            <Image source={{ uri: memory.frameUri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                        ) : (
                            <View style={styles.placeholder}>
                                <Feather name="user" size={48} color="#4A4A55" />
                                <Text style={styles.small}>No photo (camera was off)</Text>
                            </View>
                        )}
                        <View style={styles.photoTL}>
                            <Chip label={`${moment.label} · ${moment.overText}`} color={LABEL_COLOR[moment.label] ?? THEME.roar} />
                        </View>
                        <View style={styles.hype}>
                            <Text style={styles.hypeLabel}>Hype </Text>
                            <Text style={styles.hypeNum}>{memory.hype}</Text>
                        </View>
                    </View>
                    <View style={[styles.band, { backgroundColor: isMI ? THEME.miBand : THEME.csk }]}>
                        <Text style={[styles.bandTitle, { color: bandText }]}>{moment.title.toUpperCase()}</Text>
                        <Text style={[styles.bandSub, { color: bandSub }]}>
                            {moment.detail.split(' · ')[1]}
                            {moment.outcome ? ` · ${moment.outcome}` : ''} · IPL 2019 Final
                        </Text>
                        <Text style={[styles.caption, { color: bandText }]}>{captionFor(moment, lang, profile)}</Text>
                        <View style={[styles.bandFoot, { borderTopColor: isMI ? '#4A80D8' : '#C9A400' }]}>
                            <Text style={[styles.byline, { color: bandText }]}>
                                {profile.name.toUpperCase()} · {ARMY_NAME[profile.team]}
                            </Text>
                            <Text style={[styles.wordmark, { color: isMI ? THEME.roar : THEME.bg }]}>ROAR</Text>
                        </View>
                    </View>
                </View>

                <Segmented options={LANGS} value={lang} onChange={setLang} activeBg={THEME.text} height={38} />

                {/* Roast for your rival */}
                <View style={styles.roastCard}>
                    <View style={styles.rowBetween}>
                        <Label>
                            ROAST FOR {profile.rival.toUpperCase()} · {rivalTeam(profile.team)}
                        </Label>
                    </View>
                    <Segmented options={SPICES} value={spice} onChange={setSpice} activeBg={THEME.drop} />
                    <View style={styles.meme}>
                        <Text style={styles.memeTop}>{roast.top}</Text>
                        <Text style={[styles.memeBottom, { color: isMI ? THEME.csk : THEME.miText }]}>{roast.bottom}</Text>
                    </View>
                    <Button
                        title={rivalOnline ? `Send live to ${profile.rival}` : `${profile.rival} isn't in your room`}
                        icon="send"
                        kind="outline"
                        color={rivalOnline ? THEME.roar : undefined}
                        onPress={sendLive}
                        disabled={!rivalOnline}
                    />
                </View>

                <View style={styles.actions}>
                    <Button title={memory.shared ? 'Shared' : 'Share image'} icon="share" kind="outline" onPress={shareImage} style={{ flex: 1 }} />
                    <Button title={memory.posted ? 'On the wall' : 'Post to wall'} onPress={postToWall} style={{ flex: 1 }} />
                </View>
                {note ? <Text style={[styles.small, { textAlign: 'center' }]}>{note}</Text> : null}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: THEME.bg },
    emptyWrap: { justifyContent: 'center', padding: 20, gap: 14 },
    page: { padding: 20, paddingTop: 10, gap: 14, paddingBottom: 32 },
    row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    title: { fontFamily: FONT.num, fontSize: 32, color: THEME.text },
    small: { fontFamily: FONT.body, fontSize: 12, color: THEME.muted },
    card: { borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: THEME.line, backgroundColor: THEME.surface },
    photo: { height: 250, backgroundColor: THEME.surfaceCard },
    placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
    photoTL: { position: 'absolute', top: 12, left: 12 },
    hype: { position: 'absolute', top: 12, right: 12, flexDirection: 'row', alignItems: 'baseline', backgroundColor: THEME.bg, borderWidth: 1, borderColor: THEME.line, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
    hypeLabel: { fontFamily: FONT.bold, fontSize: 12, color: THEME.text },
    hypeNum: { fontFamily: FONT.num, fontSize: 16, color: THEME.roar },
    band: { padding: 16, paddingBottom: 12, gap: 4 },
    bandTitle: { fontFamily: FONT.num, fontSize: 28, lineHeight: 28 },
    bandSub: { fontFamily: FONT.semi, fontSize: 12 },
    caption: { fontFamily: FONT.semi, fontSize: 15, lineHeight: 20, marginTop: 6 },
    bandFoot: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: 10, borderTopWidth: 1 },
    byline: { fontFamily: FONT.black, fontSize: 11, letterSpacing: 1.4 },
    wordmark: { fontFamily: FONT.num, fontSize: 18, letterSpacing: 1.5 },
    roastCard: { backgroundColor: THEME.surface, borderWidth: 1, borderColor: THEME.line, borderRadius: 16, padding: 14, gap: 12 },
    meme: { backgroundColor: THEME.bg, borderRadius: 12, padding: 14, gap: 6 },
    memeTop: { fontFamily: FONT.num, fontSize: 20, lineHeight: 22, color: THEME.text, textTransform: 'uppercase' },
    memeBottom: { fontFamily: FONT.num, fontSize: 20, lineHeight: 22, textTransform: 'uppercase' },
    actions: { flexDirection: 'row', gap: 10 },
});
