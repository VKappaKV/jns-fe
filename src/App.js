import { useSDK } from '@metamask/sdk-react';
import React, { useState } from 'react';
import nacl from 'tweetnacl';
import elliptic from 'elliptic';
import {Buffer} from 'buffer'
import { ECDSA } from '@oliverne/easy-ecdsa';
import bs58 from 'bs58';
import { ethers } from "ethers"

const App = () => {
  const [inputFields, setInputFields] = useState({
    account: undefined,
    publicKey: undefined,
    signature: undefined,
    verify: undefined
  });
  const { sdk, connected, connecting, provider, chainId } = useSDK();


  const getInfo = async () => {
    if (window.ethereum) {
      try {
        const account = inputFields.account ? inputFields.account : await connect();
        if(account) {
          const publicKey_hex = await getPublicKeyHex(account);
          const signedEthereum = await eth_personal_sign(publicKey_hex, account, 'TransactionId');
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
        setValue('account', account)
        return account
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

      console.log("Original public key: " + publicKey);

      return publicKey
    } catch (error) {
        console.error({ error })
    }
  }

  const getPublicKeyHex = async(account)=>{
    try {
      const publicKey = await getPublicKey(account)

      let publicKey_hex = [...atob(publicKey)].map(char => char.charCodeAt(0).toString(16).padStart(2, '0')).join('');
      console.log("Public key hex: " + publicKey_hex)

      setValue('publicKey', publicKey)

      return publicKey_hex
    } catch (error) {
      console.error({ error })
    }
  }

  async function eth_personal_sign(publicKey, account, message) {
      try {
        const signature = await window.ethereum.request({
          method: 'personal_sign',
          params: [message, account],
        });

        setValue('signature', signature)

        console.log('message = '+message+'\nsignature = '+signature+'\npublicKey = '+publicKey)

        await verifyECDSASignature(message, signature, publicKey)
      } catch (error) {
        // Gestisci l'errore in modo appropriato, ad esempio stampando un messaggio di errore o eseguendo azioni di ripristino.
        console.error("Errore durante la firma: " + error);
        // Esempio: throw error; // Puoi anche lanciare l'errore se vuoi propagarlo
      }
  }

  const verifyECDSASignature = async (message_string, signature_hex, publicKey_hex) => {
    try {
      const ec = new elliptic.ec('secp256k1');
      console.log(publicKey_hex.length)
      const publicKeyBuffer = Buffer.from(publicKey_hex, 'hex');
      console.log(publicKeyBuffer)
      console.log(publicKeyBuffer.length)
      const publicKey = ec.keyFromPublic(publicKeyBuffer);
      console.log('Chiave pubblica valida:', publicKey);
    } catch (error) {
      console.error('Error verifying signature:', error);
      return false;
    }
  };  

  /*async function eth_signTypedData_v4(publicKey_hex, account) {
    var regex=/^0x[0-9,a-f,A-F]{40}$/
    if(regex.test(account)){

      const domain = {
        chainId: 1,
        name: 'Sign TransactionId',
        version: '1',
      }

      var message = {
        transactionId: "arbitrary string"
      };

      console.log("Messaggio da firmare: " + message);

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

      try {
        var signature = await window.ethereum.request({
          method: "eth_signTypedData_v4",
          params: [account, msgParams],
        });

        console.log("Original signature: " + signature);

        setValue('signedEtherum', signature.slice(2))

        await verifyECDSASignature(message, signature.slice(2), publicKey_hex)
      } catch (error) {
        // Gestisci l'errore in modo appropriato, ad esempio stampando un messaggio di errore o eseguendo azioni di ripristino.
        console.error("Errore durante la firma: " + error);
        // Esempio: throw error; // Puoi anche lanciare l'errore se vuoi propagarlo
      }
    }
  }*/


  /*const verifyECDSASignature = async (message_string, signature_hex, publicKey_hex) => {
    const signer = new ECDSA();


    const publicKey_bs58 = bs58.encode(Buffer.from(publicKey_hex, 'hex'));
    console.log("publicKey in BS58: " + publicKey_bs58);

    const signature_bs58 = bs58.encode(Buffer.from(signature_hex, 'hex'));
    console.log("Signature in BS58: " + signature_bs58);

    console.log('Verifica signature: ', signer.verify(message_string, signature_bs58, publicKey_bs58));
  };*/

  const verifyEd25519Signature = (message, signature, publicKey, chain) => {
    const textEncoder = new TextEncoder();
    const messageData = textEncoder.encode(message);
    const signatureData = new Uint8Array(signature.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
    const publicKeyData = new Uint8Array(publicKey.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
    const isVerified = nacl.sign.detached.verify(messageData, signatureData, publicKeyData);
    setValue('verify', isVerified)
    return isVerified;
  };

  return (
    <div className="App">
      <button style={{ padding: 10, margin: 10 }} onClick={async () => await getInfo()}>
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
            {inputFields.signature && `Signature: ${inputFields.signature}`}
            <p></p>
            {`Verify: ${inputFields.verify}`}
          </>
        </div>
      )}
    </div>
  );
};

export default App
