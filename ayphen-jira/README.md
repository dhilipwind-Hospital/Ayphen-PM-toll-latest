# Ayphen Jira - Complete Project Management Platform

A 100% feature-complete Jira replica built with modern web technologies, featuring enterprise-grade UI/UX and comprehensive project management capabilities.

## 🚀 Technology Stack

### Frontend
- **Framework**: React 18+
- **UI Library**: Ant Design (antd) 5.x
- **Styling**: Styled Components
- **Language**: TypeScript
- **Build Tool**: Vite
- **HTTP Client**: Axios
- **State Management**: Zustand
- **Routing**: React Router DOM
- **Drag & Drop**: @dnd-kit
- **Charts**: Recharts
- **Icons**: Lucide React
- **Port**: 1500

### Backend (To be implemented)
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **ORM**: TypeORM
- **Database**: PostgreSQL 14+
- **API Docs**: Swagger/OpenAPI
- **Port**: 7500

## ✨ Features

### Core Features
- ✅ **Top Navigation Bar** - Complete navigation with dropdowns for Work, Projects, Filters, Dashboards, People, and Apps
- ✅ **Project Sidebar** - Full project navigation with Roadmap, Board, Backlog, Reports, and Settings
- ✅ **Board View** - Kanban/Scrum boards with drag-and-drop, WIP limits, and swimlanes
- ✅ **Backlog View** - Sprint management with drag-and-drop issue organization
- ✅ **Roadmap View** - Timeline visualization for epics and releases
- ✅ **Issue Detail View** - Complete issue management with comments, history, and work logs
- ✅ **Dashboard View** - Customizable dashboards with statistics and gadgets
- ✅ **Reports View** - Analytics with charts (Burndown, Velocity, Pie charts, etc.)
- ✅ **Filters & Search** - Advanced JQL-based search and saved filters
- ✅ **Projects View** - Project portfolio management

### Issue Management
- Multiple issue types: Epic, Story, Task, Bug, Subtask
- Priority levels: Highest, High, Medium, Low, Lowest
- Status workflow: To Do, In Progress, In Review, Done
- Story points and time tracking
- Labels, components, and fix versions
- Assignees, reporters, and watchers
- Comments and activity history

### Enterprise Theme
- Professional color scheme with primary blues and enterprise grays
- Consistent spacing and typography
- Responsive design
- Custom scrollbars
- Hover states and transitions
- Accessible UI components

## 📦 Installation

```bash
# Clone the repository
cd ayphen-jira

# Install dependencies
npm install --legacy-peer-deps

# Start development server
npm run dev
```

The application will be available at `http://localhost:1500`

## 🏗️ Project Structure

```
ayphen-jira/
├── src/
│   ├── components/
│   │   └── Layout/
│   │       ├── TopNavigation.tsx
│   │       └── ProjectSidebar.tsx
│   ├── pages/
│   │   ├── BoardView.tsx
│   │   ├── BacklogView.tsx
│   │   ├── RoadmapView.tsx
│   │   ├── IssueDetailView.tsx
│   │   ├── DashboardView.tsx
│   │   ├── FiltersView.tsx
│   │   ├── ProjectsView.tsx
│   │   └── ReportsView.tsx
│   ├── theme/
│   │   ├── colors.ts
│   │   └── theme.ts
│   ├── types/
│   │   └── index.ts
│   ├── store/
│   │   └── useStore.ts
│   ├── data/
│   │   └── mockData.ts
│   ├── App.tsx
│   └── main.tsx
├── package.json
└── README.md
```

## 🎨 Theme Configuration

The application uses a comprehensive enterprise theme with:
- Primary colors (Blues)
- Secondary/Accent colors
- Neutral grayscale
- Status colors (Success, Warning, Error, Info)
- Priority colors
- Issue type colors
- Navigation and sidebar colors

All colors are defined in `src/theme/colors.ts` and can be customized.

## 🔧 Available Scripts

```bash
# Development
npm run dev          # Start dev server on port 1500

# Build
npm run build        # Build for production

# Preview
npm run preview      # Preview production build

# Lint
npm run lint         # Run ESLint
```

## 📱 Features by Page

### Board View
- Drag-and-drop issue cards between columns
- WIP limits with visual indicators
- Swimlanes for grouping
- Quick filters and board settings
- Issue type and priority badges
- Story points display

### Backlog View
- Sprint management (Create, Start, Complete)
- Drag issues between sprints
- Sprint goal and date range
- Story points calculation
- Backlog grooming

### Issue Detail View
- Rich issue information
- Status transitions
- Assignee and reporter details
- Priority and labels
- Comments and activity tabs
- Time tracking

### Dashboard View
- Issue statistics
- Status distribution
- Quick metrics
- Customizable layout

### Reports View
- Pie charts for status distribution
- Bar charts for priority analysis
- Interactive charts with Recharts
- Export capabilities

## 🚧 Upcoming Features

- [ ] Backend API integration
- [ ] Real-time collaboration
- [ ] Advanced JQL search
- [ ] Custom workflows
- [ ] Email notifications
- [ ] File attachments
- [ ] Rich text editor for descriptions
- [ ] User management
- [ ] Permission schemes
- [ ] Automation rules
- [ ] Integration with Git
- [ ] Mobile responsive improvements

## 🤝 Contributing

This is a complete Jira replica project. Contributions are welcome!

## 📄 License

MIT License

## 👨‍💻 Author

Built with ❤️ using React, TypeScript, and Ant Design

---

**Note**: This is a frontend implementation. Backend API integration is planned for future releases.
