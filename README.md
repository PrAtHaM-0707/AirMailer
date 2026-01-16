# AirMailer 🚀

A modern, secure email service API built with Node.js, Express, PostgreSQL, and React. Send emails programmatically with a simple REST API.

## ✨ Features

- **JWT Authentication** - Secure user authentication with refresh tokens
- **Email Verification** - Account verification via email
- **Password Reset** - Secure password reset functionality
- **API Key Management** - Generate and manage API keys for email sending
- **Rate Limiting** - 10 emails per day per user
- **Email Logging** - Track all sent emails with delivery status
- **Modern UI** - Beautiful React dashboard with dark/light themes
- **Security First** - Input sanitization, CORS, security headers

## 🛠️ Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **PostgreSQL** - Database
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **nodemailer** - Email sending
- **TypeScript** - Type safety

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **shadcn/ui** - Component library
- **React Router** - Routing
- **React Query** - Data fetching
- **Framer Motion** - Animations

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 13+
- Gmail account (for email sending)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/airmailer.git
   cd airmailer
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   cp .env.example .env  # Configure your environment variables
   npm run migrate      # Run database migrations
   npm run build
   npm start
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

4. **Access the application**
   - Frontend: http://localhost:8080
   - Backend API: http://localhost:3000

## 📧 API Usage

### Send Email
```javascript
fetch('/api/email/send', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_API_KEY'
  },
  body: JSON.stringify({
    to: 'recipient@example.com',
    subject: 'Hello from AirMailer',
    html: '<h1>Welcome!</h1><p>Your email content here.</p>'
  })
})
.then(res => res.json())
.then(console.log);
```

### Authentication Endpoints
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh JWT token
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password

### API Key Management
- `GET /api/keys/get` - Get current API key
- `POST /api/keys/regenerate` - Regenerate API key

## 🔧 Environment Variables

### Backend (.env)
```env
DATABASE_URL=postgresql://username:password@localhost:5432/airmailer
JWT_SECRET=your-super-secret-jwt-key-here
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-app-password
FRONTEND_URL=http://localhost:8080
PORT=3000
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:3000
```

## 📊 Database Schema

The application uses PostgreSQL with the following main tables:
- `users` - User accounts and authentication
- `api_keys` - API keys for email sending
- `email_logs` - Email sending history

Run `npm run migrate` in the backend directory to set up the database.

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

## 🚢 Deployment

### Backend Deployment
```bash
cd backend
npm run build
npm start
```

### Frontend Deployment
```bash
cd frontend
npm run build
# Deploy the dist/ folder to your hosting service
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

If you have any questions or need help, please open an issue on GitHub.

## 🔄 Version History

### v1.0.0
- Initial release
- JWT authentication
- Email sending API
- User dashboard
- Email verification
- Password reset
- Rate limiting

---

Made with ❤️ by [Your Name]