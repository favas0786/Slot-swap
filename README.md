# SlotSwapper - P2P Time Slot Swapping Application

**Live Demo:**
* **Frontend (Vercel):** `https://your-live-frontend-url.vercel.app`
* **Backend (Render):** `https://your-live-backend-api-url.onrender.com`

---

## 🚀 Project Overview

SlotSwapper is a full-stack peer-to-peer scheduling application. The platform allows users to manage their calendar events, mark them as "swappable," and request to swap slots with other users.

This project is built on the **MERN stack** (MongoDB, Express, React, Node.js) and includes advanced features such as real-time notifications via WebSockets, unit testing for critical API logic, and a professional, responsive UI built with **Material-UI (MUI)**.



## ✨ Core Features

* **Authentication:** Secure user Sign Up and Log In using JWT (JSON Web Tokens).
* **Event Management (CRUD):** Users can create, view, update, and delete their own calendar events.
* **Swappable Marketplace:** Users can mark their events as `SWAPPABLE`, which lists them on a public marketplace.
* **Transactional Swap Logic:**
    * Users can request to swap one of their `SWAPPABLE` slots for another user's.
    * Both slots are locked with a `SWAP_PENDING` status.
    * The receiving user can **Accept** or **Reject** the swap.
    * **Accept:** The `owner` field of both events is atomically swapped using Mongoose Transactions.
    * **Reject:** Both slots are set back to `SWAPPABLE`.

### 🌟 Bonus Features Implemented

* **🎨 Professional UI/UX:** The entire frontend is built with **Material-UI (MUI)** for a clean, responsive, and modern user experience.
* **⚡ Real-Time Notifications:** Implemented **Socket.io** to provide instant feedback. Users are notified in real-time when they receive a new swap request or when their request is accepted/rejected.
* **🧪 Backend Unit Testing:** Critical API logic (the swap-response endpoint) is tested using **Jest** and **Supertest** to ensure reliability.
* **🐳 Containerization:** The backend includes a `Dockerfile` for easy containerization and deployment.

---

## 🛠 Tech Stack

### Frontend
* **React (Vite)**
* **Material-UI (MUI):** For UI components and styling.
* **React Router:** For page navigation.
* **Axios:** For API requests.
* **Socket.io-client:** For real-time WebSocket communication.

### Backend
* **Node.js**
* **Express:** For the REST API.
* **MongoDB:** As the database.
* **Mongoose:** For data modeling and transactions.
* **Socket.io:** For the WebSocket server.
* **JSON Web Tokens (JWT):** For secure authentication.
* **bcryptjs:** For password hashing.
* **Jest & Supertest:** For API testing.

### Deployment & DevOps
* **Vercel:** Frontend hosting.
* **Render:** Backend service and MongoDB (Free DB) hosting.
* **Docker:** For containerization.

---

## 🔌 API Endpoints

| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/signup` | Register a new user | Public |
| `POST` | `/api/auth/login` | Log in a user and get a JWT | Public |
| `POST` | `/api/events` | Create a new event | Private |
| `GET` | `/api/events/my-events` | Get all events for the logged-in user | Private |
| `PUT` | `/api/events/:id` | Update an event (e.g., set to `SWAPPABLE`) | Private |
| `DELETE` | `/api/events/:id` | Delete an event | Private |
| `GET` | `/api/swap/swappable-slots` | Get all slots from *other* users | Private |
| `GET` | `/api/swap/my-requests` | Get all incoming/outgoing requests | Private |
| `POST` | `/api/swap/swap-request` | Initiate a new swap request | Private |
| `POST` | `/api/swap/swap-response/:id` | Accept or reject an incoming swap | Private |

---

## Local Setup & Installation

### Prerequisites
* Node.js (v18+)
* A `MongoDB` connection string (e.g., from a free MongoDB Atlas account)

### 1. Backend Setup (`slotswapper-backend`)

1.  Clone the repository:
    ```sh
    git clone [https://github.com/favas0786/Slot-swap.git](https://github.com/favas0786/Slot-swap.git)
    cd Slot-swap/slotswapper-backend
    ```
2.  Install dependencies:
    ```sh
    npm install
    ```
3.  Create a `.env` file in the root and add your variables:
    ```env
    PORT=5000
    MONGO_URI=your_mongodb_connection_string
    JWT_SECRET=your_super_secret_key
    ```
4.  Run the server:
    ```sh
    npm run dev
    ```
    The server will be running on `http://localhost:5000`.

### 2. Frontend Setup (`slotswapper-frontend`)

1.  In a **new terminal**, navigate to the frontend folder:
    ```sh
    cd Slot-swap/slotswapper-frontend
    ```
2.  Install dependencies:
    ```sh
    npm install
    ```
3.  (Important) Ensure your `src/context/AuthContext.jsx` file is pointing to the local backend:
    `const API_URL = "http://localhost:5000";`
4.  Run the client:
    ```sh
    npm run dev
    ```
    The app will be running on `http://localhost:5173`.
