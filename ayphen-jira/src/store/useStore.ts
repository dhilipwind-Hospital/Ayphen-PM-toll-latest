import { create } from 'zustand';
import type {
  User,
  Project,
  Issue,
  Board,
  Filter,
  Dashboard,
  Notification,
  Sprint,
  Component,
  Version,
} from '../types';

interface FavoriteItem {
  type: 'issue' | 'project' | 'filter' | 'dashboard';
  id: string;
}

interface AppState {
  // User
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;

  // Projects
  projects: Project[];
  currentProject: Project | null;
  setProjects: (projects: Project[]) => void;
  setCurrentProject: (project: Project | null) => void;
  addProject: (project: Project) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;

  // Issues
  issues: Issue[];
  currentIssue: Issue | null;
  setIssues: (issues: Issue[]) => void;
  setCurrentIssue: (issue: Issue | null) => void;
  addIssue: (issue: Issue) => void;
  updateIssue: (id: string, updates: Partial<Issue>) => void;
  deleteIssue: (id: string) => void;

  // Boards
  boards: Board[];
  currentBoard: Board | null;
  setBoards: (boards: Board[]) => void;
  setCurrentBoard: (board: Board | null) => void;
  addBoard: (board: Board) => void;
  updateBoard: (id: string, updates: Partial<Board>) => void;

  // Sprints
  sprints: Sprint[];
  setSprints: (sprints: Sprint[]) => void;
  addSprint: (sprint: Sprint) => void;
  updateSprint: (id: string, updates: Partial<Sprint>) => void;
  deleteSprint: (id: string) => void;

  // Filters
  filters: Filter[];
  setFilters: (filters: Filter[]) => void;
  addFilter: (filter: Filter) => void;
  updateFilter: (id: string, updates: Partial<Filter>) => void;
  deleteFilter: (id: string) => void;

  // Dashboards
  dashboards: Dashboard[];
  currentDashboard: Dashboard | null;
  setDashboards: (dashboards: Dashboard[]) => void;
  setCurrentDashboard: (dashboard: Dashboard | null) => void;
  addDashboard: (dashboard: Dashboard) => void;
  updateDashboard: (id: string, updates: Partial<Dashboard>) => void;

  // Notifications
  notifications: Notification[];
  unreadCount: number;
  setNotifications: (notifications: Notification[]) => void;
  addNotification: (notification: Notification) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;

  // Components
  components: Component[];
  setComponents: (components: Component[]) => void;
  addComponent: (component: Component) => void;

  // Versions
  versions: Version[];
  setVersions: (versions: Version[]) => void;
  addVersion: (version: Version) => void;

  // UI State
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  favorites: FavoriteItem[];
  toggleFavorite: (type: 'issue' | 'project' | 'filter' | 'dashboard', id: string) => void;
  isFavorite: (type: 'issue' | 'project' | 'filter' | 'dashboard', id: string) => boolean;
  isInitialized: boolean;
  setIsInitialized: (initialized: boolean) => void;

  // Computed Selectors
  getCurrentProjectIssues: () => Issue[];
  getCurrentProjectSprints: () => Sprint[];
  getCurrentProjectBoards: () => Board[];
}

