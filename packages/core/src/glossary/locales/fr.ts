/**
 * French glossary translations
 */

import type { GlossaryLocale } from '../types';

export const frGlossary: GlossaryLocale = {
  locale: 'fr',
  terms: {
    // Control Limits
    ucl: {
      label: 'LCS',
      definition:
        'Limite de Contrôle Supérieure. Frontière statistique à moyenne + 3 écarts-types.',
      description:
        'LCS représente la frontière supérieure naturelle de la variation du processus. Les points au-dessus de la LCS indiquent des causes spéciales nécessitant une investigation.',
    },
    lcl: {
      label: 'LCI',
      definition:
        'Limite de Contrôle Inférieure. Frontière statistique à moyenne - 3 écarts-types.',
      description:
        'LCI représente la frontière inférieure naturelle de la variation du processus. Les points en dessous de la LCI indiquent des causes spéciales.',
    },
    usl: {
      label: 'LSS',
      definition:
        'Limite de Spécification Supérieure. Valeur maximale acceptable définie par le client.',
      description:
        'LSS est la voix du client - la valeur maximale acceptée. Les produits au-dessus de la LSS sont hors spécification.',
    },
    lsl: {
      label: 'LSI',
      definition:
        'Limite de Spécification Inférieure. Valeur minimale acceptable définie par le client.',
      description:
        'LSI est la voix du client - la valeur minimale acceptée. Les produits en dessous de la LSI sont hors spécification.',
    },
    target: {
      label: 'Cible',
      definition: 'La valeur idéale ou nominale, typiquement le point médian entre LSI et LSS.',
      description:
        'La cible représente la valeur idéale. Le centrage du processus est évalué en comparant la moyenne à la cible.',
    },

    // Capability Metrics
    cp: {
      label: 'Cp',
      definition:
        'Capabilité du Processus. Mesure la compatibilité de votre processus avec les limites de spécification. ≥1,33 est bon.',
      description:
        'Cp compare la largeur des limites de spécification à 6 écarts-types. Des valeurs plus élevées signifient plus de marge. Ne tient pas compte du centrage.',
    },
    cpk: {
      label: 'Cpk',
      definition:
        'Indice de Capabilité du Processus. Comme Cp, mais tient compte du centrage. ≥1,33 est bon.',
      description:
        'Cpk considère à la fois la dispersion et le centrage. Un Cpk beaucoup plus faible que Cp indique que la moyenne est décalée vers une limite.',
    },
    passRate: {
      label: 'Taux de Conformité',
      definition: 'Pourcentage des mesures dans les limites de spécification (entre LSI et LSS).',
      description:
        'Le taux de conformité montre quelle proportion de produits répond aux exigences du client.',
    },
    rejected: {
      label: 'Rejeté',
      definition:
        'Pourcentage des mesures hors limites de spécification (au-dessus de LSS ou en dessous de LSI).',
      description:
        "Le taux de rejet est l'inverse du taux de conformité. Ces produits ne répondent pas aux exigences du client.",
    },

    // Basic Statistics
    mean: {
      label: 'Moyenne',
      definition: 'Valeur moyenne. Somme de toutes les mesures divisée par le nombre.',
      description:
        'La moyenne arithmétique représente le centre de la distribution des données. Comparez à la cible pour évaluer le centrage.',
    },
    stdDev: {
      label: 'Écart-type',
      definition:
        'Écart-type. Mesure la dispersion ou variabilité des mesures autour de la moyenne.',
      description:
        "L'écart-type (σ) quantifie la variation des valeurs par rapport à la moyenne. Des valeurs plus petites indiquent des processus plus constants.",
    },

    // ANOVA Statistics
    fStatistic: {
      label: 'Statistique F',
      definition:
        "Mesure le rapport de la variance entre groupes à la variance au sein des groupes dans l'ANOVA.",
      description:
        'La statistique F compare la variation entre groupes à la variation au sein des groupes. Des valeurs F plus élevées indiquent des différences plus grandes entre les moyennes des groupes.',
    },
    pValue: {
      label: 'valeur-p',
      definition:
        'Probabilité que la différence observée soit due au hasard. p < 0,05 = statistiquement significatif.',
      description:
        "La valeur-p teste l'hypothèse nulle que toutes les moyennes de groupe sont égales. De petites valeurs-p (< 0,05) fournissent la preuve qu'au moins une moyenne diffère.",
    },
    etaSquared: {
      label: 'η²',
      definition:
        "Taille d'effet montrant quelle variation est expliquée par le facteur. Petit < 0,06, moyen 0,06-0,14, grand > 0,14.",
      description:
        'Eta carré (η²) représente la proportion de variance totale expliquée par le facteur de groupement. Contrairement à la valeur-p, il indique la significativité pratique.',
    },

    // Regression Statistics
    rSquared: {
      label: 'R²',
      definition:
        'Coefficient de détermination. Montre quelle variation de Y est expliquée par X. Plus proche de 1 = plus fort.',
      description:
        'R² va de 0 à 1. Un R² de 0,80 signifie que 80% de la variation de Y peut être expliquée par la relation avec X.',
    },
    slope: {
      label: 'Pente',
      definition: 'Combien Y change pour chaque unité de X. Positif = Y augmente avec X.',
      description:
        'La pente quantifie le taux de changement dans la relation. Une pente de 2,5 signifie que Y augmente de 2,5 unités pour chaque unité de X.',
    },
    intercept: {
      label: 'Ordonnée',
      definition: 'La valeur prédite de Y lorsque X est égal à zéro.',
      description: "L'ordonnée à l'origine est le point où la droite de régression coupe l'axe Y.",
    },

    // Gage R&R Statistics
    grr: {
      label: '%GRR',
      definition:
        "Variation du système de mesure en pourcentage de la variation de l'étude. <10% excellent, 10-30% marginal, >30% inacceptable.",
      description:
        "Gage R&R (Répétabilité et Reproductibilité) évalue la capabilité du système de mesure. Il combine la variation de l'équipement et des opérateurs.",
    },
    repeatability: {
      label: 'Répétabilité',
      definition:
        "Variation de l'équipement. La variation quand le même opérateur mesure la même pièce plusieurs fois.",
      description:
        "La répétabilité (EV) mesure la précision de l'équipement de mesure. Une haute variation de répétabilité suggère un besoin de calibration ou de remplacement.",
    },
    reproducibility: {
      label: 'Reproductibilité',
      definition:
        "Variation de l'opérateur. La variation quand différents opérateurs mesurent les mêmes pièces.",
      description:
        'La reproductibilité (AV) mesure la consistance entre opérateurs. Une haute variation de reproductibilité suggère un besoin de formation.',
    },
  },
};
