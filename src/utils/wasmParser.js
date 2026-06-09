/**
 * Utility functions for parsing WASM bytecode
 */

/**
 * Decode base64 string to Uint8Array
 */
export function base64ToUint8Array(base64) {
  if (!base64 || typeof base64 !== 'string') {
    console.error('Invalid base64 input: not a string');
    return null;
  }
  
  try {
    // Remove any whitespace and newlines
    let cleanBase64 = base64.replace(/\s/g, '').trim();
    
    // Remove data URL prefix if present (e.g., "data:application/wasm;base64,")
    if (cleanBase64.includes(',')) {
      cleanBase64 = cleanBase64.split(',')[1];
    }
    
    // Validate base64 characters (A-Z, a-z, 0-9, +, /, =)
    const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
    if (!base64Regex.test(cleanBase64)) {
      console.error('Invalid base64 characters in string');
      console.error('First 100 chars:', cleanBase64.substring(0, 100));
      return null;
    }
    
    // Add padding if needed (base64 strings should be multiples of 4)
    while (cleanBase64.length % 4 !== 0) {
      cleanBase64 += '=';
    }
    
    const binaryString = atob(cleanBase64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  } catch (error) {
    console.error('Error decoding base64:', error);
    console.error('Base64 length:', base64?.length);
    console.error('First 100 chars:', base64?.substring(0, 100));
    return null;
  }
}

/**
 * Convert Uint8Array to hex string
 */
export function uint8ArrayToHex(bytes) {
  if (!bytes) return '';
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join(' ');
}

/**
 * Parse WASM module and extract basic information
 */
export async function parseWasm(wasmBytes) {
  try {
    // Validate WASM magic number (0x00 0x61 0x73 0x6D = "\0asm")
    if (wasmBytes.length < 4) {
      return { error: 'Invalid WASM: too short' };
    }
    
    const magic = Array.from(wasmBytes.slice(0, 4))
      .map(b => String.fromCharCode(b))
      .join('');
    
    if (magic !== '\0asm') {
      return { error: 'Invalid WASM: missing magic number' };
    }
    
    // Check version (should be 0x01 0x00 0x00 0x00)
    const version = wasmBytes.slice(4, 8);
    
    // Try to compile the module to get more info
    let moduleInfo = {
      magic: 'WASM',
      version: Array.from(version).map(b => b.toString(16).padStart(2, '0')).join(' '),
      size: wasmBytes.length,
      sections: []
    };
    
    try {
      const module = await WebAssembly.compile(wasmBytes);
      const exports = WebAssembly.Module.exports(module);
      const imports = WebAssembly.Module.imports(module);
      
      moduleInfo.exports = exports.map(exp => ({
        name: exp.name,
        kind: exp.kind
      }));
      
      moduleInfo.imports = imports.map(imp => ({
        module: imp.module,
        name: imp.name,
        kind: imp.kind
      }));
    } catch (compileError) {
      moduleInfo.compileError = compileError.message;
    }
    
    return moduleInfo;
  } catch (error) {
    return { error: error.message };
  }
}

/**
 * Convert WASM to a simple text representation
 * This is a basic parser that shows the structure
 */
export function wasmToText(wasmBytes) {
  if (!wasmBytes || wasmBytes.length < 8) {
    return 'Invalid WASM binary';
  }
  
  let output = [];
  let offset = 0;
  
  // Magic number
  const magic = Array.from(wasmBytes.slice(0, 4))
    .map(b => String.fromCharCode(b))
    .join('');
  output.push(`Magic: ${magic === '\0asm' ? 'WASM' : 'INVALID'}`);
  offset += 4;
  
  // Version
  const version = wasmBytes.slice(4, 8);
  const versionNum = version[0] | (version[1] << 8) | (version[2] << 16) | (version[3] << 24);
  output.push(`Version: ${versionNum}`);
  offset += 4;
  
  // Parse sections
  const sectionNames = {
    0: 'Custom',
    1: 'Type',
    2: 'Import',
    3: 'Function',
    4: 'Table',
    5: 'Memory',
    6: 'Global',
    7: 'Export',
    8: 'Start',
    9: 'Element',
    10: 'Code',
    11: 'Data'
  };
  
  while (offset < wasmBytes.length) {
    const sectionId = wasmBytes[offset];
    offset++;
    
    if (sectionId === 0) {
      // Custom section - skip it
      const size = readLEB128(wasmBytes, offset);
      offset += size.bytesRead;
      const nameLength = readLEB128(wasmBytes, offset);
      offset += nameLength.bytesRead;
      offset += nameLength.value;
      const payloadSize = size.value - nameLength.bytesRead - nameLength.value;
      offset += payloadSize;
    } else if (sectionId >= 1 && sectionId <= 11) {
      const sectionName = sectionNames[sectionId] || `Unknown(${sectionId})`;
      const size = readLEB128(wasmBytes, offset);
      offset += size.bytesRead;
      output.push(`Section: ${sectionName} (${size.value} bytes)`);
      offset += size.value;
    } else {
      output.push(`Unknown section: ${sectionId}`);
      break;
    }
  }
  
  return output.join('\n');
}

/**
 * Read LEB128 unsigned integer
 */
function readLEB128(bytes, offset) {
  let result = 0;
  let shift = 0;
  let bytesRead = 0;
  
  while (offset < bytes.length) {
    const byte = bytes[offset];
    offset++;
    bytesRead++;
    
    result |= (byte & 0x7F) << shift;
    
    if ((byte & 0x80) === 0) {
      break;
    }
    
    shift += 7;
    if (shift >= 32) {
      break;
    }
  }
  
  return { value: result, bytesRead };
}

/**
 * Convert hex string to Uint8Array
 */
function hexToUint8Array(hex) {
  try {
    const cleanHex = hex.replace(/^0x/, '').replace(/\s/g, '');
    if (cleanHex.length % 2 !== 0) {
      return null;
    }
    const bytes = new Uint8Array(cleanHex.length / 2);
    for (let i = 0; i < cleanHex.length; i += 2) {
      bytes[i / 2] = parseInt(cleanHex.substr(i, 2), 16);
    }
    return bytes;
  } catch (error) {
    console.error('Error decoding hex:', error);
    return null;
  }
}

/**
 * Convert array of numbers to Uint8Array
 */
function arrayToUint8Array(arr) {
  if (!Array.isArray(arr)) return null;
  try {
    return new Uint8Array(arr);
  } catch (error) {
    console.error('Error converting array to Uint8Array:', error);
    return null;
  }
}

/**
 * Convert WASM bytecode (base64, hex, array, or Uint8Array) to readable text format
 * Note: This cannot recover the original Rust source code, only disassemble to WAT format
 */
export async function wasmBytecodeToText(bytecode) {
  try {
    if (!bytecode) {
      return { error: 'No bytecode provided' };
    }
    
    console.log('Bytecode input type:', typeof bytecode);
    console.log('Is array:', Array.isArray(bytecode));
    console.log('Is Uint8Array:', bytecode instanceof Uint8Array);
    
    let wasmBytes = null;
    let format = 'unknown';
    
    // If it's already a Uint8Array, use it directly
    if (bytecode instanceof Uint8Array) {
      wasmBytes = bytecode;
      format = 'uint8array';
      console.log('Using Uint8Array directly, size:', wasmBytes.length);
    }
    // If it's an array of numbers, convert to Uint8Array
    else if (Array.isArray(bytecode)) {
      wasmBytes = arrayToUint8Array(bytecode);
      if (wasmBytes) {
        format = 'array';
        console.log('Converted array to Uint8Array, size:', wasmBytes.length);
      }
    }
    // If it's a string, try base64 or hex
    else if (typeof bytecode === 'string') {
      console.log('String input, length:', bytecode.length);
      console.log('First 50 chars:', bytecode.substring(0, 50));
      
      // Try base64 first (most common)
      wasmBytes = base64ToUint8Array(bytecode);
      if (wasmBytes) {
        format = 'base64';
        console.log('Decoded as base64, binary size:', wasmBytes.length);
      } else {
        // Try hex format
        console.log('Base64 decode failed, trying hex format...');
        wasmBytes = hexToUint8Array(bytecode);
        if (wasmBytes) {
          format = 'hex';
          console.log('Decoded as hex, binary size:', wasmBytes.length);
        }
      }
    }
    // If it's an object, try to extract data
    else if (typeof bytecode === 'object' && bytecode !== null) {
      // Check if it has a 'data' or 'bytes' property
      if (bytecode.data) {
        return await wasmBytecodeToText(bytecode.data);
      } else if (bytecode.bytes) {
        return await wasmBytecodeToText(bytecode.bytes);
      } else {
        console.log('Object bytecode, keys:', Object.keys(bytecode));
        return { 
          error: 'Cannot decode object bytecode. Expected string, array, or Uint8Array.',
          debug: {
            inputType: typeof bytecode,
            inputKeys: Object.keys(bytecode)
          }
        };
      }
    }
    
    if (!wasmBytes) {
      return { 
        error: 'Failed to decode bytecode. Expected base64 string, hex string, array of numbers, or Uint8Array.',
        debug: {
          inputType: typeof bytecode,
          isArray: Array.isArray(bytecode),
          isUint8Array: bytecode instanceof Uint8Array,
          inputPreview: typeof bytecode === 'string' ? bytecode.substring(0, 100) : 
                        Array.isArray(bytecode) ? `Array[${bytecode.length}]` : 
                        String(bytecode)
        }
      };
    }
    
    // Validate WASM magic number
    if (wasmBytes.length < 4) {
      return { error: 'Bytecode too short to be valid WASM' };
    }
    
    const magic = String.fromCharCode(wasmBytes[0], wasmBytes[1], wasmBytes[2], wasmBytes[3]);
    if (magic !== '\0asm') {
      return { 
        error: 'Invalid WASM magic number. Expected WASM binary format.',
        debug: {
          magic: Array.from(wasmBytes.slice(0, 4)).map(b => `0x${b.toString(16).padStart(2, '0')}`).join(' '),
          firstBytes: Array.from(wasmBytes.slice(0, 8)).map(b => b.toString(16).padStart(2, '0')).join(' ')
        }
      };
    }
    
    const hex = uint8ArrayToHex(wasmBytes);
    const text = wasmToText(wasmBytes);
    const info = await parseWasm(wasmBytes);
    
    return {
      hex,
      text,
      info,
      size: wasmBytes.length,
      format,
      note: 'Note: This is WASM disassembly (WAT format), not the original Rust source code. Full source code recovery from WASM is not possible.'
    };
  } catch (error) {
    console.error('Error in wasmBytecodeToText:', error);
    console.error('Bytecode type:', typeof bytecode);
    console.error('Bytecode value:', bytecode);
    return { 
      error: error.message,
      stack: error.stack
    };
  }
}

