# OMINSOUNDS — estado do projeto

Marketplace de beats. Desenvolvido pela **SoftWave Soluções** para a OMINSOUNDS,
que é uma parceria com a Smooth Produções — a ideia é da Smooth, a SoftWave faz
a parte técnica.

Este arquivo é o ponto de partida de qualquer agente que pegue o projeto (Codex,
Claude ou outro). Ele descreve o que **está de pé hoje**, não o que se pretende.
Última verificação: **16/ago/2026**.

- Produção: https://ominisounds.vercel.app
- Repositório: https://github.com/NauaJorge/OMINSOUNDS-BETA
- Ambiente de **teste**: contas, catálogo e valores são demonstração.

---

## 1. Regras que não se negociam

**O aceite da mensagem.** É o ponto mais importante do projeto e foi pedido
explicitamente pelo Diretor: *"nunca a mensagem já chega direto, isso é
importante para a segurança"*.

A regra vive em `lib/mensagens.js` e é garantida **na consulta**, não na
interface: enquanto a conversa está `pendente`, a coluna `corpo` simplesmente
não é selecionada em nenhuma consulta que o destinatário alcança. Não é campo
escondido no CSS nem `display:none` — o texto não sai do banco. Se a interface
tiver um bug, ou alguém chamar essas funções de outro lugar, o conteúdo continua
retido. O assunto também fica retido, senão viraria o canal que o aceite deveria
fechar.

Quem for mexer ali: `scripts/testar-aceite.mjs` prova isso em 16 verificações,
incluindo tentativa de abrir a conversa pelo id direto e tentativa de terceiro.
**Rode antes e depois de qualquer mudança em `lib/mensagens.js`.**

**Credenciais nunca entram no git.** `DATABASE_URL`, `SESSAO_SEGREDO` e tokens
só em `.env.local` e nas variáveis da Vercel. `contas-de-teste.txt` é local e
está no `.gitignore`. Isso vale mesmo para repositório privado.

**Nada de dado financeiro versionado.** Nenhuma referência a quanto a SoftWave
ou a OMINSOUNDS faturam, nem contas pessoais, em git ou nuvem.

---

## 2. Como rodar

```bash
npm install
cp .env.example .env.local     # preencher DATABASE_URL e SESSAO_SEGREDO
npm run db:migrar              # idempotente, pode rodar quantas vezes quiser
npm run db:semear              # recria contas de teste e catálogo
npm run dev
```

As senhas sorteadas ficam em `contas-de-teste.txt`, fora do git.

Banco: **Neon serverless Postgres** via `@neondatabase/serverless`. Atenção: esse
driver **não tem `sql.unsafe`**. Já quebrou uma vez — as listas de colunas vão
escritas por extenso nas consultas, o que também evita interpolar SQL como texto.

---

## 3. O que está de pé

**Contas e sessão.** Login real, senha em hash scrypt (`node:crypto`, sem
dependência nativa). Sessão em cookie assinado com HMAC, `httpOnly`,
`sameSite=lax`, `secure` em produção. O login roda a conferência de senha mesmo
quando o e-mail não existe, para o tempo de resposta não revelar quais e-mails
estão cadastrados.

**Cadastro público.** Qualquer pessoa cria conta em `/cadastrar` e cai no
onboarding. O `@` se preenche sozinho a partir do nome. Testado ponta a ponta em
produção, como um estranho.

**Onboarding com bifurcação** (`/comecar`). Quatro passos, caminho diferente
para artista e produtor, cabeçalho próprio sem o menu do site — com o menu, cinco
saídas competiam com a única decisão pedida. As respostas são gravadas **e
usadas**: veja o item seguinte.

**Feed do artista** (`/feed`). Monta o início a partir das três respostas do
onboarding: a faixa do objetivo declarado, o que os produtores seguidos
publicaram, e o que combina com os gêneros marcados. A ordem não é arbitrária —
num catálogo pequeno os mesmos beats caem em mais de uma faixa, e o filtro
anti-repetição esvaziava justamente a faixa do objetivo. A faixa que responde à
pergunta não pode ser a que some, então ela é servida primeiro.

**Studio por usuário** (`/studio`). Cada produtor vê o próprio catálogo e os
próprios números. As consultas são presas ao id da sessão, sem parâmetro na URL,
então não há como alcançar o catálogo de outro.

**Mensagens com aceite** (`/mensagens`). Ver a seção 1.

**Catálogo, perfil de produtor, favoritos, seguir, seletor de licença.** Player
global no layout raiz que não desmonta ao trocar de página, com fila. Formas de
onda pré-calculadas com ffmpeg e guardadas como JSON no banco, para o navegador
não decodificar áudio. Compatibilidade harmônica pela roda Camelot
(`lib/harmonia.js`).

**Marca.** Selo vetorial gerado por `scripts/gerar-logo.py`, com as letras
desenhadas à mão. Ver seção 6.

---

## 4. O que está desligado, e por quê

