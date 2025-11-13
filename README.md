# COVU Marketplace Frontend

A modern e-commerce marketplace frontend for Nigerian entrepreneurs and shoppers. Built with vanilla JavaScript, Tailwind CSS, and designed for future migration to React.

## 📋 Table of Contents

- [Project Overview](#project-overview)
- [Architecture](#architecture)
- [File Structure](#file-structure)
- [Core Components](#core-components)
- [Data Flow](#data-flow)
- [API Integration](#api-integration)
- [Authentication Flow](#authentication-flow)
- [Migration to React](#migration-to-react)
- [Getting Started](#getting-started)

---

## 🎯 Project Overview

**COVU Marketplace** is a full-featured e-commerce platform connecting Nigerian sellers and buyers. The platform supports:

- User authentication (login/register)
- Store browsing with infinite scroll
- Product catalog with filtering and search
- Shopping cart and checkout
- Order management
- Wallet system for transactions
- Rating and review system
- Multi-step registration with location-based features

**Tech Stack:**

- **UI Framework:** Tailwind CSS
- **Icons:** Lucide Icons
- **JavaScript:** Vanilla ES6+
- **Backend API:** Django REST Framework (https://covu.onrender.com/api)
- **Future:** React.js migration planned

---

## 🏗️ Architecture

### Current Architecture (Vanilla JS)

```
┌─────────────────────────────────────────────────────────┐
│                    Entry Point (index.html)              │
│                  Welcome/Splash Screen                   │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              Authentication Layer                        │
│         (login.html + login.js)                         │
│         (register.html + registration.js)               │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│                 Core Services                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │  config.js   │  │   api.js     │  │ localStorage │ │
│  │  (API URLs)  │  │ (HTTP Client)│  │  (Tokens)    │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│                Page-Specific Modules                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │  script.js   │  │ products.js  │  │  orders.js   │ │
│  │ (Shop List)  │  │(Product List)│  │ (Order Mgmt) │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │  shop.js     │  │ purchase.js  │  │ profile.js   │ │
│  │(Shop Detail) │  │  (Checkout)  │  │(User Profile)│ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────┘
```

---

## 📁 File Structure

```
frontend/
├── index.html                  # Entry point / splash screen
├── README.md                   # This file
├── assets/
│   ├── css/                    # Custom CSS (minimal, Tailwind-first)
│   ├── images/                 # Static images
│   │   ├── logo/              # COVU branding assets
│   │   ├── photos/            # Product/store images
│   │   └── favicon/           # Favicon assets
│   └── js/                     # JavaScript modules
│       ├── config.js          # API configuration
│       ├── api.js             # Central HTTP client
│       ├── login.js           # Login page logic
│       ├── registration.js    # Registration flow
│       ├── script.js          # Shop list (infinite scroll)
│       ├── products.js        # Product catalog
│       ├── shop.js            # Individual shop details
│       ├── product-detail.js  # Single product view
│       ├── purchase.js        # Checkout & payment
│       ├── orders.js          # Order management
│       ├── profile.js         # User profile
│       ├── seller-gallery.js  # Seller store management
│       ├── complaints.js      # Customer support
│       ├── global-rating.js   # Rating system
│       └── nigeria-lgas.js    # Nigerian states/LGAs data
└── templates/                  # HTML pages
    ├── login.html             # Authentication page
    ├── register.html          # Multi-step registration
    ├── shop-list.html         # All stores (infinite scroll)
    ├── shop.html              # Single shop view
    ├── products.html          # Product catalog
    ├── product-detail.html    # Product details & purchase
    ├── purchase.html          # Checkout process
    ├── orders.html            # Order history
    ├── profile.html           # User profile & settings
    ├── seller-gallery.html    # Seller dashboard
    └── complaints-tester.html # Support/complaints
```

---

## 🧩 Core Components

### 1. **Configuration Layer** (`config.js`)

Centralizes all API endpoints and application settings.

```javascript
// Key configurations
- BASE_URL: Backend API base URL
- ENDPOINTS: All REST endpoints
- TOKEN_KEYS: localStorage keys for JWT tokens
- PAGE_SIZE: Pagination settings
- SCROLL_THRESHOLD: Infinite scroll trigger distance
```

**React Migration Note:** This will become an environment config file (`.env`) with React context for app-wide settings.

---

### 2. **API Handler** (`api.js`)

Central HTTP client handling all backend communication.

**Features:**

- JWT authentication with automatic token refresh
- Request/response interceptors
- Error handling and user feedback
- Token management (access/refresh)
- User session management

**Key Methods:**

```javascript
-get(endpoint, includeAuth) - // GET requests
  post(endpoint, data, includeAuth) - // POST requests
  put(endpoint, data, includeAuth) - // PUT requests
  delete (endpoint, includeAuth) - // DELETE requests
  refreshAccessToken() - // Token refresh logic
  getCurrentUser() - // Get logged-in user
  clearTokens(); // Logout
```

**React Migration Note:** This becomes an Axios/Fetch wrapper with React Query for state management and caching.

---

### 3. **Authentication Module** (`login.js`, `registration.js`)

Handles user authentication and registration flows.

**Login Flow (`login.js`):**

1. User enters email/password
2. Sends POST to `/auth/login/`
3. Receives JWT tokens (access + refresh)
4. Stores tokens in localStorage
5. Redirects to shop list

**Registration Flow (`registration.js`):**

1. **Step 1:** User credentials (name, email, phone)
2. **Step 2:** Location (Nigerian state + LGA)
3. **Step 3:** Security (password + terms)
4. Validates each step before proceeding
5. POST to `/auth/register/`
6. Auto-login on success
7. Redirect to marketplace

**Features:**

- Multi-step form with validation
- Real-time password strength indicator
- Nigerian phone number formatting
- State/LGA cascading dropdowns
- Toast notifications for errors

**React Migration Note:** Becomes a React Context + custom hooks (`useAuth`, `useRegister`) with form libraries like React Hook Form or Formik.

---

### 4. **Shop List** (`shop-list.html`, `script.js`)

Main marketplace page displaying all stores with infinite scroll.

**Features:**

- Infinite scroll pagination
- Category filtering (9 categories)
- Real-time search
- Sticky search bar on scroll
- Store cards with ratings
- Modal for store quick view

**Data Flow:**

```
1. Fetch stores from API (/stores/?page=1)
2. Render store cards
3. User scrolls → Detect scroll position
4. Load next page when threshold reached
5. Append new stores to grid
6. Repeat until no more data
```

**Key Functions:**

```javascript
-fetchStores(page) - // API call with pagination
  renderStores(stores) - // DOM rendering
  handleScroll() - // Infinite scroll detection
  filterStoresByCategory() - // Category filtering
  searchStores(); // Search functionality
```

**React Migration Note:** Becomes a component with `react-infinite-scroll-component` or `react-window` for virtualization. State managed with React Query for caching.

---

### 5. **Product Catalog** (`products.html`, `products.js`)

Lists all products across the marketplace.

**Features:**

- Similar infinite scroll to shop list
- Product cards with images, prices, ratings
- Category filtering
- Search functionality
- "Add to Cart" buttons

**React Migration Note:** Reusable `ProductCard` component with a product list container. Cart state managed with Redux or Zustand.

---

### 6. **Shop Details** (`shop.html`, `shop.js`)

Individual store page showing store info and products.

**Data Flow:**

```
1. Extract store ID from URL (?store_id=123)
2. Fetch store details (/stores/123/)
3. Fetch store products (/stores/123/products/)
4. Display store header (name, rating, location)
5. Render product grid
6. Enable rating functionality
```

**React Migration Note:** Becomes a route with React Router (`/shop/:storeId`). Use `useParams()` to extract ID.

---

### 7. **Product Detail** (`product-detail.html`, `product-detail.js`)

Single product view with purchase options.

**Features:**

- Product images gallery
- Price and stock information
- Seller information
- Quantity selector
- Add to cart
- Rating and reviews

**React Migration Note:** Route with `/product/:productId`. Image gallery becomes a carousel component (e.g., `react-slick`).

---

### 8. **Checkout** (`purchase.html`, `purchase.js`)

Handles order creation and payment.

**Features:**

- Cart summary
- Delivery address
- Payment method selection
- Wallet integration (fund wallet via Paystack)
- Order confirmation

**Data Flow:**

```
1. User adds products to cart (localStorage)
2. Navigate to checkout
3. Enter delivery details
4. Select payment method
5. If wallet: Check balance → deduct → create order
6. If card: Integrate Paystack → verify → create order
7. Redirect to order confirmation
```

**React Migration Note:** Multi-step checkout component with state machine (XState). Payment handled via Paystack React library.

---

### 9. **Orders** (`orders.html`, `orders.js`)

Order history and management.

**Features:**

- List user's orders
- Filter by status (pending, delivered, cancelled)
- Order details modal
- Order actions (cancel, confirm delivery)
- Seller actions (accept, mark as delivered)

**React Migration Note:** Component with tabs for different order statuses. Uses React Query for real-time updates.

---

### 10. **Profile** (`profile.html`, `profile.js`)

User account management.

**Features:**

- View/edit profile information
- View wallet balance
- Fund wallet
- Transaction history
- Become a seller
- Password change
- Logout

**React Migration Note:** Settings page with tabs. Profile form uses controlled components.

---

## 🔄 Data Flow

### 1. **Authentication Flow**

```
┌──────────┐    POST /auth/login/    ┌──────────┐
│  User    │ ────────────────────────> Backend  │
│ (login)  │                          │   API    │
└──────────┘                          └──────────┘
     │                                      │
     │        {access, refresh, user}       │
     │ <────────────────────────────────────│
     │
     ▼
┌──────────────────────────────────────────┐
│        localStorage                       │
│  - access_token                          │
│  - refresh_token                         │
│  - current_user (JSON)                   │
└──────────────────────────────────────────┘
     │
     ▼
┌──────────────────────────────────────────┐
│  All subsequent API calls include:       │
│  Authorization: Bearer {access_token}    │
└──────────────────────────────────────────┘
```

### 2. **Infinite Scroll Flow**

```
┌─────────────┐
│  User       │
│  scrolls    │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────┐
│  Detect scroll position     │
│  (distance from bottom)     │
└──────┬──────────────────────┘
       │
       ▼ (if < threshold && !loading)
┌─────────────────────────────┐
│  Fetch next page            │
│  GET /stores/?page=N        │
└──────┬──────────────────────┘
       │
       ▼
┌─────────────────────────────┐
│  Append new items to list   │
│  Increment page counter     │
└─────────────────────────────┘
```

### 3. **Order Creation Flow**

```
Cart (localStorage) → Checkout Page → Payment
                                        ├─ Wallet: Deduct balance
                                        └─ Card: Paystack → Verify
                                                    ↓
                                        POST /orders/ (create order)
                                                    ↓
                                        Order Confirmation Page
```

---

## 🔌 API Integration

### Base URL

```
https://covu.onrender.com/api
```

### Authentication Endpoints

| Method | Endpoint               | Description                     |
| ------ | ---------------------- | ------------------------------- |
| POST   | `/auth/login/`         | User login (returns JWT tokens) |
| POST   | `/auth/register/`      | User registration               |
| POST   | `/auth/token/refresh/` | Refresh access token            |
| GET    | `/auth/profile/`       | Get current user profile        |
| POST   | `/auth/become-seller/` | Convert user to seller          |

### Store Endpoints

| Method | Endpoint                | Description                 |
| ------ | ----------------------- | --------------------------- |
| GET    | `/stores/`              | List all stores (paginated) |
| GET    | `/stores/:id/`          | Get store details           |
| GET    | `/stores/:id/products/` | Get store's products        |
| POST   | `/stores/:id/rate/`     | Rate a store                |

### Product Endpoints

| Method | Endpoint              | Description                   |
| ------ | --------------------- | ----------------------------- |
| GET    | `/products/`          | List all products (paginated) |
| GET    | `/products/:id/`      | Get product details           |
| POST   | `/products/:id/rate/` | Rate a product                |

### Order Endpoints

| Method | Endpoint               | Description               |
| ------ | ---------------------- | ------------------------- |
| GET    | `/orders/`             | List user's orders        |
| POST   | `/orders/`             | Create new order          |
| GET    | `/orders/:id/`         | Get order details         |
| POST   | `/orders/:id/accept/`  | Seller accepts order      |
| POST   | `/orders/:id/deliver/` | Seller marks as delivered |
| POST   | `/orders/:id/confirm/` | Buyer confirms delivery   |
| POST   | `/orders/:id/cancel/`  | Cancel order              |

### Wallet Endpoints

| Method | Endpoint                  | Description             |
| ------ | ------------------------- | ----------------------- |
| POST   | `/wallet/fund/`           | Initiate wallet funding |
| POST   | `/wallet/verify-payment/` | Verify Paystack payment |
| GET    | `/wallet/transactions/`   | Get transaction history |
| POST   | `/wallet/withdraw/`       | Withdraw funds          |

---

## 🔐 Authentication Flow

### Token Management

The app uses JWT (JSON Web Tokens) with two token types:

1. **Access Token:** Short-lived (15 minutes), used for API requests
2. **Refresh Token:** Long-lived (7 days), used to get new access tokens

### Token Refresh Flow

```javascript
// api.js handles automatic token refresh
async request(endpoint, options) {
    try {
        // Attempt request with current access token
        let response = await fetch(url, fetchOptions);

        if (response.status === 401) {
            // Token expired, refresh it
            await this.refreshAccessToken();

            // Retry original request with new token
            response = await fetch(url, fetchOptions);
        }

        return response;
    } catch (error) {
        // Handle errors
    }
}
```

### Protected Routes

Pages that require authentication check for tokens on load:

```javascript
// Example from products.js
const token = api.getAccessToken();
if (!token) {
  window.location.href = "login.html";
}
```

---

## ⚛️ Migration to React

### Phase 1: Project Setup

```bash
npx create-react-app covu-marketplace
cd covu-marketplace
npm install react-router-dom axios react-query zustand
npm install tailwindcss lucide-react
```

### Phase 2: Folder Structure

```
src/
├── components/          # Reusable components
│   ├── common/         # Buttons, Cards, Modals
│   ├── layout/         # Header, Footer, Sidebar
│   └── forms/          # Form inputs, validation
├── pages/              # Page components (routes)
│   ├── Auth/
│   │   ├── Login.jsx
│   │   └── Register.jsx
│   ├── Shop/
│   │   ├── ShopList.jsx
│   │   └── ShopDetail.jsx
│   ├── Product/
│   │   ├── ProductList.jsx
│   │   └── ProductDetail.jsx
│   ├── Order/
│   │   └── Orders.jsx
│   └── Profile/
│       └── Profile.jsx
├── services/           # API layer
│   ├── api.js         # Axios instance
│   ├── auth.service.js
│   ├── shop.service.js
│   └── product.service.js
├── hooks/              # Custom hooks
│   ├── useAuth.js
│   ├── useInfiniteScroll.js
│   └── useCart.js
├── store/              # State management (Zustand)
│   ├── authStore.js
│   ├── cartStore.js
│   └── userStore.js
├── utils/              # Helper functions
│   ├── validators.js
│   └── formatters.js
├── config/             # Configuration
│   └── apiConfig.js
└── App.jsx             # Main app component
```

### Phase 3: Component Mapping

| Current (Vanilla JS)  | React Component     | Notes                        |
| --------------------- | ------------------- | ---------------------------- |
| `login.html`          | `<Login />`         | Form with React Hook Form    |
| `register.html`       | `<Register />`      | Multi-step form component    |
| `shop-list.html`      | `<ShopList />`      | With `react-infinite-scroll` |
| `shop.html`           | `<ShopDetail />`    | Route: `/shop/:id`           |
| `products.html`       | `<ProductList />`   | Reuse infinite scroll        |
| `product-detail.html` | `<ProductDetail />` | Route: `/product/:id`        |
| `purchase.html`       | `<Checkout />`      | Multi-step checkout          |
| `orders.html`         | `<Orders />`        | Tabs for order status        |
| `profile.html`        | `<Profile />`       | Settings page                |

### Phase 4: Key React Patterns

#### 1. **Custom Hook for API Calls** (React Query)

```javascript
// hooks/useShops.js
import { useInfiniteQuery } from "react-query";
import { fetchShops } from "../services/shop.service";

export function useShops(filters) {
  return useInfiniteQuery(
    ["shops", filters],
    ({ pageParam = 1 }) => fetchShops(pageParam, filters),
    {
      getNextPageParam: (lastPage) => lastPage.nextPage,
    }
  );
}
```

#### 2. **Authentication Context**

```javascript
// contexts/AuthContext.jsx
import { createContext, useContext, useState } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [tokens, setTokens] = useState(null);

  const login = async (email, password) => {
    // Login logic
  };

  const logout = () => {
    // Logout logic
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
```

#### 3. **Protected Routes**

```javascript
// components/ProtectedRoute.jsx
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export function ProtectedRoute({ children }) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" />;
  }

  return children;
}
```

#### 4. **Infinite Scroll Component**

```javascript
// components/ShopList.jsx
import InfiniteScroll from "react-infinite-scroll-component";
import { useShops } from "../hooks/useShops";

export function ShopList() {
  const { data, fetchNextPage, hasNextPage } = useShops();

  const shops = data?.pages.flatMap((page) => page.results) || [];

  return (
    <InfiniteScroll
      dataLength={shops.length}
      next={fetchNextPage}
      hasMore={hasNextPage}
      loader={<Spinner />}
    >
      {shops.map((shop) => (
        <ShopCard key={shop.id} shop={shop} />
      ))}
    </InfiniteScroll>
  );
}
```

### Phase 5: State Management

Use **Zustand** for global state (lightweight alternative to Redux):

```javascript
// store/cartStore.js
import create from "zustand";

export const useCartStore = create((set) => ({
  items: [],
  addItem: (item) =>
    set((state) => ({
      items: [...state.items, item],
    })),
  removeItem: (id) =>
    set((state) => ({
      items: state.items.filter((i) => i.id !== id),
    })),
  clearCart: () => set({ items: [] }),
}));
```

### Phase 6: Routing

```javascript
// App.jsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Login from "./pages/Auth/Login";
import ShopList from "./pages/Shop/ShopList";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <ShopList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/shop/:id"
          element={
            <ProtectedRoute>
              <ShopDetail />
            </ProtectedRoute>
          }
        />
        {/* More routes... */}
      </Routes>
    </BrowserRouter>
  );
}
```

---

## 🚀 Getting Started

### Prerequisites

- Modern web browser (Chrome, Firefox, Safari, Edge)
- Internet connection (for CDN resources)
- Backend API running at `https://covu.onrender.com/api`

### Running Locally

1. **Clone the repository:**

   ```bash
   git clone <repository-url>
   cd frontend
   ```

2. **Open in browser:**

   - Simply open `index.html` in a browser, OR
   - Use a local server (recommended):

   ```bash
   # Python
   python -m http.server 8000

   # Node.js
   npx http-server
   ```

3. **Navigate to:**
   ```
   http://localhost:8000
   ```

### Testing Flow

1. **Welcome Screen** (`index.html`)

   - Auto-redirects to login after 5 seconds

2. **Register** (`register.html`)

   - Create a test account
   - Follow 3-step registration

3. **Login** (`login.html`)

   - Use registered credentials

4. **Shop List** (`shop-list.html`)

   - Browse stores with infinite scroll
   - Test category filters and search

5. **Product Detail** (`product-detail.html`)

   - Click on a product
   - Add to cart

6. **Checkout** (`purchase.html`)

   - Proceed to checkout
   - Test wallet funding (Paystack test keys)

7. **Orders** (`orders.html`)
   - View created orders
   - Test order actions

---

## 📝 Key Concepts for React Migration

### 1. **Component Reusability**

Break down large page scripts into smaller, reusable components:

- `StoreCard`, `ProductCard`, `OrderCard`
- `SearchBar`, `CategoryFilter`, `PaginationControls`
- `Modal`, `Toast`, `Spinner`

### 2. **State Management**

- **Local State:** useState for component-level state
- **Global State:** Zustand/Redux for cart, auth, user
- **Server State:** React Query for API data (caching, refetching)

### 3. **Routing**

- React Router for client-side navigation
- Protected routes for authenticated pages
- URL parameters for dynamic pages (`/shop/:id`)

### 4. **Forms**

- React Hook Form or Formik for complex forms
- Yup or Zod for validation schemas
- Controlled components for inputs

### 5. **API Layer**

- Axios for HTTP requests
- Centralized error handling
- Request/response interceptors for auth tokens
- React Query for data fetching, caching, and synchronization

### 6. **Performance**

- Code splitting with `React.lazy()` and `Suspense`
- Virtual scrolling for long lists (`react-window`)
- Memoization with `useMemo` and `useCallback`
- Image lazy loading

---

## 🔧 Configuration

### API Configuration (`config.js`)

Update `BASE_URL` for different environments:

```javascript
const API_CONFIG = {
  BASE_URL: process.env.REACT_APP_API_URL || "https://covu.onrender.com/api",
  // ...
};
```

### Environment Variables (React)

Create `.env` files:

```env
# .env.development
REACT_APP_API_URL=http://localhost:8000/api

# .env.production
REACT_APP_API_URL=https://covu.onrender.com/api
```

---

## 🐛 Debugging Tips

### Common Issues

1. **Token Expired Errors:**

   - Check localStorage for valid tokens
   - Verify token refresh logic in `api.js`

2. **CORS Issues:**

   - Ensure backend allows your origin
   - Check `Access-Control-Allow-Origin` headers

3. **Infinite Scroll Not Working:**

   - Check `hasMoreStores` flag
   - Verify scroll event listener
   - Ensure API returns `next` field for pagination

4. **Payment Not Processing:**
   - Verify Paystack public key
   - Check network tab for failed requests
   - Ensure wallet has sufficient balance

---

## 📚 Resources

- **Tailwind CSS:** https://tailwindcss.com/docs
- **Lucide Icons:** https://lucide.dev
- **React Documentation:** https://react.dev
- **React Router:** https://reactrouter.com
- **React Query:** https://tanstack.com/query
- **Zustand:** https://github.com/pmndrs/zustand
- **Paystack Documentation:** https://paystack.com/docs

---

## 👨‍💻 Contributing

When contributing, maintain:

- Consistent code style (ESLint/Prettier recommended)
- Modular code structure
- Clear function/variable naming
- Comments for complex logic
- Error handling for all API calls

---

## 📄 License

## MIT

## 🙋 Support

For questions or issues:

- Email: [support@covu.com]
- GitHub Issues: [repository-url]

---

**Happy Coding! 🚀**
