# Alma WhatsApp Dashboard

<div align="center">
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5.3-3178C6?style=flat-square&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-5-646CFF?style=flat-square&logo=vite" alt="Vite" />
  <img src="https://img.shields.io/badge/Tailwind-3.4-06B6D4?style=flat-square&logo=tailwindcss" alt="Tailwind" />
  <img src="https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=flat-square&logo=supabase" alt="Supabase" />
</div>

<div align="center">
  <h3>A powerful dashboard for monitoring WhatsApp groups captured by the Alma bot</h3>
  <p>Real-time analytics • AI-powered summaries • Beautiful dark UI</p>
</div>

---

## Overview

Alma Dashboard is a web application that provides insights and analytics for WhatsApp groups monitored by the [Alma bot](https://github.com/gera-viern/whatsapp-catcher). It connects to a Supabase database where the bot stores captured messages and member data.

### Architecture

```
┌─────────────────────┐     ┌─────────────────────┐     ┌─────────────────────┐
│   WhatsApp Bot      │     │   Supabase          │     │   Alma Dashboard    │
│   (Railway)         │────▶│   PostgreSQL        │◀────│   (Vercel)          │
│                     │     │                     │     │                     │
│   - Captures msgs   │     │   - messages table  │     │   - View chats      │
│   - Syncs members   │     │   - group_members   │     │   - Analytics       │
│   - Stores data     │     │   - SQL views       │     │   - AI summaries    │
└─────────────────────┘     └─────────────────────┘     └─────────────────────┘
```

## Features

### 📊 Dashboard Overview
- Real-time message counts and activity metrics
- Active groups and monitored users statistics
- Ghost users (inactive members) tracking

### 💬 Reconstructed Conversations
- WhatsApp-style chat interface
- Support for text, media, and quoted messages
- Advanced filtering by sender, message type, and date range
- Pagination with "load more" functionality

### 📈 Analytics
- **Activity Chart**: Messages over time (last 30 days)
- **Peak Hours Heatmap**: Visualize when groups are most active
- **User Leaderboard**: Top contributors ranking
- **Message Types**: Distribution of text vs. media messages

### 🤖 AI Summaries
- Generate daily or weekly conversation summaries
- Powered by OpenAI GPT-4
- Identifies key topics, decisions, and action items

### 👻 Ghost Users Detection
- List users inactive for 30+ days
- Track last message date and total contributions

### 📥 Data Export
- Export messages, members, or ghost users
- Choose CSV or JSON format
- Filter by group and date range

### 📡 Bot Status
- Real-time online/offline status
- Messages per hour/day metrics
- Last message timestamp

## Getting Started

### Prerequisites

- Node.js 18+ 
- A Supabase project with the Alma bot database schema
- (Optional) OpenAI API key for AI summaries

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/workofger/alma-whatsapp-dashboard.git
   cd alma-whatsapp-dashboard
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your credentials:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   VITE_OPENAI_API_KEY=sk-your-api-key  # Optional
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open in browser**
   ```
   http://localhost:3000
   ```

## Database Schema

The dashboard expects the following tables in your Supabase database:

### `messages` table
```sql
CREATE TABLE messages (
    id BIGSERIAL PRIMARY KEY,
    message_id TEXT UNIQUE NOT NULL,
    chat_id TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    message_timestamp TIMESTAMPTZ NOT NULL,
    group_name TEXT,
    group_id TEXT,
    sender_id TEXT NOT NULL,
    sender_name TEXT,
    sender_pushname TEXT,
    sender_number TEXT,
    is_from_me BOOLEAN DEFAULT FALSE,
    body TEXT,
    message_type TEXT DEFAULT 'chat',
    mentioned_ids TEXT[] DEFAULT '{}',
    quoted_message_id TEXT,
    is_forwarded BOOLEAN DEFAULT FALSE,
    forwarding_score INTEGER DEFAULT 0,
    has_media BOOLEAN DEFAULT FALSE,
    media_type TEXT,
    media_mimetype TEXT,
    media_filename TEXT,
    media_filesize INTEGER,
    media_content TEXT,
    raw_data JSONB NOT NULL
);
```

### `group_members` table
```sql
CREATE TABLE group_members (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_seen TIMESTAMPTZ,
    group_id TEXT NOT NULL,
    group_name TEXT,
    user_id TEXT NOT NULL,
    user_number TEXT,
    user_name TEXT,
    user_pushname TEXT,
    is_admin BOOLEAN DEFAULT FALSE,
    is_super_admin BOOLEAN DEFAULT FALSE,
    message_count INTEGER DEFAULT 0,
    last_message_at TIMESTAMPTZ,
    CONSTRAINT unique_group_member UNIQUE (group_id, user_id)
);
```

### Required SQL Views
```sql
-- Group statistics view
CREATE VIEW v_group_stats AS
SELECT 
    group_id,
    group_name,
    COUNT(DISTINCT user_id) as member_count,
    COUNT(DISTINCT CASE WHEN is_admin THEN user_id END) as admin_count,
    SUM(message_count) as total_messages,
    MAX(last_message_at) as last_activity
FROM group_members
GROUP BY group_id, group_name;

-- Ghost users view (inactive 30+ days)
CREATE VIEW v_ghost_users AS
SELECT 
    group_name,
    user_number,
    user_pushname,
    message_count,
    last_message_at,
    EXTRACT(DAY FROM NOW() - last_message_at)::INTEGER as days_inactive
FROM group_members
WHERE last_message_at < NOW() - INTERVAL '30 days'
ORDER BY days_inactive DESC;
```

## Deployment

### Deploy to Vercel

1. **Push to GitHub**
   ```bash
   git remote add origin https://github.com/your-username/alma-whatsapp-dashboard.git
   git push -u origin main
   ```

2. **Import to Vercel**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your GitHub repository
   - Framework Preset: **Vite**

3. **Configure Environment Variables**
   In Vercel dashboard → Project Settings → Environment Variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_OPENAI_API_KEY` (optional)

4. **Deploy**
   Vercel will automatically build and deploy your app.

### Build Commands

```bash
# Development
npm run dev

# Production build
npm run build

# Preview production build
npm run preview

# Type check
npm run lint
```

## Project Structure

```
alma-whatsapp-dashboard/
├── index.html              # HTML entry point
├── index.tsx               # React entry point
├── App.tsx                 # Main app with routing
├── types.ts                # TypeScript interfaces
├── components/
│   ├── Layout.tsx          # Main layout with sidebar
│   ├── Sidebar.tsx         # Navigation sidebar
│   ├── StatsCard.tsx       # Statistics card component
│   ├── BotStatus.tsx       # Bot status widget
│   └── Chat/
│       ├── MessageBubble.tsx   # Chat message component
│       └── MessageFilter.tsx   # Filter controls
│   └── charts/
│       ├── ActivityChart.tsx   # Messages over time
│       ├── HeatmapChart.tsx    # Peak hours heatmap
│       └── UserLeaderboard.tsx # Top contributors
├── pages/
│   ├── Dashboard.tsx       # Main dashboard
│   ├── GroupList.tsx       # Groups listing
│   ├── GroupChat.tsx       # Chat view
│   ├── Summaries.tsx       # AI summaries
│   ├── Ghosts.tsx          # Ghost users
│   └── Export.tsx          # Data export
├── services/
│   ├── supabase.ts         # Supabase client
│   ├── dataService.ts      # Data fetching
│   ├── openaiService.ts    # OpenAI integration
│   ├── exportService.ts    # Export functionality
│   └── mockData.ts         # Demo data
└── styles/
    └── index.css           # Tailwind styles
```

## Tech Stack

- **Frontend**: React 18, TypeScript
- **Build Tool**: Vite 5
- **Styling**: Tailwind CSS 3.4
- **Charts**: Recharts
- **Database**: Supabase (PostgreSQL)
- **AI**: OpenAI GPT-4
- **Icons**: Lucide React
- **Date Handling**: date-fns
- **Routing**: React Router 6

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_SUPABASE_URL` | Yes | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Yes | Supabase public anon key |
| `VITE_OPENAI_API_KEY` | No | OpenAI API key for summaries |

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Credits

Created by **Gerardo** - Alma's God 🛐

---

<div align="center">
  <sub>Built with ❤️ for the Alma bot ecosystem</sub>
</div>
