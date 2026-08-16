import { NextResponse } from 'next/server';

/*
  O layout raiz precisa saber em que rota está para esconder o menu durante o
  onboarding, e um layout de servidor não recebe isso. O middleware carimba o
  caminho num cabeçalho, que o layout lê com headers().
*/
export function middleware(req) {
  const cabecalhos = new Headers(req.headers);
  cabecalhos.set('x-caminho', req.nextUrl.pathname);
  return NextResponse.next({ request: { headers: cabecalhos } });
}

export const config = {
  // Não roda em arquivo estático nem em imagem: só encareceria a resposta.
  matcher: ['/((?!_next/static|_next/image|assents|favicon.ico).*)'],
};
