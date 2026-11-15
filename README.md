# Catalogo stile app — Eleventy + Decap CMS + Fleek

Sito catalogo/menu con interfaccia da app mobile (tema scuro, accento arancione):
home con categorie, offerte e prodotti in evidenza, ricerca con filtri, scheda prodotto
con varianti ed extra, preferiti, carrello con codici promo e invio dell'ordine su
WhatsApp o Telegram, pagina Info con orari e contatti.

Tutti i contenuti si gestiscono da **`/admin`**: nessun file da toccare a mano.

## Pannello admin (`/admin`)

| Sezione | Cosa gestisci |
|---|---|
| **Prodotti** | nome, categoria, foto, prezzo (e prezzo barrato), descrizione, etichetta (es. "Bestseller"), varianti/formati (scelta singola), extra (scelta multipla), in evidenza, disponibile/esaurito, visibile, ordine |
| **Categorie** | nome, icona emoji o immagine, ordine, visibile |
| **Offerte** | banner con titolo, sottotitolo, colore o immagine, codice promo con sconto (percentuale, fisso, consegna gratuita), ordine minimo, sconto massimo, attiva |
| **Impostazioni** | nome e logo, testi della home, avviso in evidenza, costi e tempi di consegna, ordine minimo, canale ordini (WhatsApp/Telegram), contatti, orari, indirizzo, footer |

Ogni salvataggio fa un commit nel repository: il sito si ricostruisce e si aggiorna da solo.

> **Login:** `admin/config.yml` usa il backend `git-gateway` (come la versione precedente),
> che richiede Netlify Identity. Se il sito resta su Fleek senza Netlify, cambia backend
> in `github` con un provider OAuth: vedi https://decapcms.org/docs/backends-overview/

## Sviluppo locale

```bash
npm install
npm start          # sito su http://localhost:8080
npm run cms        # (altro terminale) admin locale senza login su http://localhost:8080/admin
```

## Struttura

```
admin/                 pannello Decap CMS (index.html + config.yml)
assets/style.css       stile
assets/app.js          logica app (navigazione, carrello, preferiti, ordini)
img/uploads/           immagini caricate dall'admin
src/_data/settings.json  impostazioni negozio
src/products/*.md      prodotti
src/categories/*.md    categorie
src/offers/*.md        offerte
src/index.njk          pagina unica dell'app
.eleventy.js           build: unisce i contenuti in un catalogo JSON
```

## Deploy su Fleek

Build `npm run build`, cartella pubblica `dist` (già in `.fleek.json`).
