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
  'display.chartTextSize': 'Tamaño de texto del gráfico',
  'display.compact': 'Compacto',
  'display.normal': 'Normal',
  'display.large': 'Grande',
  'display.lockYAxis': 'Bloquear eje Y',
  'display.filterContext': 'Contexto de filtro',
  'display.showSpecs': 'Mostrar especificaciones',

  // Investigation
  'investigation.brief': 'Resumen de investigación',
  'investigation.assignedToMe': 'Asignado a mí',
  'investigation.hypothesis': 'Hipótesis',
  'investigation.hypotheses': 'Hipótesis',
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

  // Methodology Coach
  'coach.frame': 'Enmarcar',
  'coach.scout': 'Explorar',
  'coach.investigate': 'Investigar',
  'coach.improve': 'Mejorar',
  'coach.frameDesc': 'Definir el problema y establecer límites',
  'coach.scoutDesc': 'Recopilar datos y explorar patrones',
  'coach.investigateDesc': 'Probar hipótesis y encontrar causas raíz',
  'coach.improveDesc': 'Implementar cambios y verificar resultados',

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
  'data.problemPlaceholder': 'Describa el problema que está investigando…',
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
  'data.addHypothesis': 'Agregar hipótesis',
  'data.removeHypothesis': 'Eliminar hipótesis',
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

  // Coach mobile phase titles
  'coach.frameTitle': 'Enmarcar el problema',
  'coach.scoutTitle': 'Explorar los datos',
  'coach.investigateTitle': 'Investigar las causas',
  'coach.improveTitle': 'Mejorar el proceso',

  // AI action tool labels
  'ai.tool.applyFilter': 'Aplicar filtro',
  'ai.tool.clearFilters': 'Limpiar filtros',
  'ai.tool.switchFactor': 'Cambiar factor',
  'ai.tool.createFinding': 'Crear hallazgo',
  'ai.tool.createHypothesis': 'Crear hipótesis',
  'ai.tool.suggestAction': 'Sugerir acción',
  'ai.tool.shareFinding': 'Compartir hallazgo',
  'ai.tool.publishReport': 'Publicar informe',
  'ai.tool.notifyOwners': 'Notificar a responsables',

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
  'display.contribution': 'Contribución',
  'display.contributionDesc': 'Mostrar contribución a la variación',
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
};
