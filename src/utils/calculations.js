/**
 * Utility functions for calculations across FitTrack
 */

/**
 * Calculate distance between two GPS coordinates using the Haversine formula
 * @param {number} lat1 
 * @param {number} lon1 
 * @param {number} lat2 
 * @param {number} lon2 
 * @returns {number} distance in kilometers
 */
export function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  if (lat1 === lat2 && lon1 === lon2) return 0;
  
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Format pace in minutes and seconds per kilometer
 * @param {number} durationSeconds 
 * @param {number} distanceKm 
 * @returns {string} e.g. "5:30 /km"
 */
export function calculatePace(durationSeconds, distanceKm) {
  if (!distanceKm || distanceKm <= 0.05 || !durationSeconds) {
    return "--:-- /km";
  }
  const paceSecondsPerKm = durationSeconds / distanceKm;
  if (!isFinite(paceSecondsPerKm) || paceSecondsPerKm > 3600) {
    return "--:-- /km";
  }
  const minutes = Math.floor(paceSecondsPerKm / 60);
  const seconds = Math.floor(paceSecondsPerKm % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')} /km`;
}

/**
 * Estimate calories burned during a run
 * @param {number} weightKg User weight
 * @param {number} distanceKm Distance in km
 * @param {number} durationSeconds Duration in seconds
 * @returns {number} estimated calories burned
 */
export function estimateRunningCalories(weightKg = 70, distanceKm = 0, durationSeconds = 0) {
  if (distanceKm <= 0) return 0;
  // Standard net caloric expenditure formula for running: ~ 1.036 * kg * km
  const cals = 1.036 * (weightKg || 70) * distanceKm;
  return Math.round(cals);
}

/**
 * Estimate calories for common workout activities
 * @param {string} category 
 * @param {number} durationMinutes 
 * @param {number} weightKg 
 * @returns {number}
 */
export function estimateWorkoutCalories(category, durationMinutes = 30, weightKg = 70) {
  const metMap = {
    'Strength Training': 5.0,
    'Cardio': 8.0,
    'Running': 9.8,
    'Cycling': 7.5,
    'Walking': 3.8,
    'Bodyweight Training': 6.0,
    'HIIT': 9.0,
    'Other': 4.5
  };
  const met = metMap[category] || 5.0;
  // Formula: Calories = (MET * 3.5 * weightKg / 200) * minutes
  const calories = (met * 3.5 * (weightKg || 70) / 200) * (durationMinutes || 0);
  return Math.round(calories);
}

/**
 * Format seconds into HH:MM:SS or MM:SS
 * @param {number} seconds 
 * @returns {string}
 */
export function formatDuration(seconds = 0) {
  const sec = Math.floor(seconds || 0);
  const hrs = Math.floor(sec / 3600);
  const mins = Math.floor((sec % 3600) / 60);
  const remainingSecs = sec % 60;

  if (hrs > 0) {
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
  }
  return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
}

/**
 * Calculate BMI
 * @param {number} weightKg 
 * @param {number} heightCm 
 * @returns {{ bmi: number, category: string, color: string, advice: string }}
 */
export function calculateBMI(weightKg, heightCm) {
  if (!weightKg || !heightCm) {
    return { bmi: 0, category: 'Unknown', color: '#94a3b8', advice: 'Enter height and weight' };
  }
  const heightM = heightCm / 100;
  const bmiVal = weightKg / (heightM * heightM);
  const bmi = parseFloat(bmiVal.toFixed(1));

  if (bmi < 18.5) {
    return {
      bmi,
      category: 'Underweight',
      color: '#38bdf8', // light blue
      advice: 'Consider nutrient-dense meals and strength building to reach optimal weight.'
    };
  } else if (bmi < 25) {
    return {
      bmi,
      category: 'Normal Weight',
      color: '#10b981', // emerald green
      advice: 'Great job! Maintain your balanced nutrition and consistent exercise habits.'
    };
  } else if (bmi < 30) {
    return {
      bmi,
      category: 'Overweight',
      color: '#f59e0b', // amber
      advice: 'Target progressive cardio and balanced portion control to reduce body fat.'
    };
  } else {
    return {
      bmi,
      category: 'Obesity',
      color: '#ef4444', // red
      advice: 'Consult with healthcare professionals and adopt structured physical activities.'
    };
  }
}

/**
 * Get date string formatted as YYYY-MM-DD in local time
 * @param {Date|string} d 
 * @returns {string}
 */
export function getLocalDateString(d = new Date()) {
  const date = typeof d === 'string' ? new Date(d) : d;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format date for friendly human reading
 * @param {string|Date} dateStr 
 * @returns {string}
 */
export function formatFriendlyDate(dateStr) {
  if (!dateStr) return '';
  const todayStr = getLocalDateString(new Date());
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = getLocalDateString(yesterday);

  if (dateStr === todayStr) return 'Today';
  if (dateStr === yesterdayStr) return 'Yesterday';

  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });
}
