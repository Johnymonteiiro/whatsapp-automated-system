import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Post,
  UsePipes,
} from '@nestjs/common';

import { MakeCreateUserUseCase } from 'src/domain/use-cases/user-use-case/factory/create-user-factory';
import { UserSchema, UserZodType } from 'src/infra/http/pipe/user-pipe';
import { ZodValidationPipe } from 'src/infra/http/pipe/zod-validation-pipe';

@Controller('accountS')
export class UserController {
  constructor() {}

  @Post('/register')
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ZodValidationPipe(UserSchema))
  async uploadAndCreate(@Body() user: UserZodType) {
    const { email, name, password } = user;

    try {
      const createUser = MakeCreateUserUseCase();
      await createUser.execute({ email, name, password });
    } catch (error) {
      console.error(error);
      throw new HttpException('Email already exist', HttpStatus.CONFLICT);
    }
  }

  @Get('/logs')
  async getLogs() {}
}
