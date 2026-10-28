import { Link as RouterLink } from 'react-router-dom';
import { Box, Heading, Skeleton, Text } from '@chakra-ui/react';
import useSummary from '../hooks/useSummary';
import { normalizeAccountAddress } from '../utils/accountAddress';

const HASH_FIELDS = [
  ['summary_hash', 'Summary hash'],
  ['last_results_hash', 'Last results hash'],
  ['app_hash', 'App hash'],
  ['body_hash', 'Body hash'],
  ['validators_hash', 'Validators hash'],
  ['next_validators_hash', 'Next validators hash'],
  ['consensus_hash', 'Consensus hash'],
];

function heightPath(height) {
  if (typeof height !== 'string' || !/^\d+$/.test(height)) return null;
  return `/block/${height}`;
}

function groupInteger(value) {
  const text = String(value);
  if (!/^-?\d+$/.test(text)) return text;
  const negative = text.startsWith('-');
  const digits = negative ? text.slice(1) : text;
  const grouped = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return negative ? `-${grouped}` : grouped;
}

function formatDuration(value) {
  const text = String(value);
  if (!/^\d+$/.test(text)) return text;
  const ns = BigInt(text);
  const nsPerSecond = 1000000000n;
  if (ns % nsPerSecond !== 0n) return text;
  const seconds = ns / nsPerSecond;
  if (seconds % 86400n === 0n) {
    const days = seconds / 86400n;
    return days === 1n ? '1 day' : `${days} days`;
  }
  if (seconds % 3600n === 0n) {
    const hours = seconds / 3600n;
    return hours === 1n ? '1 hour' : `${hours} hours`;
  }
  if (seconds % 60n === 0n) {
    const minutes = seconds / 60n;
    return minutes === 1n ? '1 minute' : `${minutes} minutes`;
  }
  return seconds === 1n ? '1 second' : `${seconds} seconds`;
}

function partCountLabel(total) {
  if (total == null || total === '') return null;
  const text = String(total);
  return text === '1' ? '1 part' : `${text} parts`;
}

function sameAddress(left, right) {
  return (
    typeof left === 'string' &&
    typeof right === 'string' &&
    left.toLowerCase() === right.toLowerCase()
  );
}

function validatorSet(value) {
  if (Array.isArray(value)) return { validators: value, proposer: null };
  if (value && typeof value === 'object' && Array.isArray(value.validators)) {
    const proposer = value.proposer?.address;
    return {
      validators: value.validators,
      proposer: typeof proposer === 'string' ? proposer : null,
    };
  }
  return { validators: [], proposer: null };
}

function consensusFields(params) {
  if (!params || typeof params !== 'object') return [];
  const block = params.block && typeof params.block === 'object' ? params.block : {};
  const evidence = params.evidence && typeof params.evidence === 'object' ? params.evidence : {};
  const validator =
    params.validator && typeof params.validator === 'object' ? params.validator : {};
  const version = params.version && typeof params.version === 'object' ? params.version : {};
  /** @type {{ label: string, value: string, title?: string }[]} */
  const fields = [];

  if (block.max_bytes != null) {
    fields.push({ label: 'Max bytes', value: groupInteger(block.max_bytes) });
  }
  if (block.max_gas != null) {
    fields.push({ label: 'Max gas', value: groupInteger(block.max_gas) });
  }
  if (block.time_iota_ms != null) {
    fields.push({ label: 'Time iota', value: `${groupInteger(block.time_iota_ms)} ms` });
  }
  if (evidence.max_age_num_blocks != null) {
    fields.push({
      label: 'Evidence max blocks',
      value: `${groupInteger(evidence.max_age_num_blocks)} blocks`,
    });
  }
  if (evidence.max_age_duration != null) {
    fields.push({
      label: 'Evidence max age',
      value: formatDuration(evidence.max_age_duration),
      title: String(evidence.max_age_duration),
    });
  }
  if (evidence.max_bytes != null) {
    fields.push({ label: 'Evidence max bytes', value: groupInteger(evidence.max_bytes) });
  }
  if (Array.isArray(validator.pub_key_types)) {
    fields.push({
      label: 'Pub key types',
      value: validator.pub_key_types.join(', ') || 'N/A',
    });
  }
  if (version.app_version != null) {
    fields.push({ label: 'App version', value: String(version.app_version) });
  }
  return fields;
}

function HeightLink({ height }) {
  const path = heightPath(height);
  if (!path) {
    return <span className="explorer-home__summary-height-value">{height ?? 'N/A'}</span>;
  }
  return (
    <RouterLink className="explorer-home__summary-height-value" to={path}>
      {height}
    </RouterLink>
  );
}

function HashValue({ value }) {
  if (typeof value !== 'string' || value === '') return 'N/A';
  return <span className="explorer-home__summary-mono">{value}</span>;
}

