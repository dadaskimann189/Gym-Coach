import { PersonalRecord, SetEntry, UserProfile, WeightEntry, Workout } from '../types';

export interface UserAccountData {
  user: UserProfile;
  workouts: Workout[];
  weightHistory: WeightEntry[];
  personalRecords: PersonalRecord[];
  updatedAt?: string;
}

const STORAGE_KEYS = {
  ACTIVE_EMAIL: 'pulse_coach_active_email_v2',
  ACCOUNT_PREFIX: 'pulse_coach_acc_v2_',
  BACKUP_WORKOUTS_PREFIX: 'pulse_coach_workouts_backup_',
};

function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

/**
 * Merges local and server workouts safely without ever discarding completed sets.
 * If server has old sets from past dates but local was reset for a fresh session today,
 * past sets are preserved as an archived session rather than repopulating today's clean workout.
 */
function mergeWorkouts(localWorkouts: Workout[], serverWorkouts: Workout[]): Workout[] {
  if (!localWorkouts || localWorkouts.length === 0) return serverWorkouts || [];
  if (!serverWorkouts || serverWorkouts.length === 0) return localWorkouts;

  const todayStr = new Date().toISOString().split('T')[0];
  const workoutMap = new Map<string, Workout>();

  // Start with local workouts
  for (const w of localWorkouts) {
    workoutMap.set(w.id, { ...w });
  }

  // Combine with server workouts
  for (const sW of serverWorkouts) {
    const lW = workoutMap.get(sW.id);
    if (!lW) {
      workoutMap.set(sW.id, { ...sW });
      continue;
    }

    // If it's an archive workout, keep it
    if (sW.id.startsWith('archive-') || sW.id.startsWith('workout-archive-')) {
      workoutMap.set(sW.id, { ...lW, ...sW });
      continue;
    }

    // For active template workouts:
    // Check if local was reset today (empty sets, today's date) while server has past-date sets
    const localHasNoSets = lW.exercises.every((e) => (e.completedSets || []).length === 0);
    const serverHasPastSets = sW.exercises.some((e) =>
      (e.completedSets || []).some((s) => {
        try {
          return new Date(s.timestamp).toISOString().split('T')[0] < todayStr;
        } catch {
          return false;
        }
      })
    );

    if (localHasNoSets && serverHasPastSets) {
      // Preserve server's past sets by creating an archived workout record
      const archiveId = `archive-${sW.id}-${sW.date || 'past'}`;
      if (!workoutMap.has(archiveId)) {
        workoutMap.set(archiveId, {
          ...sW,
          id: archiveId,
          completed: true,
          completedAt: sW.completedAt || new Date().toISOString(),
        });
      }
      // Keep local clean for today!
      continue;
    }

    // Merge exercises within the workout
    const mergedExercises = lW.exercises.map((lEx) => {
      const sEx = sW.exercises.find((e) => e.exerciseId === lEx.exerciseId);
      if (!sEx) return lEx;

      // Union completed sets deduplicating by set ID
      const setMap = new Map<string, SetEntry>();
      // First add server sets
      for (const set of sEx.completedSets || []) {
        if (set.completed) setMap.set(set.id, set);
      }
      // Then add local sets (local sets take precedence if duplicate ID)
      for (const set of lEx.completedSets || []) {
        if (set.completed) setMap.set(set.id, set);
      }

      const mergedSets = Array.from(setMap.values()).sort((a, b) => a.setNumber - b.setNumber);

      return {
        ...lEx,
        completedSets: mergedSets,
        targetSets: Math.max(lEx.targetSets, sEx.targetSets),
      };
    });

    workoutMap.set(sW.id, {
      ...lW,
      completed: lW.completed || sW.completed,
      completedAt: lW.completedAt || sW.completedAt,
      exercises: mergedExercises,
    });
  }

  return Array.from(workoutMap.values());
}

function mergeWeightHistory(localHistory: WeightEntry[] = [], serverHistory: WeightEntry[] = []): WeightEntry[] {
  const map = new Map<string, WeightEntry>();
  for (const w of serverHistory) {
    map.set(w.date || w.id, w);
  }
  for (const w of localHistory) {
    map.set(w.date || w.id, w);
  }
  return Array.from(map.values()).sort((a, b) => (a.date > b.date ? 1 : -1));
}

function mergePRs(localPRs: PersonalRecord[] = [], serverPRs: PersonalRecord[] = []): PersonalRecord[] {
  const map = new Map<string, PersonalRecord>();
  for (const p of serverPRs) {
    map.set(p.exerciseId, p);
  }
  for (const p of localPRs) {
    const existing = map.get(p.exerciseId);
    if (!existing || p.weight > existing.weight) {
      map.set(p.exerciseId, p);
    }
  }
  return Array.from(map.values());
}

