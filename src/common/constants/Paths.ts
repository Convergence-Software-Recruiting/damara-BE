export default {
  Base: "/api",
  Users: {
    Base: "/users",
    Get: "/all",
    Add: "/add",
    Update: "/update",
    Delete: "/delete/:id",
  },
  Posts: {
    Base: "/posts",
  },
  Upload: {
    Base: "/upload",
  },
  Chat: {
    Base: "/chat",
  },
  Notifications: {
    Base: "/notifications",
  },
  NoShowReports: {
    Base: "/no-show-reports",
  },
} as const;
