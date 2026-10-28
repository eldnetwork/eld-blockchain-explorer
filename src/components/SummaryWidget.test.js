import { ChakraProvider } from '@chakra-ui/react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import SummaryWidget from './SummaryWidget';
import useSummary from '../hooks/useSummary';

vi.mock('../hooks/useSummary', () => ({
  default: vi.fn(),
}));

const summary = {
  end_height: '5160',
  summary_hash: '1614418390D4A72622502E1941FB8B896D8F1A14AF50B0F3845053AF72932DC9',
  last_block_id: {
    hash: 'FDF22E158093497B86D5A59314B0117E37BA96318A18B665DF6D0A6041A83448',
    parts: {
      total: 1,
      hash: '49AB1D0ABEC88555BC5F9D03FDEAB8F6450F79B9322BC49EB52FBD368C6C03B4',
    },
  },
  last_results_hash: 'E3B0C44298FC1C149AFBF4C8996FB92427AE41E4649B934CA495991B7852B855',
  app_hash: 'E416AB84297B29615B0A93C828462CB4F0E8358C897A9B3B8701B720503C5C75',
  body_hash: '9CD7DB342906449EE27C108531657AB58A403806AC84CBF3645AC40489B7E35F',
  validators_hash: '94E8C3C0A6C6708C561289B9A982094C3B0EBC0EAEEBDC1699AD4FBF9D4DF6BA',
  next_validators_hash: '94E8C3C0A6C6708C561289B9A982094C3B0EBC0EAEEBDC1699AD4FBF9D4DF6BA',
  consensus_hash: '048091BC7DDC283F77BFBF91D73C44DA58C3DF8A9CBC867405D8B7F3DAADA22F',
  last_height_validators_changed: '5162',
  last_height_consensus_params_changed: '1',
  validators: {
    validators: [
      {
        address: '00B808B6728B30E5AC2B3A0F3250BD53D0D09354',
        voting_power: 10,
      },
      {
        address: '455F0F6AEE86BCA17A2C6A3E5543C0D836CB303C',
        voting_power: 10,
      },
    ],
    proposer: { address: '00B808B6728B30E5AC2B3A0F3250BD53D0D09354' },
  },
  next_validators: {
    validators: [
      {
        address: '455F0F6AEE86BCA17A2C6A3E5543C0D836CB303C',
        voting_power: 10,
      },
    ],
    proposer: { address: '455F0F6AEE86BCA17A2C6A3E5543C0D836CB303C' },
  },
  consensus_params: {
    block: { max_bytes: '22020096', max_gas: '-1', time_iota_ms: '1000' },
    evidence: {
      max_age_num_blocks: '100000',
      max_age_duration: '172800000000000',
      max_bytes: '1048576',
    },
    validator: { pub_key_types: ['ed25519'] },
    version: { app_version: '0' },
  },
};

function renderWidget() {
  return render(
    <ChakraProvider>
      <MemoryRouter>
        <SummaryWidget />
      </MemoryRouter>
    </ChakraProvider>,
  );
}

describe('SummaryWidget', () => {
  test('shows the summary header', () => {
    useSummary.mockReturnValue({ summary, error: null, isInitialLoad: false });
    renderWidget();

    expect(screen.getByRole('heading', { name: 'Summary' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '5160' })).toHaveAttribute('href', '/block/5160');
    expect(screen.getByRole('link', { name: '5162' })).toHaveAttribute('href', '/block/5162');
    expect(screen.getByRole('link', { name: '1' })).toHaveAttribute('href', '/block/1');
    expect(screen.getByText(summary.summary_hash)).toBeInTheDocument();
    expect(screen.getByText(summary.last_block_id.hash)).toBeInTheDocument();
    expect(screen.getByText(`1 part · ${summary.last_block_id.parts.hash}`)).toBeInTheDocument();
    expect(screen.getByText('22,020,096')).toBeInTheDocument();
    expect(screen.getByText('2 days')).toHaveAttribute('title', '172800000000000');
    expect(screen.getByText('ed25519')).toBeInTheDocument();

    const proposer = screen.getByRole('link', {
      name: /00B808B6728B30E5AC2B3A0F3250BD53D0D09354/,
    });
    expect(proposer).toHaveAttribute(
      'href',
      '/validator/0x00b808b6728b30e5ac2b3a0f3250bd53d0d09354',
    );
    expect(proposer.parentElement).toHaveTextContent('proposer');
  });

  test('says when no summary header is stored', () => {
    useSummary.mockReturnValue({ summary: null, error: null, isInitialLoad: false });
    renderWidget();
    expect(screen.getByText('No summary header is stored yet.')).toBeInTheDocument();
  });

  test('shows a load error', () => {
    useSummary.mockReturnValue({
      summary: null,
      error: 'Internal error',
      isInitialLoad: false,
    });
    renderWidget();
    expect(screen.getByText('Error: Internal error')).toBeInTheDocument();
  });
});
