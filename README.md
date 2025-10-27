# Invento.ry

Un sistema completo per la gestione di collezioni di libri con organizzazione per librerie e scaffali e gestione prestiti.

## Caratteristiche Principali

### Gestione Librerie
- Creazione e organizzazione di librerie multiple
- Ogni libreria contiene automaticamente 5 scaffali
- Visualizzazione statistiche (totale libri, disponibili, in lettura, prestati)
- Modifica e cancellazione librerie con gestione sicura dei dati

### Gestione Libri
- Catalogazione completa: titolo, autore, volume, stato, copertina
- Stati: Disponibile, In lettura, Prestato
- Vista griglia o lista con ordinamento personalizzato
- Filtri per stato e ricerca testuale
- Suggerimenti intelligenti per titolo e autore
- Paginazione per collezioni grandi
- Modifica rapida e eliminazione con undo

### Sistema Prestiti
- Registrazione prestiti con dati completi del prestatore
- Tracciamento date (prestito, scadenza, restituzione)
- Stati automatici: Attivo, In ritardo, Restituito
- Dashboard con statistiche prestiti
- Notifiche visive per libri in scadenza
- Filtri per stato prestito
- Storico completo per libro

### Autenticazione
- Sistema JWT per sicurezza
- Login/Logout
- Protezione routes lato client e server
- Token storage e validazione automatica

## Stack Tecnologico

### Frontend
- **Vue 3**
- **TypeScript**
- **Vite**

### Backend
- **Node.js** + **Express**
- **TypeScript**
- **MongoDB**

## Setup e Installazione

### Prerequisiti
- Node.js (v18+)
- MongoDB (v5+)
- npm o yarn

### 1. Clona il Repository
```bash
git clone <repository-url>
cd invento.ry
```

### 2. Setup Backend

```bash
cd backend
npm install
```

Crea file `.env` in `/backend`:
```env
MONGODB_URI=mongodb://localhost:27017/inventory
DB_NAME=inventory
PORT=5000
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:3000
JWT_SECRET=your_super_secret_jwt_key_here
```

### 3. Setup Frontend

```bash
cd ../frontend
npm install
```

Crea file `.env` in `/frontend`:
```env
VITE_API_URL=http://localhost:5000
```

### 4. Avvio Applicazione
```bash
npm run dev
```

## API Endpoints

### Autenticazione
- `POST /api/auth/login` - Login utente
- `GET /api/auth/me` - Ottieni utente corrente (JWT)

### Librerie
- `GET /api/libraries` - Lista librerie
- `GET /api/libraries/:id` - Dettaglio libreria con scaffali
- `POST /api/libraries` - Crea libreria
- `PUT /api/libraries/:id` - Aggiorna libreria
- `DELETE /api/libraries/:id` - Elimina libreria

### Scaffali
- `GET /api/shelves/by-library/:libraryId` - Scaffali per libreria
- `GET /api/shelves/:id` - Dettaglio scaffale
- `PUT /api/shelves/:id` - Aggiorna scaffale

### Libri
- `GET /api/books` - Lista libri (con paginazione, filtri, ricerca)
- `GET /api/books/stats` - Statistiche libri
- `GET /api/books/:id` - Dettaglio libro
- `GET /api/books/library/:libraryId` - Libri per libreria
- `GET /api/books/shelf/:shelfId` - Libri per scaffale
- `POST /api/books` - Crea libro
- `PUT /api/books/:id` - Aggiorna libro
- `DELETE /api/books/:id` - Elimina libro

### Prestiti
- `GET /api/loans` - Lista prestiti
- `GET /api/loans/stats` - Statistiche prestiti
- `GET /api/loans/:id` - Dettaglio prestito
- `GET /api/loans/book/:bookId` - Prestiti per libro
- `POST /api/loans` - Crea prestito
- `PUT /api/loans/:id` - Aggiorna prestito
- `PUT /api/loans/:id/return` - Segna come restituito
- `DELETE /api/loans/:id` - Elimina prestito