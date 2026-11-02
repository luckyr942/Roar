// One small function for each server call: save fan, save memory, upload photo, load wall, vote.
// Why: the app never touches MongoDB directly; it only calls these.

import { Platform } from 'react-native';
import Constants from 'expo-constants';
import type { Memory, Profile } from './store';
import type { Moment } from './moments/detect';

const SERVER_PORT = 8787;

// Where is the ROAR server?
// 1. Deployed: set EXPO_PUBLIC_SERVER_URL (e.g. https://roar-server.onrender.com) when building.
// 2. Development: the server runs on your laptop, port 8787.
// 3. A public web demo with no server set: none. The app then runs on this device only.
const DEPLOYED_SERVER = process.env.EXPO_PUBLIC_SERVER_URL?.replace(/\/$/, '') ?? '';

function devServerHost(): string | null {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
        const host = window.location.hostname;
        const isLocal = host === 'localhost' || host === '127.0.0.1' || /^(192\.168|10)\./.test(host);
        return isLocal ? host : null;
    }
    return Constants.expoConfig?.hostUri?.split(':')[0] ?? null;
}

function serverBase(): string | null {
    if (DEPLOYED_SERVER) return DEPLOYED_SERVER;
    const host = devServerHost();
    return host ? `http://${host}:${SERVER_PORT}` : null;
}

// False on the public web demo: nothing is synced and live banter is off.
export const hasServer = () => serverBase() !== null;
export const serverUrl = () => serverBase() ?? '';
export const socketUrl = () => serverUrl().replace(/^http/, 'ws');
export const photoUrl = (photoId: string) => `${serverUrl()}/photos/${photoId}`;
export const voiceUrl = (voiceId: string) => `${serverUrl()}/voices/${voiceId}`;

// Small helper: send JSON, get JSON back, throw if the server says no.
async function callServer(path: string, method = 'GET', body?: unknown) {
    if (!hasServer()) throw new Error('No ROAR server on this device');
    const response = await fetch(`${serverUrl()}${path}`, {
        method,
        headers: body ? { 'Content-Type': 'application/json' } : undefined,
        body: body ? JSON.stringify(body) : undefined,
    });
    if (!response.ok) throw new Error(`${method} ${path} failed: ${response.status}`);
    return response.json();
}

// AI-written caption + roasts for a moment (the server holds the AI key, never the app).
export function askAiBanter(
    moment: Moment,
    fan: { name: string; team: string; rival: string },
    lang: string,
): Promise<{ caption: string; roasts: Record<'Mild' | 'Spicy' | 'Savage', { top: string; bottom: string }>; sound?: string; stickers?: string[] }> {
    return callServer('/ai/banter', 'POST', { moment, fan, lang });
}

export function saveFan(fanId: string, profile: Profile, matchesLived: number) {
    return callServer(`/fans/${fanId}`, 'PUT', { ...profile, matchesLived });
}

export function saveMemory(fanId: string, memory: Memory) {
    return callServer(`/memories/${memory.id}`, 'PUT', {
        fanId,
        moment: memory.moment,
        hype: memory.hype,
        photoId: memory.photoId,
        shared: memory.shared,
        posted: memory.posted,
        createdAt: memory.createdAt,
    });
}

// Reads the photo file on the phone and uploads its bytes. Returns the photo's id in MongoDB.
export async function uploadPhoto(localUri: string): Promise<string> {
    if (!hasServer()) throw new Error('No ROAR server on this device');
    const photo = await (await fetch(localUri)).blob();
    const response = await fetch(`${serverUrl()}/photos`, {
        method: 'POST',
        headers: { 'Content-Type': photo.type || 'image/jpeg' },
        body: photo,
    });
    if (!response.ok) throw new Error(`Photo upload failed: ${response.status}`);
    const result = await response.json();
    return result.photoId;
}

// Upload a recorded voice roast; the friend's phone streams it back by id.
export async function uploadVoice(localUri: string): Promise<string> {
    if (!hasServer()) throw new Error('No ROAR server on this device');
    const clip = await (await fetch(localUri)).blob();
    const response = await fetch(`${serverUrl()}/voices`, {
        method: 'POST',
        headers: { 'Content-Type': clip.type || 'audio/mp4' },
        body: clip,
    });
    if (!response.ok) throw new Error(`Voice upload failed: ${response.status}`);
    const result = await response.json();
    return result.voiceId;
}

export type WallPost = {
    memoryId: string;
    fanId: string;
    name: string;
    moment: Moment;
    hype: number;
    photoId: string | null;
    votes: number;
    votedByMe: boolean;
    isMine: boolean;
};

export function loadWall(fanId: string): Promise<WallPost[]> {
    return callServer(`/wall?fanId=${encodeURIComponent(fanId)}`);
}

export function voteOnWall(memoryId: string, fanId: string): Promise<{ votes: number; votedByMe: boolean }> {
    return callServer(`/wall/${memoryId}/vote`, 'POST', { fanId });
}
