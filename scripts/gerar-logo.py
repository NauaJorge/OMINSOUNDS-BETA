# Redesenha a marca da OMINSOUNDS em vetor.
#   python scripts/gerar-logo.py            gera os SVG
#   python scripts/gerar-logo.py --prova    gera tambem a folha de prova
#
# A marca antiga era um PNG de 900x546 com as letras postas em fonte de
# sistema. Dois problemas: nao escala (serrilha no favicon e em tela grande) e
# o logotipo fica preso a uma fonte que nao e nossa.
#
# Aqui as seis letras sao desenhadas a mao, ponto a ponto, com as proporcoes
# medidas do original: altura 0.214 da altura do selo, traco 24% da altura da
# letra, e as larguras individuais tiradas do corte na linha central.
#
# O que muda, e por que:
#   - vetor em vez de bitmap
#   - as duas lentes passam a dividir a mesma ponta. No original a interna
#     escapava por baixo da borda e morria cortada; agora as duas fecham juntas
#   - o ouro sai de #ECA700 para o #E8B931 da plataforma
#   - variante de contorno para fundo escuro, onde o preto sumia no fundo
import math
import os
import sys

SAIDA = 'public/assents/img/marca'

# O ouro e o da marca, medido do PNG, e nao o #E8B931 que o site usa nos
# botoes. Sao papeis diferentes: um e cor de marca, o outro e cor de interface.
# Puxar o selo para o tom da interface tirava dele justamente a saturacao que o
# torna reconhecivel.
OURO = '#ECA700'
TINTA = '#0B0C0E'   # o preto da marca, um grau acima do puro

# --- proporcoes -------------------------------------------------------------
# A primeira versao copiava as medidas do PNG antigo. Batia com o original em
# 74% e, no site, ficou ruim — porque copiava tambem os defeitos dele.
#
# No cabecalho o selo tem 32px de altura. Com o texto valendo 0,214 dessa
# altura, as letras saiam com 7px e viravam uma listra escura ilegivel, com
# ouro morto em cima e embaixo. Junto da lente e da elipse fina, eram tres
# listras concorrentes em 32px.
#
# O que muda, e o que fica:
#   - o texto sobe de 0,214 para 0,32 da altura: 50% maior, e passa a ler
#   - o selo encolhe de 1,647 para 1,45 de proporcao, cortando o ouro morto
#   - a elipse fina interna sai. Em tamanho grande era um detalhe bonito;
#     em 32px so empastava contra a lente
#   - o texto continua transbordando a lente, como no antigo. Foi tentado o
#     contrario, com a lente envolvendo o texto, e ela virava a protagonista:
#     o que da energia aquele desenho e a palavra rasgando a lente
P_TEXTO_ALTURA = 0.32      # altura da letra / altura do selo
P_TEXTO_LARGURA = 0.84     # largura do bloco de texto / largura do selo
P_BORDA = 0.014            # traco da elipse externa / largura
P_LENTE_PONTA = 0.40       # meia-largura da lente / largura
P_LENTE_ALTA = 0.34        # meia-altura da lente / altura
P_LENTE_GROSSA = 0.019     # traco da lente / largura
PROPORCAO = 1.45           # largura / altura do selo

INCLINACAO = 10            # graus
# O vao nao e gosto: com 8.4 a razao do bloco de texto fica em 6.23, que e a
# medida do original (729 de largura por 117 de altura). Com vao maior o texto
# ficava mais magro que o antigo, com vao menor estourava a altura.
VAO = 8.4

