import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  LabelList,
} from 'recharts';
import {
  BarChart3,
  TrendingUp,
  Truck,
  Building2,
  Award,
  Layers,
  Calendar,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Zap,
} from 'lucide-react';

interface AdminAnalyticsDashboardProps {
  lang?: 'en' | 'ta';
}

// 0. Household Risk Classification Data (from User Uploaded Visualizations)
const HOUSEHOLD_RISK_DATA = [
  {
    id: 'regular',
    category: 'Regularly Collected',
    taCategory: 'முறையாக சேகரிக்கப்பட்டது',
    range: '80% - 100%',
    subLabel: 'Regular Collection',
    count: 850,
    percentage: 80.15,
    color: '#16A34A', // Green
  },
  {
    id: 'occasional',
    category: 'Occasionally Missed',
    taCategory: 'அவ்வப்போது தவறவிட்டது',
    range: '50% - 79%',
    subLabel: 'Occasionally Missed',
    count: 120,
    percentage: 11.27,
    color: '#F59E0B', // Yellow / Orange
  },
  {
    id: 'frequently',
    category: 'Frequently Missed (High Risk)',
    taCategory: 'அடிக்கடி தவறவிட்டது (அதிக ஆபத்து)',
    range: '20% - 49%',
    subLabel: 'Frequently Missed (High Risk)',
    count: 65,
    percentage: 6.10,
    color: '#EF4444', // Red
  },
  {
    id: 'critical',
    category: 'Critical High Risk',
    taCategory: 'மிகவும் தீவிர ஆபத்து',
    range: '0% - 19%',
    subLabel: 'Critical High Risk',
    count: 30,
    percentage: 2.82,
    color: '#7F1D1D', // Dark Red / Maroon
  },
];

// 1. Area-wise Collection Efficiency Data
const AREA_EFFICIENCY_DATA = [
  { area: 'Mageshwari Nagar', taArea: 'மகேஸ்வரி நகர்', efficiency: 96, status: 'High' },
  { area: 'Sree Nagar', taArea: 'ஸ்ரீ நகர்', efficiency: 88, status: 'High' },
  { area: 'Muthusamy Serkai', taArea: 'முத்துசாமி சேர்வை', efficiency: 92, status: 'High' },
  { area: 'KGK Main Road', taArea: 'கே.ஜி.கே மெயின் ரோடு', efficiency: 65, status: 'Low' },
  { area: 'Nagamma Nayagar', taArea: 'நாகம்மா நாயக்கர்', efficiency: 78, status: 'Medium' },
  { area: 'Alagaachi Thottam', taArea: 'அழகாய்ச்சி தோட்டம்', efficiency: 90, status: 'High' },
  { area: 'Maruthi Envue', taArea: 'மாருதி என்வியூ', efficiency: 84, status: 'Medium' },
  { area: 'KK Nagar', taArea: 'கே.கே நகர்', efficiency: 72, status: 'Medium' },
];

// 2. Weekly Collection Comparison Data
const WEEKLY_COMPARISON_DATA = [
  { week: 'Week 1', taWeek: 'வாரம் 1', collectionRate: 82, wasteKg: 14200, coveredHouses: 4200 },
  { week: 'Week 2', taWeek: 'வாரம் 2', collectionRate: 88, wasteKg: 15800, coveredHouses: 4550 },
  { week: 'Week 3', taWeek: 'வாரம் 3', collectionRate: 91, wasteKg: 16900, coveredHouses: 4780 },
  { week: 'Week 4', taWeek: 'வாரம் 4', collectionRate: 96, wasteKg: 18200, coveredHouses: 5120 },
];

// 3. Route-wise Collection Coverage Data
const ROUTE_COLLECTION_DATA = [
  { route: 'Route A (Mageshwari)', taRoute: 'பாதை A (மகேஸ்வரி)', coverage: 94, alert: false },
  { route: 'Route B (KGK Road)', taRoute: 'பாதை B (கேஜிேக)', coverage: 65, alert: true },
  { route: 'Route C (Muthusamy)', taRoute: 'பாதை C (முத்துசாமி)', coverage: 92, alert: false },
  { route: 'Route D (Nagamma)', taRoute: 'பாதை D (நாகம்மா)', coverage: 78, alert: false },
  { route: 'Route E (Alagaachi)', taRoute: 'பாதை E (அழகாய்ச்சி)', coverage: 88, alert: false },
  { route: 'Route F (Maruthi)', taRoute: 'பாதை F (மாருதி)', coverage: 82, alert: false },
];

