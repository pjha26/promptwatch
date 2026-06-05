import { useState, useEffect, useCallback } from "react";
import { Action, Status } from "@/lib/types";
import { deriveActions } from "../lib/derivation";

const STORAGE_KEY = "actionCentre.v1";

type StoredState = Record<string, Status>;

export function useActionState() {
  const [actions, setActions] = useState<Action[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        const res = await fetch("/monitoring-events.json");
        if (!res.ok) throw new Error("Failed to load events");
        const events = await res.json();

        if (!isMounted) return;

        // 1. Derive base actions from events
        const derived = deriveActions(events);

        // 2. Hydrate from localStorage
        let storedState: StoredState = {};
        try {
          const raw = localStorage.getItem(STORAGE_KEY);
          if (raw) {
            storedState = JSON.parse(raw);
          }
        } catch (e) {
          console.warn("Could not read from localStorage", e);
          // If quota or private browsing, we ignore and use empty storedState
        }

        // 3. Merge stored statuses into derived actions
        const merged: Action[] = derived.map((action) => {
          if (storedState[action.id]) {
            return { ...action, status: storedState[action.id] };
          }
          return action;
        });

        // 4. Save cleaned state back to local storage (drops orphaned stored states)
        const newStoredState: StoredState = {};
        merged.forEach((a) => {
          newStoredState[a.id] = a.status;
        });
        
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(newStoredState));
        } catch (e) {
          console.warn("Could not write to localStorage", e);
          // Handle quota / private browsing error cleanly later if needed
          setError(true); 
          // We set error true specifically to display the inline warning as spec asks: 
          // "Error (localStorage unavailable — quota / private browsing): fall back to in-memory state, show inline notice"
          // We don't crash, we just let it stay true.
        }

        setActions(merged);
        setLoading(false);
        setHydrated(true);
      } catch (err) {
        if (isMounted) {
          console.error(err);
          setLoading(false);
          setHydrated(true);
          // Only true fetch errors should probably show a different state, but the spec mainly talks about storage errors.
          // We'll let the UI handle empty actions if fetch fails completely.
        }
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  const updateActionStatus = useCallback((id: string, status: Status) => {
    setActions((prev) => {
      const updated = prev.map((a) => (a.id === id ? { ...a, status } : a));
      
      // Sync to local storage
      const newStoredState: StoredState = {};
      updated.forEach((a) => {
        newStoredState[a.id] = a.status;
      });
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newStoredState));
      } catch (e) {
        console.warn("Could not write to localStorage on update", e);
        setError(true);
      }

      return updated;
    });
  }, []);

  return { actions, loading, hydrated, storageError: error, updateActionStatus };
}
