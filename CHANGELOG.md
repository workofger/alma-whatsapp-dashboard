# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-01-22

### Added
- **Dashboard Overview**: Real-time statistics with message counts, active groups, and user metrics
- **Groups Management**: View all monitored WhatsApp groups with member counts and activity stats
- **Reconstructed Conversations**: WhatsApp-style chat interface with message rendering
  - Support for text, media indicators, and quoted messages
  - Message filtering by sender, type, and date range
  - Pagination with "load more" functionality
- **Analytics Dashboard**:
  - Activity chart showing messages over time
  - Peak hours heatmap visualization
  - User leaderboard with top contributors
  - Message types distribution pie chart
- **AI Summaries**: Generate daily/weekly conversation summaries using OpenAI GPT-4
- **Ghost Users Detection**: Identify and list inactive users (30+ days)
- **Data Export**: Download messages, members, or ghost users in CSV/JSON format
- **Bot Status Widget**: Real-time observability showing:
  - Online/offline status
  - Messages per hour/day
  - Last message timestamp
- **Mobile Responsive Design**: Collapsible sidebar and optimized layouts for mobile devices
- **Dark Theme**: WhatsApp-inspired dark mode with custom color palette

### Technical
- Built with React 18 and TypeScript
- Vite for fast development and optimized builds
- Tailwind CSS for styling
- Recharts for data visualizations
- Supabase for database connectivity
- OpenAI API integration for AI features
- React Router for client-side routing

### Infrastructure
- Vercel deployment configuration
- Environment variable management
- Proper TypeScript types for database schemas

---

## [Unreleased]

### Planned
- Real-time message updates via Supabase subscriptions
- User authentication and authorization
- Cached AI summaries storage
- Webhook integration for bot status
- Dark/light theme toggle
- Message search across all groups
- Custom date range analytics
- PDF export for summaries
