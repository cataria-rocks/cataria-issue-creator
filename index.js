var fs = require('fs'),
    ghGot = require('gh-got'),
    parseGHUrl = require('parse-github-url'),

    express = require('express'),
    bodyParser = require('body-parser'),
    app = express(),

    env = process.env,
    endpoint = env.GITHUB_API_URL || 'https://api.github.com/';

    db = require('./db'),
    repos = Object.keys(db);

app
    .use(bodyParser.json())
    .get('/', function(req, res) {
        res.send('hi!');
    })
    .get('/update', function(req, res) {
        var query = req.query,
            source = query.source, // e.g. https://github.com/tadatuta/tst/blob/master/README.md
            target = query.target; // e.g. README.ru.md

        if (!source || !target) return res.send('hi!');

        var scheme = source.split('//')[0], // e.g. https:
            parsedSourceUrl = parseGHUrl(source), // e.g. {"host":"github.com","owner":"tadatuta","name":"tst","repo":"tadatuta/tst","repository":"tadatuta/tst","branch":"master"}
            sourceFilename = source.split('/').pop(), // e.g. README.md
            repoUrl = scheme + '//' + parsedSourceUrl.host + '/' + parsedSourceUrl.repo, // e.g. https://github.com/tadatuta/tst
            branchName = parsedSourceUrl.branch;

        db[repoUrl] || (db[repoUrl] = {});
        db[repoUrl][branchName] || (db[repoUrl][branchName] = {});
        db[repoUrl][branchName][sourceFilename] || (db[repoUrl][branchName][sourceFilename] = {});
        var sourceFile = db[repoUrl][branchName][sourceFilename];
        sourceFile.sourceLang || (sourceFile.sourceLang = query.sourceLang);

        if (!sourceFile.sourceLang && sourceFilename.split('.').length === 3) {
            sourceFile.sourceLang = sourceFilename.split('.')[1];
        }

        sourceFile.targets || (sourceFile.targets = []);

        var targetLang = query.targetLang;

        if (!targetLang && target.split('.').length === 3) {
            targetLang = target.split('.')[1];
        }

        var hash = JSON.stringify({
            file: target,
            lang: targetLang
        });

        // проверять, что не существует
        if (!sourceFile.targets.some(function(trgt) {
            return JSON.stringify(trgt) === hash;
        })) {
            sourceFile.targets.push({
                file: target,
                lang: targetLang
            });

            fs.writeFileSync('db.json', JSON.stringify(db, null, 4));
        }

        res.send('ok');
    })
    .post('/onpush', function(req, res) {
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

        var promises = [];

        data.commits.forEach(function(commit) {
            commit.modified.forEach(function(file) {
                if (!filesToWatch[file]) return;

                console.log(file, 'was updated');

                // NOTE: it uses process.env.GITHUB_TOKEN as token
                promises.push(ghGot('repos/' + repository.full_name + '/issues',
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
                    }));
            });
        });

        Promise.all(promises)
            .then(function() {
                res.send('ok');
            }).catch(function(err) {
                res.sendStatus(500);
                console.error(err);
            });
    })
    .listen(8000, function() {
        console.log('started at 8000');
    });
