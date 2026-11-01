# NovaCart 

**A modern e-commerce platform with AI-powered shopping assistance.**

NovaCart is a full-stack e-commerce web application built with React, Supabase, and Paystack. It provides a complete shopping experience, from browsing products and managing a wishlist to secure checkout, payment processing, and order tracking.

##  Live Demo

[Visit NovaCart](https://novacart-mauve.vercel.app)

## Screenshots

### Homepage
![NovaCart Homepage](screenshots/homepage.png)

### Shop
![NovaCart Shop](screenshots/shop.png)

### Product Details
![Product Details](screenshots/product-details.png)

### Admin Dashboard
![NovaCart Admin Dashboard](screenshots/admin-dashboard.png)

### AI Shopping Assistant
![NovaCart AI Assistant](screenshots/ai-assistant.png)

## ✨ Features

### Shopping Experience
- Browse products from a Supabase database.
- View individual product details.
- Add and remove products from the shopping cart.
- Save products to a wishlist.
- Search, filter, and sort products.

### Authentication
- User registration and login.
- Email confirmation.
- Persistent authentication sessions.
- Forgot-password and password-reset functionality.

### AI Shopping Assistant
- AI-powered shopping assistance.
- Product recommendations based on the store catalogue.
- Interactive conversational shopping experience.

### Payments and Orders
- Paystack payment integration.
- Payment verification.
- Payment status handling.
- Order creation and persistence.
- Order history for authenticated users.

### Admin Dashboard
- Protected admin access.
- Add, edit, and delete products.
- View order information.
- Monitor customer and order statistics.
- Database-level access control using Supabase Row Level Security.

##  Tech Stack

| Technology | Purpose |
|---|---|
| React | Frontend UI |
| Vite | Development and build tooling |
| JavaScript | Application logic |
| CSS | Styling and responsive design |
| React Router | Client-side navigation |
| Supabase | Authentication, database, and Edge Functions |
| Paystack | Payment processing |
| Vercel | Deployment |

##  Getting Started

### Prerequisites
- Node.js (LTS recommended)
- npm
- A Supabase project

### 1. Clone the repository

```bash
git clone https://github.com/sylvanusanang45-afk/novacart.git
```

### 2. Navigate into the project

```bash
cd novacart
```

### 3. Install dependencies

```bash
npm install
```

### 4. Configure environment variables

Create a `.env.local` file in the project root:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
```

Never expose Supabase secret keys, service-role keys, or Paystack secret keys in frontend environment variables.

### 5. Start the development server

```bash
npm run dev
```

### 6. Build for production

```bash
npm run build
```

##  Backend and Services

NovaCart uses Supabase for authentication, database operations, and server-side functionality through Edge Functions.

The application also uses Paystack for payment initialization and verification.

To run the complete application in your own environment, configure the required Supabase database tables, Row Level Security policies, Edge Functions, and server-side secrets.

##  Deployment

The frontend is deployed on Vercel.

**Live URL:** https://novacart-mauve.vercel.app

##  Author

**Sylvanus Anang**

Built as a portfolio project to demonstrate frontend development, backend integration, authentication, payment processing, and AI-powered application features.

---

*NovaCart — A smarter way to shop.*
