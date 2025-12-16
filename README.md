# CA Portal - SmartApp

A comprehensive CA (Chartered Accountant) Portal application for managing clients, documents, tasks, and compliance.

## Features

- 🔐 User Authentication & Authorization
- 👥 Client Management
- 📄 Document Management with versioning
- ✅ Compliance Task Management
- 📅 Calendar Integration
- 💬 Real-time Chat
- 👨‍💼 Team Management with granular permissions
- 📊 Dashboard with analytics

## Tech Stack

### Frontend
- React 18
- TypeScript
- Vite
- React Router
- CSS Modules

### Backend
- Node.js
- Express
- TypeScript
- Prisma ORM
- PostgreSQL
- JWT Authentication

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL database
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/SmartApp.git
cd SmartApp
```

2. Install backend dependencies
```bash
cd backend
npm install
```

3. Set up environment variables
```bash
cp .env.example .env
# Edit .env with your database URL and JWT secret
```

4. Run database migrations
```bash
npx prisma migrate dev
npx prisma generate
```

5. Install frontend dependencies
```bash
cd ../frontend
npm install
```

6. Start development servers

Backend:
```bash
cd backend
npm run dev
```

Frontend (in a new terminal):
```bash
cd frontend
npm run dev
```

The app will be available at:
- Frontend: http://localhost:5173
- Backend: http://localhost:4000

## Deployment

### GitHub Pages Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

Quick steps:
1. Push code to GitHub
2. Enable GitHub Pages in repository settings
3. Set source to "GitHub Actions"
4. Configure backend API URL (see DEPLOYMENT.md)
5. Push to main branch to trigger deployment

### Backend Deployment

The backend needs to be deployed separately. Options:
- Heroku
- Railway
- Render
- Vercel (with serverless functions)
- Your own server

See [DEPLOYMENT.md](./DEPLOYMENT.md) for backend deployment options.

## Project Structure

```
SmartApp/
├── backend/           # Express API server
│   ├── src/
│   │   ├── modules/  # Feature modules (auth, clients, documents, etc.)
│   │   ├── middleware/
│   │   └── app.ts
│   └── prisma/       # Database schema and migrations
├── frontend/         # React application
│   ├── src/
│   │   ├── api/      # API client
│   │   ├── components/
│   │   ├── pages/
│   │   └── context/
│   └── public/
└── .github/          # GitHub Actions workflows
```

## Environment Variables

### Backend (.env)
```
DATABASE_URL="postgresql://user:password@localhost:5432/ca_portal"
JWT_SECRET="your-secret-key"
PORT=4000
UPLOAD_DIR="./uploads"
```

### Frontend (.env)
```
VITE_BASE_PATH=/          # For GitHub Pages: /repository-name/
VITE_API_URL=             # Backend API URL (optional, defaults to /api)
```

## Scripts

### Backend
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npx prisma migrate dev` - Run database migrations
- `npx prisma studio` - Open Prisma Studio

### Frontend
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run deploy` - Build and prepare for deployment

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License

## Support

For issues and questions, please open an issue on GitHub.

