# 📱 Alma Dashboard

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/workofger/alma-whatsapp-dashboard)

A powerful, real-time analytics dashboard for monitoring WhatsApp groups through the Alma bot ecosystem. Built with React, TypeScript, and Supabase.

![Alma Dashboard](https://img.shields.io/badge/Status-Production-green) ![Version](https://img.shields.io/badge/Version-2.1.0-blue) ![License](https://img.shields.io/badge/License-MIT-yellow)

## ✨ Features

### 📊 Dashboard Overview
- **Real-time Statistics** - Live message counts, active members, and trend analysis
- **Activity Charts** - Interactive message activity visualization over 30 days
- **Peak Hours Heatmap** - See when your groups are most active
- **User Leaderboards** - Top contributors with message counts
- **Message Type Distribution** - Breakdown of text, media, and other types

### 📈 Advanced Analytics
- **Date Range Filters** - Analyze 7, 30, 90 days or custom ranges
- **Group Comparison** - Compare activity between two groups side-by-side
- **Detailed Metrics** - Avg messages/day, peak hours, most/least active days
- **Per-user Statistics** - Average messages per user calculations

### 🔍 Global Search
- **Cross-group Search** - Find messages across all monitored groups
- **Keyword Highlighting** - Visual highlighting of search terms
- **Advanced Filters** - Filter by group, date range, sender
- **Paginated Results** - Efficient browsing of large result sets

### 💬 Conversation View
- **WhatsApp-style UI** - Familiar chat interface
- **Infinite Scroll** - Seamless message loading
- **Real-time Updates** - Live message delivery via Supabase Realtime
- **Message Filtering** - Filter by sender, type, date
- **Quote Support** - Display replied-to messages

### 👤 User Profiles
- **Individual Analytics** - Per-user message statistics
- **Activity History** - 30-day activity chart
- **Group Participation** - See which groups users are active in
- **Word Frequency** - Most commonly used words analysis

### 👻 Ghost User Detection
- **Inactive Tracking** - Automatic detection of 30+ day inactive users
- **WhatsApp LID Support** - Full support for new Linked ID format
- **Visual Indicators** - Phone vs LID identification

### 🤖 AI-Powered Summaries
- **OpenAI Integration** - GPT-4o-mini for intelligent summaries
- **Group Summaries** - AI-generated conversation highlights
- **Key Topics Extraction** - Automatic topic identification

### 📤 Data Export
- **PDF Reports** - Professional formatted reports with stats and charts
- **CSV Export** - Spreadsheet-compatible data export
- **JSON Export** - Developer-friendly format
- **Flexible Selection** - Choose date ranges and specific groups

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| Frontend | React 19, TypeScript, React Router v7 |
| Styling | Tailwind CSS 3.4 with custom WhatsApp theme |
| Charts | Recharts |
| PDF | jsPDF + html2canvas |
| Backend | Supabase (PostgreSQL + Realtime) |
| AI | OpenAI GPT-4o-mini |
| Build | Vite 6 |
| Deployment | Vercel |

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Supabase project with WhatsApp message data
- OpenAI API key (optional, for AI summaries)

### Installation

```bash
# Clone the repository
git clone https://github.com/workofger/alma-whatsapp-dashboard.git
cd alma-whatsapp-dashboard

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your credentials

# Start development server
npm run dev
```

### Environment Variables

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_OPENAI_API_KEY=sk-your-openai-key  # Optional
```

## 📁 Project Structure

```
alma-dashboard/
├── components/
│   ├── charts/               # Chart components (Activity, Heatmap, Leaderboard)
│   ├── Chat/                 # Chat components (MessageBubble, Filter)
│   ├── BotStatus.tsx         # Bot connection status
│   ├── EmptyState.tsx        # Empty state displays
│   ├── ExportPdfModal.tsx    # PDF export modal
│   ├── Layout.tsx            # App layout
│   ├── Sidebar.tsx           # Navigation sidebar
│   └── StatsCard.tsx         # Statistics cards
├── pages/
│   ├── Analytics.tsx         # Advanced analytics with filters
│   ├── Dashboard.tsx         # Main overview
│   ├── Export.tsx            # Data export (CSV/JSON/PDF)
│   ├── Ghosts.tsx            # Inactive users
│   ├── GroupChat.tsx         # Conversation view
│   ├── GroupList.tsx         # Group browser
│   ├── Search.tsx            # Global search
│   ├── Summaries.tsx         # AI summaries
│   └── UserProfile.tsx       # User analytics
├── services/
│   ├── analyticsService.ts   # Analytics queries
│   ├── dataService.ts        # Data fetching
│   ├── exportService.ts      # CSV/JSON export
│   ├── openaiService.ts      # AI integration
│   ├── pdfService.ts         # PDF generation
│   ├── supabase.ts           # Supabase client + Realtime
│   └── userUtils.ts          # User identification utilities
├── styles/
│   └── index.css             # Tailwind imports
├── types.ts                  # TypeScript definitions
└── App.tsx                   # Route definitions
```

## 📊 Database Schema

The dashboard expects these Supabase tables/views:

### messages
- `message_id`, `group_id`, `sender_id`
- `sender_number`, `sender_lid` (WhatsApp LID support)
- `sender_pushname`, `body`, `message_type`
- `message_timestamp`, `is_from_me`, `has_media`

### group_members
- `user_id`, `user_number`, `user_lid`
- `group_id`, `message_count`, `last_message_at`

### Views
- `v_group_stats` - Aggregated group statistics
- `v_ghost_users` - Users inactive 30+ days

## 🚀 Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import in [Vercel](https://vercel.com)
3. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_OPENAI_API_KEY` (optional)
4. Deploy

### Manual

```bash
npm run build
# Deploy dist/ folder to any static host
```

## 🔒 Security

- Uses Supabase Anon Key (not Service Role)
- Row Level Security (RLS) compatible
- No sensitive data exposed to client
- Environment variables for all credentials

## 📝 Changelog

See [CHANGELOG.md](./CHANGELOG.md) for version history.

## 📄 License

MIT License - see [LICENSE](./LICENSE)

## 👨‍💻 Author

**Gerardo** - *Alma's God* 🛐

---

Built with ❤️ for the Alma ecosystem
