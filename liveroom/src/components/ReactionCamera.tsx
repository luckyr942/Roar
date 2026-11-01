// Front camera that takes one silent photo a second while it is on screen.
// Why: the match screen keeps the last few seconds of your face so a big moment is never missed.

import { useEffect, useRef } from 'react';
import { StyleSheet } from 'react-native';
import { CameraView } from 'expo-camera';

const FRAME_EVERY_MS = 1000;

export default function ReactionCamera({ onFrame }: { onFrame: (uri: string) => void }) {
    const ref = useRef<CameraView>(null);
    const ready = useRef(false);
    const busy = useRef(false);

    useEffect(() => {
        const id = setInterval(async () => {
            if (!ready.current || busy.current || !ref.current) return;
            busy.current = true;
            try {
                const pic = await ref.current.takePictureAsync({ quality: 0.3, shutterSound: false });
                if (pic?.uri) onFrame(pic.uri);
            } catch {
                // camera busy or closing: skip this frame
            } finally {
                busy.current = false;
            }
        }, FRAME_EVERY_MS);
        return () => clearInterval(id);
    }, [onFrame]);

    return (
        <CameraView
            ref={ref}
            style={styles.preview}
            facing="front"
            mirror
            onCameraReady={() => {
                ready.current = true;
            }}
        />
    );
}

const styles = StyleSheet.create({
    preview: { width: 72, height: 96, borderRadius: 12, overflow: 'hidden' },
});
