# Editora Entend — landing para autores

Landing da **Editora Entend Educacional**: leva autores à conversa editorial (WhatsApp) e leitores ao
catálogo da Entend no Drezz (`app.drezz.com.br/catalogo/entend`). Não é loja: a vitrine é lida da
API pública do catálogo no build.

- **No ar:** https://danieldgt.github.io/entend-landing-page/
- **Padrão do projeto e skills:** [`.claude/skills/entend-landing/SKILL.md`](.claude/skills/entend-landing/SKILL.md)

## Rodar

```bash
cd site
npm ci
npm run dev        # http://localhost:4321/entend-landing-page/
npm run build      # gera site/dist
```

## Publicar

Push na `main` publica no GitHub Pages (`.github/workflows/deploy.yml`). O workflow também roda
todo dia para a vitrine acompanhar o catálogo.

Variáveis do repositório (Settings → Secrets and variables → Actions → Variables), todas opcionais:

| Variável | Para quê |
|---|---|
| `PUBLIC_GA4_ID` | ativa o Google Analytics 4 (só depois do consentimento) |
| `PUBLIC_META_PIXEL_ID` | ativa o Meta Pixel (só depois do consentimento) |
| `SITE_URL` + `SITE_BASE` | domínio próprio, ex.: `https://autores.entend.com.br` e `/` |

## Imagens

Geradas por código a partir da capa real (`site/scripts/imagens/gerar.py`, precisa de `pillow` e
`numpy`). Mudou a capa? Troque `site/scripts/imagens/fontes/capa-cme.png` e rode o script.
