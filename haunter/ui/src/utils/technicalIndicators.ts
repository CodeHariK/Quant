/**
 * Technical Indicators utility functions for calculating chart overlays and oscillators.
 * Expects time-series data sorted from oldest to newest.
 */

// Simple Moving Average (SMA)
export function calculateSMA(data: { value: number }[], period: number) {
  const result = [];
  let sum = 0;

  for (let i = 0; i < data.length; i++) {
    sum += data[i].value;
    if (i >= period) {
      sum -= data[i - period].value;
    }
    
    if (i >= period - 1) {
      result.push({ value: sum / period });
    } else {
      result.push({ value: NaN }); // Not enough data yet
    }
  }
  return result;
}

// Exponential Moving Average (EMA)
export function calculateEMA(data: { value: number }[], period: number) {
  const result = [];
  const k = 2 / (period + 1);
  let ema = data.length > 0 ? data[0].value : 0; // First EMA is just the first value (or SMA of first 'period' values, but this is a common approximation)

  // Better approach: SMA for the first 'period' values, then EMA
  let sum = 0;
  for (let i = 0; i < data.length; i++) {
    if (i < period) {
      sum += data[i].value;
      if (i === period - 1) {
        ema = sum / period;
        result.push({ value: ema });
      } else {
        result.push({ value: NaN });
      }
    } else {
      ema = data[i].value * k + ema * (1 - k);
      result.push({ value: ema });
    }
  }
  return result;
}

// Standard Deviation over a rolling window
function calculateStdDev(data: { value: number }[], period: number, sma: { value: number }[]) {
  const result = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push({ value: NaN });
      continue;
    }
    
    const mean = sma[i].value;
    let sumSq = 0;
    for (let j = 0; j < period; j++) {
      const val = data[i - j].value;
      sumSq += (val - mean) * (val - mean);
    }
    result.push({ value: Math.sqrt(sumSq / period) });
  }
  return result;
}

// Bollinger Bands
export function calculateBollingerBands(data: { value: number }[], period: number = 20, stdDev: number = 2) {
  const middle = calculateSMA(data, period);
  const std = calculateStdDev(data, period, middle);
  
  const upper = [];
  const lower = [];
  
  for (let i = 0; i < data.length; i++) {
    if (isNaN(middle[i].value) || isNaN(std[i].value)) {
      upper.push({ value: NaN });
      lower.push({ value: NaN });
    } else {
      upper.push({ value: middle[i].value + (stdDev * std[i].value) });
      lower.push({ value: middle[i].value - (stdDev * std[i].value) });
    }
  }
  
  return { upper, middle, lower };
}

// MACD (Moving Average Convergence Divergence)
export function calculateMACD(data: { value: number }[], fastPeriod: number = 12, slowPeriod: number = 26, signalPeriod: number = 9) {
  const fastEMA = calculateEMA(data, fastPeriod);
  const slowEMA = calculateEMA(data, slowPeriod);
  
  const macdLine = [];
  for (let i = 0; i < data.length; i++) {
    if (isNaN(fastEMA[i].value) || isNaN(slowEMA[i].value)) {
      macdLine.push({ value: NaN });
    } else {
      macdLine.push({ value: fastEMA[i].value - slowEMA[i].value });
    }
  }
  
  // Calculate Signal line (EMA of MACD line)
  // We need to filter out NaNs for the EMA calculation
  const validMacdStartIndex = macdLine.findIndex(m => !isNaN(m.value));
  
  const signalLine = new Array(data.length).fill({ value: NaN });
  const histogram = new Array(data.length).fill({ value: NaN });
  
  if (validMacdStartIndex !== -1) {
    const validMacdData = macdLine.slice(validMacdStartIndex);
    const validSignalLine = calculateEMA(validMacdData, signalPeriod);
    
    for (let i = 0; i < validSignalLine.length; i++) {
      const globalIdx = validMacdStartIndex + i;
      signalLine[globalIdx] = validSignalLine[i];
      if (!isNaN(macdLine[globalIdx].value) && !isNaN(signalLine[globalIdx].value)) {
        histogram[globalIdx] = { value: macdLine[globalIdx].value - signalLine[globalIdx].value };
      }
    }
  }
  
  return { macdLine, signalLine, histogram };
}
