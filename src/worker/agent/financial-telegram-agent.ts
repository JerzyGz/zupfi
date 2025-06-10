import { Agent, type AgentContext } from "agents";
import {
  generateObject,
  generateText,
  type LanguageModelV1,
  type Message,
} from "ai";
import type { IncomingMessage } from "@/worker/routes/telegram/validator";
import { agentPromptV2, categoriesArr } from "@/worker/agent/prompts";
import {
  createGoogleGenerativeAI,
  type GoogleGenerativeAIProvider,
} from "@ai-sdk/google";
import { z } from "zod";
import { Bot } from "grammy";
import type { Env } from "@/worker/index";
import { expenses, user } from "@/worker/db/schema";
import { getUtcDate } from "@/worker/helpers/date";
import { DrizzleDBType, getDrizzleDb } from "@/worker/db";
import { eq } from "drizzle-orm";

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
  private readonly db: DrizzleDBType;

  constructor(ctx: AgentContext, env: Env) {
    super(ctx, env);

    this.googleAI = createGoogleGenerativeAI({
      apiKey: env.GEMINI_API_KEY,
    });
    this.bot = new Bot(env.TELEGRAM_TOKEN);
    this.db = getDrizzleDb();
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

  async sendFeedbackReactionCheckReaction(chatId: number, messageId: number) {
    this.bot.api.setMessageReaction(chatId, messageId, [
      { type: "emoji", emoji: "👍" },
    ]);
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

        this.sendMessage(message.chat.id, text);
        return;
      }

      // if classification type === 'expense' or 'query'
      //TODO: save usage tokens in the database
      //TODO: Call tool to perform query to the database
      const { data } = await this.extractInformation({
        query,
        model,
      });

      await this.saveExpense(data);

      this.sendFeedbackReactionCheckReaction(
        message.chat.id,
        message.message_id
      );
    } catch (error) {
      console.log("ERROR: Processing message failed", error);

      this.sendMessage(
        message.chat.id,
        "Hubo un error al procesar tu mensaje. Por favor, intenta nuevamente más tarde."
      );
    }
  }

  async saveExpense(expenseData: ExpenseData) {
    const { categoryId, amount, description, spentAt } = expenseData;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_, chatTelegramId] = this.name.split("-");
    const [usr] = await this.db
      .select({ userId: user.id })
      .from(user)
      .where(eq(user.chatTelegramId, parseInt(chatTelegramId)));
    const date = getUtcDate();
    const data = {
      id: crypto.randomUUID(),
      userId: usr.userId,
      categoryId,
      amount,
      description,
      spentAt: spentAt ? spentAt : date,
      createdAt: date,
      updatedAt: date,
    };
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
            Asociar el gasto a una de las categorías disponibles en <available_categories>.
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

      const file = await bot.api.getFile(fileId);
      const filePath = file.file_path;
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

      // Define the schema for the invoice data
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

      const { object: invoiceData } = await generateObject({
        model,
        schema: BasicInvoiceDataSchema,
        system: `Extrae del recibo o factura el monto total, la fecha de la factura, una breve descripción del concepto principal. Si algún dato no está claro, no se encuentra o no estás seguro, omítelo'.
        Determinar la categoría a la que pertenece la factura/recibo entre los disponibles en <available_categories>.
        Si <caption> esta presente se utiliza para asociar con la categoría, determina a cual <available_categories> pertenece.
        <available_categories>
        ${categoriesArr.join("\n")}
        </available_categories>`,
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

      this.sendFeedbackReactionCheckReaction(chatId, message.message_id);
    } catch (error) {
      console.error("Error processing image:", error);
      this.sendMessage(
        chatId,
        "Hubo un error desconocido al procesar la imagen."
      );
    }
  }

  // Called when a new Agent instance starts or wakes from hibernation
  async onStart() {
    console.log("Agent started with state:", this.state);
  }
}
