export interface OptionItem {
  id: string;
  label: string;
  description?: string;
}

export const OBJETIVO_OPTIONS: OptionItem[] = [
  { id: 'emagrecimento', label: 'Emagrecimento', description: 'Queima de gordura e definição corporal' },
  { id: 'hipertrofia', label: 'Hipertrofia', description: 'Ganho de massa muscular e força' },
  { id: 'saude', label: 'Saúde', description: 'Disposição, bem-estar e longevidade' },
  { id: 'performance', label: 'Performance', description: 'Melhora de rendimento e condicionamento' },
  { id: 'reabilitacao', label: 'Reabilitação', description: 'Alívio de dores e correção postural' },
  { id: 'pos-parto', label: 'Pós-parto', description: 'Recuperação funcional segura e gradual' },
];

export const EXPERIENCE_OPTIONS: OptionItem[] = [
  { id: 'nunca-treinou', label: 'Nunca treinou', description: 'Começando do zero absoluto' },
  { id: 'parado', label: 'Parado no momento', description: 'Já treinou antes, mas sem constância' },
  { id: 'as-vezes', label: 'Treina às vezes', description: 'Sem frequência fixa semanal' },
  { id: 'constante', label: 'Constante', description: 'Rotina ativa, buscando evolução' },
];

export const RESTRICTIONS_OPTIONS: OptionItem[] = [
  { id: 'nenhuma', label: 'Nenhuma' },
  { id: 'joelho', label: 'Joelho' },
  { id: 'ombro', label: 'Ombro' },
  { id: 'coluna', label: 'Coluna' },
  { id: 'coracao', label: 'Coração' },
  { id: 'diabetes', label: 'Diabetes' },
  { id: 'gestante', label: 'Gestante' },
  { id: 'outra', label: 'Outra' },
];

export const AVAILABILITY_OPTIONS: OptionItem[] = [
  { id: '2-3x', label: '2-3x por semana' },
  { id: '4-5x', label: '4-5x por semana' },
  { id: 'todos-os-dias', label: 'Todos os dias' },
  { id: 'indefinido', label: 'Indefinido' },
];

export const MODALITY_OPTIONS: OptionItem[] = [
  { id: 'presencial', label: 'Presencial' },
  { id: 'online', label: 'Online' },
  { id: 'tanto-faz', label: 'Tanto faz' },
];

export function getLabel(options: OptionItem[], id: string, fallback?: string): string {
  const match = options.find((item) => item.id === id);
  return match ? match.label : (fallback ?? id);
}

export function getMultipleLabels(options: OptionItem[], ids: string[]): string {
  if (!ids || ids.length === 0 || ids.includes('nenhuma')) {
    return 'Nenhuma';
  }
  const labels = ids
    .map((id) => getLabel(options, id))
    .filter(Boolean);
  return labels.length > 0 ? labels.join(', ') : 'Nenhuma';
}