# --- os glifos, numa grade de 100 de altura ---------------------------------
# Traco de 24. As larguras vieram da medicao: O=111 M=108 N=97 S=78 D=90.
LETRAS = {
    'O': (111,
          'M 55.5,0 A 55.5,50 0 1,1 55.5,100 A 55.5,50 0 1,1 55.5,0 Z '
          'M 55.5,24 A 28,26 0 1,0 55.5,76 A 28,26 0 1,0 55.5,24 Z'),

    # O M nao e um V solto entre duas hastes. Os pontos abaixo saem da medicao
    # do original: o vao central mede 32 a um quinto da altura, 10 na metade, e
    # fecha em 64. O material do V segue ate 78, e os vaos laterais so abrem a
    # partir de 33 — por isso perto do topo a haste e a perna aparecem coladas.
    'M': (108,
          'M 0,100 L 0,0 L 31,0 L 54,64 L 77,0 L 108,0 L 108,100 '
          'L 84,100 L 84,33 L 63,78 L 45,78 L 24,33 L 24,100 Z'),

    'N': (97,
          'M 0,100 L 0,0 L 29,0 L 73,64 L 73,0 L 97,0 L 97,100 '
          'L 68,100 L 24,36 L 24,100 Z'),

    # Terminais cortados na horizontal e barriga com a mesma espessura das
    # hastes, senao o S fica leve ao lado das letras retas.
    'S': (78,
          'M 72,21 C 64,7 51,0 37,0 C 15,0 2,12 2,30 '
          'C 2,45 11,54 32,60 L 47,64 C 55,67 58,70 58,75 '
          'C 58,82 51,86 42,86 C 31,86 21,81 13,71 L 0,88 '
          'C 10,96 25,100 41,100 C 63,100 78,88 78,70 '
          'C 78,54 69,45 48,39 L 33,35 C 25,32 22,29 22,25 '
          'C 22,19 28,14 36,14 C 45,14 53,19 59,28 Z'),

    'D': (90,
          'M 0,0 L 45,0 C 71,0 90,20 90,50 C 90,80 71,100 45,100 L 0,100 Z '
          'M 24,22 L 43,22 C 57,22 65,33 65,50 C 65,67 57,78 43,78 L 24,78 Z'),
}

PALAVRA = 'OMNSND'
LARGURA_TEXTO = sum(LETRAS[c][0] for c in PALAVRA) + VAO * (len(PALAVRA) - 1)


def texto(cor):
    """
    Os seis glifos num bloco so. A inclinacao e aplicada ao bloco, girando em
    torno da linha do meio: assim a caixa fica simetrica e o espacamento otico
    entre as letras nao se deforma.
    """
    partes, cursor = [], 0
    for c in PALAVRA:
        larg, d = LETRAS[c]
        partes.append(f'<path d="{d}" transform="translate({cursor} 0)"/>')
        cursor += larg + VAO
    return (f'<g fill="{cor}" fill-rule="evenodd" '
            f'transform="translate(0 50) skewX({-INCLINACAO}) translate(0 -50)">'
            + ''.join(partes) + '</g>')


def lente(cx, cy, ponta, altura, cor, traco):
    """
    Uma lente que passa exatamente pela ponta e pelo vertice medidos.

    O raio nao e chutado: rastreando o arco do original ponto a ponto, ele se
    revelou circular, e para um arco de circulo a meia-corda e a flecha ja
    determinam o raio.

        R = (ponta^2 + altura^2) / (2 * altura)
    """
    r = (ponta ** 2 + altura ** 2) / (2 * altura)
    x1, x2 = cx - ponta, cx + ponta
    return (f'<path d="M {x1:.1f},{cy:.1f} A {r:.1f},{r:.1f} 0 0,1 {x2:.1f},{cy:.1f} '
            f'A {r:.1f},{r:.1f} 0 0,1 {x1:.1f},{cy:.1f} Z" '
            f'fill="none" stroke="{cor}" stroke-width="{traco:.1f}"/>')


def selo(largura=900, contorno=TINTA, ouro=OURO, rotulo='OMINSOUNDS'):
    altura = largura / PROPORCAO
    cx, cy = largura / 2, altura / 2
    borda = largura * P_BORDA

    alt_letra = altura * P_TEXTO_ALTURA
    escala = (largura * P_TEXTO_LARGURA) / LARGURA_TEXTO
    # O texto e escalado pela largura, mas a altura tem de bater com a medida:
    # se as duas nao fecharem, o desenho ficaria esticado. Uso a menor.
    escala = min(escala, alt_letra / 100)
    tw, th = LARGURA_TEXTO * escala, 100 * escala

    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {largura:.0f} {altura:.0f}" role="img" aria-label="{rotulo}">
  <ellipse cx="{cx:.1f}" cy="{cy:.1f}" rx="{cx - borda / 2:.1f}" ry="{cy - borda / 2:.1f}" fill="{ouro}" stroke="{contorno}" stroke-width="{borda:.1f}"/>
  {lente(cx, cy, largura * P_LENTE_PONTA, altura * P_LENTE_ALTA, contorno, largura * P_LENTE_GROSSA)}
  <g transform="translate({cx - tw / 2:.1f} {cy - th / 2:.1f}) scale({escala:.4f})">{texto(contorno)}</g>
