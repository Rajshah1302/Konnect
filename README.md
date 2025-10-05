## ETH Connect

ETH Connect was developed for ETHGlobal New Delhi 2025 as an accessibility-focused event platform that combines blockchain, real-time networking, and a 2D metaverse environment.

---

[![ETH Connect Demo](https://img.youtube.com/vi/mcUt6TklF_A/maxresdefault.jpg)](https://www.youtube.com/watch?v=mcUt6TklF_A)

---

## Overview

**Problem statement:** Participating in hackathons can be challenging for specially-abled or introverted users due to barriers in registration, identity verification, and real-time collaboration.

**Solution:** ETH Connect provides a blockchain-based platform where users verify their identity on-chain through the Self Protocol without traditional KYC, join virtual hackathon events in a 2D metaverse, and interact with other participants in real time.

---

## Platform Components

ETH Connect is organized around key modules that enable secure, verifiable, and interactive hackathon participation. The platform integrates on-chain identity verification via the Self Protocol, event management and logging through smart contracts on the Celo blockchain, a real-time 2D metaverse environment for avatar-based interaction, and a backend that coordinates state and updates. Each module is designed to operate seamlessly with the others, providing a foundation for accessibility, real-time collaboration, and extensibility, which are described in detail in the following sections.

### 1. Identity Module (Self Protocol)

ETH Connect leverages the Self Protocol to provide secure, privacy-preserving identity verification for participants. Self is a privacy-first, open-source protocol that uses zero-knowledge proofs to enable Sybil-resistant verification and selective disclosure using real-world attestations, such as passports or government IDs. With minimal integration, developers can verify that users are human while preserving their privacy ([docs.self.xyz](https://docs.self.xyz/?utm_source=chatgpt.com)).

Participants authenticate by scanning their Aadhar using the Self mobile app, which generates a zero-knowledge proof over the Aadhar. This proof is then shared with ETH Connect, allowing identity verification without exposing sensitive personal data. The process ensures that only verified humans can participate, maintaining the integrity of the hackathon environment.

By integrating the Self Protocol, ETH Connect provides identity verification that is both secure and privacy-respecting, reinforcing the platform’s commitment to accessibility and trust.

---

### 2. Real-Time Communication

ETH Connect enables dynamic, interactive participation through real-time communication, powered by WebSockets (Socket.io). Each hackathon event functions as a distinct “room,” identified by a unique contract address, allowing multiple participants to interact concurrently while maintaining isolated event state. The communication system is tightly integrated with the GameManager backend module, which serves as the authoritative source of truth for participant data and event state.

#### 2.1 Event Architecture

Each event room corresponds to a contract address and tracks all active participants, their avatars, positions, and interaction history. When a participant joins, the server validates the request, creates or retrieves the corresponding event state, and assigns the player a unique avatar and initial position. All connected clients within the room are synchronized with the current event state to maintain consistency.

The server architecture supports multiple concurrent rooms and is designed to handle high-frequency updates efficiently. The GameManager module abstracts event management, including:

* Adding and removing players
* Updating player positions, directions, and animations
* Managing chat messages
* Handling challenge requests between participants

#### 2.2 Player State Synchronization

Participant actions, such as movement, direction changes, avatar animations, and challenges, are transmitted via WebSocket events. The backend updates the authoritative state and broadcasts relevant updates to all other clients in the room. Key events include:

* **joinGame:** Adds a player to a room, assigns a name and initial position, and synchronizes the current game state.
* **playerMove:** Updates the player’s position and animation state, broadcasting the changes to all other participants.
* **chatMessage:** Sends messages to all participants, with validation to prevent empty or excessively long messages.
* **challengePlayer / challengeResponse:** Handles interactive challenges, including creating temporary battle rooms for isolated interactions.
* **disconnect:** Removes the player from the room and notifies remaining participants.

#### 2.3 Data Validation and Security

To ensure data integrity and platform security, ETH Connect performs real-time validation at multiple layers:

* Contract addresses are validated against Ethereum address format standards.
* Chat messages are sanitized and length-limited to prevent abuse.
* Player movements and interactions are validated to prevent state inconsistencies.

This ensures that only legitimate actions are propagated, maintaining a robust and tamper-resistant environment.

#### 2.4 Performance Optimization

ETH Connect implements several mechanisms to maintain optimal performance during real-time interactions:

* **Periodic cleanup of inactive events:** Empty or idle rooms are automatically removed after a defined timeout to free memory and reduce server load.
* **Efficient state broadcasting:** Only delta changes are sent to clients instead of full state dumps, minimizing network overhead.
* **Room-based message scoping:** Updates are broadcast only to relevant participants in a room to prevent unnecessary traffic.

#### 2.5 Integration with Backend and Smart Contracts

The real-time communication layer interacts seamlessly with the backend and Celo smart contracts. While WebSockets handle transient interactions (movement, chat, challenges), all persistent data (registration, event creation, and on-chain actions) is logged on-chain for auditability. This hybrid architecture ensures that ETH Connect delivers a responsive and interactive experience without compromising trust and verifiability.

---

## 3. Avatar Class Architecture and Interaction Framework

The visual and interactive layer of ETH Connect’s metaverse is structured around an object-oriented class hierarchy that ensures modularity and scalability. Core classes — Sprite, OtherPlayer, and Boundary — define how entities are rendered, animated, and constrained within the 2D environment.

---

### 3.1 Sprite Class

The `Sprite` class acts as the base abstraction for all renderable entities in the environment. It encapsulates shared properties such as position, velocity, animation frames, rotation, and opacity, alongside rendering logic that handles image cropping and frame progression.

It also introduces encapsulation through its chat system, using `setChat()` and `drawChatBubble()` methods to manage user dialogue in real time. These methods maintain internal state and timing logic (for message fade-outs) without exposing their implementation to external components. This abstraction allows other objects inheriting from `Sprite` to use chat functionality seamlessly.

By keeping animation and rendering logic within a unified structure, `Sprite` provides a reusable and consistent interface for all visual elements in the ETH Connect world.

---

### 3.2 OtherPlayer Class

The `OtherPlayer` class extends `Sprite`, demonstrating **inheritance** and **polymorphism**. It specializes the base class for real-time, multiplayer avatars by introducing player-specific attributes such as `playerId`, `playerName`, and `direction`.

Through **method overriding**, it redefines `draw()` and `update()` to support dynamic animation, directional movement, and synchronization with server-side game state. This enables each remote player’s avatar to be rendered accurately with respect to world position and interaction timing.

The class also manages separate sprite sheets for movement in different directions (up, down, left, right), dynamically switching between them as the player moves. This polymorphic behavior ensures that animation logic remains flexible while adhering to the interface defined in the base `Sprite` class.

---

### 3.3 Boundary Class

The `Boundary` class defines the non-interactive, physical constraints of the 2D world. It encapsulates static properties such as position, width, and height, and provides a simple rendering method for collision visualization.

While less complex, this class exemplifies **abstraction** and **separation of concerns** — isolating world geometry logic from rendering and player mechanics. The `Boundary` system ensures avatars and objects remain confined to valid map regions, maintaining the structural integrity of the virtual environment.

---

## 4. Smart Contract Architecture

ETH Connect’s on-chain framework consists of two primary Solidity contracts — **`Realm`** and **`RealmFactory`** — that handle decentralized event creation, identity verification, and participation management. These contracts ensure that hackathon events (“realms”) are transparent, verifiable, and Sybil-resistant through integration with the **Self Protocol**.

---

### 4.1 Realm Contract

The `Realm` contract represents a single hackathon event or virtual experience. It inherits from **`SelfVerificationRoot`**, enabling direct integration with the Self Protocol for zero-knowledge-based participant verification.

Each realm stores metadata such as creator, title, description, geolocation, capacity, date, and participation filters, while dynamically tracking verified users and attendees.

#### Core Functionalities

* **Self Verification Integration:**
  Extends `SelfVerificationRoot` and overrides `customVerificationHook()` to process identity proofs from the Self Protocol. Gender or other participation filters are enforced through `_validateRequirements()`.

* **Event Participation:**
  The `joinRealm()` function allows verified users to join by sending the required ticket price. Payments are automatically transferred to the creator, with refunds for overpayment. Attendance and verification are recorded on-chain.

* **Data Retrieval:**
  Multiple `view` functions expose realm metadata, participant lists, and verification status for easy integration with front-end and analytics layers.

#### Key OOP and Security Features

* **Inheritance:** Extends `SelfVerificationRoot` to reuse ZK verification logic.
* **Encapsulation:** Internal verification functions remain inaccessible externally.
* **Access Control:** The `onlyCreator` modifier restricts admin operations.
* **Validation:** Checks for event capacity, ticket pricing, and timing to prevent misuse.

#### Contract Events

* `UserVerified(address user, string gender, string nationality)`
* `UserJoined(address user, uint256 amountPaid)`

By combining identity proofs, attendance tracking, and transparent payment flow, the `Realm` contract anchors ETH Connect’s verifiable and trustless participation model.

---

### 4.2 RealmFactory Contract

The `RealmFactory` contract acts as the **deployment and management hub** for all `Realm` instances. It enables creators to deploy new realms and provides indexing and data aggregation for all deployed events.

#### Core Functionalities

* **Realm Creation:**
  Deploys new `Realm` contracts with parameters such as title, description, location, and participation filters.
  Uses a global **`VERIFICATION_CONFIG_ID`** to link each realm with a Self Protocol configuration.

* **Registry Management:**
  Tracks all deployed realms through mappings and arrays (`creatorRealms`, `isValidRealm`, `allRealms`).
  Includes query and pagination functions for efficient on-chain indexing.

* **Data Aggregation:**
  The `getRealmsDetails()` function aggregates metadata — titles, ticket prices, capacities, dates, and attendance counts — for multiple realms in a single call.

#### Security and Design Considerations

* Prevents invalid configurations (e.g., zero capacity or contradictory filters).
* Stores the verification hub address as immutable for trust and consistency.
* Enforces event date validation to prevent retroactive creation.

#### Key Event

* `RealmCreated(address realmContract, address creator, string title, uint256 ticketPrice, uint256 capacity)`

---

### 4.3 Architectural Summary

Together, the **`Realm`** and **`RealmFactory`** contracts establish a modular and verifiable smart contract layer for decentralized hackathon events:

* **RealmFactory** — handles creation, indexing, and configuration.
* **Realm** — manages verification, payments, and participation.
* **Self Protocol Integration** — provides on-chain identity verification using zero-knowledge proofs.

This structure ensures transparency, accessibility, and trust, forming the foundation of ETH Connect’s decentralized event management system.

---

## 5. Frontend Architecture

The ETH Connect frontend is built with **Next.js**, **TypeScript**, and **TailwindCSS**, integrating blockchain connectivity via **Wagmi** and **Ethers.js**. It provides an interactive, map-based interface for event exploration, creation, and participation, ensuring a seamless and accessible user experience.

### 5.1 Application Structure

The frontend follows a modular directory layout:

```
frontend/
├── app/               # Pages for explore, realms, and event creation
├── components/        # Reusable UI elements and map components
├── hooks/             # Contract interaction hooks
├── providers/         # Theme, Wallet, and Ethers providers
├── types/             # Type definitions for users and tokens
├── utils/             # Config, markers, and contract wrappers
└── lib/               # Shared utility functions
```

### 5.2 Wallet and Blockchain Integration

Wallet connection is handled through **Wagmi**, enabling seamless interactions with Celo-based smart contracts. Event creation and participation are facilitated via **Ethers.js**, with proper session management and network handling.

### 5.3 Map-Based Event Exploration

A 3D interactive map allows users to discover nearby events in real time. Event markers provide quick access to details and participation actions, while the interface ensures smooth navigation across the metaverse environment.

### 5.4 Component Library and Theming

The frontend leverages **TailwindCSS** and **shadcn/ui** for a consistent look and feel. ThemeProvider enables light/dark modes, while components like `Navbar`, `Footer`, `Hero`, `Button`, and `Card` are reused across pages for uniformity.

---
## 6. Diagrammatic Representations

This section provides visual representations of ETH Connect’s architecture and flows, highlighting verification, participation, real-time interaction, and data structures.

---

### 6.1 Event-Specific Self Verification Flow

Illustrates how a user completes identity verification for each event independently using the Self Protocol, ensuring selective disclosure and privacy. <img width="948" height="446" alt="Event-Specific Self Verification Flow" src="https://github.com/user-attachments/assets/c95e4c2d-b0ad-4464-bde5-bbfd605bda79" />

---

### 6.2 Event Participation & Payment Flow

Depicts the process of joining a realm, handling ticket payments, and recording attendance on-chain. Refunds and validations are included to ensure secure transactions. <img width="753" height="476" alt="Event Participation & Payment Flow" src="https://github.com/user-attachments/assets/3a1f1204-2e57-42ac-b150-badc16dd8d33" />

---

### 6.3 WebSocket Real-Time Interaction Flow

Shows the flow of real-time interactions between participants via WebSockets, including movement updates, chat messages, and challenge requests. <img width="1212" height="906" alt="WebSocket Real-Time Interaction Flow" src="https://github.com/user-attachments/assets/6a0b2391-b8c4-476c-b523-dd5ace5e3011" />

---

### 6.4 Complete Flow

Combines verification, event participation, payment, and real-time interaction into a single overview, demonstrating how front-end, backend, smart contracts, and WebSockets integrate. <img width="1407" height="1488" alt="Complete Flow" src="https://github.com/user-attachments/assets/7649f34c-d21e-4c21-8211-1a6788148ad0" />

---

### 6.5 Component Diagram

Illustrates the modular structure of ETH Connect, showing how front-end components, backend services, smart contracts, and external integrations interact. <img width="963" height="553" alt="Component Diagram" src="https://github.com/user-attachments/assets/28d241fe-612b-42b2-9688-1baaf990a458" />

---

### 6.6 ER Diagram

Shows the relationships between key data entities such as Users, Realms, Attendees, and Verification Records, providing clarity on database structure and associations. <img width="566" height="485" alt="ER Diagram" src="https://github.com/user-attachments/assets/b0bd78fa-cbb2-469d-b0ea-1f1485ca5c55" />

---

### 6.7 Data Flow Diagrams (DFD)

#### 6.7.1 Level 0

Provides a high-level overview of data movement between external entities, ETH Connect’s front-end, backend, and smart contracts. <img width="1431" height="308" alt="DFD Level 0" src="https://github.com/user-attachments/assets/e5c5af6d-8932-459e-9e65-3d8977d1e352" />

#### 6.7.2 Level 1

Breaks down Level 0 into more detailed flows, showing processes such as verification, event creation, joining, payments, and real-time updates. <img width="1994" height="519" alt="DFD Level 1" src="https://github.com/user-attachments/assets/24dbd2db-e91a-4f45-9394-e59bdada7ad2" />

---

## 7. Deployment Table

| Component       | Environment / Platform | Description                                                                                        | Address / Link                                                                                                             |
| --------------- | ---------------------- | -------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Smart Contracts | Celo Mainnet           | Deployed `RealmFactory` and `Realm` contracts; handles event creation, verification, and payments. | [0x905c8e0465038c0F04BED1d707abD49BCd590715](https://celoscan.io/address/0x665C2eb33a830cf255D0Aa76CA4BEdE610e9aa08) |
| Frontend        | Vercel                 | Next.js UI with Tailwind CSS; supports event exploration, creation, and participation.             | [konnect-beige.vercel.app](https://konnect-beige.vercel.app)                                                               |
| Backend         | Render                 | Node.js + Socket.io server; manages real-time WebSocket interactions, avatar state, and chat.      | [konnect-1-orrz.onrender.com](https://konnect-1-orrz.onrender.com)                                                         |


---

## Future Enhancements

ETH Connect aims to evolve into a more comprehensive and intelligent hackathon ecosystem, targeting multiple stakeholders and improving user engagement and compliance tracking.

### Stakeholder Expansion

The platform plans to onboard various stakeholders, including:

* **Participants:** Gamified experiences with AI-powered guidance.
* **Companies / Sponsors:** AI agents to track engagement, analyze participant data, and suggest matches for hackathon challenges.
* **Organizers:** Tools for seamless event creation, analytics, and verification.

### AI Integration

* **Smart Agents:** AI agents will assist companies in monitoring participants, suggesting challenges, and providing real-time insights.
* **Participant Assistance:** AI guides can provide hints, tutorials, and tips based on user behavior in the 2D metaverse.

### Compliance and Rewards System

* **Requirement Tracking:** The system will validate if participants have completed necessary requirements, such as following social handles, completing tutorials, or submitting deliverables.
* **Reward Distribution:** Verified completion triggers automatic rewards, goodies, or points distribution, enhancing engagement and incentivizing participation.

### Enhanced Metaverse Interaction

* **Dynamic Map Exploration:** Participants can explore nearby events, interact with virtual booths, and receive AI-driven recommendations.
* **Event Personalization:** AI-powered matchmaking for challenges, networking, and team formation based on participant skills and preferences.

This roadmap ensures ETH Connect remains an accessible, interactive, and intelligent platform for hackathons, while providing measurable value to all stakeholders.

---
