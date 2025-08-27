import type { StringProcessingResult } from '../types';

export class StringProcessor {
  static processSelectedText(text: string): StringProcessingResult | null {
    const trimmed = text.trim();
    if (!trimmed) return null;

    // Method 1: Direct JSON.parse for quoted strings
    const jsonResult = this.tryJsonParse(trimmed);
    if (jsonResult.success) return jsonResult;

    // Method 2: Extract longest quoted JSON string
    const extractResult = this.tryExtractJsonString(trimmed);
    if (extractResult.success) return extractResult;

    return null;
  }

  private static tryJsonParse(text: string): StringProcessingResult {
    try {
      // Only handle double quotes (JSON standard)
      if (text.startsWith('"') && text.endsWith('"')) {
        const parsed = JSON.parse(text);
        if (typeof parsed === 'string' && parsed !== text) {
          return {
            decoded: parsed,
            method: 'json',
            success: true
          };
        }
      }
    } catch {
      // Silent fail
    }
    
    return { decoded: '', method: 'json', success: false };
  }

  private static tryExtractJsonString(text: string): StringProcessingResult {
    // Regex to match JSON strings: "..." with proper escape handling
    // /"([^"\\]|\\.)*"/g breakdown:
    // - " : opening quote
    // - ([^"\\]|\\.)*: string content (any char except " and \, OR escaped sequences like \n, \", \\)  
    // - " : closing quote
    // - g : global flag to find all matches
    const quotedRegex = /"([^"\\]|\\.)*"/g;
    let longestMatch = '';
    let match: RegExpExecArray | null;

    // Find the longest quoted string
    while ((match = quotedRegex.exec(text)) !== null) {
      if (match[0].length > longestMatch.length) {
        longestMatch = match[0];
      }
    }

    if (longestMatch.length >= 2) {
      try {
        const parsed = JSON.parse(longestMatch);
        if (typeof parsed === 'string' && parsed !== longestMatch) {
          return {
            decoded: parsed,
            method: 'extract',
            success: true
          };
        }
      } catch {
        // Silent fail
      }
    }

    return { decoded: '', method: 'extract', success: false };
  }

}