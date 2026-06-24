# TODO – Sistema di Gestione Aste

## Setup iniziale
- [x] Inizializzare progetto Node.js con TypeScript
- [x] Configurare Express
- [x] Configurare Sequelize con RDBMS scelto (es. SQLite/PostgreSQL)
- [x] Configurare autenticazione con Auth0
- [x] Configurare Docker / docker-compose

## Modelli del database
- [ ] Modello `User` (ruoli: admin, bid-creator, bid-participant)
- [ ] Vedere come implementare il `Wallet` (attributo in user o modello separato?)
- [ ] Modello `Auction` (tipologia, stato, parametri specifici)
- [ ] Modello `Bid` (offerta, utente, asta, importo)
- [ ] Modello `AuctionParticipant` (partecipanti per asta)

## Seed
- [ ] Valutare utilizzo di Faker per generare dati iniziali
- [ ] Seed utenti con ruoli (numerosità significativa)
- [ ] Seed wallet con token iniziali
- [ ] Seed aste di esempio per ogni tipologia e stato
- [ ] Seed offerte di esempio

## Tipologie di asta
- [ ] Implementare logica **English Auction** (ascendente, round, quota fissa)
- [ ] Implementare logica **Dutch Auction** (discendente, prezzo minimo, dichiarazione invenduto)
- [ ] Implementare logica **First Price Sealed Bid** (busta chiusa, paga il massimo offerto)
- [ ] Implementare logica **Second Price Sealed Bid / Vickrey** (busta chiusa, paga il secondo prezzo)

## Rotte API
- [ ] `POST /auctions` – Crea nuova asta (ruolo: bid-creator)
- [ ] `GET /auctions` – Lista aste con filtro per stato (pubblica, non autenticata)
- [ ] `POST /auctions/:id/bids` – Crea offerta per un'asta (ruolo: bid-participant)
- [ ] `POST /auctions/:id/options` – Crea opzione/valore per acquirenti (ruolo: bid-creator)
- [ ] `GET /auctions/:id/bids` – Lista rilanci aste aperte (pubblica)
- [ ] `GET /wallet` – Verifica credito residuo (ruolo: bid-participant)
- [ ] `POST /admin/wallet/recharge` – Ricarica wallet utente (ruolo: admin)
- [ ] `GET /auctions/history` – Storico aste con filtro temporale e stato aggiudicazione (ruolo: bid-participant)
- [ ] `GET /auctions/spending` – Spesa in un periodo per aggiudicazioni (ruolo: bid-participant)
- [ ] `GET /admin/stats` – Statistiche per tipologia di asta in intervallo temporale (ruolo: admin)

## Logica di business
- [ ] Verifica capienza wallet prima di ogni offerta (rifiuto con 401 se insufficiente)
- [ ] Scalare credito al vincitore all'atto dell'aggiudicazione (secondo la strategia dell'asta)
- [ ] Restituzione 401 se i token dell'utente sono esauriti
- [ ] Gestione stato aste: `not_started`, `running`, `ended`

## Middleware
- [ ] Middleware autenticazione Auth0
- [ ] Middleware autorizzazione per ruolo
- [ ] Middleware validazione delle richieste
- [ ] Middleware gestione errori centralizzata

## Design Pattern
- [ ] Scegliere e documentare i pattern usati (es. Factory, Strategy, Repository, Middleware Chain…)
- [ ] Implementare i pattern scelti

## Testing
- [ ] Test con Jest di almeno 2 middleware
- [ ] Collezione Postman con chiamate per tutte le rotte

## Documentazione (README.md)
- [ ] Obiettivo del progetto
- [ ] Diagrammi UML: casi d'uso
- [ ] Diagrammi UML: sequenze
- [ ] Descrizione design pattern con motivazioni
- [ ] Istruzioni avvio con Docker / docker-compose
- [ ] Risultati test Jest
- [ ] Esempi chiamate Postman

## Consegna
- [ ] Pubblicare repository pubblico su GitHub
- [ ] Verificare commit id da consegnare
- [ ] Consegnare su Moodle con URL repo, commit id e data esame