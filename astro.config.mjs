import { defineConfig } from 'astro/config';

const base = process.env.SITE_BASE || '/';
const site = process.env.SITE_URL || undefined;

export default defineConfig({
  site,
  base,
  output: 'static',
  trailingSlash: 'ignore',
  build: { format: 'directory', assets: '_assets' },
  image: { responsiveStyles: false },
  devToolbar: { enabled: false },
});
