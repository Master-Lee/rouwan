// doT template support, more about in:
// https://github.com/olado/doT
var doT = require("dot");

global.rw.tplCache = {};
global.rw.tplReloadList = {};
global.rw.tplProcessor = {};

var cacheLink = {};

// Build reloadable template object
var buildReloadable = function (source) {
    // Create a empty object
    rw.tplReloadList[source] = {};
    // Reload callback
    rw.tplReloadList[source].r = function () {
        exports.load(source, true);
        rw.log.write('TPL File Updated [' + source + ']', 'system');
        exports.clearCacheLink(source);
    };
    // Daemon event callback
    rw.tplReloadList[source].d = function (e) {
        if (rw.tplReloadList[source].w) {
            rw.tplReloadList[source].w.close();
        }
        rw.tplReloadList[source].w = rw.fs.watch(
            source, {persistent: false}, rw.tplReloadList[source].d
        );
        if (e == 'change') {
            if (rw.tplReloadList[source].s) {
                clearTimeout(rw.tplReloadList[source].s);
            }
            rw.tplReloadList[source].s = setTimeout(
                rw.tplReloadList[source].r, rw.config.reloadInt
            );
        } else if (!e) {
            exports.load(source);
        }
    };
};

// Load template file
exports.load = function (source, clear) {
    if (clear) {
        delete rw.tplCache[source];
    }
    if (!rw.tplReloadList[source]) {
        buildReloadable(source);
        rw.tplReloadList[source].d();
    }
    if (!rw.tplCache[source]) {
        rw.tplCache[source] = rw.fs.readFileSync(source, 'utf8');
    }
};

exports.render = function (source, data, name, clear) {
    source = rw.path.normalize(source);
    if (name && rw.tplCache[name] && !clear) {
        return rw.tplCache[name];
    }
    exports.load(source, clear);
    if (!data) {
        return rw.tplCache[source];
    }
    var result = doT.template(rw.tplCache[source]);
    if (name) {
        rw.tplCache[name] = result;
        cacheLink[name] = source;
    }
    return result(data);
};

exports.clearCacheLink = function (source) {
    var i;
    for (i in cacheLink) {
        if (cacheLink[i] == source) {
            rw.log.write('TPL Cache Deleted [' + i + ']', 'system');
            delete rw.tplCache[i];
        }
    }
};

exports.deleteCache = function (id, link) {
    if (id == 'all') {
        rw.tplCache = null;
        rw.tplCache = {};
        return true;
    } else {
        rw.tplCache[id] = null;
        if (link) {
            exports.clearCacheLink(id);
        }
        return delete rw.tplCache[id];
    }
};

exports.getAllCache = function () {
    return rw.tplCache;
};