export const StorageService = {
  // Session management
  getActiveEmail(): string | null {
    try {
      const email = localStorage.getItem(STORAGE_KEYS.ACTIVE_EMAIL);
      return email ? normalizeEmail(email) : null;
    } catch {
      return null;
    }
  },

  setActiveEmail(email: string): void {
    try {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_EMAIL, normalizeEmail(email));
    } catch (e) {
      console.error('Failed to set active email', e);
    }
  },

  clearSession(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_EMAIL);
    } catch (e) {
      console.error('Failed to clear session', e);
    }
  },

  // Local per-account storage
  getLocalAccount(email: string): UserAccountData | null {
    try {
      const key = STORAGE_KEYS.ACCOUNT_PREFIX + normalizeEmail(email);
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      console.error('Failed reading local account', e);
      return null;
    }
  },

  saveLocalAccount(email: string, data: UserAccountData): void {
    try {
      const norm = normalizeEmail(email);
      const key = STORAGE_KEYS.ACCOUNT_PREFIX + norm;
      localStorage.setItem(key, JSON.stringify(data));
      // Save direct workouts backup as extra safety net
      if (data.workouts && data.workouts.length > 0) {
        localStorage.setItem(STORAGE_KEYS.BACKUP_WORKOUTS_PREFIX + norm, JSON.stringify(data.workouts));
      }
    } catch (e) {
      console.error('Failed saving local account', e);
    }
  },

  // Server synchronization
  async fetchServerAccount(email: string): Promise<UserAccountData | null> {
    try {
      const res = await fetch(`/api/users/${encodeURIComponent(normalizeEmail(email))}`);
      if (res.ok) {
        const json = await res.json();
        if (json && json.user) {
          return json as UserAccountData;
        }
      }
    } catch (e) {
      console.warn('Server sync unavailable (offline/dev fallback):', e);
    }
    return null;
  },

  async pushServerAccount(email: string, data: UserAccountData): Promise<void> {
    try {
      await fetch(`/api/users/${encodeURIComponent(normalizeEmail(email))}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    } catch (e) {
      console.warn('Failed pushing to server:', e);
    }
  },

  // Check legacy un-namespaced storage from previous sessions
  getLegacyData(): UserAccountData | null {
    try {
      const userRaw = localStorage.getItem('pulse_coach_user');
      const workoutsRaw = localStorage.getItem('pulse_coach_workouts');
      const weightRaw = localStorage.getItem('pulse_coach_weight_history');
      const prsRaw = localStorage.getItem('pulse_coach_prs');
      if (userRaw || workoutsRaw || weightRaw) {
        return {
          user: userRaw ? JSON.parse(userRaw) : null,
          workouts: workoutsRaw ? JSON.parse(workoutsRaw) : [],
          weightHistory: weightRaw ? JSON.parse(weightRaw) : [],
          personalRecords: prsRaw ? JSON.parse(prsRaw) : [],
        };
      }
    } catch (e) {
      console.warn('Failed reading legacy storage', e);
    }
    return null;
  },

  // Synchronized load or retrieve for login
  async loadAccount(email: string): Promise<UserAccountData | null> {
    const normalized = normalizeEmail(email);
    const local = this.getLocalAccount(normalized);
    let server: UserAccountData | null = null;

    try {
      server = await this.fetchServerAccount(normalized);
    } catch {}

    const legacy = this.getLegacyData();

    let merged: UserAccountData | null = null;

    if (server && server.user && local && local.user) {
      // Both server and local exist: SMART MERGE!
      // NEVER delete local completed sets if server doesn't have them!
      const mergedWorkouts = mergeWorkouts(local.workouts, server.workouts);
      const mergedWeights = mergeWeightHistory(local.weightHistory, server.weightHistory);
      const mergedPRs = mergePRs(local.personalRecords, server.personalRecords);

      const user = local.updatedAt && server.updatedAt && local.updatedAt > server.updatedAt
        ? local.user
        : server.user;

      merged = {
        user,
        workouts: mergedWorkouts,
        weightHistory: mergedWeights,
        personalRecords: mergedPRs,
        updatedAt: new Date().toISOString(),
      };
    } else if (server && server.user) {
      merged = { ...server };
      if ((!merged.workouts || merged.workouts.length === 0) && local?.workouts && local.workouts.length > 0) {
        merged.workouts = local.workouts;
      }
      if ((!merged.workouts || merged.workouts.length === 0) && legacy?.workouts && legacy.workouts.length > 0) {
        merged.workouts = legacy.workouts;
      }
    } else if (local && local.user) {
      merged = { ...local };
      if ((!merged.workouts || merged.workouts.length === 0) && legacy?.workouts && legacy.workouts.length > 0) {
        merged.workouts = legacy.workouts;
      }
    } else if (legacy && legacy.user) {
      merged = {
        ...legacy,
        user: {
          ...legacy.user,
          email: normalized,
        },
      };
    }

    // Check backup workouts if still empty
    if (merged && (!merged.workouts || merged.workouts.length === 0)) {
      try {
        const backupRaw = localStorage.getItem(STORAGE_KEYS.BACKUP_WORKOUTS_PREFIX + normalized);
        if (backupRaw) {
          merged.workouts = JSON.parse(backupRaw);
        }
      } catch {}
    }

    if (merged) {
      if (!merged.user?.isDemo) {
        // Strip demo PRs for real users
        merged.personalRecords = (merged.personalRecords || []).filter(
          (r) =>
            !(
              (r.exerciseId === 'bench-press' && r.weight === 65) ||
              (r.exerciseId === 'squats' && r.weight === 85) ||
              (r.exerciseId === 'leg-press' && r.weight === 150) ||
              (r.exerciseId === 'lat-pulldown' && r.weight === 60)
            )
        );
      }

      this.saveLocalAccount(normalized, merged);
      this.pushServerAccount(normalized, merged).catch(() => {});
      return merged;
    }

    return null;
  },

  saveFullAccount(email: string, data: UserAccountData): void {
    const normalized = normalizeEmail(email);
    this.saveLocalAccount(normalized, data);
    this.pushServerAccount(normalized, data).catch(() => {});
  },

  // Active session getters (returns null if not logged in -> directly shows login)
  getUser(): UserProfile | null {
    const email = this.getActiveEmail();
    if (!email) return null;
    const acc = this.getLocalAccount(email);
    return acc ? acc.user : null;
  },

  getWorkouts(): Workout[] {
    const email = this.getActiveEmail();
    if (!email) return [];
    const acc = this.getLocalAccount(email);
    if (acc && acc.workouts && acc.workouts.length > 0) {
      return acc.workouts;
    }
    // Fallback to direct backup key
    try {
      const backupRaw = localStorage.getItem(STORAGE_KEYS.BACKUP_WORKOUTS_PREFIX + normalizeEmail(email));
      if (backupRaw) {
        return JSON.parse(backupRaw);
      }
    } catch {}
    return [];
  },

  getWeightHistory(): WeightEntry[] {
    const email = this.getActiveEmail();
    if (!email) return [];
    const acc = this.getLocalAccount(email);
    return acc ? acc.weightHistory : [];
  },

  getPersonalRecords(): PersonalRecord[] {
    const email = this.getActiveEmail();
    if (!email) return [];
    const acc = this.getLocalAccount(email);
    return acc ? acc.personalRecords : [];
  },

  saveUser(user: UserProfile): void {
    if (!user.email) return;
    const email = normalizeEmail(user.email);
    const current = this.getLocalAccount(email) || {
      user,
      workouts: [],
      weightHistory: [],
      personalRecords: [],
    };
    current.user = user;
    current.updatedAt = new Date().toISOString();
    this.saveFullAccount(email, current);
  },

  saveWorkouts(workouts: Workout[]): void {
    const email = this.getActiveEmail();
    if (!email) return;
    const norm = normalizeEmail(email);
    const current = this.getLocalAccount(norm) || {
      user: this.getUser()!,
      workouts: [],
      weightHistory: [],
      personalRecords: [],
    };
    current.workouts = workouts;
    current.updatedAt = new Date().toISOString();
    this.saveFullAccount(norm, current);
    try {
      localStorage.setItem(STORAGE_KEYS.BACKUP_WORKOUTS_PREFIX + norm, JSON.stringify(workouts));
    } catch {}
  },

  saveWeightHistory(history: WeightEntry[]): void {
    const email = this.getActiveEmail();
    if (!email) return;
    const current = this.getLocalAccount(email);
    if (!current) return;
    current.weightHistory = history;
    current.updatedAt = new Date().toISOString();
    this.saveFullAccount(email, current);
  },

  savePersonalRecords(prs: PersonalRecord[]): void {
    const email = this.getActiveEmail();
    if (!email) return;
    const current = this.getLocalAccount(email);
    if (!current) return;
    current.personalRecords = prs;
    current.updatedAt = new Date().toISOString();
    this.saveFullAccount(email, current);
  },
};
