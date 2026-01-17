/**
 * Portuguese glossary translations
 */

import type { GlossaryLocale } from '../types';

export const ptGlossary: GlossaryLocale = {
  locale: 'pt',
  terms: {
    // Control Limits
    ucl: {
      label: 'LSC',
      definition: 'Limite Superior de Controle. Fronteira estatística em média + 3 desvios padrão.',
      description:
        'LSC representa a fronteira superior natural da variação do processo. Pontos acima do LSC indicam causas especiais que requerem investigação.',
    },
    lcl: {
      label: 'LIC',
      definition: 'Limite Inferior de Controle. Fronteira estatística em média - 3 desvios padrão.',
      description:
        'LIC representa a fronteira inferior natural da variação do processo. Pontos abaixo do LIC indicam causas especiais.',
    },
    usl: {
      label: 'LSE',
      definition: 'Limite Superior de Especificação. Valor máximo aceitável definido pelo cliente.',
      description:
        'LSE é a voz do cliente - o valor máximo que ele aceita. Produtos acima do LSE estão fora de especificação.',
    },
    lsl: {
      label: 'LIE',
      definition: 'Limite Inferior de Especificação. Valor mínimo aceitável definido pelo cliente.',
      description:
        'LIE é a voz do cliente - o valor mínimo que ele aceita. Produtos abaixo do LIE estão fora de especificação.',
    },
    target: {
      label: 'Alvo',
      definition: 'O valor ideal ou nominal, tipicamente o ponto médio entre LIE e LSE.',
      description:
        'O alvo representa o valor ideal. A centralização do processo é avaliada comparando a média com o alvo.',
    },

    // Capability Metrics
    cp: {
      label: 'Cp',
      definition:
        'Capacidade do Processo. Mede quão bem seu processo cabe nos limites de especificação. ≥1,33 é bom.',
      description:
        'Cp compara a largura dos limites de especificação com 6 desvios padrão. Valores maiores significam mais margem. Não considera a centralização.',
    },
    cpk: {
      label: 'Cpk',
      definition:
        'Índice de Capacidade do Processo. Como Cp, mas considera a centralização. ≥1,33 é bom.',
      description:
        'Cpk considera tanto a dispersão quanto a centralização. Um Cpk muito menor que Cp indica que a média do processo está deslocada para um limite.',
    },
    passRate: {
      label: 'Taxa de Aprovação',
      definition: 'Porcentagem das medições dentro dos limites de especificação (entre LIE e LSE).',
      description:
        'A taxa de aprovação mostra qual proporção de produtos atende aos requisitos do cliente.',
    },
    rejected: {
      label: 'Rejeitado',
      definition:
        'Porcentagem das medições fora dos limites de especificação (acima do LSE ou abaixo do LIE).',
      description:
        'A taxa de rejeição é o inverso da taxa de aprovação. Esses produtos não atendem aos requisitos do cliente.',
    },

    // Basic Statistics
    mean: {
      label: 'Média',
      definition: 'Valor médio. Soma de todas as medições dividida pela contagem.',
      description:
        'A média aritmética representa o centro da distribuição de dados. Compare com o alvo para avaliar a centralização.',
    },
    stdDev: {
      label: 'Desv. Pad.',
      definition:
        'Desvio Padrão. Mede a dispersão ou variabilidade das medições em torno da média.',
      description:
        'O desvio padrão (σ) quantifica quanto os valores variam da média. Valores menores indicam processos mais consistentes.',
    },

    // ANOVA Statistics
    fStatistic: {
      label: 'Estatística F',
      definition:
        'Mede a razão da variância entre grupos para a variância dentro dos grupos na ANOVA.',
      description:
        'A estatística F compara a variação entre grupos com a variação dentro dos grupos. Valores F mais altos indicam maiores diferenças entre médias de grupos.',
    },
    pValue: {
      label: 'valor-p',
      definition:
        'Probabilidade de que a diferença observada tenha ocorrido por acaso. p < 0,05 = estatisticamente significativo.',
      description:
        'O valor-p testa a hipótese nula de que todas as médias de grupo são iguais. Valores-p pequenos (< 0,05) fornecem evidência de que pelo menos uma média difere.',
    },
    etaSquared: {
      label: 'η²',
      definition:
        'Tamanho do efeito mostrando quanta variação é explicada pelo fator. Pequeno < 0,06, médio 0,06-0,14, grande > 0,14.',
      description:
        'Eta quadrado (η²) representa a proporção da variância total explicada pelo fator de agrupamento. Diferente do valor-p, indica significância prática.',
    },

    // Regression Statistics
    rSquared: {
      label: 'R²',
      definition:
        'Coeficiente de determinação. Mostra quanta variação de Y é explicada por X. Mais perto de 1 = mais forte.',
      description:
        'R² vai de 0 a 1. Um R² de 0,80 significa que 80% da variação em Y pode ser explicada pela relação com X.',
    },
    slope: {
      label: 'Inclinação',
      definition: 'Quanto Y muda para cada unidade de aumento em X. Positivo = Y aumenta com X.',
      description:
        'A inclinação quantifica a taxa de mudança na relação. Uma inclinação de 2,5 significa que Y aumenta 2,5 unidades para cada unidade de X.',
    },
    intercept: {
      label: 'Intercepto',
      definition: 'O valor previsto de Y quando X é igual a zero.',
      description: 'O intercepto-y é onde a linha de regressão cruza o eixo Y.',
    },

    // Gage R&R Statistics
    grr: {
      label: '%GRR',
      definition:
        'Variação do sistema de medição como porcentagem da variação do estudo. <10% excelente, 10-30% marginal, >30% inaceitável.',
      description:
        'Gage R&R (Repetibilidade e Reprodutibilidade) avalia a capacidade do sistema de medição. Combina a variação do equipamento e dos operadores.',
    },
    repeatability: {
      label: 'Repetibilidade',
      definition:
        'Variação do equipamento. A variação quando o mesmo operador mede a mesma peça múltiplas vezes.',
      description:
        'A repetibilidade (EV) mede a precisão do equipamento de medição. Alta variação de repetibilidade sugere necessidade de calibração ou substituição.',
    },
    reproducibility: {
      label: 'Reprodutibilidade',
      definition:
        'Variação do operador. A variação quando diferentes operadores medem as mesmas peças.',
      description:
        'A reprodutibilidade (AV) mede a consistência entre operadores. Alta variação de reprodutibilidade sugere necessidade de treinamento.',
    },
  },
};
