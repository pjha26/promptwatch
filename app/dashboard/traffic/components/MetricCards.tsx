import { TrendingUp } from 'lucide-react';
import { MetricStats } from '../types';

export function MetricCards({ metrics }: { metrics: MetricStats[] }) {
  return (
    <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-gutter">
      {metrics.map((metric) => {
        const isSecondary = metric.colorAccent === 'secondary';
        const bgHoverClass = isSecondary ? 'hover:bg-secondary' : 'hover:bg-primary';
        const textHoverClass = isSecondary ? 'group-hover:text-on-secondary' : 'group-hover:text-on-primary';
        const outlineHoverClass = isSecondary ? 'group-hover:text-on-secondary' : 'group-hover:text-outline-variant';

        return (
          <div
            key={metric.id}
            className={`border border-primary bg-surface p-6 flex flex-col justify-between min-h-[160px] relative group ${bgHoverClass} transition-colors cursor-default`}
          >
            <span className={`font-data-mono text-data-mono text-on-surface-variant uppercase ${outlineHoverClass} transition-colors`}>
              {metric.label}
            </span>
            <span className={`font-display-xl text-[80px] leading-[80px] text-primary ${textHoverClass} transition-colors`}>
              {metric.value}
            </span>
            {metric.trend === 'up' && (
              <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <TrendingUp className="text-secondary w-6 h-6" />
              </div>
            )}
          </div>
        );
      })}
    </section>
  );
}
