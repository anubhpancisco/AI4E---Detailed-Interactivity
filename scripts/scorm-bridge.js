/*!
 * SCORM 2004 (3rd Edition) bridge for Leadership & Social Influence activity
 *
 * Runs before the activity script. Restores learner state from cmi.suspend_data,
 * mirrors localStorage saves back to the LMS, and records completion, location,
 * progress, and session time. Safe no-op when no LMS API is present (GitHub Pages).
 */
(function () {
    "use strict";

    var STATE_KEY = "trustLedger_v6";
    var TOTAL_STAGES = 16;
    var sessionStartMs = Date.now();
    var scormActive = false;
    var completionReported = false;

    function parseState(raw) {
        if (!raw) return null;
        try {
            return JSON.parse(raw);
        } catch (e) {
            return null;
        }
    }

    function progressFromStage(stage) {
        if (typeof stage !== "number" || stage < 0) return 0;
        return Math.min(1, (stage + 1) / TOTAL_STAGES);
    }

    function applyCompletion(state) {
        if (!scormActive || !state || completionReported) return;

        var onResults = state.stage >= TOTAL_STAGES - 1;
        var hasReflection = state.refl !== null && state.refl !== undefined;

        if (!onResults || !hasReflection) return;

        SCORM.setValue("cmi.completion_status", "completed");
        SCORM.setValue("cmi.success_status", "passed");
        SCORM.setValue("cmi.progress_measure", "1");
        completionReported = true;
    }

    function syncToLms() {
        if (!scormActive) return;

        try {
            var raw = null;

            try {
                raw = localStorage.getItem(STATE_KEY);
            } catch (e) {}

            if (raw) {
                SCORM.setValue("cmi.suspend_data", raw);

                var state = parseState(raw);
                if (state && typeof state.stage === "number") {
                    SCORM.setValue("cmi.location", String(state.stage));
                    SCORM.setValue(
                        "cmi.progress_measure",
                        String(progressFromStage(state.stage))
                    );
                    applyCompletion(state);
                }
            }

            SCORM.setValue(
                "cmi.session_time",
                SCORM.isoDuration(Date.now() - sessionStartMs)
            );
            SCORM.commit();
        } catch (e) {}
    }

    function restoreFromLms() {
        if (!scormActive) return;

        var suspended = SCORM.getValue("cmi.suspend_data");
        if (!suspended) return;

        try {
            localStorage.setItem(STATE_KEY, suspended);
        } catch (e) {}
    }

    function bootScorm() {
        if (!window.SCORM || !SCORM.isAvailable()) return;

        if (!SCORM.initialize()) return;

        scormActive = true;

        var entry = SCORM.getValue("cmi.entry");
        if (!entry) {
            SCORM.setValue("cmi.entry", "ab-initio");
        }

        var completion = SCORM.getValue("cmi.completion_status");
        if (
            !completion ||
            completion === "unknown" ||
            completion === "not attempted"
        ) {
            SCORM.setValue("cmi.completion_status", "incomplete");
        }

        if (!SCORM.getValue("cmi.success_status")) {
            SCORM.setValue("cmi.success_status", "unknown");
        }

        restoreFromLms();
        SCORM.commit();
    }

    function hookStorage() {
        if (!window.Storage || !Storage.prototype.setItem) return;

        var originalSetItem = Storage.prototype.setItem;

        Storage.prototype.setItem = function (key, value) {
            originalSetItem.apply(this, arguments);
            if (key === STATE_KEY) {
                syncToLms();
            }
        };
    }

    function bindLifecycle() {
        window.addEventListener("beforeunload", function () {
            syncToLms();
            if (scormActive) {
                SCORM.terminate("suspend");
            }
        });

        document.addEventListener("visibilitychange", function () {
            if (document.visibilityState === "hidden") {
                syncToLms();
            }
        });

        window.setInterval(syncToLms, 30000);
    }

    bootScorm();
    hookStorage();
    bindLifecycle();

    window.SCORMBridge = {
        sync: syncToLms,
        isActive: function () {
            return scormActive;
        }
    };
})();
