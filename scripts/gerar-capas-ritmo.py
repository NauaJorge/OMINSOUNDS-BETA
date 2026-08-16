# Gera as capas dos ritmos, uma por estilo.
#   python scripts/gerar-capas-ritmo.py
#
# Arte propria, desenhada aqui. Nao entra foto nem capa de artista real: e
# material de terceiro com direito de imagem, e usar sugere um aval que
# ninguem deu. O que se usa do mercado e a convencao de nome "type beat",
# que e texto e referencia nominativa, nao a imagem da pessoa.
import math
import os
import random

from PIL import Image, ImageDraw, ImageFilter, ImageFont

LADO = 640
SAIDA = 'public/assents/img/ritmos'
os.makedirs(SAIDA, exist_ok=True)

# O nome do artista entra como referencia de estilo, na convencao "type
# beat" que o mercado inteiro usa e que a propria BeatPlace tem na
# marcacao ("Alee Type Beats"). E texto descrevendo a sonoridade, nao a
# imagem da pessoa e nao um aval dela.
RITMOS = [
    ('Trap',        'Matuê',      'trap',        (250, 196, 60),  (120, 30, 140),  'grade'),
    ('Drill',       'Teto',       'drill',       (90, 200, 255),  (10, 40, 110),   'lamina'),
    ('Funk RJ',     'Cabelinho',  'funk-rj',     (255, 90, 160),  (70, 10, 90),    'pulso'),
    ('Afrobeat',    'Burna Boy',  'afrobeat',    (255, 150, 50),  (140, 40, 20),   'onda'),
    ('Boom Bap',    'Emicida',    'boom-bap',    (230, 200, 150), (60, 45, 35),    'grao'),
    ('Reggaeton',   'Bad Bunny',  'reggaeton',   (80, 230, 190),  (15, 70, 90),    'pulso'),
    ('Melódico',    'Veigh',      'melodico',    (190, 150, 255), (40, 25, 90),    'onda'),
    ('Drum & Bass', 'Sub Focus',  'drum-and-bass', (120, 255, 140), (15, 60, 45),  'lamina'),
]


def fundo(cor_a, cor_b):
    """Degrade radial, mais quente no alto e fechando no escuro embaixo."""
    img = Image.new('RGB', (LADO, LADO), cor_b)
    d = ImageDraw.Draw(img)
    centro = (LADO * 0.42, LADO * 0.34)
    maior = LADO * 1.15
    passos = 150
    for i in range(passos, 0, -1):
        t = i / passos
        r = int(cor_b[0] + (cor_a[0] - cor_b[0]) * (1 - t) ** 1.6)
        g = int(cor_b[1] + (cor_a[1] - cor_b[1]) * (1 - t) ** 1.6)
        b = int(cor_b[2] + (cor_a[2] - cor_b[2]) * (1 - t) ** 1.6)
        raio = maior * t
        d.ellipse(
            [centro[0] - raio, centro[1] - raio, centro[0] + raio, centro[1] + raio],
            fill=(r, g, b),
        )
    return img