export const useStore = create<AppState>((set, get) => ({
  // User
  currentUser: null,
  setCurrentUser: (user) => set({ currentUser: user }),

  // Projects
  projects: [],
  currentProject: null,
  setProjects: (projects) => set({ projects }),
  setCurrentProject: (project) => {
    if (project) {
      localStorage.setItem('currentProjectId', project.id);
    } else {
      localStorage.removeItem('currentProjectId');
    }
    set({ currentProject: project });
  },
  addProject: (project) => set((state) => ({ projects: [...state.projects, project] })),
  updateProject: (id, updates) =>
    set((state) => ({
      projects: state.projects.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    })),
  deleteProject: (id) =>
    set((state) => ({
      projects: state.projects.filter((p) => p.id !== id),
    })),

  // Issues
  issues: [],
  currentIssue: null,
  setIssues: (issues) => set({ issues }),
  setCurrentIssue: (issue) => set({ currentIssue: issue }),
  addIssue: (issue) => set((state) => ({ issues: [...state.issues, issue] })),
  updateIssue: (id, updates) =>
    set((state) => ({
      issues: state.issues.map((i) => (i.id === id ? { ...i, ...updates } : i)),
    })),
  deleteIssue: (id) =>
    set((state) => ({
      issues: state.issues.filter((i) => i.id !== id),
    })),

  // Boards
  boards: [],
  currentBoard: null,
  setBoards: (boards) => set({ boards }),
  setCurrentBoard: (board) => set({ currentBoard: board }),
  addBoard: (board) => set((state) => ({ boards: [...state.boards, board] })),
  updateBoard: (id, updates) =>
    set((state) => ({
      boards: state.boards.map((b) => (b.id === id ? { ...b, ...updates } : b)),
    })),

  // Sprints
  sprints: [],
  setSprints: (sprints) => set({ sprints }),
  addSprint: (sprint) => set((state) => ({ sprints: [...state.sprints, sprint] })),
  updateSprint: (id, updates) =>
    set((state) => ({
      sprints: state.sprints.map((s) => (s.id === id ? { ...s, ...updates } : s)),
    })),
  deleteSprint: (id) =>
    set((state) => ({
      sprints: state.sprints.filter((s) => s.id !== id),
    })),

  // Filters
  filters: [],
  setFilters: (filters) => set({ filters }),
  addFilter: (filter) => set((state) => ({ filters: [...state.filters, filter] })),
  updateFilter: (id, updates) =>
    set((state) => ({
      filters: state.filters.map((f) => (f.id === id ? { ...f, ...updates } : f)),
    })),
  deleteFilter: (id) =>
    set((state) => ({
      filters: state.filters.filter((f) => f.id !== id),
    })),

  // Dashboards
  dashboards: [],
  currentDashboard: null,
  setDashboards: (dashboards) => set({ dashboards }),
  setCurrentDashboard: (dashboard) => set({ currentDashboard: dashboard }),
  addDashboard: (dashboard) =>
    set((state) => ({ dashboards: [...state.dashboards, dashboard] })),
  updateDashboard: (id, updates) =>
    set((state) => ({
      dashboards: state.dashboards.map((d) => (d.id === id ? { ...d, ...updates } : d)),
    })),

  // Notifications
  notifications: [],
  unreadCount: 0,
  setNotifications: (notifications) =>
    set({
      notifications,
      unreadCount: notifications.filter((n) => !n.isRead).length,
    }),
  addNotification: (notification) =>
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    })),
  markAsRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, isRead: true } : n
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    })),
  markAllAsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
      unreadCount: 0,
    })),

  // Components
  components: [],
  setComponents: (components) => set({ components }),
  addComponent: (component) =>
    set((state) => ({ components: [...state.components, component] })),

  // Versions
  versions: [],
  setVersions: (versions) => set({ versions }),
  addVersion: (version) => set((state) => ({ versions: [...state.versions, version] })),

  // UI State
  sidebarCollapsed: false,
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  theme: 'light',
  setTheme: (theme) => set({ theme }),
  isInitialized: false,
  setIsInitialized: (initialized) => set({ isInitialized: initialized }),

  // Favorites
  favorites: JSON.parse(localStorage.getItem('user_favorites') || '[]'),
  toggleFavorite: (type, id) => set((state) => {
    const exists = state.favorites.find(f => f.type === type && f.id === id);
    let newFavorites;
    if (exists) {
      newFavorites = state.favorites.filter(f => !(f.type === type && f.id === id));
    } else {
      newFavorites = [...state.favorites, { type, id }];
    }
    localStorage.setItem('user_favorites', JSON.stringify(newFavorites));
    return { favorites: newFavorites };
  }),
  isFavorite: (type, id) => {
    const state = get();
    return state.favorites.some(f => f.type === type && f.id === id);
  },

  // Computed Selectors
  getCurrentProjectIssues: () => {
    const state = get();
    return state.issues.filter((i: Issue) =>
      state.currentProject && i.projectId === state.currentProject.id
    );
  },
  getCurrentProjectSprints: () => {
    const state = get();
    return state.sprints.filter((s: Sprint) =>
      state.currentProject && s.projectId === state.currentProject.id
    );
  },
  getCurrentProjectBoards: () => {
    const state = get();
    return state.boards.filter((b: Board) =>
      state.currentProject && b.projectId === state.currentProject.id
    );
  },
}));
