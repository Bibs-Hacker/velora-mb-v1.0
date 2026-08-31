import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { accountsRouter } from "./routers/accounts";
import { sessionsRouter } from "./routers/sessions";
import { commentsRouter, postsRouter } from "./routers/posts";
import { profilesRouter } from "./routers/profiles";
import { storiesRouter } from "./routers/stories";
import { messagingRouter, notificationsRouter } from "./routers/messaging";
import { discoveryRouter } from "./routers/discovery";
import { adminRouter, safetyRouter } from "./routers/safety";
import { analyticsRouter, archivesRouter, feedbackRouter, userSafetyRouter, verificationRouter } from "./routers/enhancements";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  accounts: accountsRouter,
  sessions: sessionsRouter,
  posts: postsRouter,
  comments: commentsRouter,
  profiles: profilesRouter,
  stories: storiesRouter,
  messaging: messagingRouter,
  notifications: notificationsRouter,
  discovery: discoveryRouter,
  safety: safetyRouter,
  admin: adminRouter,
  archives: archivesRouter,
  analytics: analyticsRouter,
  feedback: feedbackRouter,
  userSafety: userSafetyRouter,
  verification: verificationRouter,

  // TODO: add feature routers here, e.g.
  // todo: router({
  //   list: protectedProcedure.query(({ ctx }) =>
  //     db.getUserTodos(ctx.user.id)
  //   ),
  // }),
});

export type AppRouter = typeof appRouter;
