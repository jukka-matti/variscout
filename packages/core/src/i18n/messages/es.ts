import type { MessageCatalog } from '../types';

/**
 * Spanish message catalog
 */
export const es: MessageCatalog = {
  // Statistics labels
  'stats.mean': 'Media',
  'stats.median': 'Mediana',
  'stats.stdDev': 'Desv. Est.',
  'stats.samples': 'Muestras',
  'stats.passRate': 'Tasa de aprobación',
  'stats.range': 'Rango',
  'stats.min': 'Mín',
  'stats.max': 'Máx',
  'stats.target': 'Objetivo',
  'stats.sigma': 'Sigma',

  // Chart labels
  'chart.observation': 'Observación',
  'chart.count': 'Conteo',
  'chart.frequency': 'Frecuencia',
  'chart.value': 'Valor',
  'chart.category': 'Categoría',
  'chart.cumulative': 'Acumulado %',
  'chart.clickToEdit': 'Clic para editar',
  'chart.median': 'Mediana',
  'chart.q1': 'Q1',
  'chart.q3': 'Q3',
  'chart.noChannelData': 'Sin datos de canal',
  'chart.selectChannel': 'Seleccionar canal',

  // Limit labels (ISO/UNE standard)
  'limits.usl': 'LSE',
  'limits.lsl': 'LIE',
  'limits.ucl': 'LSC',
  'limits.lcl': 'LIC',
  'limits.mean': 'Media',
  'limits.target': 'Objetivo',

  // Navigation
  'nav.newAnalysis': 'Nuevo análisis',
  'nav.backToDashboard': 'Volver al panel',
  'nav.settings': 'Configuración',
  'nav.export': 'Exportar',
  'nav.presentation': 'Presentación',
  'nav.menu': 'Menú',
  'nav.moreActions': 'Más acciones',

  // Panel titles
  'panel.findings': 'Hallazgos',
  'panel.dataTable': 'Tabla de datos',
  'panel.whatIf': 'Qué pasaría si',
  'panel.investigation': 'Investigación',
  'panel.coScout': 'CoScout',
  'panel.drillPath': 'Ruta de desglose',

  // View modes
  'view.list': 'Lista',
  'view.board': 'Tablero',
  'view.tree': 'Árbol',

  // Action buttons
  'action.save': 'Guardar',
  'action.cancel': 'Cancelar',
  'action.delete': 'Eliminar',
  'action.edit': 'Editar',
  'action.copy': 'Copiar',
  'action.close': 'Cerrar',
  'action.learnMore': 'Más información',
  'action.download': 'Descargar',
  'action.apply': 'Aplicar',
  'action.reset': 'Restablecer',
  'action.retry': 'Reintentar',
  'action.send': 'Enviar',
  'action.ask': 'Preguntar',
  'action.clear': 'Limpiar',
  'action.copyAll': 'Copiar todo',
  'action.selectAll': 'Seleccionar todo',

  // CoScout
  'coscout.send': 'Enviar',
  'coscout.clear': 'Limpiar conversación',
  'coscout.stop': 'Detener',
  'coscout.rateLimit': 'Límite de frecuencia alcanzado. Por favor espere.',
  'coscout.contentFilter': 'Contenido filtrado por política de seguridad.',
  'coscout.error': 'Ocurrió un error. Por favor intente de nuevo.',

  // Display/settings
  'display.preferences': 'Preferencias',
  'display.density': 'Densidad de visualización',
  'display.lockYAxis': 'Bloquear eje Y',
  'display.filterContext': 'Contexto de filtro',
  'display.showSpecs': 'Mostrar especificaciones',

  // Investigation
  'investigation.brief': 'Resumen de investigación',
  'investigation.assignedToMe': 'Asignado a mí',
  'investigation.question': 'Question',
  'investigation.questions': 'Questions',
  'investigation.pinAsFinding': 'Fijar como hallazgo',
  'investigation.addObservation': 'Agregar observación',

  // Empty states
  'empty.noData': 'No hay datos disponibles',
  'empty.noFindings': 'Aún no hay hallazgos',
  'empty.noResults': 'No se encontraron resultados',

  // Error messages
  'error.generic': 'Algo salió mal',
  'error.loadFailed': 'Error al cargar datos',
  'error.parseFailed': 'Error al procesar archivo',

  // Settings labels
  'settings.language': 'Idioma',
  'settings.theme': 'Tema',
  'settings.textSize': 'Tamaño de texto',

  // Finding statuses
  'findings.observed': 'Observado',
  'findings.investigating': 'Investigando',
  'findings.analyzed': 'Analizado',
  'findings.improving': 'Mejorando',
  'findings.resolved': 'Resuelto',

  // Report labels
  'report.summary': 'Resumen',
  'report.findings': 'Hallazgos',
  'report.recommendations': 'Recomendaciones',
  'report.evidence': 'Evidencia',

  // Data input labels
  'data.pasteData': 'Pegar datos',
  'data.uploadFile': 'Subir archivo',
  'data.columnMapping': 'Mapeo de columnas',
  'data.measureColumn': 'Columna de medida',
  'data.factorColumn': 'Columna de factor',
  'data.addData': 'Agregar datos',
  'data.editData': 'Editar datos',
  'data.showDataTable': 'Mostrar tabla de datos',
  'data.hideDataTable': 'Ocultar tabla de datos',

  // Status
  'status.cached': 'En caché',
  'status.loading': 'Cargando',
  'status.ai': 'IA',

  // Report KPIs
  'report.kpi.samples': 'Muestras',
  'report.kpi.mean': 'Media',
  'report.kpi.variation': 'Variación',
  'report.kpi.cpk': 'Cpk',
  'report.kpi.passRate': 'Tasa de aprobación',

  // AI Actions
  'ai.propose': 'Proponer',
  'ai.applied': 'Aplicado',
  'ai.dismissed': 'Descartado',
  'ai.expired': 'Expirado',

  // Staged analysis
  'staged.before': 'Antes',
  'staged.after': 'Después',
  'staged.comparison': 'Comparación',

  // Data input / Column mapping
  'data.mapHeading': 'Asignar sus datos',
  'data.confirmColumns': 'Confirmar columnas',
  'data.selectOutcome': 'Seleccionar resultado',
  'data.selectFactors': 'Seleccionar factores',
  'data.analysisSection': 'Resumen de análisis',
  'data.optional': 'opcional',
  'data.issueStatementPlaceholder': 'Describa lo que desea investigar…',
  'data.outcomeDesc': 'La medición que desea analizar',
  'data.factorsDesc': 'Categorías que podrían influir en el resultado',
  'data.alreadyOutcome': 'Ya seleccionado como resultado',
  'data.showNumericOnly': 'Solo numéricos',
  'data.showCategoricalOnly': 'Solo categóricos',
  'data.showAllColumns': 'Todas las columnas',
  'data.improvementTarget': 'Objetivo de mejora',
  'data.metric': 'Métrica',
  'data.startAnalysis': 'Iniciar análisis',
  'data.applyChanges': 'Aplicar cambios',
  'data.addQuestion': 'Agregar hipótesis',
  'data.removeQuestion': 'Eliminar hipótesis',
  'data.back': 'Atrás',

  // Paste screen
  'data.pasteInstructions': 'Pegue sus datos aquí',
  'data.pasteSubtitle': 'Copie desde Excel, CSV o cualquier hoja de cálculo',
  'data.useExample': 'Usar datos de ejemplo',
  'data.analyzing': 'Analizando…',
  'data.tipWithData': 'Consejo: Incluya los encabezados de columna en la primera fila',
  'data.tipNoData': 'Consejo: Intente pegar datos desde una hoja de cálculo o archivo CSV',

  // Data quality
  'quality.allValid': 'Todos los datos son válidos',
  'quality.rowsReady': '{count} filas listas para el análisis',
  'quality.rowsExcluded': '{count} filas excluidas',
  'quality.missingValues': 'Valores faltantes',
  'quality.nonNumeric': 'Valores no numéricos',
  'quality.noVariation': 'Sin variación',
  'quality.emptyColumn': 'Columna vacía',
  'quality.noVariationWarning': 'Esta columna no tiene variación — todos los valores son idénticos',
  'quality.viewExcluded': 'Ver excluidos',
  'quality.viewAll': 'Ver todos',

  // Manual entry
  'manual.setupTitle': 'Entrada manual de datos',
  'manual.analysisMode': 'Modo de análisis',
  'manual.standard': 'Estándar',
  'manual.standardDesc': 'Una columna de medición con factores opcionales',
  'manual.performance': 'Rendimiento',
  'manual.performanceDesc': 'Múltiples canales de medición (cabezales de llenado, cavidades)',
  'manual.outcome': 'Columna de resultado',
  'manual.outcomeExample': 'ej. Peso, Longitud, Temperatura',
  'manual.factors': 'Factores',
  'manual.addFactor': 'Agregar factor',
  'manual.measureLabel': 'Etiqueta de medida',
  'manual.measureExample': 'ej. Cabezal de llenado, Cavidad, Boquilla',
  'manual.channelCount': 'Número de canales',
  'manual.channelRange': '{min}–{max} canales',
  'manual.startEntry': 'Iniciar entrada',
  'manual.specs': 'Especificaciones',
  'manual.specsApplyAll': 'Aplicar a todos los canales',
  'manual.specsHelper': 'Establecer límites de especificación para la columna de resultado',

  // Chart legend
  'chart.legend.commonCause': 'Causa común',
  'chart.legend.specialCause': 'Causa especial',
  'chart.legend.outOfSpec': 'Fuera de especificación',
  'chart.legend.inControl': 'Bajo control',
  'chart.legend.randomVariation': 'Variación aleatoria',
  'chart.legend.defect': 'Defecto del cliente',

  // Chart violations
  'chart.violation.aboveUsl': 'Sobre LSE ({value})',
  'chart.violation.belowLsl': 'Bajo LIE ({value})',
  'chart.violation.aboveUcl': 'Sobre LSC — causa especial',
  'chart.violation.belowLcl': 'Bajo LIC — causa especial',
  'chart.violation.aboveUclFavorable': 'Sobre LSC — desplazamiento favorable',
  'chart.violation.belowLclFavorable': 'Bajo LIC — desplazamiento favorable',
  'chart.violation.nelson2': 'Regla de Nelson 2 — racha de {count}',
  'chart.violation.nelson3': 'Regla de Nelson 3 — tendencia de {count}',

  // Investigation sidebar
  'investigation.phaseInitial': 'Recopilar observaciones iniciales',
  'investigation.phaseDiverging': 'Explorar múltiples hipótesis',
  'investigation.phaseValidating': 'Probar y validar hipótesis',
  'investigation.phaseConverging': 'Identificar la causa raíz',
  'investigation.phaseImproving': 'Implementar y verificar cambios',
  'investigation.pdcaTitle': 'Lista de verificación',
  'investigation.verifyChart': 'Gráfico I estable después del cambio',
  'investigation.verifyStats': 'Cpk cumple el objetivo',
  'investigation.verifyBoxplot': 'Dispersión del diagrama de cajas reducida',
  'investigation.verifySideEffects': 'Sin efectos secundarios observados',
  'investigation.verifyOutcome': 'Resultado sostenido en el tiempo',
  'investigation.uninvestigated': 'Factores no investigados',

  // AI action tool labels
  'ai.tool.applyFilter': 'Aplicar filtro',
  'ai.tool.clearFilters': 'Limpiar filtros',
  'ai.tool.switchFactor': 'Cambiar factor',
  'ai.tool.createFinding': 'Crear hallazgo',
  'ai.tool.createQuestion': 'Crear hipótesis',
  'ai.tool.suggestAction': 'Sugerir acción',
  'ai.tool.shareFinding': 'Compartir hallazgo',
  'ai.tool.publishReport': 'Publicar informe',
  'ai.tool.notifyOwners': 'Notificar a responsables',
  'ai.tool.suggestIdea': 'Sugerir idea de mejora',
  'ai.tool.sparkBrainstorm': 'Spark brainstorm ideas',
  'ai.tool.suggestSaveFinding': 'Save insight',
  'ai.tool.navigateTo': 'Navigate to',
  'ai.tool.answerQuestion': 'Answer question',
  'ai.tool.suggestSuspectedCause': 'Suggest suspected cause',
  'ai.tool.connectHubEvidence': 'Connect hub evidence',
  'ai.tool.suggestCausalLink': 'Suggest causal link',
  'ai.tool.highlightMapPattern': 'Highlight map pattern',

  // Report
  'report.kpi.inSpec': 'Dentro de espec.',

  // Table
  'table.noData': 'No hay datos para mostrar',
  'table.page': 'Página {page} de {total}',
  'table.rowsPerPage': 'Filas por página',
  'table.editHint': 'Haga clic en una celda para editar',
  'table.excluded': 'Excluido',
  'table.deleteRow': 'Eliminar fila',
  'table.addRow': 'Agregar fila',
  'table.unsavedChanges': 'Cambios sin guardar',
  'table.showAll': 'Mostrar todo',

  // Specs
  'specs.title': 'Límites de especificación',
  'specs.advancedSettings': 'Configuración avanzada',
  'specs.apply': 'Aplicar especificaciones',
  'specs.noChanges': 'Sin cambios que aplicar',
  'specs.editTitle': 'Editar especificaciones',
  'specs.lslLabel': 'Límite inferior de especificación (LIE)',
  'specs.uslLabel': 'Límite superior de especificación (LSE)',

  // Upgrade
  'upgrade.title': 'Actualización disponible',
  'upgrade.limitReached': 'Ha alcanzado el límite para esta función',
  'upgrade.upgrade': 'Actualizar',
  'upgrade.viewOptions': 'Ver opciones',
  'upgrade.featureLimit': '{feature} está limitado a {limit} en este plan',

  // Display toggles
  'display.violin': 'Diagrama de violín',
  'display.violinDesc': 'Mostrar forma de la distribución',
  'display.etaSquared': 'η²',
  'display.etaSquaredDesc': 'Mostrar η² (tamaño del efecto)',
  'display.sort': 'Ordenar',
  'display.ascending': 'Ascendente',
  'display.descending': 'Descendente',

  // Stats panel
  'stats.summary': 'Estadísticas resumidas',
  'stats.histogram': 'Histograma',
  'stats.probPlot': 'Diagrama de probabilidad',
  'stats.editSpecs': 'Editar especificaciones',

  // WhatIf
  'whatif.adjustMean': 'Ajustar media',
  'whatif.reduceVariation': 'Reducir variación',
  'whatif.currentProjected': 'Actual vs. Proyectado',
  'whatif.resetAdjustments': 'Restablecer ajustes',
  'whatif.yield': 'Rendimiento proyectado',

  // Chart violation details (parameterized)
  'chart.violation.nelson2.detail':
    'Regla de Nelson 2 — racha de {count} {side} media (#{start}–{end})',
  'chart.violation.nelson3.detail':
    'Regla de Nelson 3 — tendencia de {count} {direction} (#{start}–{end})',
  'chart.violation.side.above': 'sobre',
  'chart.violation.side.below': 'bajo',
  'chart.violation.direction.increasing': 'creciente',
  'chart.violation.direction.decreasing': 'decreciente',

  // Parameterized messages
  'data.rowsLoaded': '{count} filas cargadas',
  'findings.countLabel': '{count} hallazgos',

  // Chart limit labels
  'chart.label.ucl': 'LSC:',
  'chart.label.lcl': 'LIC:',
  'chart.label.mean': 'Media:',
  'chart.label.tgt': 'Obj:',
  'chart.label.usl': 'LSE:',
  'chart.label.lsl': 'LIE:',
  'chart.label.value': 'Valor:',
  'chart.label.n': 'n:',
  'chart.label.target': 'Objetivo:',

  // Chart status
  'chart.status.inControl': 'Bajo control',
  'chart.status.outOfControl': 'Fuera de control (más allá de LSC/LIC)',
  'chart.noDataProbPlot': 'No hay datos disponibles para el gráfico de probabilidad',

  // Chart edit affordances
  'chart.edit.spec': 'Clic para editar {spec}',
  'chart.edit.axisLabel': 'Clic para editar etiqueta del eje',
  'chart.edit.yAxis': 'Clic para editar escala del eje Y',
  'chart.edit.saveCancel': 'Enter para guardar · Esc para cancelar',

  // Performance table headers
  'chart.table.channel': 'Canal',
  'stats.cp': 'Cp',

  // Chart UI labels
  'chart.copyToClipboard': 'Copiar gráfico al portapapeles',
  'chart.maximize': 'Maximizar gráfico',
  'chart.type.ichart': 'I-Chart',
  'chart.type.boxplot': 'Boxplot',
  'chart.type.pareto': 'Pareto',
  'chart.drillHere': '↓ explorar aquí',
  'chart.percent': 'Porcentaje',

  // Y-axis popover
  'chart.yAxisScale': 'Escala del eje Y',
  'validation.minLessThanMax': 'Mín debe ser menor que Máx',
  'action.noChanges': 'Sin cambios',

  // Create factor modal
  'factor.create': 'Crear factor a partir de selección',
  'factor.name': 'Nombre del factor',
  'factor.nameEmpty': 'El nombre del factor no puede estar vacío',
  'factor.nameExists': 'Ya existe un factor con este nombre',
  'factor.example': 'p. ej., Eventos de alta temperatura',
  'factor.pointsMarked': '{count} puntos se marcarán como:',
  'factor.createAndFilter': 'Crear y filtrar',
  'factor.filterExplanation':
    'La vista se filtrará automáticamente para mostrar solo los puntos seleccionados.',

  // Characteristic type selector
  'charType.nominal': 'Nominal',
  'charType.nominalDesc': 'Centrado en objetivo (p. ej., peso de llenado)',
  'charType.smaller': 'Menor es mejor',
  'charType.smallerDesc': 'Más bajo es mejor (p. ej., defectos)',
  'charType.larger': 'Mayor es mejor',
  'charType.largerDesc': 'Más alto es mejor (p. ej., rendimiento)',

  // Investigation prompt
  'investigation.trackingPrompt':
    'Seguimiento de su investigación — abra el panel de investigación para ver el panorama completo.',

  // Mobile category sheet
  'chart.highlight': 'Resaltar:',
  'chart.highlightRed': 'Rojo',
  'chart.highlightAmber': 'Ámbar',
  'chart.highlightGreen': 'Verde',
  'chart.clearHighlight': 'Quitar resaltado',
  'chart.drillDown': 'Explorar en "{category}"',
  'ai.askCoScout': 'Preguntar a CoScout sobre esto',

  // Settings descriptions
  'display.lockYAxisDesc': 'Mantiene la escala para comparación visual',
  'display.filterContextDesc':
    'Mostrar resumen de filtros activos debajo de los encabezados de gráficos',

  // Performance detected modal
  'performance.detected': 'Modo de rendimiento detectado',
  'performance.columnsFound': '{count} columnas de medición encontradas',
  'performance.labelQuestion': '¿Qué representan estos canales de medición?',
  'performance.labelExample': 'p. ej., Cabezal de llenado, Cavidad, Boquilla',
  'performance.enable': 'Activar modo de rendimiento',

  // Finding editor & data types
  'finding.placeholder': '¿Qué encontró?',
  'finding.note': 'Nota del hallazgo',
  'data.typeNumeric': 'Numérico',
  'data.typeCategorical': 'Categórico',
  'data.typeDate': 'Fecha',
  'data.typeText': 'Texto',
  'data.categories': 'categorías',

  // PWA HomeScreen
  'home.heading': 'Explorar análisis de variación',
  'home.description':
    'Herramienta gratuita de formación en análisis de variación. Visualice la variabilidad, calcule la capacidad y encuentre dónde enfocarse — directamente en su navegador.',
  'home.divider': 'o use sus propios datos',
  'home.pasteHelper': 'Copie filas y pegue — detectaremos las columnas automáticamente',
  'home.manualEntry': 'O ingrese datos manualmente',
  'home.upgradeHint': '¿Necesita funciones de equipo, carga de archivos o proyectos guardados?',

  // PWA navigation
  'nav.presentationMode': 'Modo presentación',
  'nav.hideFindings': 'Ocultar hallazgos',

  // Export
  'export.asImage': 'Exportar como imagen',
  'export.asCsv': 'Exportar como CSV',
  'export.imageDesc': 'Captura PNG para presentaciones',
  'export.csvDesc': 'Archivo de datos compatible con hojas de cálculo',

  // Sample section
  'sample.heading': 'Pruebe un conjunto de datos de ejemplo',
  'sample.allSamples': 'Todos los conjuntos de datos de ejemplo',
  'sample.featured': 'Destacados',
  'sample.caseStudies': 'Casos de estudio',
  'sample.journeys': 'Recorridos de aprendizaje',
  'sample.industry': 'Ejemplos de industria',

  // View modes
  'view.stats': 'Estadísticas',
  'display.appearance': 'Apariencia',

  // Azure toolbar
  'data.manualEntry': 'Entrada manual',
  'data.editTable': 'Editar tabla de datos',
  'toolbar.saveAs': 'Guardar como…',
  'toolbar.saving': 'Guardando…',
  'toolbar.saved': 'Guardado',
  'toolbar.saveFailed': 'Error al guardar',
  'toolbar.addMore': 'Agregar datos',
  'report.scouting': 'Informe de exploración',
  'export.csvFiltered': 'Exportar datos filtrados como CSV',
  'error.auth': 'Error de autenticación',

  // File browse
  'file.browseLocal': 'Explorar este dispositivo',
  'file.browseSharePoint': 'Explorar SharePoint',
  'file.open': 'Abrir archivo',

  // Admin hub
  'admin.title': 'Admin',
  'admin.status': 'Estado',
  'admin.plan': 'Plan y funciones',
  'admin.teams': 'Configuración de Teams',
  'admin.knowledge': 'Base de conocimiento',
  'admin.troubleshooting': 'Solución de problemas',

  // Admin plan tab
  'admin.currentPlan': 'Actual',
  'admin.feature': 'Función',
  'admin.manageSubscription': 'Gestionar suscripción en Azure',
  'admin.planStandard': 'Standard',
  'admin.planTeam': 'Team',
  'admin.planStandardPrice': '€79/mes',
  'admin.planTeamPrice': '€199/mes',
  'admin.planStandardDesc': 'Análisis completo con CoScout AI',
  'admin.planTeamDesc': 'Teams, OneDrive, SharePoint, base de conocimiento',

  // Feature names
  'feature.charts': 'I-Chart, Boxplot, Pareto, Estadísticas',
  'feature.capability': 'Análisis de capacidad (Cp/Cpk)',
  'feature.performance': 'Modo rendimiento (multicanal)',
  'feature.anova': 'ANOVA y análisis factorial',
  'feature.findingsWorkflow': 'Hallazgos y flujo de investigación',
  'feature.whatIf': 'Simulación qué pasaría si',
  'feature.csvImport': 'Importación CSV/Excel',
  'feature.reportExport': 'Exportación de informes (PDF)',
  'feature.indexedDb': 'Almacenamiento local IndexedDB',
  'feature.maxFactors': 'Hasta 6 factores',
  'feature.maxRows': 'Hasta 250K filas',
  'feature.onedriveSync': 'Sincronización de proyectos OneDrive',
  'feature.sharepointPicker': 'Selector de archivos SharePoint',
  'feature.teamsIntegration': 'Integración con Microsoft Teams',
  'feature.channelCollab': 'Colaboración basada en canales',
  'feature.mobileUi': 'Interfaz optimizada para móvil',
  'feature.coScoutAi': 'Asistente CoScout AI',
  'feature.narrativeBar': 'Información de NarrativeBar',
  'feature.chartInsights': 'Chips de información de gráficos',
  'feature.knowledgeBase': 'Base de conocimiento (búsqueda SharePoint)',
  'feature.aiActions': 'Acciones sugeridas por IA',

  // Admin Teams setup
  'admin.teams.heading': 'Agregar VariScout a Microsoft Teams',
  'admin.teams.description':
    'Genere un paquete de aplicación Teams para su implementación y cárguelo en su centro de administración de Teams.',
  'admin.teams.running': 'Ejecutándose dentro de Microsoft Teams',
  'admin.teams.step1': 'ID de cliente del registro de aplicación (Opcional)',
  'admin.teams.step1Desc':
    'Ingrese su ID de cliente del registro de aplicación Azure AD para habilitar SSO de Teams en el manifiesto.',
  'admin.teams.step2': 'Descargar paquete de aplicación Teams',
  'admin.teams.step2Desc':
    'Este .zip contiene el manifiesto e iconos preconfigurados para su implementación.',
  'admin.teams.step3': 'Cargar en el centro de administración de Teams',
  'admin.teams.step4': 'Agregar VariScout a un canal',
  'admin.teams.download': 'Descargar paquete de aplicación Teams',

  // Admin status tab
  'admin.checksResult': '{pass}/{total} verificaciones aprobadas',
  'admin.runChecks': 'Ejecutar todas las verificaciones',
  'admin.notApplicable': 'No aplica para su plan',
  'admin.managePortal': 'Gestionar en Azure Portal',
  'admin.portalAccessNote':
    'Estos elementos requieren acceso al Azure Portal y no se pueden verificar desde el navegador.',
  'admin.fixInPortal': 'Corregir en Azure Portal: {label}',

  // Admin troubleshoot tab
  'admin.troubleshoot.intro':
    'Problemas comunes y cómo solucionarlos. Haga clic en un problema para ver instrucciones paso a paso.',
  'admin.runCheck': 'Ejecutar verificación',
  'admin.checkPassed': 'Verificación aprobada — puede que este no sea el problema.',
  'admin.checkFailed': 'Verificación fallida — siga los pasos a continuación.',
  'admin.issue.signin': 'Los usuarios no pueden iniciar sesión',
  'admin.issue.signinDesc':
    'La autenticación de Azure AD no funciona o los usuarios ven una página en blanco.',
  'admin.issue.signinSteps':
    'Verifique que la autenticación de App Service esté habilitada en Azure Portal.\nCompruebe que el registro de aplicación Azure AD tenga las URIs de redirección correctas.\nAsegúrese de que el registro de aplicación tenga "Tokens de ID" habilitados en Autenticación.\nVerifique que el inquilino permita el inicio de sesión de usuarios en la aplicación (Aplicaciones empresariales → Propiedades → Habilitado para que los usuarios inicien sesión).',
  'admin.issue.onedrive': 'La sincronización de OneDrive no funciona',
  'admin.issue.onedriveDesc':
    'Los proyectos no se sincronizan con OneDrive o los usuarios ven errores de permisos.',
  'admin.issue.onedriveSteps':
    'Verifique que el registro de aplicación tenga el permiso delegado "Files.ReadWrite".\nCompruebe que se haya otorgado consentimiento de administrador para los permisos de Graph.\nAsegúrese de que el usuario tenga una licencia de OneDrive asignada.\nIntente cerrar sesión y volver a iniciar sesión para actualizar el token.',
  'admin.issue.coscout': 'CoScout no responde',
  'admin.issue.coscoutDesc': 'El asistente de IA no genera respuestas o muestra errores.',
  'admin.issue.coscoutSteps':
    'Verifique que el endpoint de IA esté configurado en la plantilla ARM / configuración de App Service.\nCompruebe que el recurso Azure AI Services esté implementado y en funcionamiento.\nVerifique que la implementación del modelo exista (p. ej., gpt-4o) en el recurso AI Services.\nRevise las cuotas de Azure AI Services — la implementación puede haber alcanzado los límites de tasa.',
  'admin.issue.kbEmpty': 'La base de conocimiento no devuelve resultados',
  'admin.issue.kbEmptyDesc':
    '"Buscar base de conocimiento" de CoScout no encuentra nada a pesar de existir documentos.',
  'admin.issue.kbEmptySteps':
    'Verifique que el endpoint de AI Search esté configurado en la configuración de App Service.\nCompruebe que la fuente de conocimiento remota de SharePoint se haya creado en AI Search.\nAsegúrese de que ≥1 licencia de Microsoft 365 Copilot esté activa en el inquilino.\nVerifique que el usuario tenga acceso SharePoint a los documentos buscados.\nCompruebe que el interruptor de vista previa de la base de conocimiento esté habilitado (Admin → pestaña Base de conocimiento).',
  'admin.issue.teamsTab': 'La pestaña de Teams no se muestra',
  'admin.issue.teamsTabDesc': 'VariScout no aparece en Teams o la pestaña no se carga.',
  'admin.issue.teamsTabSteps':
    'Verifique que el paquete de aplicación Teams (.zip) se haya cargado en el centro de administración de Teams.\nCompruebe que el contentUrl en manifest.json coincida con la URL de su App Service.\nAsegúrese de que la aplicación esté aprobada en el centro de administración de Teams (no bloqueada por política).\nIntente eliminar y volver a agregar la pestaña en el canal.\nSi usa un dominio personalizado, verifique que esté en el array validDomains del manifiesto.',
  'admin.issue.newUser': 'Un nuevo usuario no puede acceder a la aplicación',
  'admin.issue.newUserDesc':
    'Un usuario recién agregado ve acceso denegado o una página en blanco.',
  'admin.issue.newUserSteps':
    'En Azure AD, vaya a Aplicaciones empresariales → VariScout → Usuarios y grupos.\nAgregue el usuario o su grupo de seguridad a la aplicación.\nSi usa "Asignación de usuario requerida", asegúrese de que el usuario tenga una asignación.\nRevise las políticas de acceso condicional que podrían bloquear al usuario.',
  'admin.issue.aiSlow': 'Las respuestas de IA son lentas',
  'admin.issue.aiSlowDesc':
    'CoScout tarda mucho en responder o tiene tiempos de espera frecuentes.',
  'admin.issue.aiSlowSteps':
    'Verifique la región de implementación de Azure AI Services — la latencia aumenta con la distancia.\nCompruebe que la implementación del modelo tenga cuota suficiente de TPM (tokens por minuto).\nConsidere actualizar a una implementación de rendimiento aprovisionado para latencia consistente.\nVerifique si el índice de AI Search es grande — considere optimizar la fuente de conocimiento.',
  'admin.issue.forbidden': 'Errores "Forbidden"',
  'admin.issue.forbiddenDesc': 'Los usuarios ven errores 403 al acceder a ciertas funciones.',
  'admin.issue.forbiddenSteps':
    'Verifique que todos los permisos requeridos de Graph API tengan consentimiento de administrador.\nCompruebe que el almacén de tokens de autenticación de App Service esté habilitado.\nAsegúrese de que el token del usuario no haya expirado — intente cerrar sesión y volver a iniciar sesión.\nRevise las políticas de acceso condicional del inquilino.',
  'admin.issue.kbPartial': 'KB falla para algunos usuarios',
  'admin.issue.kbPartialDesc':
    'La búsqueda en la base de conocimiento funciona para administradores pero no para otros usuarios.',
  'admin.issue.kbPartialSteps':
    'Las fuentes de conocimiento remotas de SharePoint usan permisos por usuario. Cada usuario debe tener acceso SharePoint a los documentos.\nVerifique si los usuarios afectados están bloqueados por políticas de acceso condicional.\nCompruebe que se haya otorgado consentimiento de administrador para el permiso delegado Sites.Read.All.\nPida a los usuarios afectados que cierren sesión y vuelvan a iniciar sesión para actualizar su token.',

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
  'fi.title': 'Inteligencia de Factores',
  'fi.ranking': 'Ranking de factores (R² ajustado)',
  'fi.layer2': 'Capa 2 · Efectos Principales',
  'fi.layer3': 'Capa 3 · Interacciones de Factores',
  'fi.investigate': 'Investigar →',
  'fi.notSignificant': 'no significativo (p={value})',
  'fi.explainsSingle': '{factor} explica {pct}% de la variación por sí solo.',
  'fi.explainsMultiple': '{factors} juntos explican {pct}% de la variación.',
  'fi.layer2Locked': 'Capa 2 (Efectos Principales) se desbloquea cuando R²adj > {threshold}%',
  'fi.layer2Current': ' — actualmente {value}%',
  'fi.layer3Locked': 'Capa 3 (Interacciones) se desbloquea cuando ≥2 factores son significativos',
  'fi.layer3Current': ' — actualmente {count} significativos',
  'fi.best': 'Mejor',
  'fi.range': 'Rango',
  'fi.interactionDetected':
    'Interacción detectada: el efecto de {factorA} depende del nivel de {factorB}.',
  'fi.noInteraction': 'Sin interacción significativa — los efectos son aproximadamente aditivos.',

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
  'wall.card.hypothesisLabel': 'Hypothesis',
  'wall.card.findings': '{count} findings',
  'wall.card.evidenceGap': 'Evidence gap',
  'wall.card.missingColumn': '⚠ Condition references missing column',
  'wall.card.missingColumnAria': 'Condition references missing column',
  'wall.card.ariaLabel': 'Hypothesis {name}, {status}, {count} findings',
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
  'wall.empty.ariaLabel': 'Investigation Wall empty state',
  'wall.empty.title': 'Start with a hypothesis',
  'wall.empty.subtitle': 'Three ways to begin:',
  'wall.empty.writeHypothesis': 'Write one',
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
  'wall.canvas.ariaLabel': 'Investigation Wall canvas',
  'wall.cta.proposeHypothesis': 'Propose new hypothesis from this finding',
  'wall.toolbar.groupByTributary': 'Group by tributary',
  'wall.toolbar.zoomIn': 'Zoom in',
  'wall.toolbar.zoomOut': 'Zoom out',
  'wall.toolbar.resetView': 'Reset view',
  'wall.palette.placeholder': 'Search hubs, questions, findings…',
  'wall.palette.empty': 'No matches',
  'wall.minimap.ariaLabel': 'Investigation Wall minimap',
};
