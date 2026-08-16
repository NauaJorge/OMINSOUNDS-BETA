# Homologacao PagBank - Requests e Responses

Projeto: OMINSOUNDS
Site: https://ominisounds.vercel.app
Responsavel tecnico: SoftWave Solucoes
Ambiente testado: Producao
Data do teste: 2026-08-16

## Objetivo da integracao

O OMINSOUNDS usa checkout hospedado do PagBank para vender licencas de beats.
O comprador e redirecionado para o checkout PagBank. O site nao coleta, nao
processa e nao armazena dados de cartao, CVV ou chave Pix.

Servicos PagBank utilizados:

- Checkout PagBank
- API de Notificacao/Webhook

## Endpoint principal

POST https://api.pagseguro.com/checkouts

Headers enviados:

```http
Authorization: Bearer [TOKEN_REMOVIDO]
Content-Type: application/json
```

Body enviado:

```json
{
  "reference_id": "validacao-softwave-1786901299",
  "customer_modifiable": true,
  "items": [
    {
      "reference_id": "validacao-api",
      "name": "Validacao API OMINSOUNDS",
      "quantity": 1,
      "unit_amount": 100
    }
  ],
  "payment_methods": [
    { "type": "PIX" },
    { "type": "CREDIT_CARD" },
    { "type": "BOLETO" }
  ],
  "soft_descriptor": "OMINSOUNDS",
  "redirect_url": "https://ominisounds.vercel.app/pagamento/retorno?status=pending",
  "redirect_waiting_time": 5,
  "return_url": "https://ominisounds.vercel.app/pagamento/retorno?status=pending",
  "notification_urls": [
    "https://ominisounds.vercel.app/api/webhooks/pagbank"
  ],
  "payment_notification_urls": [
    "https://ominisounds.vercel.app/api/webhooks/pagbank"
  ]
}
```

Response recebido:

```json
{
  "error_messages": [
    {
      "error": "allowlist_access_required",
      "description": "Allowlist access required. Contact PagBank."
    }
  ]
}
```

HTTP status observado: 403 Forbidden

## Interpretacao

O token de producao foi gerado no painel PagBank em Vendas > Integracoes, mas a
conta ainda precisa de homologacao/liberacao para utilizar o endpoint de
Checkout em producao.

Segundo a documentacao do PagBank, o erro `allowlist_access_required` indica que
o vendedor ainda nao foi homologado para uso da API de Checkout em producao.

## Webhook configurado no site

Endpoint publico:

POST https://ominisounds.vercel.app/api/webhooks/pagbank

O webhook recebe o payload do PagBank, valida o header `x-authenticity-token`
quando `PAGBANK_WEBHOOK_TOKEN` esta configurado, confere o `reference_id` do
pedido, confere se o checkout recebido pertence ao pedido salvo e confere se o
valor aprovado bate com o valor do pedido antes de liberar a licenca.

O site armazena somente dados nao sensiveis:

- id do pedido
- status do pagamento
- id do checkout/pagamento
- metodo de pagamento
- resumo tecnico do payload

Dados de cartao, CVV e chave Pix nao sao armazenados no OMINSOUNDS.
