# Referências de mercado — BeatStars e BeatPlace

Levantado com sessão logada, navegando as duas plataformas. Serve de fila de
trabalho: o que existe lá, o que já temos, e o que decidimos não copiar.

---

## BeatStars

### Página do beat — o ponto mais forte deles

Quatro licenças **lado a lado**, cada uma com o formato entregue logo abaixo do
preço:

| licença | preço | entrega |
|---|---|---|
| Mp3 License | $50 | MP3 |
| Wav License | $75 | WAV, MP3 |
| Trackout Wav Lease | $150 | WAV, STEMS, MP3 |
| Unlimited Lease | $250 | WAV, STEMS, MP3 |

Clicar numa licença **muda o total no topo**, com "Add to Cart" e "Buy now" ao
lado. A nossa empilha as quatro na vertical: funciona, mas comparar é pior e o
total não reage à escolha.

Abaixo vem **Usage Terms** com os limites em números e ícone: distribuir até
2.000 cópias, 500.000 execuções de streaming, 1 videoclipe, shows sem fins
lucrativos ilimitados. Nós descrevemos isso em texto corrido — número com ícone
se compara de relance.

### Painel do usuário

Três blocos, e a divisão faz sentido:

- **Conteúdo** — My Playlists, Favorites, Listening history, Lyrics, Purchased,
  Collaborations
- **Transação** — My Orders, Gift Card Orders, Negotiations, Messages,
  Connections
- **Conta** — Account Settings, Product Updates, Help, Platform Status,
  Studio Profile

No topo do menu: **Become a Seller**, o plano atual (FREE) e **Total Wallet**.
O produtor vê quanto tem a receber sem procurar.

Detalhes que valem:

- **Favoritos abre em painel suspenso**, sem trocar de página — a música não
  para. Coerente com player global, e barato de copiar.
- **Negotiations é seção própria.** Não é mensagem: é a negociação de preço
  formalizada. Encaixa direto no nosso aceite — o pedido vira proposta com valor.
- **Lyrics.** Guardam a letra que o artista escreveu por cima do beat, mesmo sem
  compra. Amarra a pessoa à plataforma.

### Navegação

Barra fixa com Tracks · Collections · Sound Kits · Musicians · AI Models.
Busca com seletor de tipo ao lado do campo. Hero com vídeo de fundo que troca de
faixa sozinho, com título e produtor no canto.

---

## BeatPlace

- Stack: Laravel com bundle `app_no_vue`, jQuery e **Plyr** para áudio. Nós
  resolvemos o mesmo com elemento nativo e sem dependência.
- Discurso comercial: contrato automático, download instantâneo, arquivos WAV e
  MP3, stems separados, proteção do pagamento até a entrega.
- Faixa de playlists ao lado de "Descubra Novos Sons", com `snap-x`,
  `object-cover` e gradiente. As capas são artwork de playlist nomeada por
  artista (`alt="Alee Type Beats"`).

### Cadastro (relato do Diretor, 16/ago/2026)

Entrar com Google **ou** criar conta. No formulário: número de celular, e-mail,
senha com duas confirmações, aceite dos termos, aceite das políticas e aceite de
envios — **nem todos obrigatórios**.

### Painel "Minha Conta" — em cartões, não em menu suspenso

Grade de 13 cartões, cada um com título e uma linha explicando. Muito melhor que
o menu suspenso da BeatStars: cabe tudo numa tela e a pessoa lê o que cada área
faz sem abrir.

Aplicar-se a Beatmaker · Pedidos · Downloads · Favoritos · Seguindo · Histórico ·
Letras · Playlists · Minhas negociações · Cartões e Contas · Cobranças · Planos ·
Editar Perfil

Detalhes:

- O primeiro cartão, **Aplicar-se a Beatmaker**, vem destacado com borda. É a
  ação que a plataforma quer que aconteça, e ela não se esconde no meio.
- Faixa no topo: **"Verifique seu email para ter acesso completo à plataforma"**,
  com botão de reenvio. Não bloqueia o uso, mas cobra.
- Barra lateral fixa: Início, Feed, Novidades, Explorar, Beats Quentes, Todos
  Packs, e uma lista de **sugestões para seguir** com avatar dos produtores.

### Onboarding do cadastro — roda uma vez e não volta

O Diretor lembrou de 4 etapas, começando por escolher o tipo de conta. Como o
fluxo já foi concluído na conta dele, `/onboarding` redireciona para o explore e
não dá para revisitar pela tela.

Recuperei a arquitetura pelos nomes dos componentes carregados no bundle da
área logada. **Não é um fluxo de 4 etapas: é uma bifurcação.**

