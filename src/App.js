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

  const getInfo = async (chain) => {
    console.log(chain)
    if (window[chain]) {
      try {
        // Connect to an Ethereum wallet and get the account
        const account = inputFields[chain].account ? inputFields[chain].account : await connect(chain);
    
        // Get the public key
        if(account) {
          const publicKey = inputFields[chain].publicKey ? inputFields[chain].publicKey : await getPublicKey(account, chain);
  
          if(publicKey) {
            // Sign Ethereum data
            const signedEthereum = inputFields[chain].signedEthereum ? inputFields[chain].signedEthereum : await eth_signTypedData_v4(publicKey, account, chain);
          }
        }     
      } catch (error) {
        console.error('Error:', error);
      }
    }
  }

  const setValue = (chain, key, value) => {
    var data = inputFields[chain]
    data[key] = value

    setInputFields((prevState) => ({
      ...prevState,
      [chain]: data,
    }));
  }

  const connect = async (chain) => {
    try {
      var accounts = []
      if(chain=='ethereum'){
        accounts = await sdk?.connect();
      } else {
        await window[chain].connect()
      }

      if(accounts){
        var account = accounts[0]
        setValue(chain, 'account', accounts[0])
        return accounts[0]
      }
    } catch (error) {
        console.error({ error })
    }
  }

  const getPublicKey = async(account, chain)=>{
    try {   
      var publicKey = await window[chain].request({
         method: 'eth_getEncryptionPublicKey',
         params: [account],
      })

      publicKey= `0x${[...atob(publicKey)].map(char => char.charCodeAt(0).toString(16).padStart(2, '0')).join('')}`;


      console.log(publicKey.length)
      


      
      
      const secp256k1 = new elliptic.ec('secp256k1');

      // Chiave pubblica compressa Ethereum (in esadecimale)
      const publicKeyHex = publicKey.slice(2);

      // Decodifica la chiave pubblica compressa
      const publicKeyBuffer = Buffer.from(publicKeyHex, 'hex');

      // Estrai la coordinata x
      var x = publicKeyBuffer.slice(1); // Rimuovi il byte di indicazione y pari/dispari

      // Calcola la coordinata y utilizzando la curva ellittica secp256k1
      var y = secp256k1.curve.pointFromX(x, Buffer.from([2])).y;

      x= x.toString('hex');
      y= y.toString(16);

      console.log(x,y)

      console.log(x.length, y.length)









      setValue(chain, 'publicKey', publicKey)
      return publicKey
    } catch (error) {
        console.error({ error })
    }
  }

  async function eth_signTypedData_v4(publicKey, account, chain) {
    
    var regex=/^0x[0-9,a-f,A-F]{40}$/
    if(regex.test(account)){
      const method = 'eth_signTypedData_v4'

      const domain = {
        chainId: 1,
        name: 'Sign TransactionId',
        version: '1',
      }

      const transactionId=inputFields[chain].transactionId
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

      var signature = await window[chain].request({
        method,
        params: [account, msgParams],
      });

      setValue(chain, 'signedEtherum', signature.slice(2))

      const v = signature.slice(2, 4); // La parte v è generalmente lunga 4 byte
      const r = signature.slice(2, 66); // La parte r è generalmente lunga 32 byte
      const s = signature.slice(66, 130); // La parte s è generalmente lunga 32 byte

      console.log(v,r,s)

      console.log((r).length)

      verifyECDSASignature(transactionId, signature.slice(2), publicKey, chain)
    }
  }

  const verifyECDSASignature = (message, signature, publicKey, chain) => {
    console.log(publicKey)

    const ec = new elliptic.ec('secp256k1');
    const messageData = new TextEncoder().encode(message);
    console.log(messageData, message)

    const signatureData = new Uint8Array(signature.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
    const publicKeyData = new Uint8Array(publicKey.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));

    console.log(publicKeyData.length)

    const isVerified = ec.verify(messageData, signatureData, publicKeyData);
    setValue(chain, 'verify', isVerified)  
    return isVerified;
  };

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
      {connected && (
        <div>
          <>
            {chainId && `Connected chain: ${chainId}`}
            <p></p>
            {inputFields.ethereum.account && `Connected account: ${inputFields.ethereum.account}`}
            <p></p>
            {inputFields.ethereum.publicKey && `Connected publicKey: ${inputFields.ethereum.publicKey}`} 
            <p></p>
            {inputFields.ethereum.signedEtherum && `Sigend key: ${inputFields.ethereum.signedEtherum}`}
            <p></p>
            {inputFields.ethereum.verify!==undefined && `Verify: ${inputFields.ethereum.verify}`}
          </>
        </div>
      )}
      <button style={{ padding: 10, margin: 10 }} onClick={() => getInfo('coinbaseSolana')}>
        Connect Solana
      </button>
      {connected && (
        <div>
          <>
            {chainId && `Connected chain: ${chainId}`}
            <p></p>
            {inputFields.coinbaseSolana.account && `Connected account: ${inputFields.coinbaseSolana.account}`}
            <p></p>
            {inputFields.coinbaseSolana.publicKey && `Connected publicKey: ${inputFields.coinbaseSolana.publicKey}`}
            <p></p>
            {inputFields.coinbaseSolana.signedEtherum && `Sigend key: ${inputFields.coinbaseSolana.signedEtherum}`}
            <p></p>
            {inputFields.coinbaseSolana.verify!==undefined && `Verify: ${inputFields.coinbaseSolana.verify}`}
          </>
        </div>
      )}
    </div>
  );
};

export default App