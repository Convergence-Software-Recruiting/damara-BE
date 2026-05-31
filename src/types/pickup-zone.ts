export const PICKUP_TYPES = ["custom", "damara_zone"] as const;

export type PickupType = (typeof PICKUP_TYPES)[number];

export const PICKUP_TYPE_LABELS: Record<PickupType, string> = {
  custom: "직접 입력",
  damara_zone: "다마라존",
};

export const PICKUP_ZONE_CAMPUSES = ["humanities", "natural", "shared"] as const;

export type PickupZoneCampus = (typeof PICKUP_ZONE_CAMPUSES)[number];

export type PickupZone = {
  id: string;
  name: string;
  campus: PickupZoneCampus;
  campusLabel: string;
  building: string | null;
  floor: string | null;
  detailLocation: string;
  displayName: string;
  description: string;
  isActive: boolean;
  sortOrder: number;
};

export const DAMARA_PICKUP_ZONES: PickupZone[] = [
  {
    id: "s2810",
    name: "S2810",
    campus: "natural",
    campusLabel: "자연캠퍼스",
    building: "S동",
    floor: "2층",
    detailLocation: "S2810",
    displayName: "자연캠퍼스 S2810",
    description: "자연캠퍼스 S동 2층 S2810 앞 공식 접선지",
    isActive: true,
    sortOrder: 10,
  },
  {
    id: "humanities-student-hall-3f-cafe",
    name: "학관 3층 카페앞",
    campus: "humanities",
    campusLabel: "인문캠퍼스",
    building: "학생회관",
    floor: "3층",
    detailLocation: "카페 앞",
    displayName: "인문캠퍼스 학생회관 3층 카페앞",
    description: "인문캠퍼스 학생회관 3층 카페 앞 공식 접선지",
    isActive: true,
    sortOrder: 20,
  },
  {
    id: "humanities-student-hall-front",
    name: "학생회관 앞",
    campus: "humanities",
    campusLabel: "인문캠퍼스",
    building: "학생회관",
    floor: null,
    detailLocation: "건물 앞",
    displayName: "인문캠퍼스 학생회관 앞",
    description: "인문캠퍼스 학생회관 건물 앞 공식 접선지",
    isActive: true,
    sortOrder: 30,
  },
  {
    id: "dormitory-lobby",
    name: "기숙사 로비",
    campus: "shared",
    campusLabel: "공통",
    building: "기숙사",
    floor: "1층",
    detailLocation: "로비",
    displayName: "명지대 기숙사 로비",
    description: "기숙사 1층 로비 공식 접선지",
    isActive: true,
    sortOrder: 40,
  },
];

export function findDamaraPickupZoneById(id?: string | null) {
  if (!id) {
    return null;
  }

  return DAMARA_PICKUP_ZONES.find((zone) => zone.id === id) ?? null;
}
