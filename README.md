# jns-wallet-integration


CONNECT
Account, in hex di 43 bytes, contando 0x


PUBLIC KEY
Da quello prendo la chiave pubblica con: 
var publicKey = await window.ethereum.request({
    method: 'eth_getEncryptionPublicKey',
    params: [account],
})

Questo mi da la chiave pubblica in Base64 di 44 bytes, con l'uguale alla fine


FIRMA
Per firmare ho bisogno di:
- dell'account -> 43bytes con 0x iniziale
- messaggio -> utf8, in string

const signature = await window.ethereum.request({
    method: 'personal_sign',
    params: [msg, account],
});

Questo mi da la signature in hex di 132 bytes con 0x iniziale


VERIFICA
Per la verifica ho bisogno di:
- dell'account -> 43bytes con 0x iniziale
- publicKey -> che da Base64 di 44 bytes, con l'uguale alla fine, lo converto in:
                        Hex di 64 bytes, senza lo 0x iniziale,
                che poi viene convertito in:
                        Buffer di 32 bytes    
- messaggio -> utf8, in string  
        
const ec = new elliptic.ec('secp256k1');
const publicKey = ec.keyFromPublic(publicKeyBuffer);