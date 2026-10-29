#!/usr/bin/env python3
"""Gera as imagens da landing a partir da capa real do catálogo.

Não há banco de imagens nem IA aqui: a cena é desenhada por código, para que a única coisa
"fotográfica" na dobra seja o livro de verdade. Mudou a capa? Troque `fontes/capa-cme.png`
e rode de novo.

  python3 scripts/imagens/gerar.py        (precisa de pillow e numpy)

Saídas em public/img/ e public/og/.
"""
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

AQUI = Path(__file__).parent
RAIZ = AQUI.parent.parent
IMG = RAIZ / 'public' / 'img'
OG = RAIZ / 'public' / 'og'
FONTE = RAIZ / 'scripts' / 'imagens' / 'fontes'

rng = np.random.default_rng(7)  # fixa o grão: rodar duas vezes dá o mesmo arquivo


def recortar_capa():
    """Tira o fundo rosado do mockup (255,249,249) por inundação a partir das bordas.

    Inundação, e não chave de cor global: o miolo do livro tem brancos parecidos (lençol da
    ilustração, lombada) que uma chave global furaria.
    """
    im = Image.open(FONTE / 'capa-cme.png').convert('RGB')
    a = np.asarray(im).astype(np.int16)
    perto = (np.abs(a - np.array([255, 249, 249])).sum(axis=2) < 14)
    # A sombra do mockup herda o rosado do fundo (r > g ≈ b); a lombada do livro é cinza neutra
    # (b ≥ r). Sem este critério a sombra vinha junto e o livro flutuava acima do pedestal.
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    rosado = ((r - b) >= 3) & ((r - g) >= 3) & ((a.max(axis=2) - a.min(axis=2)) < 22) & (r > 120)
    perto = perto | rosado
    masc = Image.fromarray((perto * 255).astype(np.uint8))
    # Marca as bordas com um valor sentinela via floodfill numa cópia.
    fundo = masc.copy()
    w, h = fundo.size
    for x, y in [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)]:
        ImageDraw.floodfill(fundo, (x, y), 128, thresh=0)
    fora = np.asarray(fundo) == 128
    alfa = Image.fromarray(np.where(fora, 0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.2))
    rgba = im.copy()
    rgba.putalpha(alfa)
    return rgba.crop(rgba.getbbox())


def grao(arr, forca):
    return arr + rng.normal(0, forca, arr.shape[:2])[..., None]


def sala(w, h, cx, horizonte, escala):
    """Parede escura + piso, com o poço de luz de um foco acima do pedestal."""
    ys, xs = np.mgrid[0:h, 0:w].astype(np.float32)
    parede = 10 + 4 * (ys / h)
    # O halo do foco na parede: elipse alta, cai suave.
    d = np.sqrt(((xs - cx) / (0.30 * w * escala)) ** 2 + ((ys - horizonte * 0.78) / (0.62 * h)) ** 2)
    parede = parede + 74 * np.exp(-d ** 2 * 2.2)
    piso = 7 + 3 * ((ys - horizonte) / h)
    dp = np.sqrt(((xs - cx) / (0.34 * w * escala)) ** 2 + ((ys - horizonte - 0.10 * h) / (0.10 * h)) ** 2)
    piso = piso + 46 * np.exp(-dp ** 2 * 1.6)
    v = np.where(ys < horizonte, parede, piso)
    # Rodapé: uma linha fina mais clara onde parede encontra piso.
    v = v + 10 * np.exp(-((ys - horizonte) / 2.0) ** 2) * np.exp(-((xs - cx) / (0.4 * w)) ** 2)
    rgb = np.stack([v * 1.0, v * 0.985, v * 0.96], axis=2)  # um fio de calor, luz de tungstênio
    return rgb


def pedestal(arr, cx, topo, larg, alt, prof):
    """Cubo branco: tampo claríssimo, face frontal que escurece para baixo, quina à esquerda."""
    h, w = arr.shape[:2]
    x0, x1 = int(cx - larg / 2), int(cx + larg / 2)
    # tampo (trapézio fino, visto de leve por cima)
    for i in range(prof):
        t = i / prof
        xa = int(x0 + (1 - t) * prof * 0.6)
        xb = int(x1 - (1 - t) * prof * 0.6)
        arr[topo + i, xa:xb] = 232 + 10 * t
    # face frontal
    ys = np.arange(topo + prof, min(h, topo + prof + alt))
    t = (ys - topo - prof) / alt
    tons = 205 - 120 * t ** 0.8
    xs = np.arange(x0, x1)
    lateral = 1 - 0.18 * np.clip((xs - x0) / (x1 - x0) - 0.75, 0, 1) / 0.25  # canto direito menos lit
    arr[topo + prof: topo + prof + len(ys), x0:x1] = (tons[:, None] * lateral[None, :])[..., None]
    # sombra de contato no piso
    ys2, xs2 = np.mgrid[0:h, 0:w].astype(np.float32)
    base = topo + prof + alt
    sombra = np.exp(-(((xs2 - cx) / (larg * 0.62)) ** 2 + ((ys2 - base - 6) / 14) ** 2))
    abaixo = ys2 >= base
    arr[abaixo] *= (1 - 0.65 * sombra[abaixo])[..., None]
    return base


