import { useSDK } from '@metamask/sdk-react';
import React, { useState } from 'react';
import nacl from 'tweetnacl';
import elliptic from 'elliptic';
import { InjectedConnector } from "@web3-react/walletlink-connector";
import { WalletLinkConnector } from "@web3-react/walletlink-connector";
import { WalletConnectConnector } from "@web3-react/walletlink-connector";

const App = () => {
  const [inputFields, setInputFields] = useState({
    ethereum: {
      account: undefined,
      publicKey: undefined,
      signed: undefined,
      transactionId: 'transactionId',
      verify: undefined
    },
    coinbaseSolana: {
      account: undefined,
      publicKey: undefined,
      signed: undefined,
      transactionId: 'transactionId',
      verify: undefined
    }
  });
  const { sdk, connected, connecting, provider, chainId } = useSDK();

  
  const Injected = new InjectedConnector({

    supportedChainIds: [1, 3, 4, 5, 42]
   
   });
   
   
   
   const CoinbaseWallet = new WalletLinkConnector({
   
    url: `https://mainnet.infura.io/v3/${process.env.INFURA_KEY}`,
   
    appName: "Web3-react Demo",
   
    supportedChainIds: [1, 3, 4, 5, 42],
   
   });
   
   
   
   const WalletConnect = new WalletConnectConnector({
   
    rpcUrl: `https://mainnet.infura.io/v3/${process.env.INFURA_KEY}`,
   
    bridge: "https://bridge.walletconnect.org",
   
    qrcode: true,
   
   });

  const verifyEd25519Signature = (message, signature, publicKey, chain) => {
    const textEncoder = new TextEncoder();
    const messageData = textEncoder.encode(message);
    const signatureData = new Uint8Array(signature.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
    const publicKeyData = new Uint8Array(publicKey.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
    const isVerified = nacl.sign.detached.verify(messageData, signatureData, publicKeyData);
    setValue(chain, 'verify', isVerified)
    return isVerified;
  };

  //console.log(window.CoinbaseWalletSDK)
  //console.log(window.coinbaseSolana)
  return (
    <div className="App">
      <button style={{ padding: 10, margin: 10 }} onClick={() => getInfo('ethereum')}>
        Connect Ethereum
      </button>
    </div>
  );
};

export default App