import { Router } from "express";
import { generateMagicLinkRoute, conventionsRoute } from "shared/src/routes";
import type { AppDependencies } from "../config/createAppDependencies";
import { sendHttpResponse } from "../helpers/sendHttpResponse";

export const createAdminRouter = (deps: AppDependencies) => {
  const adminRouter = Router({ mergeParams: true });

  adminRouter
    .route(`/${conventionsRoute}/:id`)
    .get(async (req, res) =>
      sendHttpResponse(
        req,
        res,
        () => deps.useCases.getConvention.execute(req.params),
        deps.authChecker,
      ),
    );

  adminRouter.route(`/${generateMagicLinkRoute}`).get(async (req, res) =>
    sendHttpResponse(
      req,
      res,
      () =>
        deps.useCases.generateMagicLink.execute({
          applicationId: req.query.id,
          role: req.query.role,
          expired: req.query.expired === "true",
        } as any),
      deps.authChecker,
    ),
  );

  return adminRouter;
};
