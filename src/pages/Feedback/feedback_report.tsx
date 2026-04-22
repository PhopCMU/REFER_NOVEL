import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  type ChartOptions,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { GetDataFeedback } from "../../api/GetApi";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

const TARGET_RATING = 2.5;

interface FeedbackItem {
  id: string;
  ipAddress: string;
  rating: number;
  comment: string;
  dateTime: string;
}

interface Metrics {
  avg: number;
  highest: number;
  lowest: number;
  total: number;
}

function buildMonthLabels(startYear: number, endYear: number): string[] {
  const labels: string[] = [];
  for (let y = startYear; y <= endYear; y++) {
    for (let m = 1; m <= 12; m++) {
      labels.push(`${y}-${String(m).padStart(2, "0")}`);
    }
  }
  return labels;
}

function computeMetrics(data: FeedbackItem[]): Metrics | null {
  if (data.length === 0) return null;
  const ratings = data.map((f) => f.rating);
  const avg = ratings.reduce((a, b) => a + b, 0) / ratings.length;
  return {
    avg: Math.round(avg * 100) / 100,
    highest: Math.max(...ratings),
    lowest: Math.min(...ratings),
    total: data.length,
  };
}

function toMonthKey(timestamp: string): string {
  const d = new Date(timestamp);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

// ─── Excel export ───────────────────────────────────────────────────────────

function exportFeedbackExcel(
  data: FeedbackItem[],
  monthLabels: string[],
  metrics: Metrics | null,
  fromYear: string,
  toYear: string,
): void {
  const wb = XLSX.utils.book_new();

  // ── Sheet 1: Summary ──────────────────────────────────────────────────────
  const generatedAt = new Date().toLocaleString("th-TH");

  const monthlyRows = monthLabels.map((label) => {
    const bucket = data.filter((f) => toMonthKey(f.dateTime) === label);
    const avg =
      bucket.length > 0
        ? Math.round(
            (bucket.reduce((s, f) => s + f.rating, 0) / bucket.length) * 100,
          ) / 100
        : null;
    return {
      Month: label,
      Responses: bucket.length,
      "Average Rating": avg ?? "-",
    };
  });

  const summaryRows: (string | number | null)[][] = [
    ["Evaluation Report"],
    [],
    ["Year Range", `${fromYear} – ${toYear}`],
    ["Generated At", generatedAt],
    [],
    ["Metric", "Value"],
    ["Total Responses", metrics?.total ?? 0],
    ["Average Rating", metrics?.avg ?? "-"],
    ["Highest Rating", metrics?.highest ?? "-"],
    ["Lowest Rating", metrics?.lowest ?? "-"],
    [],
    ["Month", "Responses", "Average Rating"],
    ...monthlyRows.map((r) => [r.Month, r.Responses, r["Average Rating"]]),
  ];

  const ws1 = XLSX.utils.aoa_to_sheet(summaryRows);
  ws1["!cols"] = [{ wch: 20 }, { wch: 16 }, { wch: 16 }];
  XLSX.utils.book_append_sheet(wb, ws1, "Summary");

  // ── Sheet 2: Comments (newest first) ─────────────────────────────────────
  const commentRows = [...data]
    .sort(
      (a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime(),
    )
    .map((f) => ({
      Timestamp: new Date(f.dateTime).toLocaleString("th-TH"),
      "IP Address": f.ipAddress,
      Rating: f.rating,
      Comment: f.comment ?? "",
    }));

  const ws2 = XLSX.utils.json_to_sheet(commentRows);
  ws2["!cols"] = [{ wch: 22 }, { wch: 18 }, { wch: 10 }, { wch: 60 }];
  XLSX.utils.book_append_sheet(wb, ws2, "Comments");

  // ── Download ──────────────────────────────────────────────────────────────
  const fileName = `evaluation-report-${fromYear}-${toYear}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function RatingBadge({ rating }: { rating: number }) {
  const cls =
    rating >= 4.5
      ? "bg-emerald-100 text-emerald-700"
      : rating >= 3.5
        ? "bg-blue-100 text-blue-700"
        : rating >= 2.5
          ? "bg-yellow-100 text-yellow-700"
          : "bg-red-100 text-red-700";
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${cls}`}
    >
      ★ {rating}
    </span>
  );
}

interface MetricCardProps {
  label: string;
  value: string;
  valueClass: string;
  borderClass: string;
  bgClass: string;
}

