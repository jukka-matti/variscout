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
};
