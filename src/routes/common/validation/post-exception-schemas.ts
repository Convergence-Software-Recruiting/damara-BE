import z from "zod";
import {
  POST_EXCEPTION_SEVERITIES,
  POST_EXCEPTION_STATUSES,
  POST_EXCEPTION_TYPES,
} from "../../../types/post-exception";

const metadataSchema = z
  .record(z.string(), z.unknown())
  .optional()
  .nullable();

export const createPostExceptionSchema = z.object({
  exception: z.object({
    reporterId: z.string().uuid().optional(),
    type: z.enum(POST_EXCEPTION_TYPES),
    reason: z.string().trim().min(1).max(2000),
    displayTitle: z.string().trim().min(1).max(200).optional(),
    displayMessage: z.string().trim().min(1).max(500).optional(),
    severity: z.enum(POST_EXCEPTION_SEVERITIES).optional(),
    oldPrice: z.number().nonnegative().optional().nullable(),
    newPrice: z.number().nonnegative().optional().nullable(),
    affectedQuantity: z.number().int().positive().optional().nullable(),
    metadata: metadataSchema,
  }),
});

export const updatePostExceptionStatusSchema = z.object({
  status: z.enum(POST_EXCEPTION_STATUSES),
  actorUserId: z.string().uuid().optional(),
  resolutionNote: z.string().trim().max(2000).optional().nullable(),
});

export type CreatePostExceptionReq = z.infer<
  typeof createPostExceptionSchema
>;
export type UpdatePostExceptionStatusReq = z.infer<
  typeof updatePostExceptionStatusSchema
>;
