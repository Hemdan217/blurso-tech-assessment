# Blurr HR Portal

## Project Overview

Blurr HR Portal is a comprehensive employee management system built with Next.js 15 App Router that streamlines HR operations. The application features employee management, salary calculations, project tracking, task boards, and a notification system.

### Tech Stack

- **Frontend**: React, TailwindCSS, shadcn/ui
- **Backend**: Next.js 15 App Router with Server Actions
- **Database**: Prisma ORM with SQLite
- **Authentication**: NextAuth.js
- **Form Validation**: Zod
- **Drag and Drop**: @hello-pangea/dnd

## Setup Instructions

1. **Clone the repository**

```bash
git clone https://github.com/your-username/blurso-tech-assessment.git
cd blurso-tech-assessment
```

2. **Install dependencies**

```bash
npm install  --legacy-peer-deps
```

3. **Environment setup**

Create a `.env` file in the root directory with:

```
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
```

4. **Database setup**

```bash
npx prisma migrate dev
npx prisma db seed
```

5. **Run the development server**

```bash
npm run dev
```

Access the application at http://localhost:3000

## Implemented Features

### Authentication System

- **Secure Login**: Authentication powered by NextAuth.js with email/password strategy
- **Registration Flow**: New user creation with role selection (Admin/Employee)
- **Role-Based Access Control**: Different permissions for Admin and Employee roles
- **Protected Routes**: Secure dashboard pages with session validation

### Task Management

- **Kanban Board View**: Visual task management with columns for To Do, In Progress, and Completed tasks
- **Backlog Table View**: List view of all tasks with sortable columns
- **Task Details**: Expandable task information with description, assignee, due date, and status
- **One-Click Status Changes**: Easily transition tasks between different statuses
- **Color-Coded Status Indicators**: Visual status representation with consistent color scheme
- **Overdue/Urgent Task Indicators**: Visual alerts for time-sensitive tasks
- **Task Filtering**: Filter tasks by status, assignee, or due date
- **Responsive Design**: Works seamlessly on desktop and mobile devices

### Project Management

- **Project List View**: Summary view of all projects with key metrics
- **Project Detail View**: Comprehensive project information with tasks
- **Project Creation**: Simple form for creating new projects
- **Project Archiving**: Archive completed projects while maintaining records

### Employee Management

- **Employee Directory**: Complete list of employees with contact information
- **Employee Profiles**: Detailed employee information with assigned tasks
- **Salary Management**: Track and manage employee compensation

### User Interface

- **Role-Specific Navigation**: Different sidebar options based on user role
- **Responsive Layout**: Optimized for all device sizes
- **Modern Design**: Clean, professional UI with shadcn/ui components
- **Dark/Light Mode Support**: Customizable theme options

### AI Chatbot (Placeholder)

- **Floating Chat Interface**: Accessible from all pages via a button in the bottom-right corner
- **Sample FAQ Responses**: Pre-defined answers to common questions about tasks, projects, and roles
- **Responsive Design**: Works on all device sizes and adapts to the application theme
- **Expandable Architecture**: Built to be easily extended with real AI capabilities in the future

> **Note:** The current chatbot implementation is a UI placeholder designed to demonstrate the interface and interaction patterns. It provides static responses to specific keywords related to tasks, projects, and roles. Future versions will integrate with an AI service for more dynamic and comprehensive assistance.

## Key Files and Functionality

### Authentication

- `src/app/login/page.tsx`: Login page with email/password authentication
- `src/app/register/page.tsx`: Registration page with role selection
- `src/app/api/auth/[...nextauth]/route.ts`: NextAuth configuration

### Dashboard

- `src/app/dashboard/page.tsx`: Main dashboard with summary statistics
- `src/app/dashboard/layout.tsx`: Dashboard layout with sidebar navigation

### Projects

- `src/app/dashboard/projects/page.tsx`: Project listing page
- `src/app/dashboard/projects/[projectId]/page.tsx`: Project details with Kanban board
- `src/app/dashboard/projects/[projectId]/components/`: Project components
  - `task-board.tsx`: Kanban board implementation
  - `task-table.tsx`: Table view of tasks
  - `task-details-modal.tsx`: Modal for viewing/editing task details
  - `create-task-modal.tsx`: Form for creating new tasks

### Employees

- `src/app/dashboard/employees/page.tsx`: Employee management for admins
- `src/app/dashboard/profile/page.tsx`: User profile management

### Notifications

- `src/app/dashboard/notifications/page.tsx`: Notification center
- `src/components/notifications/`: Notification components

### Salaries

- `src/app/dashboard/salaries/page.tsx`: Salary management for admins
- `src/app/dashboard/my-salaries/page.tsx`: Personal salary view for employees

### Tasks

- `src/app/dashboard/tasks/page.tsx`: Personal task list
- `src/components/ui/`: UI components using shadcn/ui

### Chatbot

- `src/components/chatbot/chatbot.tsx`: Main chatbot component
- `src/components/chatbot/chatbot-button.tsx`: Floating button component
- `src/components/chatbot/chatbot-window.tsx`: Chat interface with message handling
- `src/components/chatbot/chatbot-message.tsx`: Individual message component

