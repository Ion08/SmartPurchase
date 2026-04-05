'use client';

import { useMemo, useState } from 'react';
import { Check, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useAppStore } from '@/store/useAppStore';
import { sanitizeInput } from '@/lib/sanitize';
import { Dialog } from '@/components/ui/dialog';
import type { HolidayRegion, PlanType, RestaurantType } from '@/types';

const plans: Array<{ name: PlanType; price: string; description: string; features: string[] }> = [
  { name: 'Basic', price: '€79', description: 'For single-site restaurants starting with automation.', features: ['1 location', 'Weekly forecast', 'CSV import'] },
  { name: 'Pro', price: '€149', description: 'For teams that need ordering and analytics.', features: ['Stop-buy alerts', 'Order generation', 'Analytics'] },
  { name: 'Chain', price: '€399', description: 'For multi-location operators and cloud kitchens.', features: ['Multi-site support', 'Cross-location KPIs', 'Supplier workflows'] }
];

const restaurantTypes: Array<{ value: RestaurantType; label: string }> = [
  { value: 'independent', label: 'Independent' },
  { value: 'chain', label: 'Chain' },
  { value: 'cloud kitchen', label: 'Cloud kitchen' }
];

const holidayRegions: Array<{ value: HolidayRegion; label: string }> = [
  { value: 'MD', label: 'Moldova' },
  { value: 'RO', label: 'Romania' },
  { value: 'GLOBAL', label: 'Global fallback' }
];

