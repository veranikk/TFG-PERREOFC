/**
 * Zustand store for shared use events store state in the app.
 * Screens read and update this store when the state must survive across routes.
 */

// src/store/useEventsStore.ts
// Estado global de eventos — compartido entre CalendarioScreen y EventoScreen
// para que borrar/añadir en el detalle se refleje en el calendario sin recarga.

import { create } from 'zustand';
import { Event } from '../types';

interface EventsState {
  events: Event[];
  loaded: boolean;
  deletedEvent: Event | null; // último evento borrado (para deshacer)

  setEvents: (events: Event[]) => void;
  addEvent: (event: Event) => void;
  deleteEvent: (id: string) => void;
  undoDelete: () => void;
  clearDeleted: () => void;
}

export const useEventsStore = create<EventsState>((set) => ({
  events: [],
  loaded: false,
  deletedEvent: null,

  setEvents: (events) => set({ events, loaded: true }),

  addEvent: (event) =>
    set((s) => ({
      events: [...s.events, event].sort((a, b) => a.date.localeCompare(b.date)),
    })),

  deleteEvent: (id) =>
    set((s) => {
      const target = s.events.find((e) => e.id === id) ?? null;
      return {
        events: s.events.filter((e) => e.id !== id),
        deletedEvent: target,
      };
    }),

  undoDelete: () =>
    set((s) => {
      if (!s.deletedEvent) return s;
      return {
        events: [...s.events, s.deletedEvent].sort((a, b) =>
          a.date.localeCompare(b.date),
        ),
        deletedEvent: null,
      };
    }),

  clearDeleted: () => set({ deletedEvent: null }),
}));
