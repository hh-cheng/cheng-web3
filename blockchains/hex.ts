/**
 * Convert a UTF-8 string to a hex string.
 *
 * - Uses UTF-8 encoding
 * - Returns lowercase hex
 * - Optionally prepends `0x`
 */
export function stringToHex(
  input: string,
  withPrefix: boolean = false,
): string {
  if (typeof input !== 'string') {
    throw new TypeError('stringToHex: input must be a string')
  }

  if (input.length === 0) {
    return withPrefix ? '0x' : ''
  }

  const encoder = new TextEncoder()
  const bytes = encoder.encode(input)

  let hex = ''
  for (let i = 0; i < bytes.length; i++) {
    const byte = bytes[i]
    const byteHex = byte.toString(16).padStart(2, '0')
    hex += byteHex
  }

  return withPrefix ? `0x${hex}` : hex
}

/**
 * Convert a hex string (with or without 0x prefix) back to a UTF-8 string.
 *
 * - Accepts `0x` prefix
 * - Validates hex format and even length
 */
export function hexToString(hexInput: string): string {
  if (typeof hexInput !== 'string') {
    throw new TypeError('hexToString: input must be a string')
  }

  let hex = hexInput.trim()
  if (hex.startsWith('0x') || hex.startsWith('0X')) {
    hex = hex.slice(2)
  }

  if (hex.length === 0) return ''

  if (hex.length % 2 !== 0) {
    throw new Error('hexToString: hex string must have an even length')
  }

  if (!/^[0-9a-fA-F]+$/.test(hex)) {
    throw new Error('hexToString: input contains non-hex characters')
  }

  const byteCount = hex.length / 2
  const bytes = new Uint8Array(byteCount)
  for (let i = 0; i < byteCount; i++) {
    const byteHex = hex.slice(i * 2, i * 2 + 2)
    bytes[i] = parseInt(byteHex, 16)
  }

  const decoder = new TextDecoder('utf-8', { fatal: false })
  return decoder.decode(bytes)
}

/**
 * Type guard that checks if a value is a valid hex string (optionally 0x-prefixed).
 */
export function isHex(value: unknown): value is string {
  if (typeof value !== 'string') return false
  const v =
    value.startsWith('0x') || value.startsWith('0X') ? value.slice(2) : value
  return v.length % 2 === 0 && /^[0-9a-fA-F]*$/.test(v)
}