export default function SettingsPage() {
  const profile = useAppStore((state) => state.profile);
  const setProfile = useAppStore((state) => state.setProfile);
  const setPlan = useAppStore((state) => state.setPlan);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [thresholdConfirm, setThresholdConfirm] = useState(false);
  const [pendingThreshold, setPendingThreshold] = useState(profile.stopBuyThreshold);

  const selectedPlan = useMemo(() => profile.plan, [profile.plan]);

  const validateProfile = () => {
    const errors: Record<string, string> = {};
    if (!profile.name || profile.name.trim().length === 0) {
      errors.name = 'Restaurant name is required';
    }
    if (!profile.address || profile.address.trim().length === 0) {
      errors.address = 'Address is required';
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveChanges = () => {
    if (validateProfile()) {
      toast.success('Settings saved successfully');
    } else {
      toast.error('Please fix validation errors');
    }
  };

  const handleThresholdChange = (value: number) => {
    if (value !== profile.stopBuyThreshold) {
      setPendingThreshold(value);
      setThresholdConfirm(true);
    }
  };

  const confirmThresholdChange = () => {
    setProfile({ stopBuyThreshold: pendingThreshold });
    setThresholdConfirm(false);
    toast.success(`Stop-buy threshold updated to ${pendingThreshold} days`);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Location profile</CardTitle>
          <CardDescription>Keep the operational profile up to date so forecasts, alerts, and order thresholds stay accurate.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-2">
          <div>
            <Label htmlFor="restaurant-name">Restaurant name</Label>
            <Input 
              id="restaurant-name" 
              className={`mt-2 ${validationErrors.name ? 'border-red-500' : ''}`}
              value={profile.name} 
              onChange={(event) => {
                setProfile({ name: sanitizeInput(event.target.value) });
                if (validationErrors.name) {
                  setValidationErrors({ ...validationErrors, name: '' });
                }
              }} 
            />
            {validationErrors.name && <p className="mt-1 text-sm text-red-600">{validationErrors.name}</p>}
          </div>
          <div>
            <Label htmlFor="restaurant-address">Address</Label>
            <Textarea 
              id="restaurant-address" 
              className={`mt-2 min-h-[42px] ${validationErrors.address ? 'border-red-500' : ''}`}
              value={profile.address} 
              onChange={(event) => {
                setProfile({ address: sanitizeInput(event.target.value) });
                if (validationErrors.address) {
                  setValidationErrors({ ...validationErrors, address: '' });
                }
              }} 
            />
            {validationErrors.address && <p className="mt-1 text-sm text-red-600">{validationErrors.address}</p>}
          </div>
          <div>
            <Label>Location type</Label>
            <div className="mt-2 grid gap-3 sm:grid-cols-3">
              {restaurantTypes.map((type) => {
                const active = profile.type === type.value;
                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setProfile({ type: type.value })}
                    className={`rounded-3xl border px-4 py-3 text-left transition ${active ? 'border-forest-700 bg-forest-50 text-forest-900 dark:bg-forest-900/20 dark:text-forest-100' : 'border-border bg-white hover:bg-surface-muted dark:bg-slate-950'}`}
                  >
                    <p className="text-sm font-semibold">{type.label}</p>
                  </button>
                );
              })}
            </div>
          </div>
            <div>
              <Label htmlFor="holiday-region">Holiday region</Label>
              <Select
                id="holiday-region"
                className="mt-2"
                value={profile.holidayRegion}
                onChange={(event) => setProfile({ holidayRegion: event.target.value as HolidayRegion })}
                options={holidayRegions}
              />
              <p className="mt-2 text-xs text-text-muted">Used to load public holidays and local fallback dates for the forecast model.</p>
            </div>
          <div>
            <Label htmlFor="threshold">Stop-buy threshold: {profile.stopBuyThreshold} days</Label>
            <div className="mt-3 rounded-2xl border border-border bg-surface-muted px-4 py-4">
              <Slider value={pendingThreshold} min={1} max={7} step={1} onValueChange={handleThresholdChange} />
            </div>
            <p className="mt-2 text-xs text-text-muted">Applies immediately to order generation. Lower = earlier orders, Higher = more buffer time.</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Plan selector</CardTitle>
          <CardDescription>Choose the pricing tier that matches the current operating complexity.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 xl:grid-cols-3">
          {plans.map((plan) => {
            const active = selectedPlan === plan.name;
            return (
              <button
                key={plan.name}
                type="button"
                onClick={() => setPlan(plan.name)}
                className={`rounded-[2rem] border p-5 text-left transition hover:-translate-y-0.5 ${active ? 'border-forest-700 bg-forest-50 shadow-soft dark:bg-forest-900/20' : 'border-border bg-white dark:bg-slate-950'}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-lg font-semibold">{plan.name}</p>
                  {active ? <Badge tone="success">Active</Badge> : null}
                </div>
                <p className="mt-2 font-mono text-3xl font-semibold">{plan.price}</p>
                <p className="mt-3 text-sm text-text-muted">{plan.description}</p>
                <div className="mt-3 space-y-1.5">
                  {plan.features.map((feature) => (
                    <div key={feature} className="flex items-center gap-2 text-sm text-text">
                      <Check className="h-4 w-4 text-forest-700" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </button>
            );
          })}
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Integrations</CardTitle>
            <CardDescription>Planned integrations.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-3">
            {['Square', 'iiko', 'R-Keeper'].map((integration) => (
              <div key={integration} className="rounded-3xl border border-border bg-surface-muted p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium">{integration}</p>
                  <Badge tone="neutral">Coming soon</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notification preferences</CardTitle>
            <CardDescription>Decide what should reach your inbox or operations team.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              ['Email alerts', 'email'],
              ['WhatsApp messages', 'whatsapp'],
              ['Low stock notifications', 'lowStock'],
              ['Forecast drift warnings', 'forecast']
            ].map(([label, key]) => (
              <div key={String(key)} className="flex items-center justify-between gap-4 rounded-3xl border border-border px-4 py-3">
                <div>
                  <p className="font-medium">{label}</p>
                </div>
                <Switch
                  checked={profile.notifications[key as keyof typeof profile.notifications]}
                  onCheckedChange={(checked) =>
                    setProfile({
                      notifications: {
                        ...profile.notifications,
                        [key]: checked
                      }
                    })
                  }
                />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="flex items-center gap-2 text-sm font-medium text-text"><Sparkles className="h-4 w-4 text-amber-500" /> Settings persist locally through Zustand.</p>
            <p className="mt-1 text-sm text-text-muted">Changes are saved as you interact, so you can safely reload the workspace.</p>
          </div>
          <Button onClick={handleSaveChanges}>Save changes</Button>
        </CardContent>
      </Card>

      <Dialog
        open={thresholdConfirm}
        onOpenChange={setThresholdConfirm}
        title="Change stop-buy threshold?"
        description={`You're changing the threshold from ${profile.stopBuyThreshold} to ${pendingThreshold} days. This will immediately affect order generation and stop-buy alerts.`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setThresholdConfirm(false)}>
              Cancel
            </Button>
            <Button onClick={confirmThresholdChange}>
              Yes, apply change
            </Button>
          </>
        }
      >
        <p className="text-sm text-text-muted">This change will apply immediately to all future order generation.</p>
      </Dialog>
    </div>

  );
}