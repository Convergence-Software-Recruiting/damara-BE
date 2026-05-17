import { PostAttributes } from "../models/Post";

export type PostListSort = "latest" | "deadline" | "popular";
export type PostListStatus = PostAttributes["status"];

export interface PostListOptions {
  limit?: number;
  offset?: number;
  authorId?: string | null;
  category?: string | null;
  status?: PostListStatus | null;
  statuses?: PostListStatus[] | null;
  deadlineFrom?: Date | null;
  deadlineTo?: Date | null;
  keyword?: string | null;
  sort?: PostListSort;
  userId?: string | null;
}
