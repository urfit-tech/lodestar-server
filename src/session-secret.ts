/** The session cookie secret must be configured; an empty value stops startup. */
export const requireSessionSecret = (value: unknown): string => {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error('SESSION_SECRET must be a non-empty string');
  }
  return value;
};
