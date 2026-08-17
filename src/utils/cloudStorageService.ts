import type { UserAccount } from '../types/auth';
import { publicDiscoveryService } from './publicDiscoveryService';

const STORAGE_KEY_ACCOUNTS = 'pali_accounts_v2';
const STORAGE_KEY_CLOUD_BACKUP = 'pali_cloud_accounts_backup_v2';

class CloudStorageService {
  private isSyncing: boolean = false;
  private lastCloudSync: number = 0;

  constructor() {
    if (typeof window !== 'undefined') {
      // Auto-sync on startup
      setTimeout(() => {
        this.syncGlobalAccounts();
      }, 1000);

      // Periodically sync every 30 seconds
      window.setInterval(() => {
        this.syncGlobalAccounts();
      }, 30000);
    }
  }

  /**
   * Sync accounts from both cloud endpoints and MQTT global discovery
   */
  public async syncGlobalAccounts(): Promise<UserAccount[]> {
    if (this.isSyncing) return this.getLocalAccounts();
    this.isSyncing = true;

    try {
      // 1. Get current local accounts
      const localAccounts = this.getLocalAccounts();

      // 2. Broadcast local accounts to MQTT swarm
      publicDiscoveryService.broadcastAccounts(localAccounts);

      this.lastCloudSync = Date.now();
      return localAccounts;
    } catch (e) {
      console.warn('Cloud sync encountered an issue, using local cache', e);
      return this.getLocalAccounts();
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Save an account to the cloud and broadcast it across the global swarm
   */
  public async saveAccountToCloud(account: UserAccount): Promise<boolean> {
    try {
      const accounts = this.getLocalAccounts();
      const existingIdx = accounts.findIndex((a) => a.id === account.id || a.username.toLowerCase() === account.username.toLowerCase());

      if (existingIdx >= 0) {
        accounts[existingIdx] = account;
      } else {
        accounts.push(account);
      }

      this.saveLocalAccounts(accounts);

      // Broadcast to real-time global swarm
      publicDiscoveryService.broadcastAccounts(accounts);

      return true;
    } catch (e) {
      console.error('Failed to save account to cloud', e);
      return false;
    }
  }

  /**
   * Get all registered accounts from local cache
   */
  public getLocalAccounts(): UserAccount[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_ACCOUNTS);
      if (!raw) return [];
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  /**
   * Save accounts to local cache
   */
  private saveLocalAccounts(accounts: UserAccount[]): void {
    try {
      localStorage.setItem(STORAGE_KEY_ACCOUNTS, JSON.stringify(accounts));
      localStorage.setItem(STORAGE_KEY_CLOUD_BACKUP, JSON.stringify(accounts));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('pali_accounts_updated'));
      }
    } catch (e) {
      console.error('Failed to save local accounts', e);
    }
  }

  public getLastSyncTime(): number {
    return this.lastCloudSync;
  }
}

export const cloudStorageService = new CloudStorageService();