def colar(arr, livro, cx, base_y, alt):
    h, w = arr.shape[:2]
    lw = int(livro.width * alt / livro.height)
    lv = livro.resize((lw, alt), Image.LANCZOS)
    x, y = int(cx - lw / 2), int(base_y - alt)
    # sombra do livro no tampo e um leve oclusão atrás
    som = Image.new('L', (w, h), 0)
    ImageDraw.Draw(som).ellipse([x + lw * 0.05, base_y - 10, x + lw * 1.02, base_y + 12], fill=170)
    som = np.asarray(som.filter(ImageFilter.GaussianBlur(10))) / 255
    arr *= (1 - 0.55 * som)[..., None]
    base = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8))
    # luz de cima: o topo da capa recebe mais foco que o pé
    lv_arr = np.asarray(lv).astype(np.float32)
    grad = np.linspace(1.04, 0.80, alt)[:, None, None]
    lv_arr[..., :3] = np.clip(lv_arr[..., :3] * grad, 0, 255)
    lv = Image.fromarray(lv_arr.astype(np.uint8), 'RGBA')
    base.paste(lv, (x, y), lv)
    return np.asarray(base).astype(np.float32)


def vinheta(arr, forca=0.55):
    h, w = arr.shape[:2]
    ys, xs = np.mgrid[0:h, 0:w].astype(np.float32)
    d = np.sqrt(((xs - w / 2) / (w * 0.62)) ** 2 + ((ys - h / 2) / (h * 0.70)) ** 2)
    return arr * (1 - forca * np.clip(d - 0.55, 0, 1))[..., None]


def cena(w, h, cx_frac, livro, escala=1.0, horizonte_frac=0.74, alt_livro_frac=0.50, nome='hero'):
    cx = w * cx_frac
    horizonte = int(h * horizonte_frac)
    arr = sala(w, h, cx, horizonte, escala)
    # desfoque de fundo: lente aberta, só o objeto é nítido
    arr = np.asarray(Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(6))).astype(np.float32)
    larg = int(min(w, h * 1.4) * 0.30 * escala)
    alt_ped = int(h * 0.36)
    topo = horizonte - int(alt_ped * 0.62)
    base_ped = pedestal(arr, cx, topo, larg, alt_ped, prof=int(h * 0.018))
    arr = colar(arr, livro, cx, topo + int(h * 0.012), int(h * alt_livro_frac))
    arr = vinheta(arr)
    arr = grao(arr, 3.2)
    im = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8))
    return im


def estante(w, h):
    """Segunda imagem: lombadas sem título, em cinza, sob luz rasante — para a seção de autores.

    É o livro que ainda não existe: lombadas mudas, à espera de um nome.
    """
    arr = np.full((h, w, 3), 236.0)
    ys, xs = np.mgrid[0:h, 0:w].astype(np.float32)
    arr *= (0.78 + 0.22 * np.exp(-((xs - w * 0.3) / (w * 0.7)) ** 2))[..., None]
    base = int(h * 0.80)
    x = int(w * 0.08)
    r = np.random.default_rng(3)
    while x < w * 0.94:
        lw = int(r.integers(int(w * 0.022), int(w * 0.05)))
        lh = int(r.integers(int(h * 0.42), int(h * 0.66)))
        tom = float(r.choice([18, 30, 60, 205, 222, 240, 120]))
        y0 = base - lh
        bloco = np.full((lh, lw), tom)
        # volume: a lombada é cilíndrica, mais clara no meio
        perfil = 0.82 + 0.22 * np.sin(np.linspace(0, np.pi, lw))
        bloco = bloco * perfil[None, :] + (6 if tom > 150 else 10) * perfil[None, :]
        arr[y0:base, x:x + lw] = bloco[..., None]
        # fio de cabeceado
        arr[y0:y0 + 2, x:x + lw] *= 0.85
        x += lw + int(r.integers(0, 3))
        if r.random() < 0.08:  # um livro inclinado quebra o ritmo
            x += int(w * 0.04)
    # sombra projetada à direita das lombadas (luz vem da esquerda) e a prateleira
    im = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8))
    d = ImageDraw.Draw(im)
    d.rectangle([0, base, w, base + 2], fill=(0, 0, 0))
    a = np.asarray(im).astype(np.float32)
    a[base + 3:] *= 0.93
    a = grao(a, 2.4)
    return Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))