// 4. Zone-wise Performance Data & Donut Palette
const ZONE_COLORS = ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EC4899'];
const ZONE_PERFORMANCE_DATA = [
  { zone: 'South Zone', taZone: 'தெற்கு மண்டலம்', collectionPct: 94, wasteKg: 5400, coveredHouses: 1420 },
  { zone: 'East Zone', taZone: 'கிழக்கு மண்டலம்', collectionPct: 89, wasteKg: 4900, coveredHouses: 1280 },
  { zone: 'West Zone', taZone: 'மேற்கு மண்டலம்', collectionPct: 86, wasteKg: 4600, coveredHouses: 1190 },
  { zone: 'North Zone', taZone: 'வடக்கு மண்டலம்', collectionPct: 81, wasteKg: 4200, coveredHouses: 1080 },
  { zone: 'Central Zone', taZone: 'மத்திய மண்டலம்', collectionPct: 76, wasteKg: 3800, coveredHouses: 950 },
];

// 5. Top Performing Wards Data
const WARD_PERFORMANCE_DATA = [
  { ward: 'Ward 87', efficiency: 96, zone: 'South' },
  { ward: 'Ward 24', efficiency: 92, zone: 'East' },
  { ward: 'Ward 88', efficiency: 89, zone: 'South' },
  { ward: 'Ward 86', efficiency: 84, zone: 'South' },
  { ward: 'Ward 45', efficiency: 80, zone: 'West' },
  { ward: 'Ward 12', efficiency: 75, zone: 'North' },
];

