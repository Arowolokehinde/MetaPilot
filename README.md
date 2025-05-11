#  MetaPilot

MetaPilot is an AI-powered Web3 assistant that automates on-chain actions on behalf of users. Built using the MetaMask Delegation Toolkit (ERC-7715) and Gaia infrastructure, MetaPilot allows users to delegate actions such as voting on DAO proposals, claiming rewards, and executing token swaps, all while they are offline.

> **MetaPilot** - Your AI-powered co-pilot for Web3, always on the move!

---

## ✨ Key Features

- **Delegated On-Chain Actions**: Automatically vote on DAO proposals, claim rewards, or trigger token swaps when certain conditions are met.
- **AI Engine**: Uses NLP and light AI to match user-defined conditions (e.g., “vote YES if reward”).
- **MetaMask DTK Integration**: Secure delegation via ERC-7710 (permissions) and ERC-7715 (actions).
- **Gaia Infrastructure**: Persistent agent running on Gaia to execute delegated logic when users are offline.
- **Smart Contracts**: Handles secured execution of delegated tasks on the blockchain.

---

## 🚀 Use Cases

- 🗳️ **DAO Voting**: Automatically vote YES/NO on DAO proposals based on predefined conditions (e.g., proposal contains "rewards").
- 💰 **Reward Claims**: Claim rewards when certain tokens or NFTs are released.
- 💹 **Token Price Monitoring**: Buy or sell tokens when specific price thresholds are met.
- 🧾 **NFT Floor Price Monitoring**: Buy/sell NFTs when the floor price crosses a user-defined threshold.

---

## 🔧 Tech Stack

| Layer             | Technology |
|-------------------|------------|
| **Frontend**      | React.js + Tailwind CSS (via `create-gator-app` CLI) |
| **Backend**       | Node.js (TypeScript) + Express.js |
| **Smart Contracts**| Solidity, Hardhat |
| **Web3 Tools**    | MetaMask Delegation Toolkit (ERC-7710, ERC-7715) |
| **AI Engine**     | OpenAI API (Light NLP) |
| **Gaia Integration**| Gaia Agent Platform |
| **Database**      | PostgreSQL |
| **Infra**         | Docker, Redis, AWS, BullMQ, Railway |

---

## 🛠️ System Architecture Overview

### Components:
1. **Frontend**: 
   - React UI with Tailwind CSS for a seamless user experience.
   - Users can subscribe to DAOs, set voting rules, and manage token/DAO preferences.
   
2. **Backend**: 
   - Handles rule storage, event monitoring, action composition (via ERC-7715), and task delegation.
   - Communicates with the Gaia Agent for task execution.
   
3. **AI Engine**: 
   - Uses basic NLP/keyword matching to identify conditions like "vote YES if rewards" or "claim reward when price changes."
   
4. **Smart Contracts**: 
   - Manages ERC-7715 actions for delegated execution (e.g., vote(), transfer()).
   
5. **Gaia Infrastructure**: 
   - Acts as a persistent agent that signs and dispatches transactions on behalf of users when they are offline.

---

## 🔄 System Flow

1. **User connects MetaMask** using the MetaMask Delegation Toolkit (DTK).
2. **User sets preferences** such as "Vote YES if the proposal includes rewards."
3. **Backend** stores rules, monitors events (using The Graph, Snapshot, CoinGecko, etc.).
4. **AI Engine** matches events (e.g., a proposal with "rewards").
5. **Action Composer** constructs a valid ERC-7715 action for the required task (e.g., vote YES).
6. **Gaia Agent** signs the action using the user’s delegated session key.
7. **Smart Contract** executes the action on-chain (e.g., voting on a DAO proposal).
8. **Backend** logs the transaction hash and updates status.
9. **Frontend** shows feedback to the user, confirming action execution.

---

## 🧑‍💻 Setup Guide

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/metapilot.git
cd metapilot

Certainly! Below is a comprehensive `README.md` for the MetaPilot project based on the PRD you provided. This README includes all the necessary sections for understanding the project’s flow, setup, and usage.

---

````markdown
# 🧠 MetaPilot

MetaPilot is an AI-powered Web3 assistant that automates on-chain actions on behalf of users. Built using the MetaMask Delegation Toolkit (ERC-7715) and Gaia infrastructure, MetaPilot allows users to delegate actions such as voting on DAO proposals, claiming rewards, and executing token swaps, all while they are offline.

> **MetaPilot** - Your AI-powered co-pilot for Web3, always on the move!

---

## ✨ Key Features

- **Delegated On-Chain Actions**: Automatically vote on DAO proposals, claim rewards, or trigger token swaps when certain conditions are met.
- **AI Engine**: Uses NLP and light AI to match user-defined conditions (e.g., “vote YES if reward”).
- **MetaMask DTK Integration**: Secure delegation via ERC-7710 (permissions) and ERC-7715 (actions).
- **Gaia Infrastructure**: Persistent agent running on Gaia to execute delegated logic when users are offline.
- **Smart Contracts**: Handles secured execution of delegated tasks on the blockchain.

---

## 🚀 Use Cases

- 🗳️ **DAO Voting**: Automatically vote YES/NO on DAO proposals based on predefined conditions (e.g., proposal contains "rewards").
- 💰 **Reward Claims**: Claim rewards when certain tokens or NFTs are released.
- 💹 **Token Price Monitoring**: Buy or sell tokens when specific price thresholds are met.
- 🧾 **NFT Floor Price Monitoring**: Buy/sell NFTs when the floor price crosses a user-defined threshold.

