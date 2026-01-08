export interface SampleDataset {
  name: string;
  description: string;
  icon: string;
  urlKey: string; // URL-friendly key for ?sample= parameter
  data: any[];
  config: {
    outcome: string;
    factors: string[];
    specs: { usl?: number; lsl?: number; target?: number };
    grades?: { max: number; label: string; color: string }[];
  };
}

// Helper to generate random normal distribution
const generateNormal = (mean: number, std: number) => {
  const u = 1 - Math.random();
  const v = Math.random();
  const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return z * std + mean;
};

// 1. Agri-Food: Mango Export Compliance (Common ITC Sector)
// Scenario: Exporting mangoes to EU requires strict weight classes.
const mangoData = Array.from({ length: 150 }, (_, i) => {
  const farm = i < 50 ? 'Farm A (Smallholder)' : i < 100 ? 'Farm B (Co-op)' : 'Farm C (Commercial)';
  // Farm A has higher variance (less standardized)
  const weight =
    i < 50 ? generateNormal(320, 25) : i < 100 ? generateNormal(330, 15) : generateNormal(325, 10);
  return {
    id: i + 1,
    'Fruit Weight (g)': Number(weight.toFixed(1)),
    'Origin Farm': farm,
    Variety: 'Kent',
    'Harvest Date': new Date(2023, 10, 1 + Math.floor(i / 10)).toISOString().split('T')[0],
  };
});

// 2. Textiles: Cotton Fabric Strength (Common ITC Sector)
// Scenario: Testing tensile strength of woven cotton for garment manufacturing.
const textileData = Array.from({ length: 150 }, (_, i) => {
  const loom = i < 75 ? 'Loom #101 (Vintage)' : 'Loom #205 (Modern)';
  // Vintage loom has lower average strength
  const strength = i < 75 ? generateNormal(42, 3) : generateNormal(48, 1.5);
  return {
    id: i + 1,
    'Tensile Strength (N)': Number(strength.toFixed(1)),
    'Loom ID': loom,
    Batch: `B-${Math.floor(i / 20)}`,
    Operator: i % 3 === 0 ? 'Op_X' : i % 3 === 1 ? 'Op_Y' : 'Op_Z',
  };
});

// 3. Coffee Quality: Defect Counts (ITC Sector)
// Scenario: Counting total defects per 300g sample.
// Spec: < 5 is Specialty, < 8 is Premium, < 23 is Exchange, > 23 is Off-Grade.
// For Lite version with single USL, we set USL = 23 (Exchange vs Off-Grade boundary)
const coffeeData = Array.from({ length: 150 }, (_, i) => {
  const coop = i < 50 ? 'Coop North' : i < 100 ? 'Coop Central' : 'Coop South';
  // North is high quality (low defects), South is struggling
  const meanDefects = i < 50 ? 3 : i < 100 ? 7 : 20;
  const defects = Math.max(0, Math.round(generateNormal(meanDefects, i < 100 ? 2 : 8)));

  return {
    id: i + 1,
    'Total Defects (per 300g)': defects,
    Cooperative: coop,
    'Processing Method': i % 2 === 0 ? 'Washed' : 'Natural',
    Date: new Date(2023, 11, 1 + Math.floor(i / 5)).toISOString().split('T')[0],
  };
});

// 4. Bottleneck: Process Step Analysis (ESTIEM Training Case)
// Story: Step 3 was blamed, but Step 2 has 3x the variation
const bottleneckData = (() => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  const shifts = ['Morning', 'Afternoon'];
  const data: any[] = [];
  let id = 1;

  for (let step = 1; step <= 5; step++) {
    for (const shift of shifts) {
      for (const day of days) {
        for (let rep = 0; rep < 3; rep++) {
          // Step 2 has 3x the variation (std=10 vs std=2-3 for others)
          const mean = step === 2 ? 40 : step === 3 ? 45 : step === 1 ? 32 : step === 4 ? 34 : 30;
          const std = step === 2 ? 10 : 2;
          const cycleTime = Math.round(generateNormal(mean, std));
          data.push({
            Observation: id++,
            Step: `Step ${step}`,
            Cycle_Time_sec: Math.max(15, Math.min(60, cycleTime)),
            Shift: shift,
            Day: day,
          });
        }
      }
    }
  }
  return data;
})();

