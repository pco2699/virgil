var color = true;
var GREEN=color ? '[0;32m' : '';
var YELLOW=color ? '[0;33m' : '';
var RED=color ? '[0;31m' : '';
var NORM=color ? '[0;00m' : '';
var verbose = 2;
var cmdLineArgs = arguments;  // D8 specific ?
var globalTestRuns = undefined;
var outputDir = "";

function fail(testname, msg) {
    print("-" + RED + "fail " + NORM + testname + ": " + msg);
}

function begin(testname) {
    if (verbose == 2) print("+Running " + testname);
}

function pass(testname) {
    print("-" + GREEN + "ok" + NORM + " " + testname);
}

function runTest(testname) {
    begin(testname);
    // 1. Read WASM buffer
    var buffer;
    var wasmfile = testname + ".wasm";
    try {
        buffer = readbuffer(wasmfile);  // D8 specific
    } catch (e) {
        return fail(testname, wasmfile + " file not found");
    }

    // 2. Create WASM module and instance
    var module;
    var instance;
    var main;
    try {
        module = new WebAssembly.Module(buffer);
        instance = new WebAssembly.Instance(module);
        main = instance.exports.main;
    } catch (e) {
        return fail(testname, "" + e);
    }

    // 3. Load test expectations
    globalTestRuns = undefined;  // by convention, overwritten by loaded script
    var expectfile = testname + ".expect.js";
    try {
        load(expectfile);  // D8 specific
    } catch (e) {
        return fail(testname, expectfile + " file not found");
    }

    // 4. Perform the runs
    var i = 0;
    for (run of globalTestRuns) {
        try  {
            let expect = run[0];
            let result = main(...run[1]);
            if (result != expect) throw new Error("expected " + expect + ", but got " + result);
            // TODO: handle testcases that expect to throw an exception
        } catch (e) {
            return fail(testname, "Run " + i + " failed: " + e);
        }
        i++;
    }
    pass(testname);
}

(function mainLoop() {
    var tests = [];
    for (var arg of cmdLineArgs) {
        arg = arg.replace(/[.]v3$/, "");  // strip .v3 extension
        arg = arg.replace(/[.]wasm$/, "");  // strip .wasm extension
        tests.push(arg);
    }
    for (var i = 0; i < tests.length; i++) {
        runTest(tests[i]);
    }
    print(tests.length + " passed");
})();
