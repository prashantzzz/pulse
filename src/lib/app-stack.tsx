/**
 * Root navigation Stack.
 *
 * Native uses Expo Router's native stack (platform-native screen transitions).
 * The web build resolves `app-stack.web.tsx` instead: the native stack renders
 * web screens with `display: none/flex` and has no push/pop animations there,
 * so web swaps in Expo Router's JavaScript stack, which animates on web.
 */
export { Stack } from 'expo-router';
