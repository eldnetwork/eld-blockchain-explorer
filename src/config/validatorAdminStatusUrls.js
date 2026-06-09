import { ENABLE_VALIDATOR_ADMIN_STATUS } from '../config';
import devUrls from './validator-admin-status-urls.development.json';
import prodUrls from './validator-admin-status-urls.production.json';
import { normalizeAccountAddress } from '../utils/accountAddress';

const byEnv = process.env.NODE_ENV === 'production' ? prodUrls : devUrls;

/**
 * @param {string | undefined | null} address
 * @returns {string | null} Full URL to GET for admin JSON (e.g. …/admin/v1/status), or null if unmapped.
 */
export function getValidatorAdminStatusUrl(address) {
  if (!ENABLE_VALIDATOR_ADMIN_STATUS) return null;
  const key = normalizeAccountAddress(address);
  if (!key) return null;
  const url = byEnv[key];
  return typeof url === 'string' && url.trim().length > 0 ? url.trim() : null;
}
