import { PostAttributes } from "../models/Post";

export type PostListSort = "latest" | "deadline" | "popular";
export type PostListStatus = PostAttributes["status"];

export interface PostListOptions {
  limit?: number;
  offset?: number;
  category?: string | null;
  status?: PostListStatus | null;
  keyword?: string | null;
  sort?: PostListSort;
  userId?: string | null;
}
