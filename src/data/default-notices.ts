import { NoticeCreationAttributes } from "../models/Notice";

type DefaultNotice = NoticeCreationAttributes & {
  category: string;
};

export const DEFAULT_SERVICE_NOTICES: DefaultNotice[] = [
  {
    title: "DAMARA 베타 서비스 오픈 안내",
    summary: "서비스 안내",
    category: "서비스 안내",
    content:
      "안녕하세요, DAMARA 운영팀입니다. DAMARA는 명지대학교 학생들이 필요한 물품을 함께 구매하고 나눌 수 있도록 만든 캠퍼스 기반 공동구매 서비스입니다. 현재는 베타 서비스로 운영 중이며, 이용 중 불편한 점이나 개선 의견은 언제든 운영팀에 전달해주세요.",
    type: "service",
    isPinned: true,
    createdAt: new Date("2026-05-20T09:00:00.000+09:00"),
    updatedAt: new Date("2026-05-20T09:00:00.000+09:00"),
  },
  {
    title: "공동구매 참여 전 꼭 확인해주세요",
    summary: "이용 안내",
    category: "이용 안내",
    content:
      "공동구매에 참여하기 전 상품명, 가격, 모집 인원, 마감일, 수령 장소를 반드시 확인해주세요. 모집자와 참여자 간의 원활한 거래를 위해 약속 시간과 장소를 사전에 충분히 조율하는 것을 권장합니다.",
    type: "service",
    isPinned: true,
    createdAt: new Date("2026-05-21T10:30:00.000+09:00"),
    updatedAt: new Date("2026-05-21T10:30:00.000+09:00"),
  },
  {
    title: "공구 등록 시 상품 정보를 자세히 작성해주세요",
    summary: "등록 안내",
    category: "등록 안내",
    content:
      "공동구매를 등록할 때는 상품명, 상품 이미지, 가격, 모집 인원, 마감일, 수령 장소, 상세 설명을 최대한 정확하게 작성해주세요. 정보가 자세할수록 참여자가 안심하고 공동구매에 참여할 수 있습니다.",
    type: "service",
    isPinned: false,
    createdAt: new Date("2026-05-23T14:00:00.000+09:00"),
    updatedAt: new Date("2026-05-23T14:00:00.000+09:00"),
  },
  {
    title: "안전한 거래를 위해 교내 공공장소 이용을 권장합니다",
    summary: "안전 안내",
    category: "안전 안내",
    content:
      "DAMARA는 명지대학교 학생 간 공동구매를 돕는 서비스입니다. 물품 수령은 정문, 학생회관, 도서관 앞 등 사람이 많은 교내 공공장소에서 진행하는 것을 권장합니다. 늦은 시간이나 외부 장소에서의 거래는 가급적 피해주세요.",
    type: "policy",
    isPinned: false,
    createdAt: new Date("2026-05-24T11:00:00.000+09:00"),
    updatedAt: new Date("2026-05-24T11:00:00.000+09:00"),
  },
  {
    title: "모집 인원과 마감일을 확인해주세요",
    summary: "이용 안내",
    category: "이용 안내",
    content:
      "각 공동구매는 목표 모집 인원과 마감일을 기준으로 진행됩니다. 참여 전 현재 참여 인원과 모집 상태를 확인해주세요. 마감이 임박한 공동구매는 모집 상황에 따라 조기 종료될 수 있습니다.",
    type: "service",
    isPinned: false,
    createdAt: new Date("2026-05-26T09:40:00.000+09:00"),
    updatedAt: new Date("2026-05-26T09:40:00.000+09:00"),
  },
  {
    title: "찜, 채팅, 내 공구 기능을 활용해보세요",
    summary: "기능 안내",
    category: "기능 안내",
    content:
      "관심 있는 공동구매는 찜 버튼으로 저장할 수 있습니다. 참여한 공동구매는 내 공구 화면에서 확인할 수 있으며, 거래 관련 세부 내용은 채팅을 통해 조율할 수 있습니다.",
    type: "service",
    isPinned: false,
    createdAt: new Date("2026-05-28T16:20:00.000+09:00"),
    updatedAt: new Date("2026-05-28T16:20:00.000+09:00"),
  },
  {
    title: "부적절한 게시글은 운영 기준에 따라 제한될 수 있습니다",
    summary: "운영 정책",
    category: "운영 정책",
    content:
      "허위 상품, 과도한 가격 책정, 거래와 무관한 게시글, 불쾌감을 주는 내용은 운영 기준에 따라 숨김 또는 삭제될 수 있습니다. 모든 사용자가 안전하게 이용할 수 있도록 기본적인 거래 매너를 지켜주세요.",
    type: "policy",
    isPinned: false,
    createdAt: new Date("2026-05-30T13:10:00.000+09:00"),
    updatedAt: new Date("2026-05-30T13:10:00.000+09:00"),
  },
  {
    title: "DAMARA는 더 나은 서비스를 위해 개선 중입니다",
    summary: "서비스 안내",
    category: "서비스 안내",
    content:
      "현재 DAMARA는 초기 버전으로 운영되고 있으며, 사용자 피드백을 바탕으로 기능과 사용성을 계속 개선하고 있습니다. 앞으로 알림, 검색, 필터, 신뢰도 기능 등을 점진적으로 고도화할 예정입니다.",
    type: "service",
    isPinned: false,
    createdAt: new Date("2026-06-01T09:00:00.000+09:00"),
    updatedAt: new Date("2026-06-01T09:00:00.000+09:00"),
  },
];
