// Confere a roda de Camelot contra casos que produtor conhece de cor.
//   node scripts/testar-harmonia.mjs
import { codigoCamelot, tonsCompativeis, combinam } from '../lib/harmonia.js';

let falhas = 0;
const ok = (c, t) => { console.log(`${c ? '  ok  ' : ' FALHA'}  ${t}`); if (!c) falhas++; };

console.log('\n1. Codigos conhecidos');
ok(codigoCamelot('A menor') === '8A', 'La menor e 8A');
ok(codigoCamelot('C maior') === '8B', 'Do maior e 8B, o relativo de La menor');
ok(codigoCamelot('G menor') === '6A', 'Sol menor e 6A');
ok(codigoCamelot('F# menor') === '11A', 'Fa# menor e 11A');
ok(codigoCamelot('inexistente') === null, 'tom desconhecido devolve nulo');

console.log('\n2. Relativo maior e menor sempre combinam');
ok(combinam('A menor', 'C maior'), 'La menor com Do maior');
ok(combinam('G menor', 'A# maior'), 'Sol menor com La# maior');

console.log('\n3. Vizinhos na roda combinam');
ok(combinam('G menor', 'C menor'), '6A com 5A');
ok(combinam('G menor', 'D menor'), '6A com 7A');

console.log('\n4. Distantes nao combinam');
ok(!combinam('G menor', 'F# menor'), '6A com 11A nao combina');
ok(!combinam('A menor', 'D# menor'), '8A com 2A nao combina');

console.log('\n5. A roda da a volta');
ok(combinam('G# menor', 'D# menor'), '1A com 12A: passa do 1 para o 12');
ok(combinam('C# menor', 'G# menor'), '12A com 1A: e o mesmo caminho de volta');

console.log('\n6. Cada tom combina com quatro, contando ele mesmo');
const lista = tonsCompativeis('G menor');
ok(lista.length === 4, `Sol menor combina com 4 (${lista.join(', ')})`);
ok(lista.includes('G menor'), 'ele mesmo esta na lista');

console.log('\n7. Combinar e mutuo');
const pares = [['A menor','C maior'], ['G menor','D menor'], ['F menor','C menor']];
ok(pares.every(([a, b]) => combinam(a, b) === combinam(b, a)), 'a relacao vale nos dois sentidos');

console.log(falhas === 0 ? '\nHARMONIA OK\n' : `\n${falhas} FALHA(S)\n`);
process.exit(falhas === 0 ? 0 : 1);
