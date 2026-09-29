import { Hono } from "hono";

// Browser-only edition: do not read or write historical cloud data.
const app = new Hono();
app.get("/api/health", c => c.json({ ok: true, service: "yizhi", storage: "browser" }));
app.all("/api/*", c => { c.header("Cache-Control", "no-store"); return c.json({ error: "当前版本仅使用浏览器本机存储" }, 410); });
export default app;
