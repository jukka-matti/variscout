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

  // Methodology Coach
  'coach.frame': 'Enquadrar',
  'coach.scout': 'Explorar',
  'coach.investigate': 'Investigar',
  'coach.improve': 'Melhorar',
  'coach.frameDesc': 'Definir o problema e estabelecer limites',
  'coach.scoutDesc': 'Recolher dados e explorar padrões',
  'coach.investigateDesc': 'Testar hipóteses e encontrar causas raiz',
  'coach.improveDesc': 'Implementar mudanças e verificar resultados',

  // Report KPIs
  'report.kpi.samples': 'Amostras',
  'report.kpi.mean': 'Média',
  'report.kpi.variation': 'Variação',
  'report.kpi.cpk': 'Cpk',
  'report.kpi.passRate': 'Taxa de aprovação',

  // AI Actions
  'ai.propose': 'Propor',
  'ai.applied': 'Aplicado',
  'ai.dismissed': 'Descartado',
  'ai.expired': 'Expirado',

  // Staged analysis
  'staged.before': 'Antes',
  'staged.after': 'Depois',
  'staged.comparison': 'Comparação',

  // Data input / Column mapping
  'data.mapHeading': 'Mapear seus dados',
  'data.confirmColumns': 'Confirmar colunas',
  'data.selectOutcome': 'Selecionar resultado',
  'data.selectFactors': 'Selecionar fatores',
  'data.analysisSection': 'Resumo da análise',
  'data.optional': 'opcional',
  'data.problemPlaceholder': 'Descreva o problema que você está investigando…',
  'data.outcomeDesc': 'A medição que você deseja analisar',
  'data.factorsDesc': 'Categorias que podem influenciar o resultado',
  'data.alreadyOutcome': 'Já selecionado como resultado',
  'data.showNumericOnly': 'Somente numéricos',
  'data.showCategoricalOnly': 'Somente categóricos',
  'data.showAllColumns': 'Todas as colunas',
  'data.improvementTarget': 'Meta de melhoria',
  'data.metric': 'Métrica',
  'data.startAnalysis': 'Iniciar análise',
  'data.applyChanges': 'Aplicar alterações',
  'data.addHypothesis': 'Adicionar hipótese',
  'data.removeHypothesis': 'Remover hipótese',
  'data.back': 'Voltar',

  // Paste screen
  'data.pasteInstructions': 'Cole seus dados aqui',
  'data.pasteSubtitle': 'Copie do Excel, CSV ou qualquer planilha',
  'data.useExample': 'Usar dados de exemplo',
  'data.analyzing': 'Analisando…',
  'data.tipWithData': 'Dica: Inclua cabeçalhos de coluna na primeira linha',
  'data.tipNoData': 'Dica: Tente colar dados de uma planilha ou arquivo CSV',

  // Data quality
  'quality.allValid': 'Todos os dados válidos',
  'quality.rowsReady': '{count} linhas prontas para análise',
  'quality.rowsExcluded': '{count} linhas excluídas',
  'quality.missingValues': 'Valores ausentes',
  'quality.nonNumeric': 'Valores não numéricos',
  'quality.noVariation': 'Sem variação',
  'quality.emptyColumn': 'Coluna vazia',
  'quality.noVariationWarning': 'Esta coluna não tem variação — todos os valores são idênticos',
  'quality.viewExcluded': 'Ver excluídos',
  'quality.viewAll': 'Ver todos',

  // Manual entry
  'manual.setupTitle': 'Entrada manual de dados',
  'manual.analysisMode': 'Modo de análise',
  'manual.standard': 'Padrão',
  'manual.standardDesc': 'Coluna de medição única com fatores opcionais',
  'manual.performance': 'Desempenho',
  'manual.performanceDesc': 'Múltiplos canais de medição (cabeçotes, cavidades)',
  'manual.outcome': 'Coluna de resultado',
  'manual.outcomeExample': 'ex. Peso, Comprimento, Temperatura',
  'manual.factors': 'Fatores',
  'manual.addFactor': 'Adicionar fator',
  'manual.measureLabel': 'Rótulo da medição',
  'manual.measureExample': 'ex. Cabeçote, Cavidade, Bico',
  'manual.channelCount': 'Número de canais',
  'manual.channelRange': '{min}–{max} canais',
  'manual.startEntry': 'Iniciar entrada',
  'manual.specs': 'Especificações',
  'manual.specsApplyAll': 'Aplicar a todos os canais',
  'manual.specsHelper': 'Definir limites de especificação para a coluna de resultado',

  // Chart legend
  'chart.legend.commonCause': 'Causa comum',
  'chart.legend.specialCause': 'Causa especial',
  'chart.legend.outOfSpec': 'Fora de especificação',
  'chart.legend.inControl': 'Sob controle',
  'chart.legend.randomVariation': 'Variação aleatória',
  'chart.legend.defect': 'Defeito do cliente',

  // Chart violations
  'chart.violation.aboveUsl': 'Acima do LSE ({value})',
  'chart.violation.belowLsl': 'Abaixo do LIE ({value})',
  'chart.violation.aboveUcl': 'Acima do LSC — causa especial',
  'chart.violation.belowLcl': 'Abaixo do LIC — causa especial',
  'chart.violation.aboveUclFavorable': 'Acima do LSC — deslocamento favorável',
  'chart.violation.belowLclFavorable': 'Abaixo do LIC — deslocamento favorável',
  'chart.violation.nelson2': 'Regra de Nelson 2 — sequência de {count}',
  'chart.violation.nelson3': 'Regra de Nelson 3 — tendência de {count}',

  // Investigation sidebar
  'investigation.phaseInitial': 'Reunir observações iniciais',
  'investigation.phaseDiverging': 'Explorar múltiplas hipóteses',
  'investigation.phaseValidating': 'Testar e validar hipóteses',
  'investigation.phaseConverging': 'Convergir para a causa raiz',
  'investigation.phaseImproving': 'Implementar e verificar mudanças',
  'investigation.pdcaTitle': 'Lista de verificação',
  'investigation.verifyChart': 'Gráfico I estável após mudança',
  'investigation.verifyStats': 'Cpk atinge a meta',
  'investigation.verifyBoxplot': 'Dispersão do boxplot reduzida',
  'investigation.verifySideEffects': 'Nenhum efeito colateral observado',
  'investigation.verifyOutcome': 'Resultado sustentado ao longo do tempo',
  'investigation.uninvestigated': 'Fatores não investigados',

  // Coach mobile phase titles
  'coach.frameTitle': 'Enquadrar o problema',
  'coach.scoutTitle': 'Explorar os dados',
  'coach.investigateTitle': 'Investigar causas',
  'coach.improveTitle': 'Melhorar o processo',

  // AI action tool labels
  'ai.tool.applyFilter': 'Aplicar filtro',
  'ai.tool.clearFilters': 'Limpar filtros',
  'ai.tool.switchFactor': 'Trocar fator',
  'ai.tool.createFinding': 'Criar constatação',
  'ai.tool.createHypothesis': 'Criar hipótese',
  'ai.tool.suggestAction': 'Sugerir ação',
  'ai.tool.shareFinding': 'Compartilhar constatação',
  'ai.tool.publishReport': 'Publicar relatório',
  'ai.tool.notifyOwners': 'Notificar responsáveis',

  // Report
  'report.kpi.inSpec': 'Dentro da espec.',

  // Table
  'table.noData': 'Nenhum dado para exibir',
  'table.page': 'Página {page} de {total}',
  'table.rowsPerPage': 'Linhas por página',
  'table.editHint': 'Clique em uma célula para editar',
  'table.excluded': 'Excluído',
  'table.deleteRow': 'Excluir linha',
  'table.addRow': 'Adicionar linha',
  'table.unsavedChanges': 'Alterações não salvas',

  // Specs
  'specs.title': 'Limites de especificação',
  'specs.advancedSettings': 'Configurações avançadas',
  'specs.apply': 'Aplicar especificações',
  'specs.noChanges': 'Nenhuma alteração para aplicar',
  'specs.editTitle': 'Editar especificações',
  'specs.lslLabel': 'Limite Inferior de Especificação (LIE)',
  'specs.uslLabel': 'Limite Superior de Especificação (LSE)',

  // Upgrade
  'upgrade.title': 'Atualização disponível',
  'upgrade.limitReached': 'Você atingiu o limite para este recurso',
  'upgrade.upgrade': 'Atualizar',
  'upgrade.viewOptions': 'Ver opções',
  'upgrade.featureLimit': '{feature} é limitado a {limit} neste plano',

  // Display toggles
  'display.violin': 'Diagrama de violino',
  'display.violinDesc': 'Mostrar formato da distribuição',
  'display.contribution': 'Contribuição',
  'display.contributionDesc': 'Mostrar contribuição da variação',
  'display.sort': 'Ordenar',
  'display.ascending': 'Crescente',
  'display.descending': 'Decrescente',

  // Stats panel
  'stats.summary': 'Estatísticas resumidas',
  'stats.histogram': 'Histograma',
  'stats.probPlot': 'Gráfico de probabilidade',
  'stats.editSpecs': 'Editar especificações',

  // WhatIf
  'whatif.adjustMean': 'Ajustar média',
  'whatif.reduceVariation': 'Reduzir variação',
  'whatif.currentProjected': 'Atual vs Projetado',
  'whatif.resetAdjustments': 'Redefinir ajustes',
  'whatif.yield': 'Rendimento projetado',

  // Chart violation details (parameterized)
  'chart.violation.nelson2.detail':
    'Regra de Nelson 2 — sequência de {count} {side} média (#{start}–{end})',
  'chart.violation.nelson3.detail':
    'Regra de Nelson 3 — tendência de {count} {direction} (#{start}–{end})',
  'chart.violation.side.above': 'acima',
  'chart.violation.side.below': 'abaixo',
  'chart.violation.direction.increasing': 'crescente',
  'chart.violation.direction.decreasing': 'decrescente',

  // Parameterized messages
  'data.rowsLoaded': '{count} linhas carregadas',
  'findings.countLabel': '{count} constatações',
};
