#!/usr/bin/env python3
"""Gera as fotos da landing a partir do manifesto, com o mesmo estilo e as mesmas âncoras.

  python3 scripts/imagens/ia/lote.py --listar               o que existe e o que falta
  python3 scripts/imagens/ia/lote.py                        gera o que falta (âncoras primeiro)
  python3 scripts/imagens/ia/lote.py --so obj-prova ...     gera de novo só esses ids
  python3 scripts/imagens/ia/lote.py --aplicar obj-prova    aprovados → public/img (WebP)

Cada pedido leva: o `estilo` do manifesto + o prompt da imagem + o `evitar`, e as referências
visuais (âncoras de `referencias/` e, quando o livro aparece, a capa real). Os brutos ficam em
`brutos/` (fora do git) e o lote termina com `brutos/folha.png` para conferir. As âncoras são
aplicadas na hora, porque as outras imagens dependem delas. O resto só vai para `public/img`
com `--aplicar`, depois que alguém olhou. Regras do estilo: `estilo.md`.
"""
import argparse, json, subprocess, sys
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

AQUI = Path(__file__).resolve().parent
RAIZ = AQUI.parents[2]  # site/
BRUTOS = AQUI / 'brutos'
GERAR = AQUI.parent / 'gerar-ia.py'
M = json.loads((AQUI / 'manifesto.json').read_text())
IMAGENS = {i['id']: i for i in M['imagens']}


def bruto(img, k):
    return BRUTOS / f"{img['id']}--{k}.png"


def pronto(img):
    return all(bruto(img, k).exists() for k in range(len(img['variantes'])))


def prompt(img):
    return f"{M['estilo']}\n\nSubject: {img['prompt']}\n\n{M['evitar']}"


def gerar(img):
    refs = []
    for r in img['refs']:
        caminho = RAIZ / M['referencias'][r]
        if not caminho.exists():
            return f"{img['id']}: falta a referência {r} ({caminho.relative_to(RAIZ)}) — gere as âncoras antes"
        refs += ['--ref', str(caminho)]
    erros = []
    for k, v in enumerate(img['variantes']):
        r = subprocess.run(
            [sys.executable, str(GERAR), str(bruto(img, k)), prompt(img), '--proporcao', v['proporcao'],
             '--modelo', M['modelo'], *refs],
            capture_output=True, text=True,
        )
        if r.returncode:
            erros.append(f"{img['id']}[{v['proporcao']}]: {(r.stderr or r.stdout).strip()[:300]}")
    return '\n'.join(erros) or f"{img['id']}: ok"


def aplicar(img):
    from PIL import Image

    for k, v in enumerate(img['variantes']):
        b = bruto(img, k)
        if not b.exists():
            print(f"{img['id']}: sem bruto {b.name}")
            continue
        im = Image.open(b).convert('RGB')
        if im.width > v['largura']:
            im = im.resize((v['largura'], round(im.height * v['largura'] / im.width)), Image.LANCZOS)
        destino = RAIZ / v['saida']
        destino.parent.mkdir(parents=True, exist_ok=True)
        im.save(destino, quality=84)
        print(f"-> {v['saida']} {im.size}")


def folha():
    """Folha de contato de tudo o que está em brutos/, com o nome embaixo de cada imagem."""
    try:
        from PIL import Image, ImageDraw
    except ImportError:
        return
    arqs = sorted(BRUTOS.glob('*.png'))
    arqs = [a for a in arqs if a.name != 'folha.png']
    if not arqs:
        return
    L, A = 360, 300
    cols = 4
    f = Image.new('RGB', (cols * L, -(-len(arqs) // cols) * (A + 24)), 'white')
    d = ImageDraw.Draw(f)
    for i, a in enumerate(arqs):
        im = Image.open(a).convert('RGB')
        im.thumbnail((L - 8, A - 8))
        x, y = (i % cols) * L, (i // cols) * (A + 24)
        f.paste(im, (x + (L - im.width) // 2, y + (A - im.height) // 2))
        d.text((x + 6, y + A + 4), a.stem, fill='black')
    f.save(BRUTOS / 'folha.png')
    print('folha de contato:', (BRUTOS / 'folha.png').relative_to(RAIZ))


def main():
    p = argparse.ArgumentParser()
    p.add_argument('--so', nargs='+', metavar='ID')
    p.add_argument('--aplicar', nargs='+', metavar='ID')
    p.add_argument('--listar', action='store_true')
    p.add_argument('--paralelo', type=int, default=3)
    a = p.parse_args()

    for i in (a.so or []) + (a.aplicar or []):
        if i not in IMAGENS:
            sys.exit(f'id desconhecido: {i} (veja --listar)')

    if a.listar:
        for img in M['imagens']:
            no_site = all((RAIZ / v['saida']).exists() for v in img['variantes'])
            print(f"{'bruto' if pronto(img) else '  -  '}  {'no site' if no_site else '   -   '}  {img['id']:16} {img['uso']}")
        return

    if a.aplicar:
        for i in a.aplicar:
            aplicar(IMAGENS[i])
        return

    BRUTOS.mkdir(exist_ok=True)
    pedidas = [IMAGENS[i] for i in a.so] if a.so else [i for i in M['imagens'] if not pronto(i)]
    ancoras = [i for i in pedidas if i.get('grupo') == 'referencia']
    resto = [i for i in pedidas if i.get('grupo') != 'referencia']

    # âncoras uma a uma, na ordem do manifesto (ref-papel e ref-sala usam ref-luz)
    for img in ancoras:
        print(gerar(img))
        if pronto(img):
            aplicar(img)
    with ThreadPoolExecutor(a.paralelo) as ex:
        for r in ex.map(gerar, resto):
            print(r)
    folha()


if __name__ == '__main__':
    main()
