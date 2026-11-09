# Edicola Hunter

Ricerca personale di notizie pubbliche su chiusure e liquidazioni di edicole e cartolerie in Lombardia.

## Funzionamento
- GitHub Actions esegue la ricerca quotidiana e può essere avviato manualmente.
- Cerca notizie tramite Google News RSS.
- Deduplica gli articoli usando il link e conserva lo storico in data/leads.json.
- Invia su Telegram le nuove piste trovate.

## Configurazione obbligatoria
In GitHub: Settings → Secrets and variables → Actions → New repository secret.

Aggiungere:
- TELEGRAM_BOT_TOKEN
- TELEGRAM_CHAT_ID

Non inserire mai i valori dei segreti nei file del repository.

## Limiti
Questa prima versione individua notizie e piste, non conferma che esistano rimanenze acquistabili. Ogni pista va verificata manualmente. La ricerca RSS può non trovare tutte le opportunità.
