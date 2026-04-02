export const ROUTES = {
  HOME: "/",
  APP_HOME: "/dashboard",
  LOGIN: "/login",
  REGISTER: "/register",
  DASHBOARD: "/dashboard",

  HABITS: "/habits",
  CREATE_HABIT: "/habits/new",
  HABIT_DETAILS: "/habits/:id",
  EDIT_HABIT: "/habits/:id/edit",

  CATEGORIES: "/categories",
  PROFILE: "/profile",
  STATS: "/stats",
  NOT_FOUND: "*",
} as const;