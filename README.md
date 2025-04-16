# Chess Training Dashboard

This project is a chess training application designed to help users analyze their games and gain insights into their play. It aims to integrate with online chess platforms like Lichess and Chess.com, analyze imported PGNs, and provide feedback on tactics, openings, and chess fundamentals.

This application was initially planned based on the [Chess Training App MVP Plan](attached_assets/Chess%20Training%20App%20MVP%20Plan_.md).

## Development Environment

This project was developed using [Replit](https://replit.com/).

## Technology Stack

**Original Plan (from MVP Document):**

*   **Frontend:** ReactJS + Vite
*   **Backend:** Django REST API (Python)
*   **Database:** PostgreSQL / Supabase

**Inferred Current Implementation (based on Repo Language - 99.9% TypeScript):**

*   **Frontend:** Likely **ReactJS + Vite** (as planned, a common modern stack).
*   **Backend:** TypeScript-based framework, such as **Node.js with Express or NestJS**, or a full-stack React framework like **Next.js** or **Remix**.
*   **Database:** Plausibly **PostgreSQL managed via Supabase** (as planned, Supabase integrates well with JavaScript/TypeScript).

*(Developer Note: Please confirm and update this section with the specific frameworks, libraries (e.g., ORM like Prisma/TypeORM), and database used in the actual implementation.)*

## Project Status & Implemented Features (Based on MVP Plan)

This section outlines the features described in the MVP plan and suggests where to look for their implementation within the TypeScript codebase.

*   **1. User Registration and Authentication:**
    *   *Plan:* Use Django's auth system with email/password, secure API with JWT (Refs: 1, 2, 3, 7, 59).
    *   *Status:* Look for TypeScript equivalents like **Passport.js**, **NextAuth.js**, or **Supabase Auth** for user management. Check for JWT implementation using libraries like `jsonwebtoken` for securing API endpoints.
*   **2. Chess Account Integration (Lichess and Chess.com):**
    *   *Plan:* Lichess via OAuth 2.0 (Refs: 8, 9), Chess.com via public API (Refs: 11, 12, 13, 14). Secure OAuth token storage (Refs: 10, 55).
    *   *Status:* Check for TypeScript HTTP client usage (e.g., `axios`, built-in `fetch`) interacting with Lichess/Chess.com APIs. Look for OAuth 2.0 client libraries (e.g., `simple-oauth2`, framework-specific helpers) for Lichess integration. Verify implementation of secure server-side token storage (e.g., encrypted fields in DB via ORM, Supabase secrets). Check for rate limiting logic on external API calls.
*   **3. Game Data Management (PGN Handling and Storage):**
    *   *Plan:* Fetch/upload PGNs, store raw PGN in PostgreSQL `Game` table, potentially parse basic info (Refs: 15, 16).
    *   *Status:* Look for TypeScript PGN parsing libraries (e.g., `@mliebelt/pgn-parser`, `chess.js` PGN functions). Check database interaction code (e.g., **Prisma**, **TypeORM**, **Supabase client**) for storing/retrieving game data according to the planned `Game` table structure.
*   **4. Analysis Pipelines:**
    *   *Plan:* Asynchronous pipelines (Game Analysis, Tactics, Openings, Fundamentals) stored in `AnalysisResult` table.
    *   *Status:* This is the core logic. Look for:
        *   **Game Analysis:** Basic win/loss/draw extraction from PGN data.
        *   **Tactics:** Integration with a chess engine like Stockfish (Refs: 17, 18, 19, 20) possibly using **Stockfish.js** or a WASM build. Logic to analyze evaluation differences between moves to find blunders/missed tactics. Thresholds for detection should be defined.
        *   **Openings:** Logic to identify openings, potentially using a library like **chess.js** with an opening book/database (Refs: 21, 22, 23, 24, 25, 27, 31, 32, 33), such as the Lichess openings dataset.
        *   **Fundamentals:** Implementation of simple checks based on rules/heuristics for piece development, king safety (Refs: 39, 41, 42), and pawn structure (Refs: 34, 37, 48, 50, 52, 53, 54). Metrics should be clearly defined (Ref: 34, 36).
    *   Check if asynchronous task queues (e.g., **BullMQ**, **Celery equivalents in Node.js**) are used if the analysis is performed in the background. Verify storage of results in the database, matching the `AnalysisResult` table plan.
*   **5. Insights Aggregator:**
    *   *Plan:* Retrieve analysis results from `AnalysisResult` table and format them for the frontend.
    *   *Status:* Dependent on the analysis pipelines. Check for API endpoints in the TypeScript backend that query analysis results (likely joining `Game` and `AnalysisResult` tables) and structure the data for frontend consumption.
*   **6. Data Model:**
    *   *Plan:* PostgreSQL schema (User, LinkedAccount, Game, AnalysisResult) managed via Supabase (Refs: 4, 5).
    *   *Status:* Verify if a TypeScript ORM (**Prisma**, **TypeORM**) or the **Supabase client** defines a database schema matching the tables and relationships described in the plan (User, LinkedAccount, Game, AnalysisResult). Check for database migrations. Ensure appropriate indexes are planned or created for performance.
*   **7. Security and Privacy:**
    *   *Plan:* Secure token storage (Refs: 10, 55), account unlinking/deletion, rate limiting, standard web security (XSS, CSRF, SQLi protection) (Refs: 56, 57, 58).
    *   *Status:* Requires code review/audit. Look for implementation of security best practices within the TypeScript stack: Use of security middleware (e.g., **Helmet** for Express/Node.js), proper input validation/sanitization, ORM features preventing SQL injection, secure handling of secrets/API keys, implementation of rate limiting, and mechanisms for data deletion/account unlinking.

## Setup and Running the Project

*(Developer Note: Please provide specific instructions based on the actual project setup. Since it was developed on Replit, cloning and running might involve specific Replit configurations or standard Node.js/TypeScript steps.)*

```bash
# Example generic setup steps (replace with actual commands)

# 1. Clone the repository (if outside Replit)
# git clone <repository-url>
# cd replit_chess_dashboard

# 2. Install dependencies
npm install
# or yarn install or pnpm install

# 3. Configure environment variables
# Copy the example environment file
cp .env.example .env

# Edit the .env file with your specific configurations:
# - Database connection string (e.g., Supabase URL and key)
# - JWT secret key
# - Lichess/Chess.com API credentials/OAuth settings (if applicable)
# - Any other required service keys

# 4. Apply database migrations (if using an ORM like Prisma)
# npx prisma migrate dev

# 5. Run the development server
npm run dev
# or check package.json for the correct script (e.g., start:dev, dev)

# The application should now be running (check console output for URL)
```
Consult the `package.json` file for specific scripts related to building, testing, and running the application.

## Future Considerations (From MVP Plan)

*   Modular pipeline design allows for adding new analyses easily.
*   Potential for advanced features like a personalized coach agent based on aggregated data.
*   Refining analysis thresholds (e.g., centipawn difference for tactics).
*   Improving opening identification (e.g., using Lichess dataset, Polyglot format - Ref: 32).
*   Defining specific, measurable metrics for fundamental checks (piece development, king safety, pawn structure).
*   Ongoing database indexing and performance optimization as data grows.

---

*This README provides an overview based on the initial MVP plan and the inferred technology shift to TypeScript. The developer (`ViniciusBrown`) should review and update this file to accurately reflect the current project state, implemented features, specific technologies/libraries used, and precise setup instructions.*
