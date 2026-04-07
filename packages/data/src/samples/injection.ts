import type { SampleDataset } from '../types';
import { mulberry32, round } from '../utils';

// HP-inspired injection molding process dataset
// Mixed continuous + categorical factors with quadratic temperature sweet spot
//
// Data generation model:
//   Fill_Weight = 12.5
//     + machine_temp_slope * (Temp - 195)  temperature slope varies by machine (INTERACTION)
//     - 0.001 * (Temp - 195)²              quadratic: sweet spot at 195°C
//     + 0.005 * (Force - 85)               linear clamping force effect
//     + 0.002 * (CoolTime - 20)            weak cooling time effect
//     + supplier_effect                     A: +0.3, B: 0, C: -0.4
//     + machine_effect                      M1: -0.1, M2: +0.2, M3: 0, M4: -0.1
//     + N(0, 0.15)                          process noise
//
// Designed interaction: Temperature × Machine (ordinal — M2 more sensitive, M4 less)

const SUPPLIER_EFFECTS: Record<string, number> = { A: 0.3, B: 0.0, C: -0.4 };
const MACHINE_EFFECTS: Record<string, number> = { M1: -0.1, M2: 0.2, M3: 0.0, M4: -0.1 };
// Machine-specific temperature sensitivity (interaction):
//   M1: standard slope (0.015/°C)
//   M2: higher slope (0.025/°C) — more sensitive to temperature
//   M3: standard slope (0.015/°C)
//   M4: lower slope (0.005/°C) — less sensitive to temperature
const MACHINE_TEMP_SLOPES: Record<string, number> = { M1: 0.015, M2: 0.025, M3: 0.015, M4: 0.005 };
const SUPPLIERS = ['A', 'B', 'C'] as const;
const MACHINES = ['M1', 'M2', 'M3', 'M4'] as const;

function generateInjectionData(): Record<string, unknown>[] {
  // Use a local PRNG with a fixed seed so this file is deterministic
  // regardless of import order or module-level PRNG state.
  const rng = mulberry32(1973);

  const normal = (): number => {
    // Box-Muller using local PRNG
    const u = Math.max(1e-10, rng());
    const v = rng();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  };

  const rows: Record<string, unknown>[] = [];

  for (let i = 0; i < 200; i++) {
    // Sample continuous X values uniformly over their operating ranges
    const temp = round(180 + rng() * 40, 1); // 180–220 °C
    const force = round(50 + rng() * 70, 1); // 50–120 kN
    const coolTime = round(10 + rng() * 20, 1); // 10–30 s

    // Sample categorical levels — use modular cycling biased by rng to
    // ensure all levels appear roughly equally across the 200 rows.
    const supplier = SUPPLIERS[Math.floor(rng() * SUPPLIERS.length)];
    const machine = MACHINES[Math.floor(rng() * MACHINES.length)];

    const deltaTemp = temp - 195;
    const deltaForce = force - 85;
    const deltaCool = coolTime - 20;

    const tempSlope = MACHINE_TEMP_SLOPES[machine];
    const fillWeight =
      12.5 +
      tempSlope * deltaTemp -
      0.001 * deltaTemp * deltaTemp +
      0.005 * deltaForce +
      0.002 * deltaCool +
      SUPPLIER_EFFECTS[supplier] +
      MACHINE_EFFECTS[machine] +
      normal() * 0.15;

    rows.push({
      Obs: i + 1,
      Fill_Weight: round(fillWeight, 3),
      Barrel_Temperature: temp,
      Clamping_Force: force,
      Cooling_Time: coolTime,
      Supplier: supplier,
      Machine: machine,
    });
  }

  return rows;
}

export const injectionMolding: SampleDataset = {
  name: 'Injection Molding',
  description:
    'HP-inspired injection molding process — mixed continuous and categorical factors with quadratic temperature sweet spot. Target fill weight 12.5 g.',
  icon: 'factory',
  urlKey: 'injection-molding',
  category: 'standard',
  featured: false,
  data: generateInjectionData(),
  config: {
    outcome: 'Fill_Weight',
    factors: ['Barrel_Temperature', 'Clamping_Force', 'Cooling_Time', 'Supplier', 'Machine'],
    specs: { lsl: 11.8, usl: 13.2, target: 12.5 },
  },
};
