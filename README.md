# 🏙️ CivicPulse

**CivicPulse** is an open-source civic tech web application that empowers citizens to report local infrastructure issues and track their resolution in real-time — all on an interactive map.

![Tech Stack](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white) ![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase&logoColor=white) ![Leaflet](https://img.shields.io/badge/Leaflet.js-OpenStreetMap-199900?logo=leaflet&logoColor=white) ![Tailwind](https://img.shields.io/badge/Tailwind-CSS-06B6D4?logo=tailwindcss&logoColor=white)

---

## ✨ Features

| Feature | Description |
|---|---|
| 🗺️ **Interactive Map** | Dark-themed CartoDB map that initializes at your geolocation |
| 📍 **Click-to-Report** | Click anywhere on the map to drop a pin and open the report form |
| 🤖 **AI Classification** | Uploaded image is analyzed and a category is auto-suggested |
| 🏷️ **Color-coded Markers** | 🔴 Open · 🟡 In Progress · 🟢 Resolved — updated in real-time |
| 📋 **Status Board** | Searchable, filterable list view of all reports |
| 🔐 **Admin Dashboard** | Kanban board for admins to move reports through the workflow |
| ⚡ **Real-time Updates** | Supabase Realtime keeps the map and dashboard in sync live |
| 📱 **Mobile-first** | Fully responsive — designed for on-site reporting from phones |

---

## 🛠️ Tech Stack

- **Frontend:** React 18 (Vite), Tailwind CSS v3
- **Map:** Leaflet.js + react-leaflet, OpenStreetMap / CartoDB dark tiles
- **Backend:** [Supabase](https://supabase.com) — PostgreSQL + PostGIS, Auth, Storage, Realtime
- **Geocoding:** [Nominatim API](https://nominatim.org/) (reverse geocode map clicks to addresses)
- **AI:** Pluggable image classifier stub (ready for OpenAI Vision / Google Vision)

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project with PostGIS enabled

### 1. Clone & Install

```bash
git clone https://github.com/your-username/civicpulse.git
cd civicpulse
npm install
```

### 2. Environment Variables

```bash
cp .env.example .env
```

Fill in your Supabase credentials in `.env`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Set Up the Database

In your [Supabase SQL Editor](https://supabase.com/dashboard), run the full contents of:

```
supabase/schema.sql
```

This creates:
- `reports` table with PostGIS geometry
- Auto-update triggers for `updated_at` and the `location` column
- Row Level Security policies
- Storage RLS policies for `report-images`
- 3 sample seed reports

### 4. Create Storage Bucket

In **Supabase Dashboard → Storage → New Bucket**:
- Name: `report-images`
- Toggle **Public bucket: ON**

### 5. Run the App

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## 🔐 Admin Access

1. In [Supabase Dashboard → Authentication → Users](https://supabase.com/dashboard), click **Add user → Create new user**
2. Enter your admin email + password
3. Navigate to [http://localhost:5173/login](http://localhost:5173/login) and sign in
4. You'll be redirected to the **Admin Dashboard** at `/admin`

### Admin Workflow

```
Open → In Progress → Resolved
🔴           🟡           🟢
```

Click any report card on the Kanban board to expand it and use the **"Move to..."** button to advance its status. Changes reflect on the public map instantly.

---

## 📁 Project Structure

```
civicpulse/
├── supabase/
│   └── schema.sql          # Full DB schema with PostGIS, RLS, triggers
├── src/
│   ├── services/
│   │   ├── supabase.js     # Supabase client
│   │   ├── reportsService.js   # CRUD + real-time subscriptions
│   │   ├── geocodingService.js # Nominatim reverse geocoding
│   │   └── aiClassifier.js     # AI image classification stub
│   ├── components/
│   │   ├── MapView.jsx         # Interactive Leaflet map
│   │   ├── ReportSidebar.jsx   # Slide-out report submission form
│   │   ├── ReportMarker.jsx    # Color-coded map markers
│   │   ├── Navbar.jsx
│   │   ├── StatusBadge.jsx
│   │   └── ProtectedRoute.jsx
│   ├── pages/
│   │   ├── HomePage.jsx        # Map + sidebar layout
│   │   ├── StatusBoard.jsx     # Public searchable list
│   │   ├── AdminDashboard.jsx  # Kanban admin view
│   │   └── LoginPage.jsx
│   ├── App.jsx                 # Router + layout
│   └── index.css               # Global styles + Tailwind
└── .env.example
```

---

## 🧠 AI Classification

The `src/services/aiClassifier.js` module is a **drop-in stub** ready to be upgraded. To connect a real Vision API, replace the `classifyImage()` function body with an API call:

```js
// Example: OpenAI GPT-4o Vision
const response = await openai.chat.completions.create({
  model: 'gpt-4o',
  messages: [{
    role: 'user',
    content: [
      { type: 'text', text: 'Classify this infrastructure issue into: Pothole, Sanitation, Streetlight, Flooding, Vandalism, or Other.' },
      { type: 'image_url', image_url: { url: base64DataUrl } }
    ]
  }]
})
```

---

## 📜 Database Schema (Summary)

```sql
reports (
  id UUID, created_at, updated_at,
  title TEXT, description TEXT,
  category TEXT,   -- Pothole | Sanitation | Streetlight | Flooding | Vandalism | Other
  status TEXT,     -- Open | In Progress | Resolved
  address TEXT, lat FLOAT, lng FLOAT,
  location GEOGRAPHY(Point, 4326),  -- PostGIS spatial column
  image_url TEXT, reported_by TEXT
)
```

---

## 🤝 Contributing

Pull requests welcome! Please open an issue first to discuss major changes.

---

## 📄 License

MIT — free to use, modify, and deploy for civic good.
