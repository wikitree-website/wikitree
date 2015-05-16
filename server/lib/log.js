// use console.log for anything you don't want saved in the log file
// otherwise:
// - logger.debug
// - logger.info
// - logger.warn
// - logger.error

var logger = require('winston');

// we'll reconfigure this below
logger.remove(logger.transports.Console);

logger.setLevels({
    debug: 0,
    info:  1,
    warn:  2,
    error: 3
});

logger.addColors({
    debug: 'green',
    info:  'cyan',
    warn:  'yellow',
    error: 'red'
});

logger.add(logger.transports.Console, {
    level: 'debug',
    colorize: true
});

logger.add(logger.transports.File, {
    filename:'log/default.log',
    level: 'debug'
});

module.exports = logger;