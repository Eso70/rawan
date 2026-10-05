export type ApiErrorCode =
  | "VALIDATION_ERROR"
  | "BAD_REQUEST"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "PAYLOAD_TOO_LARGE"
  | "UNSUPPORTED_MEDIA_TYPE"
  | "RATE_LIMITED"
  | "SERVICE_UNAVAILABLE"
  | "INTERNAL_ERROR";
export interface ApiValidationDetail {
  field: string;
  messages: string[];
}
export interface ApiError {
  statusCode: number;
  code: ApiErrorCode;
  message: string | string[];
  error: string;
  details?: ApiValidationDetail[];
}
export interface ApiHealth {
  status: "ok";
  service: "rawan-api";
}
export interface ApiQueueReadiness {
  status: "ready" | "disabled";
  enabled: boolean;
}
