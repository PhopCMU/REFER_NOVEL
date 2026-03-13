# GEMINI.md

## Project Overview
This is a veterinary referral management system built with React 19 and Vite.

## Tech Stack
- React 19
- Vite
- TypeScript
- Tailwind CSS 4
- Bun runtime
- Axios API client
- React Router DOM 7

## Code Guidelines

### Components
- Use functional components only
- Use TypeScript interfaces
- Keep components under 200 lines

### API
- Always use `apiWithAuth` for authenticated endpoints
- API logic should stay in `src/api`

### Types
- Shared types must go to:
src/types/type.ts

### Styling
- Use Tailwind CSS
- Avoid custom CSS

### Folder Rules

pages → route pages  
component → reusable UI  
utils → helper functions  

### Authentication
JWT tokens handled in:
src/utils/authUtils.ts

### Notifications
Use react-toastify