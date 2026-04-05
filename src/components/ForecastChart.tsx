'use client';

import { motion } from 'framer-motion';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useI18n } from '@/lib/i18n';
import type { ForecastPoint } from '@/types';

type HolidayDotProps = {
  cx?: number;
  cy?: number;
  payload?: ForecastPoint;
};

function HolidayCheckpointDot({ cx, cy, payload }: HolidayDotProps) {
  if (!payload?.isHoliday || payload.predicted === null || cx === undefined || cy === undefined) {
    return null;
  }

  return (
    <g>
      <circle cx={cx} cy={cy} r={6} fill="#ffffff" stroke="#F59E0B" strokeWidth={2.5} />
      <circle cx={cx} cy={cy} r={2.5} fill="#F59E0B" />
    </g>
  );
}

export function ForecastChart({ data }: { data: ForecastPoint[] }) {
  const { t, language } = useI18n();

  const shortDateFormatter = new Intl.DateTimeFormat(language === 'ro' ? 'ro-RO' : 'en-GB', {
    day: '2-digit',
    month: '2-digit'
  });

  const fullDateFormatter = new Intl.DateTimeFormat(language === 'ro' ? 'ro-RO' : 'en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  const formatTickDate = (value: string) => {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? value : shortDateFormatter.format(parsed);
  };

  const formatTooltipDate = (value: string) => {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? value : fullDateFormatter.format(parsed);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>{t('forecast.chartTitle')}</CardTitle>
          <CardDescription>{t('forecast.chartDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[360px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ left: 8, right: 16, top: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="4 4" stroke="rgba(148,163,184,0.25)" />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12 }}
                  tickMargin={8}
                  interval="preserveStartEnd"
                  minTickGap={28}
                  tickFormatter={formatTickDate}
                />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                <Tooltip
                  labelFormatter={formatTooltipDate}
                  contentStyle={{
                    borderRadius: 18,
                    border: '1px solid rgba(148,163,184,0.2)',
                    boxShadow: '0 20px 60px rgba(15, 23, 42, 0.12)'
                  }}
                />
                <Legend />
                <Line type="monotone" dataKey="actual" name={t('forecast.actual')} stroke="#1B4332" strokeWidth={3} dot={false} connectNulls={false} />
                <Line type="monotone" dataKey="baselinePredicted" name={t('forecast.baseline')} stroke="#6B7280" strokeWidth={2.5} strokeDasharray="5 5" strokeOpacity={0.14} dot={false} connectNulls={false} />
                <Line
                  type="monotone"
                  dataKey="predicted"
                  name={t('forecast.predicted')}
                  stroke="#F59E0B"
                  strokeWidth={3.5}
                  strokeDasharray="6 4"
                  dot={<HolidayCheckpointDot />}
                  activeDot={{ r: 5, stroke: '#F59E0B', strokeWidth: 1.5, fill: '#ffffff' }}
                  connectNulls={false}
                />
                <Line type="monotone" dataKey="upperBound" name={t('forecast.bestCase')} stroke="#047857" strokeWidth={2} strokeDasharray="4 4" strokeOpacity={0.14} dot={false} connectNulls={false} />
                <Line type="monotone" dataKey="lowerBound" name={t('forecast.worstCase')} stroke="#DC2626" strokeWidth={2} strokeDasharray="4 4" strokeOpacity={0.14} dot={false} connectNulls={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
