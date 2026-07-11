import { config } from "./config";
import type {
  EmbedRequest,
  EmbedResponse,
  BatchEmbedRequest,
  BatchEmbedResponse,
  FastApiHealthResponse,
} from "./types";

class EmbeddingApiClient {
  private baseUrl: string;
  private controller: AbortController | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/+$/, "");
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown
  ): Promise<T> {
    this.controller = new AbortController();
    const timer = setTimeout(() => this.controller!.abort(), config.requestTimeoutMs);

    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        method,
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
        signal: this.controller.signal,
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(
          `Upstream ${response.status}: ${(errorBody as { error?: string }).error || response.statusText}`
        );
      }

      return (await response.json()) as T;
    } finally {
      clearTimeout(timer);
      this.controller = null;
    }
  }

  async health(): Promise<FastApiHealthResponse> {
    return this.request<FastApiHealthResponse>("GET", "/health");
  }

  async embed(req: EmbedRequest): Promise<EmbedResponse> {
    return this.request<EmbedResponse>("POST", "/embed", req);
  }

  async batchEmbed(req: BatchEmbedRequest): Promise<BatchEmbedResponse> {
    return this.request<BatchEmbedResponse>("POST", "/batch-embed", req);
  }

  cancelPending(): void {
    this.controller?.abort();
  }
}

export const apiClient = new EmbeddingApiClient(config.embeddingApiUrl);
