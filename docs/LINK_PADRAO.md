# Padrão de Links — Nexo Link

> Decisão do Igor em 14/10/2026: **um projeto, um link padrão por cliente**.

## O padrão

```
{domínio}/{cliente}
```

Exemplos:

| Cliente | Link canônico |
|---|---|
| Caio Oliveira | `vertor.link/caio` (hoje: `nexo-link.vercel.app/caio`) |
| Lucas | `vertor.link/lucas` (hoje: `nexo-link.vercel.app/lucas`) |

- **A marca vive no domínio, nunca no slug.** Quando a raiz migrar de `nexo-link.vercel.app`
  para o domínio próprio (ex.: Vertor), nenhum link de cliente quebra — é só DNS.
- **Sem prefixo `/p/` no canônico.** URLs antigas com `/p/` continuam funcionando via
  redirect permanente (308): `/p/caiooliveira` → `/caio`, `/p/lucaspersonal` → `/lucas`.
- **A raiz `/`** é a landing institucional do produto (vitrine + lista de clientes),
  não redireciona para nenhum cliente específico.

## Convenção de slug

- Primeiro nome, minúsculo, sem acento, sem espaço: `caio`, `lucas`, `maria`
- Colisão (dois "Caio"): usar sobrenome → `caiooliveira`, ou número → `caio2`
- Caracteres permitidos: `a-z`, `0-9`, `-` (2 a 40 chars — validado em `api/lead.ts`)

## Onboarding de novo cliente (novo link no ar)

1. Copie `public/tenants/caio.json` para `public/tenants/{slug}.json`
2. Ajuste no JSON: `slug`, `name`, `profession`, `tagline`, `photo`, `whatsapp`,
   `journey.steps`, `theme`
3. Adicione **uma linha** em `src/lib/tenants.ts` (registro usado pela landing `/`)
4. Commit + deploy — o link `{domínio}/{slug}` entra no ar automaticamente

Nada de novo projeto, repo ou config de infra por cliente.

## Arquivos envolvidos

| Arquivo | Papel |
|---|---|
| `public/tenants/{slug}.json` | Dados do cliente (jornada, tema, WhatsApp) |
| `src/lib/tenants.ts` | Registro de clientes (landing `/`) |
| `src/components/Home.tsx` | Landing institucional da raiz |
| `src/App.tsx` | Rotas: `/` → Home, `/:slug` → cliente, `/p/:slug` → redirect |
| `vercel.json` | Redirects 308 dos slugs antigos |
