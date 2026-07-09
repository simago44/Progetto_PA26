# Auction Platform API
### Progetto Programmazione Avanzata 2025/2026

## Table of contents

- [Auction Management System](#progetto-programmazione-avanzata-20252026)
  - [Indice](#indice)
  - [1. Project description and objectives](#1-project-description-and-objectives)
    - [Key Features](#key-features)
  - [2. Technology stack](#2-technology-stack)
  - [3. Design and UML](#3-design-and-uml)
    - [Core Entities](#core-entities)
  - [4. Design Patterns and Code Architecture](#4-design-patterns-and-code-architecture)
    - [Design Patterns Used](#design-patterns-used)
  - [5. Installation and usage](#5-installation-and-usage)
    - [Prerequisites](#prerequisites)
    - [Setup Instructions](#setup-instructions)

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
| Method | Endpoint | Description | Authorization |
|---------|----------|-------------|---------------|
| `POST` | `/api/v1/signup` | Signup of a new user | Public |
| `POST` | `/api/v1/login` | User authentication | Public |

### Users
| Method | Endpoint | Description | Authorization |
|---------|----------|-------------|---------------|
| `GET` | `/api/v1/users/:userId/wallet` | Get a user wallet balance | _Admin_ **OR** _User_ with `userId` |
| `GET` | `/api/v1/users/:userId/auction-report` | Get a user's auctions report | _Admin_ **OR** _User_ with `userId` |
| `GET` | `/api/v1/users/:userId/wallet-report` | Get a user's wallet report | _Admin_ **OR** _User_ with `userId` |
| `PUT` | `/api/v1/users/:userId/wallet` | Top up a user's wallet | _Admin_ |

### Auctions
| Method | Endpoint | Description | Authorization |
|---------|----------|-------------|---------------|
| `POST` | `/api/v1/auctions` | Create a new auction | _AuctionCreator_ |
| `GET` | `/api/v1/auctions` | List auctions filtered by the provided criteria | Public |
| `GET` | `/api/v1/auctions/stats` | Get auction statistics grouped by auction type | _Admin_ |
| `PUT` | `/auctions/:auctionId/reserve-price` | Update an auction reserve price | _AuctionCreator_ |

### Bids
| Method | Endpoint | Description | Authorization |
|---------|----------|-------------|---------------|
| `POST` | `/api/v1/auctions/:auctionId/bids` | Create a bid for the specified auction | _AuctionParticipant_ |
| `GET` | `/api/v1/auctions/:auctionId/bids` | List all the bids for the specified auctions | Public |

### Utilities
| Method | Endpoint | Description | Authorization |
|---------|----------|-------------|---------------|
| `GET` | `/health` | Health check | Public |
| `GET` | `/api-docs` | Swagger documentation for the API | Public |


## 2. Technology stack
 - **Node.js**
 - **Express**
 - **Sequelize**
 - **Auth0**
 - **Redis**
 - **BullMQ**
 - **Jest**
 - **Winston**
 - **Swagger**
 - **Docker & Docker compose**
 - **Postman**

## 3. Design and UML

### Use case diagrams
![Use cases diagram: AuthManagement](./docs/images/useCase/AuthManagementUseCase.drawio.png)
![Use cases diagram: UserManagement](./docs/images/useCase/UserManagementUseCase.drawio.png)
![Use cases diagram: AuctionManagement](./docs/images/useCase/AuctionManagementUseCase.drawio.png)
![Use cases diagram: BidManagement](./docs/images/useCase/BidManagementUseCase.drawio.png)


### Core Entities
- **Users**: Bidders and auctioneers authenticated via Auth0
- **Auctions**: Auction instances with metadata and configuration
- **Bids**: Bid records with amounts, timestamps, and bid history
- **AuctionTypes**: Enumerated auction mechanisms

## 4. Design Patterns and Code Architecture

The project follows a layered architecture:

- **Controllers**: HTTP request handlers and response management
- **Services**: Business logic for auction management and bidding
- **Models**: Sequelize ORM models for database entities
- **Middleware**: Authentication, validation, and error handling
- **Utilities**: Helper functions, logging, and error definitions

### Design Patterns Used
- **CSR Pattern**: Separation of concerns between controllers, services and repositories
- **Repository Pattern**: Abstraction of database operations
- **Job Queue Pattern**: Asynchronous processing with BullMQ
- **Singleton Pattern**: Redis and database connections
- **Chain of Responsibility**: Trough routes, middlewares and controllers, services and repositories.

## 5. Installation and usage

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone https://github.com/simago44/Progetto_PA26.git
   cd Progetto_PA26