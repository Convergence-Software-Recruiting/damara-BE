import {
  DAMARA_PICKUP_ZONES,
  findDamaraPickupZoneById,
  PICKUP_ZONE_CAMPUSES,
  PickupZoneCampus,
} from "../types/pickup-zone";
import { RouteError } from "../common/util/route-errors";
import HttpStatusCodes from "../common/constants/HttpStatusCodes";

function normalizeCampus(campus?: string | null): PickupZoneCampus | undefined {
  if (!campus) {
    return undefined;
  }

  return PICKUP_ZONE_CAMPUSES.includes(campus as PickupZoneCampus)
    ? (campus as PickupZoneCampus)
    : undefined;
}

export const PickupZoneService = {
  listPickupZones(
    options: { campus?: string | null; keyword?: string | null } = {}
  ) {
    const campus = normalizeCampus(options.campus);
    const keyword = options.keyword?.trim().toLowerCase();

    return DAMARA_PICKUP_ZONES.filter((zone) => zone.isActive)
      .filter((zone) => !campus || zone.campus === campus)
      .filter((zone) => {
        if (!keyword) {
          return true;
        }

        const searchableText = [
          zone.id,
          zone.name,
          zone.campusLabel,
          zone.building,
          zone.floor,
          zone.detailLocation,
          zone.displayName,
          zone.description,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return searchableText.includes(keyword);
      })
      .sort((a, b) => a.sortOrder - b.sortOrder);
  },

  getPickupZoneById(id: string) {
    const zone = findDamaraPickupZoneById(id);
    if (!zone || !zone.isActive) {
      throw new RouteError(
        HttpStatusCodes.NOT_FOUND,
        "다마라존을 찾을 수 없습니다.",
        "PICKUP_ZONE_NOT_FOUND"
      );
    }

    return zone;
  },
};
