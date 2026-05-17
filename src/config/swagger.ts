import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { Express, Request, Response, NextFunction } from "express";
import ENV from "../common/constants/ENV";
import { PARTICIPANT_STATUSES } from "../types/participant-status";

// 환경 변수에서 API 베이스 URL 가져오기 (배포 환경에서 설정)
const getServerUrl = () => {
  return ENV.ApiBaseUrl;
};

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Thomas Anderson API",
      version: "1.0.0",
      description:
        "공동구매 플랫폼 API 문서. TypeScript + Express + Sequelize + MySQL로 구현되었습니다.",
      contact: {
        name: "최원빈",
        "x-student-id": "60203042",
      },
    },
    servers: [
      {
        url: getServerUrl(),
        description:
          ENV.NodeEnv === "production"
            ? "Production server"
            : "Development server",
      },
    ],
    tags: [
      {
        name: "Posts",
        description: "공동구매 게시글 API",
      },
      {
        name: "Users",
        description: "사용자 API",
      },
      {
        name: "Upload",
        description: "이미지 업로드 API",
      },
      {
        name: "Chat",
        description: "채팅 API",
      },
      {
        name: "Notifications",
        description: "알림 API",
      },
    ],
    components: {
      schemas: {
        User: {
          type: "object",
          required: [
            "id",
            "email",
            "nickname",
            "studentId",
            "trustScore",
            "trustGrade",
          ],
          properties: {
            id: {
              type: "string",
              format: "uuid",
              description: "사용자 UUID",
              example: "123e4567-e89b-12d3-a456-426614174000",
            },
            email: {
              type: "string",
              format: "email",
              description: "이메일 주소",
              example: "test@mju.ac.kr",
            },
            nickname: {
              type: "string",
              description: "닉네임",
              example: "홍길동",
            },
            studentId: {
              type: "string",
              description: "학번",
              example: "20241234",
            },
            department: {
              type: "string",
              nullable: true,
              description: "학과/부서",
              example: "컴퓨터공학과",
            },
            avatarUrl: {
              type: "string",
              format: "uri",
              nullable: true,
              description: "프로필 이미지 URL",
              example: "https://example.com/avatar.jpg",
            },
            trustScore: {
              type: "integer",
              description: "내부 신뢰점수 (0~100, 기본값: 50)",
              minimum: 0,
              maximum: 100,
              example: 50,
            },
            trustGrade: {
              type: "number",
              format: "float",
              description:
                "사용자에게 표시하는 신뢰학점 (2.5~4.5, 기본값: 3.5)",
              minimum: 2.5,
              maximum: 4.5,
              example: 3.5,
            },
            createdAt: {
              type: "string",
              format: "date-time",
              description: "생성일시",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
              description: "수정일시",
            },
          },
        },
        TrustEvent: {
          type: "object",
          required: [
            "id",
            "userId",
            "type",
            "scoreChange",
            "previousScore",
            "nextScore",
            "previousGrade",
            "nextGrade",
          ],
          properties: {
            id: {
              type: "string",
              format: "uuid",
              description: "신뢰 이벤트 UUID",
              example: "123e4567-e89b-12d3-a456-426614174000",
            },
            userId: {
              type: "string",
              format: "uuid",
              description: "점수가 변경된 사용자 UUID",
              example: "a87522bd-bc79-47b0-a73f-46ea4068a158",
            },
            postId: {
              type: "string",
              format: "uuid",
              nullable: true,
              description: "점수 변경과 관련된 게시글 UUID",
              example: "123e4567-e89b-12d3-a456-426614174000",
            },
            actorUserId: {
              type: "string",
              format: "uuid",
              nullable: true,
              description: "점수 변경을 유발한 사용자 UUID",
              example: "a87522bd-bc79-47b0-a73f-46ea4068a158",
            },
            type: {
              type: "string",
              enum: [
                "post_completed_author",
                "post_completed_participant",
                "post_cancelled_by_author",
                "post_deleted_by_author",
                "participant_cancelled",
                "participant_no_show",
                "agreement_confirmed",
                "manual_adjustment",
              ],
              description: "신뢰 이벤트 타입",
              example: "post_completed_author",
            },
            scoreChange: {
              type: "integer",
              description: "내부 신뢰점수 변화량",
              example: 10,
            },
            previousScore: {
              type: "integer",
              description: "변경 전 내부 신뢰점수",
              minimum: 0,
              maximum: 100,
              example: 50,
            },
            nextScore: {
              type: "integer",
              description: "변경 후 내부 신뢰점수",
              minimum: 0,
              maximum: 100,
              example: 60,
            },
            previousGrade: {
              type: "number",
              format: "float",
              description: "변경 전 표시 신뢰학점",
              minimum: 2.5,
              maximum: 4.5,
              example: 3.5,
            },
            nextGrade: {
              type: "number",
              format: "float",
              description: "변경 후 표시 신뢰학점",
              minimum: 2.5,
              maximum: 4.5,
              example: 3.7,
            },
            reason: {
              type: "string",
              nullable: true,
              description: "점수 변경 사유",
              example: "공동구매 거래 완료: 작성자 보상",
            },
            metadata: {
              type: "object",
              nullable: true,
              description: "이벤트별 추가 데이터",
              additionalProperties: true,
            },
            createdAt: {
              type: "string",
              format: "date-time",
              description: "생성일시",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
              description: "수정일시",
            },
          },
        },
        PostImage: {
          type: "object",
          required: ["id", "imageUrl", "sortOrder"],
          properties: {
            id: {
              type: "string",
              format: "uuid",
              description: "이미지 UUID",
              example: "b6d2592a-667d-474c-8bf5-12005528876e",
            },
            imageUrl: {
              type: "string",
              description: "이미지 URL",
              example: "https://example.com/image.jpg",
            },
            sortOrder: {
              type: "integer",
              description: "이미지 정렬 순서",
              example: 0,
            },
          },
        },
        Post: {
          type: "object",
          required: [
            "id",
            "authorId",
            "title",
            "content",
            "price",
            "minParticipants",
            "deadline",
          ],
          properties: {
            id: {
              type: "string",
              format: "uuid",
              description: "게시글 UUID",
              example: "123e4567-e89b-12d3-a456-426614174000",
            },
            authorId: {
              type: "string",
              format: "uuid",
              description: "작성자 UUID",
              example: "a87522bd-bc79-47b0-a73f-46ea4068a158",
            },
            title: {
              type: "string",
              description: "상품명",
              example: "맛있는 치킨 공동구매",
            },
            content: {
              type: "string",
              description: "상품 설명",
              example:
                "BBQ 황금올리브치킨 2마리 세트를 함께 주문하실 분 구합니다!",
            },
            price: {
              type: "number",
              description: "가격",
              example: 25000,
            },
            minParticipants: {
              type: "integer",
              description: "최소 참여 인원",
              example: 2,
            },
            currentQuantity: {
              type: "integer",
              description: "현재 참여 인원",
              example: 0,
            },
            status: {
              type: "string",
              enum: ["open", "closed", "in_progress", "completed", "cancelled"],
              description: "상품 상태 (open: 모집중, closed: 모집완료, in_progress: 진행중, completed: 거래완료, cancelled: 취소됨)",
              example: "open",
            },
            deadline: {
              type: "string",
              format: "date-time",
              description: "마감 시간",
              example: "2025-11-27T23:59:59.000Z",
            },
            pickupLocation: {
              type: "string",
              nullable: true,
              description: "픽업 장소",
              example: "명지대학교 정문",
            },
            category: {
              type: "string",
              nullable: true,
              enum: ["food", "daily", "beauty", "electronics", "school", "freemarket"],
              description: "카테고리 ID (food: 먹거리, daily: 일상용품, beauty: 뷰티·패션, electronics: 전자기기, school: 학용품, freemarket: 프리마켓)",
              example: "food",
            },
            images: {
              type: "array",
              items: {
                $ref: "#/components/schemas/PostImage",
              },
              description: "이미지 URL 객체 배열",
            },
            thumbnailUrl: {
              type: "string",
              nullable: true,
              description: "대표 썸네일 URL. 첫 번째 이미지가 없으면 null입니다.",
              example: "https://example.com/image.jpg",
            },
            favoriteCount: {
              type: "integer",
              description: "관심 등록 수",
              example: 12,
            },
            isFavorite: {
              type: "boolean",
              description: "현재 사용자의 관심 등록 여부 (로그인한 사용자 기준)",
              example: true,
            },
            isParticipant: {
              type: "boolean",
              description: "현재 사용자의 참여 여부",
              example: false,
            },
            isOwner: {
              type: "boolean",
              description: "현재 사용자가 작성자인지 여부",
              example: false,
            },
            deadlineStatus: {
              type: "string",
              enum: ["open", "closingSoon", "closed"],
              description: "서버 시간 기준 마감 상태",
              example: "closingSoon",
            },
            deadlineLabel: {
              type: "string",
              description: "프론트 표시용 마감 라벨",
              example: "오늘 마감",
            },
            remainingSeconds: {
              type: "integer",
              description: "마감까지 남은 초. 이미 지난 경우 0입니다.",
              example: 3600,
            },
            createdAt: {
              type: "string",
              format: "date-time",
              description: "생성일시",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
              description: "수정일시",
            },
          },
        },
        PostListResponse: {
          type: "object",
          required: ["items", "total", "limit", "offset", "hasNext"],
          properties: {
            items: {
              type: "array",
              items: {
                $ref: "#/components/schemas/Post",
              },
            },
            total: {
              type: "integer",
              description: "필터 조건에 맞는 전체 게시글 수",
              example: 42,
            },
            limit: {
              type: "integer",
              example: 20,
            },
            offset: {
              type: "integer",
              example: 0,
            },
            hasNext: {
              type: "boolean",
              description: "다음 페이지 존재 여부",
              example: true,
            },
          },
        },
        PostParticipationResult: {
          type: "object",
          required: ["isParticipant", "post"],
          properties: {
            isParticipant: {
              type: "boolean",
              description: "요청 후 현재 사용자의 참여 여부",
              example: true,
            },
            post: {
              type: "object",
              required: ["id", "currentQuantity", "minParticipants", "status"],
              properties: {
                id: {
                  type: "string",
                  format: "uuid",
                },
                currentQuantity: {
                  type: "integer",
                  example: 2,
                },
                minParticipants: {
                  type: "integer",
                  example: 3,
                },
                status: {
                  type: "string",
                  enum: [
                    "open",
                    "closed",
                    "in_progress",
                    "completed",
                    "cancelled",
                  ],
                  example: "open",
                },
              },
            },
          },
        },
        ParticipantStatus: {
          type: "string",
          enum: PARTICIPANT_STATUSES,
          description:
            "참여자별 진행 상태 (participating=참여중, payment_pending=입금대기, pickup_ready=수령예정, received=수령완료)",
          example: "participating",
        },
        PublicUserProfile: {
          type: "object",
          required: ["id", "nickname", "studentId", "trustGrade"],
          description:
            "게시글 상세 화면에 노출하는 사용자 공개 프로필. passwordHash, email, trustScore는 포함하지 않습니다.",
          properties: {
            id: {
              type: "string",
              format: "uuid",
              description: "사용자 UUID",
              example: "a87522bd-bc79-47b0-a73f-46ea4068a158",
            },
            nickname: {
              type: "string",
              description: "닉네임",
              example: "다마라 공식",
            },
            studentId: {
              type: "string",
              description: "학번",
              example: "20241234",
            },
            department: {
              type: "string",
              nullable: true,
              description: "학과/부서",
              example: "생활용품 판매자",
            },
            avatarUrl: {
              type: "string",
              format: "uri",
              nullable: true,
              description: "프로필 이미지 URL",
              example: "https://example.com/avatar.jpg",
            },
            trustGrade: {
              type: "number",
              format: "float",
              description: "사용자에게 표시하는 신뢰학점",
              minimum: 2.5,
              maximum: 4.5,
              example: 4.3,
            },
          },
        },
        PostParticipantProfile: {
          type: "object",
          required: ["id", "userId", "joinedAt", "user"],
          properties: {
            id: {
              type: "string",
              format: "uuid",
              description: "참여 row UUID",
              example: "7f7b9a5c-0e86-4f93-bd11-31e9bde8a7f2",
            },
            userId: {
              type: "string",
              format: "uuid",
              description: "참여자 사용자 UUID",
              example: "a87522bd-bc79-47b0-a73f-46ea4068a158",
            },
            participantStatus: {
              $ref: "#/components/schemas/ParticipantStatus",
            },
            joinedAt: {
              type: "string",
              format: "date-time",
              description: "공동구매 참여 시각",
            },
            user: {
              $ref: "#/components/schemas/PublicUserProfile",
            },
          },
        },
        PostParticipant: {
          type: "object",
          required: ["id", "postId", "userId", "participantStatus"],
          properties: {
            id: {
              type: "string",
              format: "uuid",
              description: "참여 row UUID",
              example: "7f7b9a5c-0e86-4f93-bd11-31e9bde8a7f2",
            },
            postId: {
              type: "string",
              format: "uuid",
              description: "게시글 UUID",
              example: "123e4567-e89b-12d3-a456-426614174000",
            },
            userId: {
              type: "string",
              format: "uuid",
              description: "참여자 사용자 UUID",
              example: "a87522bd-bc79-47b0-a73f-46ea4068a158",
            },
            participantStatus: {
              $ref: "#/components/schemas/ParticipantStatus",
            },
            user: {
              type: "object",
              nullable: true,
              properties: {
                id: {
                  type: "string",
                  format: "uuid",
                },
                nickname: {
                  type: "string",
                  example: "참여자 1",
                },
                studentId: {
                  type: "string",
                  example: "20241234",
                },
                avatarUrl: {
                  type: "string",
                  format: "uri",
                  nullable: true,
                },
              },
            },
            createdAt: {
              type: "string",
              format: "date-time",
              description: "참여 생성일시",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
              description: "참여 수정일시",
            },
          },
        },
        ParticipatedPost: {
          type: "object",
          required: ["id", "postId", "userId", "participantStatus", "post"],
          properties: {
            id: {
              type: "string",
              format: "uuid",
              description: "참여 row UUID",
              example: "7f7b9a5c-0e86-4f93-bd11-31e9bde8a7f2",
            },
            postId: {
              type: "string",
              format: "uuid",
              description: "게시글 UUID",
              example: "123e4567-e89b-12d3-a456-426614174000",
            },
            userId: {
              type: "string",
              format: "uuid",
              description: "참여자 사용자 UUID",
              example: "a87522bd-bc79-47b0-a73f-46ea4068a158",
            },
            participantStatus: {
              $ref: "#/components/schemas/ParticipantStatus",
            },
            post: {
              type: "object",
              properties: {
                id: {
                  type: "string",
                  format: "uuid",
                },
                title: {
                  type: "string",
                  example: "물티슈 공동구매",
                },
                price: {
                  type: "number",
                  example: 5900,
                },
                minParticipants: {
                  type: "integer",
                  example: 3,
                },
                status: {
                  type: "string",
                  enum: [
                    "open",
                    "closed",
                    "in_progress",
                    "completed",
                    "cancelled",
                  ],
                  example: "open",
                },
                deadline: {
                  type: "string",
                  format: "date-time",
                },
              },
            },
            createdAt: {
              type: "string",
              format: "date-time",
              description: "참여 생성일시",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
              description: "참여 수정일시",
            },
          },
        },
        MyPostsSummary: {
          type: "object",
          required: ["registered", "participated", "favorites", "meta"],
          properties: {
            registered: {
              type: "object",
              required: ["inProgress", "deadlineSoon", "completed"],
              description: "등록한 공구 탭 상단 요약",
              properties: {
                inProgress: {
                  type: "integer",
                  description:
                    "작성자가 등록한 활성 공구 수. open, closed, in_progress 상태를 포함합니다.",
                  example: 3,
                },
                deadlineSoon: {
                  type: "integer",
                  description:
                    "작성자가 등록한 모집중(open) 공구 중 deadlineSoonHours 이내 마감 수",
                  example: 1,
                },
                completed: {
                  type: "integer",
                  description: "작성자가 등록한 거래완료 공구 수",
                  example: 5,
                },
              },
            },
            participated: {
              type: "object",
              required: [
                "participating",
                "paymentPending",
                "pickupReady",
                "received",
              ],
              description: "참여한 공구 탭 상단 요약",
              properties: {
                participating: {
                  type: "integer",
                  description: "참여중 상태 수",
                  example: 4,
                },
                paymentPending: {
                  type: "integer",
                  description: "입금대기 상태 수",
                  example: 1,
                },
                pickupReady: {
                  type: "integer",
                  description: "수령예정 상태 수",
                  example: 2,
                },
                received: {
                  type: "integer",
                  description: "수령완료 상태 수",
                  example: 6,
                },
              },
            },
            favorites: {
              type: "object",
              required: ["total", "deadlineSoon", "recent"],
              description: "관심 공구 탭 상단 요약",
              properties: {
                total: {
                  type: "integer",
                  description: "찜한 상품 전체 수",
                  example: 8,
                },
                deadlineSoon: {
                  type: "integer",
                  description:
                    "찜한 모집중(open) 공구 중 deadlineSoonHours 이내 마감 수",
                  example: 2,
                },
                recent: {
                  type: "integer",
                  description: "recentDays 이내 최근 관심 등록 수",
                  example: 3,
                },
              },
            },
            meta: {
              type: "object",
              required: ["deadlineSoonHours", "recentDays"],
              properties: {
                deadlineSoonHours: {
                  type: "integer",
                  example: 24,
                },
                recentDays: {
                  type: "integer",
                  example: 7,
                },
              },
            },
          },
        },
        PostDetail: {
          type: "object",
          required: [
            "id",
            "authorId",
            "title",
            "content",
            "price",
            "minParticipants",
            "deadline",
            "author",
            "participants",
            "participantCount",
            "isParticipant",
          ],
          properties: {
            id: {
              type: "string",
              format: "uuid",
              description: "게시글 UUID",
              example: "123e4567-e89b-12d3-a456-426614174000",
            },
            authorId: {
              type: "string",
              format: "uuid",
              description: "작성자 UUID",
              example: "a87522bd-bc79-47b0-a73f-46ea4068a158",
            },
            title: {
              type: "string",
              description: "상품명",
              example: "물티슈 공동구매",
            },
            content: {
              type: "string",
              description: "상품 설명",
              example:
                "도톰한 엠보싱 원단으로 부드럽고 촉촉한 물티슈입니다.",
            },
            price: {
              type: "number",
              description: "가격",
              example: 5900,
            },
            minParticipants: {
              type: "integer",
              description: "최소 참여 인원",
              example: 3,
            },
            currentQuantity: {
              type: "integer",
              description: "현재 참여 인원",
              example: 1,
            },
            status: {
              type: "string",
              enum: ["open", "closed", "in_progress", "completed", "cancelled"],
              description: "상품 상태",
              example: "open",
            },
            deadline: {
              type: "string",
              format: "date-time",
              description: "마감 시간",
              example: "2026-04-17T23:59:59.000Z",
            },
            pickupLocation: {
              type: "string",
              nullable: true,
              description: "픽업 장소",
              example: "명지대 정문앞",
            },
            category: {
              type: "string",
              nullable: true,
              enum: [
                "food",
                "daily",
                "beauty",
                "electronics",
                "school",
                "freemarket",
              ],
              description: "카테고리 ID",
              example: "daily",
            },
            images: {
              type: "array",
              items: {
                $ref: "#/components/schemas/PostImage",
              },
              description: "이미지 URL 객체 배열",
            },
            thumbnailUrl: {
              type: "string",
              nullable: true,
              description: "대표 썸네일 URL",
              example: "https://example.com/wipes.jpg",
            },
            favoriteCount: {
              type: "integer",
              description: "관심 등록 수",
              example: 12,
            },
            isFavorite: {
              type: "boolean",
              description: "현재 사용자의 관심 등록 여부",
              example: true,
            },
            author: {
              $ref: "#/components/schemas/PublicUserProfile",
            },
            participants: {
              type: "array",
              description: "현재 공동구매 참여자 공개 프로필 목록",
              items: {
                $ref: "#/components/schemas/PostParticipantProfile",
              },
            },
            participantsPreview: {
              type: "array",
              description: "상세 화면 상단 미리보기용 참여자 목록",
              items: {
                type: "object",
                required: ["userId", "nickname", "avatarUrl", "trustGrade", "joinedAt"],
                properties: {
                  userId: {
                    type: "string",
                    format: "uuid",
                  },
                  nickname: {
                    type: "string",
                    example: "참여자 1",
                  },
                  avatarUrl: {
                    type: "string",
                    format: "uri",
                    nullable: true,
                  },
                  trustGrade: {
                    type: "number",
                    nullable: true,
                    example: 4.1,
                  },
                  joinedAt: {
                    type: "string",
                    format: "date-time",
                  },
                },
              },
            },
            participantCount: {
              type: "integer",
              description: "참여자 프로필 목록 기준 참여자 수",
              example: 2,
            },
            participantsTotal: {
              type: "integer",
              description: "전체 참여자 수",
              example: 2,
            },
            isParticipant: {
              type: "boolean",
              description:
                "현재 사용자가 이 공동구매에 참여 중인지 여부. x-user-id 또는 userId가 없으면 false입니다.",
              example: false,
            },
            isOwner: {
              type: "boolean",
              description:
                "현재 사용자가 이 공동구매 작성자인지 여부. x-user-id 또는 userId가 없으면 false입니다.",
              example: false,
            },
            deadlineStatus: {
              type: "string",
              enum: ["open", "closingSoon", "closed"],
              description: "서버 시간 기준 마감 상태",
              example: "closingSoon",
            },
            deadlineLabel: {
              type: "string",
              description: "프론트 표시용 마감 라벨",
              example: "오늘 마감",
            },
            remainingSeconds: {
              type: "integer",
              description: "마감까지 남은 초. 이미 지난 경우 0입니다.",
              example: 3600,
            },
            createdAt: {
              type: "string",
              format: "date-time",
              description: "생성일시",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
              description: "수정일시",
            },
          },
        },
        ChatRoom: {
          type: "object",
          required: ["id", "postId"],
          properties: {
            id: {
              type: "string",
              format: "uuid",
              description: "채팅방 UUID",
              example: "123e4567-e89b-12d3-a456-426614174000",
            },
            postId: {
              type: "string",
              format: "uuid",
              description: "게시글 UUID",
              example: "123e4567-e89b-12d3-a456-426614174000",
            },
            post: {
              type: "object",
              description: "연결된 게시글 정보",
              properties: {
                id: {
                  type: "string",
                  format: "uuid",
                },
                title: {
                  type: "string",
                },
                authorId: {
                  type: "string",
                  format: "uuid",
                },
              },
            },
            createdAt: {
              type: "string",
              format: "date-time",
              description: "생성일시",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
              description: "수정일시",
            },
          },
        },
        Message: {
          type: "object",
          required: ["id", "chatRoomId", "senderId", "content", "messageType"],
          properties: {
            id: {
              type: "string",
              format: "uuid",
              description: "메시지 UUID",
              example: "123e4567-e89b-12d3-a456-426614174000",
            },
            chatRoomId: {
              type: "string",
              format: "uuid",
              description: "채팅방 UUID",
              example: "123e4567-e89b-12d3-a456-426614174000",
            },
            senderId: {
              type: "string",
              format: "uuid",
              description: "발신자 UUID",
              example: "a87522bd-bc79-47b0-a73f-46ea4068a158",
            },
            content: {
              type: "string",
              description: "메시지 내용",
              example: "안녕하세요! 공동구매 참여하고 싶습니다.",
            },
            messageType: {
              type: "string",
              enum: ["text", "image", "file"],
              description: "메시지 타입",
              example: "text",
            },
            isRead: {
              type: "boolean",
              description: "읽음 여부",
              example: false,
            },
            sender: {
              type: "object",
              description: "발신자 정보",
              properties: {
                id: {
                  type: "string",
                  format: "uuid",
                },
                nickname: {
                  type: "string",
                },
                avatarUrl: {
                  type: "string",
                  format: "uri",
                  nullable: true,
                },
                studentId: {
                  type: "string",
                },
              },
            },
            createdAt: {
              type: "string",
              format: "date-time",
              description: "생성일시",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
              description: "수정일시",
            },
          },
        },
        Notification: {
          type: "object",
          required: ["id", "userId", "type", "title", "message", "isRead"],
          properties: {
            id: {
              type: "string",
              format: "uuid",
              description: "알림 UUID",
              example: "123e4567-e89b-12d3-a456-426614174000",
            },
            userId: {
              type: "string",
              format: "uuid",
              description: "사용자 UUID",
              example: "a87522bd-bc79-47b0-a73f-46ea4068a158",
            },
            type: {
              type: "string",
              enum: [
                "new_participant",
                "participant_cancel",
                "deadline_soon",
                "post_completed",
                "post_cancelled",
                "favorite_deadline",
                "favorite_completed",
              ],
              description: "알림 타입",
              example: "new_participant",
            },
            title: {
              type: "string",
              description: "알림 제목",
              example: "새로운 참여자",
            },
            message: {
              type: "string",
              description: "알림 메시지",
              example: "호빵 공동구매에 새로운 참여자가 있습니다.",
            },
            postId: {
              type: "string",
              format: "uuid",
              nullable: true,
              description: "게시글 UUID",
              example: "123e4567-e89b-12d3-a456-426614174000",
            },
            isRead: {
              type: "boolean",
              description: "읽음 여부",
              example: false,
            },
            createdAt: {
              type: "string",
              format: "date-time",
              description: "생성일시",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
              description: "수정일시",
            },
          },
        },
        Favorite: {
          type: "object",
          required: ["id", "userId", "postId"],
          properties: {
            id: {
              type: "string",
              format: "uuid",
              description: "관심 UUID",
              example: "123e4567-e89b-12d3-a456-426614174000",
            },
            userId: {
              type: "string",
              format: "uuid",
              description: "사용자 UUID",
              example: "a87522bd-bc79-47b0-a73f-46ea4068a158",
            },
            postId: {
              type: "string",
              format: "uuid",
              description: "게시글 UUID",
              example: "123e4567-e89b-12d3-a456-426614174000",
            },
            post: {
              description: "관심 등록한 게시글 정보",
              allOf: [{ $ref: "#/components/schemas/Post" }],
            },
            createdAt: {
              type: "string",
              format: "date-time",
              description: "생성일시",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
              description: "수정일시",
            },
          },
        },
        Error: {
          type: "object",
          properties: {
            error: {
              type: "string",
              description: "에러 메시지",
            },
          },
        },
      },
    },
  },
  apis: [
    "./src/routes/**/*.ts",
    "./src/controllers/**/*.ts",
    "./src/server.ts",
  ],
};

