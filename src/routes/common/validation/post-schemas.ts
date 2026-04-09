import z from "zod";

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
    }), // ISO 8601 형식 검증
    pickupLocation: z.string().max(200),
    images: z.array(z.string().min(1)).optional(), // 이미지 URL 배열 (상대 경로 또는 절대 URL 모두 허용)
    category: z
      .enum(["food", "daily", "beauty", "electronics", "school", "freemarket"])
      .optional()
      .nullable(), // 카테고리 필드 추가
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
    images: z.array(z.string().min(1)).optional(), // 이미지 URL 배열 (상대 경로 또는 절대 URL 모두 허용)
    category: z
      .enum(["food", "daily", "beauty", "electronics", "school", "freemarket"])
      .optional()
      .nullable(), // 카테고리 필드 추가
  }),
});

export type UpdatePostReq = z.infer<typeof updatePostSchema>;