// 5. Hospital Ward: Aggregation Trap (ABB Practitioner Case)
// Story: 75% daily average hides 95% night crisis and 45% afternoon waste
const hospitalWardData = (() => {
  const data: any[] = [];
  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const startDate = new Date('2026-01-01');

  for (let day = 0; day < 28; day++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + day);
    const dayOfWeek = daysOfWeek[currentDate.getDay() === 0 ? 6 : currentDate.getDay() - 1];

    for (let hour = 0; hour < 24; hour++) {
      let timePeriod: string;
      let meanOccupancy: number;
      let std: number;

      if (hour >= 22 || hour < 7) {
        timePeriod = 'Night';
        meanOccupancy = 94; // Crisis level
        std = 3;
      } else if (hour >= 7 && hour < 14) {
        timePeriod = 'Morning';
        meanOccupancy = 70;
        std = 6;
      } else if (hour >= 14 && hour < 17) {
        timePeriod = 'Afternoon';
        meanOccupancy = 48; // Waste - overcapacity
        std = 6;
      } else {
        timePeriod = 'Evening';
        meanOccupancy = 65;
        std = 7;
      }

      const occupancy = Math.round(generateNormal(meanOccupancy, std));
      data.push({
        Date: currentDate.toISOString().split('T')[0],
        Hour: hour,
        Day_of_Week: dayOfWeek,
        Time_Period: timePeriod,
        Utilization_pct: Math.max(35, Math.min(100, occupancy)),
      });
    }
  }
  return data;
})();

// 6. Coffee Moisture: Drying Bed Comparison (Africa Case)
// Story: Bed C consistently fails export spec (10-12% moisture)
const coffeeMoistureData = (() => {
  const data: any[] = [];
  const beds = ['Bed A', 'Bed B', 'Bed C'];

  for (let i = 0; i < 30; i++) {
    const bedIndex = Math.floor(i / 10);
    const bed = beds[bedIndex];
    // Beds A and B are in spec (10-12%), Bed C runs high (12-14%)
    const mean = bedIndex === 2 ? 13.2 : 11.0;
    const std = bedIndex === 2 ? 0.5 : 0.3;
    const moisture = generateNormal(mean, std);

    data.push({
      Batch_ID: i + 1,
      Drying_Bed: bed,
      Moisture_pct: Number(moisture.toFixed(1)),
    });
  }
  return data;
})();

// 7. Packaging Defects: Product Line Analysis (Africa Case)
// Story: Product C has systematic underfill problem
const packagingDefectsData = (() => {
  const data: any[] = [];
  const products = ['Product A', 'Product B', 'Product C', 'Product D'];
  const defectTypes = ['Underfill', 'Seal_Failure', 'Label_Error', 'Overfill'];
  const startDate = new Date('2025-11-01');

  for (let day = 0; day < 20; day++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + day);
    if (currentDate.getDay() === 0 || currentDate.getDay() === 6) continue; // Skip weekends

    for (const product of products) {
      // Product C has 3x defect rate for Underfill
      const baseDefects = product === 'Product C' ? 180 : 55;
      const defectCount = Math.round(generateNormal(baseDefects, baseDefects * 0.15));

      data.push({
        Date: currentDate.toISOString().split('T')[0],
        Product: product,
        Defect_Count: Math.max(10, defectCount),
        Defect_Type: product === 'Product C' ? 'Underfill' : defectTypes[products.indexOf(product)],
      });
    }
  }
  return data;
})();

// 8. Journey: The 46% Story (Website Scroll Experience)
// Story: Three factors all look ~95% pass rate, but Factor C has 46% of defects
// Factor C has 3x variation and a pattern shift at observation 15
const journeyData = (() => {
  const data: any[] = [];
  let id = 1;

  // Generate 30 observations per factor
  for (let obs = 1; obs <= 30; obs++) {
    for (const factor of ['Factor A', 'Factor B', 'Factor C']) {
      let value: number;

      if (factor === 'Factor A') {
        // Stable, low variation, centered at 100
        value = generateNormal(100, 2);
      } else if (factor === 'Factor B') {
        // Stable, low variation, centered at 100
        value = generateNormal(100, 2.5);
      } else {
        // Factor C: 3x variation, with a shift at observation 15
        const mean = obs < 15 ? 98 : 103; // Shift upward after obs 15
        value = generateNormal(mean, 6); // 3x the variation
      }

      data.push({
        Observation: id++,
        Sequence: obs,
        Factor: factor,
        Measurement: Number(value.toFixed(1)),
      });
    }
  }
  return data;
})();

