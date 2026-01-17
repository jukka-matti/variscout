/**
 * Spanish glossary translations
 */

import type { GlossaryLocale } from '../types';

export const esGlossary: GlossaryLocale = {
  locale: 'es',
  terms: {
    // Control Limits
    ucl: {
      label: 'LCS',
      definition:
        'Límite de Control Superior. Frontera estadística en media + 3 desviaciones estándar.',
      description:
        'LCS representa la frontera superior natural de la variación del proceso. Puntos por encima del LCS indican causas especiales que requieren investigación.',
    },
    lcl: {
      label: 'LCI',
      definition:
        'Límite de Control Inferior. Frontera estadística en media - 3 desviaciones estándar.',
      description:
        'LCI representa la frontera inferior natural de la variación del proceso. Puntos por debajo del LCI indican causas especiales.',
    },
    usl: {
      label: 'LES',
      definition:
        'Límite de Especificación Superior. Valor máximo aceptable definido por el cliente.',
      description:
        'LES es la voz del cliente - el valor máximo que aceptará. Productos por encima del LES están fuera de especificación.',
    },
    lsl: {
      label: 'LEI',
      definition:
        'Límite de Especificación Inferior. Valor mínimo aceptable definido por el cliente.',
      description:
        'LEI es la voz del cliente - el valor mínimo que aceptará. Productos por debajo del LEI están fuera de especificación.',
    },
    target: {
      label: 'Objetivo',
      definition: 'El valor ideal o nominal, típicamente el punto medio entre LEI y LES.',
      description:
        'El objetivo representa el valor ideal. El centrado del proceso se evalúa comparando la media con el objetivo.',
    },

    // Capability Metrics
    cp: {
      label: 'Cp',
      definition:
        'Capacidad del Proceso. Mide qué tan bien su proceso cabe dentro de los límites de especificación. ≥1,33 es bueno.',
      description:
        'Cp compara el ancho de los límites de especificación con 6 desviaciones estándar. Valores más altos significan más margen. No considera el centrado.',
    },
    cpk: {
      label: 'Cpk',
      definition:
        'Índice de Capacidad del Proceso. Como Cp, pero considera el centrado. ≥1,33 es bueno.',
      description:
        'Cpk considera tanto la dispersión como el centrado. Un Cpk mucho menor que Cp indica que la media del proceso está desplazada hacia un límite.',
    },
    passRate: {
      label: 'Tasa de Aprobación',
      definition:
        'Porcentaje de mediciones dentro de los límites de especificación (entre LEI y LES).',
      description:
        'La tasa de aprobación muestra qué proporción de productos cumple con los requisitos del cliente.',
    },
    rejected: {
      label: 'Rechazado',
      definition:
        'Porcentaje de mediciones fuera de los límites de especificación (sobre LES o bajo LEI).',
      description:
        'La tasa de rechazo es el inverso de la tasa de aprobación. Estos productos no cumplen los requisitos del cliente.',
    },

    // Basic Statistics
    mean: {
      label: 'Media',
      definition: 'Valor promedio. Suma de todas las mediciones dividida por el conteo.',
      description:
        'La media aritmética representa el centro de la distribución de datos. Compare con el objetivo para evaluar el centrado.',
    },
    stdDev: {
      label: 'Desv. Est.',
      definition:
        'Desviación Estándar. Mide la dispersión o variabilidad de las mediciones alrededor de la media.',
      description:
        'La desviación estándar (σ) cuantifica cuánto varían los valores del promedio. Valores más pequeños indican procesos más consistentes.',
    },

    // ANOVA Statistics
    fStatistic: {
      label: 'Estadístico F',
      definition:
        'Mide la razón de la varianza entre grupos a la varianza dentro de grupos en ANOVA.',
      description:
        'El estadístico F compara la variación entre grupos con la variación dentro de grupos. Valores F más altos indican mayores diferencias entre medias de grupos.',
    },
    pValue: {
      label: 'valor-p',
      definition:
        'Probabilidad de que la diferencia observada ocurriera por azar. p < 0,05 = estadísticamente significativo.',
      description:
        'El valor-p prueba la hipótesis nula de que todas las medias de grupo son iguales. Valores-p pequeños (< 0,05) proporcionan evidencia de que al menos una media difiere.',
    },
    etaSquared: {
      label: 'η²',
      definition:
        'Tamaño del efecto que muestra cuánta variación explica el factor. Pequeño < 0,06, medio 0,06-0,14, grande > 0,14.',
      description:
        'Eta cuadrado (η²) representa la proporción de varianza total explicada por el factor de agrupación. A diferencia del valor-p, indica significancia práctica.',
    },

    // Regression Statistics
    rSquared: {
      label: 'R²',
      definition:
        'Coeficiente de determinación. Muestra cuánta variación de Y explica X. Más cerca de 1 = más fuerte.',
      description:
        'R² va de 0 a 1. Un R² de 0,80 significa que el 80% de la variación en Y puede explicarse por la relación con X.',
    },
    slope: {
      label: 'Pendiente',
      definition: 'Cuánto cambia Y por cada unidad de aumento en X. Positivo = Y aumenta con X.',
      description:
        'La pendiente cuantifica la tasa de cambio en la relación. Una pendiente de 2,5 significa que Y aumenta 2,5 unidades por cada unidad de X.',
    },
    intercept: {
      label: 'Intercepto',
      definition: 'El valor predicho de Y cuando X es igual a cero.',
      description: 'El intercepto-y es donde la línea de regresión cruza el eje Y.',
    },

    // Gage R&R Statistics
    grr: {
      label: '%GRR',
      definition:
        'Variación del sistema de medición como porcentaje de la variación del estudio. <10% excelente, 10-30% marginal, >30% inaceptable.',
      description:
        'Gage R&R (Repetibilidad y Reproducibilidad) evalúa la capacidad del sistema de medición. Combina la variación del equipo y de los operadores.',
    },
    repeatability: {
      label: 'Repetibilidad',
      definition:
        'Variación del equipo. La variación cuando el mismo operador mide la misma pieza múltiples veces.',
      description:
        'La repetibilidad (EV) mide la precisión del equipo de medición. Alta variación de repetibilidad sugiere necesidad de calibración o reemplazo.',
    },
    reproducibility: {
      label: 'Reproducibilidad',
      definition:
        'Variación del operador. La variación cuando diferentes operadores miden las mismas piezas.',
      description:
        'La reproducibilidad (AV) mide la consistencia entre operadores. Alta variación de reproducibilidad sugiere necesidad de capacitación.',
    },
  },
};
