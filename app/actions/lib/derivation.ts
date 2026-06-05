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
    
    // Group by thread_url
    const grouped = new Map<string, RedditCompetitorMentionEvent[]>();
    for (const e of redditEvents) {
      const group = grouped.get(e.thread_url) ?? [];
      group.push(e);
      grouped.set(e.thread_url, group);
    }

    return Array.from(grouped.values()).map((group) => {
      const sortedEvents = [...group].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      const latestEvent = sortedEvents[0];
      const sourceIds = sortedEvents.map((e) => e.id);

      const engagement = latestEvent.upvotes + latestEvent.comment_count;
      const severity: Severity = engagement >= 100 ? "high" : engagement >= 30 ? "medium" : "low";

      const allCompetitors = new Set<string>();
      group.forEach((e) => e.competitors_mentioned.forEach((c) => allCompetitors.add(c)));

      return {
        id: generateActionId(sourceIds),
        type: "reddit",
        severity,
        title: `Engage with thread in ${latestEvent.subreddit}`,
        description: `Competitors ${Array.from(allCompetitors).join(", ")} were mentioned in "${latestEvent.thread_title}". Add your perspective to the conversation.`,
        created_at: latestEvent.created_at,
        source_url: latestEvent.thread_url,
        source_event_ids: sourceIds,
        status: "active",
      };
    });
  },

  // Rule 2: Article Published
  (events) => {
    const articleEvents = events.filter((e): e is ArticlePublishedWithCompetitorsEvent => e.event_type === "article_published_with_competitors");
    
    // Group by article_url
    const grouped = new Map<string, ArticlePublishedWithCompetitorsEvent[]>();
    for (const e of articleEvents) {
      const group = grouped.get(e.article_url) ?? [];
      group.push(e);
      grouped.set(e.article_url, group);
    }

    return Array.from(grouped.values()).map((group) => {
      const sortedEvents = [...group].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      const latestEvent = sortedEvents[0];
      const sourceIds = sortedEvents.map((e) => e.id);

      const traffic = latestEvent.estimated_monthly_traffic;
      const severity: Severity = traffic >= 20000 ? "high" : traffic >= 5000 ? "medium" : "low";

      const allCompetitors = new Set<string>();
      group.forEach((e) => e.competitors_cited.forEach((c) => allCompetitors.add(c)));

      return {
        id: generateActionId(sourceIds),
        type: "outreach",
        severity,
        title: `Pitch author of "${latestEvent.article_title}"`,
        description: `${latestEvent.publication} mentioned ${Array.from(allCompetitors).join(", ")}. Reach out to get Promptwatch included.`,
        created_at: latestEvent.created_at,
        source_url: latestEvent.article_url,
        source_event_ids: sourceIds,
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
      
      const actionId = `action_${[...sourceIds].sort().join("_")}`;

      return {
        id: actionId,
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
    
    // Group by source_url
    const grouped = new Map<string, CompetitorCitedInsteadEvent[]>();
    for (const e of citedEvents) {
      const group = grouped.get(e.source_url) ?? [];
      group.push(e);
      grouped.set(e.source_url, group);
    }

    return Array.from(grouped.values()).map((group) => {
      const sortedEvents = [...group].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      const latestEvent = sortedEvents[0];
      const sourceIds = sortedEvents.map((e) => e.id);

      const bestPos = Math.min(...group.map((e) => e.position));
      const severity: Severity = bestPos <= 2 ? "high" : bestPos <= 4 ? "medium" : "low";

      const allCompetitors = new Set<string>();
      group.forEach((e) => allCompetitors.add(e.competitor_brand));

      return {
        id: generateActionId(sourceIds),
        type: "outreach", 
        severity,
        title: `${Array.from(allCompetitors).join(", ")} cited in ${latestEvent.source_type}`,
        description: `Competitors were cited at position ${bestPos} in "${latestEvent.source_title}". Investigate how to replace them.`,
        created_at: latestEvent.created_at,
        source_url: latestEvent.source_url,
        source_event_ids: sourceIds,
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
