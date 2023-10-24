import React, { useCallback, useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { clusterApiUrl, Connection, PublicKey } from '@solana/web3.js';

import {
  detectPhantomMultiChainProvider,
  getChainName, hexToRGB,
  signMessageOnEthereum,
  signMessageOnSolana,
} from './utils';

import { PhantomInjectedProvider, SupportedChainIcons, SupportedEVMChainIds, TLog } from './types';

import { NoProvider } from './components';
import { connect, silentlyConnect } from './utils/connect';
import { setupEvents } from './utils/setupEvents';
import { ensureEthereumChain } from './utils/ensureEthereumChain';
import { useEthereumSelectedAddress } from './utils/getEthereumSelectedAddress';
import { DARK_GRAY, GRAY, PURPLE, REACT_GRAY, WHITE } from './constants';
import Button from './components/Button';

// =============================================================================
// Constants
// =============================================================================

const solanaNetwork = clusterApiUrl('devnet');
// NB: This URL will only work for Phantom sandbox apps! Please do not use this for your project. If you are running this locally we recommend using one of Solana's public RPC endpoints
// const solanaNetwork = 'https://phantom-phantom-f0ad.mainnet.rpcpool.com/';
const connection = new Connection(solanaNetwork);
const message = 'c5c1edfc94623bd5b2a7c5b8acb15599d3908f95ab3f8bf00ee40e786831781d';

// =============================================================================
// Typedefs
// =============================================================================

export type ConnectedAccounts = {
  solana: PublicKey | null;
  ethereum: string | null;
};

export type ConnectedMethods =
  | {
      chain: string;
      name: string;
      onClick: (props?: any) => Promise<string>;
    }
  | {
      chain: string;
      name: string;
      onClick: (chainId?: any) => Promise<void | boolean>;
    };

interface Props {
  connectedAccounts: ConnectedAccounts;
  connectedMethods: ConnectedMethods[];
  handleConnect: () => Promise<void>;
  logs: TLog[];
  clearLogs: () => void;
}

// =============================================================================
// Hooks
// =============================================================================
/**
 * @DEVELOPERS
 * The fun stuff!
 */
const useProps = (provider: PhantomInjectedProvider | null): Props => {
  /** Logs to display in the Sandbox console */
  const [logs, setLogs] = useState<TLog[]>([]);

  const createLog = useCallback(
    (log: TLog) => {
      return setLogs((logs) => [...logs, log]);
    },
    [setLogs]
  );

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, [setLogs]);

  const [ethereumSelectedAddress, setEthereumSelectedAddress] = useEthereumSelectedAddress(provider?.ethereum);

  /** Side effects to run once providers are detected */
  useEffect(() => {
    if (!provider) return;
    const { solana, ethereum } = provider;

    // attempt to eagerly connect on initial startup
    silentlyConnect({ solana, ethereum }, createLog);
    setupEvents({ solana, ethereum }, createLog, setEthereumSelectedAddress);

    return () => {
      solana.disconnect();
    };
  }, [provider, createLog, setEthereumSelectedAddress]);

  /** Connect to both Solana and Ethereum Providers */
  const handleConnect = useCallback(async () => {
    if (!provider) return;
    const { solana, ethereum } = provider;

    await connect({ solana, ethereum }, createLog);

    // Immediately switch to Ethereum Goerli for Sandbox purposes
    await ensureEthereumChain(ethereum, SupportedEVMChainIds.EthereumGoerli);
  }, [provider]);

  /**
   * Switch Ethereum Chains
   * When a user connects to a dApp, Phantom considers them connected on all chains
   * When the Ethereum provider's chainId is changed, Phantom will not prompt the user for approval
   * */
  const isEthereumChainIdReady = useCallback(
    async (chainId: SupportedEVMChainIds) => {
      if (!provider) return false;
      const { ethereum } = provider;
      return await ensureEthereumChain(ethereum, chainId);
    },
    [provider]
  );

  const handleSignMessageOnSolana = useCallback(async () => {
    if (!provider) return;
    const { solana } = provider;
    try {
      const signedMessage = await signMessageOnSolana(solana, message);
      console.log("Signed on solana " + JSON.stringify(signedMessage));
      return signedMessage;
    } catch (error) {
      console.log("Error on solana " + error.message);
    }
  }, [provider]);

  const handleSignMessageOnEthereum = useCallback(
    async (chainId) => {
      // set ethereum provider to the correct chainId
      const ready = await isEthereumChainIdReady(chainId);
      if (!ready) return;
      const { ethereum } = provider;
      try {
        const signedMessage = await signMessageOnEthereum(ethereum, message);
        console.log("Signed on Ethereum " + JSON.stringify(signedMessage));
        return signedMessage;
      } catch (error) {
        console.log("Error on Ethereum " + error.message);
      }
    },
    [provider, isEthereumChainIdReady]
  );

  /**
   * Disconnect from Solana
   * At this time, there is no way to programmatically disconnect from Ethereum
   * MULTI-CHAIN PROVIDER TIP: You can only disconnect on the solana provider. But after when disconnecting your should use the
   * multi-chain connect method to reconnect.
   */
  const handleDisconnect = useCallback(async () => {
    if (!provider) return;
    const { solana } = provider;
    try {
      await solana.disconnect();
    } catch (error) {
      console.log("Error during Solana disconnection " + error.message);
    }
  }, [provider]);

  const connectedMethods = useMemo(() => {
    return [
      {
        chain: 'solana',
        name: 'Sign Message',
        onClick: handleSignMessageOnSolana,
      },
      {
        chain: 'ethereum',
        name: 'Sign Message',
        onClick: handleSignMessageOnEthereum,
      },
      {
        chain: 'solana',
        name: 'Disconnect',
        onClick: handleDisconnect,
      },
    ];
  }, [
    handleSignMessageOnSolana,
    handleSignMessageOnEthereum,
    handleDisconnect,
  ]);

  return {
    connectedAccounts: {
      solana: provider?.solana?.publicKey,
      ethereum: ethereumSelectedAddress,
    },
    connectedMethods,
    handleConnect,
    logs,
    clearLogs,
  };
};

