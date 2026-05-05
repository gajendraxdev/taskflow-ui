import axios, { AxiosError } from 'axios';
import type React from 'react';
import { useCallback, useEffect, useState } from 'react';
import { FaFingerprint, FaTrash } from 'react-icons/fa';
import { MdAddCircleOutline } from 'react-icons/md';
import { useSelector } from 'react-redux';
import PageHeader from '../components/PageHeader';
import Button from '../components/ui/Button';
import { API_ROUTES } from '../constants/apiRoutes';
import { apiEndpoint } from '../constants/env';
import type { RootState } from '../redux/store';
import { notify } from '../utils/notify';

interface PasskeyEntry {
  id: string;
  deviceName: string | null;
  lastUsedAt: string | null;
}

const Settings: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const token = user?.authToken;

  const [passkeys, setPasskeys] = useState<PasskeyEntry[]>([]);
  const [loadingPasskeys, setLoadingPasskeys] = useState(true);
  const [registeringPasskey, setRegisteringPasskey] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deviceName, setDeviceName] = useState('');

  // ── Fetch passkeys ──────────────────────────────────────────────────────────
  const fetchPasskeys = useCallback(async () => {
    setLoadingPasskeys(true);
    try {
      const resp = await axios.get(
        `${apiEndpoint}/${API_ROUTES.auth.passkey.list}`,
        { headers: token ? { Authorization: `Bearer ${token}` } : {} },
      );
      setPasskeys(resp.data?.data ?? []);
    } catch (err) {
      if (err instanceof AxiosError) {
        notify.error(err.response?.data?.error || err.message);
      }
    } finally {
      setLoadingPasskeys(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) fetchPasskeys();
  }, [token, fetchPasskeys]);

  // ── Register new passkey ────────────────────────────────────────────────────
  const handleRegisterPasskey = async () => {
    setRegisteringPasskey(true);
    try {
      const { startRegistration } = await import('@simplewebauthn/browser');

      // 1. Get registration options
      const optionsResp = await axios.get(
        `${apiEndpoint}/${API_ROUTES.auth.passkey.registerOptions}`,
        { headers: token ? { Authorization: `Bearer ${token}` } : {} },
      );
      const options = optionsResp.data.data;

      // 2. Trigger browser WebAuthn prompt
      const credential = await startRegistration({ optionsJSON: options });

      // 3. Verify with server
      await axios.post(
        `${apiEndpoint}/${API_ROUTES.auth.passkey.registerVerify}`,
        { credential, deviceName: deviceName.trim() || null },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} },
      );

      notify.success('Passkey registered successfully!');
      setDeviceName('');
      await fetchPasskeys();
    } catch (err: unknown) {
      const axiosErr = err as {
        response?: { data?: { error?: string } };
        message?: string;
        name?: string;
      };
      // User cancelled the browser prompt
      if (axiosErr?.name === 'NotAllowedError') {
        notify.error('Passkey registration was cancelled.');
      } else {
        notify.error(
          axiosErr?.response?.data?.error ||
            axiosErr?.message ||
            'Failed to register passkey',
        );
      }
    } finally {
      setRegisteringPasskey(false);
    }
  };

  // ── Delete passkey ──────────────────────────────────────────────────────────
  const handleDeletePasskey = async (id: string) => {
    setDeletingId(id);
    try {
      await axios.delete(
        `${apiEndpoint}/${API_ROUTES.auth.passkey.delete(id)}`,
        { headers: token ? { Authorization: `Bearer ${token}` } : {} },
      );
      setPasskeys((prev) => prev.filter((p) => p.id !== id));
      notify.success('Passkey removed.');
    } catch (err) {
      if (err instanceof AxiosError) {
        notify.error(err.response?.data?.error || err.message);
      }
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Never';
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div>
      <PageHeader header="Settings" />

      <div className="mt-6 max-w-2xl flex flex-col gap-8">
        {/* ── Passkeys Section ─────────────────────────────────────────────── */}
        <section aria-labelledby="passkeys-heading">
          <div className="flex items-center gap-2 mb-4">
            <FaFingerprint className="text-btn-primary text-2xl" />
            <h2 id="passkeys-heading" className="text-xl font-bold text-main">
              Passkeys
            </h2>
          </div>
          <p className="text-sm text-main/60 mb-4">
            Passkeys let you sign in with your device biometrics (fingerprint,
            Face ID, or PIN) — no password needed.
          </p>

          {/* Register new passkey */}
          <div className="flex gap-3 items-center mb-6">
            <input
              type="text"
              value={deviceName}
              onChange={(e) => setDeviceName(e.target.value)}
              placeholder="Device name (optional, e.g. MacBook)"
              className="flex-1 bg-input-bg p-3 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-btn-primary"
              maxLength={50}
            />
            <Button
              type="button"
              onClick={handleRegisterPasskey}
              disabled={registeringPasskey}
              style="flex items-center gap-2 whitespace-nowrap"
            >
              <MdAddCircleOutline className="text-lg" />
              {registeringPasskey ? 'Registering…' : 'Add Passkey'}
            </Button>
          </div>

          {/* Passkey list */}
          {loadingPasskeys ? (
            <div className="flex flex-col gap-3">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="h-14 bg-gray-200 rounded-xl animate-pulse"
                />
              ))}
            </div>
          ) : passkeys.length === 0 ? (
            <p className="text-sm text-main/50 text-center py-6 border border-dashed border-main/20 rounded-xl">
              No passkeys registered yet. Add one above.
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {passkeys.map((pk) => (
                <li
                  key={pk.id}
                  className="flex items-center justify-between bg-input-bg rounded-xl px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <FaFingerprint className="text-btn-primary text-xl shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-main">
                        {pk.deviceName || 'Unnamed device'}
                      </p>
                      <p className="text-xs text-main/50">
                        Last used {formatDate(pk.lastUsedAt)}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    aria-label={`Remove passkey ${pk.deviceName || 'unnamed'}`}
                    onClick={() => handleDeletePasskey(pk.id)}
                    disabled={deletingId === pk.id}
                    className="text-status-overdue p-2 rounded-lg hover:bg-status-overdue hover:text-white transition disabled:opacity-50"
                  >
                    <FaTrash />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
};

export default Settings;
