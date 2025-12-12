import { Injectable, Logger } from "@nestjs/common";
import axios, { AxiosInstance } from "axios";

export interface EmqxClientInfo {
  clientid: string;
  username?: string;
  connected_at?: string;
  disconnected_at?: string;
  ip_address?: string;
  is_online?: boolean;
}

@Injectable()
export class EmqxClientService {
  private readonly logger = new Logger(EmqxClientService.name);
  private readonly http: AxiosInstance;
  private readonly baseUrl: string;

  constructor() {
    this.baseUrl = process.env.EMQX_APP_URL || "http://localhost:18083/api/v5";

    this.http = axios.create({
      baseURL: this.baseUrl,
      auth: {
        username: process.env.EMQX_APP_KEY || "admin",
        password: process.env.EMQX_APP_SECRET || "public",
      },
      timeout: 3000,
    });
  }

  // ───────────────────────────────────────────────
  // MQTT PUBLISH (via EMQX HTTP API)
  // ───────────────────────────────────────────────
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
        payload:
          typeof payload === "string" ? payload : JSON.stringify(payload),
      });

      this.logger.debug(`EMQX Publish OK → topic=${topic}`);
    } catch (error) {
      this.logger.error(
        `EMQX Publish FAILED → topic=${topic}`,
        error.response?.data || error,
      );
      throw error;
    }
  }

  // ───────────────────────────────────────────────
  // CLIENT LISTING / QUERY
  // ───────────────────────────────────────────────

  /**
   * Generic EMQX clients list.
   */
  async listClients(params?: {
    currpage?: number;
    pagesize?: number;
    clientIdLike?: string;
  }): Promise<EmqxClientInfo[]> {
    try {
      const query: any = {
        currpage: params?.currpage ?? 1,
        pagesize: params?.pagesize ?? 200,
      };

      if (params?.clientIdLike) {
        query.clientid = params.clientIdLike;
      }

      const res = await this.http.get("/clients", { params: query });

      const list: EmqxClientInfo[] =
        res.data?.data?.list ?? res.data?.data ?? [];

      return list;
    } catch (error) {
      this.logger.error(
        "Failed to list EMQX clients",
        error.response?.data || error,
      );
      throw error;
    }
  }

  /**
   * Find all sessions belonging to a user.
   * Convention: "lynku:<userId>:<random>"
   */
  async findClientsByUserId(userId: string): Promise<EmqxClientInfo[]> {
    const prefix = `lynku:${userId}`;
    return this.listClients({ clientIdLike: prefix });
  }

  /**
   * Check if user has any active MQTT sessions.
   */
  async isUserOnline(userId: string): Promise<{
    isOnline: boolean;
    sessions: EmqxClientInfo[];
  }> {
    const sessions = await this.findClientsByUserId(userId);
    const isOnline = sessions.length > 0;

    return { isOnline, sessions };
  }

  // ───────────────────────────────────────────────
  // PRESENCE MANAGEMENT
  // ───────────────────────────────────────────────

  /**
   * Saves presence info in EMQX or other persistence layer.
   */
  async saveUserPresence(clientId: string, online: boolean): Promise<void> {
    try {
      const userId = this.extractUserId(clientId);

      await this.http.put(`/extensions/presence/${userId}`, {
        online,
        lastSeen: Date.now(),
      });

      this.logger.log(`Presence updated: user=${userId} online=${online}`);
    } catch (error) {
      this.logger.error("Failed to save presence", error.response?.data || error);
    }
  }

  // ───────────────────────────────────────────────
  // SUBSCRIPTION INSPECTION
  // ───────────────────────────────────────────────

  async getSubscriptions(clientId: string): Promise<string[]> {
    try {
      const res = await this.http.get(`/subscriptions/${clientId}`);
      return res.data?.data?.map((s) => s.topic) ?? [];
    } catch (error) {
      this.logger.error(
        `Failed to fetch subscriptions for ${clientId}`,
        error.response?.data || error,
      );
      return [];
    }
  }

  // ───────────────────────────────────────────────
  // ADMIN OPERATIONS (moderation / kick user)
  // ───────────────────────────────────────────────

  async kickUser(clientId: string): Promise<void> {
    try {
      await this.http.delete(`/clients/${clientId}`);
      this.logger.warn(`Kicked EMQX client=${clientId}`);
    } catch (error) {
      this.logger.error(
        `Failed to kick client=${clientId}`,
        error.response?.data || error,
      );
    }
  }

  // ───────────────────────────────────────────────
  // UTILITIES
  // ───────────────────────────────────────────────

  /**
   * Extract userId from clientId.
   * Example formats supported:
   *   lynku:123:ios
   *   lynku:987:web
   */
  extractUserId(clientId: string): string {
    try {
      const parts = clientId.split(":");
      if (parts[0] === "lynku") return parts[1];
      return clientId;
    } catch {
      return clientId;
    }
  }
}
