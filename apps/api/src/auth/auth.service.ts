import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Role } from '../common/enums/role.enum';

interface UserRecord {
  id: string;
  email: string;
  password: string;
  role: Role;
}

@Injectable()
export class AuthService {
  private readonly users: UserRecord[] = [
    {
      id: '1',
      email: 'admin@evergreenbooks.example',
      password: 'Admin!23456',
      role: Role.Admin
    },
    {
      id: '2',
      email: 'manager@evergreenbooks.example',
      password: 'Manager!23456',
      role: Role.Manager
    },
    {
      id: '3',
      email: 'clerk@evergreenbooks.example',
      password: 'Clerk!23456',
      role: Role.Clerk
    }
  ];

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) {}

  async validateUser(email: string, password: string): Promise<Omit<UserRecord, 'password'>> {
    const user = this.users.find(
      (candidate) => candidate.email === email && candidate.password === password
    );

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const { password: _ignored, ...safeUser } = user;
    return safeUser;
  }

  async login(email: string, password: string): Promise<{ accessToken: string }> {
    const user = await this.validateUser(email, password);
    const payload = { sub: user.id, email: user.email, role: user.role };
    const secret = this.configService.get<string>('JWT_SECRET');

    if (!secret) {
      throw new UnauthorizedException('JWT secret not configured');
    }

    return {
      accessToken: await this.jwtService.signAsync(payload, {
        secret,
        expiresIn: '1h'
      })
    };
  }
}
