# snapshots

Backups, because this project has no version control.

Before you change anything - and again before you hand your files back - copy what you are about
to touch in here under today date:

```powershell
$stamp = Get-Date -Format "yyyy-MM-dd"
New-Item -ItemType Directory -Force -Path "snapshots\$stamp" | Out-Null
Copy-Item -Path "data" -Destination "snapshots\$stamp\data" -Recurse -Force
```

Rules:

- One folder per day: `snapshots/2026-10-11/`.
- Always include the whole `data/` folder. It is the thing that gets corrupted.
- Keep the last few days. Delete older ones only after the manager has accepted that version.
- `snapshots/` is your own undo. It is never part of a hand-back and never part of the demo.
