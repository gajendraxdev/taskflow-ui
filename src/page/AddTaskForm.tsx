import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import axios, { AxiosError } from 'axios';
import type React from 'react';
import { type ChangeEvent, type FormEvent, useState } from 'react';
import { CiShoppingTag } from 'react-icons/ci';
import { MdOutlineAddLink } from 'react-icons/md';
import { RiFlagLine } from 'react-icons/ri';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import DebounceTasks from '../components/DebounceTasks';
import DependencyRow from '../components/DependencyRow';
import UserSelect from '../components/UserSelect';
import Button from '../components/ui/Button';
import { API_ROUTES } from '../constants/apiRoutes';
import { PRIORITIES } from '../constants/constants';
import { apiEndpoint } from '../constants/env';
import { useDebouncedCallback } from '../hooks/useDebouncedCallback';
import type { RootState } from '../redux/store';
import type { TaskT } from '../types/task';
import { notify } from '../utils/notify';

const ButtonSubmitLoading = '/animation_file/button-loading.lottie';

const formFullDivStyle = 'flex flex-col gap-2';
const formInputStyle =
  'w-full bg-input-bg p-4 rounded-2xl  focus:outline-none focus:ring-1 focus:ring-btn-primary transition-all ease duration-300';
const formLabelStyle = 'text-lg font-semibold';

