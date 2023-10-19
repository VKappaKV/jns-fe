import { useSDK } from '@metamask/sdk-react';
import React, { useState } from 'react';

const App = () => {
  const [inputFields, setInputFields] = useState({
    account: undefined,
    publicKey: undefined,
    signedEtherum: undefined
  });
  const { sdk, connected, connecting, provider, chainId } = useSDK();

  const getInfo = async () => {
    try {
      // Connect to an Ethereum wallet and get the account
      const account = await connect();
  
      // Get the public key
      const publicKey = await getPublicKey(account);
  
      // Sign Ethereum data
      const signedEthereum = await eth_signTypedData_v4(publicKey, account);

    } catch (error) {
      console.error('Error:', error);
    }
  }

  const setValue = (key, value) => {
    setInputFields((prevState) => ({
      ...prevState,
      [key]: value,
  }));
  }

  const connect = async () => {
    if (window.ethereum) {
      try {           
        const accounts = await sdk?.connect();

        if(accounts){
          setValue('account', accounts[0])
          return accounts[0]
        }
      } catch (error) {
          console.error({ error })
      }
    }
  }

  const getAccounts = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({
          method: 'eth_requestAccounts',
        })

        if(accounts){
          setValue('account', accounts[0])
          return accounts[0]
        }
      } catch(err) {
        if(err.code=='32002') console.error('connect to your wallet Metamask') //Already processing eth_requestAccounts. Please wait. -32002*/
        else  console.warn(err);
        
      }
    }
  };

  const getPublicKey = async(account)=>{
    if (window.ethereum) {
      try {   
          const publicKey = await window.ethereum.request({
             method: 'eth_getEncryptionPublicKey',
             params: [account],
          })

          setValue('publicKey', publicKey)
          return publicKey
      } catch (error) {
          console.error({ error })
      }
   }
  }

  async function eth_signTypedData_v4(publicKey, account) {
    if (window.ethereum) {
      try {
        const from = account;
        
        const msgParams = JSON.stringify({
          domain: {
            // This defines the network, in this case, Mainnet.
            chainId: chainId,
            // Give a user-friendly name to the specific contract you're signing for.
            name: 'Sign Public Key with Address',
            // This identifies the latest version.
            version: '1',
          },
      
          // This defines the message you're proposing the user to sign, is dapp-specific, and contains
          // anything you want. There are no required fields. Be as explicit as possible when building out
          // the message schema.
          message: {
            address: account,
            publicKey: publicKey
          },
          // This refers to the keys of the following types object.
          primaryType: 'PublicKey',
          types: {
            // This refers to the domain the contract is hosted on.
            EIP712Domain: [
              { name: 'name', type: 'string' },
              { name: 'version', type: 'string' },
              { name: 'chainId', type: 'uint256' }
            ],
            // Not an EIP712Domain definition.
            Group: [
              { name: 'name', type: 'string' },
              { name: 'members', type: 'Person[]' },
            ],
            // Refer to primaryType.
            PublicKey: [
              { name: 'address', type: 'string' },
              { name: 'publicKey', type: 'string' },
            ],
            // Not an EIP712Domain definition.
            Person: [
              { name: 'name', type: 'string' },
              { name: 'wallets', type: 'address[]' },
            ],
          },
        });

        var params = [from, msgParams];
        var method = 'eth_signTypedData_v4';

        window.ethereum.sendAsync(
          {
            method,
            params,
            from: from,
          },
          function (err, result) {
            if(result){
              setValue('signedEtherum', result.result)
              return result
            }else {
              console.error(err)
            }
          });
      } catch (err) {
        console.error(err);
      }
    }
  }


  return (
    <div className="App">
      <button style={{ padding: 10, margin: 10 }} onClick={getInfo}>
        Connect
      </button>
      {connected && (
        <div>
          <>
            {chainId && `Connected chain: ${chainId}`}
            <p></p>
            {inputFields.account && `Connected account: ${inputFields.account}`} {/*QUESTO MI PERMETTE DI AVERE L'ACCOUNT*/}
            <p></p>
            {inputFields.publicKey && `Connected publicKey: ${inputFields.publicKey}`} {/*QUESTO MI PERMETTE DI AVERE L'ACCOUNT*/}
            <p></p>
            {inputFields.signedEtherum && `Sigend key: ${inputFields.signedEtherum}`}
          </>
        </div>
      )}
    </div>
  );
};

export default App