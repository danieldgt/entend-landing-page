/**
 * O único script da página. Tudo aqui é melhoria: sem ele a landing lê inteira, os links funcionam
 * e o teste A/B fica no controle.
 */
const raiz = document.documentElement
raiz.classList.add('modulo') // a promessa do `js` foi cumprida — ver PARTIDA em Base.astro

const quieto = matchMedia('(prefers-reduced-motion: reduce)').matches
const variante = raiz.dataset.v ?? 'a'

/* ---------- atribuição até o WhatsApp ----------
 * O GA4 não enxerga a conversa no WhatsApp. A mensagem pronta carrega `(ref: …)`: `site` por
 * padrão, ou a campanha que trouxe a visita (`?utm_campaign=`), lembrada durante a sessão. */
function lerRef(): string {
  const limpa = (s: string) => s.toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 32)
  try {
    const daUrl = new URLSearchParams(location.search).get('utm_campaign')
    if (daUrl) sessionStorage.setItem('entend-ref', limpa(daUrl))
    return sessionStorage.getItem('entend-ref') || 'site'
  } catch {
    return 'site'
  }
}
const ref = lerRef()
if (ref !== 'site') {
  document.querySelectorAll<HTMLAnchorElement>('a[data-wa]').forEach((a) => {
    a.href = a.href.replace(encodeURIComponent('(ref: site)'), encodeURIComponent(`(ref: ${ref})`))
  })
}

/* ---------- medição: só depois do consentimento, e só se houver ID ---------- */
type Params = Record<string, string | number>
declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...a: unknown[]) => void
    fbq?: ((...a: unknown[]) => void) & { queue?: unknown[]; loaded?: boolean; version?: string }
  }
}
const GA4 = document.body.dataset.ga4
const META = document.body.dataset.meta

function carregarMedicao() {
  if (GA4 && !window.gtag) {
    window.dataLayer = window.dataLayer || []
    window.gtag = function () {
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer!.push(arguments)
    }
    window.gtag('js', new Date())
    window.gtag('config', GA4, { variante_h1: variante })
    const s = document.createElement('script')
    s.async = true
    s.src = `https://www.googletagmanager.com/gtag/js?id=${GA4}`
    document.head.append(s)
  }
  if (META && !window.fbq) {
    const fila: unknown[] = []
    const fbq = Object.assign((...a: unknown[]) => fila.push(a), { queue: fila, loaded: true, version: '2.0' })
    window.fbq = fbq
    const s = document.createElement('script')
    s.async = true
    s.src = 'https://connect.facebook.net/en_US/fbevents.js'
    document.head.append(s)
    fbq('init', META)
    fbq('track', 'PageView')
  }
}

function medir(evento: string, params: Params = {}, meta?: string) {
  const p = { variante_h1: variante, ...params }
  window.gtag?.('event', evento, p)
  if (meta) window.fbq?.('track', meta, p)
}

const consent = document.querySelector<HTMLElement>('.consentimento')
if (consent) {
  let escolha: string | null = null
  try {
    escolha = localStorage.getItem('entend-consent')
  } catch {
    /* sem armazenamento: pergunta a cada visita */
  }
  if (escolha === 'sim') carregarMedicao()
  else if (escolha !== 'nao') consent.hidden = false
  consent.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-consent]')
    if (!b) return
    const v = b.dataset.consent!
    try {
      localStorage.setItem('entend-consent', v)
    } catch {
      /* ok */
    }
    consent.hidden = true
    if (v === 'sim') carregarMedicao()
  })
}

document.addEventListener('click', (e) => {
  const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[data-wa], a[data-catalogo]')
  if (!a) return
  const local = a.dataset.local ?? 'desconhecido'
  if ('wa' in a.dataset) medir('generate_lead', { cta_local: local, ref }, 'Contact')
  else medir('select_content', { content_type: 'catalogo', cta_local: local }, 'ViewContent')
})

