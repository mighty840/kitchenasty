# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-02-23

Initial release of KitchenAsty — a self-hosted, full-stack restaurant ordering
and management platform.

### Added

#### Ordering & Payments
- Full order lifecycle management (pending, confirmed, preparing, ready, out for delivery, delivered, picked up, cancelled)
- Delivery and pickup order types with per-location configuration
- Guest checkout support (no account required)
- Scheduled/future orders
- Stripe payment integration with webhook-driven status updates
- PayPal payment integration
- Cash on delivery option
- Real-time order tracking via Socket.IO with visual progress steps

#### Menu Management
- Menu items with image uploads (JPEG, PNG, WebP, GIF up to 5 MB)
- Nested category tree with drag-and-drop sort ordering
- Menu item options and modifiers (select, radio, checkbox, quantity) with price modifiers
- Stock tracking with automatic availability toggling
- Allergen tagging with a global allergen registry
- Mealtime availability windows (breakfast, lunch, dinner, etc.)
- Order-type restrictions per item (delivery only, pickup only, etc.)

#### Multi-Location
- Full multi-location support with per-location operating hours
- Busy mode with custom message per location
- Delivery zones with polygon boundaries, delivery charges, and minimum order amounts
- Per-location delivery and pickup settings, lead times, and minimum order amounts

#### Reservations
- Customer reservation booking with time-slot availability and party-size validation
- Reservation workflow: pending, confirmed, seated, completed, cancelled
- Table management with capacity tracking
- Configurable reservation intervals, stay times, and advance booking limits

#### Customer Features
- Customer registration and login with JWT authentication
- Google OAuth 2.0 and Facebook OAuth 2.0 social login
- Customer address book with geocoding fields
- Order history
- Customer groups for segmentation

#### Loyalty & Promotions
- Loyalty points system with earn, redeem, and adjust transactions (100 points = $1)
- Coupon system with percentage, fixed amount, and free delivery types
- Per-coupon usage limits, per-customer limits, max discount caps, and expiry dates

#### Reviews
- 1-5 star customer reviews tied to orders and locations
- Admin moderation with approve/reject workflow

#### Kitchen Display
- Real-time Kanban board (new, confirmed, preparing, ready columns)
- Live updates via Socket.IO
- One-click order status progression

#### Analytics & Dashboard
- Real-time dashboard metrics (orders, revenue, customers, pending items)
- Daily revenue and order trend charts
- Order type and status distribution charts
- Hourly order distribution
- Revenue breakdown by category

#### Automation
- Event-driven rule engine with triggers: order created, order status changed, reservation created, review submitted
- Actions: send email (with template interpolation), fire webhook (HTTP POST), send SMS
- JSON-based condition matching

#### Staff Management
- Three-role system: super admin, manager, staff
- Email invite flow with single-use tokens (7-day expiry)
- Role-based navigation and access control

#### Design & Branding
- Theme customization with primary/secondary colors and full palette generation
- Dark mode support (light, dark, system)
- Landing page hero, features, and CTA editor
- Logo and favicon upload

#### Settings
- Centralized settings for general config, orders, reservations, email/SMTP, payments, reviews, and advanced options
- Database-first configuration with environment variable fallback
- Secret masking for API keys and passwords
- Maintenance mode and rate limiting toggles
- Test email endpoint for SMTP validation

#### Legal & Compliance
- CMS for legal pages (privacy policy, impressum, etc.)
- GDPR-compliant cookie consent with essential, analytics, and marketing categories
- Per-customer consent logging with IP address and user agent

#### Internationalization
- Storefront available in 6 languages: English, Spanish, French, German, Italian, Portuguese
- Language switcher component
- Translation script for adding new locales

#### Mobile App
- Expo/React Native app with file-based routing (Expo Router)
- Bottom tab navigation: home, menu, orders, account
- Menu browsing and item detail views
- Cart and checkout flow
- Real-time order tracking via Socket.IO
- Push notifications for order status updates (Expo Notifications)
- Stripe payment integration via `@stripe/stripe-react-native`
- Social login via `expo-auth-session`
- NativeWind (Tailwind CSS) styling
- Zustand state management
- New Architecture enabled
- iOS tablet support
- EAS Build configured

#### Documentation
- VitePress documentation site with guides, feature docs, API reference, self-hosting instructions, and mobile app docs
- Auto-deployed to GitHub Pages

#### Infrastructure
- TypeScript monorepo with npm workspaces (server, admin, storefront, shared, docs, mobile)
- Shared package with common types, constants, and API response interfaces
- Docker Compose setup with PostgreSQL 16, server, admin, storefront, and docs services
- Multi-stage Dockerfiles for all packages
- Prisma ORM with 20+ models and migrations
- CI pipeline: lint, unit tests, integration tests, E2E tests (Playwright), security audit, and build
- Mobile CI with Android and iOS bundle exports
- 330+ tests across unit, integration, and E2E layers
- Swagger UI API documentation at `/api/docs`
- Helmet security headers, CORS configuration, and rate limiting

#### Community
- MIT license
- Contributing guide, security policy, and code of conduct
- GitHub issue templates (bug report, feature request) and PR template
- Funding configuration

[0.1.0]: https://github.com/mighty840/kitchenasty/releases/tag/v0.1.0
