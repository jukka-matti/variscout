/**
 * Finnish glossary translations
 */

import type { GlossaryLocale } from '../types';

export const fiGlossary: GlossaryLocale = {
  locale: 'fi',
  terms: {
    // Control Limits
    ucl: {
      label: 'UCL',
      definition: 'Ylempi ohjausraja. Tilastollinen raja keskiarvon + 3 keskihajonnan kohdalla.',
      description:
        'UCL osoittaa prosessivaihtelun ylemmän luonnollisen rajan. Pisteet UCL:n yläpuolella viittaavat erityissyihin, joita on tutkittava.',
    },
    lcl: {
      label: 'LCL',
      definition: 'Alempi ohjausraja. Tilastollinen raja keskiarvon - 3 keskihajonnan kohdalla.',
      description:
        'LCL osoittaa prosessivaihtelun alemman luonnollisen rajan. Pisteet LCL:n alapuolella viittaavat erityissyihin.',
    },
    usl: {
      label: 'USL',
      definition: 'Ylempi spesifikaatioraja. Asiakkaan määrittelemä suurin hyväksyttävä arvo.',
      description:
        'USL on asiakkaan ääni — suurin arvo, jonka asiakas hyväksyy. Tuotteet USL:n yläpuolella ovat toleranssin ulkopuolella.',
    },
    lsl: {
      label: 'LSL',
      definition: 'Alempi spesifikaatioraja. Asiakkaan määrittelemä pienin hyväksyttävä arvo.',
      description:
        'LSL on asiakkaan ääni — pienin arvo, jonka asiakas hyväksyy. Tuotteet LSL:n alapuolella ovat toleranssin ulkopuolella.',
    },
    target: {
      label: 'Tavoite',
      definition: 'Ihanteellinen tai nimellisarvo, tyypillisesti LSL:n ja USL:n keskipiste.',
      description:
        'Tavoitearvo edustaa ihanteellista arvoa. Prosessin keskitystä arvioidaan vertaamalla keskiarvoa tavoiteeseen.',
    },

    // Capability Metrics
    cp: {
      label: 'Cp',
      definition:
        'Prosessikyvykkyys. Mittaa kuinka hyvin prosessi mahtuu spesifikaatiorajojen sisään. ≥1,33 on hyvä.',
      description:
        'Cp vertaa spesifikaatiorajojen väliä 6 keskihajontaan. Suuremmat arvot tarkoittavat enemmän pelivaraa. Ei huomioi keskitystä.',
    },
    cpk: {
      label: 'Cpk',
      definition: 'Prosessikyvykkyysindeksi. Kuten Cp, mutta huomioi keskityksen. ≥1,33 on hyvä.',
      description:
        'Cpk huomioi sekä hajonnan että keskityksen. Cpk merkittävästi Cp:tä pienempi tarkoittaa, että prosessi on siirtynyt lähemmäs toista spesifikaatiorajaa.',
    },
    passRate: {
      label: 'Hyväksyntäaste',
      definition:
        'Prosenttiosuus mittauksista, jotka ovat spesifikaatiorajojen sisällä (LSL:n ja USL:n välissä).',
      description:
        'Hyväksyntäaste näyttää kuinka suuri osuus tuotteista täyttää asiakkaan vaatimukset.',
    },
    rejected: {
      label: 'Hylätty',
      definition:
        'Prosenttiosuus mittauksista spesifikaatiorajojen ulkopuolella (yli USL tai alle LSL).',
      description:
        'Hylkäysaste on hyväksyntäasteen vastakohta. Nämä tuotteet eivät täytä asiakkaan vaatimuksia.',
    },

    // Basic Statistics
    mean: {
      label: 'Keskiarvo',
      definition: 'Keskiarvo. Kaikkien mittausarvojen summa jaettuna lukumäärällä.',
      description:
        'Aritmeettinen keskiarvo edustaa datajakauman keskikohtaa. Vertaa tavoitearvoon keskityksen arvioimiseksi.',
    },
    stdDev: {
      label: 'Keskihaj.',
      definition:
        'Keskihajonta. Mittaa mittausarvojen hajonnan eli vaihtelun keskiarvon ympärillä.',
      description:
        'Keskihajonta (σ) kuvaa kuinka paljon arvot poikkeavat keskiarvosta. Pienemmät arvot tarkoittavat johdonmukaisempaa prosessia.',
    },

    // ANOVA Statistics
    fStatistic: {
      label: 'F-arvo',
      definition: 'Ryhmien välisen varianssin suhde ryhmien sisäiseen varianssiin (ANOVA).',
      description:
        'F-arvo vertaa ryhmien välistä vaihtelua ryhmien sisäiseen vaihteluun. Suuremmat F-arvot viittaavat suurempiin eroihin ryhmäkeskiarvoissa.',
    },
    pValue: {
      label: 'p-arvo',
      definition:
        'Todennäköisyys, että havaittu ero johtuu sattumasta. p < 0,05 = tilastollisesti merkitsevä.',
      description:
        'p-arvo testaa nollahypoteesia, jonka mukaan kaikki ryhmäkeskiarvot ovat samat. Pienet p-arvot (< 0,05) antavat näyttöä siitä, että ainakin yksi ryhmäkeskiarvo poikkeaa.',
    },
    etaSquared: {
      label: 'η²',
      definition:
        'Vaikutuskoko, joka osoittaa kuinka suuren osan vaihtelusta tekijä selittää. Pieni < 0,06, keskisuuri 0,06-0,14, suuri > 0,14.',
      description:
        'Etan neliö (η²) kertoo ryhmittelytekijän selittämän osuuden kokonaisvarianssista. Toisin kuin p-arvo, se osoittaa käytännön merkityksen.',
    },

    // Regression Statistics
    rSquared: {
      label: 'R²',
      definition:
        'Selitysaste. Osoittaa kuinka suuri osa Y:n vaihtelusta selittyy X:llä. Lähempänä 1 = vahvempi.',
      description:
        'R² vaihtelee 0:sta 1:een. R² = 0,80 tarkoittaa, että 80 % Y:n vaihtelusta selittyy X:n kanssa.',
    },
    slope: {
      label: 'Kulmakerroin',
      definition:
        'Kuinka paljon Y muuttuu yhden X-yksikön muutosta kohti. Positiivinen = Y kasvaa X:n kasvaessa.',
      description:
        'Kulmakerroin kuvaa muutosnopeutta. Kulmakerroin 2,5 tarkoittaa, että Y kasvaa 2,5 yksikköä, kun X kasvaa 1 yksikön.',
    },
    intercept: {
      label: 'Vakio',
      definition: 'Y:n ennustettu arvo, kun X on nolla.',
      description: 'Vakio on piste, jossa regressiosuora leikkaa Y-akselin.',
    },
  },
};