def og(livro):
    """Preview de link 1200×630 — o que aparece no WhatsApp. Mesma promessa da dobra."""
    w, h = 1200, 630
    im = sala_central(w, h)
    palco = livro_no_palco(livro, alt=900)
    escala = 0.62 * h / palco.height
    palco = palco.resize((int(palco.width * escala), int(palco.height * escala)), Image.LANCZOS)
    im.paste(palco, (w - palco.width - 70, h - palco.height - 30), palco)
    d = ImageDraw.Draw(im)
    try:
        f_rot = ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial.ttf', 20)
        f_tit = ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial.ttf', 60)
    except OSError:
        f_rot = f_tit = ImageFont.load_default()
    d.text((64, 64), 'EDITORA ENTEND — PARA AUTORES:', fill=(220, 220, 220), font=f_rot)
    for i, linha in enumerate(['SEU CONHECIMENTO', 'MERECE VIRAR', 'LIVRO.']):
        d.text((64, 300 + i * 70), linha, fill=(255, 255, 255), font=f_tit)
    d.text((64, 552), '→ Quero lançar meu livro', fill=(220, 220, 220), font=f_rot)
    return im


def sala_central(w, h):
    """Fundo da dobra, SEM livro: parede escura, um feixe de luz vertical e o halo no centro.

    Não há linha de piso de propósito: o livro entra por HTML no meio do layout, e um horizonte
    desenhado aqui teria de bater com a base do livro em todo tamanho de tela — não bate.
    A região do título (alto) e a do parágrafo (baixo) ficam escuras para o texto branco.
    """
    ys, xs = np.mgrid[0:h, 0:w].astype(np.float32)
    cx, cy = w / 2, h * 0.56
    v = 9 + 3 * (ys / h)
    # feixe: cone que abre de cima para baixo
    largura = (0.05 + 0.20 * (ys / h)) * w
    feixe = np.exp(-((xs - cx) / largura) ** 2) * (0.35 + 0.65 * (ys / h))
    v = v + 22 * feixe
    halo = np.exp(-(((xs - cx) / (0.22 * w)) ** 2 + ((ys - cy) / (0.26 * h)) ** 2))
    v = v + 46 * halo
    # protege o texto: escurece a faixa do título e a do rodapé da dobra
    v = v * (1 - 0.35 * np.exp(-((ys - h * 0.26) / (0.09 * h)) ** 2))
    v = v * (1 - 0.45 * np.clip((ys - h * 0.80) / (0.20 * h), 0, 1))
    rgb = np.stack([v, v * 0.985, v * 0.96], axis=2)
    im = Image.fromarray(np.clip(rgb, 0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(4))
    a = vinheta(np.asarray(im).astype(np.float32), 0.6)
    a = grao(a, 3.0)
    return Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))


def livro_no_palco(livro, alt=1400):
    """O livro com o próprio chão: poço de luz, sombra de contato e reflexo fraco, tudo em alfa.

    Assim ele pousa em qualquer fundo escuro e em qualquer altura do layout.
    """
    lw = int(livro.width * alt / livro.height)
    lv = livro.resize((lw, alt), Image.LANCZOS)
    a = np.asarray(lv).astype(np.float32)
    a[..., :3] *= np.linspace(1.04, 0.84, alt)[:, None, None]  # foco de cima
    lv = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8), 'RGBA')
    W, chao = int(lw * 2.1), int(alt * 0.20)
    H = alt + chao
    tela = np.zeros((H, W, 4), np.float32)
    ys, xs = np.mgrid[0:H, 0:W].astype(np.float32)
    base = alt - int(alt * 0.012)
    # poço de luz no chão (cinza quente), com alfa que some nas bordas
    # Elipse que termina dentro da tela (sem borda vertical cortada) e entrada suave na base
    # (sem a aresta horizontal que denunciava um retângulo colado).
    poco = np.exp(-(((xs - W / 2) / (W * 0.24)) ** 2 + ((ys - base - chao * 0.15) / (chao * 0.38)) ** 2))
    poco *= np.clip((ys - base + 6) / 18, 0, 1)
    tela[..., :3] = np.array([92, 90, 86])
    tela[..., 3] = 255 * 0.55 * poco
    # sombra de contato logo sob o livro
    som = np.exp(-(((xs - W / 2 - lw * 0.04) / (lw * 0.55)) ** 2 + ((ys - base - 4) / (alt * 0.012)) ** 2))
    cor = tela[..., :3] * (1 - 0.9 * som[..., None])
    tela[..., :3] = cor
    tela[..., 3] = np.maximum(tela[..., 3], 255 * 0.85 * som)
    im = Image.fromarray(np.clip(tela, 0, 255).astype(np.uint8), 'RGBA')
    # reflexo: o livro invertido, bem apagado, no chão polido
    refl = lv.transpose(Image.FLIP_TOP_BOTTOM).crop((0, 0, lw, chao))
    ra = np.asarray(refl).astype(np.float32)
    ra[..., 3] *= np.linspace(0.16, 0, chao)[:, None]
    refl = Image.fromarray(ra.astype(np.uint8), 'RGBA')
    x = (W - lw) // 2
    im.alpha_composite(refl, (x, base))
    im.alpha_composite(lv, (x, base - alt))
    return im.crop(im.getbbox())


