# Database Agent Instructions for Blog Module

## Current Status: WAITING FOR BACKEND AGENT

The Database Agent is ready to generate and run migrations for the Blog Module, but first requires the Backend Agent to create the data models.

## What's Been Done

1. Created coordination structure at `/Users/Karim/med-usa-4wd/swarm/blog-module/`
2. Documented requirements for Backend Agent
3. Set up migration tracking directory
4. Verified Medusa CLI is available

## What's Needed from Backend Agent

The Backend Agent must create the Blog module structure with data models at:
`/Users/Karim/med-usa-4wd/src/modules/blog/`

Required files:
- `models/blog-post.ts` - Main blog post model
- `models/blog-category.ts` - Category/taxonomy model
- `models/blog-tag.ts` - Tagging model
- `index.ts` - Module exports and configuration
- `service.ts` - Business logic layer (optional but recommended)

## Once Backend Agent Completes

The Database Agent will automatically proceed with:

1. **Generate Migrations**
   ```bash
   npx medusa db:generate blog
   ```

2. **Review Generated Migrations**
   - Check migration files in `src/modules/blog/migrations/`
   - Verify table structures match data models
   - Ensure relationships are properly defined

3. **Run Migrations**
   ```bash
   npx medusa db:migrate
   ```

4. **Verify Database**
   - Connect to PostgreSQL: `postgres://localhost/medusa-4wd-tours`
   - Verify tables created:
     - `blog_post`
     - `blog_category`
     - `blog_tag`
     - Junction tables for relationships

5. **Document Results**
   - Store migration output in `swarm/blog-module/migrations/`
   - Update status files
   - Report completion

## Coordination Protocol

**For Backend Agent**: When data models are ready, update:
- `/Users/Karim/med-usa-4wd/swarm/blog-module/backend-implementation/ready.md`
- Or update `/Users/Karim/med-usa-4wd/swarm/blog-module/backend-implementation/status.md`

**For Database Agent**: Monitor for:
- Existence of `/Users/Karim/med-usa-4wd/src/modules/blog/` directory
- Files in the blog module directory
- Status updates in coordination memory

## Database Configuration

- **Type**: PostgreSQL
- **Connection**: postgres://localhost/medusa-4wd-tours
- **Medusa Version**: 2.11.3
- **Migration Tool**: Medusa CLI (`@medusajs/cli@2.11.3`)

## Important Notes

1. Follow Medusa migration patterns EXACTLY
2. Never manually create database tables
3. Always use Medusa CLI for migrations
4. Verify migrations before running in production
5. Keep migration files in version control

## Status: STANDBY

Database Agent is monitoring and ready to proceed immediately when Backend Agent signals completion.
