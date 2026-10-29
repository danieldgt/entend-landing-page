/**
 * Tudo o que a página diz e para onde ela manda, num lugar só.
 *
 * Copy aprovada na Etapa 2 (`docs/etapa-2-copy.md`). A regra que segura este arquivo: a ação
 * principal tem UM rótulo, repetido nos quatro lugares em que aparece. Quatro textos para o mesmo
 * clique é a página pedindo ao autor que decida de novo a cada rolagem.
 */

export const CTA = 'Quero lançar meu livro'
export const CTA_APOIO = 'A conversa começa no WhatsApp. Sem compromisso.'

export const WHATSAPP = '5585991249368'
/** A mensagem já vai escrita: o autor não precisa saber o que dizer. O `(ref: …)` é a atribuição. */
export const MENSAGEM = 'Olá, Entend! Quero conversar sobre o meu livro.'
export const urlWhatsapp = (ref = 'site') =>
  `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(`${MENSAGEM} (ref: ${ref})`)}`

export const CATALOGO = 'https://app.drezz.com.br/catalogo/entend'
export const urlCatalogo = (local: string) =>
  `${CATALOGO}?utm_source=landing&utm_medium=site&utm_campaign=autores&utm_content=${local}`

export const CONTATO = {
  editora: 'Editora Entend Educacional',
  endereco: 'R. Osvaldo Cruz, 1660 — Aldeota, Fortaleza/CE',
  rua: 'Rua Osvaldo Cruz, 1660',
  bairro: 'Aldeota',
  cidade: 'Fortaleza',
  uf: 'CE',
  cep: '60125-048',
  telefone: '(85) 99124-9368',
  email: 'falecom@entend.com.br',
  instagram: 'https://www.instagram.com/entend_br/',
  site: 'https://entend.com.br/',
}

export const SEO = {
  titulo: 'Entend — Editora para autores | Do manuscrito ao lançamento',
  descricao:
    'A Entend acompanha você de perto, da primeira ideia ao lançamento do seu livro — com vitrine e venda online. Comece pelo WhatsApp.',
}

export const TRAJETORIA = [
  ['Conversa editorial', 'Você conta a ideia ou mostra o que já escreveu. A gente entende seu ponto de partida.'],
  ['Estrutura', 'O que você sabe vira um sumário: para quem é o livro, o que ele promete, em que ordem.'],
  ['Escrita', 'Você escreve com rumo e com alguém acompanhando o ritmo.'],
  ['Edição', 'O texto ganha clareza, consistência e a voz de quem vai ler.'],
  ['Projeto gráfico', 'Capa e miolo pensados como objeto — o livro precisa ser desejado antes de ser lido.'],
  ['Publicação', 'O livro pronto, com o selo da Entend.'],
  ['Lançamento e vitrine', 'Seu livro entra no catálogo online, à venda com pagamento online.'],
] as const

export const BENEFICIOS = [
  ['Um interlocutor, do início ao fim.', 'Você fala com a Entend — não coordena cinco fornecedores.'],
  ['Acompanhamento de perto.', 'Cada etapa tem alguém olhando com você, não só uma revisão no final.'],
  ['Seu livro já nasce à venda.', 'A vitrine online faz parte do caminho, não é um problema para depois.'],
  ['Autoridade que fica.', 'Um livro abre portas que um currículo não abre: aulas, palestras, convites.'],
  ['Uma casa de educação.', 'A Entend vem da sala de aula — sabe transformar conhecimento em algo que se aprende.'],
] as const

export const PASSOS = [
  ['Mande uma mensagem.', `Toque em “${CTA}” — a mensagem já vai escrita.`],
  ['Conte sobre o livro.', 'Ideia, rascunho ou manuscrito pronto: qualquer ponto de partida serve.'],
  ['Receba o caminho.', 'A Entend mostra como seria a trajetória do seu livro.'],
] as const

export const PROMESSAS = {
  sim: [
    'Acompanhar você de perto, da ideia ao lançamento.',
    'Explicar cada etapa antes de você decidir.',
    'Colocar seu livro na vitrine online da Entend.',
  ],
  nao: ['Best-seller. Ninguém honesto promete.', 'Atalhos que pulam a edição.', 'Que o livro se escreve sozinho.'],
}

/*
 * Respostas escritas para NÃO afirmar o que o cliente ainda não confirmou (preço, gratuidade,
 * direitos, atendimento remoto completo). Quando a resposta existir, ela entra aqui.
 */
export const FAQ = [
  ['Preciso ter o livro pronto?', 'Não. Você pode chegar com uma ideia, um rascunho ou um manuscrito pronto. A conversa editorial parte de onde você está.'],
  ['Quanto custa?', 'Depende do ponto de partida e do que o seu livro precisa. Na conversa, a Entend entende o seu caso e apresenta o caminho antes de qualquer decisão.'],
  ['A primeira conversa me compromete?', 'Não. Ela começa com uma mensagem no WhatsApp, e você decide se quer seguir.'],
  ['Moro fora de Fortaleza. Posso publicar?', 'A conversa começa pelo WhatsApp, de onde você estiver. Conte onde você mora e a Entend explica como seria o acompanhamento.'],
  ['Que tipo de livro a Entend publica?', 'Livros de quem tem conhecimento para compartilhar — o primeiro do catálogo é técnico, da área da saúde. Conte a sua ideia na conversa.'],
  ['E se eu travar no meio da escrita?', 'É para isso que existe o acompanhamento: a Entend segue com você em cada etapa, não só no final.'],
  ['Meu livro vai ser vendido onde?', 'No catálogo online da Entend, com pagamento online — o mesmo onde já está o livro de Eliana de Goes.'],
  ['Como compro um livro da Entend?', 'Pelo catálogo: escolha o livro, pague online ou reserve, e retire em Fortaleza apresentando o código do pedido.'],
] as const
