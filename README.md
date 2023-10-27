# Phantom wallet

## Requirements

- Phantom web extension with loaded account
- Node.js >= 17.x
- Yarn
- Typescript
- React
- Openssl

## Setup
```bash
git clone
yarn install
yarn start
```

## Useful links for troubleshooting during setup

- https://stackoverflow.com/questions/46013544/yarn-install-command-error-no-such-file-or-directory-install
- https://stackoverflow.com/questions/69692842/error-message-error0308010cdigital-envelope-routinesunsupported

## Schema firma messaggio - SolanaVerifier

Nel seguente schema, per "hex" si assume che non c'è MAI 0x

1. Input txid - string in hex - 64 bytes
2. Firma messaggio
   - const uint8array_encoded = new TextEncoder().encode(data_hex) --> string to uint8array
   - const {signature} = await provider.signMessage(uint8array_encoded); --> object
   - JSON.stringify of signature: [163,...,12] ---> uint8array(66)
   - Signature in hex:  Buffer.from(signature).toString('hex') ---> string in hex 128 bytes
3. Verifica
   - Public key solana: hex 64 bytes
   - Messaggio: uint8array_encoded (uint8array)
   - Signature: string in hex 128 bytes
   - verifyEd25519Signature(uint8array_encoded, Buffer.from(signature).toString('hex'), public_key_hex); --> true
