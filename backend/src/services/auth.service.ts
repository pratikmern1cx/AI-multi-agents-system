import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { UserRepository } from '../repositories/user.repository.js';
import { config } from '../config/index.js';
import { UnauthorizedError, ConflictError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

export class AuthService {
  private userRepo: UserRepository;

  constructor() {
    this.userRepo = new UserRepository();
  }

  async register(email: string, password: string, fullName?: string) {
    // Check if user exists
    const existingUser = await this.userRepo.findByEmail(email);
    if (existingUser) {
      throw new ConflictError('Email already registered');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const user = await this.userRepo.create({
      email,
      password_hash: passwordHash,
      full_name: fullName,
      role: 'user',
    });

    if (!user) {
      throw new Error('Failed to create user');
    }

    logger.info('[AuthService] User registered', { userId: user.id, email });

    // Generate token
    const token = this.generateToken(user.id, email);

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
      },
      token,
    };
  }

  async login(email: string, password: string) {
    // Find user
    const user = await this.userRepo.findByEmail(email);
    if (!user) {
      throw new UnauthorizedError('Invalid credentials');
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      throw new UnauthorizedError('Invalid credentials');
    }

    // Update last login
    await this.userRepo.updateLastLogin(user.id);

    logger.info('[AuthService] User logged in', { userId: user.id, email });

    // Generate token
    const token = this.generateToken(user.id, email);

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
      },
      token,
    };
  }

  private generateToken(userId: string, email: string): string {
    return jwt.sign(
      { userId, email },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn as any }
    );
  }

  verifyToken(token: string): { userId: string; email: string } {
    try {
      const decoded = jwt.verify(token, config.jwt.secret) as any;
      return { userId: decoded.userId, email: decoded.email };
    } catch (error) {
      throw new UnauthorizedError('Invalid token');
    }
  }
}
