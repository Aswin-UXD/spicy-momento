# Spicy Momento

A React + Express + MongoDB food truck storefront.

## Live deployment setup

This repository is structured for:
- Frontend: GitHub Pages
- Backend: Render web service

### Required GitHub secrets

Add these repository secrets in GitHub:
- `VITE_API_URL` = `https://<your-render-app-name>.onrender.com/api`
- `RENDER_DEPLOY_HOOK_URL` = your Render deploy hook URL

### Frontend

The frontend is built with Vite and deployed to GitHub Pages using the GitHub Actions workflow in `.github/workflows/deploy-pages.yml`.

### Backend

The backend is in `server/` and is configured for Render via `render.yaml`.

## Local development

1. Create env files from the examples:
   - root `.env.example` for the frontend
   - `server/.env.example` for the API
2. Install dependencies:
   - `npm install`
   - `cd server && npm install`
3. Start the backend:
   - `cd server && npm start`
4. Start the frontend:
   - `npm run dev`

## Production build

```bash
npm run build
```

## Notes

- Keep real secrets in environment variables only.
- Do not commit `.env` files or MongoDB runtime data (`server/data/`).

