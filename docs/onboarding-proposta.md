# Onboarding do OMINSOUNDS — proposta para decidir

Rascunho para o Diretor aprovar antes de virar código. Nada aqui está
construído ainda.

Base: `docs/referencias-mercado.md`, levantado com sessão logada na BeatStars e
na BeatPlace.

---

## O problema que o onboarding resolve

Hoje quem cria conta cai direto no Studio. Três consequências:

1. **Toda conta vira produtor.** Não existe artista no sistema — `papel` só tem
   o valor `produtor`, nas 4 contas do banco. Quem quer comprar beat não tem
   lugar.
2. **O Studio abre vazio** para quem acabou de chegar. Sem beat, sem número,
   sem pedido. A primeira impressão do produto é uma tela sem nada.
3. **A gente nunca pergunta o que a pessoa curte**, e depois não tem como
   recomendar. Esse é o único momento em que ela responde: dois minutos depois
   ela já está navegando e não preenche mais formulário.

---

## Decisão tomada

**Bifurcação no primeiro passo**, como na BeatPlace: artista ou produtor, e a
partir dali cada um vê o seu caminho.

Isso exige criar o papel `artista` no banco. É a mudança estrutural desta
proposta, e vale registrar que ela abre o segundo lado do marketplace — hoje o
site só serve a metade que vende.

---

## Passo 1 — comum aos dois

> **O que te traz à OMINSOUNDS?**
> Dá para mudar depois. Isso só ajusta o que você vê primeiro.

Dois cartões grandes, lado a lado:

| | |
|---|---|
| **Quero achar beats** — sou artista, canto ou escrevo | **Quero vender meus beats** — sou produtor |

Sem "pular" aqui. É uma pergunta só, de um clique, e sem ela os dois caminhos
seguintes não existem. Pular vem a partir do passo 2.

---

## Caminho ARTISTA

### 2A — O que você curte

Chips de gênero e de mood, os mesmos que já existem no catálogo. Marcar quantos
quiser, nenhum obrigatório.

> **O que você ouve?**
> Marque o que te interessa. Serve para te mostrar beat que combina.

Guarda em `preferencias_generos` e `preferencias_moods`.

### 3A — Para que você procura beat

Quatro opções, escolha única:

- Gravar uma música minha
- Fazer freestyle e conteúdo
- Projeto comercial, publicidade ou trilha
- Ainda estou explorando

Isso muda o que a gente destaca depois. Quem marca "projeto comercial" precisa
ver licença Trackout e Exclusiva; quem marca "explorando" vê os beats grátis.

### 4A — Siga alguns produtores

Lista com os produtores da plataforma, com avatar, nome, quantidade de beats e
um botão de seguir. Pré-marcados os mais tocados.

**É o passo que mais importa nesse caminho.** É o que faz a pessoa sair do
onboarding com feed cheio em vez de vazio. Sem ele, a tela seguinte é um mural
em branco e ela vai embora.

Fim: cai no catálogo já filtrado pelos estilos que marcou.

---

## Caminho PRODUTOR

### 2B — Sua vitrine

Nome artístico e `@` já vêm preenchidos do cadastro. Aqui entra o que falta:

| campo | estado |
|---|---|
| Foto de perfil | opcional |
| Capa | opcional |
| Bio | opcional |
| Cidade | opcional |
| Estilos que produz | opcional, chips |

Nenhum obrigatório: os dois que definem a vitrine já foram pedidos no cadastro.

### 3B — Como funciona aqui

Uma tela de leitura, sem formulário. Três blocos curtos:

1. **Você define a licença.** Básica em MP3, Premium com WAV, Trackout com
   stems, Exclusiva tira o beat do catálogo.
2. **Ninguém te manda mensagem sem sua permissão.** O pedido chega, você vê
   quem é e decide. O texto só aparece depois do aceite.
3. **Seu catálogo é seu.** Cada produtor vê só o próprio Studio.

O item 2 é o nosso diferencial e é aqui que ele deve ser dito.

### 4B — Seu primeiro beat

Formulário de upload, com "Fazer depois" bem visível.

