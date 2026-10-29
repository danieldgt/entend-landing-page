#!/usr/bin/env python3
"""Gera uma foto com o Nano Banana (Gemini) — opcionalmente a partir de imagens de referência.

  python3 scripts/imagens/gerar-ia.py saida.png "prompt" [--ref capa.png ...] [--proporcao 16:9]
                                      [--tamanho 2K] [--modelo gemini-3-pro-image]

A chave vem de GEMINI_API_KEY (ou do arquivo ~/git/ENTEND/.env). Nunca é impressa.
Sempre olhe o resultado antes de usar: o modelo pode deformar letras da capa de referência.
"""
import argparse, base64, json, mimetypes, os, pathlib, sys, urllib.error, urllib.request


def chave():
    if os.environ.get('GEMINI_API_KEY'):
        return os.environ['GEMINI_API_KEY']
    env = pathlib.Path(__file__).resolve().parents[3] / '.env'
    for linha in env.read_text().splitlines() if env.exists() else []:
        if linha.startswith('GEMINI_API_KEY='):
            return linha.split('=', 1)[1].strip().strip("'\"")
    sys.exit('GEMINI_API_KEY não encontrada (variável de ambiente ou .env na raiz do projeto)')


def main():
    p = argparse.ArgumentParser()
    p.add_argument('saida')
    p.add_argument('prompt')
    p.add_argument('--ref', action='append', default=[])
    p.add_argument('--proporcao', default='16:9')
    p.add_argument('--tamanho', default='2K')
    p.add_argument('--modelo', default='gemini-3-pro-image')
    a = p.parse_args()

    partes = [{'text': a.prompt}]
    for r in a.ref:
        mime = mimetypes.guess_type(r)[0] or 'image/png'
        partes.append({'inline_data': {'mime_type': mime, 'data': base64.b64encode(open(r, 'rb').read()).decode()}})
    corpo = {
        'contents': [{'parts': partes}],
        'generationConfig': {
            'responseModalities': ['IMAGE'],
            'imageConfig': {'aspectRatio': a.proporcao, 'imageSize': a.tamanho},
        },
    }
    req = urllib.request.Request(
        f'https://generativelanguage.googleapis.com/v1beta/models/{a.modelo}:generateContent',
        data=json.dumps(corpo).encode(),
        headers={'Content-Type': 'application/json', 'x-goog-api-key': chave()},
    )
    try:
        with urllib.request.urlopen(req, timeout=240) as r:
            d = json.load(r)
    except urllib.error.HTTPError as e:
        sys.exit(f'HTTP {e.code}: {e.read().decode()[:600]}')
    for c in d.get('candidates', []):
        for parte in c.get('content', {}).get('parts', []):
            dados = parte.get('inlineData') or parte.get('inline_data')
            if dados:
                open(a.saida, 'wb').write(base64.b64decode(dados['data']))
                print('->', a.saida)
                return
    sys.exit('sem imagem na resposta: ' + json.dumps(d)[:600])


main()
