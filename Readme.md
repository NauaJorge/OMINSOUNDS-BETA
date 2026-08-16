# OMINSOUNDS

Marketplace de beats. Desenvolvido pela **SoftWave Soluções**.

Ambiente de **teste**: contas, catálogo e valores são demonstração.

Produção: https://ominisounds.vercel.app

> Trabalhando no projeto? O estado detalhado, as pendências e as regras que não
> se negociam estão em **[AGENTS.md](AGENTS.md)**. Este arquivo é o resumo.

## O que está de pé

- **Conta e login** com senha em hash scrypt. Qualquer pessoa se cadastra em
  `/cadastrar` e cai no onboarding.
- **Onboarding com bifurcação**: artista e produtor seguem caminhos diferentes, e
  as respostas são gravadas **e usadas** — não é formulário decorativo.
- **Feed do artista**: o início da página é montado a partir do que a pessoa
  respondeu (objetivo, quem segue, gêneros marcados).
- **Studio por usuário**: cada produtor vê o próprio catálogo e os próprios
  números. As consultas são presas ao id da sessão, sem parâmetro na URL.
- **Mensagem com aceite**: quem recebe vê quem pediu e quando, e o texto só sai
  do banco depois do aceite.
- Catálogo, perfil de produtor, favoritos, seguir e seletor de licença.
- **Player global** que continua tocando ao trocar de página, com fila.

## A regra do aceite

Está em `lib/mensagens.js`, e é o ponto mais importante do projeto.

Enquanto a conversa está `pendente`, a coluna `corpo` **não é selecionada** em
nenhuma consulta que o destinatário alcança. Não é conteúdo escondido no CSS nem
campo que a interface deixa de renderizar: o texto não sai do banco. Se a
interface tiver um bug, ou alguém chamar essas funções de outro lugar, o conteúdo
continua retido.

O assunto também fica retido, senão ele viraria o canal que o aceite deveria
fechar.

`scripts/testar-aceite.mjs` prova isso em 16 verificações, incluindo tentativa de
abrir a conversa pelo id direto e tentativa de terceiro.

## Rodar local

```bash
npm install
cp .env.example .env.local     # preencha DATABASE_URL e SESSAO_SEGREDO
npm run db:migrar
npm run db:semear              # cria as contas de teste
npm run dev
```

As senhas sorteadas ficam em `contas-de-teste.txt`, que está no `.gitignore`.

## Scripts

| comando | o que faz |
|---|---|
| `npm run db:migrar` | cria o esquema; pode rodar quantas vezes quiser |
| `npm run db:semear` | recria as contas de teste e o catálogo |
| `node --env-file=.env.local scripts/testar-aceite.mjs` | prova que o corpo não vaza antes do aceite |
| `node --env-file=.env.local scripts/testar-onboarding.mjs` | regras do onboarding |
| `node --env-file=.env.local scripts/testar-feed.mjs` | prova que trocar o gosto troca o resultado |
| `node --env-file=.env.local scripts/limpar-conversas.mjs` | zera conversas, mantém contas e catálogo |
| `python scripts/gerar-logo.py` | regenera o selo da marca e o favicon |

A lista completa está em [AGENTS.md](AGENTS.md).

## Segurança

- `DATABASE_URL`, `SESSAO_SEGREDO` e tokens só em `.env.local` e nas variáveis da
  Vercel. Nunca no git.
- `contas-de-teste.txt` é local. Não commitar.
- Pagamentos passam por checkout externo do PagBank. O site não coleta nem salva
  dados de cartão, CVV ou chave Pix.
- Sessão em cookie assinado com HMAC, `httpOnly`, `sameSite=lax`, `secure` em
  produção.
- O login roda a conferência de senha mesmo quando o e-mail não existe, para o
  tempo de resposta não revelar quais e-mails estão cadastrados.

## O que ainda não entrou

- **Publicar e editar beat pelo painel** — o maior buraco. O catálogo vem do
  `db:semear`, e um produtor novo não tem como publicar nada.
- **Verificação de e-mail** no cadastro: hoje aceita endereço inexistente.
- **Pagamento real em produção**: o token de produção foi gerado e testado, mas a
  API respondeu `allowlist_access_required`. Falta o PagBank homologar a conta
  para o endpoint `/checkouts`. Para não deixar checkout público quebrado,
  `PAGBANK_TOKEN` foi retirado da Vercel até essa liberação. Request e response
  em `docs/pagbank-homologacao-request-response.md`.
- **Entrar com Google**: fluxo escrito, faltam as credenciais do Google Cloud.