| O quê | Estado | O que falta |
|---|---|---|
| **PagBank** | código pronto, **bloqueado do lado deles** | O token de produção foi gerado e testado, e o endpoint de checkout respondeu `403 allowlist_access_required`: a conta ainda não foi homologada para `/checkouts`. `PAGBANK_TOKEN` foi **retirado da Vercel de propósito**, para não deixar checkout público quebrado — não é esquecimento, não recolocar sem a liberação. Request e response em `docs/pagbank-homologacao-request-response.md`. |
| **Google OAuth** | fluxo escrito, desligado | `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET` — o Diretor precisa criar as credenciais no Google Cloud. |
| **Mercado Pago** | código existe, desligado | Escrito por outro agente, **nunca revisado**. Contradiz a decisão de adiar pagamento e concorre com o PagBank. Decidir se fica ou sai antes de ligar. |

Nenhum dos três impede a demonstração do produto.

---

## 5. Pendências reais, por tamanho do buraco

1. **Upload de beat.** O maior buraco. Produtor que se cadastra hoje termina o
   onboarding em "falta o seu primeiro beat" e não tem como publicar — o Studio
   dele fica vazio para sempre. O catálogo atual vem do `db:semear`. O Diretor
   adiou conscientemente, mas isso trava qualquer produtor real.
2. **E-mail não é verificado.** O cadastro aceita endereço inexistente. Para
   teste serve; se abrir ao público, alguém cadastra com e-mail alheio.
3. **Rotacionar a senha do Neon.** A string de conexão foi colada em conversa.
   Continua pendente.
4. **Fila das referências de mercado** (`docs/referencias-mercado.md`): "Minha
   conta" em cards, painéis suspensos de favoritos e notificações, negociação
   como estado do pedido de mensagem, carteira no menu, aviso de e-mail não
   verificado.

---

## 6. A marca

Gerada por `scripts/gerar-logo.py` (Python, sem dependências além da stdlib).
Mudar os números no topo do arquivo e rodar de novo leva segundos.

O selo antigo era um PNG com as letras postas em fonte de sistema. As seis letras
agora são **desenhadas à mão, ponto a ponto** — resolve a licença (converter
glifos de uma fonte comercial em logotipo é zona cinzenta) e deixa o desenho ser
feito para esta marca.

Duas lições que estão codificadas nos comentários do script, e que se perdem se
alguém "simplificar" as constantes:

- **Copiar as medidas do original não é o objetivo.** A primeira versão batia
  com o PNG antigo em 74% e ficou ruim no site: com o texto valendo 0,214 da
  altura, as letras saíam com 7px no cabeçalho e viravam uma listra ilegível. O
  texto foi para 0,32 e a proporção de 1,647 para 1,45.
- **O texto transborda a lente, e é assim mesmo.** Tentar a lente envolvendo o
  texto faz dela a protagonista e encolhe a palavra. O que dá energia ao desenho
  é a palavra rasgando a lente.

Arquivos: `public/assents/img/marca/omin-selo.svg` (uso geral) e
`app/icon.svg` (favicon, redesenhado para o tamanho pequeno, não reduzido).

Nota: a pasta é `public/assents/` mesmo, com o erro de grafia herdado do site
estático original. Renomear quebraria caminhos espalhados; não vale o risco agora.

---

## 7. Contas de teste

Cinco contas no banco de produção. **As senhas estão em `contas-de-teste.txt`,
que é local e não vai para o git.**

| conta | papel | observação |
|---|---|---|
| `@naua` | produtor | conta do Diretor; onboarding reiniciado para demonstração |
| `@bruma` | produtor | tem catálogo e números — usar para demonstrar produtor |
| `@vellox` | produtor | tem catálogo e números |
| `@teste2` | produtor | sem beats; existe só como resto de teste |
| `@lelo` | artista | onboarding reiniciado para demonstração |

Catálogo: 5 beats, todos publicados.

Para reiniciar um fluxo: `node --env-file=.env.local scripts/refazer-onboarding.mjs <handle>`.

---

## 8. Scripts

| comando | o que faz |
|---|---|
| `npm run db:migrar` | cria o esquema; idempotente |
| `npm run db:semear` | recria contas de teste e catálogo |
| `node --env-file=.env.local scripts/testar-aceite.mjs` | **prova que o corpo não vaza antes do aceite** (16 verificações) |
| `... scripts/testar-onboarding.mjs` | regras do onboarding (28) |
| `... scripts/testar-feed.mjs` | prova que trocar o gosto troca o resultado (25) |
| `... scripts/testar-cadastro.mjs` | cadastro público (22) |
| `... scripts/testar-harmonia.mjs` | roda Camelot (16) |
| `... scripts/testar-favoritos.mjs` | favoritos (9) |
| `... scripts/testar-login.mjs` | confere que as senhas do arquivo autenticam |
| `... scripts/refazer-onboarding.mjs <handle>` | devolve uma conta ao início do fluxo |
| `... scripts/limpar-conversas.mjs` | zera conversas, mantém contas e catálogo |
| `python scripts/gerar-logo.py` | regenera o selo e o favicon |

Os testes batem no **banco de produção** (é o único que existe). Eles criam e
apagam as próprias contas, mas vale saber antes de rodar.

---

## 9. Convenções

- **Tudo em português**, inclusive nomes de função, variável, rota e coluna.
- Comentário explica **por que**, não o que o código já diz. Vários comentários
  no projeto guardam uma decisão ou um defeito já encontrado — apagá-los custa
  caro depois.
- Server Components e Server Actions por padrão; `'use client'` só onde precisa
  de estado no navegador.
- Antes de dizer que algo está pronto: rodar o teste correspondente e conferir
  em produção. O projeto já teve caso de "salvo" que não estava salvo.
