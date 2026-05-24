type JsonValue = Record<string, unknown> | unknown[];

const baseUrl = process.env.SMOKE_BASE_URL ?? "http://localhost:3000";

async function getJson(path: string): Promise<{ status: number; body: JsonValue }> {
  const response = await fetch(`${baseUrl}${path}`);
  const body = (await response.json()) as JsonValue;
  return { status: response.status, body };
}

function assertOk(label: string, status: number) {
  if (status < 200 || status >= 300) {
    throw new Error(`${label} failed with HTTP ${status}`);
  }
}

function firstUserId(body: JsonValue) {
  return Array.isArray(body) && body[0] && typeof body[0] === "object"
    ? String((body[0] as Record<string, unknown>).id ?? "")
    : "";
}

function firstPostId(body: JsonValue) {
  if (Array.isArray(body)) {
    return body[0] && typeof body[0] === "object"
      ? String((body[0] as Record<string, unknown>).id ?? "")
      : "";
  }

  const items = (body as Record<string, unknown>).items;
  return Array.isArray(items) && items[0] && typeof items[0] === "object"
    ? String((items[0] as Record<string, unknown>).id ?? "")
    : "";
}

async function check(label: string, path: string) {
  const { status, body } = await getJson(path);
  assertOk(label, status);
  const size = Buffer.byteLength(JSON.stringify(body));
  console.log(`${label}: ${status} (${size} bytes)`);
  return body;
}

async function main() {
  const users = await check("users", "/api/users?limit=1");
  const userId = firstUserId(users);
  const posts = await check(
    "posts latest",
    `/api/posts?status=open&sort=latest&limit=5&offset=0${
      userId ? `&userId=${userId}` : ""
    }`
  );
  const postId = firstPostId(posts);

  await check(
    "posts popular",
    `/api/posts?sort=popular&limit=5&offset=0${
      userId ? `&userId=${userId}` : ""
    }`
  );

  if (postId) {
    await check(
      "post detail",
      `/api/posts/${postId}${userId ? `?userId=${userId}` : ""}`
    );
  }

  if (userId) {
    await check("user summary", `/api/users/${userId}/summary`);
    await check("trust summary", `/api/users/${userId}/trust-summary`);
    await check(
      "chat rooms",
      `/api/chat/rooms/user/${userId}?limit=20&offset=0`
    );
    await check(
      "notifications unread",
      `/api/notifications/unread-count?userId=${userId}`
    );
  }

  await check("notices", "/api/notices?limit=20&offset=0");
  await check("faqs", "/api/faqs?limit=20&offset=0");
  await check("api docs json", "/api-docs.json");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