## Usage Guide

### Authentication

- **Login**: Use `admin@example.com` / `admin123` for admin access
- **Register**: Create a new account through the register page
- **Role-based access**: Admin and Employee roles have different permissions

### Employee Management (Admin Only)

- Add, edit, and delete employee records
- Set employee ID, name, joining date, and basic salary
- Toggle active/inactive status

### Salary Management

- **Admin View**: Calculate and manage salaries for all employees
- **Employee View**: View personal salary information
- Add bonuses and deductions through JSON field
- Generate monthly salary reports

### Projects & Tasks

- **Project Management**:

  - Create, edit, delete projects
  - Archive/unarchive projects
  - Search and filter project lists

- **Task Management**:
  - Kanban board grouped by status (PENDING, IN_PROGRESS, DONE)
  - Drag and drop tasks between statuses
  - Assign tasks to specific employees
  - Set title, description, priority, and due dates

### Notification System

- **Real-time notifications** for:

  - Task assignments (notifies employee)
  - Status changes (notifies admin or employee)
  - Task updates and notes (notifies relevant parties)
  - Task deletions (notifies assigned employee)

- **UI Features**:
  - Notification bell with unread count in navbar
  - Dropdown menu showing recent notifications
  - Mark notifications as read individually or all at once
  - Click notifications to navigate to relevant task/project

### AI Chatbot Usage

- Click the chat button in the bottom right corner to open the assistant
- Ask questions about tasks, projects, or user roles
- The chatbot provides pre-defined responses to common questions
- To close the chat window, click the X in the top corner or the chat button again

### Role-Based UI

- **Admin**: Access to employee management, all salaries, all projects
- **Employee**: Limited to personal tasks, assigned projects, own salary

## Folder Structure

```
/
├── prisma/               # Database schema and migrations
├── public/               # Static assets
├── src/
│   ├── app/              # Next.js App Router
│   │   ├── api/          # API routes including auth
│   │   ├── dashboard/    # Protected routes
│   │   │   ├── employees/  # Employee management
│   │   │   ├── projects/   # Project management
│   │   │   ├── tasks/      # Task management
│   │   │   └── notifications/ # Notification actions
│   ├── auth/             # Authentication setup
│   ├── components/       # Reusable UI components
│   │   ├── ui/           # shadcn components
│   │   ├── notifications/ # Notification components
│   │   └── chatbot/      # AI chatbot components
│   ├── lib/              # Utilities and helpers
│   └── types/            # TypeScript types
└── next.config.js        # Next.js configuration
```

## Database Schema

The application uses the following data models:

- **User**: Authentication and user info
- **Employee**: Employee records linked to users
- **Project**: Project details and status
- **Task**: Tasks with status, assignment, and project relation
- **TaskAction**: History of task updates
- **Notification**: User notifications

## Screenshots

![HR Dashboard](/screenshots/Blurr-HR-Dashboard-05-20-2025_07_09_PM.png)
![HR Dashboard](/screenshots/Blurr-HR-Dashboard-05-20-2025_07_10_PM.png)
![HR Dashboard](</screenshots/Blurr-HR-Dashboard-05-20-2025_07_10_PM%20(1).png>)
![HR Dashboard](/screenshots/Blurr-HR-Dashboard-05-20-2025_07_11_PM.png)
![HR Dashboard](</screenshots/Blurr-HR-Dashboard-05-20-2025_07_11_PM%20(1).png>)
![HR Dashboard](</screenshots/Blurr-HR-Dashboard-05-20-2025_07_11_PM%20(2).png>)
![HR Dashboard](</screenshots/Blurr-HR-Dashboard-05-20-2025_07_11_PM%20(3).png>)
![HR Dashboard](/screenshots/Screenshot%202025-05-20%20191646.png)

## Demo Video

[Watch the demo video](https://drive.google.com/file/d/1d4pskDHbFOsAwFXwllD2eM5DnKAP8tV2/view?usp=sharing)

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -m 'Add feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## AI Development Process

This project was developed using AI-assisted workflows:

1. **Planning**: AI helped draft the architecture and project structure
2. **Code Generation**: Used to create initial components and logic
3. **Debugging**: AI identified issues and suggested fixes
4. **Feature Implementation**: Created complex features like notification system
5. **Documentation**: Assisted in creating README and inline documentation

## Troubleshooting

- **Database Issues**: Run `npx prisma migrate reset --force` then `npx prisma db seed`
- **Authentication Errors**: Check .env file for proper NEXTAUTH configuration
- **UI Not Updating**: Run `npm run build && npm start` to ensure latest build
- **Suspense Boundaries**: If you encounter routing errors, ensure components using useSearchParams are wrapped in Suspense

## Future Enhancements

- Real-time notifications with WebSockets
- Email notifications for important events
- Export salary reports to PDF/CSV
- Advanced project analytics dashboard
- Mobile application integration
- **AI Chatbot Improvements**:
  - Integration with a real AI service for dynamic responses
  - Context-aware assistance based on current page
  - Task creation and updates through chat interface
  - Employee onboarding assistant capabilities
