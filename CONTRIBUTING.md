# Contributing

Thank you for contributing to the Accessify Growth Engine.

## Development setup

1. Clone the repo and install dependencies: `npm install`
2. Copy `.env.local.example` to `.env.local` and set Supabase (and optional) variables — see [docs/SETUP.md](docs/SETUP.md)
3. Apply the database schema and migrations in Supabase (see [docs/SETUP.md](docs/SETUP.md))
4. Run the app: `npm run dev`

## Code and style

- **TypeScript** — Use TypeScript for app and lib code; keep types explicit where it helps.
- **Linting** — Run `npm run lint` before committing.
- **Formatting** — Follow existing style (indentation, quotes). Consider Prettier if the project adopts it.
- **Components** — Reuse UI from `components/ui/`; add new primitives there if needed. Dashboard-specific pieces go under `components/dashboard/`.

## Docs

- Update **README.md** if you change setup, scripts, or high-level behaviour.
- Add or update files under **docs/** for setup, architecture, API, or run instructions — and keep [docs/README.md](docs/README.md) index in sync.
- **FILE_STRUCTURE.md** — Update when adding or removing top-level dirs or important files.

## Pull requests

- Describe what changed and why.
- Ensure `npm run build` and `npm run lint` pass.
- If you change env or database, document it in the relevant doc (e.g. SETUP.md, RUNNING.md).

## Questions

For internal projects, reach out to the team lead or open an issue in the repo.
