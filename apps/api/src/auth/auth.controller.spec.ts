import { Test } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            login: jest.fn().mockResolvedValue({ accessToken: 'token' })
          }
        }
      ]
    }).compile();

    controller = module.get(AuthController);
    authService = module.get(AuthService);
  });

  it('should login with credentials', async () => {
    const payload: LoginDto = {
      email: 'admin@evergreenbooks.example',
      password: 'Admin!23456'
    };

    const result = await controller.login(payload);

    expect(authService.login).toHaveBeenCalledWith(payload.email, payload.password);
    expect(result).toEqual({ accessToken: 'token' });
  });
});
