import { SetMetadata, createParamDecorator, ExecutionContext } from '@nestjs/common';

export const PERMISSION_CHECK_KEY = 'permission_check';

export interface RequiredPermission {
  page: string;
  action: 'V' | 'A' | 'E' | 'D'; // View, Add, Edit, Delete
}

export const CheckPermission = (page: string, action: 'V' | 'A' | 'E' | 'D') =>
  SetMetadata(PERMISSION_CHECK_KEY, { page, action });

export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    return data ? user?.[data] : user;
  },
);
