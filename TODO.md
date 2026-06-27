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
# NOTA: per le rotte users, si può usare self per riferirsi all'id presente nel token JWT
- [x] `POST /signup` – Crea un nuovo utente
- [x] `POST /login` – Accedi ad un account utente
- [ ] `GET /users/:id/wallet` – Verifica credito residuo (ruolo: bid-participant se id=self o id===jwt_id, altrimenti ruolo: admin)
- [ ] `PUT /users/:id/wallet` – Ricarica wallet utente (ruolo: admin)
- [ ] `GET /users/:id/auctions-report` – Storico aste a cui si è partecipato, con esito aggiudicazione (ruolo: bid-participant se id=self o id===jwt_id, altrimenti ruolo: admin)
- [ ] `GET /users/:id/wallet-report` – Spesa in un periodo per aggiudicazioni (ruolo: bid-participant se id=self o id===jwt_id, altrimenti ruolo: admin) uri parameters: start=data end=data
- [x] `POST /auctions` – Crea nuova asta (ruolo: bid-creator)
- [x] `GET /auctions` – Lista aste con filtro per stato (pubblica, non autenticata)
- [ ] `POST /auctions/:id/bids` – Crea offerta per un'asta (ruolo: bid-participant)
- [ ] `PUT /auctions/:id/price` – Aggiorna prezzo asta olandese se di tipo manuale (ruolo: bid-creator)
- [ ] `GET /auctions/:id/bids` – Lista rilanci aste aperte (pubblica)
- [ ] `GET /auctions/:type/stats` – Statistiche per tipologia di asta: numero aste, media/minimo/massimo partecipanti (ruolo: admin)

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