// =============================================================================
// Stateless Component
// =============================================================================

const StatelessApp = React.memo((props: Props) => {
  const { connectedAccounts, connectedMethods, handleConnect } = props;

  const ethereumChainName = 'Ethereum Goerli';
  const polygonChainName = 'Polygon Mumbai';
  const solanaChainName = 'Solana Devnet';
  const ethereumChainId = '0x5';
  const polygonChainId = '0x13881';

  const Main = styled.main`
  position: relative;
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 20px;
  align-items: center;
  background-color: ${REACT_GRAY};

  > * {
    margin-bottom: 10px;
  }

  @media (max-width: 768px) {
    width: 100%;
    height: auto;
  }
`;

  const Body = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;

  button {
    margin-bottom: 15px;
  }
`;

  const Link = styled.a.attrs({
    href: 'https://phantom.app/',
    target: '_blank',
    rel: 'noopener noreferrer',
  })`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  text-decoration: none;
  margin-bottom: 15px;
  // margin-bottom: 30px;
  padding: 5px;

  &:focus-visible {
    outline: 2px solid ${hexToRGB(GRAY, 0.5)};
    border-radius: 6px;
  }
`;

  const Subtitle = styled.h5`
  color: ${GRAY};
  font-weight: 400;
`;

  const Pre = styled.pre`
  margin-bottom: 5px;
  margin-right: auto;
`;

  const AccountRow = styled.div`
  display: flex;
  margin-bottom: 8px;

  :last-of-type {
    margin-bottom: 0;
  }
`;

  const Badge = styled.div`
  margin: 0;
  padding: 10px;
  width: 100%;
  color: ${PURPLE};
  background-color: ${hexToRGB(PURPLE, 0.2)};
  font-size: 14px;
  border-radius: 0 6px 6px 0;
  @media (max-width: 400px) {
    width: 280px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  @media (max-width: 320px) {
    width: 220px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  ::selection {
    color: ${WHITE};
    background-color: ${hexToRGB(PURPLE, 0.5)};
  }

  ::-moz-selection {
    color: ${WHITE};
    background-color: ${hexToRGB(PURPLE, 0.5)};
  }
`;

  const Divider = styled.div`
  border: 1px solid ${DARK_GRAY};
  height: 1px;
  margin: 20px 0;
`;

  const Tag = styled.p`
  text-align: center;
  color: ${GRAY};

  a {
    color: ${PURPLE};
    text-decoration: none;

    ::selection {
      color: ${WHITE};
      background-color: ${hexToRGB(PURPLE, 0.5)};
    }

    ::-moz-selection {
      color: ${WHITE};
      background-color: ${hexToRGB(PURPLE, 0.5)};
    }
  }

  @media (max-width: 320px) {
    font-size: 14px;
  }

  ::selection {
    color: ${WHITE};
    background-color: ${hexToRGB(PURPLE, 0.5)};
  }

  ::-moz-selection {
    color: ${WHITE};
    background-color: ${hexToRGB(PURPLE, 0.5)};
  }
`;

  const ChainIcon = styled.img`
  height: ${(props) => props.height};
  width: ${(props) => props.height};
  border-radius: 6px 0 0 6px;
`;

  const ChainHeader = styled.div`
  display: flex;
  width: 100%;
  justify-content: flex-start;
  align-items: center;
  margin: 5px 0 10px;
`;

  return (
    <Main>
      <Body>
        <Link>
        </Link>
        {connectedAccounts?.solana ? (
          // connected
          <>
            <div>
              <Pre>Connected as</Pre>
              <AccountRow>
                <ChainIcon src={SupportedChainIcons.Ethereum} height="36px" />
                <Badge>{connectedAccounts?.ethereum}</Badge>
              </AccountRow>
              <AccountRow>
                <ChainIcon src={SupportedChainIcons.Polygon} height="36px" />
                <Badge>{connectedAccounts?.ethereum}</Badge>
              </AccountRow>
              <AccountRow>
                <ChainIcon src={SupportedChainIcons.Solana} height="36px" />
                <Badge>{connectedAccounts?.solana?.toBase58()}</Badge>
              </AccountRow>
              <Divider />
            </div>
            <ChainHeader>
              <ChainIcon
                src={SupportedChainIcons.Ethereum}
                height="16px"
                style={{ marginRight: '6px', borderRadius: '6px' }}
              />
              <Tag>{ethereumChainName}</Tag>
            </ChainHeader>
            {connectedMethods
              .filter((method) => method.chain === 'ethereum')
              .map((method, i) => (
                  <Button
                      data-test-id={`ethereum-goerli-${method.name}`}
                      key={`${method.name}-${i}`}
                      onClick={() => method.onClick(ethereumChainId)}
                  >
                    {method.name}
                  </Button>
              ))}
            <ChainHeader>
              <ChainIcon
                src={SupportedChainIcons.Polygon}
                height="16px"
                style={{ marginRight: '6px', borderRadius: '6px' }}
              />
              <Tag>{polygonChainName}</Tag>
            </ChainHeader>
            {connectedMethods
              .filter((method) => method.chain === 'ethereum')
              .map((method, i) => (
                <Button
                  data-test-id={`polygon-mumbai-${method.name}`}
                  key={`${method.name}-${i}`}
                  onClick={() => method.onClick(polygonChainId)}
                >
                  {method.name}
                </Button>
              ))}
            <ChainHeader>
              <ChainIcon
                src={SupportedChainIcons.Solana}
                height="16px"
                style={{ marginRight: '6px', borderRadius: '6px' }}
              />
              <Tag>{solanaChainName}</Tag>
            </ChainHeader>
            {connectedMethods
              .filter((method) => method.chain === 'solana')
              .map((method, i) => (
                <Button data-test-id={`solana-${method.name}`} key={`${method.name}-${i}`} onClick={method.onClick}>
                  {method.name}
                </Button>
              ))}
          </>
        ) : (
          // not connected
          <Button data-testid="connect-to-phantom" onClick={handleConnect} style={{ marginTop: '15px' }}>
            Connect to Phantom
          </Button>
        )}
      </Body>
    </Main>
  );
});

// =============================================================================
// Main Component
// =============================================================================

const App = () => {
  const [provider, setProvider] = useState<PhantomInjectedProvider | null>(null);
  const props = useProps(provider);

  useEffect(() => {
    const getPhantomMultiChainProvider = async () => {
      const phantomMultiChainProvider = await detectPhantomMultiChainProvider();
      setProvider(phantomMultiChainProvider);
    };
    getPhantomMultiChainProvider();
  }, []);

  if (!provider) {
    return <NoProvider />;
  }

  return <StatelessApp {...props} />;
};

export default App;
