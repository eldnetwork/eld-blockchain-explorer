import React, { useEffect, useState } from 'react';
import { useParams, Link as RouterLink, useNavigate } from 'react-router-dom';
import { Box, Heading, Text, HStack, Skeleton, Link } from '@chakra-ui/react';
import useCapacityProviders from '../hooks/useCapacityProviders';
import useVerifiedProofRewards from '../hooks/useVerifiedProofRewards';
import { normalizeAccountAddress } from '../utils/accountAddress';
import { formatELDAmount } from '../utils/formatAmount';
import { ENABLE_VALIDATOR_ADMIN_STATUS } from '../config';
import { getValidatorAdminStatusUrl } from '../config/validatorAdminStatusUrls';
import AsciiBox from '../components/AsciiBox';
import './ExplorerDataPages.css';

const BYTES_PER_GB = 1024 ** 3;

function bytesToGb(bytes) {
  if (typeof bytes !== 'number' || !Number.isFinite(bytes)) return null;
  return bytes / BYTES_PER_GB;
}

function formatGb(bytes, fractionDigits = 2) {
  const gb = bytesToGb(bytes);
  if (gb == null) return null;
  return gb.toLocaleString(undefined, { minimumFractionDigits: fractionDigits, maximumFractionDigits: fractionDigits });
}