const AddTaskForm: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  // Use the user's projectId as workspace; fall back to their id if not set yet
  const workspace = user?.projectId || user?.id || 'default';
  const token = user?.authToken;

  const [taskData, setTaskData] = useState<Partial<TaskT>>({
    priority: 'low',
    status: 'todo',
    workspace,
  });
  const [error, setError] = useState<Record<string, string | undefined>>({});
  const [loading, setLoading] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  const [showDebounceTable, setShowDebounceTable] = useState<boolean>(false);

  const [debounceList, setDebounceList] = useState<TaskT[]>([]);
  const [debounceLoading, setDebounceLoading] = useState<boolean>(false);
  const [selectedDependencies, setSelectedDependencies] = useState<TaskT[]>([]);
  const [depInput, setDepsInput] = useState<string>('');

  const navigate = useNavigate();

  // debounce search for dependencies
  const debouncedSearch = useDebouncedCallback(
    async (query: string, excludeIds: string) => {
      setDebounceList([]);
      if (!query.length) return;
      try {
        const resp = await axios.get(
          `${apiEndpoint}/${API_ROUTES.tasks.list}?search=${query}&exclude=${excludeIds}&workspace=${workspace}`,
          { headers: token ? { Authorization: `Bearer ${token}` } : {} },
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

  // on input change handle
  const handleOnchange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;

    if (name === 'dependsOn' && !!value.trim()) {
      setShowDebounceTable(true);
      setDebounceLoading(true);
      setDepsInput(value);
      debouncedSearch(value, selectedDependencies.map((d) => d._id).join(','));
    } else {
      handleCloseDebounceTable();
      setError((prev) => {
        prev[name as string] = undefined;
        return { ...prev };
      });
      setTaskData((task) => ({ ...task, [name]: value }));
    }
  };

  const handleSelectDependency = (id: string) => {
    const dep = debounceList.find((d) => d._id === id);

    if (dep) {
      setSelectedDependencies((prev) => [...prev, dep]);
      if (taskData.dependsOn && Array.isArray(taskData.dependsOn))
        setTaskData((task) => ({
          ...task,
          dependsOn: [...(taskData.dependsOn ?? []), dep._id],
        }));
      else
        setTaskData((task) => ({
          ...task,
          dependsOn: [dep._id],
        }));
    }
    handleCloseDebounceTable();
  };

  const handleCloseDebounceTable = () => {
    setShowDebounceTable(false);
    setDebounceLoading(false);
    setDebounceList([]);
    setDepsInput('');
  };

  // handle submit
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // setError({});
    setLoading(true);
    const newError: Record<string, string> = {};
    if (!taskData.title) newError.title = 'Title is required!';

    if (!taskData.deadLine) newError.deadLine = 'please specify the deadline!';

    if (Object.keys(newError).length) {
      setError(newError);
      setLoading(false);
      return notify.error('Please fill all the required fields!');
    } else {
      (async () => {
        try {
          const resp = await axios.post(
            `${apiEndpoint}/${API_ROUTES.tasks.create}`,
            taskData,
            { headers: token ? { Authorization: `Bearer ${token}` } : {} },
          );
          if (String(resp.status).startsWith('2'))
            notify.success('Task created!');
          else
            notify.error(
              'Something unexpected happened, please contact admin!',
            );
        } catch (error) {
          if (error instanceof AxiosError)
            notify.error(error.response?.data?.error || error.message);
          else notify.error('Unknown error occurred, please contact admin!');
        } finally {
          setFadeOut(true);
          setTimeout(() => {
            handleClearState();
            navigate('/tasks');
          }, 500);
        }
      })();
    }
  };

  const handleUnlinkDependency = (id: string) => {
    setSelectedDependencies((prev) => prev.filter((t) => t._id !== id));
  };

  const handleClearState = () => {
    setTaskData({});
    setError({});
    setLoading(false);
    setFadeOut(true);
    setShowDebounceTable(false);
    setDebounceList([]);
    setDebounceLoading(false);
    setSelectedDependencies([]);
    setDepsInput('');
  };

  return (
    <section className="w-full flex justify-center items-center">
      <div
        className={`w-3/4 p-4 transition-opacity duration-500 ${
          fadeOut ? 'opacity-0' : 'opacity-100'
        }`}
      >
        <h2 className=" text-3xl font-bold text-main py-5">Create New Task </h2>

        <form
          onSubmit={handleSubmit}
          action="#"
          className="flex flex-col gap-6 mt-4"
          noValidate
        >
          {/* title */}
          <div className=" w-full flex flex-col gap-2">
            <label className="text-lg font-semibold" htmlFor="t-title">
              Title <span className="text-priority-high">*</span>
            </label>
            <div className="relative w-full">
              <input
                onChange={handleOnchange}
                name="title"
                className={`w-full bg-input-bg p-4 rounded-2xl focus:outline-none focus:ring-1 focus:ring-btn-primary ${
                  error.title
                    ? 'ring-1 ring-priority-high focus:ring-1 focus:ring-priority-high'
                    : ''
                }`}
                id="t-title"
                type="text"
                placeholder="Enter task title"
                value={taskData.title || ''}
                required
              />
              {error.title && (
                <div className="absolute -top-9.5 right-2 z-10 bg-priority-high text-white px-3 py-1 rounded shadow-md text-xs font-semibold fade-in">
                  {error.title}
                  {/* Arrow bana sakta hai pseudo-element ya svg se */}
                  {/* <div className="absolute left-3 top-full w-2 h-2 bg-priority-high rotate-45"></div> */}
                </div>
              )}
            </div>
          </div>

          {/* description */}
          <div className={formFullDivStyle}>
            <label className={formLabelStyle} htmlFor="t-description">
              Description
            </label>
            <textarea
              onChange={handleOnchange}
              name="description"
              className={`${formInputStyle} h-45`}
              value={taskData.description || ''}
              placeholder="Description"
              id="t-description"
            />
          </div>

          <div className="w-full flex flex-wrap gap-6 justify-between">
            <div className="w-[47%] flex flex-col gap-2">
              <label className={formLabelStyle} htmlFor="t-due-date">
                Due Date <span className="text-priority-high">*</span>
              </label>
              <div className="relative w-full">
                <input
                  onChange={handleOnchange}
                  name="deadLine"
                  value={taskData.deadLine || ''}
                  className={`${formInputStyle} w-full ${
                    error.deadLine
                      ? 'ring-1 ring-priority-high focus:ring-1 focus:ring-priority-high'
                      : ''
                  }`}
                  type="date"
                  id="t-due-date"
                  required
                />
                {error.deadLine && (
                  <div className="absolute -top-9.5 right-2 z-10 bg-priority-high text-white px-2 py-1 rounded shadow-md text-xs font-semibold fade-in">
                    {error.deadLine}
                    {/* Arrow bana sakta hai pseudo-element ya svg se */}
                    {/* <div className="absolute left-3 top-full w-2 h-2 bg-priority-high rotate-45"></div> */}
                  </div>
                )}
              </div>
              {/* <LuCalendarRange /> */}
            </div>

            <div className="relative w-[47%] flex flex-col gap-2">
              <label className={formLabelStyle} htmlFor="t-due-date">
                Priority
              </label>
              <div className="relative">
                <select
                  onChange={handleOnchange}
                  name="priority"
                  value={taskData.priority || ''}
                  className={`${formInputStyle} appearance-none`}
                  id="t-priority"
                  required
                >
                  {PRIORITIES.map((priority) => (
                    <option key={priority} value={priority}>
                      {priority}
                    </option>
                  ))}
                </select>
                <RiFlagLine className="absolute top-[50%] -translate-y-1/2 right-4.5 text-xl" />
              </div>
            </div>

            <div className="w-[47%] flex flex-col gap-2 relative">
              <label className={formLabelStyle} htmlFor="t-tag">
                Tag
              </label>
              <div className="relative">
                <input
                  onChange={handleOnchange}
                  name="tag"
                  value={taskData.tag || ''}
                  className={formInputStyle}
                  type="text"
                  id="t-tag"
                  placeholder="Add tag"
                />
                <CiShoppingTag className="absolute top-[50%] -translate-y-1/2 right-4.5 text-xl" />
              </div>
            </div>

            <div className="relative w-[47%] flex flex-col gap-2">
              <label className={formLabelStyle} htmlFor="t-assign">
                Assign To
              </label>
              <UserSelect
                value={taskData.assignedTo || ''}
                onChange={(userId) =>
                  setTaskData((prev) => ({ ...prev, assignedTo: userId }))
                }
              />
            </div>
          </div>

          <div className={`${formFullDivStyle} relative`}>
            {showDebounceTable && (
              <DebounceTasks
                handleClose={handleCloseDebounceTable}
                handleClick={handleSelectDependency}
                loading={debounceLoading}
                tasks={debounceList}
              />
            )}

            <label className={formLabelStyle} htmlFor="t-depends">
              Depends On
            </label>
            {!!selectedDependencies.length &&
              selectedDependencies.map((task) => (
                <DependencyRow
                  key={task._id}
                  depsData={task}
                  handleUnlinkDependency={handleUnlinkDependency}
                />
              ))}

            <div className="relative">
              <input
                onChange={handleOnchange}
                value={depInput || ''}
                name="dependsOn"
                className={formInputStyle}
                type="text"
                id="t-depends"
                placeholder="Add Dependency"
              />
              <MdOutlineAddLink className="absolute top-[50%] -translate-1/2 right-2 text-xl" />
            </div>
          </div>

          <div className="flex justify-star gap-5">
            {!loading && (
              <Button style="w-30" type="submit" onClick={() => {}}>
                {/* <Link to="/tasks">Create Task</Link>
                 */}
                Create Task
              </Button>
            )}
            {loading && (
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
              disabled={fadeOut || loading}
              onClick={() => {
                handleClearState();
                setTimeout(() => {
                  navigate('/tasks');
                }, 500);
              }}
              style="bg-btn-secondary text-btn-primary "
            >
              <span className="text-btn-primary">Cancel</span>
            </Button>
          </div>
        </form>
      </div>
    </section>
  );
};

export default AddTaskForm;
