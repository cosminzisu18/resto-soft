import type { CapacitorConfig } from '@capacitor/cli';
import { config as loadEnv } from 'dotenv';

loadEnv({ path: '.env.local' });
loadEnv();

const config: CapacitorConfig = {
  appId: 'ro.giurom.app',
  appName: 'Giurom RestoSoft',
  webDir: 'public',
  bundledWebRuntime: false,
  ...(process.env.CAP_SERVER_URL
    ? {
        server: {
          url: process.env.CAP_SERVER_URL,
          cleartext: true,
          androidScheme: 'http',
        },
      }
    : {}),
};

export default config;

