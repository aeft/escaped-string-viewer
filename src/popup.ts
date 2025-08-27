import type { ExtensionSettings } from './types';
import { DEFAULT_SETTINGS } from './types';

class PopupController {
  private enablePopupCheckbox: HTMLInputElement;
  private enableDebugCheckbox: HTMLInputElement;
  private statusMessage: HTMLElement;

  constructor() {
    this.enablePopupCheckbox = document.getElementById('enablePopup') as HTMLInputElement;
    this.enableDebugCheckbox = document.getElementById('enableDebug') as HTMLInputElement;
    this.statusMessage = document.getElementById('statusMessage') as HTMLElement;
    
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      const savedSettings = await this.loadSettings();
      
      this.enablePopupCheckbox.checked = savedSettings.enablePopup;
      this.enableDebugCheckbox.checked = savedSettings.enableDebug;
      
      this.enablePopupCheckbox.addEventListener('change', () => this.handleSettingChange());
      this.enableDebugCheckbox.addEventListener('change', () => this.handleSettingChange());
      
    } catch (error) {
      console.error('Failed to initialize popup:', error);
    }
  }

  private async loadSettings(): Promise<ExtensionSettings> {
    return new Promise((resolve) => {
      chrome.storage.sync.get(DEFAULT_SETTINGS, (result) => {
        resolve(result as ExtensionSettings);
      });
    });
  }

  private async saveSettings(settings: ExtensionSettings): Promise<void> {
    return new Promise((resolve, reject) => {
      chrome.storage.sync.set(settings, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve();
        }
      });
    });
  }

  private async handleSettingChange(): Promise<void> {
    try {
      const currentSettings: ExtensionSettings = {
        enablePopup: this.enablePopupCheckbox.checked,
        enableDebug: this.enableDebugCheckbox.checked
      };
      
      await this.saveSettings(currentSettings);
      
      if (currentSettings.enableDebug) {
        localStorage.setItem('ijsr-debug', 'true');
      } else {
        localStorage.removeItem('ijsr-debug');
      }
      
      this.showStatusMessage('Settings saved!', 'success');
      this.notifyContentScripts(currentSettings);
      
    } catch (error) {
      console.error('Failed to save settings:', error);
      this.showStatusMessage('Failed to save settings', 'error');
    }
  }

  private showStatusMessage(message: string, type: 'success' | 'error' = 'success'): void {
    this.statusMessage.textContent = message;
    this.statusMessage.className = `status-message ${type}`;
    
    setTimeout(() => {
      this.statusMessage.style.opacity = '0';
      setTimeout(() => {
        this.statusMessage.className = 'status-message';
        this.statusMessage.style.opacity = '1';
      }, 300);
    }, 2000);
  }

  private notifyContentScripts(settings: ExtensionSettings): void {
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach(tab => {
        if (tab.id) {
          chrome.tabs.sendMessage(tab.id, {
            type: 'SETTINGS_UPDATED',
            settings: settings
          }).catch(() => {
            // Ignore errors for tabs that don't have content script loaded
          });
        }
      });
    });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new PopupController());
} else {
  new PopupController();
}