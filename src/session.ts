import { Request } from 'express';
import RedisStore from 'connect-redis';
import session from 'express-session';

export const SESSION_PREFIX = 'sess:v2:';
export const sessionCookieName = (nodeEnv = process.env.NODE_ENV) =>
  nodeEnv === 'development' ? 'kolable.dev.sid' : '__Host-connect.sid';

export const createSessionMiddleware = (
  client: any,
  secret: string,
  nodeEnv = process.env.NODE_ENV,
): ReturnType<typeof session> => {
  return session({
    name: sessionCookieName(nodeEnv),
    secret,
    store: new RedisStore({ client, prefix: SESSION_PREFIX }),
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      path: '/',
      sameSite: nodeEnv === 'development' ? 'strict' : 'none',
      secure: nodeEnv !== 'development',
      maxAge: 30 * 86400 * 1000,
    },
  });
};

// Capture only the explicitly rebuilt account scope. regenerate replaces req.session.
export const rotateSessionIdentity = async (req: Request, key: string, identity: unknown) => {
  try {
    await new Promise<void>((resolve, reject) => req.session.regenerate(err => (err ? reject(err) : resolve())));
    (req.session as any)[key] = identity;
    await new Promise<void>((resolve, reject) => req.session.save(err => (err ? reject(err) : resolve())));
  } catch {
    const failedSession = req.session;
    if (failedSession) delete (failedSession as any)[key];
    // Disable express-session's response autosave even when store cleanup fails.
    req.session = null as any;
    if (failedSession) {
      try {
        await new Promise<void>(resolve => failedSession.destroy(() => resolve()));
      } catch {
        /* The request must remain unauthenticated even if the store is unavailable. */
      }
    }
    req.session = null as any;
    throw Object.assign(new Error('cannot save session'), { name: 'E_SESSION' });
  }
};
