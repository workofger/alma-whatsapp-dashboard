# Changelog

All notable changes to the Alma WhatsApp Dashboard will be documented in this file.

## [2.0.0] - 2026-01-22

### Added

#### Analytics
- **Real Trend Calculations** - Trends now show actual week-over-week percentage changes
- **Analytics Service** - New `analyticsService.ts` with proper SQL aggregations
- **Daily Message Counts** - Efficient fetching for activity charts
- **Hourly Activity Data** - Heatmap data from actual message timestamps
- **Top Users Query** - Proper aggregation for leaderboards
- **Message Type Distribution** - Pie chart data from real counts

#### Search
- **Global Search Page** - Search across all messages in all groups (`/search`)
- **Search Filters** - Filter by group, date range
- **Keyword Highlighting** - Visual highlighting of search terms in results
- **Paginated Results** - Load more functionality for large result sets

#### Real-time Updates
- **Supabase Realtime** - Live message subscriptions in GroupChat
- **New Message Indicator** - Floating badge for new messages
- **Connection Status** - Visual indicator for realtime connection

#### User Profiles
- **User Profile Page** - Individual user analytics (`/user/:id`)
- **User Activity Chart** - 30-day activity visualization per user
- **Group Participation** - List of groups user is active in
- **Word Frequency** - Analysis of most commonly used words
- **Recent Messages** - Quick view of user's recent activity

#### UI/UX Improvements
- **Infinite Scroll** - IntersectionObserver-based loading in GroupChat
- **Empty States** - Friendly messaging throughout the app
- **Enhanced Charts** - V2 chart components with better styling
- **User Leaderboard V2** - Progress bars, rank icons, last activity
- **Heatmap V2** - Proper day/hour grid with color legend
- **Activity Chart V2** - Area chart with statistics summary
- **Clickable Usernames** - Link to user profiles from messages
- **Search in Group List** - Filter groups by name
- **Enhanced Stats Cards** - Support for links, subtitles, trend icons

### Changed

- **Removed Debug Logs** - Cleaned up console.log statements for production
- **Updated StatsCard** - Added link support, better trend display
- **Updated MessageBubble** - Added highlight support, clickable usernames
- **Updated Sidebar** - Added Search navigation item
- **Improved GroupChat** - Added realtime updates, infinite scroll

### Fixed

- **Hardcoded Trends** - Now calculated from actual historical data
- **Message Limit** - Removed artificial 100 message cap in analytics
- **Router Links** - All links now use proper React Router paths

## [1.0.0] - 2026-01-21

### Added

- Initial release of Alma WhatsApp Dashboard
- Dashboard with overview statistics
- Group list with member/message counts
- Conversation reconstruction with WhatsApp styling
- Message filtering by sender, type, date
- Ghost user detection (30+ day inactive)
- AI summaries with OpenAI GPT-4o-mini
- Data export to CSV/JSON
- WhatsApp LID format support
- Mobile responsive design
- Tailwind CSS styling
- Supabase integration
- Vercel deployment configuration

### Technical

- React 19 with TypeScript
- Vite 6 build system
- React Router v7
- Recharts for visualizations
- date-fns for date handling
- Lucide React for icons

---

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
