# jns-wallet-integration


CONNECT
Account, in hex di 42 bytes, contando 0x


FIRMA
Per firmare ho bisogno di:
- messaggio -> utf8, in string
- address -> 42bytes con 0x iniziale

let signature = await web3.eth.personal.sign(inputFields.message, address, '');

Questo mi da la signature in hex di 132 bytes con 0x iniziale

Dal quale estraggo:
- signature: 130, togliendo 0x
- v: l'ultimo chr
- r: i primi 32chr
- s: i restando 32chr

i tutti sono in hex senza 0x


PUBLIC KEY
Per prendere la chiave pubblica ho bisogno di:
- messaggio -> utf8, in string
- address -> 42bytes con 0x iniziale

Da quello prendo la chiave pubblica con: 
let publicKey = web3.eth.personal.sign(inputFields.message, address, '');

Questo mi da la chiave pubblica in Base64 di 44 bytes, con l'uguale alla fine


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