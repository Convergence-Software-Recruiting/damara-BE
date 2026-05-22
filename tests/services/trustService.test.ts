import { describe, expect, it, vi } from "vitest";

const { userModel, trustEventRepo } = vi.hoisted(() => ({
  userModel: {
    findByPk: vi.fn(),
  },
  trustEventRepo: {
    findByUserId: vi.fn(),
    countByUserId: vi.fn(),
  },
}));

vi.mock("../../src/models/User", () => ({
  default: userModel,
}));

vi.mock("../../src/db", () => ({
  sequelize: {
    transaction: vi.fn(),
  },
}));

vi.mock("../../src/models/TrustEvent", () => ({
  default: {
    create: vi.fn(),
  },
}));

vi.mock("../../src/repos/TrustEventRepo", () => ({
  TrustEventRepo: trustEventRepo,
}));

import { TrustService } from "../../src/services/TrustService";

describe("TrustService", () => {
  it("신뢰 이벤트 목록에 페이지네이션 메타와 신뢰학점을 포함한다", async () => {
    userModel.findByPk.mockResolvedValueOnce({ id: "user-1" });
    trustEventRepo.findByUserId.mockResolvedValueOnce([
      {
        id: "event-1",
        userId: "user-1",
        type: "manual_adjustment",
        previousScore: 50,
        nextScore: 70,
      },
      {
        id: "event-2",
        userId: "user-1",
        type: "post_completed_author",
        previousScore: 70,
        nextScore: 80,
      },
    ]);
    trustEventRepo.countByUserId.mockResolvedValueOnce(5);

    await expect(
      TrustService.listEventsByUserId("user-1", 2, 2)
    ).resolves.toEqual({
      trustEvents: [
        {
          id: "event-1",
          userId: "user-1",
          type: "manual_adjustment",
          previousScore: 50,
          nextScore: 70,
          previousGrade: 3.5,
          nextGrade: 3.9,
        },
        {
          id: "event-2",
          userId: "user-1",
          type: "post_completed_author",
          previousScore: 70,
          nextScore: 80,
          previousGrade: 3.9,
          nextGrade: 4.1,
        },
      ],
      total: 5,
      limit: 2,
      offset: 2,
      hasNext: true,
    });

    expect(trustEventRepo.findByUserId).toHaveBeenCalledWith("user-1", 2, 2);
    expect(trustEventRepo.countByUserId).toHaveBeenCalledWith("user-1");
  });
});
