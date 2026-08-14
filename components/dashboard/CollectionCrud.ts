"use client";

import { useCallback, useRef, useState } from "react";

// ============================================================
// Generic Collection CRUD hook (College Nepal).
// add/edit via modal, delete via confirm dialog.
// Works for any {id: string} item (College Nepal uses string ids).
// ============================================================

export interface CrudItem {
  id: string;
}

export interface CrudApi<T extends CrudItem> {
  open: {
    add: () => void;
    edit: (item: T) => void;
    remove: (item: T) => void;
  };
  modal: {
    isOpen: boolean;
    editing: T | null;
    close: () => void;
    onSave: (draft: Omit<T, "id"> | T) => void;
  };
  confirm: {
    isOpen: boolean;
    target: T | null;
    cancel: () => void;
    confirmDelete: () => void;
  };
}

/** Return the next unique id (string) for a collection item. */
function nextId(existing: { id: string }[]): string {
  const max = existing.reduce((m, e) => {
    const n = parseInt(e.id.replace(/[^0-9]/g, ""), 10);
    return Number.isNaN(n) ? m : Math.max(m, n);
  }, 0);
  return `${existing.length ? "item" : "item"}${max + 1}`;
}

export function useCollection<T extends CrudItem>(
  items: T[],
  onChange: (items: T[]) => void
): CrudApi<T> {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<T | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<T | null>(null);

  const nextRef = useRef<string | null>(null);

  const commit = useCallback(
    (draft: Omit<T, "id"> | T) => {
      if (editing) {
        onChange(
          items.map((it) => (it.id === editing.id ? { ...it, ...(draft as T) } : it))
        );
      } else {
        const newId = nextRef.current ?? nextId(items);
        onChange([...items, { ...(draft as Omit<T, "id">), id: newId } as T]);
        nextRef.current = `${parseInt(newId.replace(/[^0-9]/g, "") || "0", 10) + 1}`;
      }
      setModalOpen(false);
      setEditing(null);
    },
    [items, onChange, editing]
  );

  const add = useCallback(() => {
    setEditing(null);
    nextRef.current = nextId(items);
    setModalOpen(true);
  }, [items]);

  const edit = useCallback((item: T) => {
    setEditing(item);
    setModalOpen(true);
  }, []);

  const remove = useCallback((item: T) => {
    setDeleteTarget(item);
  }, []);

  const confirmDelete = useCallback(() => {
    if (deleteTarget) {
      onChange(items.filter((it) => it.id !== deleteTarget.id));
    }
    setDeleteTarget(null);
  }, [deleteTarget, items, onChange]);

  const cancelDelete = useCallback(() => setDeleteTarget(null), []);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setEditing(null);
  }, []);

  return {
    open: { add, edit, remove },
    modal: { isOpen: modalOpen, editing, close: closeModal, onSave: commit },
    confirm: {
      isOpen: deleteTarget !== null,
      target: deleteTarget,
      cancel: cancelDelete,
      confirmDelete,
    },
  };
}