import PocketBase from 'pocketbase';

const PB_URL = 'http://localhost:3001';
const COLLECTION_NAME = 'sales_tracker_data';

// Initialize PocketBase client
export const pb = new PocketBase(PB_URL);

// Disable auto-cancellation for duplicate requests
pb.autoCancellation(false);

// Types
export interface SalesTrackerData {
  id?: string;
  user: string;
  salesData: any[];
  pricingItems: any[];
  videoLogs: any[];
  tasks: any[];
  taskCompletions: any[];
  workLogs: any[];
  competitors: any[];
  products: any[];
  goals: any[];
  windowStates?: Record<string, any>;
  lastUpdated: string;
}

// Authentication Service
export const authService = {
  async login(email: string, password: string) {
    try {
      const authData = await pb.collection('users').authWithPassword(email, password);
      return { success: true, user: authData.record };
    } catch (error: any) {
      console.error('Login error:', error);
      return { success: false, error: error.message || 'Login failed' };
    }
  },

  async register(email: string, password: string) {
    try {
      // Create user
      const user = await pb.collection('users').create({
        email,
        password,
        passwordConfirm: password,
      });

      // Auto-login after registration
      const loginResult = await this.login(email, password);
      return loginResult;
    } catch (error: any) {
      console.error('Registration error:', error);
      return { success: false, error: error.message || 'Registration failed' };
    }
  },

  logout() {
    pb.authStore.clear();
  },

  isAuthenticated(): boolean {
    return pb.authStore.isValid;
  },

  getCurrentUser() {
    return pb.authStore.model;
  },

  // Restore session on app load
  async restoreAuth() {
    // PocketBase automatically restores from localStorage
    return pb.authStore.isValid;
  }
};

// Data Sync Service
export const syncService = {
  // Push local data to PocketBase
  async pushData(data: Partial<SalesTrackerData>): Promise<boolean> {
    if (!authService.isAuthenticated()) {
      console.warn('Not authenticated, skipping push');
      return false;
    }

    try {
      const userId = pb.authStore.model?.id;
      if (!userId) return false;

      // Check if user already has a record
      const existing = await pb.collection(COLLECTION_NAME).getFirstListItem(
        `user="${userId}"`,
        { requestKey: null }
      ).catch(() => null);

      const payload = {
        user: userId,
        ...data,
        lastUpdated: new Date().toISOString(),
      };

      if (existing) {
        // Update existing record
        await pb.collection(COLLECTION_NAME).update(existing.id, payload);
      } else {
        // Create new record
        await pb.collection(COLLECTION_NAME).create(payload);
      }

      console.log('✅ Data pushed to PocketBase');
      return true;
    } catch (error) {
      console.error('Push error:', error);
      return false;
    }
  },

  // Pull data from PocketBase
  async pullData(): Promise<SalesTrackerData | null> {
    if (!authService.isAuthenticated()) {
      console.warn('Not authenticated, skipping pull');
      return null;
    }

    try {
      const userId = pb.authStore.model?.id;
      if (!userId) return null;

      const record = await pb.collection(COLLECTION_NAME).getFirstListItem(
        `user="${userId}"`,
        { requestKey: null }
      );

      console.log('✅ Data pulled from PocketBase');
      return record as unknown as SalesTrackerData;
    } catch (error: any) {
      if (error.status === 404) {
        console.log('No cloud data found (first sync)');
        return null;
      }
      console.error('Pull error:', error);
      return null;
    }
  },

  // Full sync: pull from cloud, merge with local, push back
  async fullSync(localData: Partial<SalesTrackerData>): Promise<SalesTrackerData | null> {
    try {
      // Pull latest from cloud
      const cloudData = await this.pullData();

      if (!cloudData) {
        // No cloud data, push local data
        await this.pushData(localData);
        return null;
      }

      // Return cloud data (last-write-wins strategy)
      return cloudData;
    } catch (error) {
      console.error('Full sync error:', error);
      return null;
    }
  }
};

export default { pb, authService, syncService };
