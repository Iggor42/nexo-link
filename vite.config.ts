import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import { defineConfig, Plugin } from 'vite';

function dynamicMetaPlugin(): Plugin {
  function getPersonalData(slug: string) {
    try {
      const jsonPath = path.resolve(process.cwd(), 'public', 'personals', `${slug}.json`);
      if (!fs.existsSync(jsonPath)) return null;
      const raw = fs.readFileSync(jsonPath, 'utf-8');
      const clean = raw.replace(/^\s*\/\/.*$/gm, '');
      return JSON.parse(clean);
    } catch {
      return null;
    }
  }

  function injectMeta(html: string, data: any, origin = '') {
    const title = [data.name, data.profession || data.tagline].filter(Boolean).join(' · ');
    const description =
      data.tagline ||
      data.profession ||
      'Link de bio conversível com jornada guiada e contato qualificado via WhatsApp.';
    const photo = data.photo || '';
    const fullPhotoUrl = photo ? (photo.startsWith('http') ? photo : `${origin}${photo}`) : '';

    let updated = html;

    // Substituir <title>
    updated = updated.replace(/<title>[\s\S]*?<\/title>/i, `<title>${title}</title>`);

    // Helper para substituir ou inserir meta tags
    const setMeta = (attrName: 'name' | 'property', attrValue: string, content: string) => {
      const escaped = content.replace(/"/g, '&quot;');
      const regex = new RegExp(`<meta\\s+[^>]*${attrName}=["']${attrValue}["'][^>]*>`, 'i');
      const newTag = `<meta ${attrName}="${attrValue}" content="${escaped}" />`;
      if (regex.test(updated)) {
        updated = updated.replace(regex, newTag);
      } else {
        updated = updated.replace('</head>', `  ${newTag}\n  </head>`);
      }
    };

    setMeta('name', 'description', description);
    setMeta('property', 'og:title', title);
    setMeta('property', 'og:description', description);
    setMeta('name', 'twitter:title', title);
    setMeta('name', 'twitter:description', description);

    if (fullPhotoUrl) {
      setMeta('property', 'og:image', fullPhotoUrl);
      setMeta('name', 'twitter:image', fullPhotoUrl);
    }

    return updated;
  }

  return {
    name: 'vite-plugin-dynamic-meta',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url || '';
        const cleanUrl = url.split('?')[0];

        // Ignorar requisições de assets, api e internas do Vite
        if (
          cleanUrl.includes('.') ||
          cleanUrl.startsWith('/@') ||
          cleanUrl.startsWith('/api') ||
          cleanUrl.startsWith('/src') ||
          cleanUrl.startsWith('/node_modules')
        ) {
          return next();
        }

        const match = cleanUrl.match(/^\/(?:p\/)?([a-zA-Z0-9_-]+)$/);
        if (!match) return next();

        const slug = match[1];
        const data = getPersonalData(slug);
        if (!data) return next();

        const indexPath = path.resolve(process.cwd(), 'index.html');
        if (!fs.existsSync(indexPath)) return next();

        const rawIndexHtml = fs.readFileSync(indexPath, 'utf-8');
        const host = req.headers.host || 'localhost:3000';
        const proto = (req.headers['x-forwarded-proto'] as string) || 'https';
        const origin = `${proto}://${host}`;

        server
          .transformIndexHtml(url, rawIndexHtml, req.originalUrl)
          .then((viteTransformed) => {
            const finalHtml = injectMeta(viteTransformed, data, origin);
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            res.end(finalHtml);
          })
          .catch(() => next());
      });
    },
    transformIndexHtml(html, ctx) {
      const url = ctx.originalUrl || ctx.path || '';
      const cleanUrl = url.split('?')[0];
      const match = cleanUrl.match(/(?:^\/p\/|^\/)([a-zA-Z0-9_-]+)$/);
      if (match) {
        const slug = match[1];
        const data = getPersonalData(slug);
        if (data) {
          const host = (ctx as any).req?.headers?.host || '';
          const origin = host ? `https://${host}` : '';
          return injectMeta(html, data, origin);
        }
      }
      return html;
    },
    closeBundle() {
      try {
        const distDir = path.resolve(process.cwd(), 'dist');
        const indexHtmlPath = path.join(distDir, 'index.html');
        if (!fs.existsSync(indexHtmlPath)) return;
        const baseHtml = fs.readFileSync(indexHtmlPath, 'utf-8');
        const personalsDir = path.resolve(process.cwd(), 'public', 'personals');
        if (!fs.existsSync(personalsDir)) return;
        const files = fs.readdirSync(personalsDir).filter((f) => f.endsWith('.json'));

        for (const file of files) {
          const slug = file.replace('.json', '');
          const data = getPersonalData(slug);
          if (!data) continue;

          const transformed = injectMeta(baseHtml, data);

          // 1. dist/p/:slug/index.html
          const pDir = path.join(distDir, 'p', slug);
          fs.mkdirSync(pDir, { recursive: true });
          fs.writeFileSync(path.join(pDir, 'index.html'), transformed, 'utf-8');

          // 2. dist/:slug/index.html
          const directDir = path.join(distDir, slug);
          fs.mkdirSync(directDir, { recursive: true });
          fs.writeFileSync(path.join(directDir, 'index.html'), transformed, 'utf-8');
        }
      } catch (err) {
        console.error('[vite-plugin-dynamic-meta] Error generating static personals HTML:', err);
      }
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), dynamicMetaPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify - file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
