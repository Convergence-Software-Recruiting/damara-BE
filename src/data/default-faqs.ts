import { FaqCreationAttributes } from "../models/Faq";

export const DEFAULT_FAQS: FaqCreationAttributes[] = [
  {
    category: "trade",
    question: "공동구매는 어떻게 참여하나요?",
    answer:
      "원하는 공동구매 상세 화면에서 상품명, 가격, 모집 인원, 마감일, 수령 장소를 확인한 뒤 참여하기 버튼을 누르면 참여할 수 있습니다. 참여 후에는 내 공구 화면과 채팅에서 진행 상황을 확인할 수 있습니다.",
    order: 1,
    isActive: true,
    createdAt: new Date("2026-05-20T09:00:00.000+09:00"),
    updatedAt: new Date("2026-05-20T09:00:00.000+09:00"),
  },
  {
    category: "trade",
    question: "공동구매를 직접 등록하려면 무엇을 적어야 하나요?",
    answer:
      "상품명, 상품 이미지, 가격, 모집 인원, 마감일, 수령 장소, 상세 설명을 최대한 정확하게 입력해 주세요. 정보가 자세할수록 참여자가 안심하고 공구에 참여할 수 있습니다.",
    order: 2,
    isActive: true,
    createdAt: new Date("2026-05-21T10:00:00.000+09:00"),
    updatedAt: new Date("2026-05-21T10:00:00.000+09:00"),
  },
  {
    category: "trade",
    question: "모집 중인 공구와 마감된 공구는 어떻게 구분하나요?",
    answer:
      "게시글 상태값으로 모집 중, 진행 중, 완료, 취소 상태를 구분합니다. 프론트 화면에서는 공구 카드와 상세 화면에서 현재 상태를 표시하면 됩니다.",
    order: 3,
    isActive: true,
    createdAt: new Date("2026-05-22T11:30:00.000+09:00"),
    updatedAt: new Date("2026-05-22T11:30:00.000+09:00"),
  },
  {
    category: "account",
    question: "DAMARA는 어떤 사용자 정보를 사용하나요?",
    answer:
      "DAMARA는 명지대학교 학생 간 안전한 공동구매를 위해 이메일, 닉네임, 학번, 학과, 프로필 이미지, 신뢰 등급 정보를 사용합니다. 비밀번호는 서버에서 해시 처리되어 저장됩니다.",
    order: 1,
    isActive: true,
    createdAt: new Date("2026-05-23T09:20:00.000+09:00"),
    updatedAt: new Date("2026-05-23T09:20:00.000+09:00"),
  },
  {
    category: "account",
    question: "프로필 이미지는 어떻게 변경하나요?",
    answer:
      "마이페이지에서 프로필 이미지를 업로드하거나 이미지 URL을 수정할 수 있습니다. 업로드한 이미지는 사용자 정보의 avatarUrl로 저장되어 게시글, 채팅, 참여자 목록에 함께 표시됩니다.",
    order: 2,
    isActive: true,
    createdAt: new Date("2026-05-24T13:00:00.000+09:00"),
    updatedAt: new Date("2026-05-24T13:00:00.000+09:00"),
  },
  {
    category: "payment",
    question: "입금이나 정산은 DAMARA에서 직접 처리하나요?",
    answer:
      "현재 DAMARA는 공동구매 모집과 참여, 채팅, 알림을 돕는 서비스이며 결제 대행을 직접 처리하지 않습니다. 금액, 입금 방식, 정산 시점은 모집자와 참여자가 채팅으로 명확히 합의해 주세요.",
    order: 1,
    isActive: true,
    createdAt: new Date("2026-05-25T15:40:00.000+09:00"),
    updatedAt: new Date("2026-05-25T15:40:00.000+09:00"),
  },
  {
    category: "payment",
    question: "가격이 바뀌면 어떻게 해야 하나요?",
    answer:
      "모집 당시 가격과 실제 구매 시점의 가격이 달라질 수 있습니다. 가격 변경, 할인 종료, 품절 같은 예외 상황은 참여자에게 안내하고 재승인 또는 취소 기준을 명확히 정하는 것을 권장합니다.",
    order: 2,
    isActive: true,
    createdAt: new Date("2026-05-26T10:10:00.000+09:00"),
    updatedAt: new Date("2026-05-26T10:10:00.000+09:00"),
  },
  {
    category: "pickup",
    question: "물품 수령 장소는 어떻게 정하나요?",
    answer:
      "공구 등록 시 직접 장소를 입력하거나 다마라존을 선택할 수 있습니다. 다마라존은 S2810, 학생회관 앞, 기숙사 로비처럼 교내에서 만나기 쉬운 공식 접선지입니다.",
    order: 1,
    isActive: true,
    createdAt: new Date("2026-05-27T12:00:00.000+09:00"),
    updatedAt: new Date("2026-05-27T12:00:00.000+09:00"),
  },
  {
    category: "pickup",
    question: "늦은 시간이나 교외 장소에서 거래해도 되나요?",
    answer:
      "안전한 거래를 위해 사람이 많은 교내 공공장소 이용을 권장합니다. 늦은 시간이나 외부 장소에서의 거래는 가급적 피하고, 약속 시간과 장소는 채팅으로 미리 확인해 주세요.",
    order: 2,
    isActive: true,
    createdAt: new Date("2026-05-28T16:00:00.000+09:00"),
    updatedAt: new Date("2026-05-28T16:00:00.000+09:00"),
  },
  {
    category: "etc",
    question: "부적절한 게시글이나 거래 문제는 어떻게 처리하나요?",
    answer:
      "허위 상품, 과도한 가격 책정, 거래와 무관한 게시글, 불쾌감을 주는 내용은 운영 기준에 따라 제한될 수 있습니다. 문제가 생기면 게시글 정보와 채팅 내용을 바탕으로 운영팀에 문의해 주세요.",
    order: 1,
    isActive: true,
    createdAt: new Date("2026-05-29T14:30:00.000+09:00"),
    updatedAt: new Date("2026-05-29T14:30:00.000+09:00"),
  },
  {
    category: "etc",
    question: "알림은 어떤 상황에서 오나요?",
    answer:
      "채팅 메시지, 공동구매 참여, 주요 진행 상황처럼 사용자가 확인해야 하는 이벤트가 생기면 알림이 생성됩니다. 마이페이지 설정에서 알림 수신 여부와 방해금지 시간을 조정할 수 있습니다.",
    order: 2,
    isActive: true,
    createdAt: new Date("2026-06-01T09:00:00.000+09:00"),
    updatedAt: new Date("2026-06-01T09:00:00.000+09:00"),
  },
];
