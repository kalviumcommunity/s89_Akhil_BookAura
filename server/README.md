# BookAura Backend

This is the backend server for the BookAura application.

## Deployment to Render

### Prerequisites

1. Create a Render account at [render.com](https://render.com)
2. Have your MongoDB connection string ready
3. Have all other environment variables ready (JWT_SECRET, Stripe keys, etc.)

### Steps to Deploy

1. Connect your GitHub repository to Render
2. Create a new Web Service
3. Use the following settings:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment Variables**: Add all required environment variables:
     - `NODE_ENV`: `production`
     - `MONGODB_URI`: Your MongoDB connection string
     - `JWT_SECRET`: Your JWT secret
     - `STRIPE_SECRET_KEY`: Your Stripe secret key
     - `CLOUDINARY_CLOUD_NAME`: Your Cloudinary cloud name
     - `CLOUDINARY_API_KEY`: Your Cloudinary API key
     - `CLOUDINARY_API_SECRET`: Your Cloudinary API secret
     - `FRONTEND_URL`: Your frontend URL (e.g., https://your-app.vercel.app)

4. Deploy the service

### Environment Variables

Make sure to set the following environment variables in Render:

- `NODE_ENV`: Set to `production`
- `PORT`: Automatically set by Render
- `MONGODB_URI`: Your MongoDB connection string
- `JWT_SECRET`: Secret for JWT token generation
- `STRIPE_SECRET_KEY`: Your Stripe secret key
- `CLOUDINARY_CLOUD_NAME`: Your Cloudinary cloud name
- `CLOUDINARY_API_KEY`: Your Cloudinary API key
- `CLOUDINARY_API_SECRET`: Your Cloudinary API secret
- `FRONTEND_URL`: Your frontend URL

## Local Development

1. Clone the repository
2. Install dependencies: `npm install`
3. Create a `.env` file with the required environment variables
4. Run the development server: `npm run dev`

## API Endpoints

- `/health`: Health check endpoint
- `/api/payment`: Payment routes
- `/api/pdf`: PDF proxy routes
- `/api/cart`: Cart routes
- `/api/events`: Event routes
- `/api/flashcards`: Flashcard routes
- `/api/chat-history`: Chat history routes
- `/router`: User and Book routes
