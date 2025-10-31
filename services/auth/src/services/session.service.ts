import { getRedisClient } from '../config/redis';
import { config } from '../config';
import { Session } from '../types';

export class SessionService {
  private getSessionKey(userId: string, token: string): string {
    return `session:${userId}:${token}`;
  }

  async createSession(userId: string, token: string, ttl?: number): Promise<void> {
    const redis = getRedisClient();
    const sessionKey = this.getSessionKey(userId, token);
    const expiresIn = ttl || config.session.ttl;

    const session: Session = {
      userId,
      token,
      expiresAt: new Date(Date.now() + expiresIn * 1000),
      createdAt: new Date(),
    };

    await redis.setEx(sessionKey, expiresIn, JSON.stringify(session));
  }

  async getSession(userId: string, token: string): Promise<Session | null> {
    const redis = getRedisClient();
    const sessionKey = this.getSessionKey(userId, token);
    const data = await redis.get(sessionKey);

    if (!data) {
      return null;
    }

    try {
      const session = JSON.parse(data) as Session;
      return session;
    } catch {
      return null;
    }
  }

  async deleteSession(userId: string, token: string): Promise<void> {
    const redis = getRedisClient();
    const sessionKey = this.getSessionKey(userId, token);
    await redis.del(sessionKey);
  }

  async deleteAllUserSessions(userId: string): Promise<void> {
    const redis = getRedisClient();
    const pattern = `session:${userId}:*`;
    const keys = await redis.keys(pattern);

    if (keys.length > 0) {
      await redis.del(keys);
    }
  }

  async refreshSession(userId: string, oldToken: string, newToken: string, ttl?: number): Promise<void> {
    await this.deleteSession(userId, oldToken);
    await this.createSession(userId, newToken, ttl);
  }

  async isSessionValid(userId: string, token: string): Promise<boolean> {
    const session = await this.getSession(userId, token);
    if (!session) {
      return false;
    }

    return session.expiresAt > new Date();
  }
}

export const sessionService = new SessionService();

