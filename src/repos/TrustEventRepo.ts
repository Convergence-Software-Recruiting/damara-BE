// src/repos/TrustEventRepo.ts

import TrustEventModel from "../models/TrustEvent";

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
};