function MetricCard({
  label,
  value,
  valueClass,
  borderClass,
  bgClass,
}: MetricCardProps) {
  return (
    <div
      className={`rounded-xl border p-5 shadow-sm ${bgClass} ${borderClass}`}
    >
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
        {label}
      </p>
      <p className={`mt-2 text-3xl font-bold ${valueClass}`}>{value}</p>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function FeedbackReport() {
  const currentYear = new Date().getFullYear();

  const years = useMemo(
    () => Array.from({ length: 8 }, (_, i) => String(currentYear - i)),
    [currentYear],
  );

  const [fromYear, setFromYear] = useState(String(currentYear - 1));
  const [toYear, setToYear] = useState(String(currentYear));
  const [feedbackData, setFeedbackData] = useState<FeedbackItem[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasFetched = useRef(false);

  const fetchData = useCallback(async (start: string, end: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const resp = await GetDataFeedback(start, end);
      console.log("Fetched feedback data:", resp);
      if (resp.results && Array.isArray(resp.results)) {
        console.log("Fetched feedback data:", resp);

        setFeedbackData(resp.results as FeedbackItem[]);
      } else {
        setFeedbackData([]);
        setError("ไม่สามารถโหลดข้อมูลได้");
      }
    } catch {
      setFeedbackData([]);
      setError("เกิดข้อผิดพลาดในการโหลดข้อมูล");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    fetchData(`${fromYear}-01-01`, `${toYear}-12-31`);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const onRefresh = () => {
    let s = parseInt(fromYear, 10);
    let e = parseInt(toYear, 10);
    if (isNaN(s) || isNaN(e)) return;
    if (s > e) {
      [s, e] = [e, s];
      setFromYear(String(s));
      setToYear(String(e));
    }
    fetchData(`${s}-01-01`, `${e}-12-31`);
  };

  // ── Derived state ──────────────────────────────────────────────────────────

  const monthLabels = useMemo(
    () => buildMonthLabels(parseInt(fromYear, 10), parseInt(toYear, 10)),
    [fromYear, toYear],
  );

  const monthlyAverages = useMemo<(number | null)[]>(() => {
    if (!feedbackData) return monthLabels.map(() => null);
    return monthLabels.map((label) => {
      const bucket = feedbackData.filter(
        (f) => toMonthKey(f.dateTime) === label,
      );
      if (bucket.length === 0) return null;
      const avg = bucket.reduce((sum, f) => sum + f.rating, 0) / bucket.length;
      return Math.round(avg * 100) / 100;
    });
  }, [feedbackData, monthLabels]);

  const metrics = useMemo(
    () => (feedbackData ? computeMetrics(feedbackData) : null),
    [feedbackData],
  );

  const sortedData = useMemo(
    () =>
      feedbackData
        ? [...feedbackData].sort(
            (a, b) =>
              new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime(),
          )
        : [],
    [feedbackData],
  );

  console.log("Metrics:", metrics);
  console.log("Monthly averages:", monthlyAverages);
  console.log("Sorted feedback data:", sortedData);

  // ── Chart config ───────────────────────────────────────────────────────────

  const chartData = useMemo(
    () => ({
      labels: monthLabels,
      datasets: [
        {
          label: "คะแนนเฉลี่ย",
          data: monthlyAverages,
          borderColor: "#3b82f6",
          backgroundColor: "rgba(59,130,246,0.08)",
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 6,
          fill: true,
          spanGaps: true,
        },
        {
          label: `เป้าหมาย (${TARGET_RATING})`,
          data: monthLabels.map(() => TARGET_RATING),
          borderColor: "#f59e0b",
          borderDash: [6, 4],
          backgroundColor: "transparent",
          tension: 0,
          pointRadius: 0,
          pointHoverRadius: 0,
          spanGaps: true,
        },
      ],
    }),
    [monthLabels, monthlyAverages],
  );

  const chartOptions = useMemo<ChartOptions<"line">>(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: "top" },
        tooltip: { mode: "index", intersect: false },
      },
      scales: {
        y: {
          min: 0,
          max: 5,
          ticks: { stepSize: 1 },
          title: { display: true, text: "คะแนน (0–5)" },
          grid: { color: "rgba(0,0,0,0.05)" },
        },
        x: {
          ticks: { maxRotation: 45, minRotation: 45, font: { size: 11 } },
          grid: { display: false },
        },
      },
    }),
    [],
  );

  // ── Metric card data ───────────────────────────────────────────────────────

  const metricCards: MetricCardProps[] = metrics
    ? [
        {
          label: "Average Rating",
          value: metrics.avg.toFixed(2),
          valueClass: "text-blue-600",
          bgClass: "bg-blue-50",
          borderClass: "border-blue-200",
        },
        {
          label: "Highest Rating",
          value: String(metrics.highest),
          valueClass: "text-emerald-600",
          bgClass: "bg-emerald-50",
          borderClass: "border-emerald-200",
        },
        {
          label: "Lowest Rating",
          value: String(metrics.lowest),
          valueClass: "text-rose-600",
          bgClass: "bg-rose-50",
          borderClass: "border-rose-200",
        },
        {
          label: "Total Responses",
          value: String(metrics.total),
          valueClass: "text-violet-600",
          bgClass: "bg-violet-50",
          borderClass: "border-violet-200",
        },
      ]
    : [
        {
          label: "Average Rating",
          value: "—",
          valueClass: "text-gray-300",
          bgClass: "bg-white",
          borderClass: "border-gray-200",
        },
        {
          label: "Highest Rating",
          value: "—",
          valueClass: "text-gray-300",
          bgClass: "bg-white",
          borderClass: "border-gray-200",
        },
        {
          label: "Lowest Rating",
          value: "—",
          valueClass: "text-gray-300",
          bgClass: "bg-white",
          borderClass: "border-gray-200",
        },
        {
          label: "Total Responses",
          value: "—",
          valueClass: "text-gray-300",
          bgClass: "bg-white",
          borderClass: "border-gray-200",
        },
      ];

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Evaluation Report</h1>
        <p className="text-sm text-gray-500 mt-1">
          รายงานผลการประเมินความพึงพอใจ
        </p>
      </div>

      {/* Year range filter */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex flex-wrap items-end gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            ปีเริ่มต้น
          </label>
          <select
            value={fromYear}
            onChange={(e) => setFromYear(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            ปีสิ้นสุด
          </label>
          <select
            value={toYear}
            onChange={(e) => setToYear(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-lg transition-colors"
        >
          {isLoading ? "กำลังโหลด..." : "ค้นหา / Refresh"}
        </button>

        <button
          onClick={() =>
            feedbackData &&
            feedbackData.length > 0 &&
            exportFeedbackExcel(
              feedbackData,
              monthLabels,
              metrics,
              fromYear,
              toYear,
            )
          }
          disabled={!feedbackData || feedbackData.length === 0 || isLoading}
          className="ml-auto px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 10v6m0 0-3-3m3 3 3-3M3 17v2a2 2 0 002 2h14a2 2 0 002-2v-2M3 7V5a2 2 0 012-2h14a2 2 0 012 2v2"
            />
          </svg>
          Export Excel
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">
          {error}
        </div>
      )}

      {/* Loading spinner */}
      {isLoading ? (
        <div className="flex items-center justify-center py-24 text-gray-500 gap-3">
          <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-blue-600" />
          <span className="text-sm">กำลังโหลดข้อมูล...</span>
        </div>
      ) : (
        <>
          {/* Metric cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {metricCards.map((card) => (
              <MetricCard key={card.label} {...card} />
            ))}
          </div>

          {/* Line chart */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <h2 className="text-base font-semibold text-gray-700 mb-4">
              Rating Trend
            </h2>
            <div className="h-72">
              <Line data={chartData} options={chartOptions} />
            </div>
          </div>

          {/* Details table */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-700">
                รายละเอียด
              </h2>
            </div>

            {sortedData.length === 0 ? (
              <div className="py-16 text-center text-sm text-gray-400">
                ไม่พบข้อมูลในช่วงที่เลือก
              </div>
            ) : (
              <div className="overflow-x-auto custom-scroll">
                <table className="min-w-full divide-y divide-gray-100">
                  <thead className="bg-gray-50">
                    <tr>
                      {["Timestamp", "IP Address", "Rating", "Comment"].map(
                        (h) => (
                          <th
                            key={h}
                            className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide"
                          >
                            {h}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {sortedData.map((f) => (
                      <tr
                        key={f.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-5 py-3 text-sm text-gray-700 whitespace-nowrap">
                          {new Date(f.dateTime).toLocaleString("th-TH")}
                        </td>
                        <td className="px-5 py-3 text-sm text-gray-600 font-mono whitespace-nowrap">
                          {f.ipAddress}
                        </td>
                        <td className="px-5 py-3 text-sm">
                          <RatingBadge rating={f.rating} />
                        </td>
                        <td className="px-5 py-3 text-sm text-gray-600 max-w-xs truncate">
                          {f.comment ? (
                            f.comment
                          ) : (
                            <span className="text-gray-300 italic">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
