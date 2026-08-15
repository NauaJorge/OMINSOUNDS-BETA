// Funcao pura de texto, sem nada do Node, para poder ser usada tanto no
// servidor quanto no formulario que roda no navegador. Deixar isto dentro de
// lib/usuarios.js arrastava node:crypto para o pacote do cliente e quebrava a
// compilacao.
export function normalizarHandle(bruto) {
  return String(bruto ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // tira acento
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '');
}
