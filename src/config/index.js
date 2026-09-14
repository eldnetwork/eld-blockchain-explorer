// API configuration from environment variables (Vite: VITE_* → import.meta.env)
export const RPC_URL = import.meta.env.VITE_RPC_URL || 'http://localhost:26657';
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:9001';

/** Validator localhost admin status (slots, host storage). Off in production builds by default. */
export const ENABLE_VALIDATOR_ADMIN_STATUS =
  import.meta.env.VITE_ENABLE_VALIDATOR_ADMIN_STATUS === 'true';
