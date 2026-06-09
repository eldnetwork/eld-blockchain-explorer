import { Buffer } from 'buffer';
const nacl = require('tweetnacl');

export class TransferTx {
    constructor(sender, recipient, amount) {
        this.sender = sender;
        this.recipient = recipient;
        this.amount = amount;
    }
}

export class AddMetadataTx {
    constructor(message) {
        this.message = message;
    }
}

export class Payload {
    constructor(type, inner) {
        this.type = type;
        Object.assign(this, inner); // Flatten inner fields
    }
}

export class Tx {
    constructor(id, sig, nonce, payload, public_key) { // Removed payloadType
        this.id = id;
        this.sig = sig;
        this.nonce = nonce;
        this.payload = payload;
        this.public_key = public_key;
    }

    sign(keyPair) {
        const txToSign = { ...this, sig: '' };
        const json = JSON.stringify(txToSign);
        const message = new Uint8Array(Buffer.from(json, 'utf8'));
        const secretKey = new Uint8Array(keyPair.secretKey);
        const signature = nacl.sign.detached(message, secretKey);
        this.sig = Buffer.from(signature).toString('hex');
    }

    verify() {
        const txToVerify = { ...this, sig: '' };
        const json = JSON.stringify(txToVerify);
        const message = new Uint8Array(Buffer.from(json, 'utf8'));
        const signature = new Uint8Array(Buffer.from(this.sig, 'hex'));
        const publicKey = new Uint8Array(Buffer.from(this.public_key, 'hex'));
        return nacl.sign.detached.verify(message, signature, publicKey);
    }
}

export function encodeTxToHex(tx) {
    const json = JSON.stringify(tx);
    return Buffer.from(json, 'utf8').toString('hex');
}

export function decodeTxFromHex(hex) {
    const json = Buffer.from(hex, 'hex').toString('utf8');
    const parsed = JSON.parse(json);
    let inner;
    if (parsed.payload.type === 'Transfer') {
        inner = new TransferTx(parsed.payload.sender, parsed.payload.recipient, parsed.payload.amount);
    } else if (parsed.payload.type === 'AddMetadata') {
        inner = new AddMetadataTx(parsed.payload.message);
    } else {
        throw new Error('Unknown payload type');
    }
    let payload = new Payload(parsed.payload.type, inner);
    return new Tx(parsed.id, parsed.sig, parsed.nonce, payload, parsed.public_key);
}

export function decodeTxFromJSON(parsed) {
    let inner;
    if (parsed.payload.type === 'Transfer') {
        inner = new TransferTx(parsed.payload.sender, parsed.payload.recipient, parsed.payload.amount);
    } else if (parsed.payload.type === 'AddMetadata') {
        inner = new AddMetadataTx(parsed.payload.message);
    } else {
        throw new Error('Unknown payload type');
    }
    let payload = new Payload(parsed.payload.type, inner);
    return new Tx(parsed.id, parsed.sig, parsed.nonce, payload, parsed.public_key);
}
