📂 Repo layout — opinionated & battle-tested

plexe-assignment/
├── docker-compose.yml         # one-liner spin-up
├── Makefile                   # alias dev, test, lint, gen-types
├── README.md
│
├── backend/
│   ├── app/
│   │   ├── main.py            # FastAPI instance, router registration
│   │   ├── core/
│   │   │   ├── config.py      # env, settings, constants
│   │   │   └── deps.py        # common Depends factories
│   │   ├── schemas/           # Pydantic models ← single source of truth
│   │   │   ├── model_meta.py
│   │   │   └── prediction.py
│   │   ├── services/
│   │   │   ├── registry.py    # load/save models on disk
│   │   │   └── predictor.py   # wraps XGBClassifier inference
│   │   ├── routers/
│   │   │   ├── models.py      # POST /models, GET /models…
│   │   │   └── predict.py     # POST /models/{id}/predict
│   │   ├── storage/           # sqlite file or S3 stub
│   │   └── tests/
│   │       └── test_smoke.py
│   ├── Dockerfile
│   └── requirements.txt
│
├── frontend/
│   ├── app/                   # Next 14 “app dir”
│   │   ├── page.tsx           # root chat page
│   │   ├── components/
│   │   │   ├── Chat.tsx
│   │   │   ├── FileUpload.tsx
│   │   │   └── ModelList.tsx
│   │   └── lib/
│   │       └── api.ts         # ⚠️ auto-generated types + fetchers
│   ├── styles/
│   ├── public/
│   ├── tailwind.config.js
│   ├── next.config.js
│   ├── package.json
│   └── Dockerfile
│
└── scripts/
    ├── export_openapi.py      # dumps openapi.json from FastAPI
    └── gen_types.sh           # npx openapi-typescript → frontend


⸻

🚀 Bootstrap strategy (chronological)
	1.	Back-end scaffold (30 min)

cd backend && python -m venv .venv
pip install fastapi[all] pydantic xgboost joblib sqlmodel
uvicorn app.main:app --reload

Write the POST /models & POST /models/{id}/predict routes first; everything else piggy-backs.

	2.	OpenAPI export → type generation (5 min)

python scripts/export_openapi.py          # produces backend/openapi.json
npx openapi-typescript backend/openapi.json \
     --output frontend/app/lib/api.ts     # typed fetch hooks

Run via make gen-types whenever the schema changes.

	3.	Next.js + Tailwind (20 min)

pnpm create next-app frontend --ts --tailwind --eslint

Consume api.ts with useQuery-style wrappers or roll your own lightweight fetcher.

	4.	Dockerisation (15 min)

# docker-compose.yml
services:
  api:
    build: ./backend
    command: uvicorn app.main:app --host 0.0.0.0 --port 8000
    volumes: ["./backend:/opt/app"]
    ports: ["8000:8000"]
  web:
    build: ./frontend
    command: npm run start
    ports: ["3000:3000"]
    depends_on: [api]

Reviewer runs docker compose up -d → swagger at :8000/docs, chat at :3000.

	5.	Smoke tests & lint (15 min)
pytest for the happy path; ruff + prettier keep noise out of the diff.

⸻

🔧 Strong-opinion notes
	•	One repo, two Dockerfiles — avoids mono-image bloat; lets reviewers run only the part they care about.
	•	Pydantic v2 everywhere — keeps DTOs, validation, and generated schema in lock-step.
	•	Type generation is mandatory — “type awareness” isn’t a nice-to-have; catching refactor breakages at compile-time saves you later.
	•	Skip database migrations — SQLite file is fine for an assignment; alembic is yak-shaving here.
	•	No global state in FastAPI — keep registry in a singleton service class to enable future Statestore swap-out.
	•	Tailwind over component libraries — faster to theme to Plexe’s palette than overriding MUI/Chakra CSS.
