import { useEffect, useState } from 'react';
import { clusterApiUrl, Connection, PublicKey, Transaction } from '@solana/web3.js';
import './styles.css';
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

  const verifyEd25519Signature = (message, signature, publicKey) => {
    const textEncoder = new TextEncoder();
    const messageData = message;
    const signatureData = new Uint8Array(signature.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
    const publicKeyData = new Uint8Array(publicKey.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
    return nacl.sign.detached.verify(messageData, signatureData, publicKeyData);
  };

  const signMessage = async () => {
    //console.log(provider.publicKey?.toBase58());
    //const data = new TextEncoder().encode(provider.publicKey?.toBase58());
    const data_string = new TextEncoder().encode("transaction id");
    const data_txid_uint8array = new Uint8Array([20, 221, 168,  72, 142, 141,  78, 189, 97,  28,  73,  96, 181,  14, 187,  56, 144, 131, 187, 210,  75, 118,  69, 246, 16,  57,  31,  72, 226, 183, 167, 144]);
    let data_uint8array_to_string = Buffer.from(data_txid_uint8array).toString('utf8');
    const data_uint8array_utf8_encoded = new TextEncoder().encode(data_uint8array_to_string);
    try {
      const {signature} = await provider.signMessage(data_uint8array_utf8_encoded, 'hex');
      addLog(`Message signed: ${Buffer.from(signature).toString('hex')}`);
      const public_key = "ece9828e1499277cfa9a66ba65cccd8a1e186b5eb680249243f239ec82da88a4";
      const result = verifyEd25519Signature(data_uint8array_utf8_encoded, Buffer.from(signature).toString('hex'), public_key);
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
