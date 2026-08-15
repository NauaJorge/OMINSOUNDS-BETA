/*
  Roda de Camelot: o jeito que DJ e produtor decidem se duas faixas cabem
  juntas sem brigar de tom. Cada tonalidade vira um numero de 1 a 12 e uma
  letra (A para menor, B para maior).

  Combinam entre si:
    - o mesmo codigo;
    - o vizinho de numero, mesma letra (6A com 5A e com 7A);
    - o par relativo, mesmo numero e letra trocada (6A com 6B).

  Isso nao e enfeite: quem vai cantar por cima precisa saber se o beat cabe
  na voz, e quem vai juntar dois beats precisa saber se eles convivem.
*/

const CAMELOT = {
  'A menor': '8A',  'C maior': '8B',
  'E menor': '9A',  'G maior': '9B',
  'B menor': '10A', 'D maior': '10B',
  'F# menor': '11A', 'A maior': '11B',
  'C# menor': '12A', 'E maior': '12B',
  'G# menor': '1A', 'B maior': '1B',
  'D# menor': '2A', 'F# maior': '2B',
  'A# menor': '3A', 'C# maior': '3B',
  'F menor': '4A',  'G# maior': '4B',
  'C menor': '5A',  'D# maior': '5B',
  'G menor': '6A',  'A# maior': '6B',
  'D menor': '7A',  'F maior': '7B',
};

const PARA_TOM = Object.fromEntries(Object.entries(CAMELOT).map(([tom, c]) => [c, tom]));

export function codigoCamelot(tom) {
  return CAMELOT[tom?.trim()] ?? null;
}

export function tomDoCodigo(codigo) {
  return PARA_TOM[codigo] ?? null;
}

/** Os codigos que convivem com este, incluindo ele mesmo. */
export function codigosCompativeis(tom) {
  const codigo = codigoCamelot(tom);
  if (!codigo) return [];

  const numero = Number(codigo.slice(0, -1));
  const letra = codigo.slice(-1);
  const anterior = numero === 1 ? 12 : numero - 1;
  const proximo = numero === 12 ? 1 : numero + 1;

  return [
    codigo,
    `${numero}${letra === 'A' ? 'B' : 'A'}`,
    `${anterior}${letra}`,
    `${proximo}${letra}`,
  ];
}

/** Os tons compativeis, em nome, para mostrar na tela. */
export function tonsCompativeis(tom) {
  return codigosCompativeis(tom).map(tomDoCodigo).filter(Boolean);
}

export function combinam(tomA, tomB) {
  if (!tomA || !tomB) return false;
  return codigosCompativeis(tomA).includes(codigoCamelot(tomB));
}
