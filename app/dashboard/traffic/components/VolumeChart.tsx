import { TrafficDataPoint } from '../types';

export function VolumeChart({ data }: { data: TrafficDataPoint[] }) {
  return (
    <section className="border border-primary mb-gutter bg-surface relative overflow-hidden">
      <div className="p-4 border-b border-primary bg-surface-container flex justify-between items-center flex-col sm:flex-row gap-4 sm:gap-0">
        <h3 className="font-data-mono text-data-mono uppercase font-bold text-primary">TRAFFIC VOLUME VS ORIGIN (24H)</h3>
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-primary block border border-primary"></span>
            <span className="font-data-mono text-[10px] uppercase">LEGITIMATE</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-secondary block border border-primary"></span>
            <span className="font-data-mono text-[10px] uppercase">BOT (THROTTLED/BLOCKED)</span>
          </div>
        </div>
      </div>

      {/* Brutalist Chart Container */}
      <div className="h-80 w-full relative bg-graph-paper bg-surface-container-low p-6 flex flex-col justify-end">
        {/* Y Axis labels */}
        <div className="absolute left-2 top-6 bottom-8 flex flex-col justify-between font-data-mono text-[10px] text-on-surface-variant">
          <span>100K</span>
          <span>75K</span>
          <span>50K</span>
          <span>25K</span>
          <span>0</span>
        </div>

        {/* Chart Area (Axes) */}
        <div className="ml-8 border-l-2 border-b-2 border-primary h-full flex items-end justify-between pt-4 px-2 relative z-10 overflow-x-auto min-w-[500px]">
          {/* Bars */}
          {data.map((point, i) => {
            const isFirst = i === 0;
            const isLast = i === data.length - 1;
            return (
              <div key={point.time} className="w-12 h-full flex flex-col justify-end group">
                <div 
                  className="w-full bg-secondary border border-primary group-hover:bg-error transition-colors"
                  style={{ height: `${point.bot}%` }}
                ></div>
                <div 
                  className="w-full bg-primary border border-primary border-t-0"
                  style={{ height: `${point.legitimate}%` }}
                ></div>
                <span className={`font-data-mono text-[10px] absolute -bottom-6 text-center w-12 ${isFirst ? 'left-2' : isLast ? 'right-2' : ''}`}>
                  {point.time}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
