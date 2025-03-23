import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";
import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import { storage } from "./storage";
import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

if (!process.env.REPLIT_DOMAINS) {
  throw new Error("Environment variable REPLIT_DOMAINS not provided");
}

export async function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
  };
  
  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  const replId = process.env.REPL_ID!;
  const config = await client.discovery(
    new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
    replId,
  );

  const hostname = `${process.env.REPLIT_DOMAINS!.split(",")[0]}`;
  const callbackURL = `https://${hostname}/api/callback`;
  
  const verify: VerifyFunction = async (
    tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
    verified: passport.AuthenticateCallback
  ) => {
    const claims = tokens.claims();
    if (!claims) {
      return;
    }

    const userInfoResponse = await client.fetchUserInfo(config, tokens.access_token, claims.sub);
    
    // Check if user already exists in our database
    let [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.username, userInfoResponse.username as string));
    
    if (!existingUser) {
      // Create new user if they don't exist
      [existingUser] = await db
        .insert(users)
        .values({
          username: userInfoResponse.username as string,
          email: userInfoResponse.email as string || `${userInfoResponse.username}@example.com`,
          firstName: userInfoResponse.first_name as string || null,
          lastName: userInfoResponse.last_name as string || null,
          bio: userInfoResponse.bio as string || null,
          profileImageUrl: userInfoResponse.profile_image_url as string || null,
        })
        .returning();
    }
    
    // Add database user ID to the user object
    const userWithId = {
      ...userInfoResponse,
      userId: existingUser.id,
    };
    
    verified(null, userWithId);
  };

  const strategy = new Strategy(
    {
      config,
      scope: "openid email profile",
      callbackURL,
    },
    verify,
  );
  
  passport.use(strategy);

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  app.get("/api/login", passport.authenticate(strategy.name));

  app.get(
    "/api/callback",
    passport.authenticate(strategy.name, {
      successReturnToOrRedirect: "/",
      failureRedirect: "/api/login",
    }),
  );

  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      res.redirect(
        client.buildEndSessionUrl(config, {
          client_id: replId,
          post_logout_redirect_uri: `${req.protocol}://${req.hostname}`,
        }).href,
      );
    });
  });
}

export const isAuthenticated: RequestHandler = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
};
