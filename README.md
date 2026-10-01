# 🧠 BrainBuzz — Academic Quiz & Learning Platform

**BrainBuzz** is a mobile-first academic quiz and learning platform designed to help students test their knowledge, practise course-related questions, track their academic progress, and engage with other learners.

Originally started during my **100-Day Coding Challenge**, BrainBuzz has evolved from a basic mobile quiz application into a more comprehensive project focused on mobile development, backend engineering, authentication, academic data management, and interactive learning experiences.

The project reflects my journey from translating UI designs into functional screens to building and improving the systems that power a complete mobile application.

---

## 📌 Table of Contents

- [Project Overview](#-project-overview)
- [The Journey: 100-Day Coding Challenge](#-the-journey-100-day-coding-challenge)
- [Core Features](#-core-features)
- [Mobile Application](#-mobile-application)
- [Backend & Architecture](#-backend--architecture)
- [Technology Stack](#️-technology-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Environment Configuration](#-environment-configuration)
- [Development Approach](#-development-approach)
- [Current Development Focus](#-current-development-focus)
- [Roadmap](#-roadmap)
- [Contributing](#-contributing)
- [License](#-license)
- [Developer](#-developer)

---

## 🚀 Project Overview

BrainBuzz aims to make academic practice more accessible, interactive, and engaging by providing students with a structured environment for practising questions related to their courses and academic programmes.

Rather than being limited to a simple quiz interface, the project brings together several parts of application development, including:

- Cross-platform mobile development.
- User authentication and session management.
- Academic curriculum and course organization.
- Computer-Based Test (CBT) and theory quiz experiences.
- Quiz preparation, answering, review, and submission workflows.
- Academic performance and progress tracking.
- Leaderboards and achievements.
- Notifications and messaging.
- Faculty, department, and academic-level communities.
- Backend APIs and persistent data management.

The goal is to develop a reliable, maintainable, and scalable learning platform that can grow with students' academic needs.

## 🎯 The Journey: 100-Day Coding Challenge

BrainBuzz began as part of my **100-Day Coding Challenge**, where I committed to improving my programming skills through consistent practice and practical project development.

What started as an opportunity to learn React Native, implement designs, and build interactive quiz screens gradually became a larger engineering project.

Throughout this journey, I have worked on:

- Transforming UI designs into functional mobile screens.
- Building reusable components and improving navigation.
- Implementing authentication and session persistence.
- Connecting the mobile application to backend APIs.
- Managing application state and server-side data.
- Handling loading states, errors, and authentication failures.
- Developing quiz initialization, answer selection, review, and submission flows.
- Organizing academic data around faculties, departments, programmes, courses, levels, and semesters.
- Improving the communication between the mobile application and backend services.
- Refining the application architecture as its requirements grow.

The challenge represents more than the number of days spent coding. It represents the transition from learning individual technologies to applying them together to build a meaningful product.

**BrainBuzz remains connected to that original journey**, even as development continues beyond the challenge.

## ✨ Core Features

### 📚 Academic Course Organization

BrainBuzz is being developed around an academic structure that allows students to navigate learning materials according to their academic information.

- Faculty and college organization.
- Department and programme organization.
- Course catalogues and course relationships.
- Academic levels and semesters.
- Course recommendations based on selected academic information.
- Support for different academic structures where course arrangements vary.

### 📝 Interactive Quiz System

The quiz experience is designed to support different question formats and a structured assessment workflow.

- Multiple-choice Computer-Based Tests (CBT).
- Theory-based questions and written responses.
- Question selection and answer management.
- Quiz preparation and initialization.
- Answer review before final submission.
- Quiz submission and result processing.
- Handling of unavailable courses and questions.
- Protection against inconsistent quiz session states.

### 👤 Authentication & User Profiles

The application includes an authentication and session-management workflow intended to provide users with a consistent experience across sessions.

- Account registration and sign-in.
- Email verification and OTP workflows.
- Password recovery.
- Access-token and refresh-token management.
- Persistent authentication sessions.
- Profile management and academic information.
- Secure session cleanup during logout.

### 📊 Learning Progress & Engagement

BrainBuzz is designed to make learning progress easier to follow through features such as:

- Quiz history.
- Academic performance information.
- Leaderboards with different time filters.
- Achievements.
- Recommended courses.
- Notifications.

### 💬 Communication & Student Communities

The application also incorporates communication features intended to support interaction among learners.

- Messaging and conversations.
- Faculty-level discussions.
- Department-level discussions.
- Academic-level discussions.
- Support conversations.
- Real-time communication capabilities.

### 🎨 User Experience

The mobile interface continues to evolve alongside the underlying application architecture.

- Reusable React Native components.
- Organized navigation and screen flows.
- Loading, empty, and error states.
- Responsive layouts for different device sizes.
- Profile and settings management.
- Persistent user preferences.
- Improved handling of long faculty, department, and course names.

_Feature availability may vary as individual parts of the application continue to be developed and tested._

---

## 📱 Mobile Application

The mobile application is built with React Native and Expo, providing a cross-platform development workflow with Android as an important testing target.

The application is organized to separate screens, navigation, application state, API communication, and reusable UI components.

### State Management Strategy

BrainBuzz uses Zustand for client-side state management and TanStack Query for managing server data.

The intended separation of responsibilities is:

| Technology     | Responsibility                                                       |
| -------------- | -------------------------------------------------------------------- |
| Zustand        | Authentication session and temporary client-side state               |
| TanStack Query | Server data fetching, caching, synchronization, and refetching       |
| MMKV           | Persistent storage for authentication tokens and selected local data |
| React Native   | Cross-platform mobile interface                                      |
| Expo           | Mobile development and tooling                                       |

This separation helps reduce duplicated state, improve consistency, and make the application easier to maintain as additional features are introduced.

## ⚙️ Backend & Architecture

BrainBuzz includes a backend service that supports the mobile application through API endpoints and persistent data management.

The backend is responsible for handling application operations that should not depend exclusively on client-side logic.

### Backend Responsibilities

- User authentication and account management.
- Academic information retrieval.
- Faculty, department, programme, and course relationships.
- Quiz question retrieval.
- Quiz-related data processing.
- Profile and learning data.
- Notifications and messaging.
- Support operations.
- Authorization and protected API access.

### API Integration

The mobile application communicates with the backend through a configurable API base URL.

The client-side API layer is designed to centralize request handling, authentication headers, error processing, and token refresh behaviour.

### Data Integrity

Academic information is organized around reusable course records and their relationships to academic programmes, levels, and semesters.

This structure supports shared courses across different programmes while keeping course identity separate from the academic contexts in which a course is offered.

Existing quiz data and historical records should be preserved when curriculum structures or backend functionality are updated.

### Application Architecture Principles

BrainBuzz is being developed with an emphasis on:

- Separation of concerns.
- Reusable application components.
- Consistent API communication.
- Clear ownership of client and server state.
- Secure authentication and authorization.
- Maintainable database relationships.
- Reliable quiz-session handling.
- Incremental improvements without unnecessary redesigns.

---

## 🛠️ Technology Stack

The technologies used across the project include the following.

### Mobile Development

- **React Native** — Cross-platform mobile application development.
- **Expo** — Mobile development tooling and application workflows.
- **JavaScript** — Application logic.
- **Zustand** — Client-side state management.
- **TanStack Query** — Server-state management and caching.
- **MMKV** — Persistent local storage.
- **React Native StyleSheet** — Component styling.

### Backend Development

- **Node.js** — JavaScript runtime.
- **REST APIs** — Communication between the mobile application and backend.
- **Authentication tokens** — Session management and protected requests.
- **Socket.IO** — Real-time communication capabilities.
- **PostgreSQL / Drizzle ORM** — Relational data management, where configured in the current backend.

### Development Tools

- **Git & GitHub** — Version control and source-code collaboration.
- **Android Studio** — Android development and debugging tools.
- **Expo Go** — Testing supported application functionality on physical devices.
- **Figma** — UI/UX design reference and implementation.
- **Visual Studio Code and AI-assisted development tools** — Coding, debugging, and iterative improvements.

_The stack above describes the technologies used or incorporated across the project; individual dependencies and their exact versions are defined in the relevant project configuration files._

---

## 📂 Project Structure

The repository contains the mobile application and backend components. The exact directory organization may evolve as development continues.

A simplified conceptual overview is:

```text
BrainBuzz/
├── app/                     # Mobile application
│   ├── app/                 # Screens and navigation
│   ├── components/          # Reusable UI components
│   ├── data/                # API client and data access
│   ├── store/               # Client-side state management
│   └── ...
│
├── backend/                 # Backend service, if maintained
│   ├── src/
│   │   ├── routes/          # API routes
│   │   ├── controllers/     # Request handling
│   │   ├── services/        # Application logic
│   │   ├── seed/            # Academic data seeding
│   │   └── ...
│   └── ...
│
├── README.md
└── ...
```

This diagram is illustrative. Refer to the actual repository directories and package manifests for the current source-code organization.

---

## 📦 Getting Started

### Prerequisites

Before setting up BrainBuzz, ensure you have:

- [Node.js](https://nodejs.org/) installed.
- npm installed.
- Git installed.
- [Expo Go](https://expo.dev/go) or an appropriate Android development environment.
- Access to the configured backend and any required database services.

### 1. Clone the Repository

```bash
git clone https://github.com/Abdullatee102/brain-buzz.git
cd brain-buzz
```

If the mobile application and backend are maintained in separate directories or repositories, navigate to the relevant project directory before installing dependencies.

### 2. Install Dependencies

From the mobile application's root directory:

```bash
npm install
```

Install backend dependencies separately if the backend has its own `package.json`.

### 3. Configure Environment Variables

Create a local `.env` file using the variables required by the current application configuration.

For the mobile application, the backend URL is configured through:

```env
EXPO_PUBLIC_API_URL=http://YOUR_LOCAL_NETWORK_IP:5000/api
```

Replace `YOUR_LOCAL_NETWORK_IP` with the appropriate address for your development machine.

When testing on a physical Android device, use your computer's reachable local network IP address rather than `localhost`.

### 4. Start the Backend

Start the backend using the development command defined in its `package.json`.

For example, if the project defines a `dev` script:

```bash
npm run dev
```

Ensure the database is configured, migrations or setup steps have been completed, and the backend is reachable before launching the mobile application.

### 5. Start the Mobile Application

```bash
npx expo start
```

Follow the Expo CLI instructions to open the application in a supported development environment.

**Important:** Do not commit private credentials, access tokens, database passwords, or production environment files to version control.

---

## 🔐 Environment Configuration

BrainBuzz relies on environment-specific configuration for local development and backend communication.

Typical configuration may include:

| Variable                       | Purpose                                        |
| ------------------------------ | ---------------------------------------------- |
| `EXPO_PUBLIC_API_URL`          | Backend API base URL                           |
| Database environment variables | Backend database connection                    |
| Authentication secrets         | Backend token signing and verification         |
| Other service variables        | Additional integrations enabled by the backend |

The exact variable names depend on the current backend and mobile configuration. Refer to the environment examples and configuration files in the repository.

Variables prefixed with `EXPO_PUBLIC_` are exposed to the client application. They must never contain private keys, database credentials, or server-only secrets.

---

## 🧑‍💻 Development Approach

BrainBuzz is developed through an iterative process of implementation, testing, debugging, and refinement.

My approach focuses on improving the application as a connected system rather than treating each screen as an isolated feature.

The development process includes:

1. **Understanding requirements** — Reviewing the intended behaviour and existing implementation.
2. **Implementing features** — Building or refining the mobile and backend components.
3. **Testing real workflows** — Checking authentication, navigation, API communication, quiz interactions, and data handling.
4. **Investigating issues** — Tracing unexpected behaviour across the client and server where necessary.
5. **Improving architecture** — Reducing duplicated logic and establishing clearer boundaries between components.
6. **Validating changes** — Running relevant builds, tests, and manual checks before considering a change complete.

This process has helped me develop a better understanding of how mobile applications, backend services, authentication, data persistence, and real-time features work together.

---

## 🔭 Current Development Focus

BrainBuzz continues to evolve, with ongoing work focused on:

- Improving quiz initialization, review, and submission reliability.
- Refining the backend and mobile API integration.
- Maintaining consistent authentication and token-refresh behaviour.
- Improving profile functionality and academic information management.
- Strengthening curriculum organization and course relationships.
- Improving server-state caching and synchronization.
- Testing support, messaging, and real-time community features.
- Resolving edge cases and improving the overall user experience.
- Preserving existing quiz data while extending the platform.

Development priorities may change as testing reveals new issues or additional requirements.

## 🗺️ Roadmap

The following roadmap describes areas of continued development rather than guaranteeing release dates.

- [x] Establish the React Native and Expo application.
- [x] Build and refine core mobile screens.
- [x] Introduce application state management.
- [x] Integrate backend API communication.
- [x] Develop authentication and session-management workflows.
- [x] Expand the academic course and quiz structure.
- [ ] Continue strengthening CBT and theory quiz workflows.
- [ ] Refine learning progress, history, and achievement experiences.
- [ ] Improve messaging, notifications, and community interactions.
- [ ] Expand automated testing and regression coverage.
- [ ] Improve deployment readiness, documentation, and production reliability.

---

## 🤝 Contributing

Suggestions, bug reports, and contributions are welcome.

If you would like to contribute:

1. Fork the repository.
2. Create a feature branch.
3. Implement your changes.
4. Test the relevant functionality.
5. Submit a pull request describing the changes.

For bugs or feature requests, use the repository's issue tracker where available.

- **Repository:** [BrainBuzz on GitHub](https://github.com/Abdullatee102/brain-buzz)
- **Issues:** [Report an issue](https://github.com/Abdullatee102/brain-buzz/issues)

Please ensure that contributions respect existing application architecture and avoid unnecessary changes to unrelated components.

---

## 📄 License

This project is intended to be distributed under the MIT License, subject to the license file included in the repository.

See the `LICENSE` file for the applicable terms.

---

## 👨‍💻 Developer

**Popoola Abdullateef (Opeyemi)**

Computer Science undergraduate at LAUTECH, focused on mobile and backend development.

I enjoy building practical software, learning through real projects, solving engineering problems, and improving my ability to turn ideas into functional applications.

BrainBuzz is one of the projects through which I continue to develop these skills, beginning with my 100-Day Coding Challenge and progressing through ongoing development and refinement.

- **GitHub:** [@Abdullatee102](https://github.com/Abdullatee102)

---

⭐ If you find BrainBuzz interesting, consider starring the repository to follow its development.

**Built with curiosity, consistency, and a commitment to continuous improvement.**
