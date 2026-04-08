# RestoSoft – Frontend

Aplicație **Next.js** pentru RestoSoft (POS, ospătar, KDS, admin, stocuri).

## Cerințe

- Node.js 18+
- Backend API (ex. `NEXT_PUBLIC_API_URL`)

## Setup

```bash
npm install
cp .env.local.example .env.local   # editează URL-ul API
npm run dev
```

## Variabile de mediu

| Variabilă | Descriere |
|-----------|-----------|
| `NEXT_PUBLIC_API_URL` | URL backend (ex. `http://localhost:3001`) |
| `CAP_SERVER_URL` | URL frontend pentru Capacitor dev (ex. `http://192.168.1.10:3000`) |

## Scripturi

- `npm run dev` – development
- `npm run build` – build producție
- `npm run start` – pornește build-ul
- `npm run lint` – ESLint
- `npm run cap:android:add` – adaugă platforma Android
- `npm run cap:sync` – sincronizează proiectul web cu platformele native
- `npm run cap:android` – deschide proiectul Android Studio

## Capacitor (Android)

Setup rapid:

```bash
npm install
cp .env.mobile.example .env.local
npm run dev
npm run cap:android:add
npm run cap:sync
npm run cap:android
```

Notă:
- pe device real, `NEXT_PUBLIC_API_URL` și `CAP_SERVER_URL` trebuie setate pe IP-ul tău din LAN, nu `localhost`.

## Licență

Proprietar / conform acordului proiectului.
