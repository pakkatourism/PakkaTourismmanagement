import { create } from 'zustand';
import { io } from 'socket.io-client';
import api from '../services/api';

let socketInstance = null;

const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,
  socket: null,

  // Fetch notifications from API
  fetchNotifications: async () => {
    try {
      const { data } = await api.get('/notifications');
      set({ notifications: data.data, unreadCount: data.unreadCount });
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  },

  // Mark single notification as read
  markRead: async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      set((state) => ({
        notifications: state.notifications.map(n => n._id === id ? { ...n, read: true } : n),
        unreadCount: Math.max(0, state.unreadCount - 1)
      }));
    } catch (err) {
      console.error('Failed to mark read:', err);
    }
  },

  // Mark all as read
  markAllRead: async () => {
    try {
      await api.put('/notifications/mark-all');
      set((state) => ({
        notifications: state.notifications.map(n => ({ ...n, read: true })),
        unreadCount: 0
      }));
    } catch (err) {
      console.error('Failed to mark all read:', err);
    }
  },

  // Add notification (from socket event)
  addNotification: (notif) => {
    set((state) => ({
      notifications: [notif, ...state.notifications].slice(0, 50),
      unreadCount: state.unreadCount + 1
    }));
  },

  // Connect socket
  connectSocket: (token) => {
    if (socketInstance?.connected) return;

    socketInstance = io(import.meta.env.VITE_SOCKET_URL || '', {
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    socketInstance.on('connect', () => {
      console.log('🔔 Notification socket connected');
    });

    socketInstance.on('notification', (notif) => {
      get().addNotification(notif);
      // Browser notification (if permitted)
      if (Notification.permission === 'granted') {
        new Notification(notif.title, { body: notif.message, icon: '/favicon.svg' });
      }
    });

    socketInstance.on('disconnect', () => {
      console.log('🔔 Notification socket disconnected');
    });

    set({ socket: socketInstance });
  },

  // Disconnect socket
  disconnectSocket: () => {
    if (socketInstance) {
      socketInstance.disconnect();
      socketInstance = null;
      set({ socket: null });
    }
  },
}));

export default useNotificationStore;
