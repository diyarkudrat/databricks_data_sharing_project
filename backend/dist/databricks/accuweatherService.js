"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.queryAccuWeather = queryAccuWeather;
const queryService_1 = require("./queryService");
function buildAccuWeatherSql(options = {}) {
    const { city, startDate, endDate, limit } = options;
    const whereClauses = [];
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
async function queryAccuWeather(options = {}) {
    const sql = buildAccuWeatherSql(options);
    return (0, queryService_1.executeQuery)(sql);
}
