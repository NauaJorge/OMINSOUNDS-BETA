import Link from 'next/link';

/*
  A marca da OMINSOUNDS: o selo mais o nome por extenso.

  Os dois precisam estar juntos. O selo diz OMNSND, que é a marca antiga
  abreviada, e sozinho não entrega o nome a quem chega pela primeira vez. O
  nome sozinho não tem identidade nenhuma. Um responde pelo outro.

  O selo entra como <img> e não inline: ele aparece no topo e no rodapé de toda
  página, e repetir 1,6 KB de path duas vezes em cada HTML custa mais do que o
  arquivo, que o navegador busca uma vez e guarda.
*/
export default function Marca({ href = '/', className = 'marca' }) {
  return (
    <Link className={className} href={href}>
      <img className="marca-selo" src="/assents/img/marca/omin-selo.svg" alt="" width="46" height="32" />
      <span>OMINSOUNDS</span>
    </Link>
  );
}
