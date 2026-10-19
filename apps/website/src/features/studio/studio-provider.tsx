"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { StudioData, Row, Table } from "./data/models";
import { createSeed } from "./data/seed";
import {
  decodeData,
  encodeData,
  patchRow,
  insertRow,
  deleteRow,
  restoreSceneDrafts,
  DRAFT_KEY,
  STORAGE_KEY,
  uid,
} from "./data/repository";

type StudioContext = {
  data: StudioData;
  ready: boolean;
  persistence: "saved" | "saving" | "error";
  storageError: string;
  update: (fn: (data: StudioData) => StudioData) => void;
  patch: <K extends Table>(
    table: K,
    id: string,
    value: Partial<Omit<Row<K>, "id">>,
  ) => void;
  insert: <K extends Table>(table: K, value: Row<K>) => void;
  remove: (table: Table, id: string) => void;
  notify: (text: string) => void;
  reset: () => void;
  saveNow: () => void;
  record: (projectId: string, label: string, href: string) => void;
};
const Context = createContext<StudioContext | null>(null);
export function StudioProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState(createSeed);
  const [ready, setReady] = useState(false);
  const [persistence, setPersistence] = useState<"saved" | "saving" | "error">(
    "saved",
  );
  const [storageError, setStorageError] = useState("");
  const [toast, setToast] = useState("");
  const current = useRef(data);
  current.current = data;
  const notify = useCallback((text: string) => setToast(text), []);
  const saveNow = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, encodeData(current.current));
      for (const scene of current.current.scenes) {
        const draft = localStorage.getItem(DRAFT_KEY + scene.id);
        if (draft) {
          try {
            const v: unknown = JSON.parse(draft);
            if (
              v &&
              typeof v === "object" &&
              (v as { content?: unknown }).content === scene.content
            )
              localStorage.removeItem(DRAFT_KEY + scene.id);
          } catch {
            /* Preserve unreadable recovery drafts. */
          }
        }
      }
      setPersistence("saved");
      setStorageError("");
    } catch {
      setPersistence("error");
      setStorageError(
        "Your browser could not save this demo. Keep this tab open, remove large uploads, or export a backup in Preferences.",
      );
    }
  }, []);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const saved = decodeData(raw);
      setData(
        restoreSceneDrafts(saved ?? createSeed(), (key) =>
          localStorage.getItem(key),
        ),
      );
      if (raw && !saved) {
        setStorageError(
          "The saved demo could not be read. A fresh demo is open; the original backup is retained under rawan-author-studio-recovery.",
        );
        localStorage.setItem("rawan-author-studio-recovery", raw);
      }
    } catch {
      setStorageError(
        "Browser storage is unavailable. Changes will last only in this tab.",
      );
    }
    setReady(true);
  }, []);
  useEffect(() => {
    if (!ready) return;
    setPersistence("saving");
    const timer = setTimeout(saveNow, 350);
    return () => clearTimeout(timer);
  }, [data, ready, saveNow]);
  useEffect(() => {
    if (!ready) return;
    const flush = () => saveNow();
    window.addEventListener("pagehide", flush);
    return () => window.removeEventListener("pagehide", flush);
  }, [ready, saveNow]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 4000);
    return () => clearTimeout(timer);
  }, [toast]);
  const update = useCallback(
    (fn: (value: StudioData) => StudioData) => setData(fn),
    [],
  );
  const patch = useCallback(
    <K extends Table>(
      table: K,
      id: string,
      value: Partial<Omit<Row<K>, "id">>,
    ) => setData((d) => patchRow(d, table, id, value)),
    [],
  );
  const insert = useCallback(
    <K extends Table>(table: K, value: Row<K>) =>
      setData((d) => insertRow(d, table, value)),
    [],
  );
  const remove = useCallback(
    (table: Table, id: string) => setData((d) => deleteRow(d, table, id)),
    [],
  );
  const record = useCallback(
    (projectId: string, label: string, href: string) =>
      setData((d) => ({
        ...d,
        activity: [
          {
            id: uid("activity"),
            projectId,
            label,
            href,
            at: new Date().toISOString(),
          },
          ...d.activity,
        ].slice(0, 100),
      })),
    [],
  );
  return (
    <Context.Provider
      value={{
        data,
        ready,
        persistence,
        storageError,
        update,
        patch,
        insert,
        remove,
        notify,
        saveNow,
        record,
        reset: () => {
          try {
            for (let i = localStorage.length - 1; i >= 0; i--) {
              const key = localStorage.key(i);
              if (key?.startsWith(DRAFT_KEY)) localStorage.removeItem(key);
            }
          } catch {
            /* In-memory reset still works without storage. */
          }
          setData(createSeed());
          notify("Demo data reset on this device.");
        },
      }}
    >
      {children}
      <div className="studio-toast" role="status">
        {toast}
      </div>
    </Context.Provider>
  );
}
export function useStudio() {
  const value = useContext(Context);
  if (!value) throw new Error("StudioProvider is required");
  return value;
}
