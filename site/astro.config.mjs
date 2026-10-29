// @ts-check
import { defineConfig } from 'astro/config'
import sitemap from '@astrojs/sitemap'

/**
 * Landing da Editora Entend Educacional.
 *
 * `site` + `base` não são decoração: deles saem a URL canônica e a `og:image` ABSOLUTAS que o
 * WhatsApp e o Google exigem. Hoje a página mora no GitHub Pages, numa subpasta; quando entrar o
 * domínio próprio, troque as duas variáveis no workflow (ou aqui) — o código usa `BASE_URL` em
 * todo caminho e não precisa mudar.
 */
export default defineConfig({
  site: process.env.SITE_URL ?? 'https://danieldgt.github.io',
  base: process.env.SITE_BASE ?? '/entend-landing-page',
  trailingSlash: 'always',
  build: { format: 'directory' },
  integrations: [sitemap()],
})
