# for manager testing use this credentials for manager role sign in
manager@clinicflow.com
manager@123 (if doesnt work try with a capital M)


# ClinicFlow — Clinic Management System

ClinicFlow is a secure, role-based, multi-user healthcare workflow platform. It digitizes operations by centralizing client scheduling, doctor consultations, receptionist queue management, medical histories, prescription handling, laboratory test bookings, lab result distribution, and manager dashboards.

## 🚀 Key Features

* **Authentication & Access Rules**: Secure auth using Supabase SSR, cookie session persistence, and custom routing middleware.
* **Role-Based Access Control (RBAC)**: Custom dashboards and views tailored to five distinct user roles:
  * **Client**: Book consultations, schedule lab tests, view personal medical logs, and download prescription PDFs.
  * **Doctor**: Manage consultations queue, write digital prescriptions, order diagnostics, and edit clinical summaries.
  * **Receptionist**: Patient check-ins, front-desk queue coordination, client registrations, and billing invoices.
  * **Lab Manager**: Supervise diagnostic schedules, toggle test availabilities, and upload result attachments.
  * **Manager**: Audit logs comparison viewer, staff configurations, inventory assets, service pricing, and analytics charts.
* **Cloudinary CDN Integration**: Streamed file uploads for doctor photos, resource assets, client avatars, prescriptions, invoices, and lab results.
* **SEO & Metadata**: Robots.txt configurations, nested dynamic sitemaps (`sitemap.xml` and `/page/sitemap.xml`), JSON-LD structured medical schemas, and LLM text files (`llms.txt`, `ai.txt`).
* **Route Protection Middleware**: Intercepts unauthorized dashboard paths in a dedicated edge proxy layer and returns a custom styled **403 Forbidden** page.

---

## 📂 Project Structure

```
clinic-management-system/
├── app/                        # Next.js App Router root
│   ├── (auth)/                 # Login, Register, Forgot Password, and Reset Password views
│   ├── (dashboard)/            # Collapsible role-based portals
│   │   ├── client/             # Patient scheduling, invoicing, and reports views
│   │   ├── doctor/             # Consultation queue, patient timeline, and scheduler
│   │   ├── lab-manager/        # Diagnostic service catalogs and result uploads
│   │   ├── manager/            # Finance ledger, audit logs, staff roster, and analytics
│   │   └── receptionist/       # Front-desk check-in desk and client directory
│   ├── about/                  # Public about page
│   ├── api/                    # Serverless REST endpoints for users, clients, and doctors
│   ├── auth/                   # Redirect handler for confirmation links
│   ├── icon.png                # Dynamic Next.js favicon asset
│   ├── layout.tsx              # Root HTML wrapper with theme providers and global alerts
│   ├── page.tsx                # Public homepage with diagnostics catalog and services
│   ├── robots.ts               # Robots.txt crawler instructions
│   └── sitemap.ts              # Primary XML sitemap configuration
├── components/                 # Shared UI elements
│   ├── layout/                 # Navigation bars, collapsible sidebars, and desktop headers
│   └── ui/                     # Forms, selectors, theme togglers, and buttons
├── hooks/                      # Custom React hooks (theme, viewport matches)
├── lib/                        # Service integrations
│   ├── supabase/               # Browser, server, and client DB initialization wrappers
│   ├── cloudinary.ts           # Photo and PDF asset storage helper
│   ├── invoice-pdf.ts          # Invoice PDF layout and buffer compiler
│   └── services/               # Profiles query and update APIs
├── public/                     # Static assets (images, pdfs, robots.txt, llms.txt, ai.txt)
├── supabase/                   # Database schemas and triggers
│   ├── sqls/                   # Idempotent profiles, resource, and billing setups
│   └── functions/              # Onboarding notifications Deno edge functions
├── proxy.ts                    # Edge routing middleware with 403 error page
├── package.json                # Project dependencies and script runner configurations
└── tsconfig.json               # TypeScript configuration parameters
```

---

## 🛠️ Installation & Execution

1. **Clone & Install**:
   ```bash
   cd clinic-management-system
   npm install
   ```

2. **Configure Environment Variables**:
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
   CLOUDINARY_API_KEY=your-cloudinary-api-key
   CLOUDINARY_API_SECRET=your-cloudinary-api-secret
   ```

3. **Start Development Server**:
   ```bash
   npm run dev
   ```

4. **Compile Production Bundle**:
   ```bash
   npm run build
   ```
