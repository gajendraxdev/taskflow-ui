import axios, { AxiosError } from 'axios';
import React, { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { MdDeleteOutline, MdOutlineModeEdit } from 'react-icons/md';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { colorClassMapTaskPriority } from '../constants/colorMap';
import { apiEndpoint } from '../constants/env';
import type { RootState } from '../redux/store';
import type { TaskT } from '../types/task';
import { prettyDate } from '../utils/getFormatedDate';
import TaskDeleteConfirmation from './DeleteConfirmation';
import StatusSelect from './StatusSelect';
import HightedText from './ui/HightedText';

export type TaskTableProps = {
  queryString?: string | null;
};

const TaskTable: React.FC<TaskTableProps> = ({ queryString = null }) => {
  const { user } = useSelector((state: RootState) => state.auth);
  const token = user?.authToken;
  const workspace = user?.projectId || user?.id || '';

  const [data, setData] = useState<TaskT[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [deleteConfirmation, setDeleteConfirmation] = useState<boolean>(false);
  const [taskDeleteId, setTaskDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<boolean>(false);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);

  // Build query string with workspace scoping
  const buildQuery = useCallback(() => {
    const params = new URLSearchParams();
    if (workspace) params.set('workspace', workspace);
    if (queryString) {
      for (const [k, v] of new URLSearchParams(queryString)) {
        if (k === 'status' && v === 'all') continue; // skip "all" — backend returns everything
        params.set(k, v);
      }
    }
    return params.toString();
  }, [queryString, workspace]);

  // Fetch tasks
  const fetchData = useCallback(async () => {
    try {
      const resp = await axios.get(`${apiEndpoint}/task?${buildQuery()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (String(resp.status).startsWith('2')) setData(resp.data.data);
      else toast.error(resp.data.error);
    } catch (error) {
      if (error instanceof AxiosError) {
        toast.error(error.response?.data?.error || error.message);
      } else {
        toast.error('An unknown error occurred, please contact admin!');
      }
    } finally {
      setLoading(false);
    }
  }, [buildQuery, token]);

  useEffect(() => {
    setData([]);
    setLoading(true);
    fetchData();
  }, [fetchData]);

  // Inline status change
  const handleStatusChange = async (taskId: string, newStatus: string) => {
    setUpdatingStatusId(taskId);
    try {
      await axios.patch(
        `${apiEndpoint}/task/${taskId}`,
        { status: newStatus },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} },
      );
      setData((prev) =>
        prev.map((t) =>
          t._id === taskId ? { ...t, status: newStatus as TaskT['status'] } : t,
        ),
      );
      toast.success('Status updated');
    } catch (error) {
      if (error instanceof AxiosError) {
        toast.error(error.response?.data?.error || error.message);
      } else {
        toast.error('Failed to update status');
      }
    } finally {
      setUpdatingStatusId(null);
    }
  };

  // Delete confirm
  const handleDeleteConfirm = () => {
    setDeleting(true);
    (async () => {
      try {
        const resp = await axios.delete(`${apiEndpoint}/task/${taskDeleteId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (String(resp.status).startsWith('2')) {
          setData((prev) => prev.filter((t) => t._id !== taskDeleteId));
          toast.success('Task deleted');
        } else {
          toast.error(resp.data.error);
        }
      } catch (error) {
        if (error instanceof AxiosError) {
          toast.error(error.response?.data?.error || error.message);
        } else {
          toast.error('An unknown error occurred, please contact admin!');
        }
      } finally {
        setTimeout(() => {
          setTaskDeleteId(null);
          setDeleteConfirmation(false);
          setDeleting(false);
        }, 500);
      }
    })();
  };

  const handleDeleteCancel = () => {
    toast.success('Task delete cancelled ❌');
    setTaskDeleteId(null);
    setDeleteConfirmation(false);
  };

  return (
    <article className="text-main flex flex-col justify-center items-center">
      {loading && (
        <div aria-live="polite" className="w-full mt-10 p-10">
          <table className="w-full text-sm table-fixed rtl:text-right border-collapse overflow-x-auto animate-pulse">
            <tbody>
              {Array.from({ length: 5 }).map((_, idx) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: skeleton rows
                <tr key={idx}>
                  {[...Array(6)].map((_, cellIdx) => (
                    <td
                      // biome-ignore lint/suspicious/noArrayIndexKey: skeleton cells
                      key={cellIdx}
                      className="h-8 bg-gray-200 rounded animate-pulse my-2"
                    />
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {deleteConfirmation && (
        <TaskDeleteConfirmation
          deleting={deleting}
          onConfirm={handleDeleteConfirm}
          onCancel={handleDeleteCancel}
          id={taskDeleteId as string}
          title="Delete Task"
        />
      )}

      {data.length !== 0 && (
        <table
          aria-live="polite"
          aria-label="Task List Table"
          className="w-full text-sm table-fixed rtl:text-right border-collapse overflow-x-auto"
        >
          <thead>
            <tr className="text-left text-xs uppercase text-gray-400 border-b-2 border-sidebar-selected">
              <th className="py-3 font-semibold">Title</th>
              <th className="px-4 py-3 font-semibold">Priority</th>
              <th className="px-4 py-3 font-semibold">Due Date</th>
              <th className="px-4 py-3 font-semibold">Tag</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="px-4 py-4">
            {data.map((task) => (
              <tr
                key={task._id}
                tabIndex={0}
                className="hover:bg-sidebar-selected border-b-2 border-sidebar-selected"
              >
                <td className="font-semibold text-left py-4">
                  <Link to={`/task/${task._id}`}>{task.title}</Link>
                </td>
                <td className="text-left px-4 py-4">
                  <HightedText
                    text={task.priority}
                    style={colorClassMapTaskPriority[task.priority]}
                  />
                </td>
                <td className="text-left px-4 py-4">
                  {prettyDate(task.deadLine)}
                </td>
                <td className="text-left px-4 py-4">{task.tag || '-'}</td>
                <td className="text-left px-4 py-4">
                  <StatusSelect
                    value={
                      task.status as 'todo' | 'inprogress' | 'done' | 'overdue'
                    }
                    disabled={updatingStatusId === task._id}
                    onChange={(newStatus) =>
                      handleStatusChange(task._id, newStatus)
                    }
                    taskTitle={task.title}
                  />
                </td>
                <td className="w-16 flex gap-4 justify-end px-4 py-4">
                  <div className="flex justify-end items-center gap-2">
                    <button
                      aria-label="Edit Task"
                      type="button"
                      className="text-main text-xl p-1 rounded hover:bg-sidebar-selected focus:outline-none focus:ring-2 focus:ring-btn-primary transition"
                    >
                      <Link to={`/edit-task/${task._id}`}>
                        <MdOutlineModeEdit />
                      </Link>
                    </button>
                    <button
                      onClick={() => {
                        setDeleteConfirmation(true);
                        setTaskDeleteId(task._id);
                      }}
                      aria-label="Delete Task"
                      type="button"
                      className="text-status-overdue text-xl p-1 rounded hover:bg-status-overdue hover:text-primary-bg focus:outline-none focus:ring-2 focus:ring-status-overdue transition"
                    >
                      <MdDeleteOutline />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {data.length === 0 && !loading && (
        <h3
          aria-live="polite"
          className="text-main text-center text-lg font-medium p-10 mt-20"
        >
          No tasks found.{' '}
          <span className="font-bold underline">Try changing the filter.</span>
        </h3>
      )}
    </article>
  );
};

export default React.memo(TaskTable);
