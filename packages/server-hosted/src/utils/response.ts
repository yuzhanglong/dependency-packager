import { ExecutionContext, createParamDecorator } from '@nestjs/common';

export const Response = createParamDecorator((data, ctx: ExecutionContext) => {
  return ctx.switchToHttp().getResponse();
});

export const Res = Response;
