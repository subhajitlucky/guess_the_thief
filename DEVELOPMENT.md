# 🛠️ Development Guide

## 📊 **Current Progress: 68%**

### **🎯 Development Status**
- **Active Phase:** Role Assignment System (Phase 3)
- **Next Phase:** Game Mechanics (Phase 4)
- **Estimated Completion:** Q1 2025

---

## 🗂️ **File Structure Deep Dive**

```
guess_the_thief/
├── 📁 client/                  # Frontend React App
│   ├── 📄 package.json        # React dependencies
│   ├── 📄 vite.config.js      # Vite build config
│   └── 📁 src/
│       ├── 📄 App.jsx          # Main app router
│       ├── 📄 main.jsx         # React entry point
│       ├── 📁 components/      # Reusable components
│       │   └── 📄 UsernameForm.jsx
│       ├── 📁 pages/           # Route-based pages
│       │   ├── 📄 RoomOptions.jsx   # Home page
│       │   ├── 📄 CreateRoom.jsx    # Room creation
│       │   ├── 📄 JoinRoom.jsx      # Room joining
│       │   ├── 📄 RoomLobby.jsx     # Multiplayer lobby
│       │   └── 📄 GamePage.jsx      # Game interface
│       └── 📁 styles/          # Component-specific CSS
├── 📁 server/                  # Backend Node.js
│   ├── 📄 package.json        # Server dependencies
│   └── 📄 index.js            # Socket.IO server
├── 📁 .github/workflows/      # GitHub Actions
└── 📄 package.json            # Root project scripts
```

---

## 🔧 **Development Commands**

```bash
# 🚀 Quick Development
npm run dev                    # Start both client & server
npm run client                 # Start only frontend
npm run server                 # Start only backend

# 📦 Installation
npm run install:all           # Install all dependencies
npm install                   # Install root dependencies

# 🏗️ Building
npm run build                 # Build client for production
```

---

## 🌐 **Socket.IO Events**

| Event | Direction | Purpose | Data |
|-------|-----------|---------|------|
| `set-username` | Client → Server | Set player username | `{ username }` |
| `create-room` | Client → Server | Create new room | `{ roomCode, username }` |
| `join-room` | Client → Server | Join existing room | `{ roomCode, username }` |
| `toggle-ready` | Client → Server | Toggle ready status | `{ roomCode, username }` |
| `start-game` | Client → Server | Start game (host only) | `{ roomCode }` |
| `lobby-update` | Server → Client | Real-time lobby state | `{ players, host, canStart }` |
| `game-started` | Server → Client | Game start notification | `{ roomCode, players }` |
| `room-error` | Server → Client | Error messages | `{ message }` |

---

## 🎯 **Next Development Tasks**

### **🚧 Immediate (Phase 3)**
1. **Create `RoleAssignment.jsx`**
   ```jsx
   // client/src/components/RoleAssignment.jsx
   - Spinning wheel animation
   - Role distribution logic
   - Private role reveal
   ```

2. **Backend Role Logic** 
   ```javascript
   // server/index.js
   - Role shuffling algorithm
   - Private role assignment
   - Game state management
   ```

### **📋 Upcoming (Phase 4)**
1. **Game Mechanics Components**
   - `KingPhase.jsx` - Police identification
   - `PolicePhase.jsx` - Thief detection
   - `GameResult.jsx` - Results display

---

## 🔍 **Code Quality Standards**

### **React Best Practices**
- ✅ Functional components with hooks
- ✅ Props validation with JSDoc
- ✅ Component-specific CSS files
- ✅ Consistent file naming (PascalCase)

### **Node.js Standards**
- ✅ Express.js for HTTP server
- ✅ Socket.IO for real-time features
- ✅ Error handling for all events
- ✅ Input validation

### **Styling Guidelines**
- ✅ Mobile-first responsive design
- ✅ CSS3 custom properties
- ✅ Consistent color scheme
- ✅ Modular CSS approach

---

## 🐛 **Common Development Issues**

| Issue | Solution |
|-------|----------|
| **Socket not connecting** | Check server is running on port 4000 |
| **CORS errors** | Verify client URL in server CORS config |
| **Hot reload not working** | Restart Vite dev server |
| **Room codes not working** | Check uppercase conversion |

---

## 📈 **Performance Metrics**

| Metric | Current | Target | Status |
|--------|---------|---------|--------|
| **Bundle Size** | ~200KB | <500KB | ✅ Good |
| **Load Time** | <2s | <3s | ✅ Good |
| **Socket Latency** | <100ms | <200ms | ✅ Good |
| **Memory Usage** | ~30MB | <100MB | ✅ Good |

---

## 🚀 **Deployment Checklist**

### **Pre-Deployment**
- [ ] Environment variables configured
- [ ] Production CORS settings
- [ ] Error logging setup
- [ ] Build optimization
- [ ] Security headers

### **Deployment Platforms**
- **Frontend:** Vercel, Netlify, GitHub Pages
- **Backend:** Railway, Heroku, DigitalOcean
- **Database:** MongoDB Atlas (future)

---

## 👥 **Contributing Guidelines**

1. **Check Roadmap:** Review current phase in `ROADMAP.md`
2. **Follow Structure:** Match existing file organization
3. **Code Style:** Use ESLint and Prettier
4. **Testing:** Add tests for new features
5. **Documentation:** Update progress tracking

---

*Last Updated: December 2024* 