</svg>'''


def folha_de_prova():
    """Cada glifo isolado, com a caixa e a linha central, para conferir peso."""
    celulas = []
    for c in PALAVRA[:5] + 'D':
        larg, d = LETRAS[c]
        celulas.append(f'''<div class="g"><svg viewBox="-12 -6 {larg + 24} 112">
      <rect x="0" y="0" width="{larg}" height="100" fill="none" stroke="#f0c" stroke-width="0.7"/>
      <line x1="-12" y1="50" x2="{larg + 12}" y2="50" stroke="#f0c" stroke-width="0.5" stroke-dasharray="3 3"/>
      <path d="{d}" fill="#111" fill-rule="evenodd"/></svg><b>{c} &middot; {larg}</b></div>''')
    return ('<!doctype html><meta charset="utf-8"><style>body{margin:0;padding:20px;'
            'font:12px system-ui;background:#fff}.linha{display:flex;gap:10px}'
            '.g{flex:1;text-align:center}.g svg{width:100%}b{display:block;color:#888}'
            '</style><div class="linha">' + ''.join(celulas) + '</div>')


def selo_miudo(lado=64):
    """
    Favicon e avatar. Nao e o selo reduzido: e a marca redesenhada para o
    tamanho, que e o que faz um icone de 16px continuar legivel.

    O quadro vira quadrado, porque a aba do navegador e o avatar sao quadrados
    e a elipse deitada se perderia neles. A lente afina, porque a 16px ela
    engrossa contra o texto e as duas viram uma mancha so. E o texto ocupa mais
    largura do que no selo grande, ja que aqui nao ha distancia de leitura para
    gastar com margem.

    O 'O' sozinho foi tentado e descartado: dentro da elipse com a lente ele
    lia como um olho, e a marca virava outra coisa.
    """
    cx = cy = lado / 2
    largura = lado * 0.98
    altura = largura / PROPORCAO
    borda = lado * 0.042

    escala = (largura * 0.86) / LARGURA_TEXTO
    tw, th = LARGURA_TEXTO * escala, 100 * escala

    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {lado:.0f} {lado:.0f}" role="img" aria-label="OMINSOUNDS">
  <ellipse cx="{cx:.1f}" cy="{cy:.1f}" rx="{largura / 2 - borda / 2:.1f}" ry="{altura / 2 - borda / 2:.1f}" fill="{OURO}" stroke="{TINTA}" stroke-width="{borda:.1f}"/>
  {lente(cx, cy, largura * P_LENTE_PONTA, altura * P_LENTE_ALTA, TINTA, largura * 0.015)}
  <g transform="translate({cx - tw / 2:.1f} {cy - th / 2:.1f}) scale({escala:.4f})">{texto(TINTA)}</g>
</svg>'''


os.makedirs(SAIDA, exist_ok=True)
# Um selo so. O contorno preto some contra o fundo escuro do site, e o que
# sobra e a elipse dourada com a borda limpa — nao precisa de segunda versao.
arquivos = {
    'omin-selo.svg': selo(),
    'omin-selo-miudo.svg': selo_miudo(),
}
for nome, conteudo in arquivos.items():
    caminho = os.path.join(SAIDA, nome)
    with open(caminho, 'w', encoding='utf-8') as f:
        f.write(conteudo)
    print(f'  {nome:24s} {os.path.getsize(caminho):5d} bytes')

if '--prova' in sys.argv:
    # Fora de public/: e material de trabalho, nao asset do site.
    caminho = os.path.join('scripts', 'prova-glifos.html')
    with open(caminho, 'w', encoding='utf-8') as f:
        f.write(folha_de_prova())
    print(f'  {caminho}   (folha de prova, nao vai para o site)')

print(f'\nouro da marca {OURO}   texto {LARGURA_TEXTO} un de largura')
