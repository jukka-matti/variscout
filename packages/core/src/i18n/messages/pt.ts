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
  'panel.analyze': 'Investigação',
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
  'analyze.brief': 'Resumo da investigação',
  'analyze.assignedToMe': 'Atribuído a mim',
  'analyze.pinAsFinding': 'Fixar como constatação',
  'analyze.addObservation': 'Adicionar observação',

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

  // Analyze sidebar
  'analyze.phaseInitial': 'Reunir observações iniciais',
  'analyze.phaseDiverging': 'Explorar múltiplas hipóteses',
  'analyze.phaseValidating': 'Testar e validar hipóteses',
  'analyze.phaseConverging': 'Convergir para a causa raiz',
  'analyze.phaseImproving': 'Implementar e verificar mudanças',
  'analyze.pdcaTitle': 'Lista de verificação',
  'analyze.verifyChart': 'Gráfico I estável após mudança',
  'analyze.verifyStats': 'Cpk atinge a meta',
  'analyze.verifyBoxplot': 'Dispersão do boxplot reduzida',
  'analyze.verifySideEffects': 'Nenhum efeito colateral observado',
  'analyze.verifyOutcome': 'Resultado sustentado ao longo do tempo',
  'analyze.unanalyzed': 'Fatores não investigados',

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
  'ai.tool.suggestHypothesis': 'Suggest hypothesis',
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

  // Analyze prompt
  'analyze.trackingPrompt':
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
  'outcomeNoMatch.noColumn': 'No column called "{name}". Available numeric columns: {columns}.',
  'outcomeNoMatch.nonNumeric': '"{name}" is not numeric, so it cannot be a Y.',
  'outcomeNoMatch.noNumericColumns': 'no numeric columns',
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
  'admin.teams': 'Configuração do Teams',
  'admin.knowledge': 'Base de conhecimento',
  'admin.troubleshooting': 'Solução de problemas',

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
  'workspace.process': 'Process',
  'workspace.explore': 'Explore',
  'workspace.analyze': 'Analyze',
  'workspace.findings': 'Findings',
  'workspace.improvement': 'Improvement',
  'workspace.improve': 'Improve',
  'workspace.project': 'Projeto',
  'workspace.report': 'Report',

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
  'defect.detected.stepOfOrigin': 'Step of origin',
  'defect.detected.stepOfOriginHint':
    'Identifies which step caught each defect. Optional — defects anchor to outcome when not set.',

  // ── DefectDispatchBanner (ER-5b) ──
  'defect.dispatch.banner.label': '⌖ Detected count data — analyzing defect rates',
  'defect.dispatch.banner.adjust': 'adjust columns ▾',
  'defect.dispatch.banner.useStandard': 'use as standard data',

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
  'report.type.analysisSnapshot': 'Analysis Snapshot',
  'report.type.analyzeReport': 'Analyze Report',
  'report.type.improvementStory': 'Improvement Story',
  'report.sections': 'Sections',
  'report.audience.technical': 'Technical',
  'report.audience.summary': 'Summary',
  'report.workspace.analysis': 'ANALYSIS',
  'report.workspace.findings': 'FINDINGS',
  'report.workspace.improvement': 'IMPROVEMENT',
  'report.action.copyAllCharts': 'Copy All Charts',
  'report.action.saveAsPdf': 'Save as PDF',
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

  // Canvas Wall overlay
  'canvas.wall.shortcutLabel': 'Open Wall',

  // Investigation Wall
  'wall.status.proposed': 'Suspected',
  'wall.status.evidenced': 'Suspected',
  'wall.status.confirmed': 'Supported',
  'wall.status.refuted': 'Ruled out',
  'wall.status.needsDisconfirmation': 'Suspected',
  'wall.status.suggestSupported': '2 evidence types + a survived test — mark Supported?',
  'wall.status.setLabel': 'Set status',
  'wall.card.hypothesisLabel': 'Suspected cause',
  'wall.card.findings': '{count} findings',
  'wall.card.evidenceGap': 'Evidence gap',
  'wall.card.missingColumn': '⚠ Condition references missing column',
  'wall.card.missingColumnAria': 'Condition references missing column',
  'wall.card.ariaLabel': 'Suspected cause {name}, {status}, {count} supporting clues',
  'wall.card.oneStepAway':
    '1 step away — running a disconfirmation test would let you mark this Supported',
  'wall.problem.title': 'Problem condition',
  'wall.problem.eventsPerWeek': '{count} events',
  'wall.problem.ariaLabel': 'Problem condition: {column}, Cpk {cpk}, {count} events per week',
  'wall.scope.whatIf': 'If fixed: Cpk {value}',
  'wall.scope.coverage': 'Covers {value}%',
  'wall.evidence.supports': 'Supports',
  'wall.evidence.countsAgainst': 'Counts against',
  'wall.evidence.contributingFactors': 'Contributing factors',
  'wall.factorGlyph.aria': 'Focus factor {factor}',
  'wall.exploreJump.aria': 'Open {factor} in Explore',
  'wall.disconfirm.prompt': 'We tried to break this — did it hold?',
  'wall.disconfirm.descriptionLabel': 'What did you try?',
  'wall.disconfirm.verdictLabel': 'Did it hold?',
  'wall.disconfirm.verdictPending': 'Still checking',
  'wall.disconfirm.verdictSurvived': 'Held up (survived)',
  'wall.disconfirm.verdictRefuted': 'Broke it (refuted)',
  'wall.disconfirm.record': 'Record',
  'wall.disconfirm.cancel': 'Cancel',
  // FE-2b — the fused "Try to break it" premortem (spec §4.2)
  'wall.disconfirm.tryToBreakIt': 'Try to break it',
  'wall.disconfirm.tryToBreakItHint':
    'Predict what would prove this WRONG — the test grades the verdict.',
  'wall.disconfirm.predictLabel': 'What would you expect to see if this is wrong?',
  'wall.disconfirm.predictPlaceholder':
    'e.g. if the night shift drives it, day-shift runs should run cool…',
  'wall.disconfirm.predictHint': 'Optional, but a sharp prediction makes the test severe.',
  'wall.disconfirm.manualFallback': 'Log a gemba or expert disconfirmation (no data)',
  'wall.disconfirm.verdictSurvivedToast': 'Survived — the cause withstood the attempt.',
  'wall.disconfirm.verdictRefutedToast': 'Refuted — the predicted relationship was absent.',
  // FE-2b — the §4.1 soft caveat for an unbacked survived attempt
  'wall.caveat.unbackedSurvived': 'Supported — disconfirmation has no attached evidence',
  'wall.caveat.backWithTest': 'back it with a test →',
  // FE-2b — refute → respawn-sharper (spec §4.2)
  'wall.respawn.sharpenCta': 'Sharpen → propose a new hypothesis',
  'wall.respawn.nameLabel': 'New hypothesis',
  'wall.respawn.namePlaceholder': 'e.g. it’s the spindle, regardless of shift',
  'wall.respawn.carryNote':
    'The refuting finding carries forward as supporting evidence for the new hypothesis.',
  'wall.respawn.confirm': 'Create sharpened hypothesis',
  'wall.respawn.cancel': 'Cancel',
  'wall.respawn.supersededBy': 'superseded by →',
  // FE-2b — the confound sign-prompt + side-by-side What-If (spec §4.2)
  'wall.confound.heading': 'This factor is also cited by a rival cause',
  'wall.confound.prompt': 'Mark the opposite sign on “{rival}”?',
  'wall.confound.markOpposite': 'Counts against the rival',
  'wall.confound.notAdditive':
    'These projections are not additive — each cause is its own What-If.',
  'wall.confound.whatIfFor': 'If you control “{hypothesis}”',
  // FE-2b — the activated affordances (spec §4.2)
  'wall.affordance.tryDisconfirmation': 'Try disconfirmation',
  'wall.affordance.oneStepAwayAction': 'Open the test plan with “Try to break it” ready',
  // ActionItem tasks on hypotheses (IM-4b Task 3)
  'wall.task.addButton': '+ Add Task',
  'wall.task.taskLabel': 'Task description',
  'wall.task.save': 'Save',
  'wall.task.cancel': 'Cancel',
  'wall.task.markDone': 'Mark Done',
  // Plan-owner data-collection task surface (IM-4b Task 4)
  'wall.collect.assigned': 'Assigned: collect {primaryFactor}',
  'wall.collect.status.planned': 'planned',
  'wall.collect.status.inProgress': 'in-progress',
  'wall.collect.status.complete': 'complete',
  'wall.collect.status.skipped': 'skipped',
  'wall.collect.due': 'Due: {date}',
  // L-3 suspected-cause activity layer
  'wall.activity.inFlightHeading': 'In flight - evidence being collected',
  'wall.activity.pendingAttempt': 'Break attempt pending:',
  'wall.activity.stalledHeading': 'Nothing in flight for {days} working days',
  'wall.activity.planCheck': 'Plan a check',
  'wall.activity.goLook': 'Go look',
  'wall.activity.ruleOut': 'Rule it out',
  // PR-CS-11 — analyst-owned plan-status select + re-ingest pending-match prompt (Task 5)
  'wall.collect.setStatusLabel': 'Set plan status',
  'wall.collect.pending.prompt': 'Factor “{column}” arrived — needed by this plan',
  'wall.collect.pending.linkFinding': 'Link finding…',
  'wall.collect.pending.markInProgress': 'Mark in-progress',
  'wall.collect.pending.dismiss': 'Dismiss matched factor',
  'wall.scope.archive': 'Archive scope {condition}',
  'wall.gate.and': 'AND',
  'wall.gate.or': 'OR',
  'wall.gate.not': 'NOT',
  'wall.gate.holds': 'HOLDS {matching}/{total}',
  'wall.gate.noTotals': '—/0',
  'wall.gate.ariaLabel': 'Gate {kind} {holds}',
  'wall.tributary.ariaLabel': 'Tributaries from Process Map',
  'wall.empty.ariaLabel': 'Suspected cause empty state',
  'wall.empty.title': 'Start a suspected cause',
  'wall.empty.subtitle': 'Start from a suspected cause, question, or Factor Intelligence.',
  'wall.empty.writeHypothesis': 'Add a suspected cause',
  'wall.empty.seedFromFactorIntel': 'Seed 3 largest contributors',
  'wall.rail.title': 'CoScout',
  'wall.rail.openAria': 'Open narrator rail',
  'wall.rail.closeAria': 'Close narrator rail',
  'wall.rail.rootAria': 'Narrator rail',
  'wall.rail.openButton': 'Open rail',
  'wall.rail.empty': 'No suggestions yet.',
  'wall.missing.ariaLabel': 'Missing evidence digest',
  'wall.missing.title': 'Missing evidence',
  'wall.missing.tagline': "Evidence you haven't checked yet ({count})",
  'wall.missing.processMap': 'Process Map grouping is available after FRAME mapping.',
  'wall.missing.collapsed': 'Show details',
  'wall.missing.expanded': 'Hide details',
  'wall.canvas.ariaLabel': 'Suspected cause workspace',
  'wall.cta.proposeHypothesis': 'Propose suspected cause from this finding',
  // Model-builder band (Factors & Evaluation Increment 1)
  'wall.model.bandAriaLabel': 'Vital-few model builder',
  'wall.model.title': 'What accounts for the spread in this data',
  'wall.model.keptHeading': 'Vital few',
  'wall.model.candidatesHeading': 'Other factors',
  'wall.model.vitalFewLine': 'vital-few line',
  'wall.model.rSquaredAdj': 'R²adj {value}',
  'wall.model.factorP': 'p {value}',
  'wall.model.associationStrength': 'Association strength',
  'wall.model.deltaR2': 'ΔR² {value}',
  'wall.model.notAVerdict':
    'Associated with the spread in this scope — a clue to investigate, not a verdict.',
  'wall.model.deltaR2Caption':
    'Each bar is a factor’s unique share of the spread; correlated factors overlap, so they need not sum to the model fit.',
  'wall.model.useSuggested': '↩ Use suggested model',
  'wall.model.addToModel': 'Add {factor} to the model',
  'wall.model.removeFromModel': 'Remove {factor} from the model',
  'wall.model.fitOnlyDot': 'Fit-only estimate',
  'wall.model.fitOnlyTooltip':
    'Few observations per factor — treat this as a fit-only estimate, not a confirmed result.',
  'wall.model.redundancy':
    'Removing {factor} barely changed the model — it is correlated with another factor, redundant not irrelevant.',
  'wall.model.redundancyDismiss': 'Dismiss',
  'wall.model.vifTooltip': 'VIF {value}',
  'wall.model.tooFewRows': 'Too few rows to re-rank — showing parent scope.',
  'wall.model.constantInScope': 'constant in scope',
  'wall.model.captureModel': 'Capture model as Finding',
  'wall.model.empty': 'Set an outcome and factors to build a model.',
  'wall.model.capturedText':
    'Model: {factors} accounts for the spread (R²adj {rSquaredAdj}) in {scope}',
  // Hypothesis test-plan triad (Factors & Evaluation Increment 2a)
  // ── Model drawer (ER-3 — "The model behind the ranking") ──
  'modelDrawer.title': 'The model behind the ranking',
  'modelDrawer.subtitle': '{outcome} ~ {terms} · fitted on {scope}',
  'modelDrawer.closeAria': 'Close the model drawer',
  'modelDrawer.empty': 'Set an outcome and factors to build a model.',
  'modelDrawer.summaryHeading': 'Model summary',
  'modelDrawer.summaryS': 'S (residual σ)',
  'modelDrawer.summaryR2': 'R²',
  'modelDrawer.summaryR2adj': 'R²adj',
  'modelDrawer.summaryN': 'n',
  'modelDrawer.summaryCaption':
    'S is the everyday variation left after the model — the same number family as the residual chip on the strip.',
  'modelDrawer.equationHeading': 'Equation (largest terms)',
  'modelDrawer.equationCaption':
    'Reference levels: {references}. Coefficients are group contrasts vs reference — read them as "how much this condition adds", not as causes.',
  'modelDrawer.coefficientsHeading': 'Coefficients',
  'modelDrawer.coefTerm': 'Term',
  'modelDrawer.coefCoef': 'Coef',
  'modelDrawer.coefSE': 'SE',
  'modelDrawer.coefT': 't',
  'modelDrawer.coefP': 'p',
  'modelDrawer.anovaHeading': 'ANOVA',
  'modelDrawer.anovaSource': 'Source',
  'modelDrawer.anovaDF': 'DF',
  'modelDrawer.anovaSS': 'SS',
  'modelDrawer.anovaF': 'F',
  'modelDrawer.anovaP': 'p',
  'modelDrawer.anovaError': 'Error',
  'modelDrawer.anovaTotal': 'Total',
  'modelDrawer.anovaCaption':
    'Type III (model-comparison) SS. η² on the strip = adjusted share per factor — see the strip subtitle.',
  'modelDrawer.ladderHeading': 'Best subsets (how the model was chosen)',
  'modelDrawer.ladderModel': 'Candidate model',
  'modelDrawer.ladderTerms': 'terms',
  'modelDrawer.ladderR2': 'R²',
  'modelDrawer.ladderR2adj': 'R²adj',
  'modelDrawer.ladderShown': '✓ shown',
  'modelDrawer.ladderNote':
    'Each candidate is its own least-squares fit; higher R²adj = the added terms pay their degrees-of-freedom rent. Interactions are screened only among surviving main effects (hierarchical, two-pass). The drawer shows the model behind the ranking you are looking at.',
  'modelDrawer.predictHeading': 'Check the equation — predict a condition',
  'modelDrawer.predictResult': '→ fitted {fitted} ± {s} · observed x̄ {observed} (n={n})',
  'modelDrawer.predictNoCell': '→ fitted {fitted} ± {s} · no observed rows for this condition',
  'modelDrawer.predictCaption':
    "Fitted mean ± S. Compare with the observed cell mean to feel the model's honesty.",
  'modelDrawer.constantInScope': 'constant in scope',
  'modelDrawer.captureModel': 'Capture model as Finding',
  'modelDrawer.warningRankDeficient':
    'Collinear or single-level factor — affected coefficients are shown as 0.',
  'modelDrawer.allData': 'All data',
  'wall.testplan.heading': 'How do I test this?',
  'wall.testplan.toolTwoSample': 'Boxplot + 2-sample',
  'wall.testplan.toolRegression': 'Scatter + regression',
  'wall.testplan.toolCapability': 'Capability (Cp/Cpk)',
  'wall.testplan.evaluate': 'Evaluate',
  'wall.testplan.evaluateAria': 'Evaluate whether {factor} accounts for the spread',
  'wall.testplan.addPlan': '+ Measurement Plan',
  'wall.testplan.addPlanAria': 'Plan how to collect {factor}',
  'wall.testplan.gapLabel': 'no data yet',
  'wall.testplan.resultSupports': '{factor} accounts for the spread (p {p})',
  'wall.testplan.resultInconclusive': '{factor} — inconclusive (p {p})',
  'wall.testplan.resultContradicts': '{factor} counts against this cause (p {p})',
  'wall.testplan.empty': 'No factors yet — capture a finding or set this cause’s condition.',
  // Per-hypothesis What-If (Factors & Evaluation Increment 2a, §5)
  'wall.whatif.heading': 'If you control this cause',
  'wall.whatif.projection': 'Projected Cpk {cpk}, covers {coverage}% of the data',
  'wall.whatif.noProjection': 'Set specs + a condition to project the gain.',
  'wall.toolbar.groupByTributary': 'Group by tributary',
  'wall.toolbar.zoomIn': 'Zoom in',
  'wall.toolbar.zoomOut': 'Zoom out',
  'wall.toolbar.resetView': 'Reset view',
  'wall.palette.placeholder': 'Search hubs, questions, findings…',
  'wall.palette.empty': 'No matches',
  'wall.palette.kind.hub': 'BRANCH',
  'wall.palette.kind.finding': 'FINDING',
  'wall.minimap.ariaLabel': 'Investigation Wall minimap',
  // Brush-to-finding confirmation flow (RPS V1 PR4 Task 17) — TODO(i18n): translate
  'wall.brush.confirmIChart': 'Pin indices {start}-{end} on {factor} as finding?',
  'wall.brush.confirmIChartNoFactor': 'Pin range as finding?',
  'wall.brush.confirmBoxplot': 'Pin category "{category}" on {factor} as finding?',
  'wall.brush.confirmBoxplotNoFactor': 'Pin category "{category}" as finding?',
  'wall.brush.pin': 'Pin',
  'wall.brush.cancel': 'Cancel',
  'wall.brush.dialogAriaLabel': 'Pin selection as finding',

  // FRAME b0 lightweight render — TODO(i18n): translate
  'frame.b0.q1.headline': 'What do you want to investigate?',
  'frame.b0.q1.hint': 'your Y / output measurement',
  'frame.b0.q2.headline': 'What might be affecting it?',
  'frame.b0.q2.hint': "your X's / inputs",
  'frame.b0.q2.bridge': 'These are the same candidate factors Explore will rank from the data.',
  'frame.b0.runOrderHint': '(run order: {column})',
  'frame.b0.addProcessSteps.label': 'Add process steps',
  'frame.b0.addProcessSteps.helper': "optional — useful when your X's belong to specific stages",
  'frame.b0.addHypothesis.label': 'Add a hypothesis',
  'frame.b0.addHypothesis.helper': 'optional — what you suspect',
  'frame.b0.seeData.cta': 'See the data →',
  'frame.b0.seeData.pickYHint': 'Pick a Y first to see the analysis.',
  'frame.b0.step.addCtq': '+ add measurement at this step (optional)',
  'frame.b0.q1.empty': 'No numeric columns detected — add or import data to begin.', // TODO(i18n): translate
  'frame.b0.q1.emptyRanked':
    "Couldn't auto-rank an outcome. Type the numeric column name in the manual outcome field.",
  'frame.b0.q2.empty': 'No X candidates — once you pick a Y, factor candidates appear here.', // TODO(i18n): translate
  'frame.b0.aria.yCandidates': 'Y candidate chips', // TODO(i18n): translate
  'frame.b0.aria.selectedXs': 'Selected X chips', // TODO(i18n): translate
  'frame.b0.aria.availableXs': 'Available X chips', // TODO(i18n): translate
  'frame.canvasOverlay.cta.control.notReady':
    "Available after you've implemented a process change to monitor",
  'frame.canvasOverlay.cta.handoff.notReady':
    'Available after sustainment monitoring confirms gains',
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

  // Verify card segmented tabs — TODO(i18n): translate
  'verify.tabs.label': 'Verify view',
  'verify.tab.probability': 'Probability',
  'verify.tab.distribution': 'Distribution',
  'verify.tab.capability': 'Capability',
  'verify.tab.pareto': 'Pareto',

  // ProcessHealthBar generic labels

  'healthBar.rows': 'rows',

  // Factor strip (ER-2 — "What explains the variation?")
  'factorStrip.title': 'What does explain it?',
  'factorStrip.title.scoped': 'What does explain it within this condition?',
  'factorStrip.subtitle':
    "how much of the row-to-row differences each factor accounts for (η²) — shares overlap, won't sum to 100%",
  'factorStrip.bridge': 'Same candidate factors as Frame; ranked here from the data.',
  'factorStrip.modelLink': 'How these % are computed (model & ANOVA) →',
  'factorStrip.modelLink.stub': 'coming with the model drawer',
  'factorStrip.star.title': 'largest share',
  'factorStrip.stepBadge.title': 'Process step: {step}',
  'factorStrip.binned': '(binned)',
  'factorStrip.examined': 'examined',
  'factorStrip.chip.hover': 'p={p} · df={dfB},{dfW} · joint n={n}',
  'factorStrip.residual': 'everyday variation · ~{n}% — not tied to these factors',
  'factorStrip.residual.hover':
    'Residual of the joint model — mostly routine row-to-row variation, plus factors not yet measured. A large residual is typical for service data.',
  'factorStrip.alsoScreened': '+{n} also screened',
  'factorStrip.whatif.label': 'what-if · everyone matched the best group',
  'factorStrip.whatif.matched': 'If all {factor} groups matched {bestLevel}:',
  'factorStrip.whatif.average': 'average {outcome}, all {n} rows: {current} → {projected}',
  'factorStrip.whatif.average.scoped': 'average {outcome}, this condition: {current} → {projected}',
  'factorStrip.whatif.cpk': 'Cpk {current} → {projected} (reference {target})',
  'factorStrip.whatif.bridge':
    'the gap is bigger per group — this is the overall average across {k} groups',
  // Boxplot card (factor dropdown absorbed by the strip)
  'boxplot.title.by': '{outcome} by {factor}',
  'boxplot.factor.hint': 'click a factor above to compare its groups here',

  // Time lens (ProcessHealthBar) — TODO(i18n): translate
  'timeLens.button': 'Time',
  'timeLens.popover.title': 'Time window',
  'timeLens.mode.cumulative': 'Cumulative',
  'timeLens.mode.rolling': 'Rolling',
  'timeLens.mode.fixed': 'Fixed',
  'timeLens.mode.openEnded': 'Open-ended',
  'timeLens.input.windowSize': 'Window size',
  'timeLens.input.anchor': 'Anchor',

  // TODO(i18n): translate canvas.* keys
  // Canvas — SystemLevelView
  'canvas.system.activeAnalyzes': 'Active investigations',
  'canvas.system.conformance': 'Conformance',
  'canvas.system.inbox': 'Inbox',
  'canvas.system.lensLabel': 'Lens: {lens}',
  'canvas.system.noNumericOutcome': 'No numeric outcome',
  'canvas.system.noOutcomePrompts': 'No outcome prompts',
  'canvas.system.noOutcomeTrend': 'No outcome trend',
  'canvas.system.openScout': 'Open SCOUT',
  'canvas.system.outcomeDistribution': 'Outcome distribution',
  'canvas.system.outcomeDrift': 'Outcome drift',
  'canvas.system.outOfSpecMessage': '{outcome} has {pct} readings outside spec.',
  'canvas.system.reviewAction': 'Review',

  // Canvas — CanvasLensPicker
  'canvas.lensPicker.ariaLabel': 'Canvas lenses',
  'canvas.lensPicker.lensAriaLabel': '{label} lens',
  'canvas.lensPicker.invalidAtLevel':
    "{lens} isn't available at {currentLevel} \u2014 try {suggestedLevel}.",

  // Canvas — lens labels & descriptions
  'canvas.lens.capability.description': 'Capability, Cpk trust, and step health.',
  'canvas.lens.capability.label': 'Capability',
  'canvas.lens.default.description': 'Step metrics, specs, and current card state.',
  'canvas.lens.default.label': 'Default',
  'canvas.lens.defect.description': 'Defect counts projected onto process steps.',
  'canvas.lens.defect.label': 'Defect',
  'canvas.lens.performance.description': 'Future within-step channel lens.',
  'canvas.lens.performance.label': 'Performance',
  'canvas.lens.processFlow.description': 'Plain process structure without per-card analytics.',
  'canvas.lens.processFlow.label': 'Process flow',

  // Canvas — NoFocalStepPrompt
  'canvas.noFocalStep.ariaLabel': 'Choose a process step',
  'canvas.noFocalStep.description': 'Local mechanism view needs a focal process step.',
  'canvas.noFocalStep.heading': 'Choose a step for L3',
  'canvas.noFocalStep.noStepsHint': 'Add a process step before opening the local mechanism view.',
  'canvas.noFocalStep.openStepAria': 'Open {stepName} local mechanism',

  // Canvas — MobileLevelPicker
  'canvas.mobile.ariaLabel': 'Canvas levels',
  'canvas.mobile.process': 'Process',
  'canvas.mobile.step': 'Step',
  'canvas.mobile.system': 'System',

  // Canvas — AuthorL3View
  'canvas.authorL3.assignedColumns': 'Assigned columns',
  'canvas.authorL3.ctqHeading': 'CTQ',
  'canvas.authorL3.dropHint': 'Drop columns here to assign them to this process step.',
  'canvas.authorL3.dropTargetAria': '{stepName} assignment target',
  'canvas.authorL3.dropTargetAriaWithChip':
    '{stepName} assignment target, press Enter to place {chipLabel}',
  'canvas.authorL3.noAssignedColumns': 'No assigned columns yet',
  'canvas.authorL3.noCtqContext': 'No unassigned CTQ context',
  'canvas.authorL3.noTributaryContext': 'No unassigned tributary context',
  'canvas.authorL3.selectedStep': 'Selected step',
  'canvas.authorL3.tributaryColumns': 'Tributary columns',
  'canvas.authorL3.unassignedColumns': 'Unassigned columns',

  // Canvas — LocalMechanismView
  'canvas.localMechanism.actionButton': 'Action',
  'canvas.localMechanism.etaSquaredLabel': 'eta² {value}',
  'canvas.localMechanism.factorContribution': 'Factor contribution evidence',
  'canvas.localMechanism.logActionAria': 'Log action for {column}',
  'canvas.localMechanism.noNumericValues': 'No numeric values',
  'canvas.localMechanism.openChartAria': 'Open {column} details mini chart',
  'canvas.localMechanism.openColumnAria': 'Open {column} details',
  'canvas.localMechanism.quickActionTitle': '{column} quick action',
  'canvas.localMechanism.control': 'Control',
  'canvas.localMechanism.handoff': 'Handoff',
  'canvas.localMechanism.controlAria': 'Open control for {column}',
  'canvas.localMechanism.handoffAria': 'Open handoff for {column}',
  // ── Condition pill (ER-4) ──
  'conditionPill.statDefault': 'x̄',
  'conditionPill.summaryWithMeans':
    '{gesture}{summary} · n={n} · {statLabel} {meanIn} vs {meanOut}',
  'conditionPill.summaryNoMeans': '{gesture}{summary} · n={n}',
  'conditionPill.capture': '✚ Capture finding',
  'conditionPill.apply': 'view as condition →',
  'conditionPill.ariaLabel': 'Condition: {summary}',
  // ── Scope bar (ER-4) ──
  'scopeBar.viewing': '⌖ Viewing condition:',
  'scopeBar.rows': '{nIn} of {nTotal} rows',
  'scopeBar.clear': '× back to all data',
  'scopeBar.analyze': 'Take it to Analyze →',
  'scopeBar.ariaLabel': 'Viewing condition: {label}',

  // -- Membership strip variant (ER-5a) --
  'factorStrip.title.membership': 'What distinguishes these rows?',
  'factorStrip.membership.subtitle':
    'how strongly each factor distinguishes the rows in this condition from the rest (separation -- not % of variation)',
  'factorStrip.membership.separation': 'separation',
  'factorStrip.membership.chip.hover': 'p={p} · χ² df={df} · n={n}',
  'factorStrip.membership.chip.topLevel': '{level} ×{lift}',
  'factorStrip.membership.chip.onlyInCondition': 'only in condition',

  // ── Defect-rate-share strip variant (ER-5b) ──
  'factorStrip.title.defectRate': 'What drives the defect rate?',
  'factorStrip.defectRate.subtitle':
    'how strongly each factor concentrates the defect rate across its levels (rate concentration — not % of variation)',
  'factorStrip.defectRate.chip.topLevel': '{level} {rate}%',
  'factorStrip.defectRate.star.title': 'largest share',

  // -- Composition view (ER-5a) --
  'compositionView.title': 'Composition by {factor}',
  'compositionView.toggle.lift': 'lift',
  'compositionView.toggle.count': 'count',
  'compositionView.shareIn': 'share in condition',
  'compositionView.shareOut': 'share outside',
  'compositionView.lift': '×{lift}',
  'compositionView.liftOnlyInCondition': 'only in condition',
  'compositionView.addAria': 'Add {level} to condition',
  'compositionView.empty': 'No composition data -- condition may be degenerate.',
  'compositionView.countIn': 'in condition',
};
