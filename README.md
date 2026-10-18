# Opportunity Finder

A student-focused opportunity discovery and application-tracking platform built with React, Node.js, Express, and MongoDB. Opportunity Finder helps students find internships, jobs, scholarships, research programs, hackathons, competitions, fellowships, grants, and conferences that fit their goals.

---

## 1. Project Overview

Opportunity Finder brings opportunity search and application planning together in one place:

- **Opportunity Discovery:** Browse and search listings across academic and career categories.
- **Profile-Based Matching:** Compare a student's profile, skills, interests, and education with opportunity requirements using an explainable, rule-based match score.
- **Flexible Search:** Filter listings by category, keywords, education level, remote type, and distance from a selected location.
- **Save and Track:** Save opportunities and track application progress through statuses such as interested, applied, interview, accepted, and rejected.
- **Deadline Dashboard:** Review upcoming deadlines, saved listings, application activity, and recommended opportunities.
- **Opportunity Management:** Provide admin-facing pages and API routes for managing and reviewing listings.

---

## 2. Tech Stack

- **Frontend:** React 19, Vite, JavaScript, Tailwind CSS 4, React Router, Axios, Lucide React
- **Backend:** Node.js, Express 5, Mongoose, JavaScript ES modules
- **Database:** MongoDB (local instance or MongoDB Atlas)
- **Authentication:** JSON Web Tokens and bcryptjs
- **Profile Image Storage:** Supabase Storage
- **Maps and Location:** Leaflet and React Leaflet

The backend is organized into routes, middleware, controllers, models, configuration, and utility modules. Requests are handled through Express routes and controllers, with Mongoose models providing database access.

---

## 3. Prerequisites

- **Node.js:** A current LTS release
- **npm:** Installed with Node.js
- **MongoDB:** A local MongoDB instance or a MongoDB Atlas connection string
- **Supabase:** Optional for profile image uploads; configure a project and storage bucket if using this feature

Check your installed versions:

```bash
node -v
npm -v
```

---

## 4. Getting Started

### Backend Setup

1. Open a terminal in the backend directory:

   ```bash
   cd backend
   ```

2. Create a `.env` file in `backend/` and configure the environment variables:

   ```env
   PORT=4000
   NODE_ENV=development
   FRONTEND_URL=http://localhost:5173
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=replace_with_a_long_random_secret
   JWT_EXPIRES_IN=7d

   # Optional: needed for profile image uploads
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   SUPABASE_STORAGE_BUCKET=profile-pictures
   ```

   Keep secret values private. Do not commit `.env` or Supabase service-role credentials.

3. Install dependencies and seed the reference data:

   ```bash
   npm install
   npm run db:seed:reference
   ```

4. Optionally add demonstration users and sample opportunities:

   ```bash
   npm run db:seed:dev
   ```

   Use this demo-data script only with a development database.

5. Start the backend:

   ```bash
   npm run dev
   ```

The API starts on `http://localhost:4000` by default. Confirm it is running at `http://localhost:4000/api/health`.

### Frontend Setup

1. Open another terminal in the frontend directory:

   ```bash
   cd frontend
   ```

2. Install dependencies and start Vite:

   ```bash
   npm install
   npm run dev
   ```

The frontend runs at `http://localhost:5173`. During local development, Vite proxies `/api` requests to the backend at `http://localhost:4000`.

---

## 5. Useful Commands

### Backend

| Command | Description |
| --- | --- |
| `npm run dev` | Start the API with Node.js watch mode |
| `npm start` | Start the API |
| `npm run db:seed:reference` | Seed categories, fields of study, and skills |
| `npm run db:seed:dev` | Seed demonstration users and opportunities |

### Frontend

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite development server |
| `npm run build` | Build the production frontend |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint |

---

## 6. Project Structure

```text
backend/
  config/         Database and Supabase configuration
  controllers/    Request handlers
  database/       Seed scripts and reference data
  middleware/     Authentication and request middleware
  models/         Mongoose schemas and models
  routes/         API route definitions
  utils/          Matching, location, normalization, and error helpers
  server.js       Express application entry point

frontend/
  public/         Static assets
  src/
    components/   Shared interface components
    context/      Authentication and saved-opportunity state
    pages/        Application pages
    services/     API client
    App.jsx       Routes and application providers
```

---

## 7. Configuration Notes

- The backend requires `MONGODB_URI` (or `MONGODB_URL`) and `JWT_SECRET`.
- Set `FRONTEND_URL` to the deployed frontend origin when running outside local development. Multiple comma-separated origins are supported.
- Supabase configuration is only needed for profile image uploads. The configured storage bucket defaults to `profile-pictures`.
- Set `VITE_API_URL` in the frontend deployment environment to the backend base URL when the frontend and API are hosted separately. In local development, the Vite proxy is used.

---

## 8. License

No license has been specified for this project yet.
