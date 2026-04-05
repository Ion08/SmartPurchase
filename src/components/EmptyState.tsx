import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PackageOpen } from 'lucide-react';

export function EmptyState({ title, description, ctaLabel, ctaHref }: { title: string; description: string; ctaLabel: string; ctaHref: string }) {
  return (
    <Card className="overflow-hidden border-dashed">
      <CardContent className="flex flex-col items-center justify-center px-6 py-14 text-center">
        <div className="relative flex h-24 w-24 items-center justify-center rounded-[2rem] bg-forest-50 text-forest-700 dark:bg-forest-500/10 dark:text-forest-200">
          <PackageOpen className="h-11 w-11" />
          <span className="absolute -right-2 -top-2 h-6 w-6 rounded-full bg-amber-500/20 ring-8 ring-transparent" />
        </div>
        <h3 className="mt-5 text-2xl font-semibold tracking-tight">{title}</h3>
        <p className="mt-2 max-w-lg text-sm text-text-muted">{description}</p>
        <Button className="mt-6" asChild>
          <a href={ctaHref}>{ctaLabel}</a>
        </Button>
      </CardContent>
    </Card>
  );
}
