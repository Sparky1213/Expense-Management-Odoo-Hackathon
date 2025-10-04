# Expense Management System - Backend

A comprehensive backend API for the Expense Management System built with Node.js, Express, and MongoDB.

## 🚀 Features

- **Authentication & Authorization**: JWT-based auth with role-based access control
- **User Management**: Admin can manage users, roles, and departments
- **Expense Management**: Submit, track, and manage expenses with receipt uploads
- **Approval Workflows**: Configurable approval rules (sequential, parallel, percentage-based)
- **Currency Conversion**: Real-time currency conversion using ExchangeRate API
- **OCR Integration**: Receipt parsing using Tesseract.js and AI (Groq)
- **File Upload**: Cloudinary integration for receipt storage
- **Multi-currency Support**: Support for 100+ currencies

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (jsonwebtoken)
- **File Upload**: Multer + Cloudinary
- **OCR**: Tesseract.js + Groq AI
- **Currency**: ExchangeRate API + RestCountries API
- **Validation**: Express Validator
- **Security**: Helmet, CORS, Rate Limiting

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp env.example .env
   ```
   
   Update the `.env` file with your configuration:
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

4. **Start the server**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm start
   ```

## 📚 API Documentation

### Authentication Endpoints

#### POST /api/auth/signup
Register a new user and create a company.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "currency": "USD"
}
```

#### POST /api/auth/login
Login user and get JWT token.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

#### GET /api/auth/profile
Get current user profile (requires authentication).

### User Management Endpoints

#### GET /api/users
Get all users in company (Admin/Manager only).

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `role`: Filter by role (admin, manager, employee)
- `search`: Search by name, email, or department

#### POST /api/users
Add new user (Admin only).

**Request Body:**
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "password123",
  "role": "employee",
  "department": "Engineering",
  "manager": "manager_id_here"
}
```

### Expense Management Endpoints

#### POST /api/expenses/submit
Submit new expense with optional receipt upload.

**Request Body (multipart/form-data):**
- `description`: Expense description
- `category`: Expense category
- `date`: Expense date (ISO format)
- `paidBy`: Payment method
- `amount`: Expense amount
- `currency`: Currency code (3 letters)
- `receipt`: Receipt file (image/PDF)

#### GET /api/expenses/my
Get current user's expenses.

**Query Parameters:**
- `page`, `limit`: Pagination
- `status`: Filter by status
- `category`: Filter by category
- `startDate`, `endDate`: Date range

#### GET /api/expenses/pending
Get pending approvals for current user (Manager/Admin).

#### PATCH /api/expenses/:id/approve
Approve an expense (Manager/Admin).

**Request Body:**
```json
{
  "comments": "Approved - looks good"
}
```

#### PATCH /api/expenses/:id/reject
Reject an expense (Manager/Admin).

**Request Body:**
```json
{
  "comments": "Rejected - missing documentation",
  "reason": "Insufficient documentation"
}
```

### OCR Endpoints

#### POST /api/ocr/parse
Parse receipt image using OCR and AI.

**Request Body (multipart/form-data):**
- `image`: Receipt image file

**Response:**
```json
{
  "success": true,
  "data": {
    "merchant": "Starbucks",
    "amount": 4.50,
    "currency": "USD",
    "date": "2024-01-15",
    "category": "Food",
    "items": [...]
  }
}
```

### Currency Endpoints

#### GET /api/currency/supported
Get list of supported currencies.

#### GET /api/currency/countries
Get countries and their currencies.

## 🔐 Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## 🏗️ Database Schema

### User Model
- Basic user information
- Role-based access (admin, manager, employee)
- Company association
- Manager hierarchy

### Company Model
- Company settings
- Base currency
- Admin user reference

### Expense Model
- Expense details
- Multi-currency support
- Approval workflow tracking
- Receipt storage

### ApprovalRule Model
- Configurable approval workflows
- Multiple sequence types
- Conditional rules

## 🚀 Deployment

1. **Environment Variables**: Set all required environment variables
2. **Database**: Ensure MongoDB is accessible
3. **File Storage**: Configure Cloudinary credentials
4. **AI Services**: Set up Groq API key for OCR
5. **Build**: `npm install --production`
6. **Start**: `npm start`

## 🔧 Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Run tests
npm test
```

## 📝 Notes

- All amounts are stored in the company's base currency
- Receipt files are uploaded to Cloudinary
- OCR parsing uses Tesseract.js + Groq AI
- Currency conversion uses ExchangeRate API
- Rate limiting: 100 requests per 15 minutes per IP
- File upload limit: 10MB

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details
