# Auction Platform API
### Progetto Programmazione Avanzata 2025/2026

## Table of contents

- [Auction Platform API](#auction-platform-api)
    - [Progetto Programmazione Avanzata 2025/2026](#progetto-programmazione-avanzata-20252026)
  - [Table of contents](#table-of-contents)
  - [1. Project description and objectives](#1-project-description-and-objectives)
    - [User functionality](#user-functionality)
    - [API endpoints](#api-endpoints)
    - [Auth](#auth)
    - [Users](#users)
    - [Auctions](#auctions)
    - [Bids](#bids)
    - [Utilities](#utilities)
  - [2. Technology stack](#2-technology-stack)
  - [3. Design and UML](#3-design-and-uml)
    - [Use case diagrams](#use-case-diagrams)
      - [Authentication Management](#authentication-management)
      - [User Management](#user-management)
      - [Auction Management](#auction-management)
      - [Bid Management](#bid-management)
    - [Sequence diagrams](#sequence-diagrams)
  - [4. Design Patterns and Code Architecture](#4-design-patterns-and-code-architecture)
    - [Design Patterns Used](#design-patterns-used)
  - [5. Installation and usage](#5-installation-and-usage)
    - [Setup Instructions](#setup-instructions)
      - [1. Clone the repository](#1-clone-the-repository)
      - [2. Load the necessary files](#2-load-the-necessary-files)
      - [3. Usage](#3-usage)
  - [6. Testing](#6-testing)
    - [Jest](#jest)
    - [Postman Collection](#postman-collection)

---

## 1. Project description and objectives

This project aims to create an auction management system. The system allows the creation of auctions and the participation to them through bids.

In particular, the system supports the following types of auctions:
- **English Auction**: An ascending-bid auction where the price starts low and bidders openly increase it. The highest bidder wins at the final bid amount.
- **Dutch Auction**: A descending-bid auction where the price starts high and decreases over time. The first bidder to accept wins at the current price.
- **First Price Sealed Bid Auction**: Bidders submit sealed bids without knowing others' bids. The highest bidder wins and pays their own bid amount.
- **Second Price Sealed Bid Auction**: Bidders submit sealed bids without knowing others' bids. The highest bidder wins but pays the second-highest bid amount.

### User functionality
The system provides three types of users:
- `auction-participant`: He has a wallet with a limited number of tokens. He can participate to an auction creating bids.
- `auction-creator`: He can create and update his own auctions.
- `admin`: He can recharge an user wallet and has access to auction stats.

### API endpoints

### Auth
| Method | Endpoint         | Description          | Authorization |
| ------ | ---------------- | -------------------- | ------------- |
| `POST` | `/api/v1/signup` | Signup of a new user | Public        |
| `POST` | `/api/v1/login`  | User authentication  | Public        |

### Users
| Method | Endpoint                               | Description                  | Authorization                       |
| ------ | -------------------------------------- | ---------------------------- | ----------------------------------- |
| `GET`  | `/api/v1/users/:userId/wallet`         | Get a user wallet balance    | _Admin_ **OR** _User_ with `userId` |
| `GET`  | `/api/v1/users/:userId/auction-report` | Get a user's auctions report | _Admin_ **OR** _User_ with `userId` |
| `GET`  | `/api/v1/users/:userId/wallet-report`  | Get a user's wallet report   | _Admin_ **OR** _User_ with `userId` |
| `PUT`  | `/api/v1/users/:userId/wallet`         | Top up a user's wallet       | _Admin_                             |

### Auctions
| Method | Endpoint                             | Description                                     | Authorization    |
| ------ | ------------------------------------ | ----------------------------------------------- | ---------------- |
| `POST` | `/api/v1/auctions`                   | Create a new auction                            | _AuctionCreator_ |
| `GET`  | `/api/v1/auctions`                   | List auctions filtered by the provided criteria | Public           |
| `GET`  | `/api/v1/auctions/stats`             | Get auction statistics grouped by auction type  | _Admin_          |
| `PUT`  | `/auctions/:auctionId/reserve-price` | Update an auction reserve price                 | _AuctionCreator_ |

### Bids
| Method | Endpoint                           | Description                                  | Authorization        |
| ------ | ---------------------------------- | -------------------------------------------- | -------------------- |
| `POST` | `/api/v1/auctions/:auctionId/bids` | Create a bid for the specified auction       | _AuctionParticipant_ |
| `GET`  | `/api/v1/auctions/:auctionId/bids` | List all the bids for the specified auctions | Public               |

### Utilities
| Method | Endpoint    | Description                       | Authorization |
| ------ | ----------- | --------------------------------- | ------------- |
| `GET`  | `/health`   | Health check                      | Public        |
| `GET`  | `/api-docs` | Swagger documentation for the API | Public        |


## 2. Technology stack
 - **Node.js**: JavaScript runtime environment
 - **TypeScript**: Static typing for the codebase
 - **Express**: Web framework for the REST API backend
 - **Sequelize**: ORM for PostgreSQL
 - **Zod**: Schema validation and type inference
 - **Auth0**: JWT-based authentication and authorization
 - **Redis**: In-memory store used for query caching
 - **BullMQ**: Redis-backed job queue used for auction settlement/closing
 - **Jest**: Unit and integration testing framework
 - **Winston**: Structured application logging
 - **Awilix**: Dependency injection container
 - **ESLint**: Static code analysis / linting
 - **Swagger**: OpenAPI documentation for the API
 - **Docker & Docker Compose**: Containerization and local orchestration
 - **Postman**: Manual/exploratory API testing

## 3. Design and UML

### Use case diagrams
The following diagrams illustrate the main use cases supported by the system and the interactions between actors and application functionalities. Each diagram focuses on a specific domain area, providing a high-level overview of the available operations and the permissions associated with each actor.

#### Authentication Management
This diagram illustrates the authentication operations supported by the system. All users can log in, while only non-administrator users can sign up.

![Use cases diagram: AuthManagement](./docs/images/useCase/AuthManagementUseCase.drawio.png)

#### User Management
This diagram illustrates the user-related operations supported by the system. Auction participants, auction creators, and administrators can view wallets. Auction participants and administrators can also view auction and wallet reports, while administrators can top up wallets.

![Use cases diagram: UserManagement](./docs/images/useCase/UserManagementUseCase.drawio.png)

#### Auction Management
This diagram illustrates the auction-related operations supported by the system. All users can view auctions, auction creators can create auctions and update reserve prices, and administrators can access auction statistics.

![Use cases diagram: AuctionManagement](./docs/images/useCase/AuctionManagementUseCase.drawio.png)

#### Bid Management
This diagram illustrates the bid-related operations supported by the system. All users can view auction bids, while only auction participants can place bids.

![Use cases diagram: BidManagement](./docs/images/useCase/BidManagementUseCase.drawio.png)

### Sequence diagrams
Route: `GET /api/v1/auctions`

![Sequence diagram: GetAuction](./docs/images/sequence/GetAuctionsSequenceDiagram.png)

Route: `GET /api/v1/auctions/:auctionId/bids`

![Sequence diagram: GetAuctionBids](./docs/images/sequence/GetAuctionBidsSequenceDiagram.png)

Route: `GET /api/v1/users/:userId/wallet`

![Sequence diagram: GetWallet](./docs/images/sequence/GetWalletSequenceDiagram.png)

Route: `POST /api/v1/auctions/:auctionId/bids`

![Sequence diagram: CreateBid](./docs/images/sequence/CreateBidSequenceDiagram.png)

Route: `PUT /api/v1/auctions/:auctionId/reserve-price`

![Sequence diagram: UpdateAuctionReservePrice](./docs/images/sequence/UpdateAuctionReservePriceSequenceDiagram.png)

## 4. Design Patterns and Code Architecture
The project follows a layered architecture:
- **Controllers**: HTTP request handlers and response management
- **Services**: Business logic for auction, auth, bidding, and user management
- **Repositories**: Data access layer abstracting Sequelize queries and Auth0 calls
- **Models**: Sequelize ORM models for database entities
- **Middleware**: Authentication, validation, and error handling
- **Utilities**: Helper functions, logging, and error factory

### Design Patterns Used
- **Controller-Service-Repository (CSR)**: Separation of concerns between HTTP handling, business logic, and data access
- **Repository Pattern**: Abstraction of database operations behind a consistent interface
- **Dependency Injection**: Awilix-managed container for wiring controllers, services, repositories, and their dependencies
- **Factory Pattern**: Abstract factory for constructing typed application errors and their messages
- **Cache-Aside Pattern**: Redis used to cache repository reads, with registry-based invalidation on writes
- **Job Queue Pattern**: Asynchronous auction settlement processing with BullMQ
- **Chain of Responsibility (COR)**: Request pipeline through routes &rarr; middleware &rarr; controllers &rarr; services &rarr; repositories

## 5. Installation and usage

### Setup Instructions

#### 1. Clone the repository
```bash
git clone https://github.com/simago44/Progetto_PA26.git
cd Progetto_PA26
```

#### 2. Load the necessary files
The necessary files for the correct operation of the system are the following:
- .env
- .env.development
- .env.production
- postman_environment.json
- seeds/users.json

#### 3. Usage

To run the development version use: `docker compose up --build -d`

To run the production version use: `docker compose -f compose.yaml -f compose.production.yaml up --build -d`

In development it's possible to seed the database using: `docker compose exec node npm run seed`

In development it's possible to run eslint on src/ and tests/ using: `docker compose exec node npm run lint`

In development it's possible to build the code using: `docker compose exec node npm run build`

## 6. Testing

### Jest

In development it's possible to run the tests using: `docker compose exec node npm run test`

The test suite covers all request-validation and authorization middlewares with unit tests that mock `Request`/`Response`/`next` and assert both the success path (correct `res.locals` population and a single `next()` call) and the failure path (a thrown `ValidationError`/`ForbiddenError` with the expected `details`).

- **AuctionMiddlewares** (`auctionMiddlewares.test.ts`)
  Covers auction creation for all four auction types (English, Dutch, First-Price, Second-Price), verifying correct payload shaping in `res.locals.auction` (including `creatorId` injection and the default `delayBeforeEnding` for English auctions) and rejection of an invalid payload with per-field error details. Also covers auction listing filters (comma-separated `creatorIds`/`statuses`/`types` parsing, including the empty-query case), reserve price updates (numeric coercion of `auctionId`/`reservePrice` and rejection of negative values), and auction stats filters (type list parsing, `fromDate`/`toDate` normalization, and rejection when `toDate` precedes `fromDate`).

- **AuthMiddlewares** (`authMiddlewares.test.ts`)
  Covers JWT-based permission checks (`checkPermission`, `checkSelfOrAllPermission`, including self-vs-all logic and `ForbiddenError` on mismatch/missing permissions), JWT authorization failure handling (`checkJwtAuthorization`), and `resolveUserIdParam` (`"me"` resolves to the authenticated user's id). Also covers signup validation (username normalization, allowed roles, and password strength — including a case producing four distinct password errors) and login validation (username normalization and `WrongCredentialsErrors` on missing fields).

- **BidMiddlewares** (`bidMiddlewares.test.ts`)
  Covers auction-bid retrieval (`auctionId` param extraction) and bid creation (`res.locals.bid` shaping with injected `userId`/`auctionId`, and rejection of a non-numeric `bidPrice`).

- **UserMiddlewares** (`userMiddlewares.test.ts`)
  Covers wallet top-up (positive token validation and rejection of zero/negative amounts), auction report filters (`won` boolean coercion, `types` list parsing, `participantId` injection, date range validation with rejection of a `fromDate` in the future), and wallet report filters (`participantId` injection and rejection when `toDate` precedes `fromDate`).

![Jest output](./docs/images/jest_output.png)

### Postman Collection
Alongside the automated test suite, the repository includes a Postman collection for manual/exploratory testing of the live API. It contains a request for every endpoint, plus a set of setup requests to streamline debugging:

- **Auth setup requests** — `login auction-participant`, `login auction-creator`, `login admin`, one for each user role, which populate the JWT token needed to authorize subsequent requests.
- **Auction setup requests** — one per auction type (`create english auction`, `create dutch auction`, `create first-price auction`, `create second-price auction`), for quickly spinning up auctions to bid on or test against.

Before running the Postman collection it's necessary to import the `postman_environment.json` file.
Furthermore, it's also necessary to run the database seeding, which loads the default test users along with some sample auction and bids.