import { Hono } from "hono";

export interface Env {
  // Example binding to KV. Learn more at https://developers.cloudflare.com/workers/runtime-apis/kv/
  // MY_KV_NAMESPACE: KVNamespace;
  //
  // Example binding to Durable Object. Learn more at https://developers.cloudflare.com/workers/runtime-apis/durable-objects/
  // MY_DURABLE_OBJECT: DurableObjectNamespace;

  DB: D1Database;
}

const app = new Hono<{ Bindings: CloudflareBindings }>();

app.get("/message", async (c) => {

  return c.text("Hello World");
});

export default app;
