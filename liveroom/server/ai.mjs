// Asks Gemini (free tier) to write the caption and three roast levels for a live match moment.
// Why: real AI writes the banter from the real situation; if it fails, the app keeps its templates.

import { readFileSync } from 'node:fs';

// Free-tier models are often "busy", so we try them in order until one answers.
// Set ROAR_GEMINI_MODELS (comma-separated) on Render if Google retires one of these.
const MODELS = (process.env.ROAR_GEMINI_MODELS ?? 'gemini-3.5-flash,gemini-flash-lite-latest,gemini-3.8-flash').split(',');
const TIMEOUT_MS = 7000;

// ROAR's own name, so a GEMINI_API_KEY set for other tools on the computer can't override it.
const KEY = () => process.env.ROAR_GEMINI_KEY;
export const aiReady = () => Boolean(KEY());

// The meme sounds the app has, with what each one means (shared with the app).
const SOUND_INFO = JSON.parse(readFileSync(new URL('../src/data/sounds.json', import.meta.url), 'utf8'));
const SOUNDS = Object.keys(SOUND_INFO);
const SOUND_LIST = SOUNDS.map((name) => `  ${name}: ${SOUND_INFO[name].mood}`).join('\n');
const STICKER_INFO = JSON.parse(readFileSync(new URL('../src/data/stickers.json', import.meta.url), 'utf8'));
const STICKERS = Object.keys(STICKER_INFO);
const STICKER_LIST = STICKERS.map((name) => `  ${name}: ${STICKER_INFO[name]}`).join('\n');

// The rules every answer must follow. Facts only come from the moment we send.
const RULES = `You write live cricket banter for ROAR, an app where two friends who support rival IPL teams watch a match together on their phones.
Write in the language asked for: Hinglish, English, or Marathi (Devanagari).
Hinglish means mostly Hindi words typed in English letters, the way Indian fans text each other, for example "Bhai Watson gaya, ab trophy Mumbai ki" or "CSK walon ka WiFi bhi chala gaya". Never answer plain English when Hinglish is asked.
Rules:
- Use only the facts given (score, over, players, what just happened). Never invent numbers or events.
- Roast the team and the match situation, never anyone's looks, body, religion, caste, family or gender.
- caption: one line, max 14 words, about how the fan feels right now.
- roasts: Mild, Spicy and Savage, each a meme with a short top line and a punchline bottom line, max 7 words each, no emoji, no hashtags.
- If the moment went well for the fan, roast the rival. If it hurt the fan, make the fan laugh at themselves.
- sound: pick the one meme sound (by name) whose mood fits best:
${SOUND_LIST}
- stickers: pick 2 or 3 sticker names (from this list only) that make the roast funnier:
${STICKER_LIST}`;


// What Gemini must return: the same shape the template captions already use.
const LINE = { type: 'OBJECT', properties: { top: { type: 'STRING' }, bottom: { type: 'STRING' } }, required: ['top', 'bottom'] };
const ANSWER = {
    type: 'OBJECT',
    properties: {
        caption: { type: 'STRING' },
        roasts: {
            type: 'OBJECT',
            properties: { Mild: LINE, Spicy: LINE, Savage: LINE },
            required: ['Mild', 'Spicy', 'Savage'],
        },
        sound: { type: 'STRING', format: 'enum', enum: SOUNDS },
        stickers: { type: 'ARRAY', items: { type: 'STRING', format: 'enum', enum: STICKERS } },
    },
    required: ['caption', 'roasts', 'sound', 'stickers'],
};

// Same moment + same fan + same language = same answer, so the free quota lasts longer.
const answers = new Map();

export async function writeBanter({ moment, fan, lang }) {
    const key = [moment.id, fan.team, fan.rival, lang].join('|');
    if (answers.has(key)) return answers.get(key);

    const situation = {
        language: lang,
        fan: { name: fan.name, supports: fan.team, friend: fan.rival, friendSupports: fan.team === 'MI' ? 'CSK' : 'MI' },
        match: 'IPL 2019 Final, Mumbai Indians (MI) vs Chennai Super Kings (CSK), Hyderabad',
        moment: {
            what: moment.title,
            headline: moment.headline,
            detail: moment.detail,
            over: moment.overText,
            goodFor: moment.team,
            wentWellForFan: moment.team === fan.team,
        },
    };

    const problems = [];
    for (const model of MODELS) {
        try {
            const answer = await askGemini(model.trim(), situation);
            console.log(`AI banter by ${model} for ${moment.title}`);
            answers.set(key, answer);
            return answer;
        } catch (error) {
            problems.push(`${model}: ${error.message}`);
        }
    }
    throw new Error(problems.join(' | '));
}

async function askGemini(model, situation) {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-goog-api-key': KEY() },
        signal: AbortSignal.timeout(TIMEOUT_MS),
        body: JSON.stringify({
            systemInstruction: { parts: [{ text: RULES }] },
            contents: [{ role: 'user', parts: [{ text: JSON.stringify(situation) }] }],
            generationConfig: { responseMimeType: 'application/json', responseSchema: ANSWER, temperature: 1 },
        }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(`${response.status} ${data.error?.message?.slice(0, 80) ?? ''}`);

    const answer = JSON.parse(data.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}');
    if (!answer.caption || !answer.roasts?.Savage) throw new Error('incomplete answer');
    return answer;
}
