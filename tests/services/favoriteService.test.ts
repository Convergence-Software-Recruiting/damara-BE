import { describe, expect, it, vi } from "vitest";

const { favoriteRepo } = vi.hoisted(() => ({
  favoriteRepo: {
    isFavorite: vi.fn(),
    countByPostId: vi.fn(),
  },
}));

vi.mock("../../src/repos/FavoriteRepo", () => ({
  FavoriteRepo: favoriteRepo,
}));

import { FavoriteService } from "../../src/services/FavoriteService";

describe("FavoriteService", () => {
  it("관심 여부와 현재 관심 수를 함께 반환한다", async () => {
    favoriteRepo.isFavorite.mockResolvedValueOnce(true);
    favoriteRepo.countByPostId.mockResolvedValueOnce(13);

    await expect(
      FavoriteService.getFavoriteState("post-1", "user-1")
    ).resolves.toEqual({
      isFavorite: true,
      favoriteCount: 13,
    });

    expect(favoriteRepo.isFavorite).toHaveBeenCalledWith("post-1", "user-1");
    expect(favoriteRepo.countByPostId).toHaveBeenCalledWith("post-1");
  });
});
