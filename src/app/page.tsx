'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2, ShieldCheck, Sparkles, Truck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

function CountUp({ end, prefix = '', suffix = '' }: { end: number; prefix?: string; suffix?: string }) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    const duration = 1100;
    const start = performance.now();
    const step = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      setValue(end * (0.1 + progress * 0.9));
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        setValue(end);
      }
    };
    requestAnimationFrame(step);
  }, [end]);

  return (
    <span className="font-mono text-4xl font-semibold tracking-tight text-text sm:text-5xl">
      {prefix}
      {Math.round(value).toLocaleString('en-GB')}
      {suffix}
    </span>
  );
}

export default function LandingPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(27,67,50,0.16),transparent_28%),radial-gradient(circle_at_top_right,rgba(245,158,11,0.18),transparent_24%),linear-gradient(180deg,#F8F4E3_0%,#FFFDF8_100%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(27,67,50,0.35),transparent_28%),radial-gradient(circle_at_top_right,rgba(245,158,11,0.18),transparent_24%),linear-gradient(180deg,#04100C_0%,#091512_100%)]">
      <div className="absolute left-[-10rem] top-24 h-72 w-72 rounded-full bg-forest-700/10 blur-3xl" />
      <div className="absolute right-[-8rem] top-32 h-80 w-80 rounded-full bg-amber-500/15 blur-3xl" />
      <div className="mx-auto grid min-h-screen max-w-7xl items-center gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:px-8">
        <motion.section initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }} className="relative z-10">
          <Badge tone="neutral" className="border border-forest-200 bg-white/80 px-3 py-1 text-forest-800 shadow-sm dark:border-forest-700 dark:bg-slate-950/80 dark:text-forest-100">
            AI procurement for HoReCa teams
          </Badge>
          <h1 className="mt-6 max-w-3xl text-5xl font-semibold tracking-tight text-text sm:text-6xl lg:text-7xl">
            Stop guessing. Start purchasing smart.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-text-muted sm:text-xl">
            SmartPurchase HoReCa turns sales history, stock levels, and shelf-life pressure into profitable purchase decisions for restaurants, cloud kitchens, and small food chains.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" asChild>
              <Link href="/dashboard">
                Start free pilot <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="secondary" asChild>
              <Link href="/import">Import sample data</Link>
            </Button>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {[
              { value: 2400, prefix: '€', suffix: '', label: 'saved/month on average' },
              { value: 34, prefix: '', suffix: '%', label: 'less food waste' },
              { value: 91, prefix: '', suffix: '%', label: '7-day forecast accuracy' }
            ].map((item) => (
              <Card key={item.label} className="bg-white/85 dark:bg-slate-950/70">
                <CardContent className="p-5">
                  <CountUp end={item.value} prefix={item.prefix} suffix={item.suffix} />
                  <p className="mt-2 text-sm text-text-muted">{item.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.section>

        <motion.section initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.08 }} className="relative z-10">
          <Card className="overflow-hidden border-border/70 bg-white/90 shadow-soft dark:bg-slate-950/80">
            <CardHeader className="space-y-4 border-b border-border">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <CardTitle>Launch your pilot</CardTitle>
                  <CardDescription>Built for owners who want clear answers, not another dashboard experiment.</CardDescription>
                </div>
                <div className="rounded-full bg-forest-50 px-3 py-1 text-xs font-semibold text-forest-800 dark:bg-forest-500/15 dark:text-forest-200">
                  Live in 24 hours
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-5 p-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-text">Work email</label>
                  <input className="h-11 w-full rounded-2xl border border-border bg-surface-elevated px-4 text-sm shadow-sm outline-none transition focus:ring-2 focus:ring-forest-500" placeholder="you@restaurant.md" />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-text">Company name</label>
                  <input className="h-11 w-full rounded-2xl border border-border bg-surface-elevated px-4 text-sm shadow-sm outline-none transition focus:ring-2 focus:ring-forest-500" placeholder="La Furculiță" />
                </div>
              </div>
              <div className="grid gap-3 rounded-[1.75rem] border border-forest-100 bg-forest-50/70 p-4 dark:border-forest-700/30 dark:bg-forest-900/20">
                {[
                  'Predict demand 30 days ahead',
                  'Detect stop-buy and expiring stock',
                  'Generate purchase orders in one click'
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3 text-sm text-forest-900 dark:text-forest-100">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
              <Button className="w-full" size="lg" asChild>
                <Link href="/dashboard">
                  Start free pilot <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {[
              { title: 'AI Forecasting', icon: Sparkles },
              { title: 'Waste Reduction', icon: ShieldCheck },
              { title: 'Supplier Workflow', icon: Truck }
            ].map((feature) => {
              const Icon = feature.icon;
              return (
                <Card key={feature.title} className="bg-white/70 dark:bg-slate-950/70">
                  <CardContent className="flex items-center gap-3 p-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-forest-700 text-white">
                      <Icon className="h-4 w-4" />
                    </div>
                    <p className="text-sm font-medium">{feature.title}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {[
              { plan: 'Basic', price: '€79', features: '1 location, weekly forecast, CSV import' },
              { plan: 'Pro', price: '€149', features: 'Everything in Basic, order optimization, alerts' },
              { plan: 'Chain', price: '€399', features: 'Multi-location, analytics, supplier workflows' }
            ].map((plan, index) => (
              <Card key={plan.plan} className={index === 1 ? 'border-forest-300 bg-forest-50/80 dark:border-forest-500/40 dark:bg-forest-900/20' : 'bg-white/80 dark:bg-slate-950/70'}>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-lg font-semibold">{plan.plan}</h3>
                    {index === 1 ? <Badge tone="warning">Most popular</Badge> : null}
                  </div>
                  <p className="mt-4 font-mono text-4xl font-semibold tracking-tight">{plan.price}</p>
                  <p className="mt-3 text-sm leading-6 text-text-muted">{plan.features}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.section>
      </div>
    </main>
  );
}