> **Sobe o primeiro?**
> Dá para fazer depois, mas perfil sem beat não aparece na busca.

**Não temos upload ainda.** Duas saídas, e é decisão do Diretor:

- **(a)** Construir o upload junto. É trabalho de verdade: arquivo, capa,
  cálculo dos picos do waveform, armazenamento.
- **(b)** Este passo vira só o convite, levando ao Studio, e o upload entra
  depois. O onboarding fica pronto antes.

### 5B — Planos (opcional)

Os três planos, com o Grátis já selecionado, e "Decidir depois".

Vem por último de propósito: pedir dinheiro antes de mostrar valor derruba a
pessoa. Na BeatPlace também é o último passo.

---

## Regras que valem para os dois caminhos

- **Barra de progresso** no topo, mostrando em qual passo está.
- **"Fazer depois"** em todos os passos a partir do 2. Nunca no passo 1.
- **Voltar** funciona, e o navegador entende: cada passo é uma URL própria
  (`/comecar/1`, `/comecar/2a`...), então o botão de voltar do Chrome não
  quebra o fluxo nem perde o preenchido.
- **Sai uma vez e não volta**, como na BeatPlace. Marcado em
  `onboarding_em`. Quem quiser refazer, encontra em Editar Perfil.
- **Nenhum campo do passo 2 em diante é obrigatório.** O cadastro já pediu o
  que era indispensável.

---

## O que muda no banco

```sql
-- papel deixa de ser só 'produtor'
ALTER TABLE usuarios ADD CONSTRAINT papel_valido
  CHECK (papel IN ('produtor', 'artista'));

ALTER TABLE usuarios ADD COLUMN preferencias_generos TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE usuarios ADD COLUMN preferencias_moods   TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE usuarios ADD COLUMN objetivo             TEXT NOT NULL DEFAULT '';
ALTER TABLE usuarios ADD COLUMN onboarding_em        TIMESTAMPTZ;

-- seguir produtor: par único, mesma ideia da tabela de favoritos
CREATE TABLE seguidores (
  seguidor_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  seguido_id  INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  criado_em   TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (seguidor_id, seguido_id),
  CHECK (seguidor_id <> seguido_id)
);
```

### Três lugares que quebram se o papel `artista` entrar sem cuidado

Conferido no código, não suposto:

1. **`/studio`** (`app/studio/page.js:17`) só checa se há sessão. Artista logado
   entra num painel que não é dele, com catálogo vazio. Precisa mandar para o
   catálogo quando o papel for `artista`.
2. **Home e `/produtores`** filtram por `papel = 'produtor'`. Isso está certo e
   já protege as listagens — artista não vai aparecer como se vendesse beat.
3. **`lib/usuarios.js:60`** cria toda conta com `papel` fixo em `'produtor'`. É
   ali que a escolha do passo 1 precisa chegar.

O menu também muda: hoje mostra Studio e Mensagens para qualquer sessão.

---

## O que eu NÃO recomendo copiar

- **Pedir celular no cadastro**, como a BeatPlace faz. Antes de a pessoa ver
  valor, isso derruba conversão. Nosso cadastro tem quatro campos e entra
  direto — é vantagem, não falta.
- **Duas confirmações de senha.** Uma basta, com o campo mostrando o mínimo.
- **Bloquear por e-mail não verificado.** Cobrar numa faixa, como eles fazem,
  sem travar o uso.

---

## Perguntas em aberto para o Diretor

1. **Upload no passo 4B**: construir junto (a) ou deixar como convite (b)?
2. **Artista pode virar produtor depois?** Minha sugestão é sim, por um botão
   "Quero vender também" no menu — é o "Become a Seller" da BeatStars e o
   "Aplicar-se a Beatmaker" da BeatPlace. Custa pouco e abre caminho.
3. **As três contas de teste** viram o quê? Sugiro deixar as duas dos produtores
   como estão e criar uma quarta, de artista, para demonstrar os dois lados.
4. **Ordem de entrega**: onboarding primeiro, ou o seletor de licença (item 1 da
   fila) antes? O seletor mexe onde o dinheiro entra.
