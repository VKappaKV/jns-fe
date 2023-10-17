import { useSDK } from '@metamask/sdk-react';
import React, { useState } from 'react';

const App = () => {
  const [account, setAccount] = useState('initialValue');
  const { sdk, connected, connecting, provider, chainId } = useSDK();

  /*
  console.log('sdk', sdk)
  console.log('connected', connected)
  console.log('connecting', connecting)
  console.log('provider', provider)
  console.log('chainId', chainId)
  */

  console.log('provider', provider)

  const connect = async () => {
    try {
      const accounts = await sdk?.connect();
      console.log(accounts)
      console.log(sdk)
      setAccount(accounts?.[0]);
    } catch(err) {
      console.warn(`failed to connect..`, err);
    }
  };

  return (
    <div className="App">
      <button style={{ padding: 10, margin: 10 }} onClick={connect}>
        Connect
      </button>
      {connected && (
        <div>
          <>
            {chainId && `Connected chain: ${chainId}`}
            <p></p>
            {account && `Connected account: ${account}`}
          </>
        </div>
      )}
    </div>
  );
};

export default App