const swaggerSpec = swaggerJsdoc(options);

/**
 * Swagger UI 설정
 * - 환경 변수 API_BASE_URL이 설정되어 있으면 해당 URL 사용
 * - 없으면 요청의 현재 서버 URL을 자동으로 사용 (동적)
 * - 배포 환경에서는 API_BASE_URL=https://your-domain.com 으로 설정
 *
 * 사용법:
 *   - 개발: http://localhost:3000/api-docs
 *   - 배포: https://your-domain.com/api-docs
 *   - 환경 변수로 API_BASE_URL 설정 시 해당 URL이 기본 서버로 설정됨
 */
export const setupSwagger = (app: Express) => {
  // Swagger JSON 엔드포인트 (동적 서버 URL 포함)
  // 각 요청마다 현재 서버의 URL을 동적으로 설정
  app.get("/api-docs.json", (req: Request, res: Response) => {
    const currentServerUrl = `${req.protocol}://${req.get("host")}`;

    const dynamicSpec = {
      ...swaggerSpec,
      servers: [
        {
          url: currentServerUrl,
          description: "Current server (자동 감지)",
        },
        ...(ENV.ApiBaseUrl && ENV.ApiBaseUrl !== currentServerUrl
          ? [
              {
                url: ENV.ApiBaseUrl,
                description: "Configured API Base URL",
              },
            ]
          : []),
      ],
    };

    res.json(dynamicSpec);
  });

  // Swagger UI - 동적 JSON을 참조하도록 설정
  app.use(
    "/api-docs",
    swaggerUi.serve,
    (req: Request, res: Response, _next: NextFunction) => {
      void _next;
      // 동적 JSON URL을 사용하도록 설정
      const swaggerHtml = swaggerUi.generateHTML(
        {
          ...swaggerSpec,
          servers: [
            {
              url: `${req.protocol}://${req.get("host")}`,
              description: "Current server (자동 감지)",
            },
            ...(ENV.ApiBaseUrl &&
            ENV.ApiBaseUrl !== `${req.protocol}://${req.get("host")}`
              ? [
                  {
                    url: ENV.ApiBaseUrl,
                    description: "Configured API Base URL",
                  },
                ]
              : []),
          ],
        },
        {
          swaggerOptions: {
            persistAuthorization: true,
            url: "/api-docs.json", // 동적 JSON 참조
          },
          customCss: ".swagger-ui .topbar { display: none }",
        }
      );

      res.send(swaggerHtml);
    }
  );
};

export default swaggerSpec;
