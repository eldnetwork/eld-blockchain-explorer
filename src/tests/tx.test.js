import { decodeTxFromHex, encodeTxToHex, TransferTx, Tx, Payload } from '../utils/tx';
import { Buffer } from 'buffer';
import CryptoJS from 'crypto-js';

describe('tx json tests', () => {
  test('address generation from public key', () => {
    const publicKey = '880a32920a393b8a11d469c0714124f2055e0734618a61b0a3d769131205f707';
    const digestHex = CryptoJS.SHA256(CryptoJS.enc.Hex.parse(publicKey)).toString(CryptoJS.enc.Hex);
    const address = '0x' + digestHex.slice(0, 40);

    expect(digestHex).toBe('23b1f0b6199479b5d04fb54e21df14d51530b7b104d61845fb31859a168e8473');
    expect(address).toBe('0x23b1f0b6199479b5d04fb54e21df14d51530b7b1');
  });

  test('tx conversion round-trips through hex encoding', () => {
    const keyPair = {
      publicKey: new Uint8Array([
        190, 210, 254, 163, 46, 119, 115, 151, 69, 17, 11, 15, 20, 167, 75, 189, 148, 79, 216, 64,
        254, 239, 40, 72, 28, 103, 23, 74, 216, 118, 108, 34,
      ]),
      secretKey: new Uint8Array([
        184, 23, 137, 134, 250, 123, 19, 125, 107, 168, 117, 168, 205, 21, 219, 239, 221, 49, 150,
        157, 155, 28, 30, 101, 120, 166, 23, 166, 126, 171, 152, 206, 190, 210, 254, 163, 46, 119,
        115, 151, 69, 17, 11, 15, 20, 167, 75, 189, 148, 79, 216, 64, 254, 239, 40, 72, 28, 103, 23,
        74, 216, 118, 108, 34,
      ]),
    };
    const transfer = new TransferTx('1', 'B', 1);
    const transferPayload = new Payload('Transfer', transfer);
    const tx = new Tx('A', '', 1, transferPayload, Buffer.from(keyPair.publicKey).toString('hex'));

    tx.sign(keyPair);

    expect(tx.sig).toMatch(/^[0-9a-f]{128}$/);
    expect(tx.verify()).toBe(true);

    const hexTransfer = encodeTxToHex(tx);
    expect(hexTransfer).toMatch(/^[0-9a-f]+$/);

    const decodedTx = decodeTxFromHex(hexTransfer);
    expect(decodedTx.id).toBe('A');
    expect(decodedTx.nonce).toBe(1);
    expect(decodedTx.sig).toBe(tx.sig);
    expect(decodedTx.public_key).toBe(tx.public_key);
    expect(decodedTx.payload.type).toBe('Transfer');
    expect(decodedTx.payload.sender).toBe('1');
    expect(decodedTx.payload.recipient).toBe('B');
    expect(decodedTx.payload.amount).toBe(1);
    expect(decodedTx.verify()).toBe(true);
  });
});
