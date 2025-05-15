import { z } from "zod";
import { zValidator } from "@hono/zod-validator";

const PhotoSchema = z.object({
    file_id: z.string(),
    file_unique_id: z.string(),
    width: z.number(),
    height: z.number(),
    file_size: z.number(),
});

const FromSchema = z.object({
    id: z.number(),
    is_bot: z.boolean(),
    first_name: z.string(),
    last_name: z.string(),
    username: z.string(),
    language_code: z.string(),
});

const ChatSchema = z.object({
    id: z.number(),
    title: z.string(),
    username: z.string(),
    first_name: z.string(),
    last_name: z.string(),
});

const MessageSchema = z.object({
    message_id: z.number(),
    from: FromSchema,
    chat: ChatSchema,
    text: z.string(),
    date: z.number(),
    caption: z.string(),
    photo: z.array(PhotoSchema),
});

const UpdateSchema = z.object({
    update_id: z.number(),
    message: MessageSchema,
});

export type IncomingMessage = z.infer<typeof UpdateSchema>;

export const telegramValidator = zValidator("query", UpdateSchema);