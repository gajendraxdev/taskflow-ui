import axios, { AxiosError } from 'axios';
import React, { type ChangeEvent, useMemo, useState } from 'react';
import { FaPlus } from 'react-icons/fa';
import { LuClipboardList } from 'react-icons/lu';
import { MdOutlineAddLink } from 'react-icons/md';
import { useNavigate, useParams } from 'react-router-dom';
import Attachments from '../components/Attachments';
import DebounceTasks from '../components/DebounceTasks';
import TaskDeleteConfirmation from '../components/DeleteConfirmation';
import DependencyRow from '../components/DependencyRow';
import HeadingCard from '../components/HeadingCard';
import TaskMetaSection from '../components/TaskMetaSection';
import Button from '../components/ui/Button';
import ButtonLink from '../components/ui/ButtonLink';
import H2 from '../components/ui/H2';
import { API_ROUTES } from '../constants/apiRoutes';
import { apiEndpoint } from '../constants/env';
import { useDebouncedCallback } from '../hooks/useDebouncedCallback';
import useTaskDetails from '../hooks/useTaskDetails';
import type { DocumentT, TaskT } from '../types/task';
import { prettyDate } from '../utils/getFormatedDate';
import { notify } from '../utils/notify';

const formFullDivStyle = 'flex flex-col gap-2';
const formInputStyle =
  'w-full bg-input-bg p-4 rounded-2xl  focus:outline-none focus:ring-1 focus:ring-btn-primary transition-all ease duration-300';