function formatPct(numerator, denominator, fractionDigits = 1) {
  if (typeof numerator !== 'number' || typeof denominator !== 'number' || denominator <= 0 || !Number.isFinite(numerator)) {
    return null;
  }
  return ((100 * numerator) / denominator).toLocaleString(undefined, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
}

function AdminSlotsSection({ capacity }) {
  if (!capacity || typeof capacity.total_slot_count !== 'number') return null;
  const total = capacity.total_slot_count;
  const proof = capacity.proof_slots?.count;
  const open = capacity.open_slots?.count;
  const content = capacity.content_slots?.count;

  const row = (label, count) => {
    if (typeof count !== 'number' || !Number.isFinite(count)) return null;
    const pct = formatPct(count, total);
    return (
      <div key={label}>
        <span>{label}</span>
        <strong>
          {count.toLocaleString()} ({pct != null ? `${pct}%` : '—'})
        </strong>
      </div>
    );
  };

  return (
    <section className="explorer-page__section">
      <h2>
        <span /> SLOTS
      </h2>
      <div className="explorer-page__kv-grid">
        <div>
          <span>TOTAL</span>
          <strong>
            {total.toLocaleString()} (100%)
          </strong>
        </div>
        {row('PROOFS', proof)}
        {row('OPEN', open)}
        {row('CONTENT', content)}
      </div>
    </section>
  );
}

function AdminHostStorageSection({ host }) {
  if (!host || typeof host.volume_total_bytes !== 'number') return null;
  const totalGb = formatGb(host.volume_total_bytes);
  const usedGb = formatGb(host.volume_used_bytes);
  const pctUsed = formatPct(host.volume_used_bytes, host.volume_total_bytes);

  if (totalGb == null || usedGb == null) return null;

  return (
    <section className="explorer-page__section">
      <h2>
        <span /> HOST STORAGE
      </h2>
      <div className="explorer-page__kv-grid">
        <div>
          <span>VOLUME TOTAL</span>
          <strong>{totalGb} GB</strong>
        </div>
        <div>
          <span>VOLUME USED</span>
          <strong>{usedGb} GB</strong>
        </div>
        <div>
          <span>% USED</span>
          <strong>{pctUsed != null ? `${pctUsed}%` : '—'}</strong>
        </div>
      </div>
    </section>
  );
}

function AdminBlockchainStorageSection({ blockchainState }) {
  if (!blockchainState) return null;
  const { bytes_used: bytesUsed, max_storable_bytes_on_same_volume: maxBytes, volume_available_bytes: availBytes } =
    blockchainState;
  if (typeof bytesUsed !== 'number' || typeof maxBytes !== 'number' || typeof availBytes !== 'number') return null;

  const usedGb = formatGb(bytesUsed);
  const maxGb = formatGb(maxBytes);
  const availGb = formatGb(availBytes);
  const availPct = formatPct(availBytes, maxBytes);

  if (usedGb == null || maxGb == null || availGb == null) return null;

  return (
    <section className="explorer-page__section">
      <h2>
        <span /> BLOCKCHAIN STORAGE
      </h2>
      <div className="explorer-page__kv-grid">
        <div>
          <span>GB USED</span>
          <strong>{usedGb} GB</strong>
        </div>
        <div>
          <span>MAX STORAGE GB ON SAME VOLUME</span>
          <strong>{maxGb} GB</strong>
        </div>
        <div>
          <span>AVAILABLE GB</span>
          <strong>
            {availGb} GB ({availPct != null ? `${availPct}%` : '—'})
          </strong>
        </div>
      </div>
    </section>
  );
}

function SingleValidatorPage() {
  const { address } = useParams();
  const navigate = useNavigate();
  const decodedAddress = address ? decodeURIComponent(address) : null;
  const normalizedParam = normalizeAccountAddress(decodedAddress);

  const { allProviders, loading: providersLoading, error: providersError } = useCapacityProviders();

  const provider = normalizedParam
    ? allProviders.find((p) => normalizeAccountAddress(p.address) === normalizedParam)
    : null;

  const adminStatusUrl = getValidatorAdminStatusUrl(decodedAddress);

  const [adminPayload, setAdminPayload] = useState(null);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminError, setAdminError] = useState(null);

  useEffect(() => {
    if (!adminStatusUrl) {
      setAdminPayload(null);
      setAdminLoading(false);
      setAdminError(null);
      return;
    }

    const ac = new AbortController();
    setAdminLoading(true);
    setAdminError(null);
    setAdminPayload(null);

    fetch(adminStatusUrl, { signal: ac.signal, credentials: 'omit' })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        setAdminPayload(data);
        setAdminError(null);
      })
      .catch((err) => {
        if (err.name === 'AbortError') return;
        setAdminPayload(null);
        setAdminError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        if (!ac.signal.aborted) setAdminLoading(false);
      });

    return () => ac.abort();
  }, [adminStatusUrl]);

  const { data: rewardsData, loading: rewardsLoading, error: rewardsError } = useVerifiedProofRewards(normalizedParam);

  if (providersLoading) {
    return (
      <Box className="explorer-page__state">
        <Skeleton height="200px" />
      </Box>
    );
  }

  if (providersError) {
    return (
      <Box className="explorer-page__state explorer-page__state--error">
        Error: {providersError}
      </Box>
    );
  }

  if (!provider && !adminStatusUrl) {
    return (
      <Box className="explorer-page__state">
        <Text className="explorer-page__state--error">Capacity provider not found</Text>
      </Box>
    );
  }

  const displayAddress = provider?.address ?? decodedAddress;

  return (
    <Box className="explorer-page">
      <HStack className="explorer-page__crumbs" spacing={4}>
        <Link as={RouterLink} to="/" className="explorer-page__crumb-link">
          ← Explorer
        </Link>
        <Link as={RouterLink} to="/validators" className="explorer-page__crumb-sep">
          Validators
        </Link>
        <Text className="explorer-page__crumb-current">{displayAddress}</Text>
      </HStack>

      <Heading as="h1" className="explorer-page__title">
        CAPACITY PROVIDER
      </Heading>

      {provider && (
        <section className="explorer-page__section">
          <h2>
            <span /> ON-CHAIN INFORMATION
          </h2>
          <div className="explorer-page__kv-grid">
            <div>
              <span>ADDRESS</span>
              <strong className="explorer-page__mono">
                <Link
                  onClick={() =>
                    navigate(`/account/${normalizeAccountAddress(provider.address) || provider.address}`)
                  }
                  className="explorer-page__clickable explorer-page__mono"
                >
                  {provider.address}
                </Link>
              </strong>
            </div>
            {provider.stake !== undefined && (
              <div>
                <span>STAKE</span>
                <strong>
                  {typeof provider.stake === 'number' ? provider.stake.toLocaleString() : provider.stake}
                </strong>
              </div>
            )}
            {provider.storage_capacity !== undefined && (
              <div>
                <span>STORAGE CAPACITY</span>
                <strong>
                  {typeof provider.storage_capacity === 'number'
                    ? provider.storage_capacity.toLocaleString()
                    : provider.storage_capacity}
                </strong>
              </div>
            )}
            {provider.chunk_count !== undefined && (
              <div>
                <span>CHUNK COUNT</span>
                <strong>
                  {typeof provider.chunk_count === 'number'
                    ? provider.chunk_count.toLocaleString()
                    : provider.chunk_count}
                </strong>
              </div>
            )}
            {provider.merkle_root && (
              <div>
                <span>MERKLE ROOT</span>
                <strong className="explorer-page__mono">{provider.merkle_root}</strong>
              </div>
            )}
            {provider.registered_at !== undefined && (
              <div>
                <span>REGISTERED AT</span>
                <strong>{provider.registered_at}</strong>
              </div>
            )}
            {provider.registration_duration !== undefined && (
              <div>
                <span>REGISTRATION DURATION</span>
                <strong>
                  {typeof provider.registration_duration === 'number'
                    ? provider.registration_duration.toLocaleString()
                    : provider.registration_duration}
                </strong>
              </div>
            )}
            {(() => {
              const createdBlock =
                provider.registered_at_block ??
                provider.created_at_block ??
                (typeof provider.registered_at === 'number'
                  ? provider.registered_at
                  : Number(provider.registered_at));
              const duration = Number(provider.registration_duration);
              const expirationBlock =
                !Number.isNaN(createdBlock) && !Number.isNaN(duration) ? createdBlock + duration : null;
              return expirationBlock != null ? (
                <div>
                  <span>EXPIRATION BLOCK</span>
                  <strong>{expirationBlock.toLocaleString()}</strong>
                </div>
              ) : null;
            })()}
          </div>
        </section>
      )}

      {ENABLE_VALIDATOR_ADMIN_STATUS && !provider && adminStatusUrl && (
        <section className="explorer-page__section">
          <h2>
            <span /> ADDRESS
          </h2>
          <div className="explorer-page__kv-grid">
            <div>
              <span>CAPACITY WALLET</span>
              <strong className="explorer-page__mono">
                <Link
                  onClick={() =>
                    navigate(`/account/${normalizeAccountAddress(displayAddress) || displayAddress}`)
                  }
                  className="explorer-page__clickable explorer-page__mono"
                >
                  {displayAddress}
                </Link>
              </strong>
            </div>
          </div>
        </section>
      )}

      {normalizedParam && (
        <section className="explorer-page__section">
          <h2>
            <span /> VERIFIED PROOF REWARDS
          </h2>
          <div className="explorer-page__kv-grid">
            {rewardsLoading && <Skeleton height="24px" />}
            {!rewardsLoading && rewardsError && (
              <div>
                <span>STATUS</span>
                <strong className="explorer-page__state--error" style={{ fontWeight: 400 }}>
                  {rewardsError}
                </strong>
              </div>
            )}
            {!rewardsLoading && !rewardsError && rewardsData != null && (
              <>
                <div>
                  <span>TOTAL REWARDS (STORAGE)</span>
                  <strong>{formatELDAmount(rewardsData.total_rewards)}</strong>
                </div>
                {typeof rewardsData.successful_proofs === 'number' && Number.isFinite(rewardsData.successful_proofs) && (
                  <div>
                    <span>SUCCESSFUL PROOFS</span>
                    <strong>{rewardsData.successful_proofs.toLocaleString()}</strong>
                  </div>
                )}
                {typeof rewardsData.from_height === 'number' &&
                  typeof rewardsData.to_height === 'number' &&
                  Number.isFinite(rewardsData.from_height) &&
                  Number.isFinite(rewardsData.to_height) && (
                    <div>
                      <span>AGGREGATION RANGE (BLOCKS)</span>
                      <strong>
                        {rewardsData.from_height.toLocaleString()}–{rewardsData.to_height.toLocaleString()}
                      </strong>
                    </div>
                  )}
              </>
            )}
          </div>
        </section>
      )}

      {ENABLE_VALIDATOR_ADMIN_STATUS && (
        <section className="explorer-page__section">
          <h2>
            <span /> ADMIN STATUS
          </h2>
          <Box p={4}>
            {!adminStatusUrl && (
              <Text fontSize="sm" className="explorer-page__muted">
                No admin status URL is configured for this validator address in the environment map.
              </Text>
            )}
            {adminStatusUrl && (
              <>
                <Text fontSize="xs" className="explorer-page__muted" mb={3} wordBreak="break-all">
                  Source: {adminStatusUrl}
                </Text>
                {adminLoading && <Skeleton height="120px" />}
                {!adminLoading && adminError && (
                  <Text className="explorer-page__state--error" fontSize="sm">
                    Failed to load admin status: {adminError}
                  </Text>
                )}
              </>
            )}
          </Box>
        </section>
      )}

      {ENABLE_VALIDATOR_ADMIN_STATUS && adminStatusUrl && !adminLoading && !adminError && adminPayload != null && (
        <>
          <AdminSlotsSection capacity={adminPayload.capacity} />
          <AdminHostStorageSection host={adminPayload.host} />
          <AdminBlockchainStorageSection blockchainState={adminPayload.blockchain_state} />
          <section className="explorer-page__section">
            <h2>
              <span /> JSON
            </h2>
            <Box p={4}>
              <AsciiBox p={4} className="explorer-page__card">
                <pre className="explorer-page__mono" style={{ margin: 0, whiteSpace: 'pre-wrap', overflowX: 'auto' }}>
                  {JSON.stringify(adminPayload, null, 2)}
                </pre>
              </AsciiBox>
            </Box>
          </section>
        </>
      )}
    </Box>
  );
}

export default SingleValidatorPage;
