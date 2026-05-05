import { type ReactNode, useContext, useEffect, useRef, useState } from 'react';
import { FiHelpCircle, FiLogOut } from 'react-icons/fi';
import { GoBell } from 'react-icons/go';
import { IoSettingsOutline } from 'react-icons/io5';
import { TbLayoutSidebarLeftCollapse } from 'react-icons/tb';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { twMerge } from 'tailwind-merge';
import HeaderIcon from '/menu.png';
import SearchIcon from '/search.svg';
import Button from '../components/ui/Button';
import { sidebarContext } from '../context/SidebarContext';
import type { RootState } from '../redux/store';
import { handleLogout } from '../utils/authHelpers';

export const ButtonIcon = ({
  children: icon,
  type = 'button',
  className,
  onClick = () => {},
}: {
  children: ReactNode;
  type?: 'button' | 'submit' | 'reset' | undefined;
  className?: string;
  onClick?: () => void;
}) => {
  let buttonStyle = 'hover:bg-sidebar-selected p-1 rounded-md cursor-pointer';
  if (className) {
    buttonStyle = twMerge(buttonStyle, className);
  }
  return (
    <button type={type} className={buttonStyle} onClick={onClick}>
      {icon}
    </button>
  );
};

const Navbar = () => {
  const { toggleSidebar } = useContext(sidebarContext);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const navigate = useNavigate();

  const onLogout = () => {
    handleLogout(dispatch);
    navigate('/signin');
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <nav className="w-full h-12 bg-secondary-bg border-b-2 border-b-sidebar-selected p-2">
      <div className="h-full w-full flex items-center justify-between">
        <ul className="flex items-center gap-2 list-none">
          <li>
            <ButtonIcon
              type="button"
              className="hover:bg-sidebar-selected p-1 rounded-md"
              onClick={() => toggleSidebar()}
            >
              <TbLayoutSidebarLeftCollapse className="text-lg" />
            </ButtonIcon>
          </li>
          <li>
            <button
              type="button"
              className="flex gap-1 items-center hover:bg-sidebar-selected p-0.5 rounded-md cursor-pointer"
              onClick={() => navigate('/dashboard')}
            >
              <img src={HeaderIcon} alt="Header-icon" className="h-5 w-auto" />
              <span className="font-bold">Taskflow</span>
            </button>
          </li>
        </ul>

        <div className="flex items-center gap-4 w-2/4">
          <form action="#" className="relative w-full">
            <input
              className="w-full active:outline-0 focus:outline-0 border border-sidebar-selected rounded-md py-1.5 pl-3 pr-8 bg-primary-bg text-sm"
              type="text"
              placeholder="Search"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2"
            >
              <img src={SearchIcon} alt="search" className="h-4 opacity-60" />
            </button>
          </form>
          <Button type="button" onClick={() => {}}>
            <Link to="/add-new-task">Create</Link>
          </Button>
        </div>

        <ul className="flex items-center gap-2 list-none">
          <li>
            <ButtonIcon>
              <GoBell className="text-lg" />
            </ButtonIcon>
          </li>
          <li>
            <ButtonIcon onClick={() => navigate('/settings')}>
              <IoSettingsOutline className="text-lg" />
            </ButtonIcon>
          </li>
          <li>
            <ButtonIcon>
              <FiHelpCircle className="text-lg" />
            </ButtonIcon>
          </li>

          {/* Avatar + logout dropdown */}
          <li className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setShowMenu((prev) => !prev)}
              className="cursor-pointer h-8 w-8 rounded-full overflow-hidden hover:ring-2 hover:ring-btn-primary transition-all"
              aria-label="User menu"
            >
              <img
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'U')}&background=random`}
                alt="avatar"
                className="h-full w-full object-cover"
              />
            </button>

            {showMenu && (
              <div className="absolute right-0 top-10 z-50 w-48 bg-secondary-bg border border-sidebar-selected rounded-md shadow-lg py-1">
                <div className="px-4 py-2 border-b border-sidebar-selected">
                  <p className="text-sm font-semibold text-main truncate">
                    {user?.name || 'User'}
                  </p>
                  <p className="text-xs text-main/60 truncate">{user?.email}</p>
                </div>
                <button
                  type="button"
                  onClick={onLogout}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-status-overdue hover:bg-sidebar-selected transition-colors cursor-pointer"
                >
                  <FiLogOut className="text-base" />
                  Logout
                </button>
              </div>
            )}
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
