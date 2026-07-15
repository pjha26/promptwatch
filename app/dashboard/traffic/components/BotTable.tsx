import { BotDetail } from '../types';

export function BotTable({ bots }: { bots: BotDetail[] }) {
  return (
    <section className="border border-primary bg-surface overflow-x-auto">
      <table className="w-full text-left border-collapse min-w-[800px]">
        <thead>
          <tr className="bg-surface-container border-b border-primary font-data-mono text-data-mono text-primary uppercase">
            <th className="p-4 border-r border-primary font-bold">BOT NAME</th>
            <th className="p-4 border-r border-primary font-bold">REQUESTS</th>
            <th className="p-4 border-r border-primary font-bold">STATUS</th>
            <th className="p-4 border-r border-primary font-bold">LAST SEEN</th>
            <th className="p-4 font-bold text-center w-24">TOGGLE</th>
          </tr>
        </thead>
        <tbody className="font-data-mono text-[13px] text-on-surface">
          {bots.map((bot) => {
            const isBlocked = bot.status === 'BLOCKED';
            const isThrottled = bot.status === 'THROTTLED';
            const isAllowed = bot.status === 'ALLOWED';

            // Base row style
            let rowClass = "border-b border-primary hover:bg-surface-container-low transition-colors";
            if (isBlocked) {
              rowClass += " bg-secondary-fixed opacity-90 text-secondary-container";
            }

            return (
              <tr key={bot.id} className={rowClass}>
                <td className={`p-4 border-r border-primary font-bold ${isBlocked ? 'text-secondary-container' : ''}`}>
                  {bot.name}
                </td>
                <td className={`p-4 border-r border-primary ${isBlocked ? 'font-bold' : ''}`}>
                  {bot.requests.toLocaleString()}
                </td>
                <td className="p-4 border-r border-primary">
                  {isBlocked && (
                    <span className="inline-block border border-secondary text-secondary px-2 py-1 text-[10px] bg-background font-bold tracking-widest">
                      BLOCKED
                    </span>
                  )}
                  {isThrottled && (
                    <span className="inline-block border border-primary px-2 py-1 text-[10px] bg-surface-container-high">
                      THROTTLED
                    </span>
                  )}
                  {isAllowed && (
                    <span className="inline-block border border-primary px-2 py-1 text-[10px] bg-surface-container">
                      ALLOWED
                    </span>
                  )}
                </td>
                <td className={`p-4 border-r border-primary ${isBlocked ? 'text-secondary-container' : 'text-on-surface-variant'}`}>
                  {bot.lastSeen}
                </td>
                <td className="p-4 text-center flex justify-center">
                  <button 
                    aria-label={`Toggle ${bot.name}`} 
                    className="w-10 h-5 border border-primary bg-background relative"
                  >
                    {isBlocked ? (
                      <span className="absolute right-0 top-0 bottom-0 w-5 border-l border-primary bg-background hover:bg-surface-container transition-colors"></span>
                    ) : (
                      <span className="absolute left-0 top-0 bottom-0 w-5 bg-primary"></span>
                    )}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}
