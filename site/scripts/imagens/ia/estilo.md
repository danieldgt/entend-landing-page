# Estilo fotográfico da Entend — "white cube"

A régua de toda imagem nova da landing. O manifesto (`manifesto.json`) carrega a versão em
inglês destes pontos (`estilo` e `evitar`) e os junta a cada prompt. Este arquivo é a explicação
para quem vai escrever o próximo.

Referência visual: as fotos de obra da PLATFORM (platformart.com, estudo em
`docs/estudo-platform.md`). A cor da página vem **só** das fotos, então são elas que fazem a
página ter vida. A UI continua em preto, branco e cinza.

## As três âncoras (`../referencias/`)

Estas imagens vão como referência visual em todo pedido ao modelo. Elas seguram a luz, o fundo e
o papel iguais de uma imagem para a outra. Geradas uma vez (grupo `referencia` do manifesto) e
versionadas. Só refaça se a direção mudar.

| arquivo | o que fixa |
|---|---|
| `ref-luz.webp` | o fundo cinza-claro sem emenda (#eee), a luz de janela norte vinda da esquerda e a sombra longa e macia |
| `ref-papel.webp` | o material: papel off-white fosco, grafite, clipe preto, a textura que aparece de perto |
| `ref-sala.webp` | o espaço: sala de galeria branca, piso de cimento claro e luz natural difusa |
| `../fontes/capa-cme.png` | a capa real do livro, que vai em toda cena onde o livro aparece |

## Regras

1. **Objeto como obra.** Cada etapa do livro é um objeto isolado, como peça de acervo: centralizado,
   com muito ar em volta, sem cenário de "estilo de vida".
2. **Luz.** Luz natural de janela norte, de cima à esquerda, sombra longa e suave para a direita.
   Nada de flash, de brilho duro ou de vinheta forte.
3. **Câmera.** Médio formato, 80 mm, f/8, na altura do olho, com cor fiel e grão de filme muito leve.
4. **Paleta.** Branco de papel, cinzas quentes e grafite. A cor de verdade fica para o próprio
   objeto: a capa azul do livro, o lápis vermelho da revisão, as provas de cor da capa.
5. **Sem gente.** Nenhuma mão e nenhum rosto. Nunca gerar o rosto da autora nem de qualquer pessoa
   real.
6. **Sem letra legível.** Texto de manuscrito e de prova é só ritmo de linhas, ilegível. O modelo
   deforma letras, e letra deformada denuncia a imagem gerada. A única letra que pode aparecer é a
   da capa real, e ela tem de sair idêntica à referência.
7. **Dobra.** A foto de ponta a ponta precisa de uma faixa calma no terço de cima, onde entra o
   título branco de 72px, e de uma faixa calma embaixo, onde entra a frase. O objeto fica no
   meio-baixo.
8. **Conferir antes de usar.** Abra cada imagem gerada (a folha de contato do lote ajuda). Capa com
   letra torta, mão a mais ou texto legível é descartada e gerada de novo.

## Como gerar

```bash
python3 scripts/imagens/ia/lote.py --listar            # o que existe e o que falta
python3 scripts/imagens/ia/lote.py                     # gera o que falta (âncoras primeiro)
python3 scripts/imagens/ia/lote.py --so obj-prova      # uma imagem só (gera de novo, mesmo se existir)
python3 scripts/imagens/ia/lote.py --aplicar obj-prova hero-autor   # aprovadas → public/img
```

Os brutos (PNG em 2K) ficam em `brutos/`, fora do git. O lote termina com `brutos/folha.png`, a
folha de contato para conferir. Só `--aplicar` escreve em `public/img/` (em WebP, nas larguras do
manifesto), e só para os ids que você aprovar.

Precisa de `GEMINI_API_KEY` **com faturamento ativo**: no plano gratuito, os modelos de imagem
têm cota zero e respondem 429.

## Imagem nova

Acrescente uma entrada ao `manifesto.json`:

- `id`: nome curto;
- `uso`: onde a imagem entra;
- `prompt`: só o assunto e a composição, porque luz, câmera e paleta já vêm do `estilo`;
- `refs`: as âncoras (`ref-luz`, `ref-papel`, `ref-sala`) mais `capa` quando o livro aparece;
- `variantes`: um ou mais `{saida, proporcao, largura}`.

Proporções que o modelo aceita: 1:1, 2:3, 3:2, 3:4, 4:3, 4:5, 5:4, 9:16, 16:9 e 21:9.
