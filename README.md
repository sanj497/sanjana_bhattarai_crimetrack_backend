# Crime Track

Crime Track is a comprehensive web-based platform designed to facilitate secure and efficient crime reporting, tracking, and management. It connects citizens directly with law enforcement agencies and administrators to ensure real-time emergency responses, effective complaint resolution, and data-driven insights through crime mapping.

## 🚀 Features

### For Citizens:
- **Crime Reporting:** Submit detailed crime reports with evidence (images/videos).
- **Interactive Crime Map:** View crime incidents visually on an interactive map using Leaflet.
- **Admin Alerts Hub:** Dedicated interface to receive and monitor verified safety broadcasts sent by the administration.
- **SOS & Emergency Contacts:** Quickly access emergency contacts and trigger SOS alerts in critical situations.
- **Complaints & Feedback:** Submit complaints regarding ongoing issues or provide feedback on police actions.

### For Police:
- **Police Dashboard:** Review, update, and manage assigned crime reports.
- **Real-time Notifications:** Receive instant updates and SOS alerts using WebSocket connections.
- **Automated Task Routing:** Receive email-based notifications dynamically upon case assignments.
- **Task Verification:** Tools to verify the legitimacy and status of submitted reports.

### For Admin:
- **System Oversight:** Monitor the entire system, manage users (Citizens, Police), and handle administrative tasks.
- **User Directory:** Professional, high-density secure data table to universally manage and remove users.
- **Safety Broadcasts:** Publish targeted, official "Admin Alerts" securely to citizen dashboards.
- **Feedback Management:** Review user feedback and complaints to improve the system's efficiency.
- **Data Analytics:** Access to detailed reports and map insights.

### Core Security Enhancements:
- **Strict Cross-Tab Auth Synchronization:** Active browser session tracking via reactive `storage` events guarantees instant cross-tab access synchronization and blocks concurrent multi-tab spoofing.
- **Vercel-Optimized CORS:** Robust firewall allowing dynamically generated preview deployments while rejecting unfamiliar origins.

## 🛠️ Technology Stack

### Frontend
- **React.js (Vite)**: High-performance frontend framework.
- **Tailwind CSS**: Utility-first CSS framework for responsive styling.
- **React Router DOM**: Client-side routing for seamless navigation.
- **Leaflet**: Interactive map rendering.
- **Axios**: HTTP client for API interactions.
- **Lucide React**: Icon library.

### Backend
- **Node.js & Express.js**: RESTful API creation and server configuration.
- **MongoDB & Mongoose**: NoSQL database for flexible data modeling (Users, Crimes, Reports, SOS).
- **Socket.io**: Real-time bidirectional event-based communication for notifications and SOS features.
- **Cloudinary**: Cloud storage management for media and evidence uploads.
- **Firebase Admin**: Push notifications and additional cloud services.
- **JSON Web Tokens (JWT)**: Secure user authentication and role-based access control.

## 📂 Project Structure

```text
Crime Track Backend/
├── src/                     # Server-side source code
│   ├── config/              # Database and environmental configurations
│   ├── Controllers/         # API business logic
│   ├── middleware/          # Authentication and validation middlewares
│   ├── Models/              # Mongoose database schemas
│   │   ├── Complaint.js
│   │   ├── Crime.js
│   │   ├── CrimeInteraction.js
│   │   ├── Crimereport.js
│   │   ├── Emergencycontact.js
│   │   ├── Feedback.js
│   │   ├── Notification.js
│   │   ├── sosalert.js
│   │   └── usermodel.js
│   ├── Route/               # API endpoint routing
│   ├── utils/               # Helper utilities (email, cloudinary)
│   ├── .env                 # Environment variables (DO NOT COMMIT)
│   ├── socket.js            # Socket.io configuration
│   ├── test-email.js        # Email configuration test script
│   └── vercel.json          # Vercel deployment configuration
│
├── server.js                # Express application entry point
├── package.json             # Project dependencies and scripts
├── render.yaml              # Render deployment configuration
└── README.md                # Project documentation
```
    └── vite.config.js       # Vite configuration
```

## ⚙️ Installation & Setup

1. **Clone the repository** (if applicable) and navigate to the project directory.

2. **Backend Setup**
   ```bash
   cd Backend
   npm install
   ```
   - Create a `.env` file inside the `Backend` directory and define required environment variables (e.g., `PORT`, `MONGO_URI`, `JWT_SECRET`, Cloudinary credentials, etc.).
   - Start the backend server:
     ```bash
     npm run dev
     ```

3. **Frontend Setup**
   ```bash
   cd ../Frontend
   npm install
   ```
   - Make sure to configure the API base URL in your frontend to point to the backend server (typically `http://localhost:5000`).
   - Start the development server:
     ```bash
     npm run dev
     ```

## 🛡️ Security & Performance
- Rate limiting implemented via `express-rate-limit` to prevent brute-force and DDoS attacks.
- Passwords fully encrypted hashing using `bcryptjs`.
- Restricted routes protected by JWT middleware ensuring only authorized roles can access endpoints.
