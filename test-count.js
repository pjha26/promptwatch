const fs = require('fs');
const events = JSON.parse(fs.readFileSync('./public/monitoring-events.json'));

const citationEvents = events.filter(e => e.event_type === "citation_missed");
const promptGroups = new Map();
for (const e of citationEvents) {
  const group = promptGroups.get(e.prompt) || [];
  group.push(e);
  promptGroups.set(e.prompt, group);
}
const citationCount = promptGroups.size;

const redditEvents = events.filter(e => e.event_type === "reddit_competitor_mention");
const redditGroups = new Map();
for (const e of redditEvents) {
  const group = redditGroups.get(e.thread_url) || [];
  group.push(e);
  redditGroups.set(e.thread_url, group);
}
const redditCount = Math.min(8, redditGroups.size);

const articleEvents = events.filter(e => e.event_type === "article_published_with_competitors");
const articleGroups = new Map();
for (const e of articleEvents) {
  const group = articleGroups.get(e.article_url) || [];
  group.push(e);
  articleGroups.set(e.article_url, group);
}
const articleCount = Math.min(8, articleGroups.size);

const citedEvents = events.filter(e => e.event_type === "competitor_cited_instead");
const citedGroups = new Map();
for (const e of citedEvents) {
  const group = citedGroups.get(e.source_url) || [];
  group.push(e);
  citedGroups.set(e.source_url, group);
}
const citedCount = Math.min(8, citedGroups.size);

console.log("Total:", citationCount + redditCount + articleCount + citedCount);
