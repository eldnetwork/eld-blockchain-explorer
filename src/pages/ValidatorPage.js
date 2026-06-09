import React from 'react';
import { useParams, Link as RouterLink, useNavigate } from 'react-router-dom';
import { Box, Heading, Text, HStack, Skeleton, Link } from '@chakra-ui/react';
import useValidators from '../hooks/useValidators';
import { normalizeAccountAddress } from '../utils/accountAddress';
import './ExplorerDataPages.css';

function ValidatorPage() {
  const { address } = useParams();
  const navigate = useNavigate();
  const decodedAddress = address ? decodeURIComponent(address) : null;
  
  const { validators, loading: validatorsLoading, error: validatorsError } = useValidators();

  // Find the specific validator
  const validator = validators.find(v => v.address === decodedAddress);

  if (validatorsLoading) {
    return (
      <Box className="explorer-page__state">
        <Skeleton height="200px" />
      </Box>
    );
  }

  if (validatorsError) {
    return (
      <Box className="explorer-page__state explorer-page__state--error">
        Error: {validatorsError}
      </Box>
    );
  }

  if (!validator) {
    return (
      <Box className="explorer-page__state">
        <Text className="explorer-page__state--error">Validator not found</Text>
      </Box>
    );
  }

  return (
    <Box className="explorer-page">
      <HStack className="explorer-page__crumbs" spacing={4}>
        <Link as={RouterLink} to="/" className="explorer-page__crumb-link">← Explorer</Link>
        <Link as={RouterLink} to="/validators" className="explorer-page__crumb-sep">Validators</Link>
        <Text className="explorer-page__crumb-current">{decodedAddress}</Text>
      </HStack>

      <Heading as="h1" className="explorer-page__title">
        VALIDATOR DETAILS
      </Heading>

      <section className="explorer-page__section">
        <h2><span /> VALIDATOR INFORMATION</h2>
        <div className="explorer-page__kv-grid">
          <div>
            <span>ADDRESS</span>
            <strong className="explorer-page__mono">
              <Link onClick={() => navigate(`/account/${normalizeAccountAddress(validator.address) || validator.address}`)} className="explorer-page__clickable explorer-page__mono">
                {validator.address}
              </Link>
            </strong>
          </div>
            {validator.stake !== undefined && (
              <div>
                <span>STAKE</span>
                <strong>
                  {typeof validator.stake === 'number' ? validator.stake.toLocaleString() : validator.stake}
                </strong>
              </div>
            )}
            {validator.pub_key && (
              <div>
                <span>PUBLIC KEY</span>
                <strong className="explorer-page__mono">{validator.pub_key}</strong>
              </div>
            )}
            {validator.voting_power !== undefined && (
              <div>
                <span>VOTING POWER</span>
                <strong>
                  {typeof validator.voting_power === 'number' ? validator.voting_power.toLocaleString() : validator.voting_power}
                </strong>
              </div>
            )}
            {Object.entries(validator).map(([key, value]) => {
              // Skip already displayed fields
              if (['address', 'stake', 'pub_key', 'voting_power'].includes(key)) {
                return null;
              }
              
              // Skip null/undefined values
              if (value === null || value === undefined) {
                return null;
              }

              return (
                <div key={key}>
                  <span>{key.replace(/_/g, ' ').toUpperCase()}</span>
                  <strong className={typeof value === 'object' ? 'explorer-page__mono' : undefined}>
                    {typeof value === 'object' ? (
                      JSON.stringify(value, null, 2)
                    ) : (
                      /(address|owner|signer|sender|recipient|account)/i.test(key) ? (
                        <Link onClick={() => navigate(`/account/${normalizeAccountAddress(String(value)) || String(value)}`)} className="explorer-page__clickable explorer-page__mono">
                          {String(value)}
                        </Link>
                      ) : (
                        String(value)
                      )
                    )}
                  </strong>
                </div>
              );
            })}
        </div>
      </section>
    </Box>
  );
}

export default ValidatorPage;

