import type { ExpoConfig } from "expo/config";

const config: ExpoConfig = {
  name: "Velora",
  slug: "velora-mobile",
  version: "1.0.0",
  orientation: "portrait",
  scheme: "velora",
  userInterfaceStyle: "automatic",
  ios: { supportsTablet: true, bundleIdentifier: "space.manus.velora.mobile" },
  android: { package: "space.manus.velora.mobile", edgeToEdgeEnabled: true },
  web: { bundler: "metro", output: "static" },
  extra: { veloraWebUrl: process.env.EXPO_PUBLIC_VELORA_WEB_URL ?? "" },
};

export default config;
