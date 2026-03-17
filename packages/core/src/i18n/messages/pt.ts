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
  'chart.clickToEdit': 'Clique para editar',
  'chart.median': 'Mediana',
  'chart.q1': 'Q1',
  'chart.q3': 'Q3',
  'chart.noChannelData': 'Sem dados do canal',
  'chart.selectChannel': 'Selecionar canal',

  // Limit labels (ABNT standard)
  'limits.usl': 'LSE',
  'limits.lsl': 'LIE',
  'limits.ucl': 'LSC',
  'limits.lcl': 'LIC',
  'limits.mean': 'Média',
  'limits.target': 'Meta',

  // Navigation
  'nav.newAnalysis': 'Nova análise',
  'nav.backToDashboard': 'Voltar ao painel',
  'nav.settings': 'Configurações',
  'nav.export': 'Exportar',
  'nav.presentation': 'Apresentação',
  'nav.menu': 'Menu',
  'nav.moreActions': 'Mais ações',

  // Panel titles
  'panel.findings': 'Constatações',
  'panel.dataTable': 'Tabela de dados',
  'panel.whatIf': 'E se',
  'panel.investigation': 'Investigação',
  'panel.coScout': 'CoScout',
  'panel.drillPath': 'Caminho de análise',

  // View modes
  'view.list': 'Lista',
  'view.board': 'Quadro',
  'view.tree': 'Árvore',

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
  'action.retry': 'Tentar novamente',
  'action.send': 'Enviar',
  'action.ask': 'Perguntar',
  'action.clear': 'Limpar',
  'action.copyAll': 'Copiar tudo',
  'action.selectAll': 'Selecionar tudo',

  // CoScout
  'coscout.send': 'Enviar',
  'coscout.clear': 'Limpar conversa',
  'coscout.stop': 'Parar',
  'coscout.rateLimit': 'Limite de taxa atingido. Por favor aguarde.',
  'coscout.contentFilter': 'Conteúdo filtrado pela política de segurança.',
  'coscout.error': 'Ocorreu um erro. Por favor tente novamente.',

  // Display/settings
  'display.preferences': 'Preferências',
  'display.chartTextSize': 'Tamanho do texto do gráfico',
  'display.compact': 'Compacto',
  'display.normal': 'Normal',
  'display.large': 'Grande',
  'display.lockYAxis': 'Bloquear eixo Y',
  'display.filterContext': 'Contexto de filtro',
  'display.showSpecs': 'Mostrar especificações',

  // Investigation
  'investigation.brief': 'Resumo da investigação',
  'investigation.assignedToMe': 'Atribuído a mim',
  'investigation.hypothesis': 'Hipótese',
  'investigation.hypotheses': 'Hipóteses',
  'investigation.pinAsFinding': 'Fixar como constatação',
  'investigation.addObservation': 'Adicionar observação',

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
  'data.addData': 'Adicionar dados',
  'data.editData': 'Editar dados',
  'data.showDataTable': 'Mostrar tabela de dados',
  'data.hideDataTable': 'Ocultar tabela de dados',

  // Status
  'status.cached': 'Em cache',
  'status.loading': 'Carregando',
  'status.ai': 'IA',
};
