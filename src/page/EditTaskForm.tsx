import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import axios, { AxiosError } from 'axios';
import type React from 'react';
import { type ChangeEvent, type FormEvent, useEffect, useState } from 'react';
import { CiShoppingTag } from 'react-icons/ci';
import { FaRegUser } from 'react-icons/fa';
import { MdOutlineAddLink } from 'react-icons/md';
import { RiFlagLine } from 'react-icons/ri';
import { useNavigate, useParams } from 'react-router-dom';
import Attachments from '../components/Attachments';
import DebounceTasks from '../components/DebounceTasks';
import DependencyRow from '../components/DependencyRow';
import Button from '../components/ui/Button';
import HightedText from '../components/ui/HightedText';
import { API_ROUTES } from '../constants/apiRoutes';
import { PRIORITIES } from '../constants/constants';
import { apiEndpoint } from '../constants/env';
import { useDebouncedCallback } from '../hooks/useDebouncedCallback';
import useTaskDetails from '../hooks/useTaskDetails';
import type { DocumentT, TaskT } from '../types/task';
import { getFormattedDate } from '../utils/getFormatedDate';
import { notify } from '../utils/notify';

const ButtonSubmitLoading = '/animation_file/button-loading.lottie';
const LoadingHand = '/animation_file/loading_hand.lottie';

const formFullDivStyle = 'flex flex-col gap-2';
const formInputStyle =
  'w-full bg-input-bg p-4 rounded-2xl text-gray-600  focus:outline-none focus:ring-1 focus:ring-btn-primary';
const formLabelStyle = 'text-lg font-semibold';

const EditTaskForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const { task: currentTask, loading: loadingData } = useTaskDetails(
    id as string,
  );

  const [updatedTask, setUpdatedTask] = useState<Partial<TaskT>>({});
  const [fadeOut, setFadeOut] = useState(false);
  const [loadingSubmit, setLoadingSUbmit] = useState(false);
  const [error, setError] = useState<string>('');

  const [showDebounceTable, setShowDebounceTable] = useState<boolean>(false);

  const [debounceList, setDebounceList] = useState<TaskT[]>([]);
  const [debounceLoading, setDebounceLoading] = useState<boolean>(false);
  const [selectedDependencies, setSelectedDependencies] = useState<TaskT[]>([]);

  // Update selectedDependencies when currentTask changes
  useEffect(() => {
    if (
      currentTask?.dependenciesList &&
      Array.isArray(currentTask.dependenciesList)
    ) {
      setSelectedDependencies(currentTask.dependenciesList as TaskT[]);
    }
  }, [currentTask]);

  const [depInput, setDepsInput] = useState<string>('');

  const navigate = useNavigate();

  const debouncedSearch = useDebouncedCallback(
    async (query: string, excludeIds: string) => {
      setDebounceList([]);
      if (!query.length) return;
      try {
        const resp = await axios.get(
          `${apiEndpoint}/${API_ROUTES.tasks.list}?search=${query}&exclude=${excludeIds}`,
        );
        setDebounceLoading(false);
        setDebounceList(resp.data.data);
      } catch (error) {
        setDebounceLoading(false);
        if (error instanceof AxiosError) {
          notify.error(error.response?.data?.error || error.message);
        } else {
          notify.error('An unknown error occurred, please contact admin!');
        }
      }
    },
    500,
  );

  // on change handles
  const handleOnchange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    setError('');
    const { name, value } = e.target;

    if (name === 'dependsOn' && !!value.trim()) {
      setShowDebounceTable(true);
      setDebounceLoading(true);
      setDepsInput(value);
      debouncedSearch(value, selectedDependencies.map((d) => d._id).join(','));
    } else {
      handleCloseDebounceTable();
      setError('');
      setUpdatedTask((task) => ({ ...task, [name]: value }));
    }
  };

  // on submit handle
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoadingSUbmit(true);

    if (!Object.keys(updatedTask).length) {
      setError('No fields are updated!');
      setLoadingSUbmit(false);
      return;
    }

    (async () => {
      try {
        const resp = await axios.patch(
          `${apiEndpoint}/${API_ROUTES.tasks.update(id as string)}`,
          updatedTask,
        );
        if (String(resp.status).startsWith('2'))
          notify.success('Task updated!');
        else
          notify.error('Something unexpected happened, please contact admin!');
      } catch (error) {
        if (error instanceof AxiosError)
          notify.error(
            error.response?.data?.message || 'Error while updating task',
          );
        else notify.error('Unexpected error occurred');
      } finally {
        setFadeOut(true);
        setTimeout(() => {
          handleClearState();
          navigate('/tasks');
        }, 500);
      }
    })();
  };

  const handleSelectDependency = (id: string) => {
    const dep = debounceList.find((d) => d._id === id);

    if (dep) {
      setSelectedDependencies((prev) => [...prev, dep]);
      if (updatedTask.dependsOn && Array.isArray(updatedTask.dependsOn))
        setUpdatedTask((task) => ({
          ...task,
          dependsOn: [...(updatedTask.dependsOn ?? []), dep._id],
        }));
      else
        setUpdatedTask((task) => ({
          ...task,
          dependsOn: [dep._id],
        }));
    }
    handleCloseDebounceTable();
  };

  const handleUnlinkDependency = (id: string) => {
    setSelectedDependencies((prev) => prev.filter((t) => t._id !== id));
  };

  const handleCloseDebounceTable = () => {
    setShowDebounceTable(false);
    setDebounceLoading(false);
    setDebounceList([]);
    setDepsInput('');
  };

  const handleClearState = () => {
    setUpdatedTask({});
    setError('');
    setFadeOut(true);
    setShowDebounceTable(false);
    setDebounceList([]);
    setDebounceLoading(false);
    setSelectedDependencies([]);
    setDepsInput('');
  };

  return (
    <section className="w-full flex flex-col justify-center items-center">
      <div
        className={`w-3/4 p-4 transition-opacity duration-500 ${
          fadeOut ? 'opacity-0' : 'opacity-100'
        }`}
      >
        {error && (
          <div className="p-1 rounded-lg text-center text-xs text-primary-bg bg-priority-high w-full mb-2">
            {error}
          </div>
        )}
        <div className="flex items-center justify-between">
          <h2 className=" text-3xl font-bold text-main py-5">Edit Task</h2>
          <HightedText
            text={currentTask?.ticket as string}
            className="bg-status-todo-secondary text-status-todo border-1 px-2 py-0.5"
          />
        </div>
        {loadingData && (
          <div className="w-full h-96 bg-gray-200 mt-30 rounded-4xl  flex justify-center items-center animate-pulse">
            <DotLottieReact className="z-10" autoplay loop src={LoadingHand} />
          </div>
        )}
        {!loadingData && (
          <form
            action="#"
            className="flex flex-col gap-6 mt-4"
            onSubmit={handleSubmit}
          >
            {/* title */}
            <div className=" w-full flex flex-col gap-2">
              <label className="text-lg font-semibold" htmlFor="t-title">
                Title
              </label>
              <input
                className="bg-input-bg p-4 text-gray-600 rounded-2xl focus:outline-none focus:ring-1 focus:ring-btn-primary"
                id="t-title"
                type="text"
                placeholder="Enter task title"
                required
                onChange={handleOnchange}
                name="title"
                defaultValue={updatedTask.title || currentTask?.title || ''}
              />
            </div>

            {/* description */}
            <div className={formFullDivStyle}>
              <label className={formLabelStyle} htmlFor="t-description">
                Description
              </label>
              <textarea
                className={`${formInputStyle} h-45`}
                onChange={handleOnchange}
                name="description"
                id="t-description"
                placeholder="Description"
                defaultValue={
                  updatedTask.description || currentTask?.description || ''
                }
              />
            </div>

            <div className="w-full flex flex-wrap gap-6 justify-between">
              <div className="w-[47%] flex flex-col gap-2">
                <label className={formLabelStyle} htmlFor="t-due-date">
                  Due Date
                </label>
                <input
                  className={formInputStyle}
                  type="date"
                  onChange={handleOnchange}
                  name="deadLine"
                  id="t-due-date"
                  required
                  value={getFormattedDate(
                    updatedTask.deadLine || currentTask?.deadLine || '',
                  )}
                />

                {/* <LuCalendarRange /> */}
              </div>

              <div className="relative w-[47%] flex flex-col gap-2">
                <label className={formLabelStyle} htmlFor="t-due-date">
                  Priority
                </label>
                <select
                  className={`${formInputStyle} appearance-none`}
                  name="priority"
                  id="t-priority"
                  required
                  onChange={handleOnchange}
                  defaultValue={
                    updatedTask?.priority || currentTask?.priority || ''
                  }
                >
                  {PRIORITIES.map((priority) => (
                    <option key={priority} value={priority}>
                      {priority}
                    </option>
                  ))}
                </select>
                <RiFlagLine className="absolute top-[60%] right-4.5 text-xl" />
              </div>

              <div className="w-[47%] flex flex-col gap-2 relative">
                <label className={formLabelStyle} htmlFor="t-tag">
                  Tag
                </label>
                <input
                  className={formInputStyle}
                  onChange={handleOnchange}
                  name="tag"
                  type="text"
                  id="t-tag"
                  placeholder="Add tag"
                  defaultValue={updatedTask.tag || currentTask?.tag || ''}
                />
                <CiShoppingTag className="absolute top-[60%] right-4.5 text-xl" />
              </div>

              <div className="relative w-[47%] flex flex-col gap-2">
                <label className={formLabelStyle} htmlFor="t-assign">
                  Assign To
                </label>
                <input
                  onChange={handleOnchange}
                  name="assignedTo"
                  className={formInputStyle}
                  type="text"
                  placeholder="Add team member"
                  defaultValue={
                    updatedTask.assignedTo || currentTask?.assignedTo || ''
                  }
                />
                <FaRegUser className="absolute top-[60%] right-4.5 text-xl" />
              </div>
            </div>

            {/* attachments */}

            {currentTask && (
              <div>
                <Attachments
                  attachedDocuments={
                    currentTask?.attachedDocuments as DocumentT[]
                  }
                  taskId={id as string}
                />
              </div>
            )}

            {/* dependencies */}
            <div className={`${formFullDivStyle} relative`}>
              <label className={formLabelStyle} htmlFor="t-depends">
                Depends On
              </label>

              {showDebounceTable && (
                <DebounceTasks
                  tasks={debounceList}
                  handleClick={handleSelectDependency}
                  loading={debounceLoading}
                  handleClose={handleCloseDebounceTable}
                />
              )}

              {!!selectedDependencies.length &&
                selectedDependencies.map((task) => (
                  <DependencyRow
                    depsData={task}
                    handleUnlinkDependency={handleUnlinkDependency}
                    key={task._id}
                  />
                ))}
              <div className="relative">
                <input
                  onChange={handleOnchange}
                  className={formInputStyle}
                  type="text"
                  id="t-depends"
                  placeholder="Add Dependency"
                  value={depInput || ''}
                  name="dependsOn"
                />
                <MdOutlineAddLink className="absolute top-[50%] -translate-y-1/2 right-4.5 text-xl" />
              </div>
            </div>

            <div className="flex justify-star gap-5">
              {!loadingSubmit && (
                <Button type="submit" onClick={() => {}}>
                  Update Task
                </Button>
              )}
              {loadingSubmit && (
                <div className="h-10 w-30 bg-btn-secondary rounded-lg flex items-center justify-center">
                  <DotLottieReact
                    className="w-20"
                    src={ButtonSubmitLoading}
                    loop
                    autoplay
                  />
                </div>
              )}

              <Button
                type="button"
                disabled={fadeOut}
                onClick={() => {
                  handleClearState();
                  setTimeout(() => {
                    navigate('/tasks');
                  }, 500);
                }}
                style="bg-btn-secondary text-btn-primary"
              >
                <span className="text-btn-primary">Cancel</span>
              </Button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
};

export default EditTaskForm;
