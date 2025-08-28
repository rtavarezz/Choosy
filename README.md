# Choosy 🎉

> **The future of group decision-making**  
> Plan events together, vote with style, discover amazing local experiences.

A modern group decision-making platform that makes planning activities with friends effortless and fun. No more endless group chats trying to decide where to go!

## ✨ Features

- 🗳️ **Smart Group Voting** - Choose between single-card or multi-card carousel interfaces
- 🎬 **Multiple Voting Styles** - Single-card focus OR multi-card carousel preview
- 🌍 **Real Event Discovery** - Live events from Eventbrite, Meetup, and local APIs  
- 📱 **Mobile-First Design** - Responsive interface that works everywhere
- ⚡ **Real-Time Results** - See votes update instantly across all devices
- 🎯 **Location-Based** - Find events and activities near you
- 🏆 **Gamification** - Points, achievements, and streaks for active voters
- 🤖 **AI Recommendations** - Learns your preferences over time

## 🚀 **5-Second Setup**

**Prerequisites**: Python 3.8+ and Node.js 16+

```bash
# Clone the repository
git clone https://github.com/rtavarezz/choosy.git
cd choosy

# Launch everything with one command! 🎊
python3 start_choosy.py
```

**That's it!** The script will:
- ✅ Check all dependencies 
- 📦 Set up virtual environments
- 🔧 Install Python and Node.js packages
- 🗄️ Initialize the SQLite database
- 🚀 Start both backend and frontend servers
- 🌈 Show beautiful colored progress updates

**Open your browser:**
- 🌐 **Frontend**: http://localhost:3000 (main app)
- 📊 **Backend API**: http://localhost:8000 (API docs)

## 🔧 Manual Setup (If Needed)

<details>
<summary>Click to expand manual setup instructions</summary>

### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python init_sqlite.py     # Initialize database
python start_server.py    # Start backend
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

</details>

## ⚙️ Configuration (Optional)

Choosy works out of the box with mock data, but for **real live events**, get these free API keys:

### 1. Copy Environment Files
```bash
# Backend environment (for API keys)
cp backend/main.env.example backend/main.env

# Frontend environment (for local development)  
cp frontend/.env.example frontend/.env.local
```

### 2. Get API Keys (Free Tiers Available)

**Eventbrite API** (Recommended - Global Events)
- Get it: https://www.eventbrite.com/platform/api-keys
- Free: 10,000 requests/day
- Add to `backend/main.env`: `EVENTBRITE_API_KEY=your_key_here`

**Unsplash API** (For Beautiful Event Images)
- Get it: https://unsplash.com/developers
- Free: 1,000 requests/hour
- Add to `backend/main.env`: `UNSPLASH_ACCESS_KEY=your_key_here`

**Optional APIs** (for more event sources):
- **Meetup**: https://www.meetup.com/api/
- **Ticketmaster**: https://developer.ticketmaster.com/

> **Note**: Without API keys, Choosy uses local mock data and placeholder images. Perfect for testing and development!

## 📱 How It Works

1. **Create a Plan** - Choose your vibe: nightlife, food, concerts, adventures, etc.
2. **Invite Friends** - Share a simple link, no account required
3. **Swipe to Vote** - Everyone swipes right (❤️) or left (❌) on activities  
4. **See Results** - Real-time winner with booking integration

## 🔧 Troubleshooting

**Port already in use?**
```bash
# Kill processes on ports 3000 and 8000
lsof -ti:3000 | xargs kill -9
lsof -ti:8000 | xargs kill -9
```

**Python/Node.js not found?**
- Install Python 3.8+: https://python.org/downloads/
- Install Node.js 16+: https://nodejs.org/download/

**Permission errors on macOS/Linux?**
```bash
chmod +x start_choosy.py
chmod +x launch.sh
```

**Still having issues?**
- Check `choosy-backend.log` and `choosy-frontend.log` for error details
- Open an [issue](https://github.com/rtavarezz/choosy/issues) with your error logs

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, Framer Motion
- **Backend**: FastAPI, SQLAlchemy, SQLite/PostgreSQL
- **Real-time**: WebSockets, Redis caching
- **APIs**: Eventbrite, Meetup, Ticketmaster, Unsplash
- **Deployment**: Docker, Vercel, Railway

## 🎯 Project Status

- ✅ **MVP Complete** - Full end-to-end functionality
- ✅ **Mobile Responsive** - Works on all devices
- ✅ **Real-time Voting** - Live updates across browsers  
- ✅ **Event Integration** - Live API data
- 🚧 **Authentication** - Phone verification (optional)
- 🚧 **Push Notifications** - Vote reminders
- 💭 **AI Recommendations** - Learning user preferences

## 🤝 Contributing

We'd love your help! Please read our [CONTRIBUTING.md](CONTRIBUTING.md) for:
- Code contribution guidelines
- Legal requirements (CLA)
- Development standards
- Community guidelines

## 🔒 Security

Found a security issue? Please review our [Security Policy](SECURITY.md) for responsible disclosure.

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

**Built with ❤️ by [rtavarezz](https://github.com/rtavarezz)**  
*Making group decisions fun again!*