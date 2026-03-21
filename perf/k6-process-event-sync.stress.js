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
  scenarios: {
    stress_test: {
      executor: "constant-arrival-rate",
      rate: 1000,
      timeUnit: "1s",
      duration: "1m",
      preAllocatedVUs: 200,
      maxVUs: 2000,
      startTime: "0s"
    },
    stress_test_5000: {
      executor: "constant-arrival-rate",
      rate: 5000,
      timeUnit: "1s",
      duration: "1m",
      preAllocatedVUs: 500,
      maxVUs: 5000,
      startTime: "1m"
    },
    stress_test_10000: {
      executor: "constant-arrival-rate",
      rate: 10000,
      timeUnit: "1s",
      duration: "1m",
      preAllocatedVUs: 1000,
      maxVUs: 10000,
      startTime: "2m"
    },
    stress_test_20000: {
      executor: "constant-arrival-rate",
      rate: 20000,
      timeUnit: "1s",
      duration: "1m",
      preAllocatedVUs: 2000,
      maxVUs: 20000,
      startTime: "3m"
    }
  },
  thresholds: {
    http_req_failed: ["rate<0.05"],
    http_req_duration: ["p(95)<2000", "p(99)<5000"]
  }
};

function buildPayload() {
  const now = new Date();
  return {
    messageId: `msg-${__VU}-${__ITER}-${Date.now()}`,
    userId: FIXED_USER_ID,
    eventType: EVENT_TYPE,
    value: 1,
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

  // 采样输出失败响应
  if (res.status < 200 || res.status >= 300) {
    console.log(`Fail: ${res.status} - ${res.body}`);
  }

  sleep(0.05);
}
