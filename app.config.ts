import type { ConfigContext, ExpoConfig } from 'expo/config';

/**
 * app.json plus what a build needs from the environment. The Expo project id (from `eas init`, or `EAS_PROJECT_ID`)
 * is required for push: without it `getExpoPushTokenAsync` cannot issue this installation a token.
 */
export default ({ config }: ConfigContext): ExpoConfig => ({
  ...(config as ExpoConfig),
  extra: {
    ...config.extra,
    eas: { ...config.extra?.eas, projectId: process.env.EAS_PROJECT_ID || config.extra?.eas?.projectId },
  },
});
