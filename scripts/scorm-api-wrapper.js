/*!
 * SCORM 2004 (3rd Edition) API wrapper
 * -----------------------------------------------------------------------
 * Locates the LMS-provided API_1484_11 adapter (searching the current
 * window, its ancestor frames, and an opener window, per the SCORM
 * RTE specification), then exposes a small, defensive interface for
 * Initialize / GetValue / SetValue / Commit / Terminate.
 *
 * When no LMS API is present (for example when this file is served as
 * a plain static page, such as from GitHub Pages), every method below
 * becomes a safe no-op and reports itself as unavailable via
 * SCORM.isAvailable(). Calling code should treat all SCORM calls as
 * optional enhancements, not requirements, so the activity keeps
 * working identically with or without an LMS.
 */
(function (global) {
    "use strict";

    var MAX_SEARCH_ATTEMPTS = 500;
    var apiHandle = null;
    var searched = false;
    var initialized = false;
    var terminated = false;

    function findAPIOnWindow(win) {
        var attempts = 0;

        while (
            win &&
            !win.API_1484_11 &&
            win.parent &&
            win.parent !== win &&
            attempts < MAX_SEARCH_ATTEMPTS
        ) {
            attempts++;
            win = win.parent;
        }

        return (win && win.API_1484_11) ? win.API_1484_11 : null;
    }

    function findAPI() {
        var api = findAPIOnWindow(global);

        if (!api && global.opener && global.opener !== global) {
            api = findAPIOnWindow(global.opener);
        }

        return api;
    }

    function getAPI() {
        if (!searched) {
            searched = true;
            try {
                apiHandle = findAPI();
            } catch (e) {
                apiHandle = null;
            }
        }
        return apiHandle;
    }

    function isAvailable() {
        return !!getAPI();
    }

    function logError(action) {
        var api = getAPI();
        if (!api) return;

        try {
            var code = api.GetLastError();
            if (code && String(code) !== "0") {
                var msg = "";
                try { msg = api.GetErrorString(String(code)); } catch (e2) {}
                if (global.console && global.console.warn) {
                    global.console.warn(
                        "[SCORM] " + action + " failed - error " + code + ": " + msg
                    );
                }
            }
        } catch (e) {}
    }

    function initialize() {
        var api = getAPI();
        if (!api) return false;
        if (initialized) return true;

        try {
            var ok = String(api.Initialize("")) === "true";
            if (!ok) {
                logError("Initialize");
                return false;
            }
            initialized = true;
            return true;
        } catch (e) {
            return false;
        }
    }

    function getValue(key) {
        var api = getAPI();
        if (!api || !initialized) return "";

        try {
            var v = api.GetValue(key);
            logError("GetValue(" + key + ")");
            return (v === undefined || v === null) ? "" : String(v);
        } catch (e) {
            return "";
        }
    }

    function setValue(key, value) {
        var api = getAPI();
        if (!api || !initialized) return false;

        try {
            var ok = String(api.SetValue(key, String(value))) === "true";
            if (!ok) logError("SetValue(" + key + ")");
            return ok;
        } catch (e) {
            return false;
        }
    }

    function commit() {
        var api = getAPI();
        if (!api || !initialized) return false;

        try {
            var ok = String(api.Commit("")) === "true";
            if (!ok) logError("Commit");
            return ok;
        } catch (e) {
            return false;
        }
    }

    function terminate(exitState) {
        var api = getAPI();
        if (!api || !initialized || terminated) return false;

        try {
            if (exitState) setValue("cmi.exit", exitState);
            commit();
            var ok = String(api.Terminate("")) === "true";
            if (!ok) logError("Terminate");
            terminated = true;
            return ok;
        } catch (e) {
            return false;
        }
    }

    function isoDuration(ms) {
        var totalSeconds = Math.max(0, Math.round((ms || 0) / 1000));
        var h = Math.floor(totalSeconds / 3600);
        var m = Math.floor((totalSeconds % 3600) / 60);
        var s = totalSeconds % 60;
        return "PT" + h + "H" + m + "M" + s + "S";
    }

    global.SCORM = {
        isAvailable: isAvailable,
        initialize: initialize,
        getValue: getValue,
        setValue: setValue,
        commit: commit,
        terminate: terminate,
        isoDuration: isoDuration
    };
})(window);
