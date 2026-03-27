Real-Time Chat App
A full-stack chat application built with Node.js, Express, EJS, and MySQL. Users can register, log in securely, and exchange messages in real time via automatic polling.
Live Demo: chat-app-2cbq.onrender.com
Repo: github.com/AoceanP/chat-app

Features

User Authentication — Register and log in with securely hashed passwords using bcrypt
Password Validation — Enforced via regex: minimum 10 characters with at least one special character
Session Management — Persistent login sessions using express-session with MongoDB session store
Real-Time Messaging — Chat page polls for new messages every 3 seconds using setInterval + fetch
Server-Side Rendering — Dynamic pages rendered with EJS templating
Protected Routes — Middleware guards authenticated-only pages


Tech Stack
LayerTechnologyRuntimeNode.jsFrameworkExpress.jsTemplatingEJSDatabaseMySQL (mysql2)Session StoreMongoDB (connect-mongo)Authbcrypt, express-sessionDeploymentRender

Project Structure
chat-app/
├── public/          # Static assets (CSS, client-side JS)
├── routes/          # Express route handlers
├── views/           # EJS templates
├── app.js           # App entry point
├── db.js            # Database connection
├── middleware.js    # Auth middleware
├── schema.sql       # MySQL schema
└── package.json

Getting Started
Prerequisites

Node.js v18+
MySQL
MongoDB (for session store)


Password Requirements
Passwords must meet the following criteria:

Minimum 10 characters
At least 1 special character (e.g. !@#$%^&*)

Validated on registration using the regex pattern:
js/^(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{10,}$/

How Real-Time Messaging Works
The chat page uses a simple polling approach — no WebSockets required:
jssetInterval(() => {
  fetch('/messages')
    .then(res => res.json())
    .then(messages => renderMessages(messages));
}, 3000);
Every 3 seconds, the client fetches the latest messages from the server and updates the UI.

License
ISC
