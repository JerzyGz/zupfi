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
import {
    createGoogleGenerativeAI,
    type GoogleGenerativeAIProvider,
} from "@ai-sdk/google";
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

    private readonly googleAI: GoogleGenerativeAIProvider;
    private readonly bot: Bot;

    constructor(ctx: AgentContext, env: Env) {
        super(ctx, env);
        console.log("******  Constructor  ***********")
        this.googleAI = createGoogleGenerativeAI({
            apiKey: this.env.GEMINI_API_KEY,
        });
        this.bot = new Bot(this.env.TELEGRAM_TOKEN);
    }

    async sendMessage(id: number, message: string) {
        this.bot.api.sendMessage(id, message);
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
                1.2. query: Usuario consulta historial o resumen de gastos (pasados, periodos específicos, categorías, capacidad de gasto actual).
                        Ej: "¿Cuánto gasté este mes?", "Gastos semana pasada", "Total gastos hoy"
                1.3. other: Interacciones básicas con el bot, Consultas o interacciones generales relacionadas con finanzas personales que no implican registrar gastos ni consultar historial. Incluye preguntas sobre ahorro, presupuesto, ingresos.
                        Ej: "Hola", "¿Cómo estás?", "¿Como te llamas?", "recomiendas ahorrar?", "cómo hago un presupuesto?", "qué hago si gano 3000?"

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
            const model = this.googleAI("gemini-2.0-flash-lite");

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
            //TODO: remove later
            this.sumCounter();
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

    async processImageInvoice({
        chatId,
        fileId,
        caption,
    }: { chatId: number; fileId: string; caption?: string }) {
        try {
            const google = createGoogleGenerativeAI({
                apiKey: this.env.GEMINI_API_KEY,
            });
            const model = google("gemini-2.0-flash");
            const bot = new Bot(this.env.TELEGRAM_TOKEN);

            // Obtener la ruta del archivo de Telegram
            const file = await bot.api.getFile(fileId);
            const filePath = file.file_path;
            console.log("filePath", filePath);
            if (!filePath) {
                this.sendMessage(
                    chatId,
                    "No se pudo obtener la información del archivo de la imagen.",
                );
                return;
            }
            const imageUrl = `https://api.telegram.org/file/bot${this.env.TELEGRAM_TOKEN}/${filePath}`;

            const imageResponse = await fetch(imageUrl);
            if (!imageResponse.ok) {
                this.sendMessage(
                    chatId,
                    `Error al descargar la imagen: ${imageResponse.statusText}`,
                );
                return;
            }

            const imageArrayBuffer = await imageResponse.arrayBuffer();

            // Definir el esquema para los datos de la factura que esperamos extraer
            const BasicInvoiceDataSchema = z.object({
                categoryId: z
                    .string()
                    .describe("ID de la categoría que pertenece la factura/recibo"),
                amount: z.number().describe("Monto total de la factura/recibo"),
                description: z
                    .string()
                    .describe("Breve descripción del concepto principal y empresa"),
                spentAt: z
                    .string()
                    .datetime()
                    .nullable()
                    .describe("Fecha de la factura/recibo en formato ISO 8601"),
            });

            // Llamar al modelo de IA para extraer información de la imagen
            const { object: invoiceData, usage } = await generateObject({
                model,
                schema: BasicInvoiceDataSchema,
                system: `Extrae del recibo o factura el monto total, la fecha de la factura, una breve descripción del concepto principal. Si algún dato no está claro, no se encuentra o no estás seguro, omítelo'.
                Si <caption> esta presente se utiliza para asociar con la categoría. 
                <available_categories>
                ${categoriesArr.join("\n")}
                </available_categories>

                `,
                messages: [
                    {
                        role: "user",
                        content: [
                            {
                                type: "text",
                                text: `<caption>${caption}</caption>`,
                            },
                            {
                                type: "image",
                                image: imageArrayBuffer,
                            },
                        ],
                    },
                ],
            });

            this.sendMessage(
                chatId,
                `Información extraída de la factura:\n${JSON.stringify({ invoiceData, usage }, null, 2)}`,
            );
            //TODO: remove later
            this.sumCounter();
        } catch (error) {
            console.error("Error procesando la imagen de la factura:", error);
            let errorMessage = "Hubo un error desconocido al procesar la imagen.";
            if (error instanceof Error) {
                errorMessage = `Hubo un error al procesar la imagen: ${error.message}`;
            }
            this.sendMessage(chatId, errorMessage);
        }
    }

    async sumCounter() {
        const counter = this.state.counter + 1;
        this.setState({
            ...this.state,
            counter: this.state.counter + 1,
        });
        console.log(`user-${this.name} counter: ${counter}`);
    }

    // Called when a new Agent instance starts or wakes from hibernation
    async onStart() {
        console.log("Agent started with state:", this.state);
    }
}
