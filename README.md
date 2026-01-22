# 📱 Alma WhatsApp Dashboard

A powerful, real-time analytics dashboard for monitoring WhatsApp groups through the Alma bot ecosystem. Built with React, TypeScript, and Supabase.

![Dashboard Preview](https://img.shields.io/badge/Status-Production-green) ![Version](https://img.shields.io/badge/Version-2.0.0-blue)

## ✨ Features

### 📊 Analytics & Insights
- **Real-time Statistics** - Live message counts, active members, and ghost user tracking
- **Trend Analysis** - Automated calculation of week-over-week changes
- **Activity Charts** - Interactive message activity over 30 days
- **Peak Hours Heatmap** - Visual representation of when groups are most active
- **User Leaderboards** - Top contributors across all groups
- **Message Type Distribution** - Pie charts showing media types breakdown

### 🔍 Advanced Search
- **Global Search** - Search across all messages in all groups
- **Keyword Highlighting** - Visual highlighting of search terms in results
- **Filter Options** - Filter by group, date range, sender, and message type
- **Paginated Results** - Load more functionality for large result sets

### 💬 Conversation Reconstruction
- **Full Chat View** - WhatsApp-style message rendering
- **Infinite Scroll** - Seamless loading of historical messages
- **Real-time Updates** - Supabase Realtime integration for live messages
- **Quote Support** - Visual display of replied-to messages
- **Media Placeholders** - Support for images, videos, audio, documents
- **Forwarding Indicators** - Track message forwarding chains

### 👤 User Profiles
- **Individual Analytics** - Per-user message statistics
- **Activity History** - 30-day activity chart per user
- **Group Participation** - See which groups users are active in
- **Word Frequency** - Most commonly used words analysis
- **Recent Messages** - Quick view of user's recent activity

### 👻 Ghost User Detection
- **Inactive Tracking** - Automatic detection of 30+ day inactive users
- **LID Support** - Full support for WhatsApp's new Linked ID format
- **Visual Indicators** - Phone vs LID identification icons

### 🤖 AI-Powered Summaries
- **OpenAI Integration** - GPT-4o-mini for intelligent summaries
- **Group Summaries** - AI-generated conversation summaries
- **Key Topics** - Automatic topic extraction from discussions

### 📤 Data Export
- **Multiple Formats** - Export to CSV or JSON
- **Flexible Selection** - Choose date ranges and groups
- **Complete Data** - All message fields including LID support

### 🎨 User Experience
- **Dark Theme** - WhatsApp-inspired dark interface
- **Mobile Responsive** - Full functionality on all devices
- **Empty States** - Friendly messaging when no data available
- **Loading States** - Skeleton loaders and spinners

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, React Router v7
- **Styling**: Tailwind CSS 3.4 with custom WhatsApp theme
- **Charts**: Recharts for data visualization
- **Backend**: Supabase (PostgreSQL + Realtime)
- **AI**: OpenAI GPT-4o-mini
- **Build**: Vite 6
- **Deployment**: Vercel

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase project with WhatsApp data
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

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_OPENAI_API_KEY=sk-your-openai-key  # Optional
```

## 📁 Project Structure

```
alma-dashboard/
├── components/
│   ├── charts/               # Analytics chart components
│   │   ├── ActivityChartV2.tsx
│   │   ├── HeatmapChartV2.tsx
│   │   └── UserLeaderboardV2.tsx
│   ├── Chat/                 # Chat-related components
│   │   ├── MessageBubble.tsx
│   │   └── MessageFilter.tsx
│   ├── BotStatus.tsx
│   ├── EmptyState.tsx
│   ├── Layout.tsx
│   ├── Sidebar.tsx
│   └── StatsCard.tsx
├── pages/
│   ├── Dashboard.tsx         # Main overview
│   ├── GroupList.tsx         # Group browser
│   ├── GroupChat.tsx         # Conversation view
│   ├── Search.tsx            # Global search
│   ├── UserProfile.tsx       # User analytics
│   ├── Ghosts.tsx            # Inactive users
│   ├── Summaries.tsx         # AI summaries
│   └── Export.tsx            # Data export
├── services/
│   ├── analyticsService.ts   # Analytics queries
│   ├── dataService.ts        # Data fetching
│   ├── supabase.ts           # Supabase client + Realtime
│   ├── openaiService.ts      # AI integration
│   ├── exportService.ts      # Export utilities
│   └── userUtils.ts          # User identification
├── styles/
│   └── index.css             # Tailwind imports
├── types.ts                  # TypeScript definitions
└── App.tsx                   # Route definitions
```

## 📊 Database Schema

The dashboard expects the following Supabase tables:

### messages
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| message_id | text | WhatsApp message ID |
| group_id | text | Group identifier |
| sender_id | text | Full sender ID |
| sender_number | text | Phone number (nullable) |
| sender_lid | text | Linked ID (nullable) |
| sender_pushname | text | WhatsApp display name |
| body | text | Message content |
| message_type | text | chat, image, video, etc. |
| message_timestamp | timestamp | When sent |
| is_from_me | boolean | Sent by bot |
| has_media | boolean | Contains media |

### group_members
| Column | Type | Description |
|--------|------|-------------|
| user_id | text | User identifier |
| user_number | text | Phone number (nullable) |
| user_lid | text | Linked ID (nullable) |
| group_id | text | Group identifier |
| message_count | integer | Total messages |
| last_message_at | timestamp | Last activity |

### Views

- `v_group_stats` - Aggregated group statistics
- `v_ghost_users` - Users inactive 30+ days

## 🔒 Security

- Uses Supabase Anon Key (not Service Role)
- Row Level Security (RLS) enabled
- No sensitive data exposed to client
- Environment variables for all credentials

## 📦 Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import in Vercel
3. Add environment variables
4. Deploy

### Manual

```bash
npm run build
# Deploy dist/ folder to any static host
```

## 📝 Changelog

See [CHANGELOG.md](./CHANGELOG.md) for version history.

## 📄 License

MIT License - see [LICENSE](./LICENSE)

## 👨‍💻 Author

**Gerardo** - *Alma's God* 🛐

---

Built with ❤️ for the Alma ecosystem
