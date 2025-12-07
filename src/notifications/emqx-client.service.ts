import { Injectable, Logger } from "@nestjs/common";
import axios, { AxiosInstance } from "axios";

export interface EmqxClientInfo {
  clientid: string;
  username?: string;
  connected_at?: string;
  disconnected_at?: string;
  is_online?: boolean;
}

@Injectable()
export class EmqxClientService {
  private readonly logger = new Logger(EmqxClientService.name);
  private readonly http: AxiosInstance;
  private readonly baseUrl: string;

  constructor() {
    this.baseUrl =
      process.env.EMQX_APP_URL || "http://localhost:18083/api/v5";

    this.http = axios.create({
      baseURL: this.baseUrl,
      auth: {
        username: process.env.EMQX_APP_KEY || "admin",
        password: process.env.EMQX_APP_SECRET || "public",
      },
      timeout: 3000,
    });
  }

  // ───────────────────── Publish ─────────────────────

  /**
   * Publish a message via EMQX HTTP API.
   */
  async publish(
    topic: string,
    payload: any,
    qos: 0 | 1 | 2 = 0,
    retain = false,
  ): Promise<void> {
    try {
      await this.http.post("/mqtt/publish", {
        topic,
        qos,
        retain,
        payload: typeof payload === "string"
          ? payload
          : JSON.stringify(payload),
      });
      this.logger.debug(`Published to topic="${topic}" via EMQX HTTP`);
    } catch (error: any) {
      this.logger.error(
        `Failed to publish to topic="${topic}"`,
        error?.response?.data || error,
      );
      throw error;
    }
  }

  // ───────────────────── Client status ─────────────────────

  /**
   * Get all clients from EMQX (paginated).
   * Use filters where possible instead of fetching all in prod.
   */
  async listClients(params?: {
    currpage?: number;
    pagesize?: number;
    clientIdLike?: string;
  }): Promise<EmqxClientInfo[]> {
    try {
      const query: any = {
        currpage: params?.currpage ?? 1,
        pagesize: params?.pagesize ?? 100,
      };

      if (params?.clientIdLike) {
        // EMQX v5 supports simple 'like' filter on clientid
        query.clientid = params.clientIdLike;
      }

      const res = await this.http.get("/clients", { params: query });

      // in v5: { code, data: { meta, list: [...] } }
      const list: EmqxClientInfo[] = res.data?.data?.list ?? res.data?.data ?? [];
      return list;
    } catch (error: any) {
      this.logger.error(
        "Failed to list EMQX clients",
        error?.response?.data || error,
      );
      throw error;
    }
  }

  /**
   * Find clients for a given userId based on your clientId convention.
   * Example convention: "lynku:<userId>:<platformOrRandom>"
   */
  async findClientsByUserId(userId: string): Promise<EmqxClientInfo[]> {
    // tweak to your convention; here we do a simple 'like' search
    const like = `lynku:${userId}`; // or `${userId}` if you use raw id
    return this.listClients({ clientIdLike: like });
  }

  /**
   * Returns true if we see any online clients for the user.
   */
  async isUserOnline(userId: string): Promise<{
    isOnline: boolean;
    sessions: EmqxClientInfo[];
  }> {
    const sessions = await this.findClientsByUserId(userId);
    const isOnline = sessions && sessions.length > 0;
    return { isOnline, sessions };
  }
}