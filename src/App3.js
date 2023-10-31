import {Web3} from 'web3'
import React, { useState } from 'react';
import elliptic from 'elliptic';
import { publicConvert } from 'secp256k1';
import CryptoJS from 'crypto-js';
import {Buffer} from "buffer";
import { ecrecover, toBuffer, fromRpcSig, hashPersonalMessage } from 'ethereumjs-util';

global.Buffer = global.Buffer || require("buffer").Buffer;

const web3 = new Web3(window.ethereum);
const ec = new elliptic.ec('secp256k1');

const App3 = () => {
    const [inputFields, setInputFields] = useState({
        account: undefined,
        publicKey: {
            key: undefined,
            x: undefined,
            y: undefined
        },
        signature: {
            sign: undefined,
            v: undefined,
            r: undefined,
            s: undefined
        },
        verify: undefined,
        message: 'Il tuo messaggio da firmare'
      });

    
    const setValue = (key, value) => {
        setInputFields((prevState) => ({
        ...prevState,
        [key]: value,
        }));
    }

    async function connectToMetamask() {
        try {
            const accounts = await window.ethereum.enable();
            console.log('Connesso a Metamask');
            setValue('account', accounts[0])
        } catch (error) {
            console.error('Errore nella connessione a Metamask:', error);
        }
    }

    async function signMessage() {
        try {
            const address=inputFields.account

            /*let signature = await window.ethereum.request({
                method: 'personal_sign',
                params: [message, address],
            });*/

            let signature = await web3.eth.personal.sign(inputFields.message, address, '');

            const r = '0x'+signature.slice(2).slice(0, 64);
            const s = '0x'+signature.slice(2).slice(64, 128);
            const v = '0x'+signature.slice(2).slice(128, 130);


            // Decodifica la firma dalla rappresentazione base64.
            //const signatureBytes = Buffer.from(signature, 'base64');
            
            // Estrai i valori "r" e "s" dalla firma.
            //const r = '0x' + signatureBytes.slice(0, 32).toString('hex');
            //const s = '0x' + signatureBytes.slice(32, 64).toString('hex');

            console.log('Signature length: ', signature.length)
            setValue('signature', {
                sign: signature,
                v,
                r,
                s
            })

            console.log('Messaggio firmato: ', signature);
        } catch (error) {
            console.error('Errore nella firma del messaggio:', error);
        }
    }

    async function getKeys() {
        try {
            // Hash the message
            const messageBuffer = Buffer.from(inputFields.message, 'utf8');
            const messageHash = hashPersonalMessage(messageBuffer);

            const { v, r, s } = fromRpcSig(inputFields.signature.sign);

            console.log("ECDSASignature", v,r,s)
            
            // Recover the public key
            const publicKey = ecrecover(messageHash, v, r, s);
            const publicKeyHex = publicKey.toString('hex');

            let point = ec.curve.pointFromX(publicKey, true);

            const x=point.x.toString()
            const y=point.y.toString()

            setValue('publicKey', {
                key: publicKeyHex,
                x,
                y
            })

        } catch (error) {
            console.error('Errore nel recupero della chiave pubblica:', error);
        }
    }


    async function verifyECDSASignature() {
        let signature = Buffer.from(inputFields.signature.sign, 'hex');

        signature = {
            r: Buffer.from(inputFields.signature.r, 'hex'),
            s: Buffer.from(inputFields.signature.s, 'hex')
        };

        // Create a SHA-256 hash of the message.
        //const messageHash = CryptoJS.SHA256(inputFields.message).toString(CryptoJS.enc.Hex);


        try {
            // Verify the signature using the public key points and message hash.
            const isVerify = ec.verify(inputFields.message, signature, inputFields.publicKey.key)

            console.log(isVerify)
            setValue('verify', isVerify)
        } catch (error) {
            // If there's an error during verification, return false.
            console.error('Errore con la verifica: ', error)
        }
    }

    /*async function verifySignature() {
        const message = 'Il tuo messaggio da firmare'; // Assicurati che sia lo stesso messaggio firmato.

        try {
            const signerAddress = await web3.eth.personal.ecRecover(message, inputFields.signature);
            console.log('Indirizzo Ethereum corrispondente alla firma:', signerAddress);

            setValue('verify', signerAddress==inputFields.account)
        } catch (error) {
                console.error('Errore nella verifica della firma:', error);
        }
    }*/

    async function verifyTest() {
        const { v, r, s } = fromRpcSig(inputFields.signature.sign);

        const messageBuffer = Buffer.from(inputFields.message, 'utf8');
        const messageHash = hashPersonalMessage(messageBuffer);

        const publicKey = ecrecover(messageHash, v, r, s);
        const publicKeyHex = publicKey.toString('hex');

        const isSignatureValid = ec.verify(inputFields.message, inputFields.signature.sign, publicKeyHex, 'hex');

        if (isSignatureValid) {
            setValue('verify', 'La firma è valida');
        } else {
            setValue('verify', 'La firma non è valida');
        }
    }

    return (
        <div>
            <button id="connectButton" onClick={connectToMetamask}>Connetti a Metamask</button>
            <button id="signButton" onClick={signMessage}>Firma Messaggio</button>
            <button id="geKeyButton" onClick={getKeys}>Prendi le chiavi</button>
            <button id="verifyButton" onClick={verifyECDSASignature}>Verifica Firma</button>
            <button id="verifyTest" onClick={verifyTest}>Verify test</button>
            <p></p>
            <b>CONNECT:</b>
            <p></p>
            {inputFields.account && `Connected account: ${inputFields.account} dimensione:${inputFields.account.length}`}
            <p></p>
            {(inputFields.signature) ? 
                <div>
                    <b>SIGNATURE:</b>
                    <p></p>
                    {inputFields.signature.sign && `Signature: ${inputFields.signature.sign} dimensione:${inputFields.signature.sign.length}`}
                    <p></p> 
                    {inputFields.signature.v && `V: ${inputFields.signature.v} dimensione:${inputFields.signature.v.length}`}
                    <p></p> 
                    {inputFields.signature.r && `R: ${inputFields.signature.r} dimensione:${inputFields.signature.r.length}`}
                    <p></p> 
                    {inputFields.signature.s && `S: ${inputFields.signature.s} dimensione:${inputFields.signature.s.length}`}
                </div>: ''}
            <p></p>
            {(inputFields.publicKey)  ?
                <div>
                    <b>PUBLIC KEY:</b>
                    <p></p>
                    {inputFields.publicKey.key && `Key: ${inputFields.publicKey.key} dimensione:${inputFields.publicKey.key.length}`}
                    <p></p> 
                    {inputFields.publicKey.x && `X: ${inputFields.publicKey.x} dimensione:${inputFields.publicKey.x.length}`}
                    <p></p> 
                    {inputFields.publicKey.y && `Y: ${inputFields.publicKey.y} dimensione:${inputFields.publicKey.y.length}`}
                </div>: ''}
            <p></p>
            <b>VERIFY:</b>
            <p></p>
            {`Verify: ${inputFields.verify}`}
        </div>
    )
}


export default App3


