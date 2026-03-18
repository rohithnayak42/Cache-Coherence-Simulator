# 🧠 Cache Coherence Simulator

[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)

An interactive, educational simulator designed to visualize and analyze **Cache Coherence Protocols** (MSI, MESI, MOESI). Built for students and enthusiasts of Computer Organization and Architecture (COA) to understand how multicore systems maintain data consistency.

---

## ✨ Key Features

- **🔄 Multi-Protocol Support**: Seamlessly switch between **MSI**, **MESI**, and **MOESI** protocols.
- **🖥️ Interactive Processor Nodes**: Perform `READ` and `WRITE` operations on individual processors and observe state transitions in real-time.
- **📡 Bus Snooping Visualization**: Watch how `BusRd`, `BusRdX`, and `BusUpgr` signals coordinate memory consistency across caches.
- **📊 Real-time Analytics**: Monitor Cache Hit/Miss rates, Bus Traffic, and State Transitions with dynamic charts powered by Recharts.
- **📜 Detailed Event Logs**: A comprehensive history of every cache action, bus signal, and memory update.
- **☁️ Simulation History**: Optional cloud-sync (PostgreSQL via Neon) to save and compare simulation results.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS, Framer Motion (Animations), Recharts (Data Viz), Lucide React (Icons).
- **Backend (Optional)**: Node.js, Express.
- **Database**: PostgreSQL (Neon Serverless).

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+ recommended)
- npm or yarn

### Installation

1. **Clone the Repository**
   ```bash
   git clone https://github.com/rohithnayak42/cache-coherence-simulator.git
   cd cache-coherence-simulator
   ```

2. **Setup Frontend**
   ```bash
   npm install
   ```

3. **Setup Backend (Optional for History)**
   - Navigate to the `server` directory:
     ```bash
     cd server
     npm install
     ```
   - Create a `.env` file in the root directory with your PostgreSQL connection string:
     ```env
     DATABASE_URL=your_postgresql_url
     PORT=5000
     ```

### Running the Application

- **Frontend Only**:
  ```bash
  npm run dev
  ```
- **Full Stack (With Backend)**:
  - In one terminal, run the frontend: `npm run dev`
  - In another terminal, run the backend: `cd server && node index.js`

---

## 📖 How to Use

1. **Select Protocol**: Choose between MSI, MESI, or MOESI on the Protocol Selector screen.
2. **Interact**: Click on a Processor Node to trigger a `READ` or `WRITE` instruction to a specific memory address (e.g., `0x00`).
3. **Observe**: Watch the cache lines change states (e.g., `I` -> `S` -> `M`) and see the Bus Message update.
4. **Analyze**: Check the "Analytics & Stats" section to see performance metrics for your current simulation run.
5. **Save**: Use the "Save Results" button to persist your session to the database.

---

## 🧬 Supported Protocols

| Protocol | States | Key Feature |
| :--- | :--- | :--- |
| **MSI** | Modified, Shared, Invalid | The baseline snooping protocol. |
| **MESI** | + Exclusive | Reduces bus traffic for private data. |
| **MOESI** | + Owned | Allows dirty data sharing between caches without memory writeback. |

---

## 🤝 Contributing

Contributions are welcome! Feel free to open an issue or submit a pull request if you'd like to improve the simulation logic, add new protocols, or enhance the UI.

---

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.

---

*Built with ❤️ for COA Students.*