def manuscrito(w, h):
    """Folhas soltas sob luz rasante: o ponto de partida de todo livro."""
    r = np.random.default_rng(11)
    fundo = np.full((h, w, 3), 228.0)
    ys, xs = np.mgrid[0:h, 0:w].astype(np.float32)
    fundo *= (0.80 + 0.20 * np.exp(-((xs - w * 0.25) / (w * 0.8)) ** 2))[..., None]
    im = Image.fromarray(np.clip(fundo, 0, 255).astype(np.uint8))
    for i in range(7):
        fw, fh = int(w * 0.34), int(w * 0.34 * 1.414)
        folha = Image.new('RGBA', (fw, fh), (250, 249, 246, 255))
        d = ImageDraw.Draw(folha)
        # linhas de texto: barras finas cinza, parágrafos com recuo
        y = int(fh * 0.10)
        while y < fh * 0.90:
            n = int(r.integers(3, 7))
            for k in range(n):
                fim = fw * (0.88 if k < n - 1 else r.uniform(0.35, 0.8))
                ini = fw * (0.16 if k == 0 else 0.10)
                d.rectangle([ini, y, fim, y + max(2, fh // 260)], fill=(172, 172, 170, 255))
                y += int(fh * 0.026)
            y += int(fh * 0.03)
        folha = folha.rotate(float(r.uniform(-14, 14)), expand=True, resample=Image.BICUBIC)
        # sombra de cada folha (luz rasante da esquerda): deslocada para a direita
        sombra = Image.new('RGBA', folha.size, (0, 0, 0, 0))
        sombra.putalpha(folha.getchannel('A').point(lambda v: int(v * 0.22)))
        sombra = sombra.filter(ImageFilter.GaussianBlur(10))
        px = int(w * 0.12 + i * w * 0.07 + r.uniform(-20, 20))
        py = int(h * 0.04 + r.uniform(-40, 60) + (i % 2) * 30)
        im.paste(sombra, (px + 18, py + 10), sombra)
        im.paste(folha, (px, py), folha)
    a = grao(np.asarray(im).astype(np.float32), 2.2)
    return Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))


def main():
    IMG.mkdir(parents=True, exist_ok=True)
    OG.mkdir(parents=True, exist_ok=True)
    livro = recortar_capa()
    # capa em fundo branco, quadro 3:4 — o card do catálogo
    quadro = Image.new('RGB', (1200, 1600), (255, 255, 255))
    lv = livro.resize((int(livro.width * 1300 / livro.height), 1300), Image.LANCZOS)
    quadro.paste(lv, ((1200 - lv.width) // 2, 150), lv)
    quadro.save(IMG / 'capa-cme-quadro.webp', quality=88)

    sala_central(2560, 1440).save(IMG / 'sala.webp', quality=84)
    sala_central(1080, 1920).save(IMG / 'sala-retrato.webp', quality=84)
    palco = livro_no_palco(livro)
    palco.save(IMG / 'livro-palco.webp', quality=88)
    palco.resize((palco.width // 2, palco.height // 2), Image.LANCZOS).save(IMG / 'livro-palco-800.webp', quality=86)
    manuscrito(1600, 1100).save(IMG / 'manuscrito.webp', quality=86)
    og(livro).save(OG / 'entend.png', optimize=True)
    print('ok:', *sorted(p.name for p in IMG.iterdir()), 'og/entend.png')


main()
