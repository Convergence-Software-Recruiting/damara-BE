import HttpStatusCodes from "../common/constants/HttpStatusCodes";
import { RouteError } from "../common/util/route-errors";
import { UserRepo } from "../repos/UserRepo";
import { UserSettingsRepo } from "../repos/UserSettingsRepo";
import { UserSettingsCreationAttributes } from "../models/UserSettings";

type UserSettingsPatch = Partial<
  Omit<UserSettingsCreationAttributes, "id" | "userId">
>;

const PUBLIC_SETTING_KEYS = [
  "pushEnabled",
  "chatNotificationEnabled",
  "postNotificationEnabled",
  "marketingNotificationEnabled",
  "quietHoursEnabled",
  "quietHoursStart",
  "quietHoursEnd",
] as const;

function toPublicSettings(settings: Record<string, unknown>) {
  return Object.fromEntries(
    PUBLIC_SETTING_KEYS.map((key) => [key, settings[key]])
  );
}

function toSettingsRecord(settings: object) {
  return settings as unknown as Record<string, unknown>;
}

export const UserSettingsService = {
  async getSettings(userId: string) {
    const user = await UserRepo.findById(userId);
    if (!user) {
      throw new RouteError(HttpStatusCodes.NOT_FOUND, "USER_NOT_FOUND");
    }

    const settings =
      (await UserSettingsRepo.findByUserId(userId)) ||
      (await UserSettingsRepo.createDefault(userId));

    return toPublicSettings(toSettingsRecord(settings));
  },

  async updateSettings(userId: string, patch: UserSettingsPatch) {
    const user = await UserRepo.findById(userId);
    if (!user) {
      throw new RouteError(HttpStatusCodes.NOT_FOUND, "USER_NOT_FOUND");
    }

    const settings = await UserSettingsRepo.upsertByUserId(userId, patch);

    return toPublicSettings(toSettingsRecord(settings));
  },
};
