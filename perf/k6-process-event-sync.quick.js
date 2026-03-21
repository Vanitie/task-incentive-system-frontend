import http from "k6/http";
import { check, sleep } from "k6";

const BASE_URL = __ENV.BASE_URL || "http://localhost:8080";
const PATH = __ENV.PATH_NAME || "/api/engine/process-event-sync";
const EVENT_TYPE = __ENV.EVENT_TYPE || "USER_SIGN";
const FIXED_USER_ID = __ENV.USER_ID || "1000000000000002483";
const AUTH_TOKEN =
  __ENV.AUTH_TOKEN ||
  "eyJhbGciOiJIUzI1NiJ9.eyJyb2xlcyI6IlJPTEVfQURNSU4iLCJhZG1pbiI6dHJ1ZSwic3ViIjoiYWRtaW4iLCJpYXQiOjE3NzM5MTMwOTcsImV4cCI6MTc3Mzk5OTQ5N30.8OueTsNIrWYdikzbKGHgJ14jCefbjrWQURWEkdXzBaU";

export const options = {
  stages: [
    { duration: "20s", target: 20 },
    { duration: "40s", target: 20 },
    { duration: "20s", target: 50 },
    { duration: "40s", target: 50 },
    { duration: "20s", target: 0 }
  ],
  thresholds: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<500", "p(99)<1000"]
  }
};

function buildPayload() {
  const now = new Date();

  return {
    messageId: `msg-${__VU}-${__ITER}-${Date.now()}`,
    userId: FIXED_USER_ID,
    eventType: EVENT_TYPE,
    value: 1,
    // Java LocalDateTime 推荐格式：yyyy-MM-ddTHH:mm:ss
    time: now.toISOString().slice(0, 19)
  };
}

export default function () {
  const url = `${BASE_URL}${PATH}`;
  const payload = JSON.stringify(buildPayload());
  const headers = {
    "Content-Type": "application/json"
  };

  if (AUTH_TOKEN) {
    headers.Authorization = `Bearer ${AUTH_TOKEN}`;
  }

  const res = http.post(url, payload, {
    headers,
    timeout: "30s"
  });

  check(res, {
    "status is 2xx": r => r.status >= 200 && r.status < 300
  });

  sleep(0.2);
}
