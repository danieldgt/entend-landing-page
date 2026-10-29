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

/* ---------- revelação e trajetória ---------- */
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
  document.querySelectorAll('.r').forEach((el) => io.observe(el))

  // A trajetória acende etapa por etapa: mostra "caminho", e só uma vez.
  const etapas = document.querySelector<HTMLElement>('[data-etapas]')
  if (etapas) {
    const itens = [...etapas.querySelectorAll<HTMLElement>('.etapa')]
    const ioEtapas = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return
        ioEtapas.disconnect()
        medir('view_trajetoria')
        if (quieto) return etapas.classList.add('acesa')
        itens.forEach((it, i) => setTimeout(() => (it.style.borderTopColor = '#000'), 140 * i))
        setTimeout(() => etapas.classList.add('acesa'), 140 * itens.length)
      },
      { threshold: 0.35 },
    )
    ioEtapas.observe(etapas)
  }

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
}

/* ---------- carrossel: o fio de progresso acompanha a rolagem, como na referência ---------- */
document.querySelectorAll<HTMLElement>('[data-carrossel]').forEach((c) => {
  const trilho = c.querySelector<HTMLElement>('.carrossel__trilho')
  const barra = c.querySelector<HTMLElement>('[data-progresso]')
  if (!trilho || !barra) return
  const atualizar = () => {
    const total = trilho.scrollWidth
    barra.style.width = `${(trilho.clientWidth / total) * 100}%`
    barra.style.left = `${(trilho.scrollLeft / total) * 100}%`
  }
  trilho.addEventListener('scroll', atualizar, { passive: true })
  addEventListener('resize', atualizar)
  atualizar()
})

export {}
