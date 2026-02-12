/**
 * Optimistic Updates Hook
 * Matches ENTERPRISE_DASHBOARD_PERFORMANCE.md spec exactly.
 */

import { useCallback, useState } from 'react';

export function useOptimisticMutation(items, setItems) {
  const [pending, setPending] = useState(new Set());

  const create = useCallback(
    async (apiFn, data) => {
      const tempId = `temp-${Date.now()}`;
      const optimistic = { ...data, _id: tempId, _pending: true };

      setItems((prev) => [optimistic, ...prev]);
      setPending((prev) => new Set(prev).add(tempId));

      try {
        const result = await apiFn(data);
        setItems((prev) => prev.map((item) => (item._id === tempId ? result.data : item)));
        setPending((prev) => {
          const next = new Set(prev);
          next.delete(tempId);
          return next;
        });
        return result.data;
      } catch (error) {
        setItems((prev) => prev.filter((item) => item._id !== tempId));
        setPending((prev) => {
          const next = new Set(prev);
          next.delete(tempId);
          return next;
        });
        throw error;
      }
    },
    [setItems],
  );

  const update = useCallback(
    async (apiFn, id, data) => {
      const original = items.find((item) => item._id === id);

      setItems((prev) =>
        prev.map((item) => (item._id === id ? { ...item, ...data, _pending: true } : item)),
      );
      setPending((prev) => new Set(prev).add(id));

      try {
        const result = await apiFn(id, data);
        setItems((prev) => prev.map((item) => (item._id === id ? result.data : item)));
        setPending((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
        return result.data;
      } catch (error) {
        if (original) {
          setItems((prev) => prev.map((item) => (item._id === id ? original : item)));
        }
        setPending((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
        throw error;
      }
    },
    [items, setItems],
  );

  const remove = useCallback(
    async (apiFn, id) => {
      const original = items.filter((item) => item._id === id);

      setItems((prev) => prev.filter((item) => item._id !== id));
      setPending((prev) => new Set(prev).add(id));

      try {
        await apiFn(id);
        setPending((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      } catch (error) {
        setItems((prev) => [...prev, ...original]);
        setPending((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
        throw error;
      }
    },
    [items, setItems],
  );

  return { create, update, remove, pending };
}
