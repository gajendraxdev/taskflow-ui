import axios, { AxiosError } from 'axios';
import React, { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { MdDelete } from 'react-icons/md';
import { apiEndpoint } from '../constants/env';
import type { DocumentT } from '../types/task';
import { fullDateTime } from '../utils/getFormatedDate';
import TaskDeleteConfirmation from './DeleteConfirmation';
import Loader from './ui/Loader';

const DocumentImage: React.FC<{
  handleImageClick: (url: string) => void;
  document: DocumentT;
  className?: string;
  handleDocumentDelete: (id: string) => void;
}> = ({ handleImageClick, document, className = '', handleDocumentDelete }) => {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [deleteConfirmation, setDeleteConfirmation] = useState<boolean>(false);
  const [deleting, setDeleting] = useState<boolean>(false);

  const deleteDocument = useCallback(async () => {
    setDeleting(true);
    try {
      const resp = await axios.delete(
        `${apiEndpoint}/document/${document?._id}`,
      );

      if (resp.status === 200) {
        console.log('Document deleted successfully');
      } else {
        toast.error('Failed to delete document.');
      }
    } catch (error) {
      if (error instanceof AxiosError) {
        console.error(error.message);

        toast.error('Failed to delete document.');
      } else {
        toast.error('Failed to delete document.');
      }
    } finally {
      setDeleting(false);
      setDeleteConfirmation(false);
      setSignedUrl(null);
      handleDocumentDelete(document._id as string);
    }
  }, [document, handleDocumentDelete]);

  useEffect(() => {
    (async () => {
      try {
        if (!document?.name) {
          return;
        }

        const resp = await axios.post(`${apiEndpoint}/document/url`, {
          filename: document.name,
        });

        if (resp.status === 200 || resp.data.data.url) {
          setSignedUrl(resp.data.data.url);
          setLoading(false);
        }
      } catch (error) {
        if (error instanceof AxiosError) {
          console.error(error.message);
        } else {
          console.error(error);
        }
      }
    })();
  }, [document]);

  if (!document) return null;

  return (
    <div className="h-[300px] w-[200px] bg-primary-bg rounded-2xl shadow-black/50 shadow-xs">
      {deleteConfirmation && (
        <TaskDeleteConfirmation
          deleting={deleting}
          id={document._id as string}
          onCancel={() => setDeleteConfirmation(false)}
          onConfirm={() => deleteDocument()}
          title="Delete File"
        >
          <p className="text-gray-text italic">
            Are you sure you what to delete this:{' '}
            <span className="text-main font-bold">{document.originalname}</span>{' '}
            File
          </p>
        </TaskDeleteConfirmation>
      )}

      {loading && (
        <div
          className={`h-5/6 w-[200px] flex items-center justify-center bg-gray-200 rounded-t-2xl animate-pulse ${className}`}
          style={{
            backdropFilter: 'blur(8px)',
            backgroundImage: `url("${document.maskImageUrl || ''}")`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <Loader duration="0.9s" className="w-10 h-10 text-gray-400" />
        </div>
      )}
      {!loading && (
        <div className="h-5/6 w-[200px] relative">
          {/** biome-ignore lint/a11y/noStaticElementInteractions: explanation */}
          {/** biome-ignore lint/a11y/useKeyWithClickEvents: explanation */}
          <div
            className="absolute top-0 left-0 w-[200px] h-full bg-btn-primary/30 rounded-t-2xl flex-col p-3 opacity-0 hover:opacity-100 transition-opacity duration-200 cursor-pointer flex"
            onClick={() => handleImageClick(signedUrl as string)}
          >
            <button
              type="button"
              className="p-2 bg-status-overdue-secondary font-bold text-status-overdue focus:ring-2 focus:right-status-overdue block w-fit cursor-pointer rounded-xl text-xs self-end"
              onClick={(e) => {
                e.stopPropagation();
                setDeleteConfirmation(true);
              }}
            >
              <MdDelete className="text-2xl" />
            </button>
          </div>
          {/** biome-ignore lint/a11y/useKeyWithClickEvents: explanation */}
          <img
            src={signedUrl as string}
            className={`h-full w-[200px] object-cover rounded-t-2xl cursor-pointer hover:border-2 hover:border-btn-primary/50 transition-all duration-100 p-0.5 ${className}`}
            alt="Attachment-Image"
            onClick={() => handleImageClick(signedUrl as string)}
            loading="lazy"
          />
        </div>
      )}

      <div className="h-1/6 p-2 text-xs flex flex-col gap-1 font-bold">
        <p>
          {(() => {
            const name = document.originalname || document.name || '';
            if (name.length <= 20) return name;
            const extIndex = name.lastIndexOf('.');
            const ext = extIndex !== -1 ? name.slice(extIndex) : '';
            const base = extIndex !== -1 ? name.slice(0, extIndex) : name;
            return `${base.slice(0, 16)}...${base.slice(-3)}${ext}`;
          })()}
        </p>
        <span>
          {fullDateTime(document.createdAt || new Date().toISOString())}
        </span>
      </div>
    </div>
  );
};

export default React.memo(DocumentImage);
