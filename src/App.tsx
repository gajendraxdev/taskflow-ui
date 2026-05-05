import { Toaster } from 'react-hot-toast';
import { Navigate, Route, Routes } from 'react-router-dom';
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

function App() {
  return (
    <div className="flex flex-row min-h-screen bg-primary-bg">
      <div>
        <Toaster />
      </div>

      {/* public routes */}
      <Routes>
        {/* login */}
        <Route path="/signin" element={<Login />} />

        {/* signup */}
        <Route path="/signup" element={<Signup />} />

        {/* reset password */}
        <Route path="/resetpassword" element={<ResetPassword />} />

        {/* set new password — landed from email link */}
        <Route path="/set-new-password" element={<SetNewPassword />} />

        {/* complete setup account */}
        <Route path="/finishsetupaccount" element={<FinishSettingAccount />} />

        {/* otp verification */}
        <Route
          path="/otpverification"
          element={<OtpVerification maxDigit={6} />}
        />

        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/tasks/filter/list" element={<FilteredTasks />} />
          <Route path="/task/:id" element={<TaskDetails />} />
          <Route path="/calendar" element={<Calendar />} /> {/* fix spelling */}
          <Route path="/settings" element={<Settings />} />
          <Route path="/add-new-task" element={<AddTaskForm />} />
          <Route path="/edit-task/:id" element={<EditTaskForm />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
        {/* optionally a catch-all 404 or redirect to /dashboard */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </div>
  );
}

export default App;
