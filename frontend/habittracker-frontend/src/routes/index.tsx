import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ROUTES } from "../constants/routes";
import LoginPage from "../pages/LoginPage";
import RegisterPage from "../pages/RegisterPage";
import DashboardPage from "../pages/DashboardPage";
import HabitsPage from "../pages/HabitsPage";
import HabitDetailsPage from "../pages/HabitDetailsPage";
import CreateHabitPage from "../pages/CreateHabitPage";
import EditHabitPage from "../pages/EditHabitPage";
import StatsPage from "../pages/StatsPage";
import ProfilePage from "../pages/ProfilePage";
import CategoriesPage from "../pages/CategoriesPage";
import NotFoundPage from "../pages/NotFoundPage";
import ProtectedRoute from "../components/auth/ProtectedRoute";
import PublicOnlyRoute from "../components/auth/PublicOnlyRoute";
import AppLayout from "../components/layout/AppLayout";
import { useAuth } from "../hooks/useAuth";

export default function AppRouter() {
  const { isAuthenticated } = useAuth();

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path={ROUTES.HOME}
          element={
            <Navigate
              to={isAuthenticated ? ROUTES.APP_HOME : ROUTES.LOGIN}
              replace
            />
          }
        />

        <Route
          path={ROUTES.LOGIN}
          element={
            <PublicOnlyRoute>
              <LoginPage />
            </PublicOnlyRoute>
          }
        />
        <Route
          path={ROUTES.REGISTER}
          element={
            <PublicOnlyRoute>
              <RegisterPage />
            </PublicOnlyRoute>
          }
        />

        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path={ROUTES.DASHBOARD} element={<DashboardPage />} />
          <Route path={ROUTES.HABITS} element={<HabitsPage />} />
          <Route path={ROUTES.CREATE_HABIT} element={<CreateHabitPage />} />
          <Route path={ROUTES.HABIT_DETAILS} element={<HabitDetailsPage />} />
          <Route path={ROUTES.EDIT_HABIT} element={<EditHabitPage />} />
          <Route path={ROUTES.CATEGORIES} element={<CategoriesPage />} />
          <Route path={ROUTES.PROFILE} element={<ProfilePage />} />
          <Route path={ROUTES.STATS} element={<StatsPage />} />
        </Route>

        <Route path={ROUTES.NOT_FOUND} element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}