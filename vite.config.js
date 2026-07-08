import { defineConfig } from 'vite';
import { readFileSync } from 'node:fs';

const packageJson = JSON.parse(
  readFileSync(new URL('./package.json', import.meta.url), 'utf8'),
);

function normalizeBase(value) {
  if (!value) {
    return '/';
  }
  if (value === '.' || value === './') {
    return './';
  }

  const withLeadingSlash = value.startsWith('/') ? value : `/${value}`;
  return withLeadingSlash.endsWith('/') ? withLeadingSlash : `${withLeadingSlash}/`;
}

export default defineConfig(({ mode }) => ({
  base: normalizeBase(process.env.VITE_BASE_PATH),
  define: {
    __APP_VERSION__: JSON.stringify(packageJson.version),
    __BUILD_MODE__: JSON.stringify(mode),
  },
  build: {
    target: 'es2022',
    sourcemap: mode !== 'production',
    assetsInlineLimit: 4096,
    chunkSizeWarningLimit: 1500,
  },
  server: {
    host: true,
  },
}));
