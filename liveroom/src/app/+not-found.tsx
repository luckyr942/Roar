// Sends any unknown address to Home.
// Why: the web build may open from a sub-folder link, which the router does not know.

import { Redirect } from 'expo-router';

export default function NotFound() {
    return <Redirect href="/" />;
}
