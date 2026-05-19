import UserSettingsModel, {
  UserSettingsCreationAttributes,
} from "../models/UserSettings";

export const UserSettingsRepo = {
  async findByUserId(userId: string) {
    const settings = await UserSettingsModel.findOne({
      where: { userId },
    });

    return settings ? settings.get() : null;
  },

  async createDefault(userId: string) {
    const settings = await UserSettingsModel.create({ userId });
    return settings.get();
  },

  async upsertByUserId(
    userId: string,
    patch: Partial<Omit<UserSettingsCreationAttributes, "id" | "userId">>
  ) {
    const settings = await UserSettingsModel.findOne({
      where: { userId },
    });

    if (!settings) {
      const created = await UserSettingsModel.create({
        userId,
        ...patch,
      });
      return created.get();
    }

    await settings.update(patch);
    return settings.get();
  },
};
