import { useSDK } from '@metamask/sdk-react';
import React, { useState } from 'react';
import nacl from 'tweetnacl';
import elliptic from 'elliptic';
import {Buffer} from 'buffer'

const App = () => {
  const [inputFields, setInputFields] = useState({
    ethereum: {
      account: undefined,
      publicKey: undefined,
      signed: undefined,
      transactionId: 'transactionId',
      verify: undefined
    }
  });
  const { sdk, connected, connecting, provider, chainId } = useSDK();

  const getInfo = async () => {
    if (window.ethereum) {
      try {
        // Connect to an Ethereum wallet and get the account
        const account = inputFields.account ? inputFields.account : await connect();
    
        // Get the public key
        if(account) {
          const publicKey = inputFields.publicKey ? inputFields.publicKey : await getPublicKey(account);
  
          if(publicKey) {
            // Sign Ethereum data
            const signedEthereum = inputFields.signedEthereum ? inputFields.signedEthereum : await eth_signTypedData_v4(publicKey, account);
          }
        }     
      } catch (error) {
        console.error('Error:', error);
      }
    }
  }

  const setValue = (key, value) => {

    setInputFields((prevState) => ({
      ...prevState,
      [key]: value,
    }));
  }

  const connect = async () => {
    try {
      var accounts = []
      
      accounts = await sdk?.connect();

      if(accounts){
        var account = accounts[0]
        setValue('account', accounts[0])
        return accounts[0]
      }
    } catch (error) {
        console.error({ error })
    }
  }

  const getPublicKey = async(account)=>{
    try {   
      var publicKey = await window.ethereum.request({
         method: 'eth_getEncryptionPublicKey',
         params: [account],
      })

      publicKey= [...atob(publicKey)].map(char => char.charCodeAt(0).toString(16).padStart(2, '0')).join('');


      var x=publicKey.slice(0, 32); // La parte r è generalmente lunga 32 byte
      var y=publicKey.slice(32); // La parte r è generalmente lunga 32 byte
      

      console.log(publicKey)
      console.log(x.length,y.length)
      console.log(x,y)
      
      publicKey=x+y

      console.log(publicKey)

      setValue('publicKey', publicKey)
      return publicKey
    } catch (error) {
        console.error({ error })
    }
  }

  async function eth_signTypedData_v4(publicKey, account) {
    
    var regex=/^0x[0-9,a-f,A-F]{40}$/
    if(regex.test(account)){
      const method = 'eth_signTypedData_v4'

      const domain = {
        chainId: 1,
        name: 'Sign TransactionId',
        version: '1',
      }

      const transactionId=inputFields.transactionId
      var message = {
        transactionId, // Sostituisci con il valore che desideri firmare
      }

      const msgParams = JSON.stringify({
        domain,    
        message,
        primaryType: 'TransactionId',
        types: {
          EIP712Domain: [
            { name: 'name', type: 'string' },
            { name: 'version', type: 'string' },
            { name: 'chainId', type: 'uint256' },
          ],    
          TransactionId: [
            { name: 'transactionId', type: 'string' },
          ],
        }
      });

      var signature = await window.ethereum.request({
        method,
        params: [account, msgParams],
      });

      setValue( 'signedEtherum', signature.slice(2))

      const v = signature.slice(2, 4); // La parte v è generalmente lunga 4 byte
      const r = signature.slice(2, 66); // La parte r è generalmente lunga 32 byte
      const s = signature.slice(66, 130); // La parte s è generalmente lunga 32 byte

      console.log(s,v,r)

      verifyECDSASignature(transactionId, signature.slice(2), publicKey)
    }
  }

  const verifyECDSASignature = (message, signature, publicKey, chain) => {
    console.log('publicKey', publicKey)

    const ec = new elliptic.ec('secp256k1');
    const messageData = new TextEncoder().encode(message);
    console.log(messageData, message)

    const signatureData = new Uint8Array(signature.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
    const publicKeyData = new Uint8Array(publicKey.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));

    console.log(publicKeyData.length)

    const isVerified = ec.verify(messageData, signatureData, publicKeyData);
    console.log(isVerified)
    setValue('verify', isVerified)  
    return isVerified;
  };

  const verifyEd25519Signature = (message, signature, publicKey, chain) => {
    const textEncoder = new TextEncoder();
    const messageData = textEncoder.encode(message);
    const signatureData = new Uint8Array(signature.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
    const publicKeyData = new Uint8Array(publicKey.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
    const isVerified = nacl.sign.detached.verify(messageData, signatureData, publicKeyData);
    setValue('verify', isVerified)
    return isVerified;
  };

  //console.log(window.CoinbaseWalletSDK)
  //console.log(window.coinbaseSolana)
  return (
    <div className="App">
      <button style={{ padding: 10, margin: 10 }} onClick={() => getInfo()}>
        Connect Ethereum
      </button>
      {connected && (
        <div>
          <>
            {chainId && `Connected chain: ${chainId}`}
            <p></p>
            {inputFields.account && `Connected account: ${inputFields.account}`}
            <p></p>
            {inputFields.publicKey && `Connected publicKey: ${inputFields.publicKey}`} 
            <p></p>
            {inputFields.signedEtherum && `Sigend key: ${inputFields.signedEtherum}`}
            <p></p>
            {inputFields.verify!==undefined && `Verify: ${inputFields.verify}`}
          </>
        </div>
      )}
    </div>
  );
};

export default App