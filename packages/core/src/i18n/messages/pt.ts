import type { MessageCatalog } from '../types';

/**
 * Portuguese message catalog
 */
export const pt: MessageCatalog = {
  // Statistics labels
  'stats.mean': 'Média',
  'stats.median': 'Mediana',
  'stats.stdDev': 'Desvio Pad.',
  'stats.samples': 'Amostras',
  'stats.passRate': 'Taxa de aprovação',
  'stats.range': 'Amplitude',
  'stats.min': 'Mín',
  'stats.max': 'Máx',
  'stats.target': 'Meta',
  'stats.sigma': 'Sigma',

  // Chart labels
  'chart.observation': 'Observação',
  'chart.count': 'Contagem',
  'chart.frequency': 'Frequência',
  'chart.value': 'Valor',
  'chart.category': 'Categoria',
  'chart.cumulative': 'Acumulado %',

  // Limit labels
  'limits.usl': 'LSE',
  'limits.lsl': 'LIE',
  'limits.ucl': 'LSC',
  'limits.lcl': 'LIC',
  'limits.mean': 'Média',
  'limits.target': 'Meta',

  // Action buttons
  'action.save': 'Salvar',
  'action.cancel': 'Cancelar',
  'action.delete': 'Excluir',
  'action.edit': 'Editar',
  'action.copy': 'Copiar',
  'action.close': 'Fechar',
  'action.learnMore': 'Saiba mais',
  'action.download': 'Baixar',
  'action.apply': 'Aplicar',
  'action.reset': 'Redefinir',

  // Empty states
  'empty.noData': 'Nenhum dado disponível',
  'empty.noFindings': 'Nenhuma constatação ainda',
  'empty.noResults': 'Nenhum resultado encontrado',

  // Error messages
  'error.generic': 'Algo deu errado',
  'error.loadFailed': 'Falha ao carregar dados',
  'error.parseFailed': 'Falha ao processar arquivo',

  // Settings labels
  'settings.language': 'Idioma',
  'settings.theme': 'Tema',
  'settings.textSize': 'Tamanho do texto',

  // Finding statuses
  'findings.observed': 'Observado',
  'findings.investigating': 'Investigando',
  'findings.analyzed': 'Analisado',
  'findings.improving': 'Melhorando',
  'findings.resolved': 'Resolvido',

  // Report labels
  'report.summary': 'Resumo',
  'report.findings': 'Constatações',
  'report.recommendations': 'Recomendações',
  'report.evidence': 'Evidência',

  // Data input labels
  'data.pasteData': 'Colar dados',
  'data.uploadFile': 'Enviar arquivo',
  'data.columnMapping': 'Mapeamento de colunas',
  'data.measureColumn': 'Coluna de medida',
  'data.factorColumn': 'Coluna de fator',
};
