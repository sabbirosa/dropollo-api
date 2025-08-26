import { JwtPayload } from "jsonwebtoken";
import type { IUserJWT } from "../modules/user/user.interface";

declare global {
  namespace Express {
    interface User extends IUserJWT, JwtPayload {}
    // Ensure Request.user resolves to our augmented Express.User
    interface Request {
      user: Express.User;
    }
  }
}
