# cataria-issue-creater

Service to automatically create issues for translaters when a doc on a source language was updated in github repo.

## Usage

### Adding new documents

Use HTTP API to add new documents to DB: `http://cataria.rocks:8000/update?source=https://github.com/tadatuta/tst/blob/master/b1.ru.md&target=b1.en.md`.
