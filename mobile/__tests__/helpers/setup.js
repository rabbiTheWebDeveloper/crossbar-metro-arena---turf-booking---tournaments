/**
 * Jest setup: stand-ins for the native modules the app uses, so screens can render in Node.
 */
const React = require('react');

jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));

jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);

jest.mock('expo-secure-store', () => ({
    getItemAsync: jest.fn(async () => null),
    setItemAsync: jest.fn(async () => { }),
    deleteItemAsync: jest.fn(async () => { })
}));

jest.mock('expo-splash-screen', () => ({
    preventAutoHideAsync: jest.fn(async () => true),
    hideAsync: jest.fn(async () => { }),
    hide: jest.fn(),
    setOptions: jest.fn()
}));

jest.mock('expo-clipboard', () => ({
    setStringAsync: jest.fn(async () => true),
    getStringAsync: jest.fn(async () => '')
}));

jest.mock('expo-sharing', () => ({
    isAvailableAsync: jest.fn(async () => true),
    shareAsync: jest.fn(async () => { })
}));

jest.mock('expo-file-system', () => {
    class File {
        constructor(...parts) { this.uri = `file:///cache/${parts[parts.length - 1]}`; this.exists = false; }
        create() { this.exists = true; }
        delete() { this.exists = false; }
        write() { }
        textSync() { return ''; }
    }
    return { File, Directory: class Directory { }, Paths: { cache: 'cache', document: 'document' } };
});

jest.mock('react-native-webview', () => {
    const { View } = require('react-native');
    return { WebView: (props) => require('react').createElement(View, { testID: 'webview' }) };
});

jest.mock('expo-image', () => {
    const { View } = require('react-native');
    const Image = ({ style, testID, accessibilityLabel }) => require('react').createElement(View, { style, testID, accessibilityLabel });
    return { Image, ImageBackground: Image };
});

jest.mock('expo-linear-gradient', () => {
    const { View } = require('react-native');
    return { LinearGradient: ({ style, children }) => require('react').createElement(View, { style }, children) };
});

// Native dialogs / external intents: record instead of opening anything.
const { Alert, Linking, Share } = require('react-native');
global.__alerts = [];
jest.spyOn(Alert, 'alert').mockImplementation((title, message, buttons) => {
    global.__alerts.push({ title, message });
    // Behave like a user who backs out: press the cancel button if there is one.
    const cancel = (buttons || []).find(b => b.style === 'cancel');
    if (cancel && cancel.onPress) cancel.onPress();
});
jest.spyOn(Linking, 'openURL').mockImplementation(async () => true);
jest.spyOn(Linking, 'canOpenURL').mockImplementation(async () => true);
jest.spyOn(Share, 'share').mockImplementation(async () => ({ action: 'sharedAction' }));

void React;
