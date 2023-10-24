import React, { useEffect, useState } from 'react';
import styled from 'styled-components';

import {
  detectPhantomMultiChainProvider,
  hexToRGB,
} from './utils';

import { PhantomInjectedProvider, SupportedChainIcons, Props } from './scaffholding/types';

import { NoProvider } from './components';
import { DARK_GRAY, GRAY, PURPLE, REACT_GRAY, WHITE } from './assets/constants';
import Button from './components/Button';
import {useProps} from './scaffholding/PhantomBackend';

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