const TaskDetails: React.FC = () => {
  const { id } = useParams();
  const {
    task,
    removeDependency,
    loading,
    deleteTask,
    deleting,
    addDependency,
  } = useTaskDetails(id as string);
  const dependencies = useMemo<Partial<TaskT>[]>(
    () =>
      task && Array.isArray(task.dependenciesList) ? task.dependenciesList : [],
    [task],
  );
  // const [loading, setLoading] = useState<boolean>(true);
  const [deleteConfirmation, setDeleteConfirmation] = useState<boolean>(false);
  const [taskDeleteId, setTaskDeleteId] = useState<string>('');
  const [showDepsInput, setDepsInput] = useState<boolean>(false);
  const [debounceLoading, setDebounceLoading] = useState<boolean>(false);
  const [debounceDataContainerShow, setDebounceDataContainerShow] =
    useState<boolean>(false);
  const [debouncedTasks, setDebouncedTasks] = useState<TaskT[]>([]);
  const navigate = useNavigate();

  const taskDetails = useMemo<Partial<TaskT> | null>(
    () => (task && Object.keys(task).length > 0 ? task : null),
    [task],
  );

  const debouncedSearch = useDebouncedCallback(
    async (query: string, excludeIds: string) => {
      setDebouncedTasks([]);
      if (!query.length) return;

      try {
        const resp = await axios.get(
          `${apiEndpoint}/${API_ROUTES.tasks.list}?search=${query}&exclude=${excludeIds}`,
        );
        setDebounceLoading(false);
        setDebouncedTasks(resp.data.data);
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

  // handle debounce search

  const handleDebounceSearch = (e: ChangeEvent<HTMLInputElement>) => {
    const excludeIdsArr = [
      // mapping existing deps with it's id
      ...(taskDetails?.dependenciesList?.map((dep) => dep._id) ?? []),
      // adding current task
      taskDetails?._id,
    ].filter(Boolean);
    const excludeIds = excludeIdsArr.join(',');

    if (e.target.value.length) {
      setDebounceDataContainerShow(true);
      setDebounceLoading(true);
      debouncedSearch(e.target.value, excludeIds);
    } else {
      setDebounceDataContainerShow(false);
      setDebounceLoading(false);
    }
  };

  const handleSelectDependency = async (id: string) => {
    addDependency(id);

    setDepsInput(false);
    setDebounceLoading(false);
    setDebounceDataContainerShow(false);
    setDebouncedTasks([]);
  };

  const handleUnlinkDependency = async (id: string) => {
    removeDependency(id);
  };

  return (
    <section className="w-full flex flex-col justify-center items-center">
      <div className="w-3/4 p-4 flex flex-col ">
        {/* heading */}
        <div className="flex justify-between align-middle items-center">
          <h2 className=" text-3xl font-bold text-main py-5">Overview</h2>
          <Button
            type="button"
            onClick={() => {
              navigate('/tasks');
            }}
            style="bg-btn-secondary"
          >
            <span className="text-btn-primary">Go Back</span>
          </Button>
        </div>

        {/* loading */}
        {loading && <span>Loading...</span>}

        {/* if not loading */}
        {!loading && !!taskDetails?._id && (
          <div className="flex flex-col gap-2">
            {/* delete action */}
            {deleteConfirmation && (
              <TaskDeleteConfirmation
                deleting={deleting}
                id={taskDeleteId}
                onCancel={() => {
                  notify.success('Task delete cancelled ❌');
                  setDeleteConfirmation(false);
                }}
                onConfirm={deleteTask}
              />
            )}

            {/* heading card */}
            <HeadingCard
              className="flex gap-4"
              highlightText={taskDetails?.status || 'todo'}
              heading={taskDetails?.title || 'Task Title'}
              text={taskDetails?.description || 'Task Description'}
              icon={<LuClipboardList className="text-primary-bg text-2xl" />}
              color={taskDetails?.status || 'todo'}
              highlightBg={`status-${taskDetails?.status}-secondary`}
            >
              <ButtonLink
                to={`/edit-task/${taskDetails?._id}`}
                type="button"
                className="text-primary-bg"
                text="Edit Task"
              />

              <Button
                type="button"
                onClick={() => {
                  setDeleteConfirmation(true);
                  setTaskDeleteId(taskDetails?._id || '');
                }}
                className="bg-status-overdue-secondary text-status-overdue focus:ring-2 focus:ring-status-overdue"
              >
                <span>Delete Task</span>
              </Button>
            </HeadingCard>

            {/* time stamps */}
            <div className="bg-secondary-bg flex flex-wrap gap-3 p-2 text-xs rounded-3xl">
              <p className=" border-gray-text py-0.5 px-1.5 rounded-lg text-gray-text font-semibold">
                Created:{' '}
                <span>{prettyDate(String(taskDetails?.createdAt))}</span>
              </p>
              {taskDetails?.updatedAt !== taskDetails?.createdAt && (
                <p className=" border-gray-text py-0.5 px-1.5 rounded-md text-gray-text font-semibold">
                  Updated:{' '}
                  <span>{prettyDate(String(taskDetails?.updatedAt))}</span>
                </p>
              )}
            </div>

            {/* main grid meta */}
            <TaskMetaSection taskDetails={taskDetails} />

            {/* attachments */}
            {/* <div className="py-2">
              <H2 text="Attachments" />

              <div className="bg-secondary-bg rounded-3xl flex flex-col items-center p-4 gap-3 border border-sidebar-selected">
                {!!taskDetails?.attachments &&
                  taskDetails?.attachments?.length !== 0 && (
                    <div className="flex flex-nowrap gap-2 justify-start w-full items-center overflow-x-auto">
                      {showImage && (
                        <DisplayImage
                          handleClose={() => {
                            setShowImage(false);
                            setImageUrl("");
                          }}
                          url={imageUrl}
                        />
                      )}
                      {taskDetails?.attachments?.map((url) => (
                        <div key={url} className="min-w-[200px]">
                          <img
                            src={url}
                            key={url}
                            className="h-[300px] object-cover rounded-2xl cursor-pointer hover:border-2 hover:border-btn-primary/50 transition-all duration-100 p-0.5"
                            alt="Attachment Image"
                            onClick={() => {
                              setShowImage(true);
                              setImageUrl(url);
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  )}

                <p className="text-sm text-gray-text">
                  There's no attachments{" "}
                  <input
                    id="files"
                    type="file"
                    className="hidden"
                    // onChange={handleChange}
                  />
                  <label
                    htmlFor="files"
                    className="cursor-pointer px-4 py-2 bg-btn-primary text-white rounded-xl font-semibold shadow hover:bg-btn-primary/90 transition"
                  >
                    Select File
                  </label>
                </p>
              </div>
            </div> */}
            <div>
              <Attachments
                taskId={id as string}
                attachedDocuments={
                  (taskDetails.attachedDocuments as DocumentT[]) || []
                }
              />
            </div>

            {/* dependencies */}
            <div className="py-2">
              <H2 text="Dependencies" className="px-2" />
              <div className="flex flex-col gap-1 py-2">
                {dependencies?.length !== 0 &&
                  dependencies?.map((dep) => (
                    <DependencyRow
                      key={dep._id}
                      handleUnlinkDependency={handleUnlinkDependency}
                      depsData={dep}
                    />
                  ))}

                {showDepsInput && (
                  <div className="relative">
                    {debounceDataContainerShow && (
                      <DebounceTasks
                        handleClick={handleSelectDependency}
                        loading={debounceLoading}
                        tasks={debouncedTasks}
                        handleClose={() => {
                          setDebounceDataContainerShow(false);
                          setDebouncedTasks([]);
                          setDebounceLoading(false);
                          setDepsInput(false);
                        }}
                      />
                    )}
                    <form className={`${formFullDivStyle} relative`}>
                      <input
                        onChange={handleDebounceSearch}
                        // value={dependsOn}
                        name="dependsOn"
                        className={formInputStyle}
                        type="text"
                        id="t-depends"
                        placeholder="Search dependency, by title or ticket id"
                      />
                      <MdOutlineAddLink className="absolute top-[50%] -translate-y-1/2 right-4.5 text-xl" />
                    </form>
                  </div>
                )}
                <button
                  type="button"
                  className="rounded-2xl p-1 flex flex-col"
                  onClick={() => setDepsInput(true)}
                >
                  <p className="border border-gray-text/20 hover:border-btn-primary/40 bg-gray-text/10 p-2 flex justify-center hover:scale-101 transition-all ease-in-out duration-500 rounded-md text-main/70">
                    <FaPlus />
                  </p>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default TaskDetails;
