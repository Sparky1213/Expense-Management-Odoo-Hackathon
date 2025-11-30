# Expense Management System

A comprehensive expense management system with role-based access control, approval workflows, OCR receipt parsing, and multi-currency support.

## 🚀 Features

### Frontend (Next.js + TypeScript)
- **Modern UI**: Built with Next.js 14, TypeScript, and Tailwind CSS
- **Role-based Dashboards**: Separate interfaces for Admin, Manager, and Employee
- **Receipt OCR**: Upload receipts and automatically extract expense data using AI
- **Multi-currency Support**: Support for 100+ currencies with real-time conversion
- **Responsive Design**: Works seamlessly on desktop and mobile devices

### Backend (Node.js + Express + MongoDB)
- **RESTful API**: Complete backend with authentication and authorization
- **JWT Authentication**: Secure token-based authentication
- **Role-based Access Control**: Admin, Manager, and Employee roles
- **Approval Workflows**: Configurable approval rules (sequential, parallel, percentage-based)
- **Currency Conversion**: Real-time currency conversion using ExchangeRate API
- **OCR Integration**: Receipt parsing using Tesseract.js and Groq AI
- **File Upload**: Cloudinary integration for receipt storage
- **MongoDB Database**: Scalable NoSQL database with Mongoose ODM

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **State Management**: React Context API
- **HTTP Client**: Fetch API

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (jsonwebtoken)
- **File Upload**: Multer + Cloudinary
- **OCR**: Tesseract.js + Groq AI
- **Currency**: ExchangeRate API + RestCountries API
- **Validation**: Express Validator
- **Security**: Helmet, CORS, Rate Limiting

## 📦 Installation & Setup

### Prerequisites
- Node.js 18+ 
- MongoDB (local or cloud)
- Cloudinary account (for file uploads)
- Groq API key (for OCR parsing)

### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd Backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   ```bash
   cp env.example .env
   ```
   
   Update `.env` with your configuration:
   ```env
   # Server Configuration
   PORT=5000
   NODE_ENV=development
   
   # Database
   MONGODB_URI=mongodb://localhost:27017/expense-management
   
   # JWT
   JWT_SECRET=your-super-secret-jwt-key-here
   JWT_EXPIRE=7d
   
   # Cloudinary (for file uploads)
   CLOUDINARY_CLOUD_NAME=your-cloud-name
   CLOUDINARY_API_KEY=your-api-key
   CLOUDINARY_API_SECRET=your-api-secret
   
   # Groq API (for OCR parsing)
   GROQ_API_KEY=your-groq-api-key
   
   # Frontend URL (for CORS)
   FRONTEND_URL=http://localhost:3000
   ```

4. **Start the backend server**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm start
   ```

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd Frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   pnpm install
   ```

3. **Environment Configuration**
   ```bash
   cp env.local.example .env.local
   ```
   
   Update `.env.local`:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5000/api
   ```

4. **Start the frontend development server**
   ```bash
   npm run dev
   # or
   pnpm dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:3000`

## 🔧 API Documentation

### Authentication Endpoints
- `POST /api/auth/signup` - Register new user and create company
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get current user profile
- `PUT /api/auth/profile` - Update user profile

### User Management (Admin only)
- `GET /api/users` - Get all users in company
- `POST /api/users` - Add new user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user
- `GET /api/users/team` - Get team members

### Expense Management
- `POST /api/expenses/submit` - Submit new expense
- `GET /api/expenses/my` - Get user's expenses
- `GET /api/expenses/all` - Get all expenses (Admin)
- `GET /api/expenses/pending` - Get pending approvals
- `GET /api/expenses/team` - Get team expenses (Manager)
- `PATCH /api/expenses/:id/approve` - Approve expense
- `PATCH /api/expenses/:id/reject` - Reject expense

### OCR & Currency
- `POST /api/ocr/parse` - Parse receipt using OCR and AI
- `POST /api/ocr/extract` - Extract text from image
- `GET /api/currency/supported` - Get supported currencies
- `GET /api/currency/countries` - Get countries and currencies

## 🎯 Usage

### Getting Started
1. **Sign Up**: Create a new account (becomes admin by default)
2. **Set Company Currency**: Choose your company's base currency
3. **Add Users**: Invite team members and assign roles
4. **Configure Approval Rules**: Set up approval workflows
5. **Submit Expenses**: Employees can submit expenses with receipts
6. **Review & Approve**: Managers and admins can review and approve expenses

### User Roles
- **Admin**: Full system access, user management, approval rules configuration
- **Manager**: Team management, expense approvals, team expense viewing
- **Employee**: Expense submission, personal expense tracking

### Key Features
- **Receipt OCR**: Upload receipt images for automatic data extraction
- **Multi-currency**: Submit expenses in any currency, automatically converted to company base currency
- **Approval Workflows**: Flexible approval rules with different sequence types
- **Real-time Updates**: Live updates across all user interfaces
- **File Management**: Secure receipt storage with Cloudinary

## 🚀 Deployment

### Backend Deployment
1. Set up MongoDB Atlas or use a cloud MongoDB service
2. Configure environment variables for production
3. Deploy to platforms like Heroku, Railway, or AWS
4. Set up Cloudinary for file storage
5. Configure Groq API for OCR functionality

### Frontend Deployment
1. Build the application: `npm run build`
2. Deploy to Vercel, Netlify, or any static hosting service
3. Update API URL in environment variables

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Add tests if applicable
5. Commit your changes: `git commit -m 'Add feature'`
6. Push to the branch: `git push origin feature-name`
7. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Check the documentation in the `/Backend/README.md` and `/Frontend/README.md` files
- Review the API documentation above

## 🔮 Future Enhancements

- [ ] Email notifications for expense status updates
- [ ] Mobile app (React Native)
- [ ] Advanced reporting and analytics
- [ ] Integration with accounting software
- [ ] Bulk expense import/export
- [ ] Advanced OCR with multiple language support
- [ ] Real-time chat for expense discussions
- [ ] Advanced approval workflows with conditions
