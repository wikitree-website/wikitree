Wikitree
===========
A visual mapping companion for your Wikipedia wanderings

### Local installation
*This assumes you're using OS X*

##### Install Homebrew, Node.js, Nodemon, Bower, Gulp
```
$ ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"
$ brew install node
$ npm install -g nodemon
$ npm install -g bower
$ npm install -g gulp
```

##### Install MySQL [MUST BE 5.6.23]
Inspired by https://coderwall.com/p/os6woq/uninstall-all-those-broken-versions-of-mysql-and-re-install-it-with-brew-on-mac-mavericks
```
$ brew doctor
$ brew update
$ brew install mysql
$ unset TMPDIR
$ mysql_install_db --verbose --user=`whoami` --basedir="$(brew --prefix mysql)" --datadir=/usr/local/var/mysql --tmpdir=/tmp
$ mysql.server start
$ /usr/local/opt/mysql/bin/mysql_secure_installation
```
**For mysql_secure_installation:** The current root password is blank, hit enter. Then choose YES you do want to add a password, set the root password to "root". Choose YES for the rest of the prompts.

##### Need to kill MySQL?
```
$ mysqladmin -uroot -p -h127.0.0.1 --protocol=tcp shutdown
$ ps -ax | grep mysql
$ kill -9 <PID>
```

### Gulpfile commands

Starting up:
- `gulp start` = server startup aka `npm start`

Installation:
- `gulp install` = `gulp db_build` +  `gulp dep_install`
- `gulp db_build` = create database and populate
- `gulp dep_install` = `npm install` + `bower install`

Cleanup:
- `gulp fresh` = `gulp clean` + `gulp install`
- `gulp clean` = `gulp db_drop` + `gulp dep_clean`
- `gulp dep_clean` = remove modules and clear cache for npm & bower
- `gulp db_drop` = destroy database and user

