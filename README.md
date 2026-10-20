# 🌐 Cray Group — ISP Analytics & Management Platform

[![Deploy to GitHub Pages](https://github.com/nhial-james/cray-group-isp-analytics/actions/workflows/deploy.yml/badge.svg)](https://github.com/nhial-james/cray-group-isp-analytics/actions/workflows/deploy.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.3-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-4.1-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

An enterprise-grade telecommunications and Internet Service Provider (ISP) intelligence platform engineered for **Cray Group**. The platform delivers real-time analytics, automated multi-sheet data ingestion, direct billing/RADIUS/MikroTik database connectivity, network base station monitoring, package volume forecasting, and AI-assisted network operations.

---

## 🎨 Official Brand Identity

The interface is styled strictly around Cray Group's corporate brand palette:
* **Primary Deep Navy**: `#243542` — Brand anchor, sidebar, executive summary cards, and dark theme layers.
* **Electric Cyan**: `#3db7e4` — Accent indicators, interactive buttons, chart highlights, live connection badges, and telemetry rings.

---

## 🚀 Key Modules & Capabilities

### 1. 📊 ISP Executive Dashboard
* Real-time network & financial KPIs (Total Revenue, Active Subscribers, Total Bandwidth Consumed, ARPU, Churn Rate).
* Monthly sales trajectory and seasonality forecasting.
* Station-by-station revenue breakdown with interactive tooltips and category comparisons.
* Top voucher and package sales distribution charts.

### 2. 🗄️ Data Hub & Direct Database Link
* **14-Sheet Excel Ingestion**: Full drag-and-drop parsing of multi-sheet workbooks (`Cray-Group-Sales-Analytics-Report.xlsx`) including:
  * Overall Sales & Monthly Trends
  * Base Station & Cross-Station Sales
  * Package Performance & Stickiness
  * Customer Demographics & Lifetime Value
  * Voucher Denominations & Sales Volume
  * Network Health & Outage Logs
* **Direct Database Link**: Connect directly to your ISP management system via:
  * PostgreSQL (Radius / FreeRADIUS billing database)
  * MySQL / MariaDB (Customer CRM & ERP)
  * MikroTik RouterOS REST/API & SNMP collectors
* Live schema explorer and raw tabular dataset viewer with instant CSV export.

### 3. 📦 Packages & Bandwidth Analysis
* Package velocity, volume utilization, and customer retention metrics.
* Pricing optimization matrix and stickiness ratio tracking.
* Bandwidth quota exhaustion alerts and average usage per tier.

### 4. 📡 Base Stations & Hotspot Health
* Live status monitoring for all transmission sites (Uptime, connected clients, backhaul throughput).
* Outage log monitoring and degraded throughput warning thresholds.
* Cross-station sales and geographical traffic volume correlation.

### 5. 👥 Subscribers & CRM Intelligence
* Cohort retention curves and churn probability indicators.
* Top subscriber spending tiers and high-value customer accounts.
* Inactive account diagnostics and re-engagement recommendations.

### 6. 📑 Reports & Direct Downloads
* Generate executive-ready, branded corporate reports with a single click.
* Direct multi-format exports:
  * **Microsoft Excel (`.xlsx`)**: Structured multi-sheet workbook generation.
  * **Microsoft Word (`.docx`)**: Corporate executive summary documents with headers and tables.
  * **Print-Ready PDF (`.pdf`)**: Formatted reports with Cray Group corporate branding.
  * **Structured Data (`.csv` & `.json`)**: Raw data exports for BI tooling.

### 7. 🤖 AI Telecommunications Copilot
* Gemini-powered natural language queries over your network sales and telemetry.
* Instant query answers: *"Which base station generated the highest revenue last month?"*, *"What is our churn risk for 10Mbps unlimited packages?"*.
* Pre-built telecom prompts for capacity planning, pricing suggestions, and anomaly detection.

### 8. ⚙️ System Settings & Administration
* Role-based access control (Admin, Network Engineer, Billing Analyst, Read-Only).
* Brand color customizer with Cray Group palette presets.
* Automated sync intervals, data retention policies, and webhook notification alerts.

---

## 🛠️ Technology Stack

* **Frontend**: React 18 (TypeScript), Vite 6
* **Styling**: Vanilla CSS tokens + Tailwind CSS v4, Radix UI Primitives, Lucide Icons
* **Data Visualizations**: Recharts
* **Spreadsheet Processing**: SheetJS (`xlsx`)
* **CI/CD & Hosting**: GitHub Actions & GitHub Pages

---

## 💻 Local Development Setup

### Prerequisites
* **Node.js**: v18.0.0 or higher
* **npm**: v9.0.0 or higher

### Installation
```bash
# Clone the repository
git clone https://github.com/nhial-james/cray-group-isp-analytics.git
cd cray-group-isp-analytics

# Install dependencies
npm install

# Start local development server
npm run dev
```

The application will be available at `http://localhost:5173/`.

### Production Build
```bash
# Compile and bundle for production
npm run build

# Preview production build locally
npm run preview
```

---

## 🚢 Continuous Deployment (GitHub Actions)

This repository includes automated CI/CD via `.github/workflows/deploy.yml`. Every push to the `main` branch automatically:
1. Checks out the source code and caches dependencies.
2. Runs `npm install` and compiles the production bundle (`npm run build`).
3. Generates SPA fallback routes (`dist/404.html`).
4. Deploys the artifacts to **GitHub Pages**.

---

## 🏢 Organization & Support

* **Organization**: Cray Group Telecommunications
* **Platform**: ISP Analytics & Management Platform
* **Maintainer**: Nhial James ([@nhial-james](https://github.com/nhial-james))