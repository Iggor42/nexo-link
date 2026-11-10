# Nexo Link 2.0 — agendamento, sinal via Pix e prova social

> Construído em 23/10/2026. Tudo **genérico e configurável por inquilino**
> no JSON (`public/tenants/{slug}.json`). Sem config = sem mudança visual.

## 1. Agendamento — etapa `type: "date"`

Adicione uma etapa à jornada do inquilino:

```json
{
  "id": "eventDate",
  "field": "eventDate",
  "type": "date",
  "title": "Qual a data do evento?",
  "subtitle": "Escolha o dia do evento ou continue sem data definida"
}
```

- O lead escolhe a data num seletor (`input type=date`, mínimo = hoje)
  ou toca em **"Ainda sem data"** (valor `sem-data`).
- A data vai formatada em pt-BR (ex.: "sábado, 14 de novembro de 2026")
  para o resumo final e para a mensagem de WhatsApp — basta referenciar
  `{eventDate}` (o `field` da etapa) no `whatsappTemplate`.
- **Datas ocupadas** (marcação manual, sem Google Calendar):

```json
"booking": { "busyDates": ["2026-11-14", "2026-12-05"] }
```

  Datas ocupadas aparecem listadas/marcadas na etapa e, se selecionadas,
  bloqueiam o avanço com aviso. Também é possível declarar `busyDates`
  dentro da própria etapa (os dois conjuntos são somados).
- Inquilino sem etapa `date` na jornada: nada muda.

**Caio:** etapa já adicionada (2ª da jornada) + `booking.busyDates: []`
vazio — ele preenche as datas ocupadas reais quando tiver a lista.

## 2. Sinal via Pix — bloco na tela final

```json
"pix": { "key": "chave@exemplo", "amount": 200, "label": "Sinal de reserva" }
```

- Bloco aparece na tela final/resumo, antes do CTA de WhatsApp,
  **somente se `pix.key` estiver preenchida**. Ausente/vazio = oculto.
- Chave com botão **copiar** (Clipboard API + feedback "Copiado ✓");
  `amount` formatado em R$ (pt-BR). `label` e `amount` são opcionais.
- Sem gateway: o lead copia a chave e confirma o pagamento no WhatsApp.
- **Nunca** colocar chave/valor fictícios em inquilino real — os dados
  reais entram quando o cliente fornecer.

## 3. Prova social — carrossel de depoimentos

```json
"testimonials": [
  { "name": "Nome", "eventType": "Casamento", "city": "Montes Claros/MG", "quote": "Frase do cliente." }
]
```

- Carrossel (anterior/próximo + dots) na tela inicial do link,
  **somente se o array tiver itens**. Vazio/ausente = seção oculta.
- Nunca inventar depoimento em inquilino real — coletar com autorização.

## 4. Jornadas condicionais — steps com `when` (dois direcionamentos)

Um step pode depender da resposta de outro campo:

```json
{ "id": "services", "field": "services", "type": "multi",
  "title": "Escolha seus serviços",
  "when": { "field": "direction", "equals": "barber" } }
```

- Só os steps visíveis entram na contagem ("Passo X de N"), na
  navegação, no resumo final e na mensagem de WhatsApp. Trocar a
  resposta que controla o `when` descarta as respostas dos steps que
  somem — nada vaza para o resumo nem para o WhatsApp.
- Campos de apoio na jornada: `heroSteps` (nº de passos exibido no
  hero quando o total varia por direção), `dateLabel` (rótulo acima
  do input de data; padrão: "Data do evento") e `lastStepCta`
  (texto do botão no último step; padrão: "Concluir avaliação").
- Texto do botão principal do hero: `heroCta` no JSON do tenant
  (padrão: conforme o nicho).
- **Akis (09/11/2026):** primeiro inquilino condicional — a barbearia
  e a loja usam a mesma estrutura do Caio (hero → passos → resumo),
  com a identidade monocromática da Akis. O componente próprio
  `AkisExperience` (dark luxury) foi removido.

## 5. Hub escuro com acessos (Akis, 09/11/2026)

Quando `journey.heroAccesses` existe, a tela inicial vira o hub escuro
do padrão original do zip (fundo preto, foto ao fundo escurecida, logo
oficial, endereço, Instagrams e um cartão por acesso), em vez do hero
+ botão "Começar". Cada acesso grava a direção e abre o 1º passo.

```json
"heroLogo": "/assets/akis-logo.png",
"heroBackground": "/assets/akis-bg.webp",
"hubHeaderLogo": "/assets/akis-logo-white.webp",
"instagramSecondary": "akisformen_",
"mapUrl": "https://www.google.com/maps/search/?api=1&query=...",
"journey": { "heroAccesses": [
  { "value": "barber", "title": "Agende o seu horário",
    "subtitle": "Escolha o dia e o horário ideal para você",
    "badge": "Cortes & Barba · Tabela oficial",
    "chips": ["Corte R$ 30", "Corte+Barba R$ 50", "Barba R$ 20"],
    "icon": "calendar" }
]}
```

- O step de direção usa `skipIfAnswered: true`: escolhido no hub, ele
  some da navegação, mas a resposta continua no resumo e no WhatsApp
  (que iteram `dynamicSteps`, não só os visíveis).
- O hub inclui "Tabela Completa" (modal com os serviços da jornada)
  e "Chamar no Whats" (wa.me direto). No hub, card, cabeçalho e rodapé
  ficam pretos; os passos seguintes mantêm o tema claro.
- Imagens do hub são binárias: sobem pelo upload web do GitHub (o
  snapshot push só aceita UTF-8) e o SHA do blob deve ser conferido
  depois (`git hash-object` local vs. API).

## 6. Disponibilidade gerenciada (agendamento com horários livres)

`Tenant.booking` virou a grade do gestor (`src/lib/booking.ts`):

```json
"booking": {
  "slotDurationMinutes": 30,
  "schedule": { "mon": [["09:00","12:00"],["13:00","20:00"]], "sun": [] },
  "blockedSlots": ["2026-11-20T14:00"],
  "busyDates": ["2026-12-25"]
}
```

- `schedule`: intervalos por dia da semana (mon..sun); dia ausente ou
  vazio = fechado. `blockedSlots` fecha horários pontuais;
  `busyDates` fecha o dia inteiro (e aparece riscado na etapa de data).
- A etapa de horário é um step `single` com
  `"optionsSource": "bookingSlots"` e `"dependsOn": "barberDate"`:
  as opções são geradas na hora (só horários livres; hoje, os passados
  somem). Sem horários no dia, a etapa mostra o estado vazio com
  "Escolher outra data" (volta ao passo da data).
- Trocar a data descarta o horário escolhido (`dependsOn`).
- Etapa de data com `"allowNoDate": false` esconde "Ainda sem data"
  (a data vira obrigatória). O resumo da grade ("Segunda a sábado ·
  09h–12h e 13h–20h") aparece na etapa de data, gerado do `schedule`.
- **Edição pelo gestor:** hoje é via JSON do tenant (sem painel
  próprio) — o gestor pede a mudança e quem opera atualiza + deploy.
  Um painel self-service precisaria de backend/persistência.

## Fixture de teste: `/exemplo`

`public/tenants/exemplo.json` é um inquilino **fictício, claramente
marcado como teste interno** (fora do registro da landing em
`src/lib/tenants.ts`), com as 3 features ligadas: datas ocupadas
`2026-11-14` e `2026-12-05`, Pix fictício `exemplo-teste@nexolink.test`
(R$ 200) e 3 depoimentos fictícios. Acesse ` /exemplo` no preview/deploy
para validar tudo sem tocar em caio/lucas.
