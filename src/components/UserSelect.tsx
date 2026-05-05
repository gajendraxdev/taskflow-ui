/**
 * UserSelect — dropdown for picking a project member.
 * Fetches GET /user/project-members on mount and renders a <select>.
 */
import axios, { AxiosError } from 'axios';
import { useEffect, useState } from 'react';
import { FaRegUser } from 'react-icons/fa';
import { useSelector } from 'react-redux';
import { API_ROUTES } from '../constants/apiRoutes';
import { apiEndpoint } from '../constants/env';
import type { RootState } from '../redux/store';

export interface ProjectMember {
  id: string;
  name: string;
  username: string;
  email: string;
  profileImageId: string | null;
}

interface UserSelectProps {
  value: string;
  onChange: (userId: string) => void;
  className?: string;
}

const UserSelect: React.FC<UserSelectProps> = ({
  value,
  onChange,
  className = '',
}) => {
  const { user } = useSelector((state: RootState) => state.auth);
  const token = user?.authToken;

  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const resp = await axios.get(
          `${apiEndpoint}/${API_ROUTES.user.projectMembers}`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        setMembers(resp.data?.data ?? []);
      } catch (err) {
        if (err instanceof AxiosError) {
          console.error(
            'Failed to load project members:',
            err.response?.data?.error,
          );
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={loading}
        className={`w-full bg-input-bg p-4 rounded-2xl appearance-none focus:outline-none focus:ring-1 focus:ring-btn-primary transition-all ease duration-300 ${className}`}
        aria-label="Assign to team member"
      >
        <option value="">{loading ? 'Loading members…' : 'Unassigned'}</option>
        {members.map((m) => (
          <option key={m.id} value={m.id}>
            {m.name} (@{m.username})
          </option>
        ))}
      </select>
      <FaRegUser className="absolute top-[50%] -translate-y-1/2 right-4.5 text-xl pointer-events-none" />
    </div>
  );
};

export default UserSelect;
