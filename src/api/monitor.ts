import { http } from "../utils/http";

export function getQps() {
  return http.get("/api/monitor/qps");
}

export function getRequestCount() {
  return http.get("/api/monitor/request-count");
}

export function getHourSuccessRate() {
  return http.get("/api/monitor/hour-success-rate");
}

export function getHourFailureRate() {
  return http.get("/api/monitor/hour-failure-rate");
}

export function getTpSeriesLast20min() {
  return http.get("/api/monitor/tp-series-last20min");
}

export function getResourceSeries() {
  return http.get("/api/monitor/resource-series");
}
