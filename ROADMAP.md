# 🎮 Guess the Thief - Development Roadmap

## 📋 Project Overview
A real-time multiplayer game where 4 players are assigned secret roles (King, Queen, Police, Thief) and the Police must identify the Thief through social deduction.

---

## 🏗️ PHASE 1: PROJECT FOUNDATION ✅ COMPLETED
- [x] Set up Node.js/Express/Socket.IO server
- [x] Set up React/Vite client 
- [x] Establish basic client-server connection
- [x] Install all dependencies

---

## 🚪 PHASE 2: LOBBY SYSTEM (CURRENT PHASE)

### 2.1 Username & Local Storage
- [ ] Create username input form
- [ ] Store username in localStorage
- [ ] Display username in UI

### 2.2 Room Creation & Joining
- [ ] **Backend**: Room management system
  - [ ] Create room with unique code
  - [ ] Join room by code
  - [ ] Track players in each room
- [ ] **Frontend**: Room UI
  - [ ] "Create Room" button
  - [ ] "Join Room" input field
  - [ ] Display room code
  - [ ] Show players list

### 2.3 Ready System
- [ ] **Backend**: Track ready status
- [ ] **Frontend**: Ready button for each player
- [ ] Show ready status for all players
- [ ] Enable "Start Game" when all 4 ready

### 2.4 Game Start
- [ ] **Backend**: Handle game start event
- [ ] **Frontend**: Start button (only for room creator)
- [ ] Transition to role assignment phase

---

## 🎲 PHASE 3: ROLE ASSIGNMENT SYSTEM

### 3.1 Role Spinning Animation
- [ ] Create spinning/dice animation
- [ ] "Spin" button for each player
- [ ] Animation timing (3-4 seconds)

### 3.2 Backend Role Logic
- [ ] Shuffle roles randomly
- [ ] Assign one role per player
- [ ] Send roles privately to each player
- [ ] Track when all players have spun

### 3.3 Role Display
- [ ] Show assigned role to player only
- [ ] Hide role from other players
- [ ] Transition when all roles assigned

---

## 🕵️ PHASE 4: GAME MECHANICS

### 4.1 King Phase
- [ ] King-only UI: "Who is the Police?" button
- [ ] Other players wait
- [ ] Police reveals themselves

### 4.2 Police Phase  
- [ ] Police-only UI: Choose who is the Thief
- [ ] Show remaining players (exclude King)
- [ ] Submit guess

### 4.3 Result Calculation
- [ ] Validate Police guess
- [ ] Calculate points (correct: Police +300, wrong: Thief +300)
- [ ] Broadcast results to all players

---

## 🔄 PHASE 5: GAME LOOP

### 5.1 Scoring System
- [ ] Track individual player scores
- [ ] Display score leaderboard
- [ ] Check win conditions (e.g., 2000 points)

### 5.2 Next Round
- [ ] Reset game state
- [ ] Return to role assignment
- [ ] Continue until win condition or max rounds

---

## 🎨 PHASE 6: UI/UX POLISH

### 6.1 Styling & Animation
- [ ] Modern, responsive design
- [ ] Smooth transitions between phases
- [ ] Loading states and feedback

### 6.2 Error Handling
- [ ] Connection lost scenarios
- [ ] Invalid room codes
- [ ] Player disconnect handling

---

## 🚀 PHASE 7: DEPLOYMENT & OPTIMIZATION

### 7.1 Production Preparation
- [ ] Environment configuration
- [ ] Security improvements
- [ ] Performance optimization

### 7.2 Deployment
- [ ] Deploy backend (e.g., Heroku, Railway)
- [ ] Deploy frontend (e.g., Vercel, Netlify)
- [ ] Configure CORS for production

---

## 📱 PHASE 8: MOBILE OPTIMIZATION (FUTURE)
- [ ] Touch-friendly UI
- [ ] Responsive design improvements
- [ ] PWA capabilities

---

## 🎯 CURRENT FOCUS: Phase 2 - Lobby System

**Next Steps:**
1. Create username input and storage
2. Build room creation/joining system
3. Implement ready status tracking
4. Add game start functionality

**Files to Work On:**
- `client/src/components/` (new components)
- `server/index.js` (room management)
- `client/src/App.jsx` (main game flow)

---

*Last Updated: $(date)* 