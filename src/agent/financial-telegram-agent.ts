import { Agent, type AgentContext } from "agents";
import {
    generateObject,
    generateText,
    type LanguageModelV1,
    type Message,
} from "ai";
import type { IncomingMessage } from "@/routes/telegram/validator";
import {
    agentPrompt,
    agentPromptV2,
    botInstructions,
    categoriesArr,
} from "@/routes/telegram/prompts";
import { createGoogleGenerativeAI, google } from "@ai-sdk/google";
import { z } from "zod";
import { Bot } from "grammy";
import type { Env } from "@/index";

interface State {
    counter: number; // times the agent has processed a message. counter + 1 at the end of the workflow.
    messages: Message[];
    lastUpdate: Date | null;
    maxHistoryLength: number;
}

const ClassificationMessageSchema = z.object({
    valid: z.boolean(),
    type: z.enum(["expense", "query", "other"]),
    reason: z.string().optional(),
});

export class FinancialTelegramAgent extends Agent<Env, State> {

    initialState = {
        counter: 0,
        messages: [],
        lastUpdate: null,
        maxHistoryLength: 6, // TODO: move to env or table settings, bigger in production
    };

    async sendMessage(id: number, message: string) {
        const bot = new Bot(this.env.TELEGRAM_TOKEN);
        bot.api.sendMessage(id, message);
    }

    async classifyMessage({
        query,
        model,
    }: {
        query: string;
        model: LanguageModelV1;
    }) {

        /**
         * TODO: cache for requests and answers
         * If the request is already in the cache, return the answer, skip classification
         */
        const { object, usage } = await generateObject({
            model,
            schema: ClassificationMessageSchema,
            prompt: `
          <user-message>${query}</user-message>
            Clasifica la entrada del usuario para un sistema de gestión de gastos personales:
            1. valid: true (Entrada sobre gastos personales)
                1.1. expense: Usuario registra gasto (monto/categoría).
                        Ej: "Gasté 2000 en comida", "Ropa 1000", "Ayer 500 transporte"
                1.2. query: Usuario consulta gastos (pasados, resúmenes, capacidad de gasto).
                        Ej: "¿Cuánto gasté mes?", "Gastos semana pasada", "Total gastos hoy"
                1.3. other: Interacción básica no transaccional.
                        Ej: "¿Cómo estás?", "¿Tu nombre?"

            2. valid: false (Entrada NO relacionada con gastos personales)
            Ej: "¿Clima?", "¿Cuánta proteína consumir?", "Ayuda cálculos", "¿Dólar hoy?"
          `,
        });

        return {
            data: object,
            usage,
        };
    }

    async processMessage({ message }: IncomingMessage) {
        try {
            console.log("GEMINI_API_KEY", this.env.GEMINI_API_KEY);
            const google = createGoogleGenerativeAI({
                apiKey: this.env.GEMINI_API_KEY,
            });
            const model = google("gemini-2.0-flash-lite");

            const query = message?.text;
            const classifyResult = await this.classifyMessage({
                query,
                model,
            });

            if (!classifyResult.data.valid) {
                this.sendMessage(
                    message.chat.id,
                    "Lo siento, solo puedo ayudarte con temas relacionados a tus finanzas personales",
                );
                return;
            }

            if (classifyResult.data.type === "other") {
                const { text } = await generateText({
                    system: agentPromptV2,
                    model,
                    prompt: `<user-message>${query}</user-message>`,
                });
                this.sendMessage(
                    message.chat.id,
                    JSON.stringify({
                        classifyResult,
                        text,
                    }),
                );
                return;
            }

            // if classification type === 'expense' or 'query'
            const { data, usage: extractionUsage } = await this.extractInformation({
                query,
                model,
            });

            this.sendMessage(
                message.chat.id,
                JSON.stringify({
                    classifyResult,
                    data,
                    classificationUsage: classifyResult.usage,
                    extractionUsage,
                }),
            );
        } catch (error) {
            console.log(error);
            // TODO: - log error
            // Improve message to send to user
            this.sendMessage(
                message.chat.id,
                JSON.stringify({
                    error:
                        error instanceof Error
                            ? error.message
                            : "An unknown error occurred",
                }),
            );
        }
    }

    async extractInformation({
        query,
        model,
    }: { query: string; model: LanguageModelV1 }) {
        const { object, usage } = await generateObject({
            model,
            schema: z.object({
                categoryId: z.string().describe("ID de la categoría del gasto"),
                amount: z.number().describe("Monto del gasto"),
                description: z.string().describe("Descripción textual del gasto"),
                spentAt: z
                    .string()
                    .datetime()
                    .nullable()
                    .describe("Fecha del gasto en formato ISO 8601"),
                reason: z.string().optional(),
            }),
            system: `
            Tu tarea es analizar el mensaje del usuario y extraer información sobre un gasto.
            Utiliza <current_date> como referencia para calcular fechas relativas (ej. "ayer", "hoy").
            Si no se menciona una fecha específica, 'spentAt' es null.
            <current-date>
            ${new Date().toISOString()}
            </current-date>
            <available_categories>
            ${categoriesArr.join("\n")}
            </available_categories>`,
            prompt: `<user-message>${query}</user-message>`,
        });
        return {
            data: object,
            usage,
        };
    }

    // Called when a new Agent instance starts or wakes from hibernation
    async onStart() {
        console.log("Agent started with state:", this.state);
    }
}