document.querySelectorAll<HTMLDetailsElement>('details[data-faq]').forEach((d) =>
  d.addEventListener('toggle', () => d.open && medir('faq_open', { pergunta: Number(d.dataset.faq) })),
)

let marcou50 = false
addEventListener(
  'scroll',
  () => {
    if (marcou50) return
    const fim = document.documentElement.scrollHeight - innerHeight
    if (fim > 0 && scrollY / fim >= 0.5) {
      marcou50 = true
      medir('scroll_50')
    }
  },
  { passive: true },
)

/* ---------- revelação: .r, .linhas e .revela ganham `visivel` ao entrar na tela ---------- */
if (!('IntersectionObserver' in window)) {
  raiz.classList.add('sem-reveal')
} else {
  const io = new IntersectionObserver(
    (entradas) => {
      for (const e of entradas) {
        if (!e.isIntersecting) continue
        e.target.classList.add('visivel')
        io.unobserve(e.target)
      }
    },
    { rootMargin: '0px 0px -8% 0px' },
  )
  // Os títulos da dobra ficam de fora: quem os acende é o carrossel, a cada troca de slide.
  document.querySelectorAll('.r, .linhas:not(.slide__titulo), .revela').forEach((el) => io.observe(el))

  // Barra fixa do celular: aparece depois da dobra, some quando o fecho (que já tem a ação) entra.
  const barra = document.querySelector<HTMLElement>('.barra-fixa')
  const dobra = document.querySelector('.dobra')
  const fecho = document.querySelector('[data-fecho]')
  if (barra && dobra && fecho) {
    let passouDobra = false
    let veFecho = false
    const atualizar = () => barra.classList.toggle('visivel', passouDobra && !veFecho)
    new IntersectionObserver(([e]) => {
      passouDobra = !e.isIntersecting
      atualizar()
    }).observe(dobra)
    new IntersectionObserver(([e]) => {
      veFecho = e.isIntersecting
      atualizar()
    }).observe(fecho)
  }

  const indice = document.querySelector('[data-indice]')
  if (indice) {
    const ioIndice = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return
        ioIndice.disconnect()
        medir('view_trajetoria')
      },
      { threshold: 0.25 },
    )
    ioIndice.observe(indice)
  }
}

/* ---------- navegação: some ao descer, volta ao subir (como a da referência) ---------- */
const nav = document.querySelector<HTMLElement>('.nav')
if (nav) {
  let ultimo = scrollY
  addEventListener(
    'scroll',
    () => {
      const y = scrollY
      // Só depois da dobra: em cima da foto ela fica sempre visível. Foco dentro dela também segura.
      const esconder = y > ultimo && y > innerHeight * 0.6 && !nav.contains(document.activeElement)
      if (Math.abs(y - ultimo) > 4) nav.classList.toggle('escondida', esconder)
      ultimo = y
    },
    { passive: true },
  )
}

/* ---------- dobra: carrossel de slides ----------
 * O trilho rola por conta própria (dedo, trackpad, teclado). O script só acrescenta: troca
 * automática a cada TEMPO, a barra de progresso que se pode clicar, e pausa. Para quem pediu
 * menos movimento, nada anda sozinho. */