function BlockIdValue({ blockId }) {
  if (!blockId || typeof blockId !== 'object') return 'N/A';
  const hash = typeof blockId.hash === 'string' && blockId.hash ? blockId.hash : 'N/A';
  const parts = blockId.parts && typeof blockId.parts === 'object' ? blockId.parts : null;
  const partLabel = parts ? partCountLabel(parts.total) : null;
  const partsHash = parts && typeof parts.hash === 'string' ? parts.hash : '';
  return (
    <>
      <span className="explorer-home__summary-mono">{hash}</span>
      {partLabel || partsHash ? (
        <span className="explorer-home__summary-sub">
          {partLabel}
          {partLabel && partsHash ? ' · ' : ''}
          {partsHash}
        </span>
      ) : null}
    </>
  );
}

function ValidatorTable({ title, set }) {
  const { validators, proposer } = validatorSet(set);
  return (
    <table className="explorer-home__summary-table">
      <caption>
        {title}
        <span>{validators.length}</span>
      </caption>
      <thead>
        <tr>
          <th scope="col">Address</th>
          <th scope="col">Power</th>
        </tr>
      </thead>
      <tbody>
        {validators.length === 0 ? (
          <tr>
            <td colSpan={2}>None</td>
          </tr>
        ) : (
          validators.map((validator, index) => {
            const address = typeof validator?.address === 'string' ? validator.address : '';
            const account = normalizeAccountAddress(address);
            const power = validator?.voting_power;
            return (
              <tr key={`${address || 'validator'}-${index}`}>
                <td>
                  {account ? (
                    <RouterLink to={`/validator/${encodeURIComponent(account)}`}>
                      {address}
                    </RouterLink>
                  ) : (
                    <span className="explorer-home__summary-mono">{address || 'N/A'}</span>
                  )}
                  {sameAddress(address, proposer) ? (
                    <span className="explorer-home__summary-proposer">proposer</span>
                  ) : null}
                </td>
                <td>{power == null || power === '' ? 'N/A' : String(power)}</td>
              </tr>
            );
          })
        )}
      </tbody>
    </table>
  );
}

function SummaryBody({ summary }) {
  const params = consensusFields(summary.consensus_params);
  return (
    <div className="explorer-home__summary-body">
      <div className="explorer-home__summary-heights">
        <div className="explorer-home__summary-height">
          <span className="explorer-home__stat-label">End height</span>
          <HeightLink height={summary.end_height} />
        </div>
        <div className="explorer-home__summary-height">
          <span className="explorer-home__stat-label">Validators changed</span>
          <HeightLink height={summary.last_height_validators_changed} />
        </div>
        <div className="explorer-home__summary-height">
          <span className="explorer-home__stat-label">Consensus params changed</span>
          <HeightLink height={summary.last_height_consensus_params_changed} />
        </div>
      </div>

      <div className="explorer-home__summary-row">
        <span className="explorer-home__summary-label">Last block id</span>
        <div className="explorer-home__summary-value">
          <BlockIdValue blockId={summary.last_block_id} />
        </div>
      </div>
      {HASH_FIELDS.map(([key, label]) => (
        <div className="explorer-home__summary-row" key={key}>
          <span className="explorer-home__summary-label">{label}</span>
          <div className="explorer-home__summary-value">
            <HashValue value={summary[key]} />
          </div>
        </div>
      ))}

      <div className="explorer-home__summary-sets">
        <ValidatorTable title="Validators" set={summary.validators} />
        <ValidatorTable title="Next validators" set={summary.next_validators} />
      </div>

      {params.length > 0 ? (
        <div className="explorer-home__summary-params">
          {params.map((field, index) => (
            <div className="explorer-home__summary-param" key={`${field.label}-${index}`}>
              <span>{field.label}</span>
              <strong title={field.title}>{field.value}</strong>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function SummaryWidget() {
  const { summary, error, isInitialLoad } = useSummary();

  return (
    <Box as="section" className="explorer-home__summary" aria-label="Summary">
      <Heading
        className="explorer-home__list-title"
        as="h2"
        size="lg"
        lineHeight="1.2"
        mt={0}
        mb={4}
      >
        Summary
      </Heading>
      {isInitialLoad ? (
        <div
          className="explorer-home__summary-body explorer-home__summary-body--padded"
          aria-busy="true"
        >
          <Skeleton height="72px" />
          <Skeleton height="18px" mt={4} />
          <Skeleton height="18px" mt={3} />
          <Skeleton height="18px" mt={3} />
        </div>
      ) : error && !summary ? (
        <div className="explorer-home__summary-body explorer-home__summary-body--padded">
          <Text className="explorer-home__summary-error">Error: {error}</Text>
        </div>
      ) : !summary ? (
        <div className="explorer-home__summary-body explorer-home__summary-body--padded">
          <Text className="explorer-home__summary-empty">No summary header is stored yet.</Text>
        </div>
      ) : (
        <SummaryBody summary={summary} />
      )}
    </Box>
  );
}

export default SummaryWidget;
