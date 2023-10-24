import { useEffect, useState } from 'react';
import { clusterApiUrl, Connection, PublicKey, Transaction } from '@solana/web3.js';
import './assets/stylesSolana.css';
import nacl from 'tweetnacl';
import { Buffer } from 'buffer';

type DisplayEncoding = "utf8" | "hex";
type PhantomEvent = "disconnect" | "connect";
type PhantomRequestMethod =
  | "connect"
  | "disconnect"
  | "signTransaction"
  | "signAllTransactions"
  | "signMessage";

interface ConnectOpts {
  onlyIfTrusted: boolean;
}

interface PhantomProvider {
  publicKey: PublicKey | null;
  isConnected: boolean | null;
  autoApprove: boolean | null;
  signTransaction: (transaction: Transaction) => Promise<Transaction>;
  signAllTransactions: (transactions: Transaction[]) => Promise<Transaction[]>;
  signMessage: (
    message: Uint8Array | string,
    display?: DisplayEncoding
  ) => Promise<any>;
  connect: (
    opts?: Partial<ConnectOpts>
  ) => Promise<{ publicKey: PublicKey; autoApprove: boolean }>;
  disconnect: () => Promise<void>;
  on: (event: PhantomEvent, handler: (args: any) => void) => void;
  request: (method: PhantomRequestMethod, params: any) => Promise<unknown>;
}

const getProvider = (): PhantomProvider | undefined => {
  if ("solana" in window) {
    const provider = (window as any).solana;
    if (provider.isPhantom) {
      return provider;
    }
  }
  window.open("https://phantom.app/", "_blank");
};

const NETWORK = clusterApiUrl("mainnet-beta");

export default function App() {
  const provider = getProvider();
  const [logs, setLogs] = useState<string[]>([]);
  const addLog = (log: string) => setLogs([...logs, log]);
  const connection = new Connection(NETWORK);
  const [, setConnected] = useState<boolean>(false);
  useEffect(() => {
    if (provider) {
      provider.on("connect", () => {
        setConnected(true);
        addLog("Connected to wallet " + provider.publicKey?.toBase58());
      });
      provider.on("disconnect", () => {
        setConnected(false);
        addLog("Disconnected from wallet");
      });
      // try to eagerly connect
      provider.connect({ onlyIfTrusted: true });
      return () => {
        provider.disconnect();
      };
    }
  }, [provider]);
  if (!provider) {
    return <h2>Could not find a provider</h2>;
  }

  //requires Uint8Array parameters
  const verifyEd25519Signature = (message, signature, publicKey) => {
    const signatureData = new Uint8Array(signature.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
    const publicKeyData = new Uint8Array(publicKey.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
    return nacl.sign.detached.verify(message, signatureData, publicKeyData);
  };

  const signMessage = async () => {
    /**** Try one of these options ****/

    //1.public key
    const data_my_public_key = new TextEncoder().encode(provider.publicKey?.toBase58());

    //2.arbitrary string
    const data_string = new TextEncoder().encode("simple_string");

    //3.uint8array
    const data_uint8array = new Uint8Array([20, 221, 168,  72, 142, 141,  78, 189, 97,  28,  73,  96, 181,  14, 187,  56, 144, 131, 187, 210,  75, 118,  69, 246, 16,  57,  31,  72, 226, 183, 167, 144]);
    const data_uint8array_to_utf8 = Buffer.from(data_uint8array).toString('utf8'); //use this

    //4.hex
    const data_hex = "c5c1edfc94623bd5b2a7c5b8acb15599d3908f95ab3f8bf00ee40e786831781d";

    try {
      const uint8array_encoded = new TextEncoder().encode(data_hex); //set the option
      const {signature} = await provider.signMessage(uint8array_encoded, 'hex');
      console.log(signature);
      //console.log(Buffer.from(signature).toString('hex'));

      /* Verify signature */
      //your solana public key in hex, use this to convert from base58 (solana deposit address) to hex:
      // https://appdevtools.com/base58-encoder-decoder
      // --> section decode and treat output as HEX
      const public_key_hex = "ece9828e1499277cfa9a66ba65cccd8a1e186b5eb680249243f239ec82da88a4";
      const result = verifyEd25519Signature(uint8array_encoded, Buffer.from(signature).toString('hex'), public_key_hex);
      addLog("Risultato verifica: " + result);
    } catch (err) {
      console.warn(err);
      addLog("Error: " + JSON.stringify(err));
    }
  };
  return (
    <div className="App">
      <h1>Solana Signer Sandbox</h1>
      <main>
        {provider && provider.publicKey ? (
          <>
            <div>Wallet address: {provider.publicKey?.toBase58()}.</div>
            <div>isConnected: {provider.isConnected ? "true" : "false"}.</div>
            <div>autoApprove: {provider.autoApprove ? "true" : "false"}. </div>
            <button
              onClick={() =>
                signMessage()
              }
            >
              Sign Account Pub Key
            </button>
            <button
              onClick={async () => {
                try {
                  const res = await provider.disconnect();
                  addLog(JSON.stringify(res));
                } catch (err) {
                  console.warn(err);
                  addLog("Error: " + JSON.stringify(err));
                }
              }}
            >
              Disconnect
            </button>
          </>
        ) : (
          <>
            <button
              onClick={async () => {
                try {
                  const res = await provider.connect();
                  addLog(JSON.stringify(res));
                } catch (err) {
                  console.warn(err);
                  addLog("Error: " + JSON.stringify(err));
                }
              }}
            >
              Connect to Phantom
            </button>
          </>
        )}
        <hr />
        <div className="logs">
          {logs.map((log, i) => (
            <div className="log" key={i}>
              {log}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
