// Extension settings interface
export interface ExtensionSettings {
  enablePopup: boolean;
  enableDebug: boolean;
}

// Chrome storage callback type
export type StorageCallback<T> = (result: T) => void;

// Panel state interface
export interface PanelState {
  isVisible: boolean;
  lastText: string;
}

// Logger function type
export type LoggerFunction = (...args: any[]) => void;

// Constants
export const STYLE_HOST_ID = "inline-json-string-renderer-host";

export const DEFAULT_SETTINGS: ExtensionSettings = {
  enablePopup: true,
  enableDebug: false
};

// String processing result
export interface StringProcessingResult {
  decoded: string;
  method: 'json' | 'extract' | 'loose';
  success: boolean;
}