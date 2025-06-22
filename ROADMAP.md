# 🎮 Guess the Thief - Development Roadmap

## 📋 Project Overview
A real-time multiplayer game where 4 players are assigned secret roles (King, Queen, Police, Thief) and the Police must identify the Thief through social deduction.

---

## 🏗️ PHASE 1: PROJECT FOUNDATION ✅ **COMPLETED**
- [x] Set up Node.js/Express/Socket.IO server
- [x] Set up React/Vite client 
- [x] Establish basic client-server connection
- [x] Install all dependencies

---

## 🚪 PHASE 2: LOBBY SYSTEM ✅ **COMPLETED**

### 2.1 Username & Local Storage ✅
- [x] Create username input form (`UsernameForm.jsx`)
- [x] Username validation and display
- [x] Connection status indicator

### 2.2 Room Creation & Joining ✅
- [x] **Backend**: Room management system (`server/index.js`)
  - [x] Create room with unique 6-character code
  - [x] Join room by code with validation
  - [x] Track players in each room (max 4)
  - [x] Auto-cleanup empty rooms
- [x] **Frontend**: Room UI (`RoomLobby.jsx`)
  - [x] "Create Room" button
  - [x] "Join Room" input field with uppercase conversion
  - [x] Display room code for sharing
  - [x] Real-time players list with host indicator

### 2.3 Ready System ✅
- [x] **Backend**: Track ready status for each player
- [x] **Frontend**: Toggle ready button
- [x] Show ready status for all players (✅/⏳)
- [x] Real-time ready count display
- [x] Enable "Start Game" when all 4 ready

### 2.4 Game Start ✅
- [x] **Backend**: Handle game start event with validations
- [x] **Frontend**: Start button (only for room creator)
- [x] Validation: 4 players, all ready, host-only
- [x] Broadcast game start to all players

---

## 🎲 PHASE 3: ROLE ASSIGNMENT SYSTEM (CURRENT PHASE)

### 3.1 Role Spinning Component
- [ ] Create `RoleAssignment.jsx` component
- [ ] Spinning animation (dice/wheel effect)
- [ ] "Spin for Role" button for each player
- [ ] Animation timing (3-4 seconds)
- [ ] Show role result privately

### 3.2 Backend Role Logic
- [ ] Role shuffling algorithm (King, Queen, Police, Thief)
- [ ] Assign roles privately to each player
- [ ] Track when all players have received roles
- [ ] Prevent role visibility between players

### 3.3 Role Display & Transition
- [ ] Show assigned role to player only
- [ ] Hide other players' roles
- [ ] "Continue" button when all roles assigned
- [ ] Transition to game mechanics phase

---

## 🕵️ PHASE 4: GAME MECHANICS (NEXT)

### 4.1 King Phase Component
- [ ] Create `KingPhase.jsx` component
- [ ] King-only UI: "Who is the Police?" selection
- [ ] Other players see waiting screen
- [ ] Police player reveals themselves

### 4.2 Police Phase Component  
- [ ] Create `PolicePhase.jsx` component
- [ ] Police-only UI: Choose suspected Thief
- [ ] Show remaining players (exclude King)
- [ ] Submit guess functionality

### 4.3 Result Display Component
- [ ] Create `GameResult.jsx` component
- [ ] Validate Police guess
- [ ] Calculate points (correct: Police +300, wrong: Thief +300)
- [ ] Broadcast results to all players
- [ ] Show game outcome with animations

---

## 🔄 PHASE 5: GAME LOOP (FUTURE)

### 5.1 Scoring System
- [ ] Track individual player scores across rounds
- [ ] Display score leaderboard
- [ ] Check win conditions (e.g., 2000 points)

### 5.2 Next Round
- [ ] Reset game state
- [ ] Return to role assignment
- [ ] Continue until win condition or max rounds

---

## 🎨 PHASE 6: UI/UX POLISH (FUTURE)

### 6.1 Styling & Animation
- [ ] Modern, responsive design with CSS/Tailwind
- [ ] Smooth transitions between phases
- [ ] Loading states and feedback

### 6.2 Error Handling
- [ ] Connection lost scenarios
- [ ] Invalid room codes
- [ ] Player disconnect handling during game

---

## 🚀 PHASE 7: DEPLOYMENT & OPTIMIZATION (FUTURE)

### 7.1 Production Preparation
- [ ] Environment configuration
- [ ] Security improvements
- [ ] Performance optimization

### 7.2 Deployment
- [ ] Deploy backend (Railway/Heroku)
- [ ] Deploy frontend (Vercel/Netlify)
- [ ] Configure CORS for production

---

## 📱 PHASE 8: MOBILE OPTIMIZATION (FUTURE)
- [ ] Touch-friendly UI
- [ ] Responsive design improvements
- [ ] PWA capabilities

---

## 🎯 **CURRENT FOCUS: Phase 3 - Role Assignment System**

**Immediate Next Steps:**
1. Create `RoleAssignment.jsx` component with spinning animation
2. Implement backend role shuffling and assignment
3. Add role display with privacy protection
4. Build transition logic to game mechanics

**Component Architecture Plan:**
```
App.jsx (Main Controller)
├── UsernameForm.jsx ✅
├── RoomLobby.jsx ✅  
├── RoleAssignment.jsx (NEXT)
├── GamePhase.jsx (FUTURE)
│   ├── KingPhase.jsx
│   ├── PolicePhase.jsx  
│   └── GameResult.jsx
└── ScoreBoard.jsx (FUTURE)
```

**Files to Work On:**
- `client/src/components/RoleAssignment.jsx` (NEW)
- `client/src/App.jsx` (add game state management)
- `server/index.js` (add role assignment logic)

---

*Last Updated: December 19, 2024* 