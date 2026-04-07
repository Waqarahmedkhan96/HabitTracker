export type UUID = string;

export type FrequencyType = 'DAILY' | 'SELECTED_DAYS';
export type HabitType = 'BOOLEAN' | 'NUMERIC';
export type HabitEntryStatus = 'COMPLETED' | 'MISSED' | 'PARTIAL';
export type ThemeMode = 'LIGHT' | 'DARK' | 'SYSTEM';
export type UserRole = 'USER' | 'ADMIN';

export interface ApiErrorResponse {
	timestamp: string;
	status: number;
	error: string;
	message: string;
	path: string;
}

export interface RegisterRequest {
	email: string;
	username: string;
	password: string;
	firstName: string;
	lastName: string;
}

export interface LoginRequest {
	emailOrUsername: string;
	password: string;
}

export interface AuthResponse {
	token: string;
	tokenType: string;
	email: string;
	username: string;
	role: UserRole;
}

export interface AuthUser {
	email: string;
	username: string;
	role: UserRole;
}

export interface HabitRequest {
	title: string;
	description?: string;
	habitType: HabitType;
	frequencyType: FrequencyType;
	categoryId?: UUID;
	targetValue?: number;
	unit?: string;
	selectedDaysCsv?: string;
	active?: boolean;
	reminderEnabled?: boolean;
}

export interface HabitResponse {
	id: UUID;
	title: string;
	description: string | null;
	habitType: HabitType;
	frequencyType: FrequencyType;
	categoryId: UUID | null;
	categoryName: string | null;
	active: boolean;
	reminderEnabled: boolean;
	targetValue: number | null;
	unit: string | null;
	selectedDaysCsv: string | null;
	createdAt: string;
	currentStreak: number;
	longestStreak: number;
	successPercentage: number;
}

export interface HabitEntryRequest {
	entryDate: string;
	status: HabitEntryStatus;
	valueAchieved?: number;
	note?: string;
}

export interface HabitEntryResponse {
	id: UUID;
	habitId: UUID;
	entryDate: string;
	status: HabitEntryStatus;
	valueAchieved: number | null;
	note: string | null;
}

export interface ReminderRequest {
	habitId: UUID;
	reminderTime: string;
	enabled: boolean;
	daysCsv: string;
}

export interface ReminderResponse {
	id: UUID;
	habitId: UUID;
	reminderTime: string;
	enabled: boolean;
	daysCsv: string;
}

export interface CategoryRequest {
	name: string;
	description?: string;
}

export interface CategoryResponse {
	id: UUID;
	name: string;
	description: string | null;
	createdAt: string;
}

export interface DashboardResponse {
	totalActiveHabits: number;
	completedToday: number;
	missedToday: number;
	masterStreak: number;
	todayCompletionPercentage: number;
	habitTitlesDueToday: string[];
}

export interface ProfileResponse {
	id: UUID;
	email: string;
	username: string;
	firstName: string;
	lastName: string;
	themeMode: ThemeMode;
	emailNotifications: boolean;
	pushNotifications: boolean;
}

export interface ProfileUpdateRequest {
	firstName?: string;
	lastName?: string;
	themeMode?: ThemeMode;
	emailNotifications?: boolean;
	pushNotifications?: boolean;
}
