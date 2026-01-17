/**
 * German glossary translations
 */

import type { GlossaryLocale } from '../types';

export const deGlossary: GlossaryLocale = {
  locale: 'de',
  terms: {
    // Control Limits
    ucl: {
      label: 'OKG',
      definition:
        'Obere Kontrollgrenze. Statistische Grenze bei Mittelwert + 3 Standardabweichungen.',
      description:
        'OKG zeigt die obere natürliche Grenze der Prozessvariation. Punkte oberhalb der OKG zeigen Sonderursachen an, die untersucht werden müssen.',
    },
    lcl: {
      label: 'UKG',
      definition:
        'Untere Kontrollgrenze. Statistische Grenze bei Mittelwert - 3 Standardabweichungen.',
      description:
        'UKG zeigt die untere natürliche Grenze der Prozessvariation. Punkte unterhalb der UKG zeigen Sonderursachen an.',
    },
    usl: {
      label: 'OSG',
      definition: 'Obere Spezifikationsgrenze. Vom Kunden definierter maximaler akzeptabler Wert.',
      description:
        'OSG ist die Stimme des Kunden - der maximale Wert, den er akzeptiert. Produkte oberhalb der OSG sind außerhalb der Spezifikation.',
    },
    lsl: {
      label: 'USG',
      definition: 'Untere Spezifikationsgrenze. Vom Kunden definierter minimaler akzeptabler Wert.',
      description:
        'USG ist die Stimme des Kunden - der minimale Wert, den er akzeptiert. Produkte unterhalb der USG sind außerhalb der Spezifikation.',
    },
    target: {
      label: 'Zielwert',
      definition:
        'Der ideale oder nominale Wert, typischerweise der Mittelpunkt zwischen USG und OSG.',
      description:
        'Der Zielwert repräsentiert den idealen Wert. Die Prozesszentrierung wird durch Vergleich des Mittelwerts mit dem Zielwert bewertet.',
    },

    // Capability Metrics
    cp: {
      label: 'Cp',
      definition:
        'Prozessfähigkeit. Misst, wie gut Ihr Prozess in die Spezifikationsgrenzen passt. ≥1,33 ist gut.',
      description:
        'Cp vergleicht die Breite der Spezifikationsgrenzen mit 6 Standardabweichungen. Höhere Werte bedeuten mehr Spielraum. Berücksichtigt keine Zentrierung.',
    },
    cpk: {
      label: 'Cpk',
      definition:
        'Prozessfähigkeitsindex. Wie Cp, berücksichtigt aber die Zentrierung. ≥1,33 ist gut.',
      description:
        'Cpk berücksichtigt sowohl Streuung als auch Zentrierung. Ein Cpk deutlich niedriger als Cp zeigt an, dass der Prozess zu einer Spezifikationsgrenze verschoben ist.',
    },
    passRate: {
      label: 'Gutanteil',
      definition:
        'Prozentsatz der Messwerte innerhalb der Spezifikationsgrenzen (zwischen USG und OSG).',
      description:
        'Der Gutanteil zeigt, welcher Anteil der Produkte die Kundenanforderungen erfüllt.',
    },
    rejected: {
      label: 'Ausschuss',
      definition:
        'Prozentsatz der Messwerte außerhalb der Spezifikationsgrenzen (über OSG oder unter USG).',
      description:
        'Die Ausschussrate ist der Gegenwert zum Gutanteil. Diese Produkte erfüllen die Kundenanforderungen nicht.',
    },

    // Basic Statistics
    mean: {
      label: 'Mittelwert',
      definition: 'Durchschnittswert. Summe aller Messwerte geteilt durch deren Anzahl.',
      description:
        'Der arithmetische Mittelwert repräsentiert das Zentrum der Datenverteilung. Vergleich mit dem Zielwert zur Bewertung der Zentrierung.',
    },
    stdDev: {
      label: 'Stdabw.',
      definition:
        'Standardabweichung. Misst die Streuung oder Variabilität der Messwerte um den Mittelwert.',
      description:
        'Die Standardabweichung (σ) quantifiziert, wie stark Werte vom Durchschnitt abweichen. Kleinere Werte zeigen konsistentere Prozesse an.',
    },

    // ANOVA Statistics
    fStatistic: {
      label: 'F-Wert',
      definition:
        'Verhältnis der Varianz zwischen Gruppen zur Varianz innerhalb der Gruppen (ANOVA).',
      description:
        'Der F-Wert vergleicht die Variation zwischen Gruppen mit der Variation innerhalb der Gruppen. Höhere F-Werte zeigen größere Unterschiede zwischen den Gruppenmittelwerten an.',
    },
    pValue: {
      label: 'p-Wert',
      definition:
        'Wahrscheinlichkeit, dass der beobachtete Unterschied zufällig entstanden ist. p < 0,05 = statistisch signifikant.',
      description:
        'Der p-Wert testet die Nullhypothese, dass alle Gruppenmittelwerte gleich sind. Kleine p-Werte (< 0,05) liefern Hinweise, dass mindestens ein Gruppenmittelwert abweicht.',
    },
    etaSquared: {
      label: 'η²',
      definition:
        'Effektgröße, die zeigt, wie viel Variation durch den Faktor erklärt wird. Klein < 0,06, mittel 0,06-0,14, groß > 0,14.',
      description:
        'Eta-Quadrat (η²) gibt den Anteil der Gesamtvarianz an, der durch den Gruppierungsfaktor erklärt wird. Im Gegensatz zum p-Wert zeigt es die praktische Bedeutung.',
    },

    // Regression Statistics
    rSquared: {
      label: 'R²',
      definition:
        'Bestimmtheitsmaß. Zeigt, wie viel der Y-Variation durch X erklärt wird. Näher an 1 = stärker.',
      description:
        'R² reicht von 0 bis 1. Ein R² von 0,80 bedeutet, dass 80% der Variation in Y durch die Beziehung zu X erklärt werden können.',
    },
    slope: {
      label: 'Steigung',
      definition: 'Wie stark sich Y pro Einheitszunahme von X ändert. Positiv = Y steigt mit X.',
      description:
        'Die Steigung quantifiziert die Änderungsrate der Beziehung. Eine Steigung von 2,5 bedeutet, dass Y um 2,5 Einheiten steigt, wenn X um 1 Einheit steigt.',
    },
    intercept: {
      label: 'Achsenabschnitt',
      definition: 'Der vorhergesagte Wert von Y, wenn X gleich Null ist.',
      description:
        'Der y-Achsenabschnitt ist der Punkt, an dem die Regressionslinie die Y-Achse schneidet.',
    },

    // Gage R&R Statistics
    grr: {
      label: '%GRR',
      definition:
        'Messsystemvariation als Prozentsatz der Studienvariation. <10% ausgezeichnet, 10-30% grenzwertig, >30% nicht akzeptabel.',
      description:
        'Gage R&R (Wiederholbarkeit & Reproduzierbarkeit) bewertet die Messsystemfähigkeit. Es kombiniert Variation vom Gerät und von Bedienern.',
    },
    repeatability: {
      label: 'Wiederholbarkeit',
      definition:
        'Gerätevariation. Die Variation, wenn derselbe Bediener dasselbe Teil mehrfach misst.',
      description:
        'Wiederholbarkeit (EV) misst die Präzision des Messgeräts. Hohe Wiederholbarkeitsvariation deutet auf Kalibrierungs- oder Austauschbedarf hin.',
    },
    reproducibility: {
      label: 'Reproduzierbarkeit',
      definition:
        'Bedienervariation. Die Variation, wenn verschiedene Bediener dieselben Teile messen.',
      description:
        'Reproduzierbarkeit (AV) misst die Konsistenz zwischen Bedienern. Hohe Reproduzierbarkeitsvariation deutet auf Schulungsbedarf hin.',
    },
  },
};
