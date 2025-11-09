# Claude Flow Configuration

This directory contains Claude Code configuration for the med-usa-4wd project.

## Project Structure

- `commands/` - Custom slash commands for Claude Code
- `hooks/` - Git hooks and automation scripts
- `config.json` - Claude Flow configuration

## Project Details

**Name:** med-usa-4wd
**Platform:** Medusa v2.11.3
**Description:** 4WD Tours e-commerce platform

## Development

The Medusa server runs on http://localhost:9000
Admin dashboard: http://localhost:9000/app

## Database

PostgreSQL database: `medusa-4wd-tours`

## Getting Started

```bash
# Install dependencies
yarn install

# Run database migrations
yarn medusa db:migrate

# Start development server
yarn dev
```

## Available Scripts

- `yarn build` - Build the project
- `yarn seed` - Seed the database
- `yarn start` - Start production server
- `yarn dev` - Start development server with hot reload
