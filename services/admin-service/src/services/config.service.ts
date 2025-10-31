import { getPool } from '../config/database';
import {
  SystemConfig,
  CreateSystemConfigRequest,
  UpdateSystemConfigRequest,
} from '../types';
import { ConflictError, NotFoundError, ValidationError } from '../utils/errors';

export class ConfigService {
  async createConfig(data: CreateSystemConfigRequest, updatedBy?: string): Promise<SystemConfig> {
    const pool = getPool();

    // Check if config key already exists
    const existing = await this.findByKey(data.key);
    if (existing) {
      throw new ConflictError(`Configuration key '${data.key}' already exists`);
    }

    // Validate value type
    this.validateValueType(data.value, data.type || 'string');

    const result = await pool.query<SystemConfig>(
      `INSERT INTO system_config (key, value, type, category, description, is_encrypted, updated_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        data.key,
        data.value,
        data.type || 'string',
        data.category || 'general',
        data.description || null,
        data.is_encrypted || false,
        updatedBy || null,
      ]
    );

    return result.rows[0];
  }

  async findByKey(key: string): Promise<SystemConfig | null> {
    const pool = getPool();
    const result = await pool.query<SystemConfig>('SELECT * FROM system_config WHERE key = $1', [
      key,
    ]);
    return result.rows[0] || null;
  }

  async findById(id: string): Promise<SystemConfig | null> {
    const pool = getPool();
    const result = await pool.query<SystemConfig>('SELECT * FROM system_config WHERE id = $1', [
      id,
    ]);
    return result.rows[0] || null;
  }

  async findAll(category?: string): Promise<SystemConfig[]> {
    const pool = getPool();
    let query = 'SELECT * FROM system_config';
    const params: unknown[] = [];

    if (category) {
      query += ' WHERE category = $1';
      params.push(category);
    }

    query += ' ORDER BY category, key';

    const result = await pool.query<SystemConfig>(query, params);
    return result.rows;
  }

  async updateConfig(
    key: string,
    updates: UpdateSystemConfigRequest,
    updatedBy?: string
  ): Promise<SystemConfig> {
    const pool = getPool();
    const fields: string[] = [];
    const values: unknown[] = [];
    let paramCount = 1;

    if (updates.value !== undefined) {
      // Validate value type if type is also being updated
      const currentConfig = await this.findByKey(key);
      if (!currentConfig) {
        throw new NotFoundError('Configuration');
      }
      const typeToValidate = updates.type || currentConfig.type;
      this.validateValueType(updates.value, typeToValidate);

      fields.push(`value = $${paramCount++}`);
      values.push(updates.value);
    }
    if (updates.type !== undefined) {
      // Revalidate value if type changed
      const currentConfig = await this.findByKey(key);
      if (currentConfig) {
        this.validateValueType(currentConfig.value, updates.type);
      }
      fields.push(`type = $${paramCount++}`);
      values.push(updates.type);
    }
    if (updates.category !== undefined) {
      fields.push(`category = $${paramCount++}`);
      values.push(updates.category);
    }
    if (updates.description !== undefined) {
      fields.push(`description = $${paramCount++}`);
      values.push(updates.description);
    }
    if (updates.is_encrypted !== undefined) {
      fields.push(`is_encrypted = $${paramCount++}`);
      values.push(updates.is_encrypted);
    }

    if (fields.length === 0) {
      const config = await this.findByKey(key);
      if (!config) {
        throw new NotFoundError('Configuration');
      }
      return config;
    }

    if (updatedBy) {
      fields.push(`updated_by = $${paramCount++}`);
      values.push(updatedBy);
    }

    values.push(key);
    const query = `UPDATE system_config SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE key = $${paramCount} RETURNING *`;

    const result = await pool.query<SystemConfig>(query, values);
    if (result.rows.length === 0) {
      throw new NotFoundError('Configuration');
    }

    return result.rows[0];
  }

  async deleteConfig(key: string): Promise<void> {
    const pool = getPool();
    const result = await pool.query('DELETE FROM system_config WHERE key = $1', [key]);
    if (result.rowCount === 0) {
      throw new NotFoundError('Configuration');
    }
  }

  private validateValueType(value: string, type: string): void {
    if (type === 'number') {
      if (isNaN(Number(value))) {
        throw new ValidationError(`Value must be a valid number for type 'number'`);
      }
    } else if (type === 'boolean') {
      if (value !== 'true' && value !== 'false') {
        throw new ValidationError(`Value must be 'true' or 'false' for type 'boolean'`);
      }
    } else if (type === 'json') {
      try {
        JSON.parse(value);
      } catch {
        throw new ValidationError(`Value must be valid JSON for type 'json'`);
      }
    }
  }
}

export const configService = new ConfigService();

