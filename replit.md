# Poultry Farm Management System

## Overview

The Poultry Farm Management System is a comprehensive digital solution designed to streamline and optimize poultry farming operations. The system serves three primary user roles - Supervisors, General Managers, and CEOs - providing features for daily farm activity recording, inventory management, employee administration, financial tracking, and business intelligence reporting. Built as a full-stack web application, it enables efficient management of egg production, feed distribution, mortality tracking, procurement, payroll, and health monitoring.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript for type safety and component-based development
- **Routing**: Wouter for lightweight client-side routing
- **UI Components**: Radix UI primitives with shadcn/ui design system for consistent, accessible components
- **Styling**: Tailwind CSS with CSS variables for theming and responsive design
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Forms**: React Hook Form with Zod for validation and type-safe form handling
- **Build Tool**: Vite for fast development and optimized production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js framework for RESTful API development
- **Language**: TypeScript throughout for type consistency across the stack
- **Authentication**: Replit OIDC integration with Passport.js for secure user authentication
- **Session Management**: Express sessions with PostgreSQL storage using connect-pg-simple
- **API Design**: RESTful endpoints organized by feature domains (activities, inventory, employees, finances, health)

### Database Layer
- **Database**: PostgreSQL with Neon serverless for scalable cloud hosting
- **ORM**: Drizzle ORM for type-safe database interactions and schema management
- **Schema**: Comprehensive relational design covering users, daily activities, inventory, employees, financial transactions, health records, and production data
- **Migrations**: Drizzle Kit for database schema versioning and deployment

### Authentication & Authorization
- **Provider**: Replit OIDC for seamless integration with Replit's authentication system
- **Session Storage**: PostgreSQL-backed sessions for scalability and persistence
- **Role-Based Access**: User roles (supervisor, general_manager, ceo, admin) with different permission levels
- **Security**: HTTP-only cookies, CSRF protection, and secure session configuration

### Development & Deployment
- **Development**: Hot module replacement with Vite, TypeScript checking, and development error overlays
- **Production**: Optimized builds with ESBuild for server-side code and Vite for client-side assets
- **Environment**: Replit-optimized with cartographer plugin for enhanced development experience

## External Dependencies

### Core Infrastructure
- **Database**: Neon PostgreSQL serverless database for data persistence
- **Authentication**: Replit OIDC service for user authentication and authorization
- **Hosting**: Replit platform for application deployment and hosting

### Third-Party Services
- **UI Components**: Radix UI for accessible, unstyled component primitives
- **Icons**: Lucide React for consistent iconography throughout the application
- **Date Handling**: date-fns library for date manipulation and formatting
- **Validation**: Zod for runtime type validation and schema definition

### Development Tools
- **Build System**: Vite for frontend build tooling and development server
- **Code Quality**: TypeScript for static type checking and enhanced developer experience
- **Styling**: Tailwind CSS for utility-first styling approach
- **Database Tools**: Drizzle Kit for database schema management and migrations