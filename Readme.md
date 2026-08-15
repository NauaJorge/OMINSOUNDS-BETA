# OMINSOUNDS

Marketplace de beats. Desenvolvido pela **SoftWave Soluções**.

Ambiente de **teste**: contas, catálogo e valores são demonstração.

## O que está de pé

- **Login por conta**, com senha guardada como hash scrypt. Não existe mais o `form action="usuario.html"` que deixava qualquer senha passar.
- **Studio por usuário**: cada produtor entra e vê o próprio catálogo e os próprios números. As consultas são presas ao id da sessão, sem parâmetro na URL, então não há como alcançar o catálogo de outro.
- **Mensagem com aceite**: quem recebe vê quem pediu e quando, e o texto só sai do banco depois do aceite.
- Catálogo público, perfil de produtor e filtro por gênero.

## A regra do aceite

Está em `lib/mensagens.js`, e é o ponto mais importante do projeto.

Enquanto a conversa está `pendente`, a coluna `corpo` **não é selecionada** em nenhuma consulta que o destinatário alcança. Não é conteúdo escondido no CSS nem campo que a interface deixa de renderizar: o texto não sai do banco. Se a interface tiver um bug, ou alguém chamar essas funções de outro lugar, o conteúdo continua retido.

O assunto também fica retido, senão ele viraria o canal que o aceite deveria fechar.

`scripts/testar-aceite.mjs` prova isso em 16 verificações, incluindo tentativa de abrir a conversa pelo id direto e tentativa de terceiro.

## Rodar local

```bash
npm install
cp .env.example .env.local     # preencha DATABASE_URL e SESSAO_SEGREDO
npm run db:migrar
npm run db:semear              # cria as 3 contas de teste
npm run dev
```

As senhas sorteadas ficam em `contas-de-teste.txt`, que está no `.gitignore`.

## Scripts

| comando | o que faz |
|---|---|
| `npm run db:migrar` | cria o esquema; pode rodar quantas vezes quiser |
| `npm run db:semear` | recria as contas de teste e o catálogo |
| `node --env-file=.env.local scripts/testar-aceite.mjs` | prova que o corpo não vaza antes do aceite |
| `node --env-file=.env.local scripts/testar-login.mjs` | confere que as senhas do arquivo autenticam |
| `node --env-file=.env.local scripts/limpar-conversas.mjs` | zera conversas, mantém contas e catálogo |

## Segurança

- `DATABASE_URL` e `SESSAO_SEGREDO` só em `.env.local` e nas variáveis da Vercel. Nunca no git.
- `contas-de-teste.txt` é local. Não commitar.
- Sessão em cookie assinado com HMAC, `httpOnly`, `sameSite=lax`, `secure` em produção.
- Login roda a conferência de senha mesmo quando o e-mail não existe, para o tempo de resposta não revelar quais e-mails estão cadastrados.

## O que ainda não entrou

- Publicar e editar beat pelo painel: o catálogo vem do banco de teste.
- Pagamento. Adiado por decisão do Diretor, o projeto não está sendo pago agora.
- Player global que continua tocando entre páginas.
- Upload de áudio e capa.
