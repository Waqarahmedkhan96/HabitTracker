/**
 * In-browser API used when the app is built with VITE_DEMO_MODE=true.
 * It mirrors the Spring Boot endpoints closely enough to explore the UI
 * without a backend. Data lives in localStorage and is seeded on first use.
 */
import type {
  CategoryResponse,
  DashboardResponse,
  HabitEntryResponse,
  HabitEntryStatus,
  HabitResponse,
  ProfileResponse,
  ReminderResponse,
} from '../../types';

interface StoredHabit extends Omit<HabitResponse, 'currentStreak' | 'longestStreak' | 'successPercentage' | 'categoryName'> {
  sortOrder: number;
}

interface DemoDb {
  profile: ProfileResponse;
  categories: CategoryResponse[];
  habits: StoredHabit[];
  entries: HabitEntryResponse[];
  reminders: ReminderResponse[];
}

export interface DemoRequest {
  method: string;
  path: string;
  query?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
}

export class DemoHttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

const STORAGE_KEY = 'habittracker-demo-db-v1';
const WEEKDAYS = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

const uid = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(16)}-${Math.random().toString(16).slice(2)}`;

const toIso = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const fromIso = (iso: string) => new Date(`${iso}T00:00:00`);

// Small deterministic PRNG so the seeded history looks the same on every load.
const createRandom = (seed: number) => () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
};

const isScheduled = (habit: Pick<StoredHabit, 'frequencyType' | 'selectedDaysCsv'>, date: Date) => {
  if (habit.frequencyType === 'DAILY') {
    return true;
  }
  const days = (habit.selectedDaysCsv ?? '').split(',').map((day) => day.trim().toUpperCase());
  return days.includes(WEEKDAYS[date.getDay()]);
};

const seed = (): DemoDb => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const random = createRandom(42);
  const created = (daysAgo: number) => `${toIso(addDays(today, -daysAgo))}T08:00:00`;

  const categories: CategoryResponse[] = [
    { id: uid(), name: 'Health', description: 'Body and energy', createdAt: created(90) },
    { id: uid(), name: 'Mind', description: 'Focus, learning and calm', createdAt: created(90) },
    { id: uid(), name: 'Work', description: 'Deep work and career', createdAt: created(90) },
  ];
  const [health, mind, work] = categories;

  const habitSeeds: Array<Omit<StoredHabit, 'id' | 'sortOrder' | 'reminderEnabled'> & { rate: number }> = [
    { title: 'Morning walk', description: '20 minutes outside before breakfast.', habitType: 'BOOLEAN', frequencyType: 'DAILY', categoryId: health.id, active: true, targetValue: null, unit: null, selectedDaysCsv: null, createdAt: created(70), rate: 0.86 },
    { title: 'Drink water', description: 'Stay hydrated through the day.', habitType: 'NUMERIC', frequencyType: 'DAILY', categoryId: health.id, active: true, targetValue: 8, unit: 'glasses', selectedDaysCsv: null, createdAt: created(60), rate: 0.78 },
    { title: 'Read', description: 'Fiction or non-fiction, no screens.', habitType: 'NUMERIC', frequencyType: 'DAILY', categoryId: mind.id, active: true, targetValue: 20, unit: 'pages', selectedDaysCsv: null, createdAt: created(55), rate: 0.7 },
    { title: 'Meditate', description: 'Ten quiet minutes.', habitType: 'BOOLEAN', frequencyType: 'DAILY', categoryId: mind.id, active: true, targetValue: null, unit: null, selectedDaysCsv: null, createdAt: created(45), rate: 0.64 },
    { title: 'Strength training', description: 'Full-body session at the gym.', habitType: 'BOOLEAN', frequencyType: 'SELECTED_DAYS', categoryId: health.id, active: true, targetValue: null, unit: null, selectedDaysCsv: 'MONDAY,WEDNESDAY,FRIDAY', createdAt: created(80), rate: 0.82 },
    { title: 'Deep work block', description: 'Two hours, notifications off.', habitType: 'BOOLEAN', frequencyType: 'SELECTED_DAYS', categoryId: work.id, active: true, targetValue: null, unit: null, selectedDaysCsv: 'MONDAY,TUESDAY,WEDNESDAY,THURSDAY,FRIDAY', createdAt: created(40), rate: 0.75 },
    { title: 'Journal', description: 'Three lines before bed.', habitType: 'BOOLEAN', frequencyType: 'DAILY', categoryId: mind.id, active: false, targetValue: null, unit: null, selectedDaysCsv: null, createdAt: created(90), rate: 0.5 },
  ];

  const habits: StoredHabit[] = [];
  const entries: HabitEntryResponse[] = [];

  habitSeeds.forEach(({ rate, ...habitSeed }, index) => {
    const habit: StoredHabit = { ...habitSeed, id: uid(), sortOrder: index, reminderEnabled: false };
    habits.push(habit);

    const start = fromIso(habit.createdAt.slice(0, 10));
    const end = habit.active ? addDays(today, -1) : addDays(today, -30);

    for (let date = new Date(start); date <= end; date = addDays(date, 1)) {
      if (!isScheduled(habit, date)) {
        continue;
      }
      const roll = random();
      if (roll > 0.94) {
        continue; // occasionally forget to log
      }
      let status: HabitEntryStatus = roll < rate ? 'COMPLETED' : 'MISSED';
      let valueAchieved: number | null = null;
      if (habit.habitType === 'NUMERIC' && habit.targetValue) {
        if (status === 'COMPLETED') {
          valueAchieved = habit.targetValue + Math.round(random() * 3);
        } else if (random() > 0.35) {
          valueAchieved = Math.max(1, Math.round(habit.targetValue * (0.3 + random() * 0.5)));
          status = 'PARTIAL';
        } else {
          valueAchieved = 0;
        }
      }
      entries.push({ id: uid(), habitId: habit.id, entryDate: toIso(date), status, valueAchieved, note: null });
    }
  });

  // Keep the most recent stretch positive so the streaks look alive.
  habits.slice(0, 2).forEach((habit) => {
    for (let back = 1; back <= 9; back += 1) {
      const iso = toIso(addDays(today, -back));
      const entry = entries.find((item) => item.habitId === habit.id && item.entryDate === iso);
      if (entry) {
        entry.status = 'COMPLETED';
        entry.valueAchieved = habit.targetValue ?? null;
      }
    }
  });

  // A couple of habits are already logged today.
  const todayIso = toIso(today);
  entries.push({ id: uid(), habitId: habits[0].id, entryDate: todayIso, status: 'COMPLETED', valueAchieved: null, note: null });
  entries.push({ id: uid(), habitId: habits[1].id, entryDate: todayIso, status: 'PARTIAL', valueAchieved: 5, note: null });

  return {
    profile: {
      id: uid(),
      email: 'alex.morgan@example.com',
      username: 'alexmorgan',
      firstName: 'Alex',
      lastName: 'Morgan',
      themeMode: 'SYSTEM',
      emailNotifications: true,
      pushNotifications: false,
    },
    categories,
    habits,
    entries,
    reminders: [],
  };
};

const load = (): DemoDb => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw) as DemoDb;
    }
  } catch {
    // Fall through to a fresh seed.
  }
  const db = seed();
  save(db);
  return db;
};

const save = (db: DemoDb) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch {
    // Storage full or unavailable: the demo still works for this session.
  }
};

const streaks = (habit: StoredHabit, entries: HabitEntryResponse[]) => {
  const byDate = new Map(entries.map((entry) => [entry.entryDate, entry.status]));
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = fromIso(habit.createdAt.slice(0, 10));

  let current = 0;
  for (let date = new Date(today); date >= start; date = addDays(date, -1)) {
    if (!isScheduled(habit, date)) continue;
    const status = byDate.get(toIso(date));
    if (status === 'MISSED') break;
    if (status === 'COMPLETED') current += 1;
  }

  let longest = 0;
  let run = 0;
  for (let date = new Date(start); date <= today; date = addDays(date, 1)) {
    if (!isScheduled(habit, date)) continue;
    const status = byDate.get(toIso(date));
    if (status === 'COMPLETED') {
      run += 1;
      longest = Math.max(longest, run);
    } else if (status === 'MISSED' || status === 'PARTIAL') {
      run = 0;
    }
  }

  const tracked = entries.length;
  const completed = entries.filter((entry) => entry.status === 'COMPLETED').length;
  return {
    currentStreak: current,
    longestStreak: Math.max(longest, current),
    successPercentage: tracked === 0 ? 0 : Math.round((completed / tracked) * 1000) / 10,
  };
};

const toResponse = (db: DemoDb, habit: StoredHabit): HabitResponse => {
  const entries = db.entries.filter((entry) => entry.habitId === habit.id);
  const { sortOrder: _sortOrder, ...rest } = habit;
  void _sortOrder;
  return {
    ...rest,
    categoryName: db.categories.find((category) => category.id === habit.categoryId)?.name ?? null,
    ...streaks(habit, entries),
  };
};

const findHabit = (db: DemoDb, id: string) => {
  const habit = db.habits.find((item) => item.id === id);
  if (!habit) {
    throw new DemoHttpError(404, 'Habit not found');
  }
  return habit;
};

const csv = (rows: Array<Array<string | number | boolean | null>>) =>
  rows.map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function handleDemoRequest({ method, path, query, body }: DemoRequest): Promise<unknown> {
  await delay(180 + Math.random() * 220);

  const db = load();
  const segments = path.replace(/^\/api\//, '').split('/').filter(Boolean);
  const payload = (body ?? {}) as Record<string, unknown>;
  const route = `${method} ${segments.map((segment, index) => (index > 0 && /^[0-9a-f-]{8,}$/i.test(segment) ? ':id' : segment)).join('/')}`;

  switch (route) {
    case 'POST auth/login':
    case 'POST auth/register': {
      if (route === 'POST auth/register') {
        db.profile = {
          ...db.profile,
          email: String(payload.email ?? db.profile.email),
          username: String(payload.username ?? db.profile.username),
          firstName: String(payload.firstName ?? db.profile.firstName),
          lastName: String(payload.lastName ?? db.profile.lastName),
        };
        save(db);
      }
      return { token: 'demo-token', tokenType: 'Bearer', email: db.profile.email, username: db.profile.username, role: 'USER' };
    }

    case 'GET profile':
      return db.profile;

    case 'PUT profile': {
      db.profile = {
        ...db.profile,
        ...Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined && value !== null)),
      } as ProfileResponse;
      save(db);
      return db.profile;
    }

    case 'GET categories':
      return [...db.categories].sort((a, b) => a.name.localeCompare(b.name));

    case 'POST categories': {
      const name = String(payload.name ?? '').trim();
      if (!name) throw new DemoHttpError(400, 'Name is required');
      if (db.categories.some((category) => category.name.toLowerCase() === name.toLowerCase())) {
        throw new DemoHttpError(409, 'A category with this name already exists');
      }
      const category: CategoryResponse = { id: uid(), name, description: (payload.description as string) || null, createdAt: new Date().toISOString() };
      db.categories.push(category);
      save(db);
      return category;
    }

    case 'PUT categories/:id': {
      const category = db.categories.find((item) => item.id === segments[1]);
      if (!category) throw new DemoHttpError(404, 'Category not found');
      category.name = String(payload.name ?? category.name).trim();
      category.description = (payload.description as string) || null;
      save(db);
      return category;
    }

    case 'DELETE categories/:id': {
      db.categories = db.categories.filter((item) => item.id !== segments[1]);
      db.habits.forEach((habit) => {
        if (habit.categoryId === segments[1]) habit.categoryId = null;
      });
      save(db);
      return undefined;
    }

    case 'GET habits':
      return [...db.habits].sort((a, b) => a.sortOrder - b.sortOrder).map((habit) => toResponse(db, habit));

    case 'POST habits': {
      const habit: StoredHabit = {
        id: uid(),
        title: String(payload.title ?? 'Untitled'),
        description: (payload.description as string) ?? null,
        habitType: (payload.habitType as StoredHabit['habitType']) ?? 'BOOLEAN',
        frequencyType: (payload.frequencyType as StoredHabit['frequencyType']) ?? 'DAILY',
        categoryId: (payload.categoryId as string) ?? null,
        active: payload.active !== false,
        reminderEnabled: Boolean(payload.reminderEnabled),
        targetValue: (payload.targetValue as number) ?? null,
        unit: (payload.unit as string) ?? null,
        selectedDaysCsv: (payload.selectedDaysCsv as string) ?? null,
        createdAt: new Date().toISOString().slice(0, 19),
        sortOrder: db.habits.length,
      };
      db.habits.push(habit);
      save(db);
      return toResponse(db, habit);
    }

    case 'PATCH habits/order': {
      const ids = (payload.habitIds as string[]) ?? [];
      ids.forEach((id, index) => {
        const habit = db.habits.find((item) => item.id === id);
        if (habit) habit.sortOrder = index;
      });
      save(db);
      return undefined;
    }

    case 'GET habits/:id':
      return toResponse(db, findHabit(db, segments[1]));

    case 'PUT habits/:id': {
      const habit = findHabit(db, segments[1]);
      Object.assign(habit, {
        title: payload.title ?? habit.title,
        description: payload.description ?? null,
        habitType: payload.habitType ?? habit.habitType,
        frequencyType: payload.frequencyType ?? habit.frequencyType,
        categoryId: payload.categoryId ?? null,
        targetValue: payload.targetValue ?? null,
        unit: payload.unit ?? null,
        selectedDaysCsv: payload.selectedDaysCsv ?? null,
        active: payload.active ?? habit.active,
      });
      save(db);
      return toResponse(db, habit);
    }

    case 'DELETE habits/:id': {
      findHabit(db, segments[1]).active = false;
      save(db);
      return undefined;
    }

    case 'GET habits/:id/entries':
      findHabit(db, segments[1]);
      return db.entries
        .filter((entry) => entry.habitId === segments[1])
        .sort((a, b) => b.entryDate.localeCompare(a.entryDate));

    case 'POST habits/:id/entries':
    case 'PUT habits/:id/entries/:id': {
      findHabit(db, segments[1]);
      const entryDate = String(payload.entryDate);
      let entry = db.entries.find((item) => item.habitId === segments[1] && item.entryDate === entryDate);
      if (!entry) {
        entry = { id: uid(), habitId: segments[1], entryDate, status: 'COMPLETED', valueAchieved: null, note: null };
        db.entries.push(entry);
      }
      entry.status = payload.status as HabitEntryStatus;
      entry.valueAchieved = (payload.valueAchieved as number) ?? null;
      entry.note = (payload.note as string) ?? null;
      save(db);
      return entry;
    }

    case 'GET habits/:id/reminders':
      return db.reminders.filter((reminder) => reminder.habitId === segments[1]);

    case 'GET dashboard': {
      const date = String(query?.date ?? toIso(new Date()));
      const day = fromIso(date);
      const active = db.habits.filter((habit) => habit.active);
      const due = active.filter((habit) => isScheduled(habit, day));
      const todays = db.entries.filter((entry) => entry.entryDate === date && due.some((habit) => habit.id === entry.habitId));
      const completedToday = todays.filter((entry) => entry.status === 'COMPLETED').length;
      const missedToday = todays.filter((entry) => entry.status === 'MISSED').length;

      let masterStreak = 0;
      for (let cursor = addDays(day, -1); masterStreak < 365; cursor = addDays(cursor, -1)) {
        const iso = toIso(cursor);
        const scheduled = active.filter((habit) => isScheduled(habit, cursor) && habit.createdAt.slice(0, 10) <= iso);
        if (scheduled.length === 0) break;
        const perfect = scheduled.every((habit) =>
          db.entries.some((entry) => entry.habitId === habit.id && entry.entryDate === iso && entry.status === 'COMPLETED'),
        );
        if (!perfect) break;
        masterStreak += 1;
      }

      const response: DashboardResponse = {
        totalActiveHabits: active.length,
        completedToday,
        missedToday,
        masterStreak,
        todayCompletionPercentage: due.length === 0 ? 0 : Math.round((completedToday / due.length) * 1000) / 10,
        habitTitlesDueToday: due.map((habit) => habit.title),
      };
      return response;
    }

    case 'GET export/habits':
      return csv([
        ['id', 'title', 'type', 'frequency', 'category', 'active'],
        ...db.habits.map((habit) => [habit.id, habit.title, habit.habitType, habit.frequencyType, db.categories.find((c) => c.id === habit.categoryId)?.name ?? '', habit.active]),
      ]);

    case 'GET export/entries':
      return csv([
        ['habit', 'date', 'status', 'value'],
        ...db.entries.map((entry) => [db.habits.find((habit) => habit.id === entry.habitId)?.title ?? '', entry.entryDate, entry.status, entry.valueAchieved]),
      ]);

    default:
      throw new DemoHttpError(404, `Demo API has no handler for ${method} ${path}`);
  }
}
