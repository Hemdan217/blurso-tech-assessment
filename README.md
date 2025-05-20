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
npm install
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
│   │   └── notifications/ # Notification components
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
- **Salary**: Employee salary records with JSON for adjustments

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

## Future Enhancements

- Real-time notifications with WebSockets
- Email notifications for important events
- Export salary reports to PDF/CSV
- Advanced project analytics dashboard
- Mobile application integration
