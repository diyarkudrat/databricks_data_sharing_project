# Databricks Data Sharing Project

A learning project that demonstrates how to integrate Databricks with a modern web application using Next.js and TypeScript.

## What This Project Does

This application connects to a Databricks SQL warehouse and provides a simple interface to:

- Query data using SQL
- View table metadata and schemas
- Display query results in a clean, formatted table
- Handle real-time query execution and status polling

## Purpose

This is a hands-on learning project designed to understand:

- Databricks authentication and SDK integration
- SQL warehouse connectivity
- Building full-stack data applications
- Handling async query patterns in web applications

## Tech Stack

- **Next.js 14+** - React framework with App Router
- **TypeScript** - Type-safe development
- **Databricks SQL SDK** - Official SDK for Node.js
- **Tailwind CSS** - Modern styling

## Project Structure

- `webapp/` - Next.js application with TypeScript, Tailwind CSS, and Databricks integration
- `docs/` - Setup guides and documentation

## Getting Started

1. **Setup Databricks**: Follow the guide in [`docs/DATABRICKS_SETUP.md`](docs/DATABRICKS_SETUP.md)
2. **Configure Environment**: Copy `webapp/.env.example` to `webapp/.env.local` and fill in your Databricks credentials
3. **Install Dependencies**: 
   ```bash
   cd webapp
   npm install
   ```
4. **Run Development Server**: 
   ```bash
   npm run dev
   ```
   Visit [http://localhost:3000](http://localhost:3000) to see the application

## Documentation

- [Databricks Setup Guide](docs/DATABRICKS_SETUP.md) - Complete workspace and warehouse setup
- [Environment Variables](docs/ENVIRONMENT_VARIABLES.md) - Configuration reference
- [MVP Implementation Plan](docs/databricks-mvp-setup-plan.md) - Detailed project roadmap

## Project Status

🚧 **In Development** - This is an active learning project

---

*Built as a demonstration of Databricks integration patterns and modern web development practices.*

