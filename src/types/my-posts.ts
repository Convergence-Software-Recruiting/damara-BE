import { ParticipantStatus } from "./participant-status";
import { PostListSort, PostListStatus } from "./post-list";

export const MY_POSTS_TABS = [
  "registered",
  "participated",
  "favorites",
] as const;

export type MyPostsTab = (typeof MY_POSTS_TABS)[number];

export type RegisteredMyPostsStatus =
  | "inProgress"
  | "deadlineSoon"
  | "completed"
  | PostListStatus;

export type FavoritesMyPostsStatus =
  | "deadlineSoon"
  | "recent"
  | PostListStatus;

export type MyPostsStatus =
  | RegisteredMyPostsStatus
  | FavoritesMyPostsStatus
  | ParticipantStatus;

export interface MyPostsListOptions {
  tab: MyPostsTab;
  limit: number;
  offset: number;
  keyword?: string | null;
  category?: string | null;
  status?: string | null;
  sort?: PostListSort;
  deadlineSoonHours: number;
  recentDays: number;
}
