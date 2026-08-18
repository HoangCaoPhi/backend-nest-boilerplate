import { SetMetadata } from '@nestjs/common';

export const INTEGRATION_CALLER = 'auth:integrationCaller';

// Nest resolves guards through DI, so a guard cannot take the caller name as a
// constructor arg — it travels as route metadata instead.
export const Integration = (callerName: string) => SetMetadata(INTEGRATION_CALLER, callerName);