const TEMPO = 6500
const dobraEl = document.querySelector<HTMLElement>('[data-dobra]')
const trilhoDobra = dobraEl?.querySelector<HTMLElement>('[data-trilho]')
if (dobraEl && trilhoDobra) {
  const slides = [...trilhoDobra.querySelectorAll<HTMLElement>('[data-slide]')]
  const controle = dobraEl.querySelector<HTMLElement>('[data-controle]')!
  const polegar = dobraEl.querySelector<HTMLElement>('.dobra__polegar')!
  const tempo = dobraEl.querySelector<HTMLElement>('[data-tempo]')!
  const pausa = dobraEl.querySelector<HTMLButtonElement>('[data-pausa]')!
  let atual = 0
  let pausado = quieto
  let segurando = false // mouse em cima ou foco dentro: a troca espera
  let anim: Animation | null = null

  controle.hidden = false
  polegar.style.setProperty('--n', String(slides.length))
  if (quieto) {
    pausa.textContent = 'Continuar'
    pausa.setAttribute('aria-pressed', 'true')
  }

  const acender = (i: number) => {
    slides.forEach((s, k) => {
      s.classList.toggle('ativo', k === i)
      s.querySelector('.linhas')?.classList.toggle('visivel', k === i)
      // Link de slide fora da tela não recebe Tab (o foco sumiria). O texto continua no leitor de
      // tela: `inert` tiraria o <h1> da página a cada troca.
      s.querySelectorAll('a').forEach((a) => (k === i ? a.removeAttribute('tabindex') : a.setAttribute('tabindex', '-1')))
    })
    dobraEl.dataset.tom = slides[i].dataset.tom
    polegar.style.setProperty('--atual', String(i))
  }

  const correr = () => {
    anim?.cancel()
    if (pausado || segurando) return
    anim = tempo.animate([{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], {
      duration: TEMPO,
      easing: 'linear',
      fill: 'forwards',
    })
    anim.onfinish = () => ir((atual + 1) % slides.length)
  }

  function ir(i: number, suave = true) {
    atual = i
    trilhoDobra!.scrollTo({ left: i * trilhoDobra!.clientWidth, behavior: suave && !quieto ? 'smooth' : 'auto' })
    acender(i)
    correr()
  }

  // Quando a pessoa arrasta o trilho, o slide da vez é o que ficou na tela.
  let espera = 0
  trilhoDobra.addEventListener(
    'scroll',
    () => {
      clearTimeout(espera)
      espera = window.setTimeout(() => {
        const i = Math.round(trilhoDobra.scrollLeft / trilhoDobra.clientWidth)
        if (i !== atual) {
          atual = i
          acender(i)
          correr()
        }
      }, 120)
    },
    { passive: true },
  )
  addEventListener('resize', () => trilhoDobra.scrollTo({ left: atual * trilhoDobra.clientWidth }))

  controle.querySelectorAll<HTMLButtonElement>('[data-ir]').forEach((b) =>
    b.addEventListener('click', () => ir(Number(b.dataset.ir))),
  )
  pausa.addEventListener('click', () => {
    pausado = !pausado
    pausa.textContent = pausado ? 'Continuar' : 'Pausar'
    pausa.setAttribute('aria-pressed', String(pausado))
    correr()
  })
  const segurar = (v: boolean) => {
    segurando = v
    if (v) anim?.pause()
    else if (anim && anim.playState === 'paused') anim.play()
    else correr()
  }
  dobraEl.addEventListener('pointerenter', (e) => e.pointerType === 'mouse' && segurar(true))
  dobraEl.addEventListener('pointerleave', (e) => e.pointerType === 'mouse' && segurar(false))
  dobraEl.addEventListener('focusin', () => segurar(true))
  dobraEl.addEventListener('focusout', (e) => !dobraEl.contains(e.relatedTarget as Node) && segurar(false))
  document.addEventListener('visibilitychange', () => (document.hidden ? anim?.pause() : !segurando && anim?.play()))
  // Fora da tela, não troca: quem volta para cima encontra o slide em que estava.
  new IntersectionObserver(([e]) => (e.isIntersecting ? !segurando && anim?.play() : anim?.pause())).observe(dobraEl)

  acender(0)
  correr()
}

/* ---------- carrosséis: fio de progresso, setas e arrastar com o mouse ---------- */
document.querySelectorAll<HTMLElement>('[data-carrossel]').forEach((c) => {
  const trilho = c.querySelector<HTMLElement>('.carrossel__trilho')
  const barra = c.querySelector<HTMLElement>('[data-progresso]')
  const setas = c.querySelector<HTMLElement>('[data-setas]')
  if (!trilho || !barra) return
  const [antes, depois] = setas ? [...setas.querySelectorAll<HTMLButtonElement>('button')] : []

  const atualizar = () => {
    const total = trilho.scrollWidth
    barra.style.width = `${(trilho.clientWidth / total) * 100}%`
    barra.style.left = `${(trilho.scrollLeft / total) * 100}%`
    const fim = trilho.scrollWidth - trilho.clientWidth
    if (setas) {
      setas.hidden = fim <= 1
      antes.disabled = trilho.scrollLeft <= 1
      depois.disabled = trilho.scrollLeft >= fim - 1
    }
  }
  trilho.addEventListener('scroll', atualizar, { passive: true })
  addEventListener('resize', atualizar)
  atualizar()

  // Setas: anda uma peça por vez (a largura da primeira peça mais o vão).
  setas?.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-passo]')
    if (!b) return
    const peca = trilho.querySelector<HTMLElement>('.peca')
    const passo = peca ? peca.offsetWidth + parseFloat(getComputedStyle(trilho).columnGap || '0') : trilho.clientWidth * 0.8
    trilho.scrollBy({ left: Number(b.dataset.passo) * passo, behavior: quieto ? 'auto' : 'smooth' })
  })

  // Arrastar com o mouse (dedo e trackpad já rolam por conta própria). Um arrasto de verdade
  // engole o clique que vem depois, para soltar em cima de um link não abrir o catálogo.
  let x0 = 0
  let s0 = 0
  let moveu = false
  trilho.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return
    x0 = e.clientX
    s0 = trilho.scrollLeft
    moveu = false
    const mover = (ev: PointerEvent) => {
      const dx = ev.clientX - x0
      if (!moveu && Math.abs(dx) > 6) {
        moveu = true
        trilho.classList.add('arrastando')
      }
      if (moveu) trilho.scrollLeft = s0 - dx
    }
    const soltar = () => {
      removeEventListener('pointermove', mover)
      removeEventListener('pointerup', soltar)
      trilho.classList.remove('arrastando')
    }
    addEventListener('pointermove', mover)
    addEventListener('pointerup', soltar)
  })
  trilho.addEventListener(
    'click',
    (e) => {
      if (!moveu) return
      e.preventDefault()
      e.stopPropagation()
      moveu = false
    },
    true,
  )
})

