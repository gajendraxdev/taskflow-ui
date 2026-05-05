import { Toaster } from 'react-hot-toast';
import { useSelector } from 'react-redux';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useBootstrap } from './hooks/useBootstrap';
import DashboardLayout from './layouts/DashboardLayout';
import AddTaskForm from './page/AddTaskForm';
import OtpVerification from './page/auth/OtpVerification';
import Login from './page/auth/Signin';
import Signup from './page/auth/Signup';
import Calendar from './page/Calendar';
import Dashboard from './page/Dashboard';
import EditTaskForm from './page/EditTaskForm';
import FilteredTasks from './page/FilteredTasks';
import FinishSettingAccount from './page/FinishSettingAccount';
import ResetPassword from './page/ResetPassword';
import SetNewPassword from './page/SetNewPassword';
import Settings from './page/Settings';
import TaskDetails from './page/TaskDetails';
import Tasks from './page/Tasks';
import type { RootState } from './redux/store';

function App() {
  // Fetch user profile on mount, hydrate Redux, handle expired tokens
  useBootstrap();

  const profileLoaded = useSelector(
    (state: RootState) => state.auth.profileLoaded,
  );

  // Show a minimal full-screen loader until the bootstrap resolves.
  // This prevents a flash of the login page for authenticated users.
  if (!profileLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-primary-bg">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-btn-primary border-t-transparent" />
          <p className="text-sm text-main/60">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-row min-h-screen bg-primary-bg">
      <div>
        <Toaster />
      </div>

      <Routes>
        {/* public routes */}
        <Route path="/signin" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/resetpassword" element={<ResetPassword />} />
        <Route path="/set-new-password" element={<SetNewPassword />} />
        <Route path="/finishsetupaccount" element={<FinishSettingAccount />} />
        <Route
          path="/otpverification"
          element={<OtpVerification maxDigit={6} />}
        />

        {/* protected routes */}
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/tasks/filter/list" element={<FilteredTasks />} />
          <Route path="/task/:id" element={<TaskDetails />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/add-new-task" element={<AddTaskForm />} />
          <Route path="/edit-task/:id" element={<EditTaskForm />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </div>
  );
}

export default App;
