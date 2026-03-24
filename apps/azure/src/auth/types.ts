export type AuthErrorCode =
  | 'not_authenticated'
  | 'no_provider'
  | 'no_token'
  | 'refresh_failed'
  | 'local_dev';

export class AuthError extends Error {
  code: AuthErrorCode;
  constructor(message: string, code: AuthErrorCode) {
    super(message);
    this.name = 'AuthError';
    this.code = code;
  }
}

export interface EasyAuthUser {
  name: string;
  email: string;
  userId: string;
  roles: string[];
}
