import { 
  MonitoringEvent, 
  Action, 
  ActionType, 
  Severity, 
  CitationMissedEvent, 
  CompetitorCitedInsteadEvent, 
  RedditCompetitorMentionEvent, 
  ArticlePublishedWithCompetitorsEvent 
} from "@/lib/types";

// Deterministic simple hash for stable IDs
function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(16);
}

function generateActionId(sourceEventIds: string[]): string {
  const sorted = [...sourceEventIds].sort().join('|');
  return `act_${hashString(sorted)}`;
}

type RuleProcessor = (events: MonitoringEvent[]) => Action[];

/**
 * Extensible rules table for deriving Actions from raw MonitoringEvents.
 * Adding a new event type or derivation strategy simply requires adding a new rule here.
 */
const derivationRules: RuleProcessor[] = [
  // Rule 1: Reddit Mentions
  (events) => {
    const redditEvents = events.filter((e): e is RedditCompetitorMentionEvent => e.event_type === "reddit_competitor_mention");
    return redditEvents.map((event) => {
      const engagement = event.upvotes + event.comment_count;
      const severity: Severity = engagement >= 100 ? "high" : engagement >= 30 ? "medium" : "low";

      return {
        id: generateActionId([event.id]),
        type: "reddit",
        severity,
        title: `Engage with thread in ${event.subreddit}`,
        description: `Competitors ${event.competitors_mentioned.join(", ")} were mentioned in "${event.thread_title}". Add your perspective to the conversation.`,
        created_at: event.created_at,
        source_url: event.thread_url,
        source_event_ids: [event.id],
        status: "active",
      };
    });
  },

  // Rule 2: Article Published
  (events) => {
    const articleEvents = events.filter((e): e is ArticlePublishedWithCompetitorsEvent => e.event_type === "article_published_with_competitors");
    return articleEvents.map((event) => {
      const traffic = event.estimated_monthly_traffic;
      const severity: Severity = traffic >= 20000 ? "high" : traffic >= 5000 ? "medium" : "low";

      return {
        id: generateActionId([event.id]),
        type: "outreach",
        severity,
        title: `Pitch author of "${event.article_title}"`,
        description: `${event.publication} mentioned ${event.competitors_cited.join(", ")}. Reach out to get Promptwatch included.`,
        created_at: event.created_at,
        source_url: event.article_url,
        source_event_ids: [event.id],
        status: "active",
      };
    });
  },

  // Rule 3: Citation Missed (Aggregation)
  (events) => {
    const citationEvents = events.filter((e): e is CitationMissedEvent => e.event_type === "citation_missed");

    // Group by identical prompts to aggregate signal
    const grouped = new Map<string, CitationMissedEvent[]>();
    for (const event of citationEvents) {
      const existing = grouped.get(event.prompt) || [];
      existing.push(event);
      grouped.set(event.prompt, existing);
    }

    return Array.from(grouped.values()).map((group) => {
      const count = group.length;
      const severity: Severity = count >= 3 ? "high" : count === 2 ? "medium" : "low";

      const allCompetitors = new Set<string>();
      group.forEach((e) => e.competitor_brands.forEach((b) => allCompetitors.add(b)));

      // Sort events by date descending to get the latest timestamp
      const sortedEvents = [...group].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      const latestEvent = sortedEvents[0];
      const sourceIds = sortedEvents.map((e) => e.id);

      return {
        id: generateActionId(sourceIds),
        type: "content",
        severity,
        title: `Publish content targeting "${latestEvent.prompt}"`,
        description: `You missed citations for this prompt across ${count} queries. Competitors (${Array.from(allCompetitors).join(", ")}) appeared instead.`,
        created_at: latestEvent.created_at,
        source_event_ids: sourceIds,
        status: "active",
      };
    });
  },

  // Rule 4: Competitor Cited Instead
  (events) => {
    const citedEvents = events.filter((e): e is CompetitorCitedInsteadEvent => e.event_type === "competitor_cited_instead");
    return citedEvents.map((event) => {
      const pos = event.position;
      const severity: Severity = pos <= 2 ? "high" : pos <= 4 ? "medium" : "low";

      return {
        id: generateActionId([event.id]),
        type: "outreach", // Defaulting to outreach for visibility recovery
        severity,
        title: `${event.competitor_brand} cited in ${event.source_type}`,
        description: `Competitor was cited at position ${event.position} in "${event.source_title}". Investigate how to replace them.`,
        created_at: event.created_at,
        source_url: event.source_url,
        source_event_ids: [event.id],
        status: "active",
      };
    });
  },
];

export function deriveActions(events: MonitoringEvent[]): Action[] {
  const actions: Action[] = [];
  for (const rule of derivationRules) {
    actions.push(...rule(events));
  }

  // Sort overall actions by created_at descending so newest are on top
  return actions.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}
