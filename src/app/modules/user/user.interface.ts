export enum IsActive {
  ACTIVE = "active",
  BLOCKED = "blocked",
  INACTIVE = "inactive",
}

export interface IUserJWT {
  userId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}
