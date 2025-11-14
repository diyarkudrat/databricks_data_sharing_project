import { executeQuery } from './queryService';
import type { QueryResult } from '../types';

export interface AccuWeatherQueryOptions {
  city?: string;
  startDate?: string; // ISO date string
  endDate?: string;   // ISO date string
  limit?: number;
}

function buildAccuWeatherSql(options: AccuWeatherQueryOptions = {}): string {
  const { city, startDate, endDate, limit } = options;

  const whereClauses: string[] = [];

  if (city) {
    whereClauses.push(`city = '${city.replace(/'/g, "''")}'`);
  }

  if (startDate) {
    whereClauses.push(`date >= DATE '${startDate}'`);
  }

  if (endDate) {
    whereClauses.push(`date <= DATE '${endDate}'`);
  }

  const whereSql = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';

  const safeLimit = !limit || limit <= 0 ? 100 : Math.min(limit, 500);

  return `
    SELECT
      *
    FROM samples.accuweather.daily_weather_data
    ${whereSql}
    LIMIT ${safeLimit}
  `;
}

export async function queryAccuWeather(
  options: AccuWeatherQueryOptions = {},
): Promise<QueryResult> {
  const sql = buildAccuWeatherSql(options);
  return executeQuery(sql);
}