// 9. Avocado Coating: Regression Analysis (Week 12 Case)
// Story: More coating = longer shelf life, but operator variation matters
const avocadoCoatingData = (() => {
  const data: any[] = [];
  const coatingLevels = [0.5, 1.0, 1.5, 2.0, 2.5, 3.0];
  const processes = ['Spray', 'Dip'];
  const materials = ['Carnauba', 'Polyethylene'];

  let id = 1;
  for (const process of processes) {
    for (const material of materials) {
      for (const coating of coatingLevels) {
        for (let rep = 0; rep < 5; rep++) {
          // Shelf life increases with coating (regression relationship)
          // Base: 8 days + 3 days per ml/kg coating
          const baseShelfLife = 8 + coating * 3;
          // Dip process adds ~2 days, Polyethylene adds ~1 day
          const processBonus = process === 'Dip' ? 2 : 0;
          const materialBonus = material === 'Polyethylene' ? 1 : 0;
          const shelfLife = generateNormal(baseShelfLife + processBonus + materialBonus, 1.5);

          data.push({
            Sample_ID: id++,
            Coating_ml_kg: coating,
            Process: process,
            Material: material,
            Shelf_Life_Days: Number(shelfLife.toFixed(1)),
          });
        }
      }
    }
  }
  return data;
})();

// 10. Cookie Weight: Manufacturing SPC Classic
// Story: Baker's dozen cookies must meet weight spec. Oven 2 runs hot.
const cookieWeightData = (() => {
  const data: any[] = [];
  const ovens = ['Oven 1', 'Oven 2', 'Oven 3'];
  const shifts = ['Morning', 'Afternoon', 'Night'];
  const startDate = new Date('2025-11-01');

  let id = 1;
  for (let day = 0; day < 20; day++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + day);
    if (currentDate.getDay() === 0) continue; // Skip Sundays

    for (const shift of shifts) {
      for (const oven of ovens) {
        for (let batch = 0; batch < 3; batch++) {
          // Oven 2 runs slightly heavy (mean 32g vs 30g target)
          const mean = oven === 'Oven 2' ? 32 : 30;
          // Night shift has more variation (tired operators)
          const std = shift === 'Night' ? 2.5 : 1.5;
          const weight = generateNormal(mean, std);

          data.push({
            Sample_ID: id++,
            Date: currentDate.toISOString().split('T')[0],
            Shift: shift,
            Oven: oven,
            Cookie_Weight_g: Number(weight.toFixed(1)),
          });
        }
      }
    }
  }
  return data;
})();

// 11. Weld Defects: Manufacturing Quality
// Story: Robot Cell B has 4x defect rate due to fixture misalignment
const weldDefectsData = (() => {
  const data: any[] = [];
  const cells = ['Cell A', 'Cell B', 'Cell C'];
  const defectTypes = ['Porosity', 'Undercut', 'Spatter', 'Incomplete Fusion', 'Crack'];
  const startDate = new Date('2025-10-01');

  let id = 1;
  for (let day = 0; day < 30; day++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + day);
    if (currentDate.getDay() === 0 || currentDate.getDay() === 6) continue; // Skip weekends

    for (const cell of cells) {
      // Cell B has 4x the defect rate
      const baseRate = cell === 'Cell B' ? 12 : 3;
      const defectCount = Math.max(0, Math.round(generateNormal(baseRate, baseRate * 0.3)));

      // For Cell B, porosity dominates (fixture issue causes gas entrapment)
      const primaryDefect =
        cell === 'Cell B'
          ? 'Porosity'
          : defectTypes[Math.floor(Math.random() * defectTypes.length)];

      data.push({
        Record_ID: id++,
        Date: currentDate.toISOString().split('T')[0],
        Weld_Cell: cell,
        Defect_Count: defectCount,
        Primary_Defect: primaryDefect,
      });
    }
  }
  return data;
})();

// 12. Call Wait Time: Service Center Analysis
// Story: Queue D (Technical Support) has 3x wait time due to understaffing
const callWaitTimeData = (() => {
  const data: any[] = [];
  const queues = ['Sales', 'Billing', 'General', 'Technical'];
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  const hours = [9, 10, 11, 12, 13, 14, 15, 16, 17];

  let id = 1;
  for (let week = 0; week < 4; week++) {
    for (const day of days) {
      for (const hour of hours) {
        for (const queue of queues) {
          // Technical queue has 3x wait time (understaffed)
          const baseMean = queue === 'Technical' ? 12 : 4;
          // Lunch hour (12-13) has longer waits
          const lunchPenalty = hour === 12 || hour === 13 ? 2 : 0;
          const waitTime = Math.max(0.5, generateNormal(baseMean + lunchPenalty, baseMean * 0.4));

          data.push({
            Call_ID: id++,
            Week: week + 1,
            Day: day,
            Hour: hour,
            Queue: queue,
            Wait_Time_min: Number(waitTime.toFixed(1)),
          });
        }
      }
    }
  }
  return data;
})();