export const AdminAnalyticsDashboard: React.FC<AdminAnalyticsDashboardProps> = ({ lang = 'en' }) => {
  const [zoneMetric, setZoneMetric] = useState<'collectionPct' | 'wasteKg' | 'coveredHouses'>('collectionPct');

  return (
    <div className="w-full space-y-6 select-none font-sans">


      {/* HOUSEHOLD COLLECTION RISK ANALYSIS (Matching Uploaded Mockups) */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200/90 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-emerald-100 text-[#1E7A38] rounded-lg">
                <Layers className="w-4 h-4" />
              </span>
              <h3 className="text-base font-black text-gray-900">
                {lang === 'ta' ? 'வீட்டு சேகரிப்பு ஆபத்து பகுப்பாய்வு' : 'Household Collection Risk Distribution'}
              </h3>
              <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                1065 HOUSEHOLDS
              </span>
            </div>
            <p className="text-xs text-gray-500 font-medium mt-1">
              {lang === 'ta'
                ? 'வீடுகளின் சேகரிப்பு அதிர்வெண் அடிப்படையில் ஆபத்து பிரிவுகள் (80-100%, 50-79%, 20-49%, 0-19%)'
                : 'Categorized household risk levels based on collection frequency percentage'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* LEFT: Risk Level Bar Chart (Matching Image 1) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                {lang === 'ta' ? 'ஆபத்து வகை வாரியாக வீடுகள் (எண்ணிக்கை)' : 'Households per Risk Level'}
              </span>
              <span className="text-[11px] font-semibold text-gray-400">Scale: 0 - 1000</span>
            </div>
            <div className="h-64 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={HOUSEHOLD_RISK_DATA} margin={{ top: 25, right: 10, left: -15, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis
                    dataKey="category"
                    tick={{ fontSize: 10, fill: '#334155', fontWeight: 700 }}
                    interval={0}
                    height={45}
                  />
                  <YAxis domain={[0, 1000]} ticks={[0, 250, 500, 750, 1000]} tick={{ fontSize: 11, fill: '#64748B', fontWeight: 600 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0F172A', borderRadius: '12px', color: '#FFF', fontSize: '12px' }}
                    formatter={(val: any) => [`${val} Households`, 'Count']}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]} barSize={42}>
                    {HOUSEHOLD_RISK_DATA.map((entry, index) => (
                      <Cell key={`risk-bar-${index}`} fill={entry.color} />
                    ))}
                    <LabelList dataKey="count" position="top" style={{ fontSize: '12px', fontWeight: '800', fill: '#0F172A' }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* RIGHT: Donut Chart with Center Text & Stat Cards (Matching Image 2) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                {lang === 'ta' ? 'மொத்த வீடுகளின் பகிர்வு %' : 'Household Distribution Breakdown'}
              </span>
              <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Total: 1065
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-2">
              {/* Donut Chart with Center Label */}
              <div className="relative w-52 h-52 shrink-0 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={HOUSEHOLD_RISK_DATA}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="count"
                    >
                      {HOUSEHOLD_RISK_DATA.map((entry, index) => (
                        <Cell key={`risk-pie-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0F172A', borderRadius: '12px', color: '#FFF', fontSize: '12px' }}
                      formatter={(val: any) => [`${val} Households (${((Number(val) / 1065) * 100).toFixed(2)}%)`, 'Count']}
                    />
                  </PieChart>
                </ResponsiveContainer>

                {/* Center Donut Label */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                  <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">TOTAL</span>
                  <span className="text-2xl font-black text-slate-900 leading-tight">1065</span>
                  <span className="text-[10px] font-bold text-slate-500">Households</span>
                </div>
              </div>

              {/* Side Cards (Image 2) */}
              <div className="space-y-2.5 w-full flex-1">
                {HOUSEHOLD_RISK_DATA.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 bg-slate-50/80 hover:bg-white rounded-xl border border-slate-200/90 shadow-2xs flex items-center justify-between gap-3 transition"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                      <div>
                        <div className="text-xs font-black text-gray-900">{item.range}</div>
                        <div className="text-[11px] text-gray-500 font-semibold">{lang === 'ta' ? item.taCategory : item.category}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-black text-gray-900">{item.count}</div>
                      <div className="text-[11px] font-extrabold" style={{ color: item.color }}>
                        {item.percentage}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* WEEKLY COLLECTION COMPARISON (LINE CHART) */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200/90 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-blue-100 text-blue-700 rounded-lg">
              <TrendingUp className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-sm font-black text-gray-900">
                {lang === 'ta' ? 'வாராந்திர சேகரிப்பு ஒப்பீடு' : 'Weekly Collection Comparison'}
              </h3>
              <p className="text-[11px] text-gray-500 font-medium">
                {lang === 'ta' ? 'வாரந்தோறும் சேகரிப்பு திறனின் வளர்ச்சி' : 'Week-by-week collection performance growth (Week 1 to Week 4)'}
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-blue-800 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
            Line Chart
          </span>
        </div>

        <div className="h-64 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={WEEKLY_COMPARISON_DATA} margin={{ top: 10, right: 20, left: -20, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey={lang === 'ta' ? 'taWeek' : 'week'} tick={{ fontSize: 11, fill: '#475569', fontWeight: 700 }} />
              <YAxis domain={[70, 100]} tick={{ fontSize: 11, fill: '#64748B', fontWeight: 600 }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0F172A', borderRadius: '12px', color: '#FFF', fontSize: '12px' }}
                formatter={(val: any, name: any) => [
                  name === 'collectionRate' ? `${val}%` : `${val} kg`,
                  name === 'collectionRate' ? (lang === 'ta' ? 'சேகரிப்பு வீதம்' : 'Collection Rate %') : (lang === 'ta' ? 'கழிவு எடை' : 'Waste Collected (kg)')
                ]}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '5px' }} />
              <Line type="monotone" dataKey="collectionRate" name={lang === 'ta' ? 'சேகரிப்பு வீதம் (%)' : 'Collection Rate (%)'} stroke="#2563EB" strokeWidth={3} dot={{ r: 5, fill: '#1E40AF' }} activeDot={{ r: 7 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
