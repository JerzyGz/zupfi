import { Agent, type AgentContext } from "agents";
import {
  generateObject,
  generateText,
  type LanguageModelV1,
  type Message,
} from "ai";
import type { IncomingMessage } from "@/worker/routes/telegram/validator";
import { agentPromptV2, categoriesArr } from "@/worker/routes/telegram/prompts";
import {
  createGoogleGenerativeAI,
  type GoogleGenerativeAIProvider,
} from "@ai-sdk/google";
import { z } from "zod";
import { Bot } from "grammy";
import type { Env } from "@/worker/index";
import { drizzle, type DrizzleD1Database } from "drizzle-orm/d1";
import { expenses } from "@/worker/db/schema";
import { getUtcDate } from "@/worker/helpers/date";

interface State {
  userId: string;
  name: string;
  counter: number; // times the agent has processed a message. counter + 1 at the end of the workflow.
  messages: Message[];
  languageCode?: string;
  maxHistoryLength: number;
  lastActive: string;
}

const ClassificationMessageSchema = z.object({
  valid: z.boolean(),
  type: z.enum(["expense", "query", "other"]),
  reason: z.string().optional(),
});

const ExpenseDataSchema = z.object({
  categoryId: z.string().describe("ID de la categoría del gasto"),
  amount: z.number().describe("Monto del gasto"),
  description: z.string().describe("Descripción textual del gasto"),
  spentAt: z
    .string()
    .datetime()
    .nullable()
    .describe("Fecha del gasto en formato ISO 8601"),
});

type ExpenseData = z.infer<typeof ExpenseDataSchema>;

export class FinancialTelegramAgent extends Agent<Env, State> {
  initialState = {
    userId: "",
    name: "",
    counter: 0,
    messages: [],
    lastActive: getUtcDate(),
    maxHistoryLength: 6, // TODO: move to env or table settings, bigger in production
  };

  private readonly googleAI: GoogleGenerativeAIProvider;
  private readonly bot: Bot;
  private readonly db: DrizzleD1Database;

  constructor(ctx: AgentContext, env: Env) {
    super(ctx, env);
    console.log("******  Constructor  ***********");
    console.log("ctx", ctx);

    this.googleAI = createGoogleGenerativeAI({
      apiKey: env.GEMINI_API_KEY,
    });
    this.bot = new Bot(env.TELEGRAM_TOKEN);
    this.db = drizzle(env.DB);
  }

  async setInitUserState(user: {
    id: string;
    name: string;
    languageCode?: string;
  }) {
    this.setState({
      ...this.state,
      userId: user.id,
      name: user.name,
      languageCode: user.languageCode || "es",
    });
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
                1.1. expense: Usuario registra gasto (monto y/o categoría), el monto es obligatorio (monto > 0).
                        Ej: "Gasté 2000 en comida", "Ropa 1000", "Ayer 500 transporte"
                1.2. query: Usuario consulta historial o resumen de gastos (pasados, periodos específicos, categorías, capacidad de gasto actual).
                        Ej: "¿Cuánto gasté este mes?", "Gastos semana pasada", "Total gastos hoy"
                1.3. other: Deuda es distinto a gasto (NO REGISTRAR), Interacciones básicas con el bot, Consultas o interacciones generales relacionadas con finanzas personales que no implican registrar gastos ni consultar historial. Incluye preguntas sobre ahorro, presupuesto, ingresos.
                        Ej: "Hola", "¿Cómo estás?", "¿Como te llamas?", "debo [monto] [alquiler | amigo | dueño]", "recomiendas ahorrar?", "cómo hago un presupuesto?", "qué hago si gano [monto]?"

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
          "Lo siento, solo puedo ayudarte con temas relacionados a tus finanzas personales"
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
          })
        );
        return;
      }

      // if classification type === 'expense' or 'query'
      const { data, usage: extractionUsage } = await this.extractInformation({
        query,
        model,
      });

      await this.saveExpense(data);

      this.sendMessage(
        message.chat.id,
        JSON.stringify({
          classifyResult,
          data,
          classificationUsage: classifyResult.usage,
          extractionUsage,
        })
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
        })
      );
    }
  }

  async saveExpense(expenseData: ExpenseData) {
    const { categoryId, amount, description, spentAt } = expenseData;
    const date = getUtcDate();
    const data = {
      id: crypto.randomUUID(),
      userId: this.state.userId,
      categoryId,
      amount,
      description,
      spentAt: spentAt ? spentAt : date,
      createdAt: date,
      updatedAt: date,
    };
    console.log("expenseData", data);
    await this.db.insert(expenses).values(data);
  }

  async extractInformation({
    query,
    model,
  }: {
    query: string;
    model: LanguageModelV1;
  }) {
    const { object, usage } = await generateObject({
      model,
      schema: ExpenseDataSchema,
      system: `
            Tu tarea es analizar el mensaje del usuario y extraer información sobre un gasto.
            Utiliza <current_date> como referencia para calcular fechas relativas (ej. "ayer", "hoy").
            Si no se menciona una fecha específica, 'spentAt' es null.
            Asociar la categoría a la que pertenece el gasto.
            Si la categoría no está en la lista, por defecto es "otros".
            <user-message>
            ${query}
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

  async processImageInvoice({ message }: IncomingMessage) {
    const chatId = message.chat.id;
    const fileId = message.photo[message.photo.length - 1].file_id;
    const caption = message.caption;

    try {
      const google = createGoogleGenerativeAI({
        apiKey: this.env.GEMINI_API_KEY,
      });
      const model = google("gemini-1.5-flash-latest");
      const bot = new Bot(this.env.TELEGRAM_TOKEN);

      // Obtener la ruta del archivo de Telegram
      const file = await bot.api.getFile(fileId);
      const filePath = file.file_path;
      console.log("filePath", filePath);
      if (!filePath) {
        this.sendMessage(
          chatId,
          "No se pudo obtener la información del archivo de la imagen."
        );
        return;
      }
      const imageUrl = `https://api.telegram.org/file/bot${this.env.TELEGRAM_TOKEN}/${filePath}`;

      const imageResponse = await fetch(imageUrl);
      if (!imageResponse.ok) {
        this.sendMessage(
          chatId,
          `Error al descargar la imagen: ${imageResponse.statusText}`
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

      await this.saveExpense(invoiceData);

      this.sendMessage(
        chatId,
        `Información extraída de la factura:\n${JSON.stringify(
          { invoiceData, usage },
          null,
          2
        )}`
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
