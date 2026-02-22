"use client";
import { useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/predict";

export default function Home() {
  const [startMonth, setStartMonth] = useState<number>(1);
  const [forecastLength, setForecastLength] = useState<number>(12);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [predictions, setPredictions] = useState<any[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setPredictions([]);
    try {
      // Generate months array
      const monthsList = Array.from({ length: forecastLength }, (_, i) => startMonth + i);
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ months: monthsList }),
      });
      if (!res.ok) throw new Error("API error");
      const data = await res.json();
      setPredictions(data.forecast || []);
    } catch (err: any) {
      setError(err.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-black py-10 px-4">
      <div className="w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-xl shadow-lg p-8">
        <h1 className="text-3xl font-bold mb-4 text-center text-zinc-900 dark:text-zinc-100">Forecast Dashboard</h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mb-6">
          <div className="flex gap-4">
            <label className="font-medium text-zinc-700 dark:text-zinc-200">
              Start Month (number):
              <input
                type="number"
                min={1}
                max={12}
                className="mt-2 w-full rounded border border-zinc-300 dark:border-zinc-700 px-3 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={startMonth}
                onChange={(e) => setStartMonth(Number(e.target.value))}
                required
              />
            </label>
            <label className="font-medium text-zinc-700 dark:text-zinc-200">
              Forecast Length:
              <input
                type="number"
                min={1}
                max={36}
                className="mt-2 w-full rounded border border-zinc-300 dark:border-zinc-700 px-3 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={forecastLength}
                onChange={(e) => setForecastLength(Number(e.target.value))}
                required
              />
            </label>
          </div>
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded transition disabled:opacity-50"
            disabled={loading}
          >
            {loading ? "Predicting..." : "Get Forecast"}
          </button>
        </form>
        {error && <div className="text-red-600 mb-4">{error}</div>}
        {predictions.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full border border-zinc-200 dark:border-zinc-700 rounded-lg">
              <thead>
                <tr className="bg-zinc-100 dark:bg-zinc-800">
                  <th className="px-4 py-2 text-left">Month</th>
                  <th className="px-4 py-2 text-left">Consumption</th>
                </tr>
              </thead>
              <tbody>
                {predictions.map((pred, i) => (
                  <tr key={i} className="border-t border-zinc-200 dark:border-zinc-700">
                    <td className="px-4 py-2">{pred.month}</td>
                    <td className="px-4 py-2">{pred.consumption.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-8">
              <ForecastChart predictions={predictions} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ForecastChart({ predictions }: { predictions: any[] }) {
  if (!predictions.length) return null;
  // Simple SVG line chart (no external deps)
  const width = 500, height = 200, padding = 40;
  const values = predictions.map((p) => p.consumption);
  const months = predictions.map((p) => p.month);
  const min = Math.min(...values), max = Math.max(...values);
  const y = (v: number) => height - padding - ((v - min) / (max - min || 1)) * (height - 2 * padding);
  const x = (i: number) => padding + (i * (width - 2 * padding)) / (values.length - 1 || 1);
  const points = values.map((v, i) => `${x(i)},${y(v)}`).join(" ");
  return (
    <svg width={width} height={height} className="w-full h-52">
      <polyline
        fill="none"
        stroke="#2563eb"
        strokeWidth="3"
        points={points}
      />
      {values.map((v, i) => (
        <circle key={i} cx={x(i)} cy={y(v)} r={4} fill="#2563eb" />
      ))}
      {/* X axis labels */}
      {months.map((m, i) => (
        <text
          key={m}
          x={x(i)}
          y={height - padding + 18}
          textAnchor="middle"
          fontSize="12"
          fill="#444"
        >
          {m}
        </text>
      ))}
      {/* Y axis labels */}
      <text x={5} y={y(min)} fontSize="12" fill="#444">{min.toFixed(2)}</text>
      <text x={5} y={y(max)} fontSize="12" fill="#444">{max.toFixed(2)}</text>
    </svg>
  );
}
