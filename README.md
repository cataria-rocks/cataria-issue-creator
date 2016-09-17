# cataria-issue-creator

Service to automatically create issues for translaters when a doc on a source language was updated in github repo.

## Usage

### Adding a new repo

Create a webhook to send payloads to `cataria-issue-creator` for each push to a repo:
`https://github.com/:owner:/:repo:/settings/hooks`.

### Adding new documents

Use HTTP API to add new documents to DB: `http://cataria.rocks:8000/update?source=https://github.com/tadatuta/tst/blob/master/b1.ru.md&target=b1.en.md`.
