# 🎮 Guess the Thief

A real-time multiplayer social deduction game where players are assigned secret roles and must use their wits to identify the Thief.

## 📋 Project Overview

"Guess the Thief" is a multiplayer online game where 4 players are assigned secret roles (King, Queen, Police, Thief). Through a series of interactions, the Police must identify the Thief through social deduction, while the Thief attempts to remain hidden.

## 🚀 Features

- **Real-time Multiplayer**: Play with friends online in real-time
- **Role-based Gameplay**: Each player is assigned a unique role with different abilities
- **Social Deduction**: Use strategy and observation to identify the Thief
- **Room System**: Create or join game rooms with a unique code
- **Scoring System**: Earn points based on successful deductions or evasions

## 🛠️ Tech Stack

- **Frontend**: React, Vite
- **Backend**: Node.js, Express
- **Real-time Communication**: Socket.IO
- **Styling**: CSS (with potential for Tailwind/styled-components)

## 🏁 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/guess_the_thief.git
   cd guess_the_thief
   ```

2. Install server dependencies
   ```bash
   cd server
   npm install
   ```

3. Install client dependencies
   ```bash
   cd ../client
   npm install
   ```

### Running the Application

1. Start the server
   ```bash
   cd server
   npm start
   ```

2. In a new terminal, start the client
   ```bash
   cd client
   npm run dev
   ```

3. Open your browser and navigate to `http://localhost:5173`

## 🎮 How to Play

1. Enter your username
2. Create a new room or join an existing one with a room code
3. Wait for 4 players to join and click "Ready"
4. Spin to get assigned a role (King, Queen, Police, or Thief)
5. Follow the instructions based on your role:
   - **King**: You'll identify the Police
   - **Police**: Your job is to catch the Thief
   - **Thief**: Try to avoid being caught
   - **Queen**: Support the Police
6. Points are awarded based on whether the Police correctly identifies the Thief

## 📈 Project Status

This project is currently in active development. See the [ROADMAP.md](./ROADMAP.md) file for detailed development plans and progress.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the issues page.

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Authors

- Subhajit - Initial work - [subhajitlucky](https://github.com/subhajitlucky)

---

*Last Updated: June 10, 2025*