---

## 🔧 Tech Stack

| Layer             | Technology |
|-------------------|------------|
| **Frontend**      | React.js + Tailwind CSS (via `create-gator-app` CLI) |
| **Backend**       | Node.js (TypeScript) + Express.js |
| **Smart Contracts**| Solidity, Hardhat |
| **Web3 Tools**    | MetaMask Delegation Toolkit (ERC-7710, ERC-7715) |
| **AI Engine**     | OpenAI API (Light NLP) |
| **Gaia Integration**| Gaia Agent Platform |
| **Database**      | PostgreSQL |
| **Infra**         | Docker, Redis, AWS, BullMQ, Railway |

---

## 🛠️ System Architecture Overview

### Components:
1. **Frontend**: 
   - React UI with Tailwind CSS for a seamless user experience.
   - Users can subscribe to DAOs, set voting rules, and manage token/DAO preferences.
   
2. **Backend**: 
   - Handles rule storage, event monitoring, action composition (via ERC-7715), and task delegation.
   - Communicates with the Gaia Agent for task execution.
   
3. **AI Engine**: 
   - Uses basic NLP/keyword matching to identify conditions like "vote YES if rewards" or "claim reward when price changes."
   
4. **Smart Contracts**: 
   - Manages ERC-7715 actions for delegated execution (e.g., vote(), transfer()).
   
5. **Gaia Infrastructure**: 
   - Acts as a persistent agent that signs and dispatches transactions on behalf of users when they are offline.

---

## 🔄 System Flow

1. **User connects MetaMask** using the MetaMask Delegation Toolkit (DTK).
2. **User sets preferences** such as "Vote YES if the proposal includes rewards."
3. **Backend** stores rules, monitors events (using The Graph, Snapshot, CoinGecko, etc.).
4. **AI Engine** matches events (e.g., a proposal with "rewards").
5. **Action Composer** constructs a valid ERC-7715 action for the required task (e.g., vote YES).
6. **Gaia Agent** signs the action using the user’s delegated session key.
7. **Smart Contract** executes the action on-chain (e.g., voting on a DAO proposal).
8. **Backend** logs the transaction hash and updates status.
9. **Frontend** shows feedback to the user, confirming action execution.

---

## 🧑‍💻 Setup Guide

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/metapilot.git
cd metapilot
````

### 2. Install Dependencies

#### Backend

```bash
cd backend
npm install
```

#### Frontend

```bash
cd frontend
npm install
```

### 3. Set Up Environment Variables

Create `.env` files in both the `backend/` and `frontend/` directories.

#### Backend `.env`

```env
DATABASE_URL=postgres://user:password@localhost:5432/metapilot
OPENAI_API_KEY=your-openai-api-key
GAIA_API_KEY=your-gaia-api-key
```

#### Frontend `.env`

```env
REACT_APP_GAIA_API_KEY=your-gaia-api-key
REACT_APP_BACKEND_API_URL=http://localhost:5000/api
```

### 4. Start the Development Server

#### Backend

```bash
cd backend
npm run dev
```

#### Frontend

```bash
cd frontend
npm start
```

---

## 🧠 AI Engine Details

* **Objective**: The AI Engine uses NLP techniques to parse proposal descriptions and match user preferences.
* **Implementation**:

  * Simple keyword matching using the OpenAI API or basic NLP models.
  * User-defined conditions (e.g., "vote YES if proposal contains 'reward'") are evaluated when new events are detected.
* **How It Works**:

  1. The engine listens to proposals or events.
  2. When a match occurs, it triggers the backend to generate the corresponding ERC-7715 action.

---

## 🔒 Smart Contracts

### Key Smart Contracts

1. **ActionExecutor**:

   * Handles and executes delegated actions (e.g., voting, claiming rewards).
   * Verifies the signature and permission scope (ERC-7710).

2. **DelegationRegistry** (Optional):

   * Tracks delegations (ERC-7710) that define which actions a user can delegate (e.g., vote on specific DAOs).

3. **RelayGuard**:

   * Restricts what actions can be executed based on predefined permission rules.

---

## 🦊 MetaMask DTK Integration

1. **Session Key**:

   * A unique key generated when the user connects MetaMask.
   * Used to authorize actions and secure communications between MetaPilot and MetaMask.

2. **Delegated Actions**:

   * ERC-7715 actions are constructed and signed by the backend and Gaia Agent for execution on behalf of the user.

---

## 🌐 Gaia Integration

* **Gaia Agent**:

  * Persistent agent infrastructure that handles the execution of actions when the user is offline.
  * It signs and submits ERC-7715 actions to the blockchain on behalf of the user.

### How Gaia Works

1. The backend sends a task to Gaia Agent.
2. Gaia authenticates using the session key.
3. Gaia signs the action and dispatches it to the Ethereum network.
4. The backend receives feedback (success/failure), and the frontend displays the result to the user.

---

## 💻 Contribution

### Running Tests

```bash
# Backend
npm run test

# Frontend
npm run test
```

### Linting

```bash
# Backend
npm run lint

# Frontend
npm run lint
```

---

## 📄 License

MIT License © 2025 MetaPilot Team

---