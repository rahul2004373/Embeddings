export interface EmbedRequest {
  content: string;
}

export interface EmbedResponse {
  embedding: number[];
  dimension: number;
}

export interface BatchEmbedRequest {
  texts: string[];
}

export interface BatchEmbedResponse {
  embeddings: number[][];
}

export interface FastApiHealthResponse {
  status: string;
  model: string;
  device: string;
  vector_dimension: number;
}

export interface BffHealthResponse {
  status: string;
  upstream: string;
  upstream_status: string;
  model: string;
  device: string;
  vector_dimension: number;
}

export interface BffSystemHealthResponse {
  status: string;
  cpu_percent: number;
  memory_usage_mb: number;
  uptime_seconds: number;
}

export interface ApiError {
  success: false;
  error: string;
}
