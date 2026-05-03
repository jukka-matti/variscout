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
  'display.density': 'Densidade de exibição',
  'display.lockYAxis': 'Bloquear eixo Y',
  'display.filterContext': 'Contexto de filtro',
  'display.showSpecs': 'Mostrar especificações',

  // Investigation
  'investigation.brief': 'Resumo da investigação',
  'investigation.assignedToMe': 'Atribuído a mim',
  'investigation.question': 'Question',
  'investigation.questions': 'Questions',
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
  'data.issueStatementPlaceholder': 'Descreva o que você deseja investigar…',
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
  'data.addQuestion': 'Adicionar hipótese',
  'data.removeQuestion': 'Remover hipótese',
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

  // AI action tool labels
  'ai.tool.applyFilter': 'Aplicar filtro',
  'ai.tool.clearFilters': 'Limpar filtros',
  'ai.tool.switchFactor': 'Trocar fator',
  'ai.tool.createFinding': 'Criar constatação',
  'ai.tool.createQuestion': 'Criar hipótese',
  'ai.tool.suggestAction': 'Sugerir ação',
  'ai.tool.shareFinding': 'Compartilhar constatação',
  'ai.tool.publishReport': 'Publicar relatório',
  'ai.tool.notifyOwners': 'Notificar responsáveis',
  'ai.tool.suggestIdea': 'Sugerir ideia de melhoria',
  'ai.tool.sparkBrainstorm': 'Spark brainstorm ideas',
  'ai.tool.suggestSaveFinding': 'Save insight',
  'ai.tool.navigateTo': 'Navigate to',
  'ai.tool.answerQuestion': 'Answer question',
  'ai.tool.suggestSuspectedCause': 'Suggest suspected cause',
  'ai.tool.connectHubEvidence': 'Connect hub evidence',
  'ai.tool.suggestCausalLink': 'Suggest causal link',
  'ai.tool.highlightMapPattern': 'Highlight map pattern',

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
  'table.showAll': 'Mostrar tudo',

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
  'display.etaSquared': 'η²',
  'display.etaSquaredDesc': 'Mostrar η² (tamanho do efeito)',
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

  // Chart limit labels
  'chart.label.ucl': 'LSC:',
  'chart.label.lcl': 'LIC:',
  'chart.label.mean': 'Média:',
  'chart.label.tgt': 'Meta:',
  'chart.label.usl': 'LSE:',
  'chart.label.lsl': 'LIE:',
  'chart.label.value': 'Valor:',
  'chart.label.n': 'n:',
  'chart.label.target': 'Meta:',

  // Chart status
  'chart.status.inControl': 'Sob controle',
  'chart.status.outOfControl': 'Fora de controle (além dos LSC/LIC)',
  'chart.noDataProbPlot': 'Sem dados disponíveis para o gráfico de probabilidade',

  // Chart edit affordances
  'chart.edit.spec': 'Clique para editar {spec}',
  'chart.edit.axisLabel': 'Clique para editar o rótulo do eixo',
  'chart.edit.yAxis': 'Clique para editar a escala do eixo Y',
  'chart.edit.saveCancel': 'Enter para salvar · Esc para cancelar',

  // Performance table headers
  'chart.table.channel': 'Canal',
  'stats.cp': 'Cp',

  // Chart UI labels
  'chart.copyToClipboard': 'Copiar gráfico para a área de transferência',
  'chart.maximize': 'Maximizar gráfico',
  'chart.type.ichart': 'I-Chart',
  'chart.type.boxplot': 'Boxplot',
  'chart.type.pareto': 'Pareto',
  'chart.drillHere': '↓ explorar aqui',
  'chart.percent': 'Percentual',
  'boxplot.factor.label': 'Factor',

  // Y-axis popover
  'chart.yAxisScale': 'Escala do eixo Y',
  'validation.minLessThanMax': 'Mín deve ser menor que Máx',
  'action.noChanges': 'Sem alterações',

  // Create factor modal
  'factor.create': 'Criar fator a partir da seleção',
  'factor.name': 'Nome do fator',
  'factor.nameEmpty': 'O nome do fator não pode estar vazio',
  'factor.nameExists': 'Um fator com este nome já existe',
  'factor.example': 'ex., Eventos de alta temperatura',
  'factor.pointsMarked': '{count} pontos serão marcados como:',
  'factor.createAndFilter': 'Criar e filtrar',
  'factor.filterExplanation':
    'A visualização será filtrada automaticamente para mostrar apenas os pontos selecionados.',

  // Characteristic type selector
  'charType.nominal': 'Nominal',
  'charType.nominalDesc': 'Centrado no alvo (ex., peso de enchimento)',
  'charType.smaller': 'Menor é melhor',
  'charType.smallerDesc': 'Mais baixo é melhor (ex., defeitos)',
  'charType.larger': 'Maior é melhor',
  'charType.largerDesc': 'Mais alto é melhor (ex., rendimento)',

  // Investigation prompt
  'investigation.trackingPrompt':
    'Acompanhando sua investigação — abra o painel de investigação para ver o quadro completo.',

  // Mobile category sheet
  'chart.highlight': 'Destacar:',
  'chart.highlightRed': 'Vermelho',
  'chart.highlightAmber': 'Âmbar',
  'chart.highlightGreen': 'Verde',
  'chart.clearHighlight': 'Remover destaque',
  'chart.drillDown': 'Explorar "{category}"',
  'ai.askCoScout': 'Perguntar ao CoScout sobre isso',

  // Settings descriptions
  'display.lockYAxisDesc': 'Mantém a escala para comparação visual',
  'display.filterContextDesc': 'Exibir resumo de filtros ativos abaixo dos cabeçalhos dos gráficos',

  // Performance detected modal
  'performance.detected': 'Modo de desempenho detectado',
  'performance.columnsFound': '{count} colunas de medição encontradas',
  'performance.labelQuestion': 'O que esses canais de medição representam?',
  'performance.labelExample': 'ex., Cabeçote de enchimento, Cavidade, Bocal',
  'performance.enable': 'Ativar modo de desempenho',

  // Finding editor & data types
  'finding.placeholder': 'O que você encontrou?',
  'finding.note': 'Nota da constatação',
  'data.typeNumeric': 'Numérico',
  'data.typeCategorical': 'Categórico',
  'data.typeDate': 'Data',
  'data.typeText': 'Texto',
  'data.categories': 'categorias',

  // PWA HomeScreen
  'home.heading': 'Explorar análise de variação',
  'home.description':
    'Ferramenta gratuita de treinamento em análise de variação. Visualize a variabilidade, calcule a capacidade e encontre onde focar — diretamente no seu navegador.',
  'home.divider': 'ou use seus próprios dados',
  'home.pasteHelper': 'Copie linhas e cole — detectaremos as colunas automaticamente',
  'home.manualEntry': 'Ou insira dados manualmente',
  'home.upgradeHint': 'Precisa de recursos de equipe, upload de arquivos ou projetos salvos?',

  // PWA navigation
  'nav.presentationMode': 'Modo apresentação',
  'nav.hideFindings': 'Ocultar constatações',

  // Export
  'export.asImage': 'Exportar como imagem',
  'export.asCsv': 'Exportar como CSV',
  'export.imageDesc': 'Captura PNG para apresentações',
  'export.csvDesc': 'Arquivo de dados compatível com planilha',

  // Sample section
  'sample.heading': 'Experimente um conjunto de dados de exemplo',
  'sample.allSamples': 'Todos os conjuntos de dados de exemplo',
  'sample.featured': 'Destaques',
  'sample.caseStudies': 'Estudos de caso',
  'sample.journeys': 'Jornadas de aprendizagem',
  'sample.industry': 'Exemplos da indústria',

  // View modes
  'view.stats': 'Estatísticas',
  'display.appearance': 'Aparência',

  // Azure toolbar
  'data.manualEntry': 'Entrada manual',
  'data.editTable': 'Editar tabela de dados',
  'toolbar.saveAs': 'Salvar como…',
  'toolbar.saving': 'Salvando…',
  'toolbar.saved': 'Salvo',
  'toolbar.saveFailed': 'Falha ao salvar',
  'toolbar.addMore': 'Adicionar dados',
  'report.scouting': 'Relatório de exploração',
  'export.csvFiltered': 'Exportar dados filtrados como CSV',
  'error.auth': 'Erro de autenticação',

  // File browse
  'file.browseLocal': 'Explorar este dispositivo',
  'file.browseSharePoint': 'Explorar SharePoint',
  'file.open': 'Abrir arquivo',

  // Admin hub
  'admin.title': 'Admin',
  'admin.status': 'Status',
  'admin.plan': 'Plano e recursos',
  'admin.teams': 'Configuração do Teams',
  'admin.knowledge': 'Base de conhecimento',
  'admin.troubleshooting': 'Solução de problemas',

  // Admin plan tab
  'admin.currentPlan': 'Atual',
  'admin.feature': 'Recurso',
  'admin.manageSubscription': 'Gerenciar assinatura no Azure',
  'admin.planStandard': 'Standard',
  'admin.planTeam': 'Team',
  'admin.planStandardPrice': '€79/mês',
  'admin.planTeamPrice': '€199/mês',
  'admin.planStandardDesc': 'Análise completa com CoScout AI',
  'admin.planTeamDesc': 'Teams, OneDrive, SharePoint, base de conhecimento',

  // Feature names
  'feature.charts': 'I-Chart, Boxplot, Pareto, Estatísticas',
  'feature.capability': 'Análise de capacidade (Cp/Cpk)',
  'feature.performance': 'Modo de desempenho (multicanal)',
  'feature.anova': 'ANOVA e análise fatorial',
  'feature.findingsWorkflow': 'Constatações e fluxo de investigação',
  'feature.whatIf': 'Simulação e se',
  'feature.csvImport': 'Importação CSV/Excel',
  'feature.reportExport': 'Exportação de relatórios (PDF)',
  'feature.indexedDb': 'Armazenamento local IndexedDB',
  'feature.maxFactors': 'Até 6 fatores',
  'feature.maxRows': 'Até 250K linhas',
  'feature.onedriveSync': 'Sincronização de projetos OneDrive',
  'feature.sharepointPicker': 'Seletor de arquivos SharePoint',
  'feature.teamsIntegration': 'Integração com Microsoft Teams',
  'feature.channelCollab': 'Colaboração baseada em canais',
  'feature.mobileUi': 'Interface otimizada para dispositivos móveis',
  'feature.coScoutAi': 'Assistente CoScout AI',
  'feature.narrativeBar': 'Insights do NarrativeBar',
  'feature.chartInsights': 'Chips de insights de gráficos',
  'feature.knowledgeBase': 'Base de conhecimento (pesquisa SharePoint)',
  'feature.aiActions': 'Ações sugeridas por IA',

  // Admin Teams setup
  'admin.teams.heading': 'Adicionar VariScout ao Microsoft Teams',
  'admin.teams.description':
    'Gere um pacote de aplicativo Teams para sua implantação e envie-o para o centro de administração do Teams.',
  'admin.teams.running': 'Executando dentro do Microsoft Teams',
  'admin.teams.step1': 'ID do cliente do registro de aplicativo (Opcional)',
  'admin.teams.step1Desc':
    'Insira o ID do cliente do registro de aplicativo Azure AD para habilitar o SSO do Teams no manifesto.',
  'admin.teams.step2': 'Baixar o pacote de aplicativo Teams',
  'admin.teams.step2Desc':
    'Este .zip contém o manifesto e os ícones pré-configurados para sua implantação.',
  'admin.teams.step3': 'Enviar para o centro de administração do Teams',
  'admin.teams.step4': 'Adicionar VariScout a um canal',
  'admin.teams.download': 'Baixar pacote de aplicativo Teams',

  // Admin status tab
  'admin.checksResult': '{pass}/{total} verificações aprovadas',
  'admin.runChecks': 'Executar todas as verificações',
  'admin.notApplicable': 'Não se aplica ao seu plano',
  'admin.managePortal': 'Gerenciar no Azure Portal',
  'admin.portalAccessNote':
    'Estes itens requerem acesso ao Azure Portal e não podem ser verificados pelo navegador.',
  'admin.fixInPortal': 'Corrigir no Azure Portal: {label}',

  // Admin troubleshoot tab
  'admin.troubleshoot.intro':
    'Problemas comuns e como corrigi-los. Clique em um problema para ver instruções passo a passo.',
  'admin.runCheck': 'Executar verificação',
  'admin.checkPassed': 'Verificação aprovada — pode não ser o problema.',
  'admin.checkFailed': 'Verificação falhou — siga os passos abaixo.',
  'admin.issue.signin': 'Usuários não conseguem fazer login',
  'admin.issue.signinDesc':
    'A autenticação Azure AD não está funcionando ou os usuários veem uma página em branco.',
  'admin.issue.signinSteps':
    'Verifique se a autenticação do App Service está habilitada no Azure Portal.\nVerifique se o registro de aplicativo Azure AD tem as URIs de redirecionamento corretas.\nCertifique-se de que o registro de aplicativo tem "Tokens de ID" habilitados em Autenticação.\nVerifique se o locatário permite o login de usuários no aplicativo (Aplicativos empresariais → Propriedades → Habilitado para login de usuários).',
  'admin.issue.onedrive': 'A sincronização do OneDrive não funciona',
  'admin.issue.onedriveDesc':
    'Os projetos não estão sincronizando com o OneDrive ou os usuários veem erros de permissão.',
  'admin.issue.onedriveSteps':
    'Verifique se o registro de aplicativo tem a permissão delegada "Files.ReadWrite".\nVerifique se o consentimento do administrador foi concedido para as permissões do Graph.\nCertifique-se de que o usuário tem uma licença do OneDrive atribuída.\nTente fazer logout e login novamente para atualizar o token.',
  'admin.issue.coscout': 'CoScout não responde',
  'admin.issue.coscoutDesc': 'O assistente de IA não gera respostas ou mostra erros.',
  'admin.issue.coscoutSteps':
    'Verifique se o endpoint de IA está configurado no modelo ARM / configurações do App Service.\nVerifique se o recurso Azure AI Services está implantado e em execução.\nVerifique se a implantação do modelo existe (ex., gpt-4o) no recurso AI Services.\nVerifique as cotas do Azure AI Services — a implantação pode ter atingido os limites de taxa.',
  'admin.issue.kbEmpty': 'A base de conhecimento não retorna resultados',
  'admin.issue.kbEmptyDesc':
    '"Pesquisar base de conhecimento" do CoScout não encontra nada apesar dos documentos existirem.',
  'admin.issue.kbEmptySteps':
    'Verifique se o endpoint do AI Search está configurado nas configurações do App Service.\nVerifique se a fonte de conhecimento remota do SharePoint foi criada no AI Search.\nCertifique-se de que ≥1 licença Microsoft 365 Copilot esteja ativa no locatário.\nVerifique se o usuário tem acesso SharePoint aos documentos pesquisados.\nVerifique se o botão de pré-visualização da base de conhecimento está habilitado (Admin → aba Base de conhecimento).',
  'admin.issue.teamsTab': 'A aba do Teams não aparece',
  'admin.issue.teamsTabDesc': 'VariScout não aparece no Teams ou a aba não carrega.',
  'admin.issue.teamsTabSteps':
    'Verifique se o pacote de aplicativo Teams (.zip) foi enviado para o centro de administração do Teams.\nVerifique se o contentUrl no manifest.json corresponde à URL do seu App Service.\nCertifique-se de que o aplicativo está aprovado no centro de administração do Teams (não bloqueado por política).\nTente remover e adicionar novamente a aba no canal.\nSe estiver usando um domínio personalizado, verifique se ele está no array validDomains do manifesto.',
  'admin.issue.newUser': 'Novo usuário não consegue acessar o aplicativo',
  'admin.issue.newUserDesc':
    'Um usuário recém-adicionado vê acesso negado ou uma página em branco.',
  'admin.issue.newUserSteps':
    'No Azure AD, vá para Aplicativos empresariais → VariScout → Usuários e grupos.\nAdicione o usuário ou seu grupo de segurança ao aplicativo.\nSe estiver usando "Atribuição de usuário obrigatória", certifique-se de que o usuário tem uma atribuição.\nVerifique as políticas de acesso condicional que podem bloquear o usuário.',
  'admin.issue.aiSlow': 'As respostas de IA são lentas',
  'admin.issue.aiSlowDesc':
    'CoScout demora muito para responder ou frequentemente apresenta timeout.',
  'admin.issue.aiSlowSteps':
    'Verifique a região de implantação do Azure AI Services — a latência aumenta com a distância.\nVerifique se a implantação do modelo tem cota suficiente de TPM (tokens por minuto).\nConsidere atualizar para uma implantação de throughput provisionado para latência consistente.\nVerifique se o índice do AI Search é grande — considere otimizar a fonte de conhecimento.',
  'admin.issue.forbidden': 'Erros "Forbidden"',
  'admin.issue.forbiddenDesc': 'Os usuários veem erros 403 ao acessar determinados recursos.',
  'admin.issue.forbiddenSteps':
    'Verifique se todas as permissões necessárias da Graph API têm consentimento do administrador.\nVerifique se o armazenamento de tokens de autenticação do App Service está habilitado.\nCertifique-se de que o token do usuário não expirou — tente fazer logout e login novamente.\nVerifique as políticas de acesso condicional do locatário.',
  'admin.issue.kbPartial': 'KB falha para alguns usuários',
  'admin.issue.kbPartialDesc':
    'A pesquisa na base de conhecimento funciona para administradores mas não para outros usuários.',
  'admin.issue.kbPartialSteps':
    'Fontes de conhecimento remotas do SharePoint usam permissões por usuário. Cada usuário deve ter acesso SharePoint aos documentos.\nVerifique se os usuários afetados estão bloqueados por políticas de acesso condicional.\nVerifique se o consentimento do administrador foi concedido para a permissão delegada Sites.Read.All.\nPeça aos usuários afetados para fazer logout e login novamente para atualizar seu token.',

  // Workspace navigation
  'workspace.analysis': 'Analysis',
  'workspace.findings': 'Findings',
  'workspace.improvement': 'Improvement',

  // Synthesis card
  'synthesis.title': 'Suspected Cause',
  'synthesis.placeholder': 'The evidence points to…',
  'synthesis.coachNudge': 'Ready to summarize your understanding?',
  'synthesis.maxLength': 'Max 500 characters',

  // Improvement workspace
  'improve.title': 'Improvement Plan',
  'improve.backToAnalysis': 'Back to Analysis',
  'improve.fourDirections': 'Think: Prevent · Detect · Simplify · Eliminate',
  'improve.convertToActions': 'Convert selected → Actions',
  'improve.noIdeas': 'No improvement ideas yet',
  'improve.emptyNoFindings':
    'Pin findings from the Analysis view, then brainstorm improvement ideas here.',
  'improve.emptyNoSupported':
    'Answer your questions in the investigation. Answered questions unlock improvement brainstorming.',
  'improve.selectedCount': '{count} selected',
  'improve.timeframeBreakdown': '{low} low · {medium} med · {high} high',
  'improve.projectedCpk': 'Best projected Cpk: {value}',
  'improve.targetDelta': 'Δ {delta} to target',
  'improve.convertedToAction': '→ Action',

  // Effort labels
  'timeframe.justDo': 'Low',
  'timeframe.weeks': 'Medium',
  'timeframe.months': 'High',
  'timeframe.days': 'Days',
  'timeframe.justDo.description': 'Right now, existing resources, no approval needed',
  'timeframe.days.description': 'Minor coordination, can be done this week',
  'timeframe.weeks.description': 'Requires planning, moderate resources',
  'timeframe.months.description': 'Investment, cross-team, significant planning',
  'cost.label': 'Cost',
  'cost.none': 'None',
  'cost.low': 'Low',
  'cost.medium': 'Medium',
  'cost.high': 'High',
  'cost.amount': '€{amount}',
  'cost.budget': '€{spent} / €{budget}',
  'risk.label': 'Risk',
  'risk.low': 'Low',
  'risk.medium': 'Medium',
  'risk.high': 'High',
  'risk.veryHigh': 'Very high',
  'risk.notSet': 'Not set',
  'risk.axis1Label': '{axis} Impact',
  'risk.small': 'Small',
  'risk.significant': 'Significant',
  'risk.severe': 'Severe',
  'risk.none': 'None',
  'risk.possible': 'Possible',
  'risk.immediate': 'Immediate',
  'risk.preset.process': 'Process',
  'risk.preset.safety': 'Safety',
  'risk.preset.environmental': 'Environmental',
  'risk.preset.quality': 'Quality',
  'risk.preset.regulatory': 'Regulatory',
  'risk.preset.brand': 'Brand',
  'matrix.title': 'Prioritization Matrix',
  'matrix.listView': 'List',
  'matrix.matrixView': 'Matrix',
  'matrix.yAxis': 'Y-Axis',
  'matrix.xAxis': 'X-Axis',
  'matrix.color': 'Color',
  'matrix.preset.bangForBuck': 'Bang for Buck',
  'matrix.preset.quickImpact': 'Quick Impact',
  'matrix.preset.riskReward': 'Risk-Reward',
  'matrix.preset.budgetView': 'Budget View',
  'matrix.quickWins': 'Quick Wins',
  'matrix.clickToSelect': 'Click to select',
  'improve.maxRisk': 'Max risk: {level}',
  'improve.totalCost': '€{amount}',
  'improve.budgetStatus': '€{spent} / €{budget}',
  'improve.actionsDone': 'actions done',
  'improve.overdue': 'overdue',
  'improve.addVerification': 'Add verification',
  'improve.assessOutcome': 'Assess outcome',
  'improve.viewActions': 'View Actions',
  'improve.actions': 'actions',
  'improve.done': 'done',

  // Brainstorm modal
  'brainstorm.title': 'Brainstorm',
  'brainstorm.subtitle': 'No judging yet — just ideas',
  'brainstorm.selectSubtitle': 'Tap ideas to select',
  'brainstorm.inputPlaceholder': '+ type an idea...',
  'brainstorm.doneBrainstorming': 'Done brainstorming →',
  'brainstorm.addToPlan': 'Add {count} to plan →',
  'brainstorm.back': '← Back',
  'brainstorm.sparkMore': 'Spark more',
  'brainstorm.inviteTeam': 'Invite team',
  'brainstorm.copyLink': 'Copy link',
  'brainstorm.ideaCount': '{count} ideas · {directions} directions',
  'brainstorm.selectedCount': '{selected} of {total} selected',
  'brainstorm.parkedLabel': 'Parked ideas',
  'brainstorm.triggerButton': 'Brainstorm',
  'brainstorm.joinToast.title': 'Brainstorm session started',
  'brainstorm.joinToast.body': '{name} started brainstorming ideas for {cause}',
  'brainstorm.joinToast.join': 'Join session',
  'brainstorm.joinToast.later': 'Later',

  'timeframe.label': 'Effort',

  // Idea direction labels (Four Ideation Directions)
  'settings.improvementEvaluation': 'Improvement Evaluation',
  'settings.riskAxis1': 'Risk Axis 1',
  'settings.riskAxis2': 'Risk Axis 2',
  'settings.improvementBudget': 'Improvement Budget',
  'matrix.selected': 'Selected',
  'matrix.axis.benefit': 'Benefit',
  'matrix.axis.timeframe': 'Timeframe',
  'matrix.axis.cost': 'Cost',
  'matrix.axis.risk': 'Risk',
  'benefit.low': 'Low',
  'benefit.medium': 'Medium',
  'benefit.high': 'High',
  'idea.direction': 'Direction',
  'idea.prevent': 'Prevent',
  'idea.detect': 'Detect',
  'idea.simplify': 'Simplify',
  'idea.eliminate': 'Eliminate',
  'idea.whatIfSimulator': 'What-If Simulator',
  'idea.askCoScout': 'Ask CoScout',
  'idea.delete': 'Delete idea',
  'idea.addPlaceholder': 'Add improvement idea...',
  'idea.addButton': 'Add',
  'idea.askCoScoutForIdeas': 'Ask CoScout for ideas',
  'idea.moreOptions': 'More options',
  'idea.riskAssessment': 'Risk assessment',

  // Question role labels
  'question.primary': 'Primary',
  'question.contributing': 'Contributing',

  // Projected vs actual
  'outcome.projectedVsActual': 'Projected {projected} → Actual {actual}',
  'outcome.delta': '({sign}{delta})',
  'improve.convergenceNudge':
    'Your evidence is converging \u2014 summarize what you\u2019ve learned in the Improvement Plan.',

  // Yamazumi (Time Study)
  'yamazumi.detected.title': 'Time Study Data Detected',
  'yamazumi.detected.confidence': 'confidence',
  'yamazumi.detected.description':
    'Your data contains activity type classifications and cycle times suitable for Yamazumi analysis.',
  'yamazumi.detected.activityType': 'Activity Type',
  'yamazumi.detected.cycleTime': 'Cycle Time',
  'yamazumi.detected.step': 'Process Step',
  'yamazumi.detected.reason': 'Waste Reason',
  'yamazumi.detected.taktTime': 'Takt Time (optional)',
  'yamazumi.detected.taktPlaceholder': 'e.g., 120 seconds',
  'yamazumi.detected.decline': 'Use Standard Mode',
  'yamazumi.detected.enable': 'Enable Yamazumi Mode',

  // Defect detected modal
  'defect.detected.title': 'Defect Data Detected',
  'defect.detected.confidence': 'confidence',
  'defect.detected.dataShape': 'Data shape',
  'defect.detected.defectType': 'Defect type',
  'defect.detected.count': 'Count',
  'defect.detected.result': 'Result',
  'defect.detected.unitsProduced': 'Units produced',
  'defect.detected.aggregationUnit': 'Group defects by',
  'defect.detected.dismiss': 'Use Standard Mode',
  'defect.detected.enable': 'Enable Defect Mode',
  'yamazumi.metric.total': 'Total',
  'yamazumi.metric.va': 'VA',
  'yamazumi.metric.nva': 'NVA',
  'yamazumi.metric.waste': 'Waste',
  'yamazumi.metric.wait': 'Wait',
  'yamazumi.pareto.steps-total': 'Steps by Total Time',
  'yamazumi.pareto.steps-waste': 'Steps by Waste Time',
  'yamazumi.pareto.steps-nva': 'Steps by NVA Time',
  'yamazumi.pareto.activities': 'Activities by Time',
  'yamazumi.pareto.reasons': 'Waste Reasons',
  'yamazumi.summary.vaRatio': 'VA Ratio',
  'yamazumi.summary.efficiency': 'Process Efficiency',
  'yamazumi.summary.leadTime': 'Total Lead Time',
  'yamazumi.summary.takt': 'Takt Time',
  'yamazumi.summary.setTakt': 'Set',
  'yamazumi.summary.overTakt': 'steps over takt',
  'yamazumi.takt': 'Takt',
  'yamazumi.mode.label': 'Yamazumi',
  'yamazumi.mode.switch': 'Switch to Yamazumi',

  // Report workspace view
  'report.cpkLearningLoop': 'Cpk Learning Loop',
  'report.verdict.effective': 'Effective',
  'report.verdict.partiallyEffective': 'Partially effective',
  'report.verdict.notEffective': 'Not effective',
  'report.cpk.before': 'Before',
  'report.cpk.projected': 'Projected',
  'report.cpk.actual': 'Actual',
  'report.cpk.pendingVerification': 'Pending verification',
  'report.cpk.metProjection': 'Met projection',
  'report.cpk.fromProjection': '{delta} from projection',
  'report.questionTree': 'Question Tree',
  'report.question.answered': 'Answered',
  'report.question.investigating': 'Investigating',
  'report.question.ruledOut': 'Ruled Out',
  'report.question.open': 'Open',
  'report.type.analysisSnapshot': 'Analysis Snapshot',
  'report.type.investigationReport': 'Investigation Report',
  'report.type.improvementStory': 'Improvement Story',
  'report.sections': 'Sections',
  'report.audience.technical': 'Technical',
  'report.audience.summary': 'Summary',
  'report.workspace.analysis': 'ANALYSIS',
  'report.workspace.findings': 'FINDINGS',
  'report.workspace.improvement': 'IMPROVEMENT',
  'report.action.copyAllCharts': 'Copy All Charts',
  'report.action.saveAsPdf': 'Save as PDF',
  'report.action.shareReport': 'Share Report',
  'report.action.publishToSharePoint': 'Publish to SharePoint',
  'report.action.publishedToSharePoint': 'Published to SharePoint',
  'report.publish.rendering': 'Rendering report\u2026',
  'report.publish.uploading': 'Uploading\u2026',
  'report.publish.exists': 'Report already exists in SharePoint.',
  'report.publish.replace': 'Replace',
  'report.publish.failed': 'Publish failed',
  'report.publish.tryAgain': 'Try again',
  'report.selectedCount': '{count} selected',
  'report.bestProjectedCpk': 'Best projected Cpk: {value}',
  'report.meetsTarget': '(meets target)',
  'report.costCategory': '{category} cost',
  'report.noCost': 'No cost',
  'report.riskLevel': '{level} risk',

  // Factor Intelligence
  'fi.title': 'Inteligência de Fatores',
  'fi.ranking': 'Ranking de fatores (R² ajustado)',
  'fi.layer2': 'Camada 2 · Efeitos Principais',
  'fi.layer3': 'Camada 3 · Interações de Fatores',
  'fi.investigate': 'Investigar →',
  'fi.notSignificant': 'não significativo (p={value})',
  'fi.explainsSingle': '{factor} explica {pct}% da variação sozinho.',
  'fi.explainsMultiple': '{factors} juntos explicam {pct}% da variação.',
  'fi.layer2Locked': 'Camada 2 (Efeitos Principais) desbloqueia quando R²adj > {threshold}%',
  'fi.layer2Current': ' — atualmente {value}%',
  'fi.layer3Locked': 'Camada 3 (Interações) desbloqueia quando ≥2 fatores são significativos',
  'fi.layer3Current': ' — atualmente {count} significativos',
  'fi.best': 'Melhor',
  'fi.range': 'Amplitude',
  'fi.interactionDetected':
    'Interação detectada: o efeito de {factorA} depende do nível de {factorB}.',
  'fi.noInteraction': 'Sem interação significativa — os efeitos são aproximadamente aditivos.',

  // Capability suggestion modal
  'capability.suggestion.title': 'Specification limits set',
  'capability.suggestion.description':
    'Would you like to start with the Capability view to check if your subgroups are meeting the Cpk target?',
  'capability.suggestion.whatYouSee': "What you'll see:",
  'capability.suggestion.bullet1': 'I-Chart plotting Cp and Cpk per subgroup',
  'capability.suggestion.bullet2': 'Whether subgroups consistently meet your target',
  'capability.suggestion.bullet3': 'Centering loss (gap between Cp and Cpk)',
  'capability.suggestion.startCapability': 'Start with Capability View',
  'capability.suggestion.standardView': 'Standard View',
  'capability.suggestion.footer': 'You can switch anytime using the toggle in the I-Chart header.',

  // Annotations
  'annotations.redHighlight': 'Red highlight',
  'annotations.amberHighlight': 'Amber highlight',
  'annotations.greenHighlight': 'Green highlight',
  'annotations.active': 'active',

  // Subgroup
  'subgroup.method': 'Subgroup Method',
  'subgroup.fixedSize': 'Fixed size',
  'subgroup.byColumn': 'By column',
  'subgroup.configuration': 'Subgroup Configuration',
  'subgroup.configureSubgroups': 'Configure subgroups',

  // Capability
  'capability.specsDetected': 'Specification limits detected',
  'capability.startCapabilityView': 'Start Capability View',
  'capability.cpkTrendSubgroup': 'Cpk trend per subgroup',
  'capability.standardView': 'Standard View',
  'capability.individualValuesChart': 'Individual values chart',
  'capability.switchAnytime': 'You can switch anytime using the toggle in the I-Chart header.',
  'capability.type': 'Type:',
  'capability.cpkTarget': 'Cpk target:',
  'capability.insufficientData': 'Insufficient data',
  'capability.meetsTarget': 'Meets target',
  'capability.marginal': 'Marginal',
  'capability.belowTarget': 'Below target',

  // Quality (additional)
  'quality.dataFile': 'Data File',

  // Finding (additional)
  'finding.addObservation': 'Add observation',

  // Action (additional)
  'action.continue': 'Continue',

  'action.drillDown': 'Drill Down',
  'action.viewDetails': 'View Details',

  // Upgrade (additional)
  'upgrade.freeTierLimitation': 'Free tier limitation',
  'upgrade.fromPrice': 'From \u20ac79/month',

  // Investigation Wall
  'wall.status.proposed': 'Proposed',
  'wall.status.evidenced': 'Evidenced',
  'wall.status.confirmed': 'Confirmed',
  'wall.status.refuted': 'Refuted',
  'wall.card.hypothesisLabel': 'Mechanism Branch',
  'wall.card.findings': '{count} findings',
  'wall.card.questions': '{count} questions',
  'wall.card.evidenceGap': 'Evidence gap',
  'wall.card.missingColumn': '⚠ Condition references missing column',
  'wall.card.missingColumnAria': 'Condition references missing column',
  'wall.card.ariaLabel': 'Mechanism Branch {name}, {status}, {count} supporting clues',
  'wall.problem.title': 'Problem condition',
  'wall.problem.eventsPerWeek': '{count} events/wk',
  'wall.problem.ariaLabel': 'Problem condition: {column}, Cpk {cpk}, {count} events per week',
  'wall.gate.and': 'AND',
  'wall.gate.or': 'OR',
  'wall.gate.not': 'NOT',
  'wall.gate.holds': 'HOLDS {matching}/{total}',
  'wall.gate.noTotals': '—/0',
  'wall.gate.ariaLabel': 'Gate {kind} {holds}',
  'wall.question.ariaLabel': 'Question: {text}, {status}',
  'wall.tributary.ariaLabel': 'Tributaries from Process Map',
  'wall.empty.ariaLabel': 'Mechanism Branch empty state',
  'wall.empty.title': 'Start a Mechanism Branch',
  'wall.empty.subtitle': 'Start from a suspected mechanism, question, or Factor Intelligence.',
  'wall.empty.writeHypothesis': 'Write a suspected mechanism',
  'wall.empty.promoteFromQuestion': 'Promote from a question',
  'wall.empty.seedFromFactorIntel': 'Seed 3 from Factor Intelligence',
  'wall.rail.title': 'CoScout',
  'wall.rail.openAria': 'Open narrator rail',
  'wall.rail.closeAria': 'Close narrator rail',
  'wall.rail.rootAria': 'Narrator rail',
  'wall.rail.openButton': 'Open rail',
  'wall.rail.empty': 'No suggestions yet.',
  'wall.missing.ariaLabel': 'Missing evidence digest',
  'wall.missing.title': 'Missing evidence',
  'wall.missing.tagline': 'Missing evidence · the detective move nobody ships ({count})',
  'wall.missing.processMap': 'Process Map grouping is available after FRAME mapping.',
  'wall.canvas.ariaLabel': 'Mechanism Branch workspace',
  'wall.cta.proposeHypothesis': 'Propose suspected mechanism from this finding',
  'wall.toolbar.groupByTributary': 'Group by tributary',
  'wall.toolbar.zoomIn': 'Zoom in',
  'wall.toolbar.zoomOut': 'Zoom out',
  'wall.toolbar.resetView': 'Reset view',
  'wall.palette.placeholder': 'Search hubs, questions, findings…',
  'wall.palette.empty': 'No matches',
  'wall.palette.kind.hub': 'BRANCH',
  'wall.palette.kind.question': 'QUESTION',
  'wall.palette.kind.finding': 'FINDING',
  'wall.minimap.ariaLabel': 'Investigation Wall minimap',

  // FRAME b0 lightweight render — TODO(i18n): translate
  'frame.b0.q1.headline': 'What do you want to investigate?',
  'frame.b0.q1.hint': 'your Y / output measurement',
  'frame.b0.q2.headline': 'What might be affecting it?',
  'frame.b0.q2.hint': "your X's / inputs",
  'frame.b0.runOrderHint': '(run order: {column})',
  'frame.b0.addProcessSteps.label': 'Add process steps',
  'frame.b0.addProcessSteps.helper': "optional — useful when your X's belong to specific stages",
  'frame.b0.addHypothesis.label': 'Add a hypothesis',
  'frame.b0.addHypothesis.helper': 'optional — what you suspect',
  'frame.b0.seeData.cta': 'See the data →',
  'frame.b0.seeData.pickYHint': 'Pick a Y first to see the analysis.',
  'frame.b0.step.addCtq': '+ add measurement at this step (optional)',
  'frame.b0.q1.empty': 'No numeric columns detected — add or import data to begin.', // TODO(i18n): translate
  'frame.b0.q2.empty': 'No X candidates — once you pick a Y, factor candidates appear here.', // TODO(i18n): translate
  'frame.b0.aria.yCandidates': 'Y candidate chips', // TODO(i18n): translate
  'frame.b0.aria.selectedXs': 'Selected X chips', // TODO(i18n): translate
  'frame.b0.aria.availableXs': 'Available X chips', // TODO(i18n): translate
  'frame.b1.heading': 'Frame the investigation', // TODO(i18n): translate
  'frame.b1.description':
    'Build your process map so the analysis has context. The map drives mode selection and a measurement-gap report; the methodology wants CTS at the ocean, a CTQ per step, and at least one rational-subgroup axis.', // TODO(i18n): translate
  'frame.spec.notSet': 'spec: not set',
  'frame.spec.set': 'spec: set', // TODO(i18n): translate
  'frame.spec.add': '+ add spec',
  'frame.spec.editor.title': 'Set spec for {measure}',
  'frame.spec.editor.usl': 'USL',
  'frame.spec.editor.lsl': 'LSL',
  'frame.spec.editor.target': 'Target',
  'frame.spec.editor.cpkTarget': 'Cpk target',
  'frame.spec.editor.suggestedFromData': 'Suggested from data: mean ± 3σ. Confirm to save.',
  'frame.spec.editor.confirm': 'Save',
  'frame.spec.editor.cancel': 'Cancel',
  'frame.spec.editor.invalidRange': 'USL must be greater than LSL.', // TODO(i18n): translate
  'capability.noSpec.prompt': 'Set a target / spec on {measure} to see Cp/Cpk.',

  // Time lens (ProcessHealthBar) — TODO(i18n): translate
  'timeLens.button': 'Time',
  'timeLens.popover.title': 'Time window',
  'timeLens.mode.cumulative': 'Cumulative',
  'timeLens.mode.rolling': 'Rolling',
  'timeLens.mode.fixed': 'Fixed',
  'timeLens.mode.openEnded': 'Open-ended',
  'timeLens.input.windowSize': 'Window size',
  'timeLens.input.anchor': 'Anchor',
};
