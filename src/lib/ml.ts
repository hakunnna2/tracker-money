
import { Transaction } from '../types';

/**
 * Simple Linear Regression Implementation
 * Predicts value at x given historical (x, y) data points
 */
function linearRegression(data: { x: number; y: number }[]) {
  const n = data.length;
  if (n < 2) return null;

  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumX2 = 0;

  for (const point of data) {
    sumX += point.x;
    sumY += point.y;
    sumXY += point.x * point.y;
    sumX2 += point.x * point.x;
  }

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  return (x: number) => slope * x + intercept;
}

export function predictEndOfMonth(transactions: Transaction[], currentBudget: number) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const dayOfMonth = now.getDate();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // 1. Calculate Historical Context (Previous months)
  const historicalMonthlyTotals: number[] = [];
  const monthDailyAverages: number[] = [];
  
  // Group by month-year
  const monthlyData: Record<string, number> = {};
  transactions.filter(t => t.type === 'expense').forEach(t => {
    const d = new Date(t.date);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    // Don't include current month in historical normalization
    if (!(d.getFullYear() === year && d.getMonth() === month)) {
      monthlyData[key] = (monthlyData[key] || 0) + Math.abs(t.amount);
    }
  });

  Object.entries(monthlyData).forEach(([key, total]) => {
    const [y, m] = key.split('-').map(Number);
    const daysInThatMonth = new Date(y, m + 1, 0).getDate();
    historicalMonthlyTotals.push(total);
    monthDailyAverages.push(total / daysInThatMonth);
  });

  const avgHistoricalDaily = monthDailyAverages.length > 0 
    ? monthDailyAverages.reduce((a, b) => a + b, 0) / monthDailyAverages.length
    : 0;

  // 2. Current Month Analysis
  const currentExpenses = transactions.filter(t => {
    const d = new Date(t.date);
    return t.type === 'expense' && d.getFullYear() === year && d.getMonth() === month;
  });

  const dailySpending: Record<number, number> = {};
  currentExpenses.forEach(t => {
    const d = new Date(t.date).getDate();
    dailySpending[d] = (dailySpending[d] || 0) + Math.abs(t.amount);
  });

  const dataPoints: { x: number; y: number }[] = [];
  let cumulative = 0;
  for (let i = 1; i <= dayOfMonth; i++) {
    cumulative += dailySpending[i] || 0;
    dataPoints.push({ x: i, y: cumulative });
  }

  // Linear Regression on current month trend
  const predictTrend = linearRegression(dataPoints);
  
  let forecast = 0;
  if (!predictTrend) {
    // Fallback: If no trend yet, assume historical daily for remaining days
    forecast = cumulative + (daysInMonth - dayOfMonth) * (avgHistoricalDaily || (currentBudget / 30));
  } else {
    // Prediction blending:
    // Current trend prediction weight decreases as we have fewer data points early in the month
    // Historical baseline weight is high early and decreases late
    const trendForecast = predictTrend(daysInMonth);
    
    // Confidence factor based on how far we are into the month (0 to 1)
    const confidence = Math.min(1, dayOfMonth / 15); 
    
    // Weighted blend between current trend and historical behavior
    const historicalBasedForecast = cumulative + (daysInMonth - dayOfMonth) * avgHistoricalDaily;
    
    if (avgHistoricalDaily > 0) {
      forecast = (trendForecast * confidence) + (historicalBasedForecast * (1 - confidence));
    } else {
      forecast = trendForecast;
    }
  }

  const totalIncome = transactions
    .filter(t => {
      const d = new Date(t.date);
      return t.type === 'income' && d.getFullYear() === year && d.getMonth() === month;
    })
    .reduce((acc, t) => acc + t.amount, 0);

  return {
    forecast: Math.max(0, forecast),
    savings: totalIncome - forecast
  };
}
