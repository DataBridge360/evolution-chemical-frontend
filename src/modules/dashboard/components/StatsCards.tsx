import { Card, CardContent } from '@/src/components/ui/card';

interface Stat {
  name: string;
  value: number;
  description?: string;
}

interface StatsCardsProps {
  stats: Stat[];
}

export function StatsCards({ stats }: StatsCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.name}>
          <CardContent className="p-6">
            <div className="flex flex-col space-y-2">
              <span className="text-sm font-medium text-muted-foreground">{stat.name}</span>
              <span className="text-3xl font-semibold text-foreground">{stat.value}</span>
              {stat.description && (
                <span className="text-xs text-muted-foreground">{stat.description}</span>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