```
StepChoice  ← "o que você é", a etapa que o Diretor lembrou como primeira
   │
   ├── caminho ARTISTA (comprador)
   │     StepBuyerStyles          estilos que curte  ← o "filtro reggae, trap"
   │     StepBuyerPurpose         para que vai usar
   │     StepBuyerSuggestions     beats sugeridos
   │     StepBuyerFollowSuggestions  produtores para seguir  ← a 4ª esquecida
   │
   └── caminho PRODUTOR (beatmaker)
         StepBmProfile      perfil
         StepBmHowItWorks   como a plataforma funciona
         StepBmFirstBeat    subir o primeiro beat
         StepBmPlans        planos
```

Existe também `OnboardingProgress`, o indicador de andamento, e um segundo
wizard só para a loja do produtor: `StepName → StepTheme → StepLogo →
StepConfirm`.

O que isso ensina:

1. **A primeira pergunta separa os dois públicos**, e a partir dali cada um vê
   um caminho diferente. Um marketplace tem dois lados, e tratar os dois igual
   no primeiro minuto desperdiça a única chance de perguntar.
2. **O caminho do artista termina em seguir produtores.** A pessoa não sai do
   onboarding sozinha — sai com um feed que já tem conteúdo.
3. **O caminho do produtor termina em planos**, depois de já ter subido um beat.
   Pede dinheiro só depois de mostrar valor.
4. Quatro etapas de cada lado, nem uma a mais.

### Onboarding da loja do produtor — `/minha-conta/aplicar`

Uma tela só, com título em pergunta e subtítulo curto:

> **Como você quer ser conhecido?**
> Seu perfil é sua vitrine. Capricha.

Campos:

| campo | estado |
|---|---|
| Foto de perfil | opcional |
| Nome artístico * | "Como irão te chamar" |
| URL do perfil * | prefixo `beatplace.co/` grudado no campo |
| Bio | opcional, "Fala sobre você e sua música" |
| Estilos que produz | opcional, 22 chips para marcar |

Dois botões: **Criar meu perfil** e **Fazer depois**. Aviso de termos abaixo.

O que vale copiar aqui:

1. **"Fazer depois" existe.** O onboarding não é prisão — quem quer olhar antes
   consegue.
2. **Só dois campos obrigatórios**, e os dois definem a vitrine. Todo o resto é
   opcional e pode vir depois.
3. **O prefixo do domínio dentro do campo da URL**, então ninguém digita o
   endereço inteiro nem erra o formato. Já fizemos igual no `@` do cadastro.
4. **Estilos como chips clicáveis**, não como select. Marcar cinco é um gesto,
   não cinco aberturas de menu.
5. **Título em pergunta.** "Como você quer ser conhecido?" convida; "Complete seu
   perfil" cobra.

---

## Fila de trabalho, por retorno

1. **Seletor de licença com total reagindo** — é onde a compra acontece, e a
   nossa está mais fraca
2. **Termos de uso em números com ícone**, no lugar do texto corrido
3. **Onboarding com bifurcação no primeiro passo** — artista ou produtor, e a
   partir dali cada um vê o seu caminho. O do artista termina em seguir
   produtores; o do produtor, em planos, depois de já ter subido um beat
4. **Onboarding da loja**, uma tela, dois campos obrigatórios, com
   "Fazer depois" e estilos em chips
5. **Página "Minha conta" em cartões**, com a ação principal destacada
6. **Favoritos e notificações em painel suspenso**, sem trocar de página
7. **Negociação** como estado do pedido de conversa, com valor proposto
8. **Carteira no menu**, mostrando o que o produtor tem a receber
9. **Aviso de e-mail não verificado** que cobra sem bloquear

### O que já temos e eles não

Vale registrar, porque é o que diferencia o produto:

- Mensagem com aceite: o corpo não sai do banco antes da pessoa aceitar
- Ajuste de andamento ao vivo, com tom fixo ou tom junto
- Busca por tom compatível pela roda de Camelot
- Waveform com picos pré-calculados no build, sem decodificar áudio no navegador

---

## O que decidimos não copiar

- **Foto e capa de disco de artista real.** É material de terceiro com direito
  de imagem, e publicar sugere um aval que ninguém deu. O que se usa é a
  convenção de nome "type beat", que é texto e referência nominativa — essa está
  nas capas de ritmo e nas tags.
- **Plyr e jQuery.** O player nativo daqui já faz mais: fila, waveform com picos
  pré-calculados e ajuste de andamento.
- **Carrossel que gira sozinho.** Tira o controle de quem lê e some com o item
  na hora do clique.
