import { Server as SocketServer } from "socket.io";
import type { NotificationAttributes } from "../models/Notification";

let ioInstance: SocketServer | null = null;

export function getIO(): SocketServer | null {
  return ioInstance;
}

export function setIO(io: SocketServer): void {
  ioInstance = io;
}

export function getUserRoom(userId: string) {
  return `user:${userId}`;
}

export function emitNotificationToUser(
  userId: string,
  notification: NotificationAttributes
) {
  const io = getIO();
  if (!io) {
    return;
  }

  io.to(getUserRoom(userId)).emit("notification:new", notification);
}

export function emitNotificationReadToUser(
  userId: string,
  notification: NotificationAttributes
) {
  const io = getIO();
  if (!io) {
    return;
  }

  io.to(getUserRoom(userId)).emit("notification:read", notification);
}

export function emitAllNotificationsReadToUser(
  userId: string,
  payload: { userId: string; updatedCount: number }
) {
  const io = getIO();
  if (!io) {
    return;
  }

  io.to(getUserRoom(userId)).emit("notification:readAll", payload);
}
