---
name: entend-landing
description: Padrão da landing da Editora Entend Educacional (repo danieldgt/entend-landing-page) — identidade "galeria" inspirada em platformart.com, fatos verificados da marca, integração de leitura com o catálogo Drezz (sem sistema novo), regras de copy e como provar a página. Use ao criar, editar, revisar ou publicar qualquer parte da landing, ao gerar imagens dela, ou ao planejar campanhas que apontam para o catálogo.
---

# Landing ENTEND

Skill do projeto. O **método** vem de skills gerais (globais em `~/.claude/skills` ou copiadas para
`.claude/skills` localmente, fora do git) — aqui fica só o que é próprio da ENTEND. Ordem de consulta:

| Precisa de | Skill |
|---|---|
| estrutura, `<head>`, SEO, sem-JS, deploy | `site-de-marca` (+ `foto.py` para capturas) |
| elevar o visual, barra de 10 itens | `uplift-de-front` (workflow em `.claude/workflows/`) |
| direção estética, fugir do template | `frontend-design` |
| revisão de UI/a11y | `web-design-guidelines` |
| busca no Google e em IA | `seo-fundamentals`, `geo-fundamentals` |
| concorrentes, posicionamento | `analise-competitiva` |
| funil, métricas, atribuição | `funil-de-vendas` |

## Posicionamento

**A ENTEND é uma editora para autores**: consultoria em toda a trajetória de criar e lançar um
livro. Conversão principal: conversa editorial (WhatsApp). O catálogo Drezz é a **prova** (livros
lançados) e **parte da oferta** (o livro do autor nasce com vitrine e venda online).
Estratégia vigente: `docs/etapa-1-estrategia.md`.

## A regra de integração

**A landing não é uma loja.** Todo clique de compra de livro vai para
`https://app.drezz.com.br/catalogo/entend` (com UTM). Nada de carrinho, checkout ou cadastro aqui.

A lista de livros é lida **no build** da API pública (sem login):

- `GET https://api.drezz.com.br/catalogo-publico/entend?pagina=0&tamanho=60`
- campos usados: `produtos[].{id,nome,precoCentavos,disponivel,fotoPrincipalUrl}`, `vitrine.retirada`,
  `vitrine.formasDeCompra`
- se a API falhar no build, vale o retrato em `src/conteudo/catalogo-retrato.json` — o build nunca
  quebra por causa do Drezz, e o retrato é atualizado sempre que o build consegue ler a API.

O vocabulário do Drezz é de moda ("peças", cor "Azul", tamanho "U"): **nunca** exponha isso na landing.

## Fatos verificados (out/2026) — e só eles

- Nome: **Editora Entend Educacional** (marca "entend", monograma "ED"). Site entend.com.br.
- Educação em saúde em Fortaleza/CE: cursos, trilhas, mentorias, consultorias, eventos.
- Lema público: "A educação transforma sonhos em sucesso".
- Endereço: R. Osvaldo Cruz, 1660 — Aldeota, Fortaleza/CE. WhatsApp +55 85 99124-9368,
  falecom@entend.com.br, Instagram @entend_br.
- Catálogo: 1 livro — *CME e a Jornada da Segurança do Paciente no Hospital*, Eliana de Goes,
  R$ 80,00. Compra por reserva ou pagamento online; **só retirada** em Fortaleza.

Não confirmado (não afirmar na página): número de autores, tiragens, ISBN, prêmios, prazos de
publicação, preço de pacote editorial. Serviços ao autor são descritos como **processo**, sem
promessa de resultado.

## Identidade: "white cube"

Referência: platformart.com (estudo em `docs/estudo-platform.md`). Tokens em `src/styles/base.css`.

- Branco `#fff`, preto `#000`, cinzas `#ddd/#ccc/#b3b3b3/#808080`. **A cor vem só das capas e das
  fotos.** Nenhuma cor de UI, nenhum gradiente de UI, nenhuma sombra, raio 0 em tudo.
- Uma família: Inter (substituta da MediumLLWeb), pesos 400 e 500. Escala fechada: 12/15/20/48/72.
- Bordas 1px. Faixa de seção: fundo `#ddd`, rótulo 12px/500 maiúsculo à esquerda, frase ao centro,
  link `› …` à direita.
- Ação = link de texto com `→`, sublinhado. Botão preenchido só na dobra, em "Como começar" e no fecho (raio 0). Navegação: caixa branca flutuante centralizada (~470px), não barra cheia. Dobra com texto centralizado em MAIÚSCULAS.
- Rótulos com dois-pontos, como a referência: `LANÇAMENTO:`, `ENTEND:`.
- Movimento (v3, medido na referência): dobra em carrossel (slides trocam a cada 6,5s; o trecho
  cheio da barra anda 0,6s; botão Pausar; parado com `prefers-reduced-motion`); seta que anda 4px
  no hover (0,5s ease-in-out); nav que abre do centro e some ao descer. Três gestos de entrada, com
  a curva `--suave`: `.r` (sobe e aparece), `.linhas` (cada linha sobe de uma máscara) e `.revela`
  (a imagem entra no quadro de baixo para cima). Nada fica escondido sem JS: `carregou` devolve tudo.

Teste anti-clone: a primeira dobra mostra a capa real e a autora real — trocar o logo não funciona.

## Copy

- Uma ação principal com um rótulo só, para o autor → WhatsApp (constante `CTA` em
  `src/conteudo/site.ts`; rótulo definido na Etapa 2).
- Segunda porta: **"Ver catálogo"** → catálogo Drezz com UTM.
- Frases curtas, voz ativa, sem "revolucionário", "incrível", "jornada única".
- Onde falta algo (entrega fora de Fortaleza), a página diz e oferece o WhatsApp.

## Imagens

Duas fontes:

1. **Provisórias, por código**: `scripts/imagens/gerar.py` (Python + Pillow/numpy) desenha as cenas
   a partir da capa real: o livro na mesa (slide 1), o livro no palco escuro (slide 2), a parede com
   os objetos (slide 3) e os objetos do carrossel.
2. **Definitivas, por IA**: `scripts/imagens/ia/`. Regras em `estilo.md`, um prompt por imagem em
   `manifesto.json`, e o lote em `lote.py` (`--listar`, `--so`, `--aplicar`). Todo pedido leva o
   mesmo estilo e as mesmas âncoras de `scripts/imagens/referencias/` (luz, papel, sala) mais a capa
   real, para que as imagens novas saiam da mesma família. A chave é a `GEMINI_API_KEY` de
   `~/git/ENTEND/.env`, e precisa de **faturamento ativo** (no plano gratuito a cota de imagem é
   zero e a API responde 429).

Sempre conferir com Read (o lote gera `brutos/folha.png`) antes de `--aplicar`. Nunca gerar rosto
de pessoa real (a autora) por IA.

## Provar

```bash
cd site && npm run build && npx astro preview --port 4321      # serve em /entend-landing-page/
python3 .claude/skills/site-de-marca/foto.py out.png --url http://localhost:4321/entend-landing-page/ [--largura 390 --altura 844] [--ancora '#trajetoria'] [--sem-js]
python3 .claude/skills/entend-landing/medir.py http://localhost:4321/entend-landing-page/   # estouro + CTA acima da dobra em 10 tamanhos
```

Precisa de `pip install websocket-client pillow numpy`. Julgar a imagem, não o código. Os 10
tamanhos têm de sair `ok` antes de qualquer push — a `main` publica sozinha (GitHub Pages).
