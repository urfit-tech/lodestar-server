import { APIException } from '~/api.excetion';

const isRelativeSegment = (segment: string) => segment === '.' || segment === '..';

/**
 * True when `key` has the layout `<prefix>/<appId>/<rest>` for the given app, as the admin uploader builds it
 * (`vod/<appId>/<id[0..2]>/<id>/video/<file>`), with no `.` / `..` segments.
 */
export const isStorageKeyInApp = (key: unknown, appId: string | undefined): boolean => {
  if (typeof key !== 'string' || !appId) {
    return false;
  }
  const segments = key.split('/');
  if (segments.length < 3 || segments.some(isRelativeSegment)) {
    return false;
  }
  const [prefix, keyAppId, ...rest] = segments;
  return prefix !== '' && keyAppId === appId && rest.join('/') !== '';
};

export const assertStorageKeyInApp = (key: unknown, appId: string | undefined): void => {
  if (!isStorageKeyInApp(key, appId)) {
    throw new APIException(
      { code: 'E_STORAGE_KEY_FORBIDDEN', message: 'storage key must be under <prefix>/<your appId>/' },
      403,
    );
  }
};
