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

  // Limit labels
  'limits.usl': 'LSE',
  'limits.lsl': 'LIE',
  'limits.ucl': 'LSC',
  'limits.lcl': 'LIC',
  'limits.mean': 'Media',
  'limits.target': 'Objetivo',

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
};
