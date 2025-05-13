import { Bot, type Context, webhookCallback } from "grammy";
import type { UserFromGetMe, Update } from "grammy/types";
import { Hono } from "hono";
import { z } from "zod";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { agentPrompt, botInstructions, categoriesArr } from "./prompts";
import { generateObject, generateText } from "ai";

const telegramRoute = new Hono<{ Bindings: CloudflareBindings }>();

telegramRoute.post("/chat-web-hook", async (c) => {
  const google = createGoogleGenerativeAI({
    apiKey: c.env.GEMINI_API_KEY,
  });

  /**
   * TODO: cache for requests and answers
   * If the request is already in the cache, return the answer, skip classification
   */
  const model = google("gemini-2.0-flash-lite");
  const bot = new Bot(c.env.TELEGRAM_TOKEN, {
    botInfo: c.env.BOT_INFO,
  });

  bot.command("start", async (ctx: Context) => {
    //TODO: add welcome message, and minimal introduction about what the agent can do
    return await ctx.reply("Hello, world!");
  });

  //allow only text message
  bot.on("message:text", async (ctx) => {
    try {
      const query = `<user-message>${ctx.message?.text}</user-message>`;
      console.log("Mensaje recibido:", query);
      const { object: classification, usage: classificationUsage } =
        await generateObject({
          model,
          prompt: `
			${query}
			1. valid: true → Si el mensaje está relacionado exclusivamente con gastos personales.
			Clasifica como:
				1.1 expense: cuando el usuario registra un gasto con monto y/o categoría.
					Ejemplos:
					-"Gasté 2000 en comida"
					-"Compré ropa por 1000"
					-"Ayer pagué 500 de transporte"
				1.2 query: cuando el usuario consulta sobre sus gastos pasados o cuanto puede comprar.
					Ejemplos:
					"¿Cuánto gasté este mes?"
					"Muéstrame mis gastos de la semana pasada"
					"Total de gastos de hoy"
				1.3 other: solo válido para mensajes de interacción básica con el asistente:
					"¿Cómo estás?"
					"¿Cómo te llamas?"
					"¿Cuál es tu nombre?"
			2. valid: false → Si el mensaje no es claramente un registro o una consulta de gastos personales.
				Ejemplos:
				"¿Cómo está el clima?"
				"¿Cuánto debo consumir de proteínas?"
				"Me puedes ayudar con cálculos matemáticos?"
				"¿Qué opinas del dólar hoy?"
			`,
          schema: z.object({
            valid: z.boolean(),
            type: z.enum(["expense", "query", "other"]),
            reason: z.string().optional(),
          }),
        });

      if (!classification.valid) {
        return ctx.reply(
          "Lo siento, solo puedo ayudarte con temas relacionados a tus finanzas personales",
        );
        // return c.text(genericAnswerOffTopic());
      }

      if (classification.type === "other") {
        const { text } = await generateText({
          // system: agentPrompt,
          model,
          prompt: `
          ${botInstructions}
          Responde: ${query}
          `,
        });

        return ctx.reply(
          JSON.stringify({
            classification,
            text,
          }),
        );
      }

      // if classification type === 'expense' or 'query'
      const { object, usage: expensesUsage } = await generateObject({
        system: `
			    <current-date>
				${new Date().toISOString()}
				</current-date>
				Determina a cual categoría pertenece el gasto.
				<categories>
				${categoriesArr.join("\n")}
				</categories>
				y extrae el monto, la descripción del gasto y la fecha (Ejemplo: ayer | hoy | hace dos días) en isoString.
				`,
        model: google("gemini-2.0-flash-lite"),
        prompt: query,
        schema: z.object({
          categoryId: z.string(),
          amount: z.number(),
          description: z.string(),
          spentAt: z.string().datetime().nullable(),
          reason: z.string().optional(),
        }),
      });
      ctx.reply(
        JSON.stringify({
          classification,
          data: object,
          classificationUsage,
          expensesUsage,
        }),
      );
    } catch (error) {
      console.log(error);
      // TODO: this for testing. return better error message
      ctx.reply(
        error instanceof Error ? error.message : "An unknown error occurred",
      );
    }
  });

  //allow only photo message
  bot.on("message:photo", (ctx) => {
    //TODO: pending to implement
    console.log("Mensaje recibido:", ctx.message);
    return ctx.reply("Bot to handle photo!");
  });

  const handler = webhookCallback(bot, "cloudflare-mod");
  return await handler(c.req.raw);
});

export default telegramRoute;
