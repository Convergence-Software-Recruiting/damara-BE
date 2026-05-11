import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { Express, Request, Response, NextFunction } from "express";
import ENV from "../common/constants/ENV";

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
        studentId: "60203042",
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
              description: "사전 약속 확인을 완료한 참여 인원",
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
                type: "string",
                description: "이미지 URL",
              },
              description: "이미지 URL 배열",
              example: ["https://example.com/image.jpg"],
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
        PostParticipant: {
          type: "object",
          required: ["id", "postId", "userId", "agreementStatus"],
          properties: {
            id: {
              type: "string",
              format: "uuid",
              description: "참여 정보 UUID",
              example: "123e4567-e89b-12d3-a456-426614174000",
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
              description: "참여자 UUID",
              example: "a87522bd-bc79-47b0-a73f-46ea4068a158",
            },
            agreementStatus: {
              type: "string",
              enum: ["pending", "accepted"],
              description:
                "사전 약속 확인 상태 (pending: 미확인, accepted: 확인 완료)",
              example: "accepted",
            },
            agreementAcceptedAt: {
              type: "string",
              format: "date-time",
              nullable: true,
              description: "사전 약속 확인 일시",
            },
            user: {
              type: "object",
              nullable: true,
              description: "참여자 요약 정보",
              properties: {
                id: {
                  type: "string",
                  format: "uuid",
                },
                nickname: {
                  type: "string",
                },
                studentId: {
                  type: "string",
                },
                avatarUrl: {
                  type: "string",
                  nullable: true,
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
              type: "object",
              description: "관심 등록한 게시글 정보",
              $ref: "#/components/schemas/Post",
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