/* ---------- índice: o objeto da etapa segue o cursor, com atraso (como peso) ---------- */
const previa = document.querySelector<HTMLElement>('.indice__previa')
const previaImg = previa?.querySelector<HTMLImageElement>('[data-previa]')
const lista = document.querySelector<HTMLElement>('.indice__lista')
if (previa && previaImg && lista && matchMedia('(hover: hover) and (min-width: 761px)').matches) {
  let alvoX = 0
  let alvoY = 0
  let x = 0
  let y = 0
  let rodando = false
  const passo = () => {
    const k = quieto ? 1 : 0.16
    x += (alvoX - x) * k
    y += (alvoY - y) * k
    previa.style.transform = `translate(${x}px, ${y}px)`
    if (Math.abs(alvoX - x) + Math.abs(alvoY - y) > 0.5) requestAnimationFrame(passo)
    else rodando = false
  }
  const seguir = (e: PointerEvent) => {
    // a prévia fica à direita e um pouco acima do cursor; perto da borda, passa para a esquerda
    const w = previa.offsetWidth
    alvoX = e.clientX + 28 + w > innerWidth ? e.clientX - 28 - w : e.clientX + 28
    alvoY = e.clientY - previa.offsetHeight * 0.6
    if (!previa.classList.contains('ligada')) {
      x = alvoX
      y = alvoY
    }
    if (!rodando) {
      rodando = true
      requestAnimationFrame(passo)
    }
  }
  lista.querySelectorAll<HTMLElement>('.indice__item').forEach((it) => {
    it.addEventListener('pointerenter', (e) => {
      const src = it.dataset.imagem
      if (src && previaImg.getAttribute('src') !== src) previaImg.src = src
      seguir(e)
      previa.classList.add('ligada')
    })
  })
  lista.addEventListener('pointermove', seguir)
  lista.addEventListener('pointerleave', () => previa.classList.remove('ligada'))
}

export {}
