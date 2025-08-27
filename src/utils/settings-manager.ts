import type { ExtensionSettings, StorageCallback, LoggerFunction } from '../types';
import { DEFAULT_SETTINGS } from '../types';

export class SettingsManager {
  private static settings: ExtensionSettings = { ...DEFAULT_SETTINGS };
  private static logger: LoggerFunction = () => {};

  static async loadSettings(): Promise<ExtensionSettings> {
    return new Promise((resolve) => {
      if (!chrome.storage) {
        resolve(this.settings);
        return;
      }

      chrome.storage.sync.get(DEFAULT_SETTINGS, (result) => {
        if (chrome.runtime.lastError) {
          console.warn('Failed to load settings:', chrome.runtime.lastError);
          resolve(this.settings);
        } else {
          this.settings = result as ExtensionSettings;
          resolve(result as ExtensionSettings);
        }
      });
    });
  }

  static async saveSettings(newSettings: Partial<ExtensionSettings>): Promise<boolean> {
    return new Promise((resolve) => {
      if (!chrome.storage) {
        Object.assign(this.settings, newSettings);
        resolve(true);
        return;
      }

      const updatedSettings = { ...this.settings, ...newSettings };
      
      chrome.storage.sync.set(updatedSettings, () => {
        if (chrome.runtime.lastError) {
          console.error('Failed to save settings:', chrome.runtime.lastError);
          resolve(false);
        } else {
          this.settings = updatedSettings;
          resolve(true);
        }
      });
    });
  }

  static updateLogger(enableDebug: boolean): void {
    this.logger = enableDebug ? console.log.bind(console) : () => {};
  }

  static getLogger(): LoggerFunction {
    return this.logger;
  }

  static getCurrentSettings(): ExtensionSettings {
    return { ...this.settings };
  }

  static onSettingsChanged(callback: StorageCallback<ExtensionSettings>): void {
    if (chrome.storage) {
      chrome.storage.onChanged.addListener((changes, areaName) => {
        if (areaName === 'sync') {
          const updatedSettings = { ...this.settings };
          let hasChanges = false;

          for (const [key, change] of Object.entries(changes)) {
            if (key in DEFAULT_SETTINGS) {
              (updatedSettings as any)[key] = change.newValue;
              hasChanges = true;
            }
          }

          if (hasChanges) {
            this.settings = updatedSettings;
            callback(updatedSettings);
          }
        }
      });
    }
  }
}