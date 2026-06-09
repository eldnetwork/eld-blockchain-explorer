// API configuration from environment variables
export const RPC_URL = process.env.REACT_APP_RPC_URL || 'http://localhost:26657';
export const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:9001';
export const FAUCET_URL = process.env.REACT_APP_FAUCET_URL || 'http://localhost:8080';

/** Validator localhost admin status (slots, host storage). Off in production builds by default. */
export const ENABLE_VALIDATOR_ADMIN_STATUS =
  process.env.REACT_APP_ENABLE_VALIDATOR_ADMIN_STATUS === 'true';
