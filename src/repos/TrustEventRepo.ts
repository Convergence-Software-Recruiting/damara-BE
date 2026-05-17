// src/repos/TrustEventRepo.ts

import TrustEventModel, { TrustEventType } from "../models/TrustEvent";
import { Op } from "sequelize";

export const TrustEventRepo = {
  async findByUserId(userId: string, limit = 20, offset = 0) {
    const events = await TrustEventModel.findAll({
      where: { userId },
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    });

    return events.map((event) => event.get());
  },

  async countByUserId(userId: string) {
    return await TrustEventModel.count({
      where: { userId },
    });
  },

  async countByUserIdAndTypes(userId: string, types: TrustEventType[]) {
    return await TrustEventModel.count({
      where: {
        userId,
        type: {
          [Op.in]: types,
        },
      },
    });
  },
};
