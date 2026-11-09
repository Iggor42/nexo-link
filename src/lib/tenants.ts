/**
 * Registro de inquilinos do Nexo Link.
 *
 * PADRÃO DE LINK (docs/LINK_PADRAO.md):
 *   {domínio}/{slug}  →  ex.: vertor.link/caio
 *
 * Para onboardar um novo cliente:
 *   1. Copie public/tenants/_template.json para public/tenants/{slug}.json
 *      (slug = primeiro nome, minúsculo, sem acento/espaço; ex.: "caio")
 *   2. Preencha os dados no JSON
 *   3. Adicione UMA linha neste registro
 *   4. Deploy — o link entra no ar automaticamente
 */
export interface TenantEntry {
  slug: string;
  name: string;
  profession: string;
}

export const TENANTS: TenantEntry[] = [
  { slug: 'caio', name: 'Caio Oliveira', profession: 'Barman & Coquetelaria Premium para Eventos' },
  { slug: 'lucas', name: 'Lucas', profession: 'Personal Trainer · Emagrecimento e Hipertrofia' },
  { slug: 'akis', name: 'Akis', profession: 'Barbearia | Loja Masculina' },
];
