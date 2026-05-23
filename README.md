# UniMinglee 💫

UniMinglee is a university-focused social platform designed specifically for introverted, ambivert, and neurodivergent college students. It helps students discover events, join themed campus communities, and connect through quiet, high-compatibility matching and comfortable direct messages. 

---

## 🌟 Key Features

*   **Personality-Tailored Dashboard**: Visual campus stats, personalized classmate matching cards, trending communities, and upcoming event tickers.
*   **Student Matching (Compatibility Engine)**: Computes a compatibility match percentage based on shared interests, department alignment, and personality types.
*   **Themed Communities**: Simple join/leave mechanisms for interest-based groups (coding, music, gaming, literature, anime, etc.).
*   **Campus Events Finder**: Category tags, bookmarks, attendee counts, and organizer uploads.
*   **Zero-Latency Comfortable Direct Messaging**: Mobile-responsive messaging layouts with built-in instant emoji drawers, auto-polling background syncer, and query parameter user routing.
*   **Student Profile Customization**: Multi-tag interests and skills editor, personality card toggle selectors, and Multer-powered avatar uploads.

---

## 🛠️ Tech Stack

*   **Frontend**: Plain HTML5, Vanilla CSS3 (custom CSS variables, flex, grid layouts, glassmorphic card overlays, responsive screen adapters), and Vanilla JavaScript.
*   **Backend**: Node.js & Express.js.
*   **Database**: MongoDB & Mongoose.
*   **Authentication**: JSON Web Tokens (JWT) & Bcrypt password hashing.
*   **Media Handling**: Multer for local profile image file storage.

---

## 📂 Project Structure

```
UniMinglee/
├── frontend/             # Desktop/Mobile Frontend client files
│   ├── css/              # Modular vanilla stylesheets
│   │   ├── global.css
│   │   ├── components.css
│   │   ├── chat.css
│   │   └── ...
│   ├── js/               # Frontend logic utilities
│   │   ├── api.js        # Dynamic fetch requests wrapper & bearer injector
│   │   ├── utils.js      # Time formatting & dynamic avatar helpers
│   │   ├── chat.js       # Conversation loop & message renderer
│   │   └── ...
│   ├── index.html        # Landing marketing page
│   ├── login.html
│   ├── signup.html
│   ├── dashboard.html
│   ├── communities.html
│   ├── events.html
│   ├── matching.html
│   └── chat.html
│
├── backend/              # Node.js/Express Server
│   ├── config/db.js      # MongoDB connector
│   ├── controllers/      # Route controllers (Auth, User, Message, Match, etc.)
│   ├── middleware/       # Auth guard & Multer config
│   ├── models/           # Mongoose schemas (User, Message, Community, etc.)
│   ├── routes/           # API routes
│   └── seed.js           # Sample database seeder
│
├── .env.example          # Environment defaults
├── package.json          # Root scripts and packages
└── README.md             # Guide documentation
```

---

## 🚀 Setup & Execution

Follow these step-by-step commands to get UniMinglee up and running locally.

### Prerequisites

*   [Node.js](https://nodejs.org/) installed (v16+ recommended).
*   [MongoDB Community Server](https://www.mongodb.com/try/download/community) running locally on port `27017` (e.g., `mongodb://127.0.0.1:27017/uniminglee`).

### 1. Install Dependencies

In the root of the project directory, run:
```bash
npm install
```

### 2. Configure Environment Variables

Create a copy of `.env.example` named `.env` and adjust the variables as needed:
```bash
cp .env.example .env
```
*Defaults configuration:*
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/uniminglee
JWT_SECRET=your_jwt_secret_here_change_in_production
```

### 3. Seed Sample Database

Populate your database with Indian university students, preset communities, events, and mock chat messages:
```bash
npm run seed
```

### 4. Run Development Server

Start the application:
```bash
npm run dev
```
Or for production:
```bash
npm start
```

Open your browser and navigate to: **[http://localhost:5000](http://localhost:5000)**

---

## 📡 API Routing Overview

### Auth
*   `POST /api/auth/register` - Registers a new user.
*   `POST /api/auth/login` - Authenticates credentials and returns user token.
*   `GET /api/auth/me` - Resolves the current session user details.

### Users
*   `GET /api/users` - Fetches campus student database (supports search filters).
*   `GET /api/users/:id` - Retrieves detailed student card profile.
*   `PUT /api/users/me` - Updates bio, interests, skills, department, and personality.
*   `POST /api/users/me/avatar` - Uploads profile avatar photo.
*   `DELETE /api/users/me` - Completely wipes user and their associations.

### Communities
*   `GET /api/communities` - Lists all campus interest groups.
*   `POST /api/communities` - Registers a user-created group.
*   `POST /api/communities/:id/join` - Joins a group.
*   `POST /api/communities/:id/leave` - Leaves a group.

### Events
*   `GET /api/events` - Queries campus schedule events.
*   `POST /api/events` - Posts a new campus event.
*   `POST /api/events/:id/register` - Registers the user for the event.
*   `POST /api/events/:id/save` - Bookmarks/saves event on the user's dashboard.

### Match Suggestions & Compatibility
*   `GET /api/matches/suggestions` - Recommends users based on personality and interests score.
*   `GET /api/matches` - Returns all accepted connected classmates.
*   `POST /api/matches/:userId/request` - Submits a connect request.
*   `PUT /api/matches/:matchId` - Accepts or rejects a pending match invitation.

### Direct Messaging
*   `GET /api/messages/conversations/list` - Fetches active DM listing, preview, and unread counts.
*   `GET /api/messages/:userId` - Retrieves full message thread history.
*   `POST /api/messages` - Sends a direct message.