// 13. Delivery Performance: Logistics Analysis
// Story: Route C (Mountain region) has systematic delays
const deliveryPerformanceData = (() => {
  const data: any[] = [];
  const routes = [
    'Route A (Urban)',
    'Route B (Suburban)',
    'Route C (Mountain)',
    'Route D (Coastal)',
  ];
  const drivers = ['Driver_1', 'Driver_2', 'Driver_3', 'Driver_4'];
  const startDate = new Date('2025-09-01');

  let id = 1;
  for (let day = 0; day < 60; day++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + day);
    if (currentDate.getDay() === 0) continue; // Skip Sundays

    for (const route of routes) {
      // Mountain route averages 45 min vs 25 min target
      const baseMean = route.includes('Mountain') ? 45 : route.includes('Urban') ? 22 : 28;
      const std = route.includes('Mountain') ? 12 : 5;
      const deliveryTime = Math.max(10, generateNormal(baseMean, std));

      // Random driver assignment
      const driver = drivers[Math.floor(Math.random() * drivers.length)];

      data.push({
        Delivery_ID: id++,
        Date: currentDate.toISOString().split('T')[0],
        Route: route,
        Driver: driver,
        Delivery_Time_min: Number(deliveryTime.toFixed(1)),
      });
    }
  }
  return data;
})();

// 14. Sock Mystery: Classic Training Case
// Story: Socks keep disappearing. Is it the washer, dryer, or something else?
const sockMysteryData = (() => {
  const data: any[] = [];
  const washers = ['Washer A', 'Washer B'];
  const dryers = ['Dryer 1', 'Dryer 2', 'Dryer 3'];
  const loadSizes = ['Small', 'Medium', 'Large'];

  let id = 1;
  for (let week = 0; week < 12; week++) {
    for (const washer of washers) {
      for (const dryer of dryers) {
        for (const loadSize of loadSizes) {
          // The real cause: Dryer 2 has a gap in the drum seal
          // But students often suspect large loads or Washer B first
          const baseLoss = dryer === 'Dryer 2' ? 2.5 : 0.3;
          // Slight load size effect (red herring)
          const loadEffect = loadSize === 'Large' ? 0.3 : loadSize === 'Small' ? -0.1 : 0;
          const socksLost = Math.max(0, Math.round(generateNormal(baseLoss + loadEffect, 0.8)));

          data.push({
            Load_ID: id++,
            Week: week + 1,
            Washer: washer,
            Dryer: dryer,
            Load_Size: loadSize,
            Socks_Lost: socksLost,
          });
        }
      }
    }
  }
  return data;
})();

