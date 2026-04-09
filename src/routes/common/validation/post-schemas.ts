import z from "zod";

const shoppingStageEnum = z.enum(["pre_shopping", "post_shopping"]);
const tradeIntentEnum = z.enum(["purchase", "sale"]);
const postTypeEnum = z.enum([
  "group_buy",
  "shopping_mate",
  "proxy_buy_request",
  "split_share",
  "leftover_sale",
  "sealed_transfer",
]);
const itemCategoryEnum = z.enum([
  "food",
  "daily",
  "beauty",
  "electronics",
  "school",
  "freemarket",
]);

/**
 * 공동구매 상품 생성 요청 스키마
 */
export const createPostSchema = z.object({
  post: z.object({
    authorId: z.string().uuid(),
    title: z.string().min(1).max(200),
    content: z.string().min(1),
    price: z.number().positive(),
    minParticipants: z.number().int().positive(),
    deadline: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: "Invalid datetime format",
    }),
    pickupLocation: z.string().max(200),
    images: z.array(z.string().min(1)).optional(),
    category: itemCategoryEnum.optional().nullable(),
    shoppingStage: shoppingStageEnum.optional().nullable(),
    tradeIntent: tradeIntentEnum.optional().nullable(),
    postType: postTypeEnum.optional().nullable(),
  }),
});

export type CreatePostReq = z.infer<typeof createPostSchema>;

/**
 * 공동구매 상품 수정 요청 스키마
 */
export const updatePostSchema = z.object({
  post: z.object({
    title: z.string().min(1).max(200).optional(),
    content: z.string().min(1).optional(),
    price: z.number().positive().optional(),
    minParticipants: z.number().int().positive().optional(),
    status: z.enum(["open", "closed", "in_progress", "completed", "cancelled"]).optional(),
    deadline: z
      .string()
      .refine((val) => !val || !isNaN(Date.parse(val)), {
        message: "Invalid datetime format",
      })
      .optional(),
    pickupLocation: z.string().max(200).optional(),
    images: z.array(z.string().min(1)).optional(),
    category: itemCategoryEnum.optional().nullable(),
    shoppingStage: shoppingStageEnum.optional().nullable(),
    tradeIntent: tradeIntentEnum.optional().nullable(),
    postType: postTypeEnum.optional().nullable(),
  }),
});

export type UpdatePostReq = z.infer<typeof updatePostSchema>;
