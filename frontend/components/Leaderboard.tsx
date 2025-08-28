import React from "react";

type EventRow = {
  id: string;
  name: string;
  votes: number;
  percentage?: number;
  image_url?: string;
  hours?: string;
  contact?: { phone?: string };
  needs_reservation?: boolean;
};

export function Leaderboard({ events, totalVotes }: { events: EventRow[]; totalVotes: number }) {
  const [expanded, setExpanded] = React.useState(false);
  const shown = expanded ? events.slice(0, 20) : events.slice(0, 6);

  return (
    <>
      <ul className="space-y-2">
        {shown.map((e, i) => (
          <LeaderboardRow key={e.id} event={e} rank={i} totalVotes={totalVotes} />
        ))}
      </ul>
      {events.length > shown.length && (
        <button
          onClick={() => setExpanded(v => !v)}
          className="mt-3 w-full rounded-xl bg-white/80 dark:bg-neutral-900/70 backdrop-blur-md border border-white/15 dark:border-white/10 px-4 py-2 text-sm font-semibold text-neutral-800 dark:text-neutral-100 hover:bg-white/90 dark:hover:bg-neutral-900/80 transition"
        >
          {expanded ? 'Show less' : `Show ${events.length - shown.length} more`}
        </button>
      )}
    </>
  );
}

function LeaderboardRow({ event, rank, totalVotes }: { event: EventRow; rank: number; totalVotes: number }) {
  const pct = totalVotes ? Math.round((event.votes / totalVotes) * 100) : 0;
  const bar =
    rank === 0 ? 'from-purple-500 to-blue-500' :
    rank === 1 ? 'from-sky-500 to-cyan-500' :
    rank === 2 ? 'from-emerald-500 to-green-500' :
                 'from-neutral-400 to-neutral-500';
  const medal = rank === 0 ? '🥇' : rank === 1 ? '🥈' : rank === 2 ? '🥉' : `${rank + 1}`;

  return (
    <li className="rounded-xl bg-white/80 dark:bg-neutral-900/75 backdrop-blur-md border border-white/15 dark:border-white/10 p-3 shadow-sm">
      <div className="flex items-center gap-3">
        <img
          src={event.image_url || `https://source.unsplash.com/80x80/?${encodeURIComponent(event.name)}`}
          alt=""
          loading="lazy"
          className="w-12 h-12 rounded-lg object-cover border border-white/15 dark:border-white/10"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-3">
            <p className="font-semibold text-neutral-900 dark:text-white truncate">{event.name}</p>
            <div className="text-sm font-semibold text-neutral-700 dark:text-neutral-200 min-w-[84px] text-right">
              {event.votes} • {pct}%
            </div>
          </div>
          <div className="mt-2 h-2.5 w-full bg-neutral-200/70 dark:bg-white/10 rounded-full overflow-hidden">
            <div
              className={`h-full bg-gradient-to-r ${bar}`}
              style={{ width: `${Math.max(3, Math.min(100, pct))}%` }}
              role="progressbar"
              aria-valuenow={pct}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
        </div>
        <div className="ml-1 text-xl w-8 text-center">{medal}</div>
      </div>
    </li>
  );
}
