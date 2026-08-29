# Cosa mangiamo?

Webapp condivisa per pianificare il menu settimanale (pranzo e cena, giorno per
giorno) e la lista della spesa, pensata per essere usata da telefono al posto
dei messaggi WhatsApp.

- **Frontend:** React + Vite, ospitato gratis su GitHub Pages.
- **Dati:** Supabase (Postgres), con sincronizzazione in tempo reale — se uno
  dei due modifica il menu o la lista, l'altro lo vede aggiornarsi senza dover
  ricaricare la pagina.
- **Accesso:** nessun account individuale, solo un PIN condiviso salvato nel
  browser dopo il primo utilizzo.

## 1. Crea il progetto Supabase (gratis)

1. Vai su [supabase.com](https://supabase.com), crea un account e un nuovo progetto.
2. Nel progetto, apri **SQL Editor -> New query**, incolla il contenuto di
   [`supabase/schema.sql`](./supabase/schema.sql) ed eseguilo. Questo crea le
   due tabelle (`weeks` e `shopping_items`) e i permessi necessari.
3. Vai su **Database -> Replication** e attiva la replica (realtime) per le
   tabelle `weeks` e `shopping_items`, altrimenti gli aggiornamenti in tempo
   reale non arriveranno all'altro telefono.
4. Vai su **Project Settings -> API** e copia:
   - **Project URL** → sarà `VITE_SUPABASE_URL`
   - **anon public key** → sarà `VITE_SUPABASE_ANON_KEY`

> Nota sulla sicurezza: non essendoci login individuale, l'app usa la chiave
> `anon` con permessi aperti in lettura/scrittura su queste due tabelle. Va
> benissimo per una lista della spesa di casa, ma non riutilizzare questo
> stesso progetto Supabase per dati sensibili.

## 2. Sviluppo in locale

```bash
npm install
cp .env.example .env
# apri .env e incolla i valori di Supabase, più un PIN a piacere (es. 4821)
npm run dev
```

Apri l'indirizzo mostrato in terminale (di solito `http://localhost:5173`).

## 3. Pubblica su GitHub Pages

1. Crea un repository su GitHub e caricaci questo progetto.
2. In `vite.config.js`, imposta `base` con il nome esatto del tuo repository,
   ad esempio `/menu-settimanale/` (deve combaciare, maiuscole/minuscole
   comprese). Se il repository si chiama `<tuo-utente>.github.io`, metti `/`.
3. Nel repository su GitHub: **Settings -> Pages -> Build and deployment ->
   Source**, seleziona **GitHub Actions**.
4. Sempre su GitHub: **Settings -> Secrets and variables -> Actions ->
   New repository secret**, e aggiungi tre secret:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_APP_PIN`
5. Fai push sul branch `main`: il workflow in
   [`.github/workflows/deploy.yml`](./.github/workflows/deploy.yml) builda il
   sito e lo pubblica automaticamente. Il link comparirà in **Settings ->
   Pages** dopo qualche minuto.

Da quel momento, ogni push su `main` ripubblica automaticamente l'ultima
versione.

## 4. Uso quotidiano

- L'app ora ha un'icona e un manifest propri: su iPhone (Safari) toccate
  Condividi -> "Aggiungi alla schermata Home"; su Android (Chrome) toccate il
  menu (⋮) -> "Installa app" o "Aggiungi a schermata Home". Si aprirà a schermo
  intero, con la propria icona, senza barra degli indirizzi del browser.
- La prima volta vi chiederà il PIN concordato; da lì in poi resta salvato sul
  telefono.
- Le frecce in alto permettono di spostarsi tra le settimane; "torna a oggi"
  riporta rapidamente alla settimana corrente.
- La lista della spesa è legata alla settimana che state guardando.

## Struttura del progetto

```
src/
  components/   Componenti React (PIN, navigazione, menu, lista spesa)
  lib/           Funzioni per le date e il client Supabase
  styles/        Variabili di design (colori, font)
supabase/
  schema.sql     Schema del database da eseguire su Supabase
.github/workflows/deploy.yml   Pubblicazione automatica su GitHub Pages
```

## Possibili miglioramenti futuri

Idee lasciate volutamente fuori da questa prima bozza, per non appesantirla:

- Generare automaticamente la lista della spesa a partire dal menu (richiede
  un piccolo "database" di ingredienti per piatto).
- Storico dei menu delle settimane passate, per ripescare velocemente un
  piatto già fatto.
- Notifiche push quando l'altra persona modifica qualcosa.
- Riordinare gli elementi della lista della spesa per corsia del supermercato.
