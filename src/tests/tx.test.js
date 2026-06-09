import { decodeTxFromHex, encodeTxToHex, TransferTx, Tx, Payload } from "../tx";
import { Buffer } from 'buffer';
import nacl from 'tweetnacl';
import { sha256 } from 'js-sha256';

describe('tx json tests', () => {
    test("address generation from public key", () => {
        const publicKey = "880a32920a393b8a11d469c0714124f2055e0734618a61b0a3d769131205f707";
        // Decode hex string to binary (Buffer or Uint8Array)
        const publicKeyBytes = Buffer.from(publicKey, 'hex');
        const digest = sha256.array(publicKeyBytes); // SHA-256 digest (32 bytes)
        console.log({digest});
        /*
       digest: [
         35, 177, 240, 182, 25, 148, 121, 181,
        208,  79, 181,  78, 33, 223,  20, 213,
         21,  48, 183, 177,  4, 214,  24,  69,
        251,  49, 133, 154, 22, 142, 132, 115
      ]
        */
        const addressBytes = digest.slice(0, 20); // First 20 bytes
        let address = "0x" + Buffer.from(addressBytes).toString('hex'); // Hex encode (40 chars)
        console.log("derived address: ", address); //0x12a94169cf2dc0e49ac13fc3911076d2f15f5a43
        // vs Rust: "23b1f0b6199479b5d04fb54e21df14d51530b7b1"
    })
    test("tx conversion", () => {
        const keyPair = {
            publicKey: new Uint8Array([
                190, 210, 254, 163, 46, 119, 115, 151,
                69, 17, 11, 15, 20, 167, 75, 189,
                148, 79, 216, 64, 254, 239, 40, 72,
                28, 103, 23, 74, 216, 118, 108, 34
            ]),
            secretKey: new Uint8Array([
                184, 23, 137, 134, 250, 123, 19, 125, 107, 168, 117,
                168, 205, 21, 219, 239, 221, 49, 150, 157, 155, 28,
                30, 101, 120, 166, 23, 166, 126, 171, 152, 206, 190,
                210, 254, 163, 46, 119, 115, 151, 69, 17, 11, 15,
                20, 167, 75, 189, 148, 79, 216, 64, 254, 239, 40,
                72, 28, 103, 23, 74, 216, 118, 108, 34
            ])
        };
        let transfer = new TransferTx("1", "B", 1);
        let transferPayload = new Payload("Transfer", transfer);
        let tx = new Tx("A", "", 1, transferPayload, Buffer.from(keyPair.publicKey).toString('hex'));
        
        tx.sign(keyPair);
        const jsonTransfer = JSON.stringify(tx);
        console.log('JS JSON (Transfer):', jsonTransfer);
        const hexTransfer = encodeTxToHex(tx);
        console.log('JS Hex (Transfer):', hexTransfer);

        // Parse hex back to Tx object
        const decodedTx = decodeTxFromHex(hexTransfer);
        const decodedJson = JSON.stringify(decodedTx);

        console.log({ decodedJson });
    })
});
/*


JSON {"id":"A","sig":"7f9278a8d29451f31960711d3020a8e0a3551d4af155a4b50041cccd60b8c85db7bb35425cdabd47247502882381723b8ad2b3c9b9e85921db9d7ab1a570c502","nonce":1,"payload":{"type":"Transfer","sender":"1","recipient":"B","amount":1},"public_key":"23bac1a7c6bf6f1996c40ca3d10bc7510e3d47cace11c91e9f7afc37a5599569","type":"Transfer"}
*/

/*
On server Rust after receiving the JSON send from explorer JS:

Tx { id: "A", sig: [30, 210, 50, 203, 50, 208, 63, 87, 47, 101, 146, 221, 230, 85, 30, 34, 213, 210, 58, 112, 67, 236, 64, 85, 133, 69, 226, 150, 22, 48, 70, 144, 8, 240, 1, 213, 215, 180, 9, 59, 236, 145, 105, 156, 112, 57, 97, 82, 184, 141, 182, 9, 163, 8, 69, 127, 240, 34, 77, 23, 129, 121, 245, 3], nonce: 1, payload: Payload { inner: Transfer(TransferTx { sender: "1", recipient: "B", amount: 1 }) }, public_key: [173, 112, 151, 19, 42, 232, 236, 235, 160, 185, 127, 26, 227, 211, 31, 40, 251, 171, 228, 41, 100, 176, 88, 88, 162, 166, 221, 2, 230, 206, 168, 248], payload_type: "Transfer" }
isValid: false

*/