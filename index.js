var express = require('express'),
    bodyParser = require('body-parser'),
    app = express(),
    db = require('./db'),
    repos = Object.keys(db);

app
    .use(bodyParser.json())
    .all('/', function(req, res) {
        // console.log(JSON.stringify(req.body, null, 4));

        var data = req.body,
            repository = data.repository,
            repoUrl = repository.url,
            repo = db[repoUrl];

        if (!repo) return;

        var branches = Object.keys(repo),
            branchName = data.ref.split('/').pop(),
            filesToWatch = repo[branchName];

        if (!filesToWatch) return;

        data.commits.forEach(function(commit) {
            commit.modified.forEach(function(file) {
                filesToWatch.includes(file) && console.log(file, 'was updated');
            });
        });
    })
    .listen(8000, function() {
        console.log('started at 8000');
    });