export const SAMPLES: SampleDataset[] = [
  {
    name: 'Agri-Food: Mango Export',
    description: 'Weight compliance analysis for fruit export to EU markets.',
    icon: 'apple',
    urlKey: 'mango-export',
    data: mangoData,
    config: {
      outcome: 'Fruit Weight (g)',
      factors: ['Origin Farm', 'Variety'],
      specs: { lsl: 300, usl: 350, target: 325 },
    },
  },
  {
    name: 'Textiles: Fabric Strength',
    description: 'Quality control for cotton tensile strength in garment production.',
    icon: 'shirt',
    urlKey: 'textiles-strength',
    data: textileData,
    config: {
      outcome: 'Tensile Strength (N)',
      factors: ['Loom ID', 'Operator'],
      specs: { lsl: 40, target: 45 },
    },
  },
  {
    name: 'Coffee: Defect Analysis',
    description: 'Defect counts per 300g sample (Specialty vs Off-Grade detection).',
    icon: 'coffee',
    urlKey: 'coffee-defects',
    data: coffeeData,
    config: {
      outcome: 'Total Defects (per 300g)',
      factors: ['Cooperative', 'Processing Method'],
      specs: { target: 0 },
      grades: [
        { max: 5, label: 'Specialty', color: '#22c55e' }, // Green
        { max: 8, label: 'Premium', color: '#eab308' }, // Yellow
        { max: 23, label: 'Exchange', color: '#f97316' }, // Orange
        { max: 999, label: 'Off-Grade', color: '#ef4444' }, // Red
      ],
    },
  },
  // Case Study Samples (for website embedding)
  {
    name: 'Case: The Bottleneck',
    description: 'Process step analysis - which step is really the bottleneck?',
    icon: 'factory',
    urlKey: 'bottleneck',
    data: bottleneckData,
    config: {
      outcome: 'Cycle_Time_sec',
      factors: ['Step', 'Shift'],
      specs: { target: 40 },
    },
  },
  {
    name: 'Case: Hospital Ward',
    description: 'The aggregation trap - what is your daily average hiding?',
    icon: 'activity',
    urlKey: 'hospital-ward',
    data: hospitalWardData,
    config: {
      outcome: 'Utilization_pct',
      factors: ['Time_Period', 'Day_of_Week'],
      specs: { target: 75, usl: 90 },
    },
  },
  {
    name: 'Case: Coffee Moisture',
    description: 'Drying bed comparison - which bed keeps failing export spec?',
    icon: 'coffee',
    urlKey: 'coffee',
    data: coffeeMoistureData,
    config: {
      outcome: 'Moisture_pct',
      factors: ['Drying_Bed'],
      specs: { lsl: 10, usl: 12, target: 11 },
    },
  },
  {
    name: 'Case: Packaging Defects',
    description: 'Product line analysis - which product has a defect problem?',
    icon: 'package',
    urlKey: 'packaging',
    data: packagingDefectsData,
    config: {
      outcome: 'Defect_Count',
      factors: ['Product', 'Defect_Type'],
      specs: { target: 50, usl: 100 },
    },
  },
  {
    name: 'Case: Avocado Coating',
    description: 'Regression analysis - optimizing shelf life through coating.',
    icon: 'trending-up',
    urlKey: 'avocado',
    data: avocadoCoatingData,
    config: {
      outcome: 'Shelf_Life_Days',
      factors: ['Coating_ml_kg', 'Process', 'Material'],
      specs: { lsl: 10, target: 15 },
    },
  },
  // Journey Page Sample (for the 7-section scroll experience)
  {
    name: 'Journey: The 46% Story',
    description: 'Three factors, one hidden problem. Where is the 46%?',
    icon: 'search',
    urlKey: 'journey',
    data: journeyData,
    config: {
      outcome: 'Measurement',
      factors: ['Factor'],
      specs: { lsl: 90, usl: 110, target: 100 },
    },
  },
  // New Case Studies (Design Doc Cases)
  {
    name: 'Case: Cookie Weight',
    description: 'Classic SPC case - which oven is causing weight variation?',
    icon: 'cookie',
    urlKey: 'cookie-weight',
    data: cookieWeightData,
    config: {
      outcome: 'Cookie_Weight_g',
      factors: ['Oven', 'Shift'],
      specs: { lsl: 27, usl: 33, target: 30 },
    },
  },
  {
    name: 'Case: Weld Defects',
    description: 'Robot cell analysis - find the fixture problem.',
    icon: 'zap',
    urlKey: 'weld-defects',
    data: weldDefectsData,
    config: {
      outcome: 'Defect_Count',
      factors: ['Weld_Cell', 'Primary_Defect'],
      specs: { target: 3, usl: 10 },
    },
  },
  {
    name: 'Case: Call Wait Time',
    description: 'Service center analysis - which queue needs help?',
    icon: 'phone',
    urlKey: 'call-wait',
    data: callWaitTimeData,
    config: {
      outcome: 'Wait_Time_min',
      factors: ['Queue', 'Hour', 'Day'],
      specs: { target: 3, usl: 8 },
    },
  },
  {
    name: 'Case: Delivery Performance',
    description: 'Logistics analysis - which route causes delays?',
    icon: 'truck',
    urlKey: 'delivery',
    data: deliveryPerformanceData,
    config: {
      outcome: 'Delivery_Time_min',
      factors: ['Route', 'Driver'],
      specs: { target: 25, usl: 40 },
    },
  },
  {
    name: 'Case: Sock Mystery',
    description: 'Classic training case - where do the socks go?',
    icon: 'help-circle',
    urlKey: 'sock-mystery',
    data: sockMysteryData,
    config: {
      outcome: 'Socks_Lost',
      factors: ['Dryer', 'Washer', 'Load_Size'],
      specs: { target: 0, usl: 2 },
    },
  },
];
