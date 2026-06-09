import { Buffer } from 'buffer';

export function createKeyPair(privateKeyHex, publicKeyHex) {
  // Helper function to convert hex string to Uint8Array
  function hexToUint8Array(hexString) {
      // Remove "0x" prefix if it exists
      const cleanHex = hexString.startsWith("0x") ? hexString.slice(2) : hexString;
      
      // Validate hex string length
      if (cleanHex.length % 2 !== 0) {
          throw new Error("Invalid hex string: length must be even");
      }

      // Create Uint8Array and convert hex pairs to bytes
      const byteArray = new Uint8Array(cleanHex.length / 2);
      for (let i = 0; i < cleanHex.length; i += 2) {
          byteArray[i / 2] = parseInt(cleanHex.substr(i, 2), 16);
      }
      return byteArray;
  }

  // Convert both hex strings to Uint8Arrays
  const publicKeyArray = hexToUint8Array(publicKeyHex);
  const privateKeyArray = hexToUint8Array(privateKeyHex);

  // Create and return the keyPair object
  const keyPair = {
      publicKey: publicKeyArray,
      secretKey: privateKeyArray
  };

  return keyPair;
}

export function hexToUint8Array(hexString) {
  // Remove "0x" prefix if it exists
  const cleanHex = hexString.startsWith("0x") ? hexString.slice(2) : hexString;
  
  // Ensure the string length is even (valid hex needs pairs of characters)
  if (cleanHex.length % 2 !== 0) {
      throw new Error("Invalid hex string: length must be even");
  }

  // Create Uint8Array with half the length of hex string (2 chars = 1 byte)
  const byteArray = new Uint8Array(cleanHex.length / 2);
  
  // Convert hex pairs to bytes
  for (let i = 0; i < cleanHex.length; i += 2) {
      byteArray[i / 2] = parseInt(cleanHex.substr(i, 2), 16);
  }
  
  return byteArray;
}

export const byteToHex = (byte) => {
  const key = '0123456789ABCDEF'
  let bytes = new Uint8Array(byte)
  let newHex = ''
  let currentChar = 0
  for (let i = 0; i < bytes.length; i++) { // Go over each 8-bit byte
    currentChar = (bytes[i] >> 4)      // First 4-bits for first hex char
    newHex += key[currentChar]         // Add first hex char to string
    currentChar = (bytes[i] & 15)      // Erase first 4-bits, get last 4-bits for second hex char
    newHex += key[currentChar]         // Add second hex char to string
  }
  return newHex
}

export const hexToByte = (hex) => {
  const key = '0123456789ABCDEF'
  let newBytes = []
  let currentChar = 0
  let currentByte = 0
  for (let i = 0; i < hex.length; i++) {   // Go over two 4-bit hex chars to convert into one 8-bit byte
    currentChar = key.indexOf(hex[i])
    if (i % 2 === 0) { // First hex char
      currentByte = (currentChar << 4) // Get 4-bits from first hex char
    }
    if (i % 2 === 1) { // Second hex char
      currentByte += (currentChar)     // Concat 4-bits from second hex char
      newBytes.push(currentByte)       // Add byte
    }
  }
  return new Uint8Array(newBytes)
}