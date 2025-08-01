import { Request, Response, Router } from "express";
import { AuthRoutes } from "../modules/auth/auth.route";
import { ParcelRoutes } from "../modules/parcel/parcel.route";
import { UserRoutes } from "../modules/user/user.route";

const router = Router();

const moduleRoutes = [
  {
    path: "/user",
    route: UserRoutes,
  },
  {
    path: "/auth",
    route: AuthRoutes,
  },
  {
    path: "/parcel",
    route: ParcelRoutes,
  },
];

router.get("/health", (req: Request, res: Response) => {
  res.status(200).json({
    message: "Server is running",
  });
});

moduleRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

export default router;
