/**
 * StatusSelect — a styled status badge that opens a plain dropdown on click.
 * Avoids the native <select> background-color bleeding into the options list.
 */
import { useEffect, useRef, useState } from 'react';
import { colorClassMapTaskStatus } from '../constants/colorMap';

const STATUS_OPTIONS = ['todo', 'inprogress', 'done', 'overdue'] as const;
type Status = (typeof STATUS_OPTIONS)[number];

const STATUS_LABELS: Record<Status, string> = {
  todo: 'Todo',
  inprogress: 'In Progress',
  done: 'Done',
  overdue: 'Overdue',
};

// Contrast text color per status background
const STATUS_TEXT: Record<Status, string> = {
  todo: 'text-white',
  inprogress: 'text-gray-800',
  done: 'text-gray-800',
  overdue: 'text-white',
};

interface StatusSelectProps {
  value: Status;
  disabled?: boolean;
  onChange: (status: Status) => void;
  taskTitle?: string;
}

const StatusSelect: React.FC<StatusSelectProps> = ({
  value,
  disabled = false,
  onChange,
  taskTitle = '',
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = (status: Status) => {
    setOpen(false);
    if (status !== value) onChange(status);
  };

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        disabled={disabled}
        aria-label={`Status: ${value}. Click to change status for ${taskTitle}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => !disabled && setOpen((o) => !o)}
        className={`text-xs font-semibold rounded-full px-3 py-1 cursor-pointer focus:outline-none focus:ring-2 focus:ring-btn-primary transition-opacity ${colorClassMapTaskStatus[value] ?? ''} ${STATUS_TEXT[value] ?? 'text-white'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {STATUS_LABELS[value] ?? value}
      </button>

      {open && (
        <div className="absolute z-50 mt-1 left-0 min-w-max bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg overflow-hidden">
          {STATUS_OPTIONS.map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={s === value}
              onClick={() => handleSelect(s)}
              className={`w-full text-left px-4 py-2 text-xs font-semibold flex items-center gap-2 hover:bg-sidebar-selected transition-colors ${s === value ? 'bg-sidebar-selected' : ''}`}
            >
              <span
                className={`inline-block w-2 h-2 rounded-full ${colorClassMapTaskStatus[s] ?? ''}`}
              />
              {STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default StatusSelect;
