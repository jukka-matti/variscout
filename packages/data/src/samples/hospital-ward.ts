import type { SampleDataset } from '../types';
import { generateNormal, clamp } from '../utils';

// Hospital Ward: Aggregation Trap (ABB Practitioner Case)
// Story: 75% daily average hides 95% night crisis and 45% afternoon waste
const generateHospitalWardData = () => {
  const data: Record<string, unknown>[] = [];
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
        Utilization_pct: clamp(occupancy, 35, 100),
      });
    }
  }
  return data;
};

export const hospitalWard: SampleDataset = {
  name: 'Case: Hospital Ward',
  description: 'The aggregation trap - what is your daily average hiding?',
  icon: 'activity',
  urlKey: 'hospital-ward',
  data: generateHospitalWardData(),
  config: {
    outcome: 'Utilization_pct',
    factors: ['Time_Period', 'Day_of_Week'],
    specs: { target: 75, usl: 90 },
  },
};
