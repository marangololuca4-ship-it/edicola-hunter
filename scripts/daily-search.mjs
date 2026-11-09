import { readFile, writeFile, mkdir } from "node:fs/promises";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;
if (!BOT_TOKEN || !CHAT_ID) {
  console.error("Mancano TELEGRAM_BOT_TOKEN o TELEGRAM_CHAT_ID nei GitHub Secrets.");
  process.exit(1);
}

const queries = [
  '"chiude" edicola Lombardia',
  '"chiusura" cartoleria Lombardia',
  '"cessazione attività" edicola Lombardia',
  '"svendita" cartoleria Lombardia',
  '"liquidazione" edicola Lombardia',
  '"chiude" "negozio" figurine Lombardia'
];

const statePath = "data/leads.json";
await mkdir("data", { recursive: true });
let state = { leads: [] };
try { state = JSON.parse(await readFile(statePath, "utf8")); } catch {}
const known = new Set(state.leads.map(x => x.id));
const found = [];

function decode(s = "") {
  return s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&").replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}
function tag(block, name) {
  const m = block.match(new RegExp("<" + name + "(?:\\s[^>]*)?>([\\s\\S]*?)</" + name + ">"));
  return m ? decode(m[1]) : "";
}

for (const query of queries) {
  const url = "https://news.google.com/rss/search?q=" + encodeURIComponent(query) + "&hl=it&gl=IT&ceid=IT:it";
  try {
    const response = await fetch(url, { headers: { "user-agent": "EdicolaHunter/1.0 (personal research)" } });
    if (!response.ok) throw new Error("HTTP " + response.status);
    const xml = await response.text();
    const blocks = xml.match(/<item>[\s\S]*?<\/item>/g) || [];
    for (const block of blocks) {
      const title = tag(block, "title");
      const link = tag(block, "link");
      const pubDate = tag(block, "pubDate");
      const source = tag(block, "source");
      if (!title || !link) continue;
      const id = link;
      if (known.has(id)) continue;
      const text = (title + " " + source).toLowerCase();
      if (!/(edicola|cartoleria|figurine|fumetti|giornali)/.test(text)) continue;
      const lead = {
        id, title, url: link, source: source || "Google News RSS",
        published: pubDate || null,
        discoveredAt: new Date().toISOString(),
        status: "da verificare",
        note: "Notizia pertinente: non conferma la presenza di rimanenze disponibili."
      };
      found.push(lead);
      known.add(id);
    }
  } catch (error) {
    console.error("Ricerca non riuscita per", query, error.message);
  }
}

const recent = found.slice(0, 10);
for (const lead of recent) {
  const message = [
    "🔎 NUOVA PISTA — EDICOLA HUNTER",
    lead.title,
    lead.source ? "Fonte: " + lead.source : "",
    lead.published ? "Data: " + lead.published : "",
    lead.url,
    "",
    "⚠️ Pista da verificare: la notizia non prova che esistano rimanenze acquistabili."
  ].filter(Boolean).join("\n");
  const response = await fetch("https://api.telegram.org/bot" + BOT_TOKEN + "/sendMessage", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ chat_id: CHAT_ID, text: message, disable_web_page_preview: true })
  });
  if (!response.ok) console.error("Invio Telegram fallito:", await response.text());
}
state.leads = [...state.leads, ...recent].slice(-1000);
await writeFile(statePath, JSON.stringify(state, null, 2) + "\n");
console.log("Nuove piste registrate:", recent.length);
