import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import {
  getVendorPortalContext,
  VendorPortalContext,
} from '../guards/vendor-portal.guard';

export const GetVendorContext = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): VendorPortalContext => {
    const request = ctx.switchToHttp().getRequest();
    return getVendorPortalContext(request);
  },
);
