import { getPool } from '../config/database';
import { hashPassword, comparePassword, validatePassword } from '../utils/password';
import { User, RegisterRequest, UserRole } from '../types';
import { ConflictError, ValidationError, NotFoundError, AuthenticationError } from '../utils/errors';

export class UserService {
  async createUser(data: RegisterRequest): Promise<User> {
    // Validate password strength
    if (!validatePassword(data.password)) {
      throw new ValidationError(
        'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number'
      );
    }

    // Check if user already exists
    const existingUser = await this.findByEmail(data.email);
    if (existingUser) {
      throw new ConflictError('User with this email already exists');
    }

    // Hash password
    const passwordHash = await hashPassword(data.password);

    // Insert user
    const pool = getPool();
    const result = await pool.query<User>(
      `INSERT INTO users (email, password_hash, first_name, last_name, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, email, password_hash, first_name, last_name, role, email_verified, created_at, updated_at`,
      [data.email.toLowerCase(), passwordHash, data.first_name, data.last_name, UserRole.USER]
    );

    return result.rows[0];
  }

  async findByEmail(email: string): Promise<User | null> {
    const pool = getPool();
    const result = await pool.query<User>(
      'SELECT * FROM users WHERE email = $1',
      [email.toLowerCase()]
    );
    return result.rows[0] || null;
  }

  async findById(id: string): Promise<User | null> {
    const pool = getPool();
    const result = await pool.query<User>(
      'SELECT * FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  async verifyPassword(user: User, password: string): Promise<boolean> {
    return comparePassword(password, user.password_hash);
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const pool = getPool();
    const fields: string[] = [];
    const values: unknown[] = [];
    let paramCount = 1;

    if (updates.first_name !== undefined) {
      fields.push(`first_name = $${paramCount++}`);
      values.push(updates.first_name);
    }
    if (updates.last_name !== undefined) {
      fields.push(`last_name = $${paramCount++}`);
      values.push(updates.last_name);
    }
    if (updates.email_verified !== undefined) {
      fields.push(`email_verified = $${paramCount++}`);
      values.push(updates.email_verified);
    }
    if (updates.role !== undefined) {
      fields.push(`role = $${paramCount++}`);
      values.push(updates.role);
    }

    if (fields.length === 0) {
      return this.findById(id) as Promise<User>;
    }

    values.push(id);
    const query = `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`;

    const result = await pool.query<User>(query, values);
    if (result.rows.length === 0) {
      throw new NotFoundError('User');
    }

    return result.rows[0];
  }

  async authenticateUser(email: string, password: string): Promise<User> {
    const user = await this.findByEmail(email);
    if (!user) {
      throw new AuthenticationError('Invalid email or password');
    }

    const isPasswordValid = await this.verifyPassword(user, password);
    if (!isPasswordValid) {
      throw new AuthenticationError('Invalid email or password');
    }

    return user;
  }
}

export const userService = new UserService();