def desenhar(img, forma, cor, semente):
    rnd = random.Random(semente)
    d = ImageDraw.Draw(img, 'RGBA')

    if forma == 'grade':
        passo = LADO // 14
        for x in range(0, LADO + passo, passo):
            a = rnd.randint(20, 70)
            d.line([(x, 0), (x - LADO // 3, LADO)], fill=(*cor, a), width=2)
        for i in range(9):
            y = LADO * 0.32 + i * 26
            larg = LADO * (0.16 + 0.05 * i)
            d.rounded_rectangle(
                [LADO * 0.5 - larg / 2, y, LADO * 0.5 + larg / 2, y + 11],
                radius=6, fill=(*cor, rnd.randint(90, 190)),
            )

    elif forma == 'lamina':
        for i in range(11):
            x = LADO * 0.1 + i * (LADO * 0.08)
            alt = LADO * (0.2 + 0.55 * abs(math.sin(i * 0.9)))
            d.polygon(
                [(x, LADO * 0.78), (x + 16, LADO * 0.78 - alt), (x + 32, LADO * 0.78)],
                fill=(*cor, rnd.randint(120, 220)),
            )

    elif forma == 'pulso':
        for i in range(7):
            raio = LADO * (0.1 + i * 0.075)
            d.ellipse(
                [LADO / 2 - raio, LADO / 2 - raio, LADO / 2 + raio, LADO / 2 + raio],
                outline=(*cor, max(30, 210 - i * 28)), width=max(2, 9 - i),
            )

    elif forma == 'onda':
        for camada in range(4):
            pontos = []
            base = LADO * (0.45 + camada * 0.09)
            for x in range(0, LADO + 8, 8):
                y = base + math.sin(x / 52 + camada * 1.3) * (34 - camada * 6)
                pontos.append((x, y))
            pontos += [(LADO, LADO), (0, LADO)]
            d.polygon(pontos, fill=(*cor, 45 - camada * 8))
            d.line(pontos[:-2], fill=(*cor, 170 - camada * 32), width=3)

    elif forma == 'grao':
        for _ in range(1500):
            x, y = rnd.randint(0, LADO), rnd.randint(0, LADO)
            r = rnd.randint(1, 3)
            d.ellipse([x, y, x + r, y + r], fill=(*cor, rnd.randint(30, 130)))
        for i in range(4):
            y = LADO * (0.55 + i * 0.07)
            d.line([(LADO * 0.12, y), (LADO * 0.88, y)], fill=(*cor, 90), width=2)

    return img


def fonte(tam, negrito=True):
    nomes = ['seguibd.ttf', 'segoeuib.ttf', 'arialbd.ttf'] if negrito else ['segoeui.ttf', 'arial.ttf']
    for n in nomes:
        try:
            return ImageFont.truetype(n, tam)
        except OSError:
            continue
    return ImageFont.load_default()


def rotular(img, nome, artista):
    d = ImageDraw.Draw(img, 'RGBA')
    # Faixa escura no pé: o nome precisa continuar legível sobre qualquer arte.
    d.rectangle([0, LADO - 150, LADO, LADO], fill=(0, 0, 0, 0))
    for i in range(150):
        a = int(215 * (i / 150) ** 1.5)
        d.line([(0, LADO - 150 + i), (LADO, LADO - 150 + i)], fill=(6, 7, 10, a))

    d.rectangle([46, LADO - 96, 46 + 44, LADO - 90], fill=(232, 185, 49, 255))
    d.text((46, LADO - 78), nome.upper(), font=fonte(46), fill=(255, 255, 255, 255))
    d.text((48, LADO - 26), f'{artista.upper()} TYPE BEAT',
           font=fonte(19, False), fill=(232, 185, 49, 225))
    return img


for nome, artista, arquivo, cor_a, cor_b, forma in RITMOS:
    img = fundo(cor_a, cor_b)
    img = desenhar(img, forma, cor_a, semente=sum(map(ord, arquivo)))
    img = img.filter(ImageFilter.GaussianBlur(0.6))

    # Vinheta: fecha as bordas e joga o olho para o centro.
    vin = Image.new('L', (LADO, LADO), 0)
    ImageDraw.Draw(vin).ellipse([-LADO * 0.2, -LADO * 0.2, LADO * 1.2, LADO * 1.2], fill=255)
    vin = vin.filter(ImageFilter.GaussianBlur(LADO * 0.16))
    escuro = Image.new('RGB', (LADO, LADO), (5, 6, 9))
    img = Image.composite(img, escuro, vin)

    img = rotular(img, nome, artista)
    caminho = os.path.join(SAIDA, f'{arquivo}.jpg')
    img.convert('RGB').save(caminho, quality=84, optimize=True)
    print(f'  {nome:14s} {artista:11s} -> {os.path.getsize(caminho) // 1024} KB')

print(f'\n{len(RITMOS)} capas geradas em {SAIDA}')
