var ghGot = require('gh-got'),

    express = require('express'),
    bodyParser = require('body-parser'),
    app = express(),

    env = process.env,
    endpoint = env.GITHUB_API_URL || 'https://api.github.com/';

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
            // [owner, repoName] = repository.full_name.split('/');

        if (!repo) return;

        var branches = Object.keys(repo),
            branchName = data.ref.split('/').pop(),
            filesToWatch = repo[branchName];

        if (!filesToWatch) return;

        data.commits.forEach(function(commit) {
            commit.modified.forEach(function(file) {
                if (!filesToWatch[file]) return;

                console.log(file, 'was updated');

                // NOTE: it uses process.env.GITHUB_TOKEN as token
                ghGot('repos/' + repository.full_name + '/issues',
                    {
                        endpoint,
                        body: {
                            title: 'Update document translations',
                            body: 'File ' + file + ' was changed. Please update:\n' +
                                filesToWatch[file].targets.map(function(target) {
                                    return '* [' + target.file + '](http://cataria.rocks/?target=' +
                                        target.file + '&targetLang=' + target.lang +
                                        '&sourceLang=' + filesToWatch[file].sourceLang +
                                        '&doc=' + repoUrl + '/blob/' + branchName + '/' + file + ')';
                                }).join('\n')
                        }
                    }).catch(console.error);
            });
        });
    })
    .listen(8000, function() {
        console.log('started at 8000');
    });
