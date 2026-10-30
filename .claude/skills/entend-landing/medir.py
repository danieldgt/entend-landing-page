"""Mede, em tamanhos de aparelho real: estouro horizontal e se a ação da dobra cabe sem rolar."""
import json, os, shutil, subprocess, sys, tempfile, time, urllib.request
import websocket
URL = sys.argv[1]
CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
TAMANHOS = [(320,568),(375,667),(390,844),(393,852),(412,915),(430,932),(844,390),(1024,768),(1440,900),(1920,1080)]
perfil = tempfile.mkdtemp(prefix='chrome-medir-')
proc = subprocess.Popen([CHROME,'--headless=new','--disable-gpu','--hide-scrollbars','--remote-debugging-port=0','--remote-allow-origins=*',f'--user-data-dir={perfil}','about:blank'],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
try:
    arq = os.path.join(perfil,'DevToolsActivePort')
    for _ in range(100):
        if os.path.exists(arq) and open(arq).read().strip(): break
        time.sleep(0.2)
    porta = int(open(arq).read().split('\n')[0])
    for _ in range(50):
        try:
            alvos = json.load(urllib.request.urlopen(f'http://127.0.0.1:{porta}/json', timeout=5))
            ws_url = next(a['webSocketDebuggerUrl'] for a in alvos if a['type']=='page'); break
        except Exception: time.sleep(0.3)
    ws = websocket.create_connection(ws_url, timeout=30); n=[0]
    def cmd(m, **p):
        n[0]+=1; ws.send(json.dumps({'id':n[0],'method':m,'params':p}))
        while True:
            r=json.loads(ws.recv())
            if r.get('id')==n[0]: return r.get('result',{})
    js = """(()=>{const d=document.documentElement;const b=document.querySelector('.dobra [data-cta]').getBoundingClientRect();
    const larg=[...document.querySelectorAll('body *')].filter(e=>e.getBoundingClientRect().right>innerWidth+1&&!e.closest('.dobra__trilho,.carrossel__trilho')).slice(0,4).map(e=>e.tagName+'.'+(e.className||'').toString().slice(0,30));
    return JSON.stringify({estouro:d.scrollWidth-d.clientWidth,cta_fundo:Math.round(b.bottom),altura:innerHeight,largos:larg})})()"""
    for w,h in TAMANHOS:
        cmd('Emulation.setDeviceMetricsOverride',width=w,height=h,deviceScaleFactor=1,mobile=w<700)
        cmd('Page.navigate',url=URL); time.sleep(1.6)
        r=json.loads(cmd('Runtime.evaluate',expression=js)['result']['value'])
        ok = 'ok' if r['estouro']<=0 and r['cta_fundo']<=r['altura'] else 'FALHA'
        print(f"{w}x{h}: estouro={r['estouro']}px  cta_fundo={r['cta_fundo']}/{r['altura']}  {ok}  {r['largos'] if r['estouro']>0 else ''}")
finally:
    proc.terminate(); shutil.rmtree(perfil, ignore_errors=True)
