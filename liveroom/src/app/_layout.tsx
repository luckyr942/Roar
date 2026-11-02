// Wraps every screen: loads fonts, sets up navigation, syncs to the database, shows roast banners.
// Why: things every screen needs are set up once here.

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { useFonts } from 'expo-font';
import { Barlow_400Regular, Barlow_600SemiBold, Barlow_700Bold, Barlow_800ExtraBold } from '@expo-google-fonts/barlow';
import { BarlowCondensed_700Bold, BarlowCondensed_800ExtraBold } from '@expo-google-fonts/barlow-condensed';
import { THEME } from '../constants/theme';
import RoastBanner from '@/components/RoastBanner';
import { useSaveToDatabase } from '@/lib/sync';

export default function RootLayout() {
    useSaveToDatabase();
    const [loaded, fontError] = useFonts({
        Barlow_400Regular,
        Barlow_600SemiBold,
        Barlow_700Bold,
        Barlow_800ExtraBold,
        BarlowCondensed_700Bold,
        BarlowCondensed_800ExtraBold,
    });
    if (!loaded && !fontError) return <View style={{ flex: 1, backgroundColor: THEME.bg }} />;

    return (
        <View style={{ flex: 1, backgroundColor: THEME.bg }}>
            <StatusBar style="light" />
            <Stack
                screenOptions={{
                    headerShown: false,
                    contentStyle: { backgroundColor: THEME.bg },
                    animation: 'fade',
                }}
            />
            <RoastBanner />
        </View>
    );
}
