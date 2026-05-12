import { Router } from "express";

import Paths from "../common/constants/Paths";
import userRouter from "./users/UserRoutes";
import postRouter from "./posts/PostRoutes";
import uploadRouter from "./upload/UploadRoutes";
import chatRouter from "./chat/ChatRoutes";
import notificationRouter from "./notifications/NotificationRoutes";
import noShowReportRouter from "./no-show-reports/NoShowReportRoutes";

const BaseRouter = Router();

// User 라우터: /api/users
BaseRouter.use(Paths.Users.Base, userRouter);

// Post 라우터: /api/posts
BaseRouter.use(Paths.Posts.Base, postRouter);

// Upload 라우터: /api/upload
BaseRouter.use(Paths.Upload.Base, uploadRouter);

// Chat 라우터: /api/chat
BaseRouter.use(Paths.Chat.Base, chatRouter);

// Notification 라우터: /api/notifications
BaseRouter.use(Paths.Notifications.Base, notificationRouter);

// NoShowReport 라우터: /api/no-show-reports
BaseRouter.use(Paths.NoShowReports.Base, noShowReportRouter);

export default BaseRouter;
