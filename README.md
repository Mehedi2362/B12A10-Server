# AI Model Inventory Manager - Server

Backend API for the AI Model Inventory Manager application built with Express.js and MongoDB.

## 🚀 Features

- **RESTful API** with Express.js
- **Raw MongoDB** driver for database operations
- **Firebase Admin SDK** for authentication
- **CRUD Operations** for AI models
- **Purchase System** with real-time counter
- **Search & Filter** functionality
- **Authorization** with Firebase ID tokens

## 📦 Tech Stack

- Node.js
- Express.js
- MongoDB (Raw driver)
- Firebase Admin SDK
- CORS
- dotenv

## 🛠️ Installation

1. Install dependencies:
```bash
pnpm install
```

2. Create `.env` file:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=your_mongodb_connection_string
DB_NAME=ai-model-inventory
CLIENT_URL=http://localhost:5173
```

3. Add Firebase Admin SDK credentials:
   - Download `firebase-adminsdk.json` from Firebase Console
   - Place it in the `server` directory

4. Start the server:
```bash
pnpm dev
```

## 📡 API Endpoints

### Models

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/models` | Get all models (with search & filter) | Optional |
| GET | `/api/models/featured` | Get 6 most recent models | No |
| GET | `/api/models/my-models` | Get user's models | Required |
| GET | `/api/models/:id` | Get single model | Optional |
| POST | `/api/models` | Create new model | Required |
| PUT | `/api/models/:id` | Update model | Required |
| DELETE | `/api/models/:id` | Delete model | Required |
| POST | `/api/models/:id/purchase` | Purchase model | Required |

### Purchases

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/purchases/my-purchases` | Get user's purchases | Required |
| GET | `/api/purchases/model/:modelId` | Get purchases for a model | Required |
| GET | `/api/purchases/stats` | Get purchase statistics | Required |

## 🔐 Authentication

All protected routes require a Firebase ID token in the Authorization header:

```
Authorization: Bearer <firebase_id_token>
```

## 🗄️ Database Collections

### Models Collection
```javascript
{
  _id: ObjectId,
  name: String,
  framework: String,
  useCase: String,
  dataset: String,
  description: String,
  image: String,
  createdBy: String, // user email
  createdAt: Date,
  purchased: Number // default 0
}
```

### Purchases Collection
```javascript
{
  _id: ObjectId,
  modelId: String,
  modelName: String,
  framework: String,
  useCase: String,
  image: String,
  createdBy: String,
  purchasedBy: String, // user email
  purchasedAt: Date
}
```

## 🔍 Query Parameters

### GET /api/models

- `search` - Search by model name (case-insensitive)
- `framework` - Filter by framework
- `limit` - Limit results
- `sort` - Sort by: newest, oldest, popular

Example:
```
/api/models?search=bert&framework=TensorFlow&limit=10&sort=popular
```

## 🛡️ Error Handling

All errors return JSON in this format:
```javascript
{
  success: false,
  message: "Error message",
  error: "Stack trace (development only)"
}
```

## 📝 Development

```bash
# Development with auto-reload
pnpm dev

# Production
pnpm start
```

## 🚢 Deployment

Deploy to Vercel:

1. Install Vercel CLI: `npm i -g vercel`
2. Run: `vercel`
3. Add environment variables in Vercel dashboard
4. Deploy: `vercel --prod`

## 📄 License

MIT
