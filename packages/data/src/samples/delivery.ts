import type { SampleDataset } from '../types';
import { generateNormal, round } from '../utils';

// Delivery Performance: Logistics Analysis
// Story: Route C (Mountain region) has systematic delays
const generateDeliveryPerformanceData = () => {
  const data: Record<string, unknown>[] = [];
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
        Delivery_Time_min: round(deliveryTime),
      });
    }
  }
  return data;
};

export const delivery: SampleDataset = {
  name: 'Case: Delivery Performance',
  description: 'Logistics analysis - which route causes delays?',
  icon: 'truck',
  urlKey: 'delivery',
  data: generateDeliveryPerformanceData(),
  config: {
    outcome: 'Delivery_Time_min',
    factors: ['Route', 'Driver'],
    specs: { target: 25, usl: 40 },
  },
};
