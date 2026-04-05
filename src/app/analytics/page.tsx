'use client';

import { useEffect, useMemo, useState } from 'react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { buildAnalyticsData } from '@/lib/analyticsData';

const COLORS = ['#1B4332', '#F59E0B', '#4F6F52', '#7FB069', '#D6A94A'];

function sixMonthsAgo() {
  const date = new Date();
  date.setMonth(date.getMonth() - 5);
  return date.toISOString().slice(0, 10);
}

function todayValue() {
  return new Date().toISOString().slice(0, 10);
}

export default function AnalyticsPage() {
  const data = buildAnalyticsData();
  const [startDate, setStartDate] = useState(sixMonthsAgo());
  const [endDate, setEndDate] = useState(todayValue());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timeout = window.setTimeout(() => setReady(true), 800);
    return () => window.clearTimeout(timeout);
  }, []);

  const monthSpan = useMemo(() => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diff = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
    return Math.max(2, Math.min(6, diff + 1));
  }, [startDate, endDate]);

  const slices = useMemo(() => ({
    waste: data.wasteTrend.slice(0, monthSpan),
    accuracy: data.accuracyTrend.slice(0, monthSpan),
    spend: data.spendByCategory,
    gross: data.grossMargin.slice(0, monthSpan)
  }), [data, monthSpan]);

  if (!ready) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-24 rounded-3xl" />
        <div className="grid gap-6 xl:grid-cols-2">
          <Skeleton className="h-[340px] rounded-3xl" />
          <Skeleton className="h-[340px] rounded-3xl" />
          <Skeleton className="h-[340px] rounded-3xl" />
          <Skeleton className="h-[340px] rounded-3xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Badge tone="neutral">Six-month performance review</Badge>
        <p className="text-sm text-text-muted">Core KPIs over the selected interval.</p>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-4 p-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm text-text-muted">Date range</p>
            <p className="mt-1 text-xl font-semibold">Analytics window</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:w-[28rem]">
            <div>
              <label className="mb-2 block text-sm font-medium text-text">From</label>
              <Input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-text">To</label>
              <Input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
            <CardHeader>
              <CardTitle>Monthly waste trend</CardTitle>
              <CardDescription>Waste is trending down as purchasing becomes tighter.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={slices.waste} margin={{ left: 8, right: 16, top: 8, bottom: 8 }}>
                    <defs>
                      <linearGradient id="wasteGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1B4332" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#1B4332" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="4 4" stroke="rgba(148,163,184,0.2)" />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} />
                    <YAxis tickLine={false} axisLine={false} />
                    <Tooltip />
                    <Area type="monotone" dataKey="value" stroke="#1B4332" fill="url(#wasteGradient)" strokeWidth={3} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Forecast accuracy over time</CardTitle>
              <CardDescription>Accuracy improved as the model saw more purchase history.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={slices.accuracy} margin={{ left: 8, right: 16, top: 8, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="4 4" stroke="rgba(148,163,184,0.2)" />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} />
                    <YAxis tickLine={false} axisLine={false} />
                    <Tooltip />
                    <Line type="monotone" dataKey="value" stroke="#F59E0B" strokeWidth={3} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Spend by category</CardTitle>
              <CardDescription>Where the money goes every month.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={slices.spend} dataKey="value" nameKey="name" outerRadius={110} innerRadius={72} paddingAngle={2}>
                      {slices.spend.map((entry, index) => (
                        <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Gross margin before vs after Plateful</CardTitle>
              <CardDescription>Margin gains become visible in every category.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={slices.gross} margin={{ left: 8, right: 16, top: 8, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="4 4" stroke="rgba(148,163,184,0.2)" />
                    <XAxis dataKey="category" tickLine={false} axisLine={false} />
                    <YAxis tickLine={false} axisLine={false} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="before" fill="#94A3B8" radius={[10, 10, 0, 0]} />
                    <Bar dataKey="after" fill="#1B4332" radius={[10, 10, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
      </div>
    </div>
  );
}
