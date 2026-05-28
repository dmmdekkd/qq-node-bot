import type { QuoteChar } from '../types'

function isQuoteChar(char: string): char is QuoteChar {
  return char === '"' || char === "'"
}

export function trimQuote(str: string): string {
  if (str.length < 2) return str
  
  const first = str[0]
  const last = str[str.length - 1]
  
  if (isQuoteChar(first) && first === last) {
    return str.slice(1, -1)
  }
  
  return str
}