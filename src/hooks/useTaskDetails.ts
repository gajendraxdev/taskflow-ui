import axios, { AxiosError } from 'axios';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_ROUTES } from '../constants/apiRoutes';
import { apiEndpoint } from '../constants/env';
import type { TaskT } from '../types/task';
import { notify } from '../utils/notify';

const useTaskDetails = (taskId: string) => {
  const [task, setTask] = useState<Partial<TaskT> | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [deleting, setDeleting] = useState<boolean>(false);
  const navigate = useNavigate();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await axios(
        `${apiEndpoint}/${API_ROUTES.tasks.detail(taskId)}`,
      );
      setTask(resp.data.data);
    } catch (error) {
      if (error instanceof AxiosError) {
        notify.error(error.response?.data?.error || error.message);
      } else {
        notify.error('An unknown error occurred!');
      }
      navigate('/tasks');
    } finally {
      setLoading(false);
    }
  }, [taskId, navigate]);

  useEffect(() => {
    if (taskId) fetchData();
  }, [fetchData, taskId]);

  const deleteTask = async () => {
    setDeleting(true);
    try {
      await axios.delete(`${apiEndpoint}/${API_ROUTES.tasks.delete(taskId)}`);
      notify.success('Task deleted');
      navigate('/tasks');
    } catch (error) {
      if (error instanceof AxiosError) {
        notify.error(error.response?.data?.error || error.message);
      } else {
        notify.error('Could not delete task');
      }
    } finally {
      setDeleting(false);
    }
  };

  const addDependency = async (depId: string) => {
    try {
      const depsToBeUpdate = [...(task?.dependsOn || []), depId];
      await axios.patch(`${apiEndpoint}/${API_ROUTES.tasks.update(taskId)}`, {
        dependsOn: depsToBeUpdate,
      });
      fetchData();
    } catch {
      notify.error('Could not add dependency');
    }
  };

  const removeDependency = async (depId: string) => {
    try {
      const depsToBeUpdate = task?.dependsOn?.filter((d) => d !== depId);
      await axios.patch(`${apiEndpoint}/${API_ROUTES.tasks.update(taskId)}`, {
        dependsOn: depsToBeUpdate,
      });
      fetchData();
    } catch {
      notify.error('Could not remove dependency');
    }
  };

  return {
    task,
    setTask,
    deleting,
    loading,
    deleteTask,
    addDependency,
    removeDependency,
  };
};

export default useTaskDetails;
