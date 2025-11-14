import { AccuWeatherClient } from '@/components/AccuWeatherClient';

export default function AccuWeatherPage() {
  return (
    <main className="flex min-h-screen flex-col items-center bg-zinc-50 px-6 py-16 font-sans dark:bg-black">
      <section className="w-full max-w-3xl rounded-lg bg-white p-6 shadow-sm dark:bg-zinc-900">
        <h1 className="mb-4 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          AccuWeather Sample Data
        </h1>
        <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
          Explore the built-in Databricks sample dataset <code>samples.accuweather.daily_weather_data</code> via the backend
          service.
        </p>
      </section>

      <AccuWeatherClient />
    </main>
  );
}
