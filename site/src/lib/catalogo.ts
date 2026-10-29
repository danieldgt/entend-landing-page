/**
 * Os livros da vitrine, lidos da API PÚBLICA do catálogo Drezz no momento do build.
 *
 * A landing não é loja: ela só mostra o que já está no catálogo e manda o clique para lá. Por isso
 * não há cópia de dados para manter — um livro novo cadastrado no Drezz aparece aqui no próximo
 * build (o workflow regera a página todo dia).
 *
 * Se a API não responder, vale o retrato em `catalogo-retrato.json`: o build nunca quebra por causa
 * do Drezz, e o pior caso é a vitrine mostrar o catálogo de ontem.
 */
import retrato from '@/conteudo/catalogo-retrato.json'

const API = 'https://api.drezz.com.br/catalogo-publico/entend?pagina=0&tamanho=60'

export interface Livro {
  id: string
  titulo: string
  autor: string | null
  preco: string
  disponivel: boolean
  /** Capa tratada pela landing (fundo branco), quando existe; senão a foto do catálogo. */
  capa: string
  capaLocal: boolean
}

interface ProdutoApi {
  id: string
  nome: string
  precoCentavos: number
  disponivel: boolean
  fotoPrincipalUrl: string | null
}

/*
 * O Drezz nasceu para moda e não tem campo de autor. Enquanto não tiver, o autor de cada livro
 * conhecido fica aqui — junto com a capa já recortada em fundo branco pelo `scripts/imagens`.
 */
const CONHECIDOS: Record<string, { autor: string; capa: string }> = {
  '019fc9a2-91e8-7c23-96d9-1cbb68431410': { autor: 'Eliana de Goes', capa: 'img/capa-cme-quadro.webp' },
}

const real = (centavos: number) =>
  (centavos / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

async function lerApi(): Promise<ProdutoApi[]> {
  try {
    const r = await fetch(API, { signal: AbortSignal.timeout(8000) })
    if (!r.ok) throw new Error(`HTTP ${r.status}`)
    const dados = (await r.json()) as { produtos: ProdutoApi[] }
    return dados.produtos
  } catch (e) {
    console.warn(`[catalogo] API do Drezz indisponível (${e}); usando o retrato local.`)
    return (retrato as { produtos: ProdutoApi[] }).produtos
  }
}

export async function livros(): Promise<Livro[]> {
  const produtos = await lerApi()
  return produtos
    .filter((p) => p.disponivel)
    .map((p) => {
      const c = CONHECIDOS[p.id]
      return {
        id: p.id,
        titulo: p.nome,
        autor: c?.autor ?? null,
        preco: real(p.precoCentavos),
        disponivel: p.disponivel,
        capa: c?.capa ?? p.fotoPrincipalUrl ?? '',
        capaLocal: Boolean(c),
      }
    })
}
