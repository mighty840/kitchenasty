import { defineConfig } from 'vitepress'

const base = process.env.VITEPRESS_BASE || '/'

export default defineConfig({
  title: 'KitchenAsty',
  description: 'Self-hosted restaurant ordering platform — documentation',
  base,

  ignoreDeadLinks: [
    /localhost/,
  ],

  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: `${base}logo.svg` }],
  ],

  themeConfig: {
    logo: '/logo.svg',

    nav: [
      { text: 'Guide', link: '/guide/introduction' },
      { text: 'Self-Hosting', link: '/self-hosting/overview' },
      { text: 'Mobile App', link: '/mobile-app/overview' },
      { text: 'API', link: '/api/overview' },
      {
        text: 'More',
        items: [
          { text: 'Configuration', link: '/configuration/environment-variables' },
          { text: 'Architecture', link: '/architecture/project-structure' },
          { text: 'Deployment', link: '/deployment/docker' },
          { text: 'Contributing', link: '/contributing/development-setup' },
          { text: 'GitHub', link: 'https://github.com/kitchenasty/kitchenasty' },
          { text: 'Swagger UI', link: 'http://localhost:3000/api/docs' },
        ],
      },
    ],

    sidebar: {
      '/guide/': [
        {
          text: 'Getting Started',
          items: [
            { text: 'Introduction', link: '/guide/introduction' },
            { text: 'Live Demo', link: '/guide/live-demo' },
            { text: 'Requirements', link: '/guide/requirements' },
            { text: 'Install with Docker', link: '/guide/installation-docker' },
            { text: 'Install Manually', link: '/guide/installation-manual' },
            { text: 'Quick Start', link: '/guide/quick-start' },
          ],
        },
      ],
      '/configuration/': [
        {
          text: 'Configuration',
          items: [
            { text: 'Environment Variables', link: '/configuration/environment-variables' },
            { text: 'Database', link: '/configuration/database' },
            { text: 'Authentication', link: '/configuration/authentication' },
            { text: 'Payments', link: '/configuration/payments' },
            { text: 'Email & SMS', link: '/configuration/email-sms' },
            { text: 'Social Login', link: '/configuration/social-login' },
            { text: 'File Uploads', link: '/configuration/file-uploads' },
            { text: 'CORS & Security', link: '/configuration/cors-security' },
          ],
        },
      ],
      '/features/': [
        {
          text: 'Features',
          items: [
            { text: 'Menu Management', link: '/features/menu-management' },
            { text: 'Ordering', link: '/features/ordering' },
            { text: 'Reservations', link: '/features/reservations' },
            { text: 'Reviews', link: '/features/reviews' },
            { text: 'Kitchen Display', link: '/features/kitchen-display' },
            { text: 'Coupons', link: '/features/coupons' },
            { text: 'Loyalty Program', link: '/features/loyalty' },
            { text: 'Internationalization', link: '/features/i18n' },
            { text: 'Automation', link: '/features/automation' },
            { text: 'Analytics', link: '/features/analytics' },
            { text: 'Image Uploads', link: '/features/image-uploads' },
            { text: 'Staff Management', link: '/features/staff-management' },
            { text: 'Settings', link: '/features/settings' },
          ],
        },
      ],
      '/api/': [
        {
          text: 'API Reference',
          items: [
            { text: 'Overview', link: '/api/overview' },
            { text: 'Authentication', link: '/api/authentication' },
            { text: 'Locations', link: '/api/locations' },
            { text: 'Menu', link: '/api/menu' },
            { text: 'Orders', link: '/api/orders' },
            { text: 'Payments', link: '/api/payments' },
            { text: 'Reservations', link: '/api/reservations' },
            { text: 'Coupons', link: '/api/coupons' },
            { text: 'Reviews', link: '/api/reviews' },
            { text: 'Dashboard', link: '/api/dashboard' },
            { text: 'Loyalty', link: '/api/loyalty' },
            { text: 'Automation', link: '/api/automation' },
            { text: 'Staff', link: '/api/staff' },
            { text: 'Settings', link: '/api/settings' },
          ],
        },
      ],
      '/architecture/': [
        {
          text: 'Architecture',
          items: [
            { text: 'Project Structure', link: '/architecture/project-structure' },
            { text: 'Database Schema', link: '/architecture/database-schema' },
            { text: 'Real-Time Events', link: '/architecture/real-time-events' },
            { text: 'Middleware', link: '/architecture/middleware' },
          ],
        },
      ],
      '/deployment/': [
        {
          text: 'Deployment',
          items: [
            { text: 'Docker', link: '/deployment/docker' },
            { text: 'Manual', link: '/deployment/manual' },
            { text: 'CI / CD', link: '/deployment/ci-cd' },
            { text: 'Scaling', link: '/deployment/scaling' },
          ],
        },
      ],
      '/contributing/': [
        {
          text: 'Contributing',
          items: [
            { text: 'Development Setup', link: '/contributing/development-setup' },
            { text: 'Testing', link: '/contributing/testing' },
            { text: 'Code Style', link: '/contributing/code-style' },
            { text: 'Pull Requests', link: '/contributing/pull-requests' },
          ],
        },
      ],
      '/self-hosting/': [
        {
          text: 'Self-Hosting Guide',
          items: [
            { text: 'Overview', link: '/self-hosting/overview' },
            { text: 'Server Setup', link: '/self-hosting/server-setup' },
            { text: 'Docker Compose Production', link: '/self-hosting/docker-compose' },
            { text: 'Domain & DNS', link: '/self-hosting/domain-dns' },
            { text: 'Reverse Proxy & SSL', link: '/self-hosting/reverse-proxy-ssl' },
            { text: 'Backups', link: '/self-hosting/backups' },
            { text: 'Maintenance', link: '/self-hosting/maintenance' },
          ],
        },
      ],
      '/mobile-app/': [
        {
          text: 'Mobile App',
          items: [
            { text: 'Overview', link: '/mobile-app/overview' },
            { text: 'Developer Accounts', link: '/mobile-app/developer-accounts' },
            { text: 'App Configuration', link: '/mobile-app/app-configuration' },
            { text: 'Local Development', link: '/mobile-app/local-development' },
            { text: 'EAS Build Setup', link: '/mobile-app/eas-build' },
            { text: 'Building for Android', link: '/mobile-app/build-android' },
            { text: 'Building for iOS', link: '/mobile-app/build-ios' },
            { text: 'Store Listings', link: '/mobile-app/store-listings' },
            { text: 'Push Notifications', link: '/mobile-app/push-notifications' },
            { text: 'Updates & Maintenance', link: '/mobile-app/updates' },
          ],
        },
      ],
      '/legal/': [
        {
          text: 'Legal',
          items: [
            { text: 'License', link: '/legal/license' },
            { text: 'Privacy Policy', link: '/legal/privacy-policy' },
            { text: 'Impressum', link: '/legal/impressum' },
          ],
        },
      ],
    },

    search: {
      provider: 'local',
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/mighty840/kitchenasty' },
    ],

    editLink: {
      pattern: 'https://github.com/mighty840/kitchenasty/edit/main/packages/docs/:path',
      text: 'Edit this page on GitHub',
    },

    footer: {
      message: `Released under the <a href="${base}legal/license.html">MIT License</a>. <a href="${base}legal/privacy-policy.html">Privacy Policy</a> · <a href="${base}legal/impressum.html">Impressum</a>`,
      copyright: 'Copyright &copy; 2025 KitchenAsty Contributors',
    },
  },
})
