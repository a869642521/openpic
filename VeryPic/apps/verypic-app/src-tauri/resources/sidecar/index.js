"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// ../../node_modules/.pnpm/dotenv@17.2.2/node_modules/dotenv/package.json
var require_package = __commonJS({
  "../../node_modules/.pnpm/dotenv@17.2.2/node_modules/dotenv/package.json"(exports2, module2) {
    module2.exports = {
      name: "dotenv",
      version: "17.2.2",
      description: "Loads environment variables from .env file",
      main: "lib/main.js",
      types: "lib/main.d.ts",
      exports: {
        ".": {
          types: "./lib/main.d.ts",
          require: "./lib/main.js",
          default: "./lib/main.js"
        },
        "./config": "./config.js",
        "./config.js": "./config.js",
        "./lib/env-options": "./lib/env-options.js",
        "./lib/env-options.js": "./lib/env-options.js",
        "./lib/cli-options": "./lib/cli-options.js",
        "./lib/cli-options.js": "./lib/cli-options.js",
        "./package.json": "./package.json"
      },
      scripts: {
        "dts-check": "tsc --project tests/types/tsconfig.json",
        lint: "standard",
        pretest: "npm run lint && npm run dts-check",
        test: "tap run --allow-empty-coverage --disable-coverage --timeout=60000",
        "test:coverage": "tap run --show-full-coverage --timeout=60000 --coverage-report=text --coverage-report=lcov",
        prerelease: "npm test",
        release: "standard-version"
      },
      repository: {
        type: "git",
        url: "git://github.com/motdotla/dotenv.git"
      },
      homepage: "https://github.com/motdotla/dotenv#readme",
      funding: "https://dotenvx.com",
      keywords: [
        "dotenv",
        "env",
        ".env",
        "environment",
        "variables",
        "config",
        "settings"
      ],
      readmeFilename: "README.md",
      license: "BSD-2-Clause",
      devDependencies: {
        "@types/node": "^18.11.3",
        decache: "^4.6.2",
        sinon: "^14.0.1",
        standard: "^17.0.0",
        "standard-version": "^9.5.0",
        tap: "^19.2.0",
        typescript: "^4.8.4"
      },
      engines: {
        node: ">=12"
      },
      browser: {
        fs: false
      }
    };
  }
});

// ../../node_modules/.pnpm/dotenv@17.2.2/node_modules/dotenv/lib/main.js
var require_main = __commonJS({
  "../../node_modules/.pnpm/dotenv@17.2.2/node_modules/dotenv/lib/main.js"(exports2, module2) {
    var fs2 = require("fs");
    var path6 = require("path");
    var os5 = require("os");
    var crypto2 = require("crypto");
    var packageJson = require_package();
    var version = packageJson.version;
    var TIPS = [
      "\u{1F510} encrypt with Dotenvx: https://dotenvx.com",
      "\u{1F510} prevent committing .env to code: https://dotenvx.com/precommit",
      "\u{1F510} prevent building .env in docker: https://dotenvx.com/prebuild",
      "\u{1F4E1} observe env with Radar: https://dotenvx.com/radar",
      "\u{1F4E1} auto-backup env with Radar: https://dotenvx.com/radar",
      "\u{1F4E1} version env with Radar: https://dotenvx.com/radar",
      "\u{1F6E0}\uFE0F  run anywhere with `dotenvx run -- yourcommand`",
      "\u2699\uFE0F  specify custom .env file path with { path: '/custom/path/.env' }",
      "\u2699\uFE0F  enable debug logging with { debug: true }",
      "\u2699\uFE0F  override existing env vars with { override: true }",
      "\u2699\uFE0F  suppress all logs with { quiet: true }",
      "\u2699\uFE0F  write to custom object with { processEnv: myObject }",
      "\u2699\uFE0F  load multiple .env files with { path: ['.env.local', '.env'] }"
    ];
    function _getRandomTip() {
      return TIPS[Math.floor(Math.random() * TIPS.length)];
    }
    function parseBoolean2(value) {
      if (typeof value === "string") {
        return !["false", "0", "no", "off", ""].includes(value.toLowerCase());
      }
      return Boolean(value);
    }
    function supportsAnsi() {
      return process.stdout.isTTY;
    }
    function dim(text) {
      return supportsAnsi() ? `\x1B[2m${text}\x1B[0m` : text;
    }
    var LINE = /(?:^|^)\s*(?:export\s+)?([\w.-]+)(?:\s*=\s*?|:\s+?)(\s*'(?:\\'|[^'])*'|\s*"(?:\\"|[^"])*"|\s*`(?:\\`|[^`])*`|[^#\r\n]+)?\s*(?:#.*)?(?:$|$)/mg;
    function parse3(src) {
      const obj = {};
      let lines = src.toString();
      lines = lines.replace(/\r\n?/mg, "\n");
      let match;
      while ((match = LINE.exec(lines)) != null) {
        const key = match[1];
        let value = match[2] || "";
        value = value.trim();
        const maybeQuote = value[0];
        value = value.replace(/^(['"`])([\s\S]*)\1$/mg, "$2");
        if (maybeQuote === '"') {
          value = value.replace(/\\n/g, "\n");
          value = value.replace(/\\r/g, "\r");
        }
        obj[key] = value;
      }
      return obj;
    }
    function _parseVault(options) {
      options = options || {};
      const vaultPath = _vaultPath(options);
      options.path = vaultPath;
      const result = DotenvModule.configDotenv(options);
      if (!result.parsed) {
        const err = new Error(`MISSING_DATA: Cannot parse ${vaultPath} for an unknown reason`);
        err.code = "MISSING_DATA";
        throw err;
      }
      const keys = _dotenvKey(options).split(",");
      const length = keys.length;
      let decrypted;
      for (let i2 = 0; i2 < length; i2++) {
        try {
          const key = keys[i2].trim();
          const attrs = _instructions(result, key);
          decrypted = DotenvModule.decrypt(attrs.ciphertext, attrs.key);
          break;
        } catch (error) {
          if (i2 + 1 >= length) {
            throw error;
          }
        }
      }
      return DotenvModule.parse(decrypted);
    }
    function _warn(message) {
      console.error(`[dotenv@${version}][WARN] ${message}`);
    }
    function _debug(message) {
      console.log(`[dotenv@${version}][DEBUG] ${message}`);
    }
    function _log(message) {
      console.log(`[dotenv@${version}] ${message}`);
    }
    function _dotenvKey(options) {
      if (options && options.DOTENV_KEY && options.DOTENV_KEY.length > 0) {
        return options.DOTENV_KEY;
      }
      if (process.env.DOTENV_KEY && process.env.DOTENV_KEY.length > 0) {
        return process.env.DOTENV_KEY;
      }
      return "";
    }
    function _instructions(result, dotenvKey) {
      let uri;
      try {
        uri = new URL(dotenvKey);
      } catch (error) {
        if (error.code === "ERR_INVALID_URL") {
          const err = new Error("INVALID_DOTENV_KEY: Wrong format. Must be in valid uri format like dotenv://:key_1234@dotenvx.com/vault/.env.vault?environment=development");
          err.code = "INVALID_DOTENV_KEY";
          throw err;
        }
        throw error;
      }
      const key = uri.password;
      if (!key) {
        const err = new Error("INVALID_DOTENV_KEY: Missing key part");
        err.code = "INVALID_DOTENV_KEY";
        throw err;
      }
      const environment = uri.searchParams.get("environment");
      if (!environment) {
        const err = new Error("INVALID_DOTENV_KEY: Missing environment part");
        err.code = "INVALID_DOTENV_KEY";
        throw err;
      }
      const environmentKey = `DOTENV_VAULT_${environment.toUpperCase()}`;
      const ciphertext = result.parsed[environmentKey];
      if (!ciphertext) {
        const err = new Error(`NOT_FOUND_DOTENV_ENVIRONMENT: Cannot locate environment ${environmentKey} in your .env.vault file.`);
        err.code = "NOT_FOUND_DOTENV_ENVIRONMENT";
        throw err;
      }
      return { ciphertext, key };
    }
    function _vaultPath(options) {
      let possibleVaultPath = null;
      if (options && options.path && options.path.length > 0) {
        if (Array.isArray(options.path)) {
          for (const filepath of options.path) {
            if (fs2.existsSync(filepath)) {
              possibleVaultPath = filepath.endsWith(".vault") ? filepath : `${filepath}.vault`;
            }
          }
        } else {
          possibleVaultPath = options.path.endsWith(".vault") ? options.path : `${options.path}.vault`;
        }
      } else {
        possibleVaultPath = path6.resolve(process.cwd(), ".env.vault");
      }
      if (fs2.existsSync(possibleVaultPath)) {
        return possibleVaultPath;
      }
      return null;
    }
    function _resolveHome(envPath) {
      return envPath[0] === "~" ? path6.join(os5.homedir(), envPath.slice(1)) : envPath;
    }
    function _configVault(options) {
      const debug = parseBoolean2(process.env.DOTENV_CONFIG_DEBUG || options && options.debug);
      const quiet = parseBoolean2(process.env.DOTENV_CONFIG_QUIET || options && options.quiet);
      if (debug || !quiet) {
        _log("Loading env from encrypted .env.vault");
      }
      const parsed = DotenvModule._parseVault(options);
      let processEnv = process.env;
      if (options && options.processEnv != null) {
        processEnv = options.processEnv;
      }
      DotenvModule.populate(processEnv, parsed, options);
      return { parsed };
    }
    function configDotenv(options) {
      const dotenvPath = path6.resolve(process.cwd(), ".env");
      let encoding = "utf8";
      let processEnv = process.env;
      if (options && options.processEnv != null) {
        processEnv = options.processEnv;
      }
      let debug = parseBoolean2(processEnv.DOTENV_CONFIG_DEBUG || options && options.debug);
      let quiet = parseBoolean2(processEnv.DOTENV_CONFIG_QUIET || options && options.quiet);
      if (options && options.encoding) {
        encoding = options.encoding;
      } else {
        if (debug) {
          _debug("No encoding is specified. UTF-8 is used by default");
        }
      }
      let optionPaths = [dotenvPath];
      if (options && options.path) {
        if (!Array.isArray(options.path)) {
          optionPaths = [_resolveHome(options.path)];
        } else {
          optionPaths = [];
          for (const filepath of options.path) {
            optionPaths.push(_resolveHome(filepath));
          }
        }
      }
      let lastError;
      const parsedAll = {};
      for (const path7 of optionPaths) {
        try {
          const parsed = DotenvModule.parse(fs2.readFileSync(path7, { encoding }));
          DotenvModule.populate(parsedAll, parsed, options);
        } catch (e2) {
          if (debug) {
            _debug(`Failed to load ${path7} ${e2.message}`);
          }
          lastError = e2;
        }
      }
      const populated = DotenvModule.populate(processEnv, parsedAll, options);
      debug = parseBoolean2(processEnv.DOTENV_CONFIG_DEBUG || debug);
      quiet = parseBoolean2(processEnv.DOTENV_CONFIG_QUIET || quiet);
      if (debug || !quiet) {
        const keysCount = Object.keys(populated).length;
        const shortPaths = [];
        for (const filePath of optionPaths) {
          try {
            const relative = path6.relative(process.cwd(), filePath);
            shortPaths.push(relative);
          } catch (e2) {
            if (debug) {
              _debug(`Failed to load ${filePath} ${e2.message}`);
            }
            lastError = e2;
          }
        }
        _log(`injecting env (${keysCount}) from ${shortPaths.join(",")} ${dim(`-- tip: ${_getRandomTip()}`)}`);
      }
      if (lastError) {
        return { parsed: parsedAll, error: lastError };
      } else {
        return { parsed: parsedAll };
      }
    }
    function config(options) {
      if (_dotenvKey(options).length === 0) {
        return DotenvModule.configDotenv(options);
      }
      const vaultPath = _vaultPath(options);
      if (!vaultPath) {
        _warn(`You set DOTENV_KEY but you are missing a .env.vault file at ${vaultPath}. Did you forget to build it?`);
        return DotenvModule.configDotenv(options);
      }
      return DotenvModule._configVault(options);
    }
    function decrypt(encrypted, keyStr) {
      const key = Buffer.from(keyStr.slice(-64), "hex");
      let ciphertext = Buffer.from(encrypted, "base64");
      const nonce = ciphertext.subarray(0, 12);
      const authTag = ciphertext.subarray(-16);
      ciphertext = ciphertext.subarray(12, -16);
      try {
        const aesgcm = crypto2.createDecipheriv("aes-256-gcm", key, nonce);
        aesgcm.setAuthTag(authTag);
        return `${aesgcm.update(ciphertext)}${aesgcm.final()}`;
      } catch (error) {
        const isRange = error instanceof RangeError;
        const invalidKeyLength = error.message === "Invalid key length";
        const decryptionFailed = error.message === "Unsupported state or unable to authenticate data";
        if (isRange || invalidKeyLength) {
          const err = new Error("INVALID_DOTENV_KEY: It must be 64 characters long (or more)");
          err.code = "INVALID_DOTENV_KEY";
          throw err;
        } else if (decryptionFailed) {
          const err = new Error("DECRYPTION_FAILED: Please check your DOTENV_KEY");
          err.code = "DECRYPTION_FAILED";
          throw err;
        } else {
          throw error;
        }
      }
    }
    function populate(processEnv, parsed, options = {}) {
      const debug = Boolean(options && options.debug);
      const override = Boolean(options && options.override);
      const populated = {};
      if (typeof parsed !== "object") {
        const err = new Error("OBJECT_REQUIRED: Please check the processEnv argument being passed to populate");
        err.code = "OBJECT_REQUIRED";
        throw err;
      }
      for (const key of Object.keys(parsed)) {
        if (Object.prototype.hasOwnProperty.call(processEnv, key)) {
          if (override === true) {
            processEnv[key] = parsed[key];
            populated[key] = parsed[key];
          }
          if (debug) {
            if (override === true) {
              _debug(`"${key}" is already defined and WAS overwritten`);
            } else {
              _debug(`"${key}" is already defined and was NOT overwritten`);
            }
          }
        } else {
          processEnv[key] = parsed[key];
          populated[key] = parsed[key];
        }
      }
      return populated;
    }
    var DotenvModule = {
      configDotenv,
      _configVault,
      _parseVault,
      config,
      decrypt,
      parse: parse3,
      populate
    };
    module2.exports.configDotenv = DotenvModule.configDotenv;
    module2.exports._configVault = DotenvModule._configVault;
    module2.exports._parseVault = DotenvModule._parseVault;
    module2.exports.config = DotenvModule.config;
    module2.exports.decrypt = DotenvModule.decrypt;
    module2.exports.parse = DotenvModule.parse;
    module2.exports.populate = DotenvModule.populate;
    module2.exports = DotenvModule;
  }
});

// ../../node_modules/.pnpm/dotenv@17.2.2/node_modules/dotenv/lib/env-options.js
var require_env_options = __commonJS({
  "../../node_modules/.pnpm/dotenv@17.2.2/node_modules/dotenv/lib/env-options.js"(exports2, module2) {
    var options = {};
    if (process.env.DOTENV_CONFIG_ENCODING != null) {
      options.encoding = process.env.DOTENV_CONFIG_ENCODING;
    }
    if (process.env.DOTENV_CONFIG_PATH != null) {
      options.path = process.env.DOTENV_CONFIG_PATH;
    }
    if (process.env.DOTENV_CONFIG_QUIET != null) {
      options.quiet = process.env.DOTENV_CONFIG_QUIET;
    }
    if (process.env.DOTENV_CONFIG_DEBUG != null) {
      options.debug = process.env.DOTENV_CONFIG_DEBUG;
    }
    if (process.env.DOTENV_CONFIG_OVERRIDE != null) {
      options.override = process.env.DOTENV_CONFIG_OVERRIDE;
    }
    if (process.env.DOTENV_CONFIG_DOTENV_KEY != null) {
      options.DOTENV_KEY = process.env.DOTENV_CONFIG_DOTENV_KEY;
    }
    module2.exports = options;
  }
});

// ../../node_modules/.pnpm/dotenv@17.2.2/node_modules/dotenv/lib/cli-options.js
var require_cli_options = __commonJS({
  "../../node_modules/.pnpm/dotenv@17.2.2/node_modules/dotenv/lib/cli-options.js"(exports2, module2) {
    var re = /^dotenv_config_(encoding|path|quiet|debug|override|DOTENV_KEY)=(.+)$/;
    module2.exports = function optionMatcher(args) {
      const options = args.reduce(function(acc, cur) {
        const matches = cur.match(re);
        if (matches) {
          acc[matches[1]] = matches[2];
        }
        return acc;
      }, {});
      if (!("quiet" in options)) {
        options.quiet = "true";
      }
      return options;
    };
  }
});

// ../../node_modules/.pnpm/node-machine-id@1.1.12/node_modules/node-machine-id/dist/index.js
var require_dist = __commonJS({
  "../../node_modules/.pnpm/node-machine-id@1.1.12/node_modules/node-machine-id/dist/index.js"(exports2, module2) {
    !(function(t2, n2) {
      "object" == typeof exports2 && "object" == typeof module2 ? module2.exports = n2(require("child_process"), require("crypto")) : "function" == typeof define && define.amd ? define(["child_process", "crypto"], n2) : "object" == typeof exports2 ? exports2["electron-machine-id"] = n2(require("child_process"), require("crypto")) : t2["electron-machine-id"] = n2(t2.child_process, t2.crypto);
    })(exports2, function(t2, n2) {
      return (function(t3) {
        function n3(e2) {
          if (r2[e2]) return r2[e2].exports;
          var o2 = r2[e2] = { exports: {}, id: e2, loaded: false };
          return t3[e2].call(o2.exports, o2, o2.exports, n3), o2.loaded = true, o2.exports;
        }
        var r2 = {};
        return n3.m = t3, n3.c = r2, n3.p = "", n3(0);
      })([function(t3, n3, r2) {
        t3.exports = r2(34);
      }, function(t3, n3, r2) {
        var e2 = r2(29)("wks"), o2 = r2(33), i2 = r2(2).Symbol, c2 = "function" == typeof i2, u2 = t3.exports = function(t4) {
          return e2[t4] || (e2[t4] = c2 && i2[t4] || (c2 ? i2 : o2)("Symbol." + t4));
        };
        u2.store = e2;
      }, function(t3, n3) {
        var r2 = t3.exports = "undefined" != typeof window && window.Math == Math ? window : "undefined" != typeof self && self.Math == Math ? self : Function("return this")();
        "number" == typeof __g && (__g = r2);
      }, function(t3, n3, r2) {
        var e2 = r2(9);
        t3.exports = function(t4) {
          if (!e2(t4)) throw TypeError(t4 + " is not an object!");
          return t4;
        };
      }, function(t3, n3, r2) {
        t3.exports = !r2(24)(function() {
          return 7 != Object.defineProperty({}, "a", { get: function() {
            return 7;
          } }).a;
        });
      }, function(t3, n3, r2) {
        var e2 = r2(12), o2 = r2(17);
        t3.exports = r2(4) ? function(t4, n4, r3) {
          return e2.f(t4, n4, o2(1, r3));
        } : function(t4, n4, r3) {
          return t4[n4] = r3, t4;
        };
      }, function(t3, n3) {
        var r2 = t3.exports = { version: "2.4.0" };
        "number" == typeof __e && (__e = r2);
      }, function(t3, n3, r2) {
        var e2 = r2(14);
        t3.exports = function(t4, n4, r3) {
          if (e2(t4), void 0 === n4) return t4;
          switch (r3) {
            case 1:
              return function(r4) {
                return t4.call(n4, r4);
              };
            case 2:
              return function(r4, e3) {
                return t4.call(n4, r4, e3);
              };
            case 3:
              return function(r4, e3, o2) {
                return t4.call(n4, r4, e3, o2);
              };
          }
          return function() {
            return t4.apply(n4, arguments);
          };
        };
      }, function(t3, n3) {
        var r2 = {}.hasOwnProperty;
        t3.exports = function(t4, n4) {
          return r2.call(t4, n4);
        };
      }, function(t3, n3) {
        t3.exports = function(t4) {
          return "object" == typeof t4 ? null !== t4 : "function" == typeof t4;
        };
      }, function(t3, n3) {
        t3.exports = {};
      }, function(t3, n3) {
        var r2 = {}.toString;
        t3.exports = function(t4) {
          return r2.call(t4).slice(8, -1);
        };
      }, function(t3, n3, r2) {
        var e2 = r2(3), o2 = r2(26), i2 = r2(32), c2 = Object.defineProperty;
        n3.f = r2(4) ? Object.defineProperty : function(t4, n4, r3) {
          if (e2(t4), n4 = i2(n4, true), e2(r3), o2) try {
            return c2(t4, n4, r3);
          } catch (t5) {
          }
          if ("get" in r3 || "set" in r3) throw TypeError("Accessors not supported!");
          return "value" in r3 && (t4[n4] = r3.value), t4;
        };
      }, function(t3, n3, r2) {
        var e2 = r2(42), o2 = r2(15);
        t3.exports = function(t4) {
          return e2(o2(t4));
        };
      }, function(t3, n3) {
        t3.exports = function(t4) {
          if ("function" != typeof t4) throw TypeError(t4 + " is not a function!");
          return t4;
        };
      }, function(t3, n3) {
        t3.exports = function(t4) {
          if (void 0 == t4) throw TypeError("Can't call method on  " + t4);
          return t4;
        };
      }, function(t3, n3, r2) {
        var e2 = r2(9), o2 = r2(2).document, i2 = e2(o2) && e2(o2.createElement);
        t3.exports = function(t4) {
          return i2 ? o2.createElement(t4) : {};
        };
      }, function(t3, n3) {
        t3.exports = function(t4, n4) {
          return { enumerable: !(1 & t4), configurable: !(2 & t4), writable: !(4 & t4), value: n4 };
        };
      }, function(t3, n3, r2) {
        var e2 = r2(12).f, o2 = r2(8), i2 = r2(1)("toStringTag");
        t3.exports = function(t4, n4, r3) {
          t4 && !o2(t4 = r3 ? t4 : t4.prototype, i2) && e2(t4, i2, { configurable: true, value: n4 });
        };
      }, function(t3, n3, r2) {
        var e2 = r2(29)("keys"), o2 = r2(33);
        t3.exports = function(t4) {
          return e2[t4] || (e2[t4] = o2(t4));
        };
      }, function(t3, n3) {
        var r2 = Math.ceil, e2 = Math.floor;
        t3.exports = function(t4) {
          return isNaN(t4 = +t4) ? 0 : (t4 > 0 ? e2 : r2)(t4);
        };
      }, function(t3, n3, r2) {
        var e2 = r2(11), o2 = r2(1)("toStringTag"), i2 = "Arguments" == e2(/* @__PURE__ */ (function() {
          return arguments;
        })()), c2 = function(t4, n4) {
          try {
            return t4[n4];
          } catch (t5) {
          }
        };
        t3.exports = function(t4) {
          var n4, r3, u2;
          return void 0 === t4 ? "Undefined" : null === t4 ? "Null" : "string" == typeof (r3 = c2(n4 = Object(t4), o2)) ? r3 : i2 ? e2(n4) : "Object" == (u2 = e2(n4)) && "function" == typeof n4.callee ? "Arguments" : u2;
        };
      }, function(t3, n3) {
        t3.exports = "constructor,hasOwnProperty,isPrototypeOf,propertyIsEnumerable,toLocaleString,toString,valueOf".split(",");
      }, function(t3, n3, r2) {
        var e2 = r2(2), o2 = r2(6), i2 = r2(7), c2 = r2(5), u2 = "prototype", s2 = function(t4, n4, r3) {
          var f2, a2, p2, l2 = t4 & s2.F, v2 = t4 & s2.G, h2 = t4 & s2.S, d2 = t4 & s2.P, y2 = t4 & s2.B, _2 = t4 & s2.W, x2 = v2 ? o2 : o2[n4] || (o2[n4] = {}), m2 = x2[u2], w2 = v2 ? e2 : h2 ? e2[n4] : (e2[n4] || {})[u2];
          v2 && (r3 = n4);
          for (f2 in r3) a2 = !l2 && w2 && void 0 !== w2[f2], a2 && f2 in x2 || (p2 = a2 ? w2[f2] : r3[f2], x2[f2] = v2 && "function" != typeof w2[f2] ? r3[f2] : y2 && a2 ? i2(p2, e2) : _2 && w2[f2] == p2 ? (function(t5) {
            var n5 = function(n6, r4, e3) {
              if (this instanceof t5) {
                switch (arguments.length) {
                  case 0:
                    return new t5();
                  case 1:
                    return new t5(n6);
                  case 2:
                    return new t5(n6, r4);
                }
                return new t5(n6, r4, e3);
              }
              return t5.apply(this, arguments);
            };
            return n5[u2] = t5[u2], n5;
          })(p2) : d2 && "function" == typeof p2 ? i2(Function.call, p2) : p2, d2 && ((x2.virtual || (x2.virtual = {}))[f2] = p2, t4 & s2.R && m2 && !m2[f2] && c2(m2, f2, p2)));
        };
        s2.F = 1, s2.G = 2, s2.S = 4, s2.P = 8, s2.B = 16, s2.W = 32, s2.U = 64, s2.R = 128, t3.exports = s2;
      }, function(t3, n3) {
        t3.exports = function(t4) {
          try {
            return !!t4();
          } catch (t5) {
            return true;
          }
        };
      }, function(t3, n3, r2) {
        t3.exports = r2(2).document && document.documentElement;
      }, function(t3, n3, r2) {
        t3.exports = !r2(4) && !r2(24)(function() {
          return 7 != Object.defineProperty(r2(16)("div"), "a", { get: function() {
            return 7;
          } }).a;
        });
      }, function(t3, n3, r2) {
        "use strict";
        var e2 = r2(28), o2 = r2(23), i2 = r2(57), c2 = r2(5), u2 = r2(8), s2 = r2(10), f2 = r2(45), a2 = r2(18), p2 = r2(52), l2 = r2(1)("iterator"), v2 = !([].keys && "next" in [].keys()), h2 = "@@iterator", d2 = "keys", y2 = "values", _2 = function() {
          return this;
        };
        t3.exports = function(t4, n4, r3, x2, m2, w2, g2) {
          f2(r3, n4, x2);
          var b2, O2, j2, S2 = function(t5) {
            if (!v2 && t5 in T2) return T2[t5];
            switch (t5) {
              case d2:
                return function() {
                  return new r3(this, t5);
                };
              case y2:
                return function() {
                  return new r3(this, t5);
                };
            }
            return function() {
              return new r3(this, t5);
            };
          }, E2 = n4 + " Iterator", P2 = m2 == y2, M2 = false, T2 = t4.prototype, A2 = T2[l2] || T2[h2] || m2 && T2[m2], k2 = A2 || S2(m2), C2 = m2 ? P2 ? S2("entries") : k2 : void 0, I2 = "Array" == n4 ? T2.entries || A2 : A2;
          if (I2 && (j2 = p2(I2.call(new t4())), j2 !== Object.prototype && (a2(j2, E2, true), e2 || u2(j2, l2) || c2(j2, l2, _2))), P2 && A2 && A2.name !== y2 && (M2 = true, k2 = function() {
            return A2.call(this);
          }), e2 && !g2 || !v2 && !M2 && T2[l2] || c2(T2, l2, k2), s2[n4] = k2, s2[E2] = _2, m2) if (b2 = { values: P2 ? k2 : S2(y2), keys: w2 ? k2 : S2(d2), entries: C2 }, g2) for (O2 in b2) O2 in T2 || i2(T2, O2, b2[O2]);
          else o2(o2.P + o2.F * (v2 || M2), n4, b2);
          return b2;
        };
      }, function(t3, n3) {
        t3.exports = true;
      }, function(t3, n3, r2) {
        var e2 = r2(2), o2 = "__core-js_shared__", i2 = e2[o2] || (e2[o2] = {});
        t3.exports = function(t4) {
          return i2[t4] || (i2[t4] = {});
        };
      }, function(t3, n3, r2) {
        var e2, o2, i2, c2 = r2(7), u2 = r2(41), s2 = r2(25), f2 = r2(16), a2 = r2(2), p2 = a2.process, l2 = a2.setImmediate, v2 = a2.clearImmediate, h2 = a2.MessageChannel, d2 = 0, y2 = {}, _2 = "onreadystatechange", x2 = function() {
          var t4 = +this;
          if (y2.hasOwnProperty(t4)) {
            var n4 = y2[t4];
            delete y2[t4], n4();
          }
        }, m2 = function(t4) {
          x2.call(t4.data);
        };
        l2 && v2 || (l2 = function(t4) {
          for (var n4 = [], r3 = 1; arguments.length > r3; ) n4.push(arguments[r3++]);
          return y2[++d2] = function() {
            u2("function" == typeof t4 ? t4 : Function(t4), n4);
          }, e2(d2), d2;
        }, v2 = function(t4) {
          delete y2[t4];
        }, "process" == r2(11)(p2) ? e2 = function(t4) {
          p2.nextTick(c2(x2, t4, 1));
        } : h2 ? (o2 = new h2(), i2 = o2.port2, o2.port1.onmessage = m2, e2 = c2(i2.postMessage, i2, 1)) : a2.addEventListener && "function" == typeof postMessage && !a2.importScripts ? (e2 = function(t4) {
          a2.postMessage(t4 + "", "*");
        }, a2.addEventListener("message", m2, false)) : e2 = _2 in f2("script") ? function(t4) {
          s2.appendChild(f2("script"))[_2] = function() {
            s2.removeChild(this), x2.call(t4);
          };
        } : function(t4) {
          setTimeout(c2(x2, t4, 1), 0);
        }), t3.exports = { set: l2, clear: v2 };
      }, function(t3, n3, r2) {
        var e2 = r2(20), o2 = Math.min;
        t3.exports = function(t4) {
          return t4 > 0 ? o2(e2(t4), 9007199254740991) : 0;
        };
      }, function(t3, n3, r2) {
        var e2 = r2(9);
        t3.exports = function(t4, n4) {
          if (!e2(t4)) return t4;
          var r3, o2;
          if (n4 && "function" == typeof (r3 = t4.toString) && !e2(o2 = r3.call(t4))) return o2;
          if ("function" == typeof (r3 = t4.valueOf) && !e2(o2 = r3.call(t4))) return o2;
          if (!n4 && "function" == typeof (r3 = t4.toString) && !e2(o2 = r3.call(t4))) return o2;
          throw TypeError("Can't convert object to primitive value");
        };
      }, function(t3, n3) {
        var r2 = 0, e2 = Math.random();
        t3.exports = function(t4) {
          return "Symbol(".concat(void 0 === t4 ? "" : t4, ")_", (++r2 + e2).toString(36));
        };
      }, function(t3, n3, r2) {
        "use strict";
        function e2(t4) {
          return t4 && t4.__esModule ? t4 : { default: t4 };
        }
        function o2() {
          return "win32" !== process.platform ? "" : "ia32" === process.arch && process.env.hasOwnProperty("PROCESSOR_ARCHITEW6432") ? "mixed" : "native";
        }
        function i2(t4) {
          return (0, l2.createHash)("sha256").update(t4).digest("hex");
        }
        function c2(t4) {
          switch (h2) {
            case "darwin":
              return t4.split("IOPlatformUUID")[1].split("\n")[0].replace(/\=|\s+|\"/gi, "").toLowerCase();
            case "win32":
              return t4.toString().split("REG_SZ")[1].replace(/\r+|\n+|\s+/gi, "").toLowerCase();
            case "linux":
              return t4.toString().replace(/\r+|\n+|\s+/gi, "").toLowerCase();
            case "freebsd":
              return t4.toString().replace(/\r+|\n+|\s+/gi, "").toLowerCase();
            default:
              throw new Error("Unsupported platform: " + process.platform);
          }
        }
        function u2(t4) {
          var n4 = c2((0, p2.execSync)(y2[h2]).toString());
          return t4 ? n4 : i2(n4);
        }
        function s2(t4) {
          return new a2.default(function(n4, r3) {
            return (0, p2.exec)(y2[h2], {}, function(e3, o3, u3) {
              if (e3) return r3(new Error("Error while obtaining machine id: " + e3.stack));
              var s3 = c2(o3.toString());
              return n4(t4 ? s3 : i2(s3));
            });
          });
        }
        Object.defineProperty(n3, "__esModule", { value: true });
        var f2 = r2(35), a2 = e2(f2);
        n3.machineIdSync = u2, n3.machineId = s2;
        var p2 = r2(70), l2 = r2(71), v2 = process, h2 = v2.platform, d2 = { native: "%windir%\\System32", mixed: "%windir%\\sysnative\\cmd.exe /c %windir%\\System32" }, y2 = { darwin: "ioreg -rd1 -c IOPlatformExpertDevice", win32: d2[o2()] + "\\REG.exe QUERY HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Cryptography /v MachineGuid", linux: "( cat /var/lib/dbus/machine-id /etc/machine-id 2> /dev/null || hostname ) | head -n 1 || :", freebsd: "kenv -q smbios.system.uuid || sysctl -n kern.hostuuid" };
      }, function(t3, n3, r2) {
        t3.exports = { default: r2(36), __esModule: true };
      }, function(t3, n3, r2) {
        r2(66), r2(68), r2(69), r2(67), t3.exports = r2(6).Promise;
      }, function(t3, n3) {
        t3.exports = function() {
        };
      }, function(t3, n3) {
        t3.exports = function(t4, n4, r2, e2) {
          if (!(t4 instanceof n4) || void 0 !== e2 && e2 in t4) throw TypeError(r2 + ": incorrect invocation!");
          return t4;
        };
      }, function(t3, n3, r2) {
        var e2 = r2(13), o2 = r2(31), i2 = r2(62);
        t3.exports = function(t4) {
          return function(n4, r3, c2) {
            var u2, s2 = e2(n4), f2 = o2(s2.length), a2 = i2(c2, f2);
            if (t4 && r3 != r3) {
              for (; f2 > a2; ) if (u2 = s2[a2++], u2 != u2) return true;
            } else for (; f2 > a2; a2++) if ((t4 || a2 in s2) && s2[a2] === r3) return t4 || a2 || 0;
            return !t4 && -1;
          };
        };
      }, function(t3, n3, r2) {
        var e2 = r2(7), o2 = r2(44), i2 = r2(43), c2 = r2(3), u2 = r2(31), s2 = r2(64), f2 = {}, a2 = {}, n3 = t3.exports = function(t4, n4, r3, p2, l2) {
          var v2, h2, d2, y2, _2 = l2 ? function() {
            return t4;
          } : s2(t4), x2 = e2(r3, p2, n4 ? 2 : 1), m2 = 0;
          if ("function" != typeof _2) throw TypeError(t4 + " is not iterable!");
          if (i2(_2)) {
            for (v2 = u2(t4.length); v2 > m2; m2++) if (y2 = n4 ? x2(c2(h2 = t4[m2])[0], h2[1]) : x2(t4[m2]), y2 === f2 || y2 === a2) return y2;
          } else for (d2 = _2.call(t4); !(h2 = d2.next()).done; ) if (y2 = o2(d2, x2, h2.value, n4), y2 === f2 || y2 === a2) return y2;
        };
        n3.BREAK = f2, n3.RETURN = a2;
      }, function(t3, n3) {
        t3.exports = function(t4, n4, r2) {
          var e2 = void 0 === r2;
          switch (n4.length) {
            case 0:
              return e2 ? t4() : t4.call(r2);
            case 1:
              return e2 ? t4(n4[0]) : t4.call(r2, n4[0]);
            case 2:
              return e2 ? t4(n4[0], n4[1]) : t4.call(r2, n4[0], n4[1]);
            case 3:
              return e2 ? t4(n4[0], n4[1], n4[2]) : t4.call(r2, n4[0], n4[1], n4[2]);
            case 4:
              return e2 ? t4(n4[0], n4[1], n4[2], n4[3]) : t4.call(r2, n4[0], n4[1], n4[2], n4[3]);
          }
          return t4.apply(r2, n4);
        };
      }, function(t3, n3, r2) {
        var e2 = r2(11);
        t3.exports = Object("z").propertyIsEnumerable(0) ? Object : function(t4) {
          return "String" == e2(t4) ? t4.split("") : Object(t4);
        };
      }, function(t3, n3, r2) {
        var e2 = r2(10), o2 = r2(1)("iterator"), i2 = Array.prototype;
        t3.exports = function(t4) {
          return void 0 !== t4 && (e2.Array === t4 || i2[o2] === t4);
        };
      }, function(t3, n3, r2) {
        var e2 = r2(3);
        t3.exports = function(t4, n4, r3, o2) {
          try {
            return o2 ? n4(e2(r3)[0], r3[1]) : n4(r3);
          } catch (n5) {
            var i2 = t4.return;
            throw void 0 !== i2 && e2(i2.call(t4)), n5;
          }
        };
      }, function(t3, n3, r2) {
        "use strict";
        var e2 = r2(49), o2 = r2(17), i2 = r2(18), c2 = {};
        r2(5)(c2, r2(1)("iterator"), function() {
          return this;
        }), t3.exports = function(t4, n4, r3) {
          t4.prototype = e2(c2, { next: o2(1, r3) }), i2(t4, n4 + " Iterator");
        };
      }, function(t3, n3, r2) {
        var e2 = r2(1)("iterator"), o2 = false;
        try {
          var i2 = [7][e2]();
          i2.return = function() {
            o2 = true;
          }, Array.from(i2, function() {
            throw 2;
          });
        } catch (t4) {
        }
        t3.exports = function(t4, n4) {
          if (!n4 && !o2) return false;
          var r3 = false;
          try {
            var i3 = [7], c2 = i3[e2]();
            c2.next = function() {
              return { done: r3 = true };
            }, i3[e2] = function() {
              return c2;
            }, t4(i3);
          } catch (t5) {
          }
          return r3;
        };
      }, function(t3, n3) {
        t3.exports = function(t4, n4) {
          return { value: n4, done: !!t4 };
        };
      }, function(t3, n3, r2) {
        var e2 = r2(2), o2 = r2(30).set, i2 = e2.MutationObserver || e2.WebKitMutationObserver, c2 = e2.process, u2 = e2.Promise, s2 = "process" == r2(11)(c2);
        t3.exports = function() {
          var t4, n4, r3, f2 = function() {
            var e3, o3;
            for (s2 && (e3 = c2.domain) && e3.exit(); t4; ) {
              o3 = t4.fn, t4 = t4.next;
              try {
                o3();
              } catch (e4) {
                throw t4 ? r3() : n4 = void 0, e4;
              }
            }
            n4 = void 0, e3 && e3.enter();
          };
          if (s2) r3 = function() {
            c2.nextTick(f2);
          };
          else if (i2) {
            var a2 = true, p2 = document.createTextNode("");
            new i2(f2).observe(p2, { characterData: true }), r3 = function() {
              p2.data = a2 = !a2;
            };
          } else if (u2 && u2.resolve) {
            var l2 = u2.resolve();
            r3 = function() {
              l2.then(f2);
            };
          } else r3 = function() {
            o2.call(e2, f2);
          };
          return function(e3) {
            var o3 = { fn: e3, next: void 0 };
            n4 && (n4.next = o3), t4 || (t4 = o3, r3()), n4 = o3;
          };
        };
      }, function(t3, n3, r2) {
        var e2 = r2(3), o2 = r2(50), i2 = r2(22), c2 = r2(19)("IE_PROTO"), u2 = function() {
        }, s2 = "prototype", f2 = function() {
          var t4, n4 = r2(16)("iframe"), e3 = i2.length, o3 = ">";
          for (n4.style.display = "none", r2(25).appendChild(n4), n4.src = "javascript:", t4 = n4.contentWindow.document, t4.open(), t4.write("<script>document.F=Object</script" + o3), t4.close(), f2 = t4.F; e3--; ) delete f2[s2][i2[e3]];
          return f2();
        };
        t3.exports = Object.create || function(t4, n4) {
          var r3;
          return null !== t4 ? (u2[s2] = e2(t4), r3 = new u2(), u2[s2] = null, r3[c2] = t4) : r3 = f2(), void 0 === n4 ? r3 : o2(r3, n4);
        };
      }, function(t3, n3, r2) {
        var e2 = r2(12), o2 = r2(3), i2 = r2(54);
        t3.exports = r2(4) ? Object.defineProperties : function(t4, n4) {
          o2(t4);
          for (var r3, c2 = i2(n4), u2 = c2.length, s2 = 0; u2 > s2; ) e2.f(t4, r3 = c2[s2++], n4[r3]);
          return t4;
        };
      }, function(t3, n3, r2) {
        var e2 = r2(55), o2 = r2(17), i2 = r2(13), c2 = r2(32), u2 = r2(8), s2 = r2(26), f2 = Object.getOwnPropertyDescriptor;
        n3.f = r2(4) ? f2 : function(t4, n4) {
          if (t4 = i2(t4), n4 = c2(n4, true), s2) try {
            return f2(t4, n4);
          } catch (t5) {
          }
          if (u2(t4, n4)) return o2(!e2.f.call(t4, n4), t4[n4]);
        };
      }, function(t3, n3, r2) {
        var e2 = r2(8), o2 = r2(63), i2 = r2(19)("IE_PROTO"), c2 = Object.prototype;
        t3.exports = Object.getPrototypeOf || function(t4) {
          return t4 = o2(t4), e2(t4, i2) ? t4[i2] : "function" == typeof t4.constructor && t4 instanceof t4.constructor ? t4.constructor.prototype : t4 instanceof Object ? c2 : null;
        };
      }, function(t3, n3, r2) {
        var e2 = r2(8), o2 = r2(13), i2 = r2(39)(false), c2 = r2(19)("IE_PROTO");
        t3.exports = function(t4, n4) {
          var r3, u2 = o2(t4), s2 = 0, f2 = [];
          for (r3 in u2) r3 != c2 && e2(u2, r3) && f2.push(r3);
          for (; n4.length > s2; ) e2(u2, r3 = n4[s2++]) && (~i2(f2, r3) || f2.push(r3));
          return f2;
        };
      }, function(t3, n3, r2) {
        var e2 = r2(53), o2 = r2(22);
        t3.exports = Object.keys || function(t4) {
          return e2(t4, o2);
        };
      }, function(t3, n3) {
        n3.f = {}.propertyIsEnumerable;
      }, function(t3, n3, r2) {
        var e2 = r2(5);
        t3.exports = function(t4, n4, r3) {
          for (var o2 in n4) r3 && t4[o2] ? t4[o2] = n4[o2] : e2(t4, o2, n4[o2]);
          return t4;
        };
      }, function(t3, n3, r2) {
        t3.exports = r2(5);
      }, function(t3, n3, r2) {
        var e2 = r2(9), o2 = r2(3), i2 = function(t4, n4) {
          if (o2(t4), !e2(n4) && null !== n4) throw TypeError(n4 + ": can't set as prototype!");
        };
        t3.exports = { set: Object.setPrototypeOf || ("__proto__" in {} ? (function(t4, n4, e3) {
          try {
            e3 = r2(7)(Function.call, r2(51).f(Object.prototype, "__proto__").set, 2), e3(t4, []), n4 = !(t4 instanceof Array);
          } catch (t5) {
            n4 = true;
          }
          return function(t5, r3) {
            return i2(t5, r3), n4 ? t5.__proto__ = r3 : e3(t5, r3), t5;
          };
        })({}, false) : void 0), check: i2 };
      }, function(t3, n3, r2) {
        "use strict";
        var e2 = r2(2), o2 = r2(6), i2 = r2(12), c2 = r2(4), u2 = r2(1)("species");
        t3.exports = function(t4) {
          var n4 = "function" == typeof o2[t4] ? o2[t4] : e2[t4];
          c2 && n4 && !n4[u2] && i2.f(n4, u2, { configurable: true, get: function() {
            return this;
          } });
        };
      }, function(t3, n3, r2) {
        var e2 = r2(3), o2 = r2(14), i2 = r2(1)("species");
        t3.exports = function(t4, n4) {
          var r3, c2 = e2(t4).constructor;
          return void 0 === c2 || void 0 == (r3 = e2(c2)[i2]) ? n4 : o2(r3);
        };
      }, function(t3, n3, r2) {
        var e2 = r2(20), o2 = r2(15);
        t3.exports = function(t4) {
          return function(n4, r3) {
            var i2, c2, u2 = String(o2(n4)), s2 = e2(r3), f2 = u2.length;
            return s2 < 0 || s2 >= f2 ? t4 ? "" : void 0 : (i2 = u2.charCodeAt(s2), i2 < 55296 || i2 > 56319 || s2 + 1 === f2 || (c2 = u2.charCodeAt(s2 + 1)) < 56320 || c2 > 57343 ? t4 ? u2.charAt(s2) : i2 : t4 ? u2.slice(s2, s2 + 2) : (i2 - 55296 << 10) + (c2 - 56320) + 65536);
          };
        };
      }, function(t3, n3, r2) {
        var e2 = r2(20), o2 = Math.max, i2 = Math.min;
        t3.exports = function(t4, n4) {
          return t4 = e2(t4), t4 < 0 ? o2(t4 + n4, 0) : i2(t4, n4);
        };
      }, function(t3, n3, r2) {
        var e2 = r2(15);
        t3.exports = function(t4) {
          return Object(e2(t4));
        };
      }, function(t3, n3, r2) {
        var e2 = r2(21), o2 = r2(1)("iterator"), i2 = r2(10);
        t3.exports = r2(6).getIteratorMethod = function(t4) {
          if (void 0 != t4) return t4[o2] || t4["@@iterator"] || i2[e2(t4)];
        };
      }, function(t3, n3, r2) {
        "use strict";
        var e2 = r2(37), o2 = r2(47), i2 = r2(10), c2 = r2(13);
        t3.exports = r2(27)(Array, "Array", function(t4, n4) {
          this._t = c2(t4), this._i = 0, this._k = n4;
        }, function() {
          var t4 = this._t, n4 = this._k, r3 = this._i++;
          return !t4 || r3 >= t4.length ? (this._t = void 0, o2(1)) : "keys" == n4 ? o2(0, r3) : "values" == n4 ? o2(0, t4[r3]) : o2(0, [r3, t4[r3]]);
        }, "values"), i2.Arguments = i2.Array, e2("keys"), e2("values"), e2("entries");
      }, function(t3, n3) {
      }, function(t3, n3, r2) {
        "use strict";
        var e2, o2, i2, c2 = r2(28), u2 = r2(2), s2 = r2(7), f2 = r2(21), a2 = r2(23), p2 = r2(9), l2 = (r2(3), r2(14)), v2 = r2(38), h2 = r2(40), d2 = (r2(58).set, r2(60)), y2 = r2(30).set, _2 = r2(48)(), x2 = "Promise", m2 = u2.TypeError, w2 = u2.process, g2 = u2[x2], w2 = u2.process, b2 = "process" == f2(w2), O2 = function() {
        }, j2 = !!(function() {
          try {
            var t4 = g2.resolve(1), n4 = (t4.constructor = {})[r2(1)("species")] = function(t5) {
              t5(O2, O2);
            };
            return (b2 || "function" == typeof PromiseRejectionEvent) && t4.then(O2) instanceof n4;
          } catch (t5) {
          }
        })(), S2 = function(t4, n4) {
          return t4 === n4 || t4 === g2 && n4 === i2;
        }, E2 = function(t4) {
          var n4;
          return !(!p2(t4) || "function" != typeof (n4 = t4.then)) && n4;
        }, P2 = function(t4) {
          return S2(g2, t4) ? new M2(t4) : new o2(t4);
        }, M2 = o2 = function(t4) {
          var n4, r3;
          this.promise = new t4(function(t5, e3) {
            if (void 0 !== n4 || void 0 !== r3) throw m2("Bad Promise constructor");
            n4 = t5, r3 = e3;
          }), this.resolve = l2(n4), this.reject = l2(r3);
        }, T2 = function(t4) {
          try {
            t4();
          } catch (t5) {
            return { error: t5 };
          }
        }, A2 = function(t4, n4) {
          if (!t4._n) {
            t4._n = true;
            var r3 = t4._c;
            _2(function() {
              for (var e3 = t4._v, o3 = 1 == t4._s, i3 = 0, c3 = function(n5) {
                var r4, i4, c4 = o3 ? n5.ok : n5.fail, u3 = n5.resolve, s3 = n5.reject, f3 = n5.domain;
                try {
                  c4 ? (o3 || (2 == t4._h && I2(t4), t4._h = 1), c4 === true ? r4 = e3 : (f3 && f3.enter(), r4 = c4(e3), f3 && f3.exit()), r4 === n5.promise ? s3(m2("Promise-chain cycle")) : (i4 = E2(r4)) ? i4.call(r4, u3, s3) : u3(r4)) : s3(e3);
                } catch (t5) {
                  s3(t5);
                }
              }; r3.length > i3; ) c3(r3[i3++]);
              t4._c = [], t4._n = false, n4 && !t4._h && k2(t4);
            });
          }
        }, k2 = function(t4) {
          y2.call(u2, function() {
            var n4, r3, e3, o3 = t4._v;
            if (C2(t4) && (n4 = T2(function() {
              b2 ? w2.emit("unhandledRejection", o3, t4) : (r3 = u2.onunhandledrejection) ? r3({ promise: t4, reason: o3 }) : (e3 = u2.console) && e3.error && e3.error("Unhandled promise rejection", o3);
            }), t4._h = b2 || C2(t4) ? 2 : 1), t4._a = void 0, n4) throw n4.error;
          });
        }, C2 = function(t4) {
          if (1 == t4._h) return false;
          for (var n4, r3 = t4._a || t4._c, e3 = 0; r3.length > e3; ) if (n4 = r3[e3++], n4.fail || !C2(n4.promise)) return false;
          return true;
        }, I2 = function(t4) {
          y2.call(u2, function() {
            var n4;
            b2 ? w2.emit("rejectionHandled", t4) : (n4 = u2.onrejectionhandled) && n4({ promise: t4, reason: t4._v });
          });
        }, R2 = function(t4) {
          var n4 = this;
          n4._d || (n4._d = true, n4 = n4._w || n4, n4._v = t4, n4._s = 2, n4._a || (n4._a = n4._c.slice()), A2(n4, true));
        }, F2 = function(t4) {
          var n4, r3 = this;
          if (!r3._d) {
            r3._d = true, r3 = r3._w || r3;
            try {
              if (r3 === t4) throw m2("Promise can't be resolved itself");
              (n4 = E2(t4)) ? _2(function() {
                var e3 = { _w: r3, _d: false };
                try {
                  n4.call(t4, s2(F2, e3, 1), s2(R2, e3, 1));
                } catch (t5) {
                  R2.call(e3, t5);
                }
              }) : (r3._v = t4, r3._s = 1, A2(r3, false));
            } catch (t5) {
              R2.call({ _w: r3, _d: false }, t5);
            }
          }
        };
        j2 || (g2 = function(t4) {
          v2(this, g2, x2, "_h"), l2(t4), e2.call(this);
          try {
            t4(s2(F2, this, 1), s2(R2, this, 1));
          } catch (t5) {
            R2.call(this, t5);
          }
        }, e2 = function(t4) {
          this._c = [], this._a = void 0, this._s = 0, this._d = false, this._v = void 0, this._h = 0, this._n = false;
        }, e2.prototype = r2(56)(g2.prototype, { then: function(t4, n4) {
          var r3 = P2(d2(this, g2));
          return r3.ok = "function" != typeof t4 || t4, r3.fail = "function" == typeof n4 && n4, r3.domain = b2 ? w2.domain : void 0, this._c.push(r3), this._a && this._a.push(r3), this._s && A2(this, false), r3.promise;
        }, catch: function(t4) {
          return this.then(void 0, t4);
        } }), M2 = function() {
          var t4 = new e2();
          this.promise = t4, this.resolve = s2(F2, t4, 1), this.reject = s2(R2, t4, 1);
        }), a2(a2.G + a2.W + a2.F * !j2, { Promise: g2 }), r2(18)(g2, x2), r2(59)(x2), i2 = r2(6)[x2], a2(a2.S + a2.F * !j2, x2, { reject: function(t4) {
          var n4 = P2(this), r3 = n4.reject;
          return r3(t4), n4.promise;
        } }), a2(a2.S + a2.F * (c2 || !j2), x2, { resolve: function(t4) {
          if (t4 instanceof g2 && S2(t4.constructor, this)) return t4;
          var n4 = P2(this), r3 = n4.resolve;
          return r3(t4), n4.promise;
        } }), a2(a2.S + a2.F * !(j2 && r2(46)(function(t4) {
          g2.all(t4).catch(O2);
        })), x2, { all: function(t4) {
          var n4 = this, r3 = P2(n4), e3 = r3.resolve, o3 = r3.reject, i3 = T2(function() {
            var r4 = [], i4 = 0, c3 = 1;
            h2(t4, false, function(t5) {
              var u3 = i4++, s3 = false;
              r4.push(void 0), c3++, n4.resolve(t5).then(function(t6) {
                s3 || (s3 = true, r4[u3] = t6, --c3 || e3(r4));
              }, o3);
            }), --c3 || e3(r4);
          });
          return i3 && o3(i3.error), r3.promise;
        }, race: function(t4) {
          var n4 = this, r3 = P2(n4), e3 = r3.reject, o3 = T2(function() {
            h2(t4, false, function(t5) {
              n4.resolve(t5).then(r3.resolve, e3);
            });
          });
          return o3 && e3(o3.error), r3.promise;
        } });
      }, function(t3, n3, r2) {
        "use strict";
        var e2 = r2(61)(true);
        r2(27)(String, "String", function(t4) {
          this._t = String(t4), this._i = 0;
        }, function() {
          var t4, n4 = this._t, r3 = this._i;
          return r3 >= n4.length ? { value: void 0, done: true } : (t4 = e2(n4, r3), this._i += t4.length, { value: t4, done: false });
        });
      }, function(t3, n3, r2) {
        r2(65);
        for (var e2 = r2(2), o2 = r2(5), i2 = r2(10), c2 = r2(1)("toStringTag"), u2 = ["NodeList", "DOMTokenList", "MediaList", "StyleSheetList", "CSSRuleList"], s2 = 0; s2 < 5; s2++) {
          var f2 = u2[s2], a2 = e2[f2], p2 = a2 && a2.prototype;
          p2 && !p2[c2] && o2(p2, c2, f2), i2[f2] = i2.Array;
        }
      }, function(t3, n3) {
        t3.exports = require("child_process");
      }, function(t3, n3) {
        t3.exports = require("crypto");
      }]);
    });
  }
});

// ../../node_modules/.pnpm/@hono+node-server@1.14.1_hono@4.7.8/node_modules/@hono/node-server/dist/index.js
var require_dist2 = __commonJS({
  "../../node_modules/.pnpm/@hono+node-server@1.14.1_hono@4.7.8/node_modules/@hono/node-server/dist/index.js"(exports2, module2) {
    "use strict";
    var __create2 = Object.create;
    var __defProp2 = Object.defineProperty;
    var __getOwnPropDesc2 = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames2 = Object.getOwnPropertyNames;
    var __getProtoOf2 = Object.getPrototypeOf;
    var __hasOwnProp2 = Object.prototype.hasOwnProperty;
    var __export = (target, all) => {
      for (var name in all)
        __defProp2(target, name, { get: all[name], enumerable: true });
    };
    var __copyProps2 = (to, from, except, desc) => {
      if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames2(from))
          if (!__hasOwnProp2.call(to, key) && key !== except)
            __defProp2(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc2(from, key)) || desc.enumerable });
      }
      return to;
    };
    var __toESM2 = (mod, isNodeMode, target) => (target = mod != null ? __create2(__getProtoOf2(mod)) : {}, __copyProps2(
      // If the importer is in node compatibility mode or this is not an ESM
      // file that has been converted to a CommonJS file using a Babel-
      // compatible transform (i.e. "__esModule" has not been set), then set
      // "default" to the CommonJS "module.exports" for node compatibility.
      isNodeMode || !mod || !mod.__esModule ? __defProp2(target, "default", { value: mod, enumerable: true }) : target,
      mod
    ));
    var __toCommonJS = (mod) => __copyProps2(__defProp2({}, "__esModule", { value: true }), mod);
    var src_exports = {};
    __export(src_exports, {
      RequestError: () => RequestError,
      createAdaptorServer: () => createAdaptorServer,
      getRequestListener: () => getRequestListener,
      serve: () => serve3
    });
    module2.exports = __toCommonJS(src_exports);
    var import_node_http = require("http");
    var import_node_http2 = require("http2");
    var import_node_stream2 = require("stream");
    var RequestError = class extends Error {
      static name = "RequestError";
      constructor(message, options) {
        super(message, options);
      }
    };
    var toRequestError = (e2) => {
      if (e2 instanceof RequestError) {
        return e2;
      }
      return new RequestError(e2.message, { cause: e2 });
    };
    var GlobalRequest = global.Request;
    var Request2 = class extends GlobalRequest {
      constructor(input, options) {
        if (typeof input === "object" && getRequestCache in input) {
          input = input[getRequestCache]();
        }
        if (typeof options?.body?.getReader !== "undefined") {
          ;
          options.duplex ??= "half";
        }
        super(input, options);
      }
    };
    var newRequestFromIncoming = (method, url, incoming, abortController) => {
      const headerRecord = [];
      const rawHeaders = incoming.rawHeaders;
      for (let i2 = 0; i2 < rawHeaders.length; i2 += 2) {
        const { [i2]: key, [i2 + 1]: value } = rawHeaders;
        if (key.charCodeAt(0) !== /*:*/
        58) {
          headerRecord.push([key, value]);
        }
      }
      const init = {
        method,
        headers: headerRecord,
        signal: abortController.signal
      };
      if (method === "TRACE") {
        init.method = "GET";
        const req = new Request2(url, init);
        Object.defineProperty(req, "method", {
          get() {
            return "TRACE";
          }
        });
        return req;
      }
      if (!(method === "GET" || method === "HEAD")) {
        if ("rawBody" in incoming && incoming.rawBody instanceof Buffer) {
          init.body = new ReadableStream({
            start(controller) {
              controller.enqueue(incoming.rawBody);
              controller.close();
            }
          });
        } else {
          init.body = import_node_stream2.Readable.toWeb(incoming);
        }
      }
      return new Request2(url, init);
    };
    var getRequestCache = /* @__PURE__ */ Symbol("getRequestCache");
    var requestCache = /* @__PURE__ */ Symbol("requestCache");
    var incomingKey = /* @__PURE__ */ Symbol("incomingKey");
    var urlKey = /* @__PURE__ */ Symbol("urlKey");
    var abortControllerKey = /* @__PURE__ */ Symbol("abortControllerKey");
    var getAbortController = /* @__PURE__ */ Symbol("getAbortController");
    var requestPrototype = {
      get method() {
        return this[incomingKey].method || "GET";
      },
      get url() {
        return this[urlKey];
      },
      [getAbortController]() {
        this[getRequestCache]();
        return this[abortControllerKey];
      },
      [getRequestCache]() {
        this[abortControllerKey] ||= new AbortController();
        return this[requestCache] ||= newRequestFromIncoming(
          this.method,
          this[urlKey],
          this[incomingKey],
          this[abortControllerKey]
        );
      }
    };
    [
      "body",
      "bodyUsed",
      "cache",
      "credentials",
      "destination",
      "headers",
      "integrity",
      "mode",
      "redirect",
      "referrer",
      "referrerPolicy",
      "signal",
      "keepalive"
    ].forEach((k2) => {
      Object.defineProperty(requestPrototype, k2, {
        get() {
          return this[getRequestCache]()[k2];
        }
      });
    });
    ["arrayBuffer", "blob", "clone", "formData", "json", "text"].forEach((k2) => {
      Object.defineProperty(requestPrototype, k2, {
        value: function() {
          return this[getRequestCache]()[k2]();
        }
      });
    });
    Object.setPrototypeOf(requestPrototype, Request2.prototype);
    var newRequest = (incoming, defaultHostname) => {
      const req = Object.create(requestPrototype);
      req[incomingKey] = incoming;
      const incomingUrl = incoming.url || "";
      if (incomingUrl[0] !== "/" && // short-circuit for performance. most requests are relative URL.
      (incomingUrl.startsWith("http://") || incomingUrl.startsWith("https://"))) {
        if (incoming instanceof import_node_http2.Http2ServerRequest) {
          throw new RequestError("Absolute URL for :path is not allowed in HTTP/2");
        }
        try {
          const url2 = new URL(incomingUrl);
          req[urlKey] = url2.href;
        } catch (e2) {
          throw new RequestError("Invalid absolute URL", { cause: e2 });
        }
        return req;
      }
      const host = (incoming instanceof import_node_http2.Http2ServerRequest ? incoming.authority : incoming.headers.host) || defaultHostname;
      if (!host) {
        throw new RequestError("Missing host header");
      }
      let scheme;
      if (incoming instanceof import_node_http2.Http2ServerRequest) {
        scheme = incoming.scheme;
        if (!(scheme === "http" || scheme === "https")) {
          throw new RequestError("Unsupported scheme");
        }
      } else {
        scheme = incoming.socket && incoming.socket.encrypted ? "https" : "http";
      }
      const url = new URL(`${scheme}://${host}${incomingUrl}`);
      if (url.hostname.length !== host.length && url.hostname !== host.replace(/:\d+$/, "")) {
        throw new RequestError("Invalid host header");
      }
      req[urlKey] = url.href;
      return req;
    };
    function writeFromReadableStream(stream2, writable) {
      if (stream2.locked) {
        throw new TypeError("ReadableStream is locked.");
      } else if (writable.destroyed) {
        stream2.cancel();
        return;
      }
      const reader = stream2.getReader();
      writable.on("close", cancel);
      writable.on("error", cancel);
      reader.read().then(flow, cancel);
      return reader.closed.finally(() => {
        writable.off("close", cancel);
        writable.off("error", cancel);
      });
      function cancel(error) {
        reader.cancel(error).catch(() => {
        });
        if (error) {
          writable.destroy(error);
        }
      }
      function onDrain() {
        reader.read().then(flow, cancel);
      }
      function flow({ done, value }) {
        try {
          if (done) {
            writable.end();
          } else if (!writable.write(value)) {
            writable.once("drain", onDrain);
          } else {
            return reader.read().then(flow, cancel);
          }
        } catch (e2) {
          cancel(e2);
        }
      }
    }
    var buildOutgoingHttpHeaders = (headers) => {
      const res = {};
      if (!(headers instanceof Headers)) {
        headers = new Headers(headers ?? void 0);
      }
      const cookies = [];
      for (const [k2, v2] of headers) {
        if (k2 === "set-cookie") {
          cookies.push(v2);
        } else {
          res[k2] = v2;
        }
      }
      if (cookies.length > 0) {
        res["set-cookie"] = cookies;
      }
      res["content-type"] ??= "text/plain; charset=UTF-8";
      return res;
    };
    var responseCache = /* @__PURE__ */ Symbol("responseCache");
    var getResponseCache = /* @__PURE__ */ Symbol("getResponseCache");
    var cacheKey = /* @__PURE__ */ Symbol("cache");
    var GlobalResponse = global.Response;
    var Response2 = class _Response {
      #body;
      #init;
      [getResponseCache]() {
        delete this[cacheKey];
        return this[responseCache] ||= new GlobalResponse(this.#body, this.#init);
      }
      constructor(body, init) {
        this.#body = body;
        if (init instanceof _Response) {
          const cachedGlobalResponse = init[responseCache];
          if (cachedGlobalResponse) {
            this.#init = cachedGlobalResponse;
            this[getResponseCache]();
            return;
          } else {
            this.#init = init.#init;
          }
        } else {
          this.#init = init;
        }
        if (typeof body === "string" || typeof body?.getReader !== "undefined") {
          let headers = init?.headers || { "content-type": "text/plain; charset=UTF-8" };
          if (headers instanceof Headers) {
            headers = buildOutgoingHttpHeaders(headers);
          }
          ;
          this[cacheKey] = [init?.status || 200, body, headers];
        }
      }
    };
    [
      "body",
      "bodyUsed",
      "headers",
      "ok",
      "redirected",
      "status",
      "statusText",
      "trailers",
      "type",
      "url"
    ].forEach((k2) => {
      Object.defineProperty(Response2.prototype, k2, {
        get() {
          return this[getResponseCache]()[k2];
        }
      });
    });
    ["arrayBuffer", "blob", "clone", "formData", "json", "text"].forEach((k2) => {
      Object.defineProperty(Response2.prototype, k2, {
        value: function() {
          return this[getResponseCache]()[k2]();
        }
      });
    });
    Object.setPrototypeOf(Response2, GlobalResponse);
    Object.setPrototypeOf(Response2.prototype, GlobalResponse.prototype);
    var stateKey = Reflect.ownKeys(new GlobalResponse()).find(
      (k2) => typeof k2 === "symbol" && k2.toString() === "Symbol(state)"
    );
    if (!stateKey) {
      console.warn("Failed to find Response internal state key");
    }
    function getInternalBody(response) {
      if (!stateKey) {
        return;
      }
      if (response instanceof Response2) {
        response = response[getResponseCache]();
      }
      const state = response[stateKey];
      return state && state.body || void 0;
    }
    var X_ALREADY_SENT = "x-hono-already-sent";
    var import_node_crypto2 = __toESM2(require("crypto"));
    var webFetch = global.fetch;
    if (typeof global.crypto === "undefined") {
      global.crypto = import_node_crypto2.default;
    }
    global.fetch = (info, init) => {
      init = {
        // Disable compression handling so people can return the result of a fetch
        // directly in the loader without messing with the Content-Encoding header.
        compress: false,
        ...init
      };
      return webFetch(info, init);
    };
    var regBuffer = /^no$/i;
    var regContentType = /^(application\/json\b|text\/(?!event-stream\b))/i;
    var handleRequestError = () => new Response(null, {
      status: 400
    });
    var handleFetchError = (e2) => new Response(null, {
      status: e2 instanceof Error && (e2.name === "TimeoutError" || e2.constructor.name === "TimeoutError") ? 504 : 500
    });
    var handleResponseError = (e2, outgoing) => {
      const err = e2 instanceof Error ? e2 : new Error("unknown error", { cause: e2 });
      if (err.code === "ERR_STREAM_PREMATURE_CLOSE") {
        console.info("The user aborted a request.");
      } else {
        console.error(e2);
        if (!outgoing.headersSent) {
          outgoing.writeHead(500, { "Content-Type": "text/plain" });
        }
        outgoing.end(`Error: ${err.message}`);
        outgoing.destroy(err);
      }
    };
    var responseViaCache = (res, outgoing) => {
      const [status, body, header] = res[cacheKey];
      if (typeof body === "string") {
        header["Content-Length"] = Buffer.byteLength(body);
        outgoing.writeHead(status, header);
        outgoing.end(body);
      } else {
        outgoing.writeHead(status, header);
        return writeFromReadableStream(body, outgoing)?.catch(
          (e2) => handleResponseError(e2, outgoing)
        );
      }
    };
    var responseViaResponseObject = async (res, outgoing, options = {}) => {
      if (res instanceof Promise) {
        if (options.errorHandler) {
          try {
            res = await res;
          } catch (err) {
            const errRes = await options.errorHandler(err);
            if (!errRes) {
              return;
            }
            res = errRes;
          }
        } else {
          res = await res.catch(handleFetchError);
        }
      }
      if (cacheKey in res) {
        return responseViaCache(res, outgoing);
      }
      const resHeaderRecord = buildOutgoingHttpHeaders(res.headers);
      const internalBody = getInternalBody(res);
      if (internalBody) {
        const { length, source, stream: stream2 } = internalBody;
        if (source instanceof Uint8Array && source.byteLength !== length) {
        } else {
          if (length) {
            resHeaderRecord["content-length"] = length;
          }
          outgoing.writeHead(res.status, resHeaderRecord);
          if (typeof source === "string" || source instanceof Uint8Array) {
            outgoing.end(source);
          } else if (source instanceof Blob) {
            outgoing.end(new Uint8Array(await source.arrayBuffer()));
          } else {
            await writeFromReadableStream(stream2, outgoing);
          }
          return;
        }
      }
      if (res.body) {
        const {
          "transfer-encoding": transferEncoding,
          "content-encoding": contentEncoding,
          "content-length": contentLength,
          "x-accel-buffering": accelBuffering,
          "content-type": contentType
        } = resHeaderRecord;
        if (transferEncoding || contentEncoding || contentLength || // nginx buffering variant
        accelBuffering && regBuffer.test(accelBuffering) || !regContentType.test(contentType)) {
          outgoing.writeHead(res.status, resHeaderRecord);
          await writeFromReadableStream(res.body, outgoing);
        } else {
          const buffer = await res.arrayBuffer();
          resHeaderRecord["content-length"] = buffer.byteLength;
          outgoing.writeHead(res.status, resHeaderRecord);
          outgoing.end(new Uint8Array(buffer));
        }
      } else if (resHeaderRecord[X_ALREADY_SENT]) {
      } else {
        outgoing.writeHead(res.status, resHeaderRecord);
        outgoing.end();
      }
    };
    var getRequestListener = (fetchCallback, options = {}) => {
      if (options.overrideGlobalObjects !== false && global.Request !== Request2) {
        Object.defineProperty(global, "Request", {
          value: Request2
        });
        Object.defineProperty(global, "Response", {
          value: Response2
        });
      }
      return async (incoming, outgoing) => {
        let res, req;
        try {
          req = newRequest(incoming, options.hostname);
          outgoing.on("close", () => {
            const abortController = req[abortControllerKey];
            if (!abortController) {
              return;
            }
            if (incoming.errored) {
              req[abortControllerKey].abort(incoming.errored.toString());
            } else if (!outgoing.writableFinished) {
              req[abortControllerKey].abort("Client connection prematurely closed.");
            }
          });
          res = fetchCallback(req, { incoming, outgoing });
          if (cacheKey in res) {
            return responseViaCache(res, outgoing);
          }
        } catch (e2) {
          if (!res) {
            if (options.errorHandler) {
              res = await options.errorHandler(req ? e2 : toRequestError(e2));
              if (!res) {
                return;
              }
            } else if (!req) {
              res = handleRequestError();
            } else {
              res = handleFetchError(e2);
            }
          } else {
            return handleResponseError(e2, outgoing);
          }
        }
        try {
          return await responseViaResponseObject(res, outgoing, options);
        } catch (e2) {
          return handleResponseError(e2, outgoing);
        }
      };
    };
    var createAdaptorServer = (options) => {
      const fetchCallback = options.fetch;
      const requestListener = getRequestListener(fetchCallback, {
        hostname: options.hostname,
        overrideGlobalObjects: options.overrideGlobalObjects
      });
      const createServer = options.createServer || import_node_http.createServer;
      const server = createServer(options.serverOptions || {}, requestListener);
      return server;
    };
    var serve3 = (options, listeningListener) => {
      const server = createAdaptorServer(options);
      server.listen(options?.port ?? 3e3, options.hostname, () => {
        const serverInfo = server.address();
        listeningListener && listeningListener(serverInfo);
      });
      return server;
    };
  }
});

// ../../node_modules/.pnpm/zod@3.24.4/node_modules/zod/lib/helpers/util.js
var require_util = __commonJS({
  "../../node_modules/.pnpm/zod@3.24.4/node_modules/zod/lib/helpers/util.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.getParsedType = exports2.ZodParsedType = exports2.objectUtil = exports2.util = void 0;
    var util;
    (function(util2) {
      util2.assertEqual = (val) => val;
      function assertIs(_arg) {
      }
      util2.assertIs = assertIs;
      function assertNever(_x) {
        throw new Error();
      }
      util2.assertNever = assertNever;
      util2.arrayToEnum = (items) => {
        const obj = {};
        for (const item of items) {
          obj[item] = item;
        }
        return obj;
      };
      util2.getValidEnumValues = (obj) => {
        const validKeys = util2.objectKeys(obj).filter((k2) => typeof obj[obj[k2]] !== "number");
        const filtered = {};
        for (const k2 of validKeys) {
          filtered[k2] = obj[k2];
        }
        return util2.objectValues(filtered);
      };
      util2.objectValues = (obj) => {
        return util2.objectKeys(obj).map(function(e2) {
          return obj[e2];
        });
      };
      util2.objectKeys = typeof Object.keys === "function" ? (obj) => Object.keys(obj) : (object) => {
        const keys = [];
        for (const key in object) {
          if (Object.prototype.hasOwnProperty.call(object, key)) {
            keys.push(key);
          }
        }
        return keys;
      };
      util2.find = (arr, checker) => {
        for (const item of arr) {
          if (checker(item))
            return item;
        }
        return void 0;
      };
      util2.isInteger = typeof Number.isInteger === "function" ? (val) => Number.isInteger(val) : (val) => typeof val === "number" && isFinite(val) && Math.floor(val) === val;
      function joinValues(array, separator = " | ") {
        return array.map((val) => typeof val === "string" ? `'${val}'` : val).join(separator);
      }
      util2.joinValues = joinValues;
      util2.jsonStringifyReplacer = (_2, value) => {
        if (typeof value === "bigint") {
          return value.toString();
        }
        return value;
      };
    })(util || (exports2.util = util = {}));
    var objectUtil;
    (function(objectUtil2) {
      objectUtil2.mergeShapes = (first, second) => {
        return {
          ...first,
          ...second
          // second overwrites first
        };
      };
    })(objectUtil || (exports2.objectUtil = objectUtil = {}));
    exports2.ZodParsedType = util.arrayToEnum([
      "string",
      "nan",
      "number",
      "integer",
      "float",
      "boolean",
      "date",
      "bigint",
      "symbol",
      "function",
      "undefined",
      "null",
      "array",
      "object",
      "unknown",
      "promise",
      "void",
      "never",
      "map",
      "set"
    ]);
    var getParsedType = (data) => {
      const t2 = typeof data;
      switch (t2) {
        case "undefined":
          return exports2.ZodParsedType.undefined;
        case "string":
          return exports2.ZodParsedType.string;
        case "number":
          return isNaN(data) ? exports2.ZodParsedType.nan : exports2.ZodParsedType.number;
        case "boolean":
          return exports2.ZodParsedType.boolean;
        case "function":
          return exports2.ZodParsedType.function;
        case "bigint":
          return exports2.ZodParsedType.bigint;
        case "symbol":
          return exports2.ZodParsedType.symbol;
        case "object":
          if (Array.isArray(data)) {
            return exports2.ZodParsedType.array;
          }
          if (data === null) {
            return exports2.ZodParsedType.null;
          }
          if (data.then && typeof data.then === "function" && data.catch && typeof data.catch === "function") {
            return exports2.ZodParsedType.promise;
          }
          if (typeof Map !== "undefined" && data instanceof Map) {
            return exports2.ZodParsedType.map;
          }
          if (typeof Set !== "undefined" && data instanceof Set) {
            return exports2.ZodParsedType.set;
          }
          if (typeof Date !== "undefined" && data instanceof Date) {
            return exports2.ZodParsedType.date;
          }
          return exports2.ZodParsedType.object;
        default:
          return exports2.ZodParsedType.unknown;
      }
    };
    exports2.getParsedType = getParsedType;
  }
});

// ../../node_modules/.pnpm/zod@3.24.4/node_modules/zod/lib/ZodError.js
var require_ZodError = __commonJS({
  "../../node_modules/.pnpm/zod@3.24.4/node_modules/zod/lib/ZodError.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.ZodError = exports2.quotelessJson = exports2.ZodIssueCode = void 0;
    var util_1 = require_util();
    exports2.ZodIssueCode = util_1.util.arrayToEnum([
      "invalid_type",
      "invalid_literal",
      "custom",
      "invalid_union",
      "invalid_union_discriminator",
      "invalid_enum_value",
      "unrecognized_keys",
      "invalid_arguments",
      "invalid_return_type",
      "invalid_date",
      "invalid_string",
      "too_small",
      "too_big",
      "invalid_intersection_types",
      "not_multiple_of",
      "not_finite"
    ]);
    var quotelessJson = (obj) => {
      const json = JSON.stringify(obj, null, 2);
      return json.replace(/"([^"]+)":/g, "$1:");
    };
    exports2.quotelessJson = quotelessJson;
    var ZodError = class _ZodError extends Error {
      get errors() {
        return this.issues;
      }
      constructor(issues) {
        super();
        this.issues = [];
        this.addIssue = (sub) => {
          this.issues = [...this.issues, sub];
        };
        this.addIssues = (subs = []) => {
          this.issues = [...this.issues, ...subs];
        };
        const actualProto = new.target.prototype;
        if (Object.setPrototypeOf) {
          Object.setPrototypeOf(this, actualProto);
        } else {
          this.__proto__ = actualProto;
        }
        this.name = "ZodError";
        this.issues = issues;
      }
      format(_mapper) {
        const mapper = _mapper || function(issue) {
          return issue.message;
        };
        const fieldErrors = { _errors: [] };
        const processError = (error) => {
          for (const issue of error.issues) {
            if (issue.code === "invalid_union") {
              issue.unionErrors.map(processError);
            } else if (issue.code === "invalid_return_type") {
              processError(issue.returnTypeError);
            } else if (issue.code === "invalid_arguments") {
              processError(issue.argumentsError);
            } else if (issue.path.length === 0) {
              fieldErrors._errors.push(mapper(issue));
            } else {
              let curr = fieldErrors;
              let i2 = 0;
              while (i2 < issue.path.length) {
                const el = issue.path[i2];
                const terminal = i2 === issue.path.length - 1;
                if (!terminal) {
                  curr[el] = curr[el] || { _errors: [] };
                } else {
                  curr[el] = curr[el] || { _errors: [] };
                  curr[el]._errors.push(mapper(issue));
                }
                curr = curr[el];
                i2++;
              }
            }
          }
        };
        processError(this);
        return fieldErrors;
      }
      static assert(value) {
        if (!(value instanceof _ZodError)) {
          throw new Error(`Not a ZodError: ${value}`);
        }
      }
      toString() {
        return this.message;
      }
      get message() {
        return JSON.stringify(this.issues, util_1.util.jsonStringifyReplacer, 2);
      }
      get isEmpty() {
        return this.issues.length === 0;
      }
      flatten(mapper = (issue) => issue.message) {
        const fieldErrors = {};
        const formErrors = [];
        for (const sub of this.issues) {
          if (sub.path.length > 0) {
            fieldErrors[sub.path[0]] = fieldErrors[sub.path[0]] || [];
            fieldErrors[sub.path[0]].push(mapper(sub));
          } else {
            formErrors.push(mapper(sub));
          }
        }
        return { formErrors, fieldErrors };
      }
      get formErrors() {
        return this.flatten();
      }
    };
    exports2.ZodError = ZodError;
    ZodError.create = (issues) => {
      const error = new ZodError(issues);
      return error;
    };
  }
});

// ../../node_modules/.pnpm/zod@3.24.4/node_modules/zod/lib/locales/en.js
var require_en = __commonJS({
  "../../node_modules/.pnpm/zod@3.24.4/node_modules/zod/lib/locales/en.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var util_1 = require_util();
    var ZodError_1 = require_ZodError();
    var errorMap = (issue, _ctx) => {
      let message;
      switch (issue.code) {
        case ZodError_1.ZodIssueCode.invalid_type:
          if (issue.received === util_1.ZodParsedType.undefined) {
            message = "Required";
          } else {
            message = `Expected ${issue.expected}, received ${issue.received}`;
          }
          break;
        case ZodError_1.ZodIssueCode.invalid_literal:
          message = `Invalid literal value, expected ${JSON.stringify(issue.expected, util_1.util.jsonStringifyReplacer)}`;
          break;
        case ZodError_1.ZodIssueCode.unrecognized_keys:
          message = `Unrecognized key(s) in object: ${util_1.util.joinValues(issue.keys, ", ")}`;
          break;
        case ZodError_1.ZodIssueCode.invalid_union:
          message = `Invalid input`;
          break;
        case ZodError_1.ZodIssueCode.invalid_union_discriminator:
          message = `Invalid discriminator value. Expected ${util_1.util.joinValues(issue.options)}`;
          break;
        case ZodError_1.ZodIssueCode.invalid_enum_value:
          message = `Invalid enum value. Expected ${util_1.util.joinValues(issue.options)}, received '${issue.received}'`;
          break;
        case ZodError_1.ZodIssueCode.invalid_arguments:
          message = `Invalid function arguments`;
          break;
        case ZodError_1.ZodIssueCode.invalid_return_type:
          message = `Invalid function return type`;
          break;
        case ZodError_1.ZodIssueCode.invalid_date:
          message = `Invalid date`;
          break;
        case ZodError_1.ZodIssueCode.invalid_string:
          if (typeof issue.validation === "object") {
            if ("includes" in issue.validation) {
              message = `Invalid input: must include "${issue.validation.includes}"`;
              if (typeof issue.validation.position === "number") {
                message = `${message} at one or more positions greater than or equal to ${issue.validation.position}`;
              }
            } else if ("startsWith" in issue.validation) {
              message = `Invalid input: must start with "${issue.validation.startsWith}"`;
            } else if ("endsWith" in issue.validation) {
              message = `Invalid input: must end with "${issue.validation.endsWith}"`;
            } else {
              util_1.util.assertNever(issue.validation);
            }
          } else if (issue.validation !== "regex") {
            message = `Invalid ${issue.validation}`;
          } else {
            message = "Invalid";
          }
          break;
        case ZodError_1.ZodIssueCode.too_small:
          if (issue.type === "array")
            message = `Array must contain ${issue.exact ? "exactly" : issue.inclusive ? `at least` : `more than`} ${issue.minimum} element(s)`;
          else if (issue.type === "string")
            message = `String must contain ${issue.exact ? "exactly" : issue.inclusive ? `at least` : `over`} ${issue.minimum} character(s)`;
          else if (issue.type === "number")
            message = `Number must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${issue.minimum}`;
          else if (issue.type === "date")
            message = `Date must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${new Date(Number(issue.minimum))}`;
          else
            message = "Invalid input";
          break;
        case ZodError_1.ZodIssueCode.too_big:
          if (issue.type === "array")
            message = `Array must contain ${issue.exact ? `exactly` : issue.inclusive ? `at most` : `less than`} ${issue.maximum} element(s)`;
          else if (issue.type === "string")
            message = `String must contain ${issue.exact ? `exactly` : issue.inclusive ? `at most` : `under`} ${issue.maximum} character(s)`;
          else if (issue.type === "number")
            message = `Number must be ${issue.exact ? `exactly` : issue.inclusive ? `less than or equal to` : `less than`} ${issue.maximum}`;
          else if (issue.type === "bigint")
            message = `BigInt must be ${issue.exact ? `exactly` : issue.inclusive ? `less than or equal to` : `less than`} ${issue.maximum}`;
          else if (issue.type === "date")
            message = `Date must be ${issue.exact ? `exactly` : issue.inclusive ? `smaller than or equal to` : `smaller than`} ${new Date(Number(issue.maximum))}`;
          else
            message = "Invalid input";
          break;
        case ZodError_1.ZodIssueCode.custom:
          message = `Invalid input`;
          break;
        case ZodError_1.ZodIssueCode.invalid_intersection_types:
          message = `Intersection results could not be merged`;
          break;
        case ZodError_1.ZodIssueCode.not_multiple_of:
          message = `Number must be a multiple of ${issue.multipleOf}`;
          break;
        case ZodError_1.ZodIssueCode.not_finite:
          message = "Number must be finite";
          break;
        default:
          message = _ctx.defaultError;
          util_1.util.assertNever(issue);
      }
      return { message };
    };
    exports2.default = errorMap;
  }
});

// ../../node_modules/.pnpm/zod@3.24.4/node_modules/zod/lib/errors.js
var require_errors = __commonJS({
  "../../node_modules/.pnpm/zod@3.24.4/node_modules/zod/lib/errors.js"(exports2) {
    "use strict";
    var __importDefault = exports2 && exports2.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.getErrorMap = exports2.setErrorMap = exports2.defaultErrorMap = void 0;
    var en_1 = __importDefault(require_en());
    exports2.defaultErrorMap = en_1.default;
    var overrideErrorMap = en_1.default;
    function setErrorMap(map) {
      overrideErrorMap = map;
    }
    exports2.setErrorMap = setErrorMap;
    function getErrorMap() {
      return overrideErrorMap;
    }
    exports2.getErrorMap = getErrorMap;
  }
});

// ../../node_modules/.pnpm/zod@3.24.4/node_modules/zod/lib/helpers/parseUtil.js
var require_parseUtil = __commonJS({
  "../../node_modules/.pnpm/zod@3.24.4/node_modules/zod/lib/helpers/parseUtil.js"(exports2) {
    "use strict";
    var __importDefault = exports2 && exports2.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.isAsync = exports2.isValid = exports2.isDirty = exports2.isAborted = exports2.OK = exports2.DIRTY = exports2.INVALID = exports2.ParseStatus = exports2.addIssueToContext = exports2.EMPTY_PATH = exports2.makeIssue = void 0;
    var errors_1 = require_errors();
    var en_1 = __importDefault(require_en());
    var makeIssue = (params) => {
      const { data, path: path6, errorMaps, issueData } = params;
      const fullPath = [...path6, ...issueData.path || []];
      const fullIssue = {
        ...issueData,
        path: fullPath
      };
      if (issueData.message !== void 0) {
        return {
          ...issueData,
          path: fullPath,
          message: issueData.message
        };
      }
      let errorMessage = "";
      const maps = errorMaps.filter((m2) => !!m2).slice().reverse();
      for (const map of maps) {
        errorMessage = map(fullIssue, { data, defaultError: errorMessage }).message;
      }
      return {
        ...issueData,
        path: fullPath,
        message: errorMessage
      };
    };
    exports2.makeIssue = makeIssue;
    exports2.EMPTY_PATH = [];
    function addIssueToContext(ctx, issueData) {
      const overrideMap = (0, errors_1.getErrorMap)();
      const issue = (0, exports2.makeIssue)({
        issueData,
        data: ctx.data,
        path: ctx.path,
        errorMaps: [
          ctx.common.contextualErrorMap,
          // contextual error map is first priority
          ctx.schemaErrorMap,
          // then schema-bound map if available
          overrideMap,
          // then global override map
          overrideMap === en_1.default ? void 0 : en_1.default
          // then global default map
        ].filter((x2) => !!x2)
      });
      ctx.common.issues.push(issue);
    }
    exports2.addIssueToContext = addIssueToContext;
    var ParseStatus = class _ParseStatus {
      constructor() {
        this.value = "valid";
      }
      dirty() {
        if (this.value === "valid")
          this.value = "dirty";
      }
      abort() {
        if (this.value !== "aborted")
          this.value = "aborted";
      }
      static mergeArray(status, results) {
        const arrayValue = [];
        for (const s2 of results) {
          if (s2.status === "aborted")
            return exports2.INVALID;
          if (s2.status === "dirty")
            status.dirty();
          arrayValue.push(s2.value);
        }
        return { status: status.value, value: arrayValue };
      }
      static async mergeObjectAsync(status, pairs) {
        const syncPairs = [];
        for (const pair of pairs) {
          const key = await pair.key;
          const value = await pair.value;
          syncPairs.push({
            key,
            value
          });
        }
        return _ParseStatus.mergeObjectSync(status, syncPairs);
      }
      static mergeObjectSync(status, pairs) {
        const finalObject = {};
        for (const pair of pairs) {
          const { key, value } = pair;
          if (key.status === "aborted")
            return exports2.INVALID;
          if (value.status === "aborted")
            return exports2.INVALID;
          if (key.status === "dirty")
            status.dirty();
          if (value.status === "dirty")
            status.dirty();
          if (key.value !== "__proto__" && (typeof value.value !== "undefined" || pair.alwaysSet)) {
            finalObject[key.value] = value.value;
          }
        }
        return { status: status.value, value: finalObject };
      }
    };
    exports2.ParseStatus = ParseStatus;
    exports2.INVALID = Object.freeze({
      status: "aborted"
    });
    var DIRTY = (value) => ({ status: "dirty", value });
    exports2.DIRTY = DIRTY;
    var OK = (value) => ({ status: "valid", value });
    exports2.OK = OK;
    var isAborted = (x2) => x2.status === "aborted";
    exports2.isAborted = isAborted;
    var isDirty = (x2) => x2.status === "dirty";
    exports2.isDirty = isDirty;
    var isValid = (x2) => x2.status === "valid";
    exports2.isValid = isValid;
    var isAsync = (x2) => typeof Promise !== "undefined" && x2 instanceof Promise;
    exports2.isAsync = isAsync;
  }
});

// ../../node_modules/.pnpm/zod@3.24.4/node_modules/zod/lib/helpers/typeAliases.js
var require_typeAliases = __commonJS({
  "../../node_modules/.pnpm/zod@3.24.4/node_modules/zod/lib/helpers/typeAliases.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
  }
});

// ../../node_modules/.pnpm/zod@3.24.4/node_modules/zod/lib/helpers/errorUtil.js
var require_errorUtil = __commonJS({
  "../../node_modules/.pnpm/zod@3.24.4/node_modules/zod/lib/helpers/errorUtil.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.errorUtil = void 0;
    var errorUtil;
    (function(errorUtil2) {
      errorUtil2.errToObj = (message) => typeof message === "string" ? { message } : message || {};
      errorUtil2.toString = (message) => typeof message === "string" ? message : message === null || message === void 0 ? void 0 : message.message;
    })(errorUtil || (exports2.errorUtil = errorUtil = {}));
  }
});

// ../../node_modules/.pnpm/zod@3.24.4/node_modules/zod/lib/types.js
var require_types = __commonJS({
  "../../node_modules/.pnpm/zod@3.24.4/node_modules/zod/lib/types.js"(exports2) {
    "use strict";
    var __classPrivateFieldGet = exports2 && exports2.__classPrivateFieldGet || function(receiver, state, kind, f2) {
      if (kind === "a" && !f2) throw new TypeError("Private accessor was defined without a getter");
      if (typeof state === "function" ? receiver !== state || !f2 : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
      return kind === "m" ? f2 : kind === "a" ? f2.call(receiver) : f2 ? f2.value : state.get(receiver);
    };
    var __classPrivateFieldSet = exports2 && exports2.__classPrivateFieldSet || function(receiver, state, value, kind, f2) {
      if (kind === "m") throw new TypeError("Private method is not writable");
      if (kind === "a" && !f2) throw new TypeError("Private accessor was defined without a setter");
      if (typeof state === "function" ? receiver !== state || !f2 : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
      return kind === "a" ? f2.call(receiver, value) : f2 ? f2.value = value : state.set(receiver, value), value;
    };
    var _ZodEnum_cache;
    var _ZodNativeEnum_cache;
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.boolean = exports2.bigint = exports2.array = exports2.any = exports2.coerce = exports2.ZodFirstPartyTypeKind = exports2.late = exports2.ZodSchema = exports2.Schema = exports2.custom = exports2.ZodReadonly = exports2.ZodPipeline = exports2.ZodBranded = exports2.BRAND = exports2.ZodNaN = exports2.ZodCatch = exports2.ZodDefault = exports2.ZodNullable = exports2.ZodOptional = exports2.ZodTransformer = exports2.ZodEffects = exports2.ZodPromise = exports2.ZodNativeEnum = exports2.ZodEnum = exports2.ZodLiteral = exports2.ZodLazy = exports2.ZodFunction = exports2.ZodSet = exports2.ZodMap = exports2.ZodRecord = exports2.ZodTuple = exports2.ZodIntersection = exports2.ZodDiscriminatedUnion = exports2.ZodUnion = exports2.ZodObject = exports2.ZodArray = exports2.ZodVoid = exports2.ZodNever = exports2.ZodUnknown = exports2.ZodAny = exports2.ZodNull = exports2.ZodUndefined = exports2.ZodSymbol = exports2.ZodDate = exports2.ZodBoolean = exports2.ZodBigInt = exports2.ZodNumber = exports2.ZodString = exports2.datetimeRegex = exports2.ZodType = void 0;
    exports2.NEVER = exports2.void = exports2.unknown = exports2.union = exports2.undefined = exports2.tuple = exports2.transformer = exports2.symbol = exports2.string = exports2.strictObject = exports2.set = exports2.record = exports2.promise = exports2.preprocess = exports2.pipeline = exports2.ostring = exports2.optional = exports2.onumber = exports2.oboolean = exports2.object = exports2.number = exports2.nullable = exports2.null = exports2.never = exports2.nativeEnum = exports2.nan = exports2.map = exports2.literal = exports2.lazy = exports2.intersection = exports2.instanceof = exports2.function = exports2.enum = exports2.effect = exports2.discriminatedUnion = exports2.date = void 0;
    var errors_1 = require_errors();
    var errorUtil_1 = require_errorUtil();
    var parseUtil_1 = require_parseUtil();
    var util_1 = require_util();
    var ZodError_1 = require_ZodError();
    var ParseInputLazyPath = class {
      constructor(parent, value, path6, key) {
        this._cachedPath = [];
        this.parent = parent;
        this.data = value;
        this._path = path6;
        this._key = key;
      }
      get path() {
        if (!this._cachedPath.length) {
          if (this._key instanceof Array) {
            this._cachedPath.push(...this._path, ...this._key);
          } else {
            this._cachedPath.push(...this._path, this._key);
          }
        }
        return this._cachedPath;
      }
    };
    var handleResult = (ctx, result) => {
      if ((0, parseUtil_1.isValid)(result)) {
        return { success: true, data: result.value };
      } else {
        if (!ctx.common.issues.length) {
          throw new Error("Validation failed but no issues detected.");
        }
        return {
          success: false,
          get error() {
            if (this._error)
              return this._error;
            const error = new ZodError_1.ZodError(ctx.common.issues);
            this._error = error;
            return this._error;
          }
        };
      }
    };
    function processCreateParams(params) {
      if (!params)
        return {};
      const { errorMap, invalid_type_error, required_error, description } = params;
      if (errorMap && (invalid_type_error || required_error)) {
        throw new Error(`Can't use "invalid_type_error" or "required_error" in conjunction with custom error map.`);
      }
      if (errorMap)
        return { errorMap, description };
      const customMap = (iss, ctx) => {
        var _a, _b;
        const { message } = params;
        if (iss.code === "invalid_enum_value") {
          return { message: message !== null && message !== void 0 ? message : ctx.defaultError };
        }
        if (typeof ctx.data === "undefined") {
          return { message: (_a = message !== null && message !== void 0 ? message : required_error) !== null && _a !== void 0 ? _a : ctx.defaultError };
        }
        if (iss.code !== "invalid_type")
          return { message: ctx.defaultError };
        return { message: (_b = message !== null && message !== void 0 ? message : invalid_type_error) !== null && _b !== void 0 ? _b : ctx.defaultError };
      };
      return { errorMap: customMap, description };
    }
    var ZodType = class {
      get description() {
        return this._def.description;
      }
      _getType(input) {
        return (0, util_1.getParsedType)(input.data);
      }
      _getOrReturnCtx(input, ctx) {
        return ctx || {
          common: input.parent.common,
          data: input.data,
          parsedType: (0, util_1.getParsedType)(input.data),
          schemaErrorMap: this._def.errorMap,
          path: input.path,
          parent: input.parent
        };
      }
      _processInputParams(input) {
        return {
          status: new parseUtil_1.ParseStatus(),
          ctx: {
            common: input.parent.common,
            data: input.data,
            parsedType: (0, util_1.getParsedType)(input.data),
            schemaErrorMap: this._def.errorMap,
            path: input.path,
            parent: input.parent
          }
        };
      }
      _parseSync(input) {
        const result = this._parse(input);
        if ((0, parseUtil_1.isAsync)(result)) {
          throw new Error("Synchronous parse encountered promise.");
        }
        return result;
      }
      _parseAsync(input) {
        const result = this._parse(input);
        return Promise.resolve(result);
      }
      parse(data, params) {
        const result = this.safeParse(data, params);
        if (result.success)
          return result.data;
        throw result.error;
      }
      safeParse(data, params) {
        var _a;
        const ctx = {
          common: {
            issues: [],
            async: (_a = params === null || params === void 0 ? void 0 : params.async) !== null && _a !== void 0 ? _a : false,
            contextualErrorMap: params === null || params === void 0 ? void 0 : params.errorMap
          },
          path: (params === null || params === void 0 ? void 0 : params.path) || [],
          schemaErrorMap: this._def.errorMap,
          parent: null,
          data,
          parsedType: (0, util_1.getParsedType)(data)
        };
        const result = this._parseSync({ data, path: ctx.path, parent: ctx });
        return handleResult(ctx, result);
      }
      "~validate"(data) {
        var _a, _b;
        const ctx = {
          common: {
            issues: [],
            async: !!this["~standard"].async
          },
          path: [],
          schemaErrorMap: this._def.errorMap,
          parent: null,
          data,
          parsedType: (0, util_1.getParsedType)(data)
        };
        if (!this["~standard"].async) {
          try {
            const result = this._parseSync({ data, path: [], parent: ctx });
            return (0, parseUtil_1.isValid)(result) ? {
              value: result.value
            } : {
              issues: ctx.common.issues
            };
          } catch (err) {
            if ((_b = (_a = err === null || err === void 0 ? void 0 : err.message) === null || _a === void 0 ? void 0 : _a.toLowerCase()) === null || _b === void 0 ? void 0 : _b.includes("encountered")) {
              this["~standard"].async = true;
            }
            ctx.common = {
              issues: [],
              async: true
            };
          }
        }
        return this._parseAsync({ data, path: [], parent: ctx }).then((result) => (0, parseUtil_1.isValid)(result) ? {
          value: result.value
        } : {
          issues: ctx.common.issues
        });
      }
      async parseAsync(data, params) {
        const result = await this.safeParseAsync(data, params);
        if (result.success)
          return result.data;
        throw result.error;
      }
      async safeParseAsync(data, params) {
        const ctx = {
          common: {
            issues: [],
            contextualErrorMap: params === null || params === void 0 ? void 0 : params.errorMap,
            async: true
          },
          path: (params === null || params === void 0 ? void 0 : params.path) || [],
          schemaErrorMap: this._def.errorMap,
          parent: null,
          data,
          parsedType: (0, util_1.getParsedType)(data)
        };
        const maybeAsyncResult = this._parse({ data, path: ctx.path, parent: ctx });
        const result = await ((0, parseUtil_1.isAsync)(maybeAsyncResult) ? maybeAsyncResult : Promise.resolve(maybeAsyncResult));
        return handleResult(ctx, result);
      }
      refine(check, message) {
        const getIssueProperties = (val) => {
          if (typeof message === "string" || typeof message === "undefined") {
            return { message };
          } else if (typeof message === "function") {
            return message(val);
          } else {
            return message;
          }
        };
        return this._refinement((val, ctx) => {
          const result = check(val);
          const setError = () => ctx.addIssue({
            code: ZodError_1.ZodIssueCode.custom,
            ...getIssueProperties(val)
          });
          if (typeof Promise !== "undefined" && result instanceof Promise) {
            return result.then((data) => {
              if (!data) {
                setError();
                return false;
              } else {
                return true;
              }
            });
          }
          if (!result) {
            setError();
            return false;
          } else {
            return true;
          }
        });
      }
      refinement(check, refinementData) {
        return this._refinement((val, ctx) => {
          if (!check(val)) {
            ctx.addIssue(typeof refinementData === "function" ? refinementData(val, ctx) : refinementData);
            return false;
          } else {
            return true;
          }
        });
      }
      _refinement(refinement) {
        return new ZodEffects({
          schema: this,
          typeName: ZodFirstPartyTypeKind.ZodEffects,
          effect: { type: "refinement", refinement }
        });
      }
      superRefine(refinement) {
        return this._refinement(refinement);
      }
      constructor(def) {
        this.spa = this.safeParseAsync;
        this._def = def;
        this.parse = this.parse.bind(this);
        this.safeParse = this.safeParse.bind(this);
        this.parseAsync = this.parseAsync.bind(this);
        this.safeParseAsync = this.safeParseAsync.bind(this);
        this.spa = this.spa.bind(this);
        this.refine = this.refine.bind(this);
        this.refinement = this.refinement.bind(this);
        this.superRefine = this.superRefine.bind(this);
        this.optional = this.optional.bind(this);
        this.nullable = this.nullable.bind(this);
        this.nullish = this.nullish.bind(this);
        this.array = this.array.bind(this);
        this.promise = this.promise.bind(this);
        this.or = this.or.bind(this);
        this.and = this.and.bind(this);
        this.transform = this.transform.bind(this);
        this.brand = this.brand.bind(this);
        this.default = this.default.bind(this);
        this.catch = this.catch.bind(this);
        this.describe = this.describe.bind(this);
        this.pipe = this.pipe.bind(this);
        this.readonly = this.readonly.bind(this);
        this.isNullable = this.isNullable.bind(this);
        this.isOptional = this.isOptional.bind(this);
        this["~standard"] = {
          version: 1,
          vendor: "zod",
          validate: (data) => this["~validate"](data)
        };
      }
      optional() {
        return ZodOptional.create(this, this._def);
      }
      nullable() {
        return ZodNullable.create(this, this._def);
      }
      nullish() {
        return this.nullable().optional();
      }
      array() {
        return ZodArray.create(this);
      }
      promise() {
        return ZodPromise.create(this, this._def);
      }
      or(option) {
        return ZodUnion.create([this, option], this._def);
      }
      and(incoming) {
        return ZodIntersection.create(this, incoming, this._def);
      }
      transform(transform) {
        return new ZodEffects({
          ...processCreateParams(this._def),
          schema: this,
          typeName: ZodFirstPartyTypeKind.ZodEffects,
          effect: { type: "transform", transform }
        });
      }
      default(def) {
        const defaultValueFunc = typeof def === "function" ? def : () => def;
        return new ZodDefault({
          ...processCreateParams(this._def),
          innerType: this,
          defaultValue: defaultValueFunc,
          typeName: ZodFirstPartyTypeKind.ZodDefault
        });
      }
      brand() {
        return new ZodBranded({
          typeName: ZodFirstPartyTypeKind.ZodBranded,
          type: this,
          ...processCreateParams(this._def)
        });
      }
      catch(def) {
        const catchValueFunc = typeof def === "function" ? def : () => def;
        return new ZodCatch({
          ...processCreateParams(this._def),
          innerType: this,
          catchValue: catchValueFunc,
          typeName: ZodFirstPartyTypeKind.ZodCatch
        });
      }
      describe(description) {
        const This = this.constructor;
        return new This({
          ...this._def,
          description
        });
      }
      pipe(target) {
        return ZodPipeline.create(this, target);
      }
      readonly() {
        return ZodReadonly.create(this);
      }
      isOptional() {
        return this.safeParse(void 0).success;
      }
      isNullable() {
        return this.safeParse(null).success;
      }
    };
    exports2.ZodType = ZodType;
    exports2.Schema = ZodType;
    exports2.ZodSchema = ZodType;
    var cuidRegex = /^c[^\s-]{8,}$/i;
    var cuid2Regex = /^[0-9a-z]+$/;
    var ulidRegex = /^[0-9A-HJKMNP-TV-Z]{26}$/i;
    var uuidRegex = /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/i;
    var nanoidRegex = /^[a-z0-9_-]{21}$/i;
    var jwtRegex = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/;
    var durationRegex = /^[-+]?P(?!$)(?:(?:[-+]?\d+Y)|(?:[-+]?\d+[.,]\d+Y$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:(?:[-+]?\d+W)|(?:[-+]?\d+[.,]\d+W$))?(?:(?:[-+]?\d+D)|(?:[-+]?\d+[.,]\d+D$))?(?:T(?=[\d+-])(?:(?:[-+]?\d+H)|(?:[-+]?\d+[.,]\d+H$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:[-+]?\d+(?:[.,]\d+)?S)?)??$/;
    var emailRegex = /^(?!\.)(?!.*\.\.)([A-Z0-9_'+\-\.]*)[A-Z0-9_+-]@([A-Z0-9][A-Z0-9\-]*\.)+[A-Z]{2,}$/i;
    var _emojiRegex = `^(\\p{Extended_Pictographic}|\\p{Emoji_Component})+$`;
    var emojiRegex;
    var ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/;
    var ipv4CidrRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/(3[0-2]|[12]?[0-9])$/;
    var ipv6Regex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;
    var ipv6CidrRegex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/;
    var base64Regex = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;
    var base64urlRegex = /^([0-9a-zA-Z-_]{4})*(([0-9a-zA-Z-_]{2}(==)?)|([0-9a-zA-Z-_]{3}(=)?))?$/;
    var dateRegexSource = `((\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-((0[13578]|1[02])-(0[1-9]|[12]\\d|3[01])|(0[469]|11)-(0[1-9]|[12]\\d|30)|(02)-(0[1-9]|1\\d|2[0-8])))`;
    var dateRegex = new RegExp(`^${dateRegexSource}$`);
    function timeRegexSource(args) {
      let secondsRegexSource = `[0-5]\\d`;
      if (args.precision) {
        secondsRegexSource = `${secondsRegexSource}\\.\\d{${args.precision}}`;
      } else if (args.precision == null) {
        secondsRegexSource = `${secondsRegexSource}(\\.\\d+)?`;
      }
      const secondsQuantifier = args.precision ? "+" : "?";
      return `([01]\\d|2[0-3]):[0-5]\\d(:${secondsRegexSource})${secondsQuantifier}`;
    }
    function timeRegex(args) {
      return new RegExp(`^${timeRegexSource(args)}$`);
    }
    function datetimeRegex(args) {
      let regex = `${dateRegexSource}T${timeRegexSource(args)}`;
      const opts = [];
      opts.push(args.local ? `Z?` : `Z`);
      if (args.offset)
        opts.push(`([+-]\\d{2}:?\\d{2})`);
      regex = `${regex}(${opts.join("|")})`;
      return new RegExp(`^${regex}$`);
    }
    exports2.datetimeRegex = datetimeRegex;
    function isValidIP(ip, version) {
      if ((version === "v4" || !version) && ipv4Regex.test(ip)) {
        return true;
      }
      if ((version === "v6" || !version) && ipv6Regex.test(ip)) {
        return true;
      }
      return false;
    }
    function isValidJWT(jwt, alg) {
      if (!jwtRegex.test(jwt))
        return false;
      try {
        const [header] = jwt.split(".");
        const base64 = header.replace(/-/g, "+").replace(/_/g, "/").padEnd(header.length + (4 - header.length % 4) % 4, "=");
        const decoded = JSON.parse(atob(base64));
        if (typeof decoded !== "object" || decoded === null)
          return false;
        if (!decoded.typ || !decoded.alg)
          return false;
        if (alg && decoded.alg !== alg)
          return false;
        return true;
      } catch (_a) {
        return false;
      }
    }
    function isValidCidr(ip, version) {
      if ((version === "v4" || !version) && ipv4CidrRegex.test(ip)) {
        return true;
      }
      if ((version === "v6" || !version) && ipv6CidrRegex.test(ip)) {
        return true;
      }
      return false;
    }
    var ZodString = class _ZodString extends ZodType {
      _parse(input) {
        if (this._def.coerce) {
          input.data = String(input.data);
        }
        const parsedType = this._getType(input);
        if (parsedType !== util_1.ZodParsedType.string) {
          const ctx2 = this._getOrReturnCtx(input);
          (0, parseUtil_1.addIssueToContext)(ctx2, {
            code: ZodError_1.ZodIssueCode.invalid_type,
            expected: util_1.ZodParsedType.string,
            received: ctx2.parsedType
          });
          return parseUtil_1.INVALID;
        }
        const status = new parseUtil_1.ParseStatus();
        let ctx = void 0;
        for (const check of this._def.checks) {
          if (check.kind === "min") {
            if (input.data.length < check.value) {
              ctx = this._getOrReturnCtx(input, ctx);
              (0, parseUtil_1.addIssueToContext)(ctx, {
                code: ZodError_1.ZodIssueCode.too_small,
                minimum: check.value,
                type: "string",
                inclusive: true,
                exact: false,
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "max") {
            if (input.data.length > check.value) {
              ctx = this._getOrReturnCtx(input, ctx);
              (0, parseUtil_1.addIssueToContext)(ctx, {
                code: ZodError_1.ZodIssueCode.too_big,
                maximum: check.value,
                type: "string",
                inclusive: true,
                exact: false,
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "length") {
            const tooBig = input.data.length > check.value;
            const tooSmall = input.data.length < check.value;
            if (tooBig || tooSmall) {
              ctx = this._getOrReturnCtx(input, ctx);
              if (tooBig) {
                (0, parseUtil_1.addIssueToContext)(ctx, {
                  code: ZodError_1.ZodIssueCode.too_big,
                  maximum: check.value,
                  type: "string",
                  inclusive: true,
                  exact: true,
                  message: check.message
                });
              } else if (tooSmall) {
                (0, parseUtil_1.addIssueToContext)(ctx, {
                  code: ZodError_1.ZodIssueCode.too_small,
                  minimum: check.value,
                  type: "string",
                  inclusive: true,
                  exact: true,
                  message: check.message
                });
              }
              status.dirty();
            }
          } else if (check.kind === "email") {
            if (!emailRegex.test(input.data)) {
              ctx = this._getOrReturnCtx(input, ctx);
              (0, parseUtil_1.addIssueToContext)(ctx, {
                validation: "email",
                code: ZodError_1.ZodIssueCode.invalid_string,
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "emoji") {
            if (!emojiRegex) {
              emojiRegex = new RegExp(_emojiRegex, "u");
            }
            if (!emojiRegex.test(input.data)) {
              ctx = this._getOrReturnCtx(input, ctx);
              (0, parseUtil_1.addIssueToContext)(ctx, {
                validation: "emoji",
                code: ZodError_1.ZodIssueCode.invalid_string,
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "uuid") {
            if (!uuidRegex.test(input.data)) {
              ctx = this._getOrReturnCtx(input, ctx);
              (0, parseUtil_1.addIssueToContext)(ctx, {
                validation: "uuid",
                code: ZodError_1.ZodIssueCode.invalid_string,
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "nanoid") {
            if (!nanoidRegex.test(input.data)) {
              ctx = this._getOrReturnCtx(input, ctx);
              (0, parseUtil_1.addIssueToContext)(ctx, {
                validation: "nanoid",
                code: ZodError_1.ZodIssueCode.invalid_string,
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "cuid") {
            if (!cuidRegex.test(input.data)) {
              ctx = this._getOrReturnCtx(input, ctx);
              (0, parseUtil_1.addIssueToContext)(ctx, {
                validation: "cuid",
                code: ZodError_1.ZodIssueCode.invalid_string,
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "cuid2") {
            if (!cuid2Regex.test(input.data)) {
              ctx = this._getOrReturnCtx(input, ctx);
              (0, parseUtil_1.addIssueToContext)(ctx, {
                validation: "cuid2",
                code: ZodError_1.ZodIssueCode.invalid_string,
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "ulid") {
            if (!ulidRegex.test(input.data)) {
              ctx = this._getOrReturnCtx(input, ctx);
              (0, parseUtil_1.addIssueToContext)(ctx, {
                validation: "ulid",
                code: ZodError_1.ZodIssueCode.invalid_string,
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "url") {
            try {
              new URL(input.data);
            } catch (_a) {
              ctx = this._getOrReturnCtx(input, ctx);
              (0, parseUtil_1.addIssueToContext)(ctx, {
                validation: "url",
                code: ZodError_1.ZodIssueCode.invalid_string,
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "regex") {
            check.regex.lastIndex = 0;
            const testResult = check.regex.test(input.data);
            if (!testResult) {
              ctx = this._getOrReturnCtx(input, ctx);
              (0, parseUtil_1.addIssueToContext)(ctx, {
                validation: "regex",
                code: ZodError_1.ZodIssueCode.invalid_string,
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "trim") {
            input.data = input.data.trim();
          } else if (check.kind === "includes") {
            if (!input.data.includes(check.value, check.position)) {
              ctx = this._getOrReturnCtx(input, ctx);
              (0, parseUtil_1.addIssueToContext)(ctx, {
                code: ZodError_1.ZodIssueCode.invalid_string,
                validation: { includes: check.value, position: check.position },
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "toLowerCase") {
            input.data = input.data.toLowerCase();
          } else if (check.kind === "toUpperCase") {
            input.data = input.data.toUpperCase();
          } else if (check.kind === "startsWith") {
            if (!input.data.startsWith(check.value)) {
              ctx = this._getOrReturnCtx(input, ctx);
              (0, parseUtil_1.addIssueToContext)(ctx, {
                code: ZodError_1.ZodIssueCode.invalid_string,
                validation: { startsWith: check.value },
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "endsWith") {
            if (!input.data.endsWith(check.value)) {
              ctx = this._getOrReturnCtx(input, ctx);
              (0, parseUtil_1.addIssueToContext)(ctx, {
                code: ZodError_1.ZodIssueCode.invalid_string,
                validation: { endsWith: check.value },
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "datetime") {
            const regex = datetimeRegex(check);
            if (!regex.test(input.data)) {
              ctx = this._getOrReturnCtx(input, ctx);
              (0, parseUtil_1.addIssueToContext)(ctx, {
                code: ZodError_1.ZodIssueCode.invalid_string,
                validation: "datetime",
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "date") {
            const regex = dateRegex;
            if (!regex.test(input.data)) {
              ctx = this._getOrReturnCtx(input, ctx);
              (0, parseUtil_1.addIssueToContext)(ctx, {
                code: ZodError_1.ZodIssueCode.invalid_string,
                validation: "date",
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "time") {
            const regex = timeRegex(check);
            if (!regex.test(input.data)) {
              ctx = this._getOrReturnCtx(input, ctx);
              (0, parseUtil_1.addIssueToContext)(ctx, {
                code: ZodError_1.ZodIssueCode.invalid_string,
                validation: "time",
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "duration") {
            if (!durationRegex.test(input.data)) {
              ctx = this._getOrReturnCtx(input, ctx);
              (0, parseUtil_1.addIssueToContext)(ctx, {
                validation: "duration",
                code: ZodError_1.ZodIssueCode.invalid_string,
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "ip") {
            if (!isValidIP(input.data, check.version)) {
              ctx = this._getOrReturnCtx(input, ctx);
              (0, parseUtil_1.addIssueToContext)(ctx, {
                validation: "ip",
                code: ZodError_1.ZodIssueCode.invalid_string,
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "jwt") {
            if (!isValidJWT(input.data, check.alg)) {
              ctx = this._getOrReturnCtx(input, ctx);
              (0, parseUtil_1.addIssueToContext)(ctx, {
                validation: "jwt",
                code: ZodError_1.ZodIssueCode.invalid_string,
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "cidr") {
            if (!isValidCidr(input.data, check.version)) {
              ctx = this._getOrReturnCtx(input, ctx);
              (0, parseUtil_1.addIssueToContext)(ctx, {
                validation: "cidr",
                code: ZodError_1.ZodIssueCode.invalid_string,
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "base64") {
            if (!base64Regex.test(input.data)) {
              ctx = this._getOrReturnCtx(input, ctx);
              (0, parseUtil_1.addIssueToContext)(ctx, {
                validation: "base64",
                code: ZodError_1.ZodIssueCode.invalid_string,
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "base64url") {
            if (!base64urlRegex.test(input.data)) {
              ctx = this._getOrReturnCtx(input, ctx);
              (0, parseUtil_1.addIssueToContext)(ctx, {
                validation: "base64url",
                code: ZodError_1.ZodIssueCode.invalid_string,
                message: check.message
              });
              status.dirty();
            }
          } else {
            util_1.util.assertNever(check);
          }
        }
        return { status: status.value, value: input.data };
      }
      _regex(regex, validation, message) {
        return this.refinement((data) => regex.test(data), {
          validation,
          code: ZodError_1.ZodIssueCode.invalid_string,
          ...errorUtil_1.errorUtil.errToObj(message)
        });
      }
      _addCheck(check) {
        return new _ZodString({
          ...this._def,
          checks: [...this._def.checks, check]
        });
      }
      email(message) {
        return this._addCheck({ kind: "email", ...errorUtil_1.errorUtil.errToObj(message) });
      }
      url(message) {
        return this._addCheck({ kind: "url", ...errorUtil_1.errorUtil.errToObj(message) });
      }
      emoji(message) {
        return this._addCheck({ kind: "emoji", ...errorUtil_1.errorUtil.errToObj(message) });
      }
      uuid(message) {
        return this._addCheck({ kind: "uuid", ...errorUtil_1.errorUtil.errToObj(message) });
      }
      nanoid(message) {
        return this._addCheck({ kind: "nanoid", ...errorUtil_1.errorUtil.errToObj(message) });
      }
      cuid(message) {
        return this._addCheck({ kind: "cuid", ...errorUtil_1.errorUtil.errToObj(message) });
      }
      cuid2(message) {
        return this._addCheck({ kind: "cuid2", ...errorUtil_1.errorUtil.errToObj(message) });
      }
      ulid(message) {
        return this._addCheck({ kind: "ulid", ...errorUtil_1.errorUtil.errToObj(message) });
      }
      base64(message) {
        return this._addCheck({ kind: "base64", ...errorUtil_1.errorUtil.errToObj(message) });
      }
      base64url(message) {
        return this._addCheck({
          kind: "base64url",
          ...errorUtil_1.errorUtil.errToObj(message)
        });
      }
      jwt(options) {
        return this._addCheck({ kind: "jwt", ...errorUtil_1.errorUtil.errToObj(options) });
      }
      ip(options) {
        return this._addCheck({ kind: "ip", ...errorUtil_1.errorUtil.errToObj(options) });
      }
      cidr(options) {
        return this._addCheck({ kind: "cidr", ...errorUtil_1.errorUtil.errToObj(options) });
      }
      datetime(options) {
        var _a, _b;
        if (typeof options === "string") {
          return this._addCheck({
            kind: "datetime",
            precision: null,
            offset: false,
            local: false,
            message: options
          });
        }
        return this._addCheck({
          kind: "datetime",
          precision: typeof (options === null || options === void 0 ? void 0 : options.precision) === "undefined" ? null : options === null || options === void 0 ? void 0 : options.precision,
          offset: (_a = options === null || options === void 0 ? void 0 : options.offset) !== null && _a !== void 0 ? _a : false,
          local: (_b = options === null || options === void 0 ? void 0 : options.local) !== null && _b !== void 0 ? _b : false,
          ...errorUtil_1.errorUtil.errToObj(options === null || options === void 0 ? void 0 : options.message)
        });
      }
      date(message) {
        return this._addCheck({ kind: "date", message });
      }
      time(options) {
        if (typeof options === "string") {
          return this._addCheck({
            kind: "time",
            precision: null,
            message: options
          });
        }
        return this._addCheck({
          kind: "time",
          precision: typeof (options === null || options === void 0 ? void 0 : options.precision) === "undefined" ? null : options === null || options === void 0 ? void 0 : options.precision,
          ...errorUtil_1.errorUtil.errToObj(options === null || options === void 0 ? void 0 : options.message)
        });
      }
      duration(message) {
        return this._addCheck({ kind: "duration", ...errorUtil_1.errorUtil.errToObj(message) });
      }
      regex(regex, message) {
        return this._addCheck({
          kind: "regex",
          regex,
          ...errorUtil_1.errorUtil.errToObj(message)
        });
      }
      includes(value, options) {
        return this._addCheck({
          kind: "includes",
          value,
          position: options === null || options === void 0 ? void 0 : options.position,
          ...errorUtil_1.errorUtil.errToObj(options === null || options === void 0 ? void 0 : options.message)
        });
      }
      startsWith(value, message) {
        return this._addCheck({
          kind: "startsWith",
          value,
          ...errorUtil_1.errorUtil.errToObj(message)
        });
      }
      endsWith(value, message) {
        return this._addCheck({
          kind: "endsWith",
          value,
          ...errorUtil_1.errorUtil.errToObj(message)
        });
      }
      min(minLength, message) {
        return this._addCheck({
          kind: "min",
          value: minLength,
          ...errorUtil_1.errorUtil.errToObj(message)
        });
      }
      max(maxLength, message) {
        return this._addCheck({
          kind: "max",
          value: maxLength,
          ...errorUtil_1.errorUtil.errToObj(message)
        });
      }
      length(len, message) {
        return this._addCheck({
          kind: "length",
          value: len,
          ...errorUtil_1.errorUtil.errToObj(message)
        });
      }
      /**
       * Equivalent to `.min(1)`
       */
      nonempty(message) {
        return this.min(1, errorUtil_1.errorUtil.errToObj(message));
      }
      trim() {
        return new _ZodString({
          ...this._def,
          checks: [...this._def.checks, { kind: "trim" }]
        });
      }
      toLowerCase() {
        return new _ZodString({
          ...this._def,
          checks: [...this._def.checks, { kind: "toLowerCase" }]
        });
      }
      toUpperCase() {
        return new _ZodString({
          ...this._def,
          checks: [...this._def.checks, { kind: "toUpperCase" }]
        });
      }
      get isDatetime() {
        return !!this._def.checks.find((ch) => ch.kind === "datetime");
      }
      get isDate() {
        return !!this._def.checks.find((ch) => ch.kind === "date");
      }
      get isTime() {
        return !!this._def.checks.find((ch) => ch.kind === "time");
      }
      get isDuration() {
        return !!this._def.checks.find((ch) => ch.kind === "duration");
      }
      get isEmail() {
        return !!this._def.checks.find((ch) => ch.kind === "email");
      }
      get isURL() {
        return !!this._def.checks.find((ch) => ch.kind === "url");
      }
      get isEmoji() {
        return !!this._def.checks.find((ch) => ch.kind === "emoji");
      }
      get isUUID() {
        return !!this._def.checks.find((ch) => ch.kind === "uuid");
      }
      get isNANOID() {
        return !!this._def.checks.find((ch) => ch.kind === "nanoid");
      }
      get isCUID() {
        return !!this._def.checks.find((ch) => ch.kind === "cuid");
      }
      get isCUID2() {
        return !!this._def.checks.find((ch) => ch.kind === "cuid2");
      }
      get isULID() {
        return !!this._def.checks.find((ch) => ch.kind === "ulid");
      }
      get isIP() {
        return !!this._def.checks.find((ch) => ch.kind === "ip");
      }
      get isCIDR() {
        return !!this._def.checks.find((ch) => ch.kind === "cidr");
      }
      get isBase64() {
        return !!this._def.checks.find((ch) => ch.kind === "base64");
      }
      get isBase64url() {
        return !!this._def.checks.find((ch) => ch.kind === "base64url");
      }
      get minLength() {
        let min = null;
        for (const ch of this._def.checks) {
          if (ch.kind === "min") {
            if (min === null || ch.value > min)
              min = ch.value;
          }
        }
        return min;
      }
      get maxLength() {
        let max = null;
        for (const ch of this._def.checks) {
          if (ch.kind === "max") {
            if (max === null || ch.value < max)
              max = ch.value;
          }
        }
        return max;
      }
    };
    exports2.ZodString = ZodString;
    ZodString.create = (params) => {
      var _a;
      return new ZodString({
        checks: [],
        typeName: ZodFirstPartyTypeKind.ZodString,
        coerce: (_a = params === null || params === void 0 ? void 0 : params.coerce) !== null && _a !== void 0 ? _a : false,
        ...processCreateParams(params)
      });
    };
    function floatSafeRemainder(val, step) {
      const valDecCount = (val.toString().split(".")[1] || "").length;
      const stepDecCount = (step.toString().split(".")[1] || "").length;
      const decCount = valDecCount > stepDecCount ? valDecCount : stepDecCount;
      const valInt = parseInt(val.toFixed(decCount).replace(".", ""));
      const stepInt = parseInt(step.toFixed(decCount).replace(".", ""));
      return valInt % stepInt / Math.pow(10, decCount);
    }
    var ZodNumber = class _ZodNumber extends ZodType {
      constructor() {
        super(...arguments);
        this.min = this.gte;
        this.max = this.lte;
        this.step = this.multipleOf;
      }
      _parse(input) {
        if (this._def.coerce) {
          input.data = Number(input.data);
        }
        const parsedType = this._getType(input);
        if (parsedType !== util_1.ZodParsedType.number) {
          const ctx2 = this._getOrReturnCtx(input);
          (0, parseUtil_1.addIssueToContext)(ctx2, {
            code: ZodError_1.ZodIssueCode.invalid_type,
            expected: util_1.ZodParsedType.number,
            received: ctx2.parsedType
          });
          return parseUtil_1.INVALID;
        }
        let ctx = void 0;
        const status = new parseUtil_1.ParseStatus();
        for (const check of this._def.checks) {
          if (check.kind === "int") {
            if (!util_1.util.isInteger(input.data)) {
              ctx = this._getOrReturnCtx(input, ctx);
              (0, parseUtil_1.addIssueToContext)(ctx, {
                code: ZodError_1.ZodIssueCode.invalid_type,
                expected: "integer",
                received: "float",
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "min") {
            const tooSmall = check.inclusive ? input.data < check.value : input.data <= check.value;
            if (tooSmall) {
              ctx = this._getOrReturnCtx(input, ctx);
              (0, parseUtil_1.addIssueToContext)(ctx, {
                code: ZodError_1.ZodIssueCode.too_small,
                minimum: check.value,
                type: "number",
                inclusive: check.inclusive,
                exact: false,
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "max") {
            const tooBig = check.inclusive ? input.data > check.value : input.data >= check.value;
            if (tooBig) {
              ctx = this._getOrReturnCtx(input, ctx);
              (0, parseUtil_1.addIssueToContext)(ctx, {
                code: ZodError_1.ZodIssueCode.too_big,
                maximum: check.value,
                type: "number",
                inclusive: check.inclusive,
                exact: false,
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "multipleOf") {
            if (floatSafeRemainder(input.data, check.value) !== 0) {
              ctx = this._getOrReturnCtx(input, ctx);
              (0, parseUtil_1.addIssueToContext)(ctx, {
                code: ZodError_1.ZodIssueCode.not_multiple_of,
                multipleOf: check.value,
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "finite") {
            if (!Number.isFinite(input.data)) {
              ctx = this._getOrReturnCtx(input, ctx);
              (0, parseUtil_1.addIssueToContext)(ctx, {
                code: ZodError_1.ZodIssueCode.not_finite,
                message: check.message
              });
              status.dirty();
            }
          } else {
            util_1.util.assertNever(check);
          }
        }
        return { status: status.value, value: input.data };
      }
      gte(value, message) {
        return this.setLimit("min", value, true, errorUtil_1.errorUtil.toString(message));
      }
      gt(value, message) {
        return this.setLimit("min", value, false, errorUtil_1.errorUtil.toString(message));
      }
      lte(value, message) {
        return this.setLimit("max", value, true, errorUtil_1.errorUtil.toString(message));
      }
      lt(value, message) {
        return this.setLimit("max", value, false, errorUtil_1.errorUtil.toString(message));
      }
      setLimit(kind, value, inclusive, message) {
        return new _ZodNumber({
          ...this._def,
          checks: [
            ...this._def.checks,
            {
              kind,
              value,
              inclusive,
              message: errorUtil_1.errorUtil.toString(message)
            }
          ]
        });
      }
      _addCheck(check) {
        return new _ZodNumber({
          ...this._def,
          checks: [...this._def.checks, check]
        });
      }
      int(message) {
        return this._addCheck({
          kind: "int",
          message: errorUtil_1.errorUtil.toString(message)
        });
      }
      positive(message) {
        return this._addCheck({
          kind: "min",
          value: 0,
          inclusive: false,
          message: errorUtil_1.errorUtil.toString(message)
        });
      }
      negative(message) {
        return this._addCheck({
          kind: "max",
          value: 0,
          inclusive: false,
          message: errorUtil_1.errorUtil.toString(message)
        });
      }
      nonpositive(message) {
        return this._addCheck({
          kind: "max",
          value: 0,
          inclusive: true,
          message: errorUtil_1.errorUtil.toString(message)
        });
      }
      nonnegative(message) {
        return this._addCheck({
          kind: "min",
          value: 0,
          inclusive: true,
          message: errorUtil_1.errorUtil.toString(message)
        });
      }
      multipleOf(value, message) {
        return this._addCheck({
          kind: "multipleOf",
          value,
          message: errorUtil_1.errorUtil.toString(message)
        });
      }
      finite(message) {
        return this._addCheck({
          kind: "finite",
          message: errorUtil_1.errorUtil.toString(message)
        });
      }
      safe(message) {
        return this._addCheck({
          kind: "min",
          inclusive: true,
          value: Number.MIN_SAFE_INTEGER,
          message: errorUtil_1.errorUtil.toString(message)
        })._addCheck({
          kind: "max",
          inclusive: true,
          value: Number.MAX_SAFE_INTEGER,
          message: errorUtil_1.errorUtil.toString(message)
        });
      }
      get minValue() {
        let min = null;
        for (const ch of this._def.checks) {
          if (ch.kind === "min") {
            if (min === null || ch.value > min)
              min = ch.value;
          }
        }
        return min;
      }
      get maxValue() {
        let max = null;
        for (const ch of this._def.checks) {
          if (ch.kind === "max") {
            if (max === null || ch.value < max)
              max = ch.value;
          }
        }
        return max;
      }
      get isInt() {
        return !!this._def.checks.find((ch) => ch.kind === "int" || ch.kind === "multipleOf" && util_1.util.isInteger(ch.value));
      }
      get isFinite() {
        let max = null, min = null;
        for (const ch of this._def.checks) {
          if (ch.kind === "finite" || ch.kind === "int" || ch.kind === "multipleOf") {
            return true;
          } else if (ch.kind === "min") {
            if (min === null || ch.value > min)
              min = ch.value;
          } else if (ch.kind === "max") {
            if (max === null || ch.value < max)
              max = ch.value;
          }
        }
        return Number.isFinite(min) && Number.isFinite(max);
      }
    };
    exports2.ZodNumber = ZodNumber;
    ZodNumber.create = (params) => {
      return new ZodNumber({
        checks: [],
        typeName: ZodFirstPartyTypeKind.ZodNumber,
        coerce: (params === null || params === void 0 ? void 0 : params.coerce) || false,
        ...processCreateParams(params)
      });
    };
    var ZodBigInt = class _ZodBigInt extends ZodType {
      constructor() {
        super(...arguments);
        this.min = this.gte;
        this.max = this.lte;
      }
      _parse(input) {
        if (this._def.coerce) {
          try {
            input.data = BigInt(input.data);
          } catch (_a) {
            return this._getInvalidInput(input);
          }
        }
        const parsedType = this._getType(input);
        if (parsedType !== util_1.ZodParsedType.bigint) {
          return this._getInvalidInput(input);
        }
        let ctx = void 0;
        const status = new parseUtil_1.ParseStatus();
        for (const check of this._def.checks) {
          if (check.kind === "min") {
            const tooSmall = check.inclusive ? input.data < check.value : input.data <= check.value;
            if (tooSmall) {
              ctx = this._getOrReturnCtx(input, ctx);
              (0, parseUtil_1.addIssueToContext)(ctx, {
                code: ZodError_1.ZodIssueCode.too_small,
                type: "bigint",
                minimum: check.value,
                inclusive: check.inclusive,
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "max") {
            const tooBig = check.inclusive ? input.data > check.value : input.data >= check.value;
            if (tooBig) {
              ctx = this._getOrReturnCtx(input, ctx);
              (0, parseUtil_1.addIssueToContext)(ctx, {
                code: ZodError_1.ZodIssueCode.too_big,
                type: "bigint",
                maximum: check.value,
                inclusive: check.inclusive,
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "multipleOf") {
            if (input.data % check.value !== BigInt(0)) {
              ctx = this._getOrReturnCtx(input, ctx);
              (0, parseUtil_1.addIssueToContext)(ctx, {
                code: ZodError_1.ZodIssueCode.not_multiple_of,
                multipleOf: check.value,
                message: check.message
              });
              status.dirty();
            }
          } else {
            util_1.util.assertNever(check);
          }
        }
        return { status: status.value, value: input.data };
      }
      _getInvalidInput(input) {
        const ctx = this._getOrReturnCtx(input);
        (0, parseUtil_1.addIssueToContext)(ctx, {
          code: ZodError_1.ZodIssueCode.invalid_type,
          expected: util_1.ZodParsedType.bigint,
          received: ctx.parsedType
        });
        return parseUtil_1.INVALID;
      }
      gte(value, message) {
        return this.setLimit("min", value, true, errorUtil_1.errorUtil.toString(message));
      }
      gt(value, message) {
        return this.setLimit("min", value, false, errorUtil_1.errorUtil.toString(message));
      }
      lte(value, message) {
        return this.setLimit("max", value, true, errorUtil_1.errorUtil.toString(message));
      }
      lt(value, message) {
        return this.setLimit("max", value, false, errorUtil_1.errorUtil.toString(message));
      }
      setLimit(kind, value, inclusive, message) {
        return new _ZodBigInt({
          ...this._def,
          checks: [
            ...this._def.checks,
            {
              kind,
              value,
              inclusive,
              message: errorUtil_1.errorUtil.toString(message)
            }
          ]
        });
      }
      _addCheck(check) {
        return new _ZodBigInt({
          ...this._def,
          checks: [...this._def.checks, check]
        });
      }
      positive(message) {
        return this._addCheck({
          kind: "min",
          value: BigInt(0),
          inclusive: false,
          message: errorUtil_1.errorUtil.toString(message)
        });
      }
      negative(message) {
        return this._addCheck({
          kind: "max",
          value: BigInt(0),
          inclusive: false,
          message: errorUtil_1.errorUtil.toString(message)
        });
      }
      nonpositive(message) {
        return this._addCheck({
          kind: "max",
          value: BigInt(0),
          inclusive: true,
          message: errorUtil_1.errorUtil.toString(message)
        });
      }
      nonnegative(message) {
        return this._addCheck({
          kind: "min",
          value: BigInt(0),
          inclusive: true,
          message: errorUtil_1.errorUtil.toString(message)
        });
      }
      multipleOf(value, message) {
        return this._addCheck({
          kind: "multipleOf",
          value,
          message: errorUtil_1.errorUtil.toString(message)
        });
      }
      get minValue() {
        let min = null;
        for (const ch of this._def.checks) {
          if (ch.kind === "min") {
            if (min === null || ch.value > min)
              min = ch.value;
          }
        }
        return min;
      }
      get maxValue() {
        let max = null;
        for (const ch of this._def.checks) {
          if (ch.kind === "max") {
            if (max === null || ch.value < max)
              max = ch.value;
          }
        }
        return max;
      }
    };
    exports2.ZodBigInt = ZodBigInt;
    ZodBigInt.create = (params) => {
      var _a;
      return new ZodBigInt({
        checks: [],
        typeName: ZodFirstPartyTypeKind.ZodBigInt,
        coerce: (_a = params === null || params === void 0 ? void 0 : params.coerce) !== null && _a !== void 0 ? _a : false,
        ...processCreateParams(params)
      });
    };
    var ZodBoolean = class extends ZodType {
      _parse(input) {
        if (this._def.coerce) {
          input.data = Boolean(input.data);
        }
        const parsedType = this._getType(input);
        if (parsedType !== util_1.ZodParsedType.boolean) {
          const ctx = this._getOrReturnCtx(input);
          (0, parseUtil_1.addIssueToContext)(ctx, {
            code: ZodError_1.ZodIssueCode.invalid_type,
            expected: util_1.ZodParsedType.boolean,
            received: ctx.parsedType
          });
          return parseUtil_1.INVALID;
        }
        return (0, parseUtil_1.OK)(input.data);
      }
    };
    exports2.ZodBoolean = ZodBoolean;
    ZodBoolean.create = (params) => {
      return new ZodBoolean({
        typeName: ZodFirstPartyTypeKind.ZodBoolean,
        coerce: (params === null || params === void 0 ? void 0 : params.coerce) || false,
        ...processCreateParams(params)
      });
    };
    var ZodDate = class _ZodDate extends ZodType {
      _parse(input) {
        if (this._def.coerce) {
          input.data = new Date(input.data);
        }
        const parsedType = this._getType(input);
        if (parsedType !== util_1.ZodParsedType.date) {
          const ctx2 = this._getOrReturnCtx(input);
          (0, parseUtil_1.addIssueToContext)(ctx2, {
            code: ZodError_1.ZodIssueCode.invalid_type,
            expected: util_1.ZodParsedType.date,
            received: ctx2.parsedType
          });
          return parseUtil_1.INVALID;
        }
        if (isNaN(input.data.getTime())) {
          const ctx2 = this._getOrReturnCtx(input);
          (0, parseUtil_1.addIssueToContext)(ctx2, {
            code: ZodError_1.ZodIssueCode.invalid_date
          });
          return parseUtil_1.INVALID;
        }
        const status = new parseUtil_1.ParseStatus();
        let ctx = void 0;
        for (const check of this._def.checks) {
          if (check.kind === "min") {
            if (input.data.getTime() < check.value) {
              ctx = this._getOrReturnCtx(input, ctx);
              (0, parseUtil_1.addIssueToContext)(ctx, {
                code: ZodError_1.ZodIssueCode.too_small,
                message: check.message,
                inclusive: true,
                exact: false,
                minimum: check.value,
                type: "date"
              });
              status.dirty();
            }
          } else if (check.kind === "max") {
            if (input.data.getTime() > check.value) {
              ctx = this._getOrReturnCtx(input, ctx);
              (0, parseUtil_1.addIssueToContext)(ctx, {
                code: ZodError_1.ZodIssueCode.too_big,
                message: check.message,
                inclusive: true,
                exact: false,
                maximum: check.value,
                type: "date"
              });
              status.dirty();
            }
          } else {
            util_1.util.assertNever(check);
          }
        }
        return {
          status: status.value,
          value: new Date(input.data.getTime())
        };
      }
      _addCheck(check) {
        return new _ZodDate({
          ...this._def,
          checks: [...this._def.checks, check]
        });
      }
      min(minDate, message) {
        return this._addCheck({
          kind: "min",
          value: minDate.getTime(),
          message: errorUtil_1.errorUtil.toString(message)
        });
      }
      max(maxDate, message) {
        return this._addCheck({
          kind: "max",
          value: maxDate.getTime(),
          message: errorUtil_1.errorUtil.toString(message)
        });
      }
      get minDate() {
        let min = null;
        for (const ch of this._def.checks) {
          if (ch.kind === "min") {
            if (min === null || ch.value > min)
              min = ch.value;
          }
        }
        return min != null ? new Date(min) : null;
      }
      get maxDate() {
        let max = null;
        for (const ch of this._def.checks) {
          if (ch.kind === "max") {
            if (max === null || ch.value < max)
              max = ch.value;
          }
        }
        return max != null ? new Date(max) : null;
      }
    };
    exports2.ZodDate = ZodDate;
    ZodDate.create = (params) => {
      return new ZodDate({
        checks: [],
        coerce: (params === null || params === void 0 ? void 0 : params.coerce) || false,
        typeName: ZodFirstPartyTypeKind.ZodDate,
        ...processCreateParams(params)
      });
    };
    var ZodSymbol = class extends ZodType {
      _parse(input) {
        const parsedType = this._getType(input);
        if (parsedType !== util_1.ZodParsedType.symbol) {
          const ctx = this._getOrReturnCtx(input);
          (0, parseUtil_1.addIssueToContext)(ctx, {
            code: ZodError_1.ZodIssueCode.invalid_type,
            expected: util_1.ZodParsedType.symbol,
            received: ctx.parsedType
          });
          return parseUtil_1.INVALID;
        }
        return (0, parseUtil_1.OK)(input.data);
      }
    };
    exports2.ZodSymbol = ZodSymbol;
    ZodSymbol.create = (params) => {
      return new ZodSymbol({
        typeName: ZodFirstPartyTypeKind.ZodSymbol,
        ...processCreateParams(params)
      });
    };
    var ZodUndefined = class extends ZodType {
      _parse(input) {
        const parsedType = this._getType(input);
        if (parsedType !== util_1.ZodParsedType.undefined) {
          const ctx = this._getOrReturnCtx(input);
          (0, parseUtil_1.addIssueToContext)(ctx, {
            code: ZodError_1.ZodIssueCode.invalid_type,
            expected: util_1.ZodParsedType.undefined,
            received: ctx.parsedType
          });
          return parseUtil_1.INVALID;
        }
        return (0, parseUtil_1.OK)(input.data);
      }
    };
    exports2.ZodUndefined = ZodUndefined;
    ZodUndefined.create = (params) => {
      return new ZodUndefined({
        typeName: ZodFirstPartyTypeKind.ZodUndefined,
        ...processCreateParams(params)
      });
    };
    var ZodNull = class extends ZodType {
      _parse(input) {
        const parsedType = this._getType(input);
        if (parsedType !== util_1.ZodParsedType.null) {
          const ctx = this._getOrReturnCtx(input);
          (0, parseUtil_1.addIssueToContext)(ctx, {
            code: ZodError_1.ZodIssueCode.invalid_type,
            expected: util_1.ZodParsedType.null,
            received: ctx.parsedType
          });
          return parseUtil_1.INVALID;
        }
        return (0, parseUtil_1.OK)(input.data);
      }
    };
    exports2.ZodNull = ZodNull;
    ZodNull.create = (params) => {
      return new ZodNull({
        typeName: ZodFirstPartyTypeKind.ZodNull,
        ...processCreateParams(params)
      });
    };
    var ZodAny = class extends ZodType {
      constructor() {
        super(...arguments);
        this._any = true;
      }
      _parse(input) {
        return (0, parseUtil_1.OK)(input.data);
      }
    };
    exports2.ZodAny = ZodAny;
    ZodAny.create = (params) => {
      return new ZodAny({
        typeName: ZodFirstPartyTypeKind.ZodAny,
        ...processCreateParams(params)
      });
    };
    var ZodUnknown = class extends ZodType {
      constructor() {
        super(...arguments);
        this._unknown = true;
      }
      _parse(input) {
        return (0, parseUtil_1.OK)(input.data);
      }
    };
    exports2.ZodUnknown = ZodUnknown;
    ZodUnknown.create = (params) => {
      return new ZodUnknown({
        typeName: ZodFirstPartyTypeKind.ZodUnknown,
        ...processCreateParams(params)
      });
    };
    var ZodNever = class extends ZodType {
      _parse(input) {
        const ctx = this._getOrReturnCtx(input);
        (0, parseUtil_1.addIssueToContext)(ctx, {
          code: ZodError_1.ZodIssueCode.invalid_type,
          expected: util_1.ZodParsedType.never,
          received: ctx.parsedType
        });
        return parseUtil_1.INVALID;
      }
    };
    exports2.ZodNever = ZodNever;
    ZodNever.create = (params) => {
      return new ZodNever({
        typeName: ZodFirstPartyTypeKind.ZodNever,
        ...processCreateParams(params)
      });
    };
    var ZodVoid = class extends ZodType {
      _parse(input) {
        const parsedType = this._getType(input);
        if (parsedType !== util_1.ZodParsedType.undefined) {
          const ctx = this._getOrReturnCtx(input);
          (0, parseUtil_1.addIssueToContext)(ctx, {
            code: ZodError_1.ZodIssueCode.invalid_type,
            expected: util_1.ZodParsedType.void,
            received: ctx.parsedType
          });
          return parseUtil_1.INVALID;
        }
        return (0, parseUtil_1.OK)(input.data);
      }
    };
    exports2.ZodVoid = ZodVoid;
    ZodVoid.create = (params) => {
      return new ZodVoid({
        typeName: ZodFirstPartyTypeKind.ZodVoid,
        ...processCreateParams(params)
      });
    };
    var ZodArray = class _ZodArray extends ZodType {
      _parse(input) {
        const { ctx, status } = this._processInputParams(input);
        const def = this._def;
        if (ctx.parsedType !== util_1.ZodParsedType.array) {
          (0, parseUtil_1.addIssueToContext)(ctx, {
            code: ZodError_1.ZodIssueCode.invalid_type,
            expected: util_1.ZodParsedType.array,
            received: ctx.parsedType
          });
          return parseUtil_1.INVALID;
        }
        if (def.exactLength !== null) {
          const tooBig = ctx.data.length > def.exactLength.value;
          const tooSmall = ctx.data.length < def.exactLength.value;
          if (tooBig || tooSmall) {
            (0, parseUtil_1.addIssueToContext)(ctx, {
              code: tooBig ? ZodError_1.ZodIssueCode.too_big : ZodError_1.ZodIssueCode.too_small,
              minimum: tooSmall ? def.exactLength.value : void 0,
              maximum: tooBig ? def.exactLength.value : void 0,
              type: "array",
              inclusive: true,
              exact: true,
              message: def.exactLength.message
            });
            status.dirty();
          }
        }
        if (def.minLength !== null) {
          if (ctx.data.length < def.minLength.value) {
            (0, parseUtil_1.addIssueToContext)(ctx, {
              code: ZodError_1.ZodIssueCode.too_small,
              minimum: def.minLength.value,
              type: "array",
              inclusive: true,
              exact: false,
              message: def.minLength.message
            });
            status.dirty();
          }
        }
        if (def.maxLength !== null) {
          if (ctx.data.length > def.maxLength.value) {
            (0, parseUtil_1.addIssueToContext)(ctx, {
              code: ZodError_1.ZodIssueCode.too_big,
              maximum: def.maxLength.value,
              type: "array",
              inclusive: true,
              exact: false,
              message: def.maxLength.message
            });
            status.dirty();
          }
        }
        if (ctx.common.async) {
          return Promise.all([...ctx.data].map((item, i2) => {
            return def.type._parseAsync(new ParseInputLazyPath(ctx, item, ctx.path, i2));
          })).then((result2) => {
            return parseUtil_1.ParseStatus.mergeArray(status, result2);
          });
        }
        const result = [...ctx.data].map((item, i2) => {
          return def.type._parseSync(new ParseInputLazyPath(ctx, item, ctx.path, i2));
        });
        return parseUtil_1.ParseStatus.mergeArray(status, result);
      }
      get element() {
        return this._def.type;
      }
      min(minLength, message) {
        return new _ZodArray({
          ...this._def,
          minLength: { value: minLength, message: errorUtil_1.errorUtil.toString(message) }
        });
      }
      max(maxLength, message) {
        return new _ZodArray({
          ...this._def,
          maxLength: { value: maxLength, message: errorUtil_1.errorUtil.toString(message) }
        });
      }
      length(len, message) {
        return new _ZodArray({
          ...this._def,
          exactLength: { value: len, message: errorUtil_1.errorUtil.toString(message) }
        });
      }
      nonempty(message) {
        return this.min(1, message);
      }
    };
    exports2.ZodArray = ZodArray;
    ZodArray.create = (schema, params) => {
      return new ZodArray({
        type: schema,
        minLength: null,
        maxLength: null,
        exactLength: null,
        typeName: ZodFirstPartyTypeKind.ZodArray,
        ...processCreateParams(params)
      });
    };
    function deepPartialify(schema) {
      if (schema instanceof ZodObject2) {
        const newShape = {};
        for (const key in schema.shape) {
          const fieldSchema = schema.shape[key];
          newShape[key] = ZodOptional.create(deepPartialify(fieldSchema));
        }
        return new ZodObject2({
          ...schema._def,
          shape: () => newShape
        });
      } else if (schema instanceof ZodArray) {
        return new ZodArray({
          ...schema._def,
          type: deepPartialify(schema.element)
        });
      } else if (schema instanceof ZodOptional) {
        return ZodOptional.create(deepPartialify(schema.unwrap()));
      } else if (schema instanceof ZodNullable) {
        return ZodNullable.create(deepPartialify(schema.unwrap()));
      } else if (schema instanceof ZodTuple) {
        return ZodTuple.create(schema.items.map((item) => deepPartialify(item)));
      } else {
        return schema;
      }
    }
    var ZodObject2 = class _ZodObject extends ZodType {
      constructor() {
        super(...arguments);
        this._cached = null;
        this.nonstrict = this.passthrough;
        this.augment = this.extend;
      }
      _getCached() {
        if (this._cached !== null)
          return this._cached;
        const shape = this._def.shape();
        const keys = util_1.util.objectKeys(shape);
        return this._cached = { shape, keys };
      }
      _parse(input) {
        const parsedType = this._getType(input);
        if (parsedType !== util_1.ZodParsedType.object) {
          const ctx2 = this._getOrReturnCtx(input);
          (0, parseUtil_1.addIssueToContext)(ctx2, {
            code: ZodError_1.ZodIssueCode.invalid_type,
            expected: util_1.ZodParsedType.object,
            received: ctx2.parsedType
          });
          return parseUtil_1.INVALID;
        }
        const { status, ctx } = this._processInputParams(input);
        const { shape, keys: shapeKeys } = this._getCached();
        const extraKeys = [];
        if (!(this._def.catchall instanceof ZodNever && this._def.unknownKeys === "strip")) {
          for (const key in ctx.data) {
            if (!shapeKeys.includes(key)) {
              extraKeys.push(key);
            }
          }
        }
        const pairs = [];
        for (const key of shapeKeys) {
          const keyValidator = shape[key];
          const value = ctx.data[key];
          pairs.push({
            key: { status: "valid", value: key },
            value: keyValidator._parse(new ParseInputLazyPath(ctx, value, ctx.path, key)),
            alwaysSet: key in ctx.data
          });
        }
        if (this._def.catchall instanceof ZodNever) {
          const unknownKeys = this._def.unknownKeys;
          if (unknownKeys === "passthrough") {
            for (const key of extraKeys) {
              pairs.push({
                key: { status: "valid", value: key },
                value: { status: "valid", value: ctx.data[key] }
              });
            }
          } else if (unknownKeys === "strict") {
            if (extraKeys.length > 0) {
              (0, parseUtil_1.addIssueToContext)(ctx, {
                code: ZodError_1.ZodIssueCode.unrecognized_keys,
                keys: extraKeys
              });
              status.dirty();
            }
          } else if (unknownKeys === "strip") {
          } else {
            throw new Error(`Internal ZodObject error: invalid unknownKeys value.`);
          }
        } else {
          const catchall = this._def.catchall;
          for (const key of extraKeys) {
            const value = ctx.data[key];
            pairs.push({
              key: { status: "valid", value: key },
              value: catchall._parse(
                new ParseInputLazyPath(ctx, value, ctx.path, key)
                //, ctx.child(key), value, getParsedType(value)
              ),
              alwaysSet: key in ctx.data
            });
          }
        }
        if (ctx.common.async) {
          return Promise.resolve().then(async () => {
            const syncPairs = [];
            for (const pair of pairs) {
              const key = await pair.key;
              const value = await pair.value;
              syncPairs.push({
                key,
                value,
                alwaysSet: pair.alwaysSet
              });
            }
            return syncPairs;
          }).then((syncPairs) => {
            return parseUtil_1.ParseStatus.mergeObjectSync(status, syncPairs);
          });
        } else {
          return parseUtil_1.ParseStatus.mergeObjectSync(status, pairs);
        }
      }
      get shape() {
        return this._def.shape();
      }
      strict(message) {
        errorUtil_1.errorUtil.errToObj;
        return new _ZodObject({
          ...this._def,
          unknownKeys: "strict",
          ...message !== void 0 ? {
            errorMap: (issue, ctx) => {
              var _a, _b, _c, _d;
              const defaultError = (_c = (_b = (_a = this._def).errorMap) === null || _b === void 0 ? void 0 : _b.call(_a, issue, ctx).message) !== null && _c !== void 0 ? _c : ctx.defaultError;
              if (issue.code === "unrecognized_keys")
                return {
                  message: (_d = errorUtil_1.errorUtil.errToObj(message).message) !== null && _d !== void 0 ? _d : defaultError
                };
              return {
                message: defaultError
              };
            }
          } : {}
        });
      }
      strip() {
        return new _ZodObject({
          ...this._def,
          unknownKeys: "strip"
        });
      }
      passthrough() {
        return new _ZodObject({
          ...this._def,
          unknownKeys: "passthrough"
        });
      }
      // const AugmentFactory =
      //   <Def extends ZodObjectDef>(def: Def) =>
      //   <Augmentation extends ZodRawShape>(
      //     augmentation: Augmentation
      //   ): ZodObject<
      //     extendShape<ReturnType<Def["shape"]>, Augmentation>,
      //     Def["unknownKeys"],
      //     Def["catchall"]
      //   > => {
      //     return new ZodObject({
      //       ...def,
      //       shape: () => ({
      //         ...def.shape(),
      //         ...augmentation,
      //       }),
      //     }) as any;
      //   };
      extend(augmentation) {
        return new _ZodObject({
          ...this._def,
          shape: () => ({
            ...this._def.shape(),
            ...augmentation
          })
        });
      }
      /**
       * Prior to zod@1.0.12 there was a bug in the
       * inferred type of merged objects. Please
       * upgrade if you are experiencing issues.
       */
      merge(merging) {
        const merged = new _ZodObject({
          unknownKeys: merging._def.unknownKeys,
          catchall: merging._def.catchall,
          shape: () => ({
            ...this._def.shape(),
            ...merging._def.shape()
          }),
          typeName: ZodFirstPartyTypeKind.ZodObject
        });
        return merged;
      }
      // merge<
      //   Incoming extends AnyZodObject,
      //   Augmentation extends Incoming["shape"],
      //   NewOutput extends {
      //     [k in keyof Augmentation | keyof Output]: k extends keyof Augmentation
      //       ? Augmentation[k]["_output"]
      //       : k extends keyof Output
      //       ? Output[k]
      //       : never;
      //   },
      //   NewInput extends {
      //     [k in keyof Augmentation | keyof Input]: k extends keyof Augmentation
      //       ? Augmentation[k]["_input"]
      //       : k extends keyof Input
      //       ? Input[k]
      //       : never;
      //   }
      // >(
      //   merging: Incoming
      // ): ZodObject<
      //   extendShape<T, ReturnType<Incoming["_def"]["shape"]>>,
      //   Incoming["_def"]["unknownKeys"],
      //   Incoming["_def"]["catchall"],
      //   NewOutput,
      //   NewInput
      // > {
      //   const merged: any = new ZodObject({
      //     unknownKeys: merging._def.unknownKeys,
      //     catchall: merging._def.catchall,
      //     shape: () =>
      //       objectUtil.mergeShapes(this._def.shape(), merging._def.shape()),
      //     typeName: ZodFirstPartyTypeKind.ZodObject,
      //   }) as any;
      //   return merged;
      // }
      setKey(key, schema) {
        return this.augment({ [key]: schema });
      }
      // merge<Incoming extends AnyZodObject>(
      //   merging: Incoming
      // ): //ZodObject<T & Incoming["_shape"], UnknownKeys, Catchall> = (merging) => {
      // ZodObject<
      //   extendShape<T, ReturnType<Incoming["_def"]["shape"]>>,
      //   Incoming["_def"]["unknownKeys"],
      //   Incoming["_def"]["catchall"]
      // > {
      //   // const mergedShape = objectUtil.mergeShapes(
      //   //   this._def.shape(),
      //   //   merging._def.shape()
      //   // );
      //   const merged: any = new ZodObject({
      //     unknownKeys: merging._def.unknownKeys,
      //     catchall: merging._def.catchall,
      //     shape: () =>
      //       objectUtil.mergeShapes(this._def.shape(), merging._def.shape()),
      //     typeName: ZodFirstPartyTypeKind.ZodObject,
      //   }) as any;
      //   return merged;
      // }
      catchall(index) {
        return new _ZodObject({
          ...this._def,
          catchall: index
        });
      }
      pick(mask) {
        const shape = {};
        util_1.util.objectKeys(mask).forEach((key) => {
          if (mask[key] && this.shape[key]) {
            shape[key] = this.shape[key];
          }
        });
        return new _ZodObject({
          ...this._def,
          shape: () => shape
        });
      }
      omit(mask) {
        const shape = {};
        util_1.util.objectKeys(this.shape).forEach((key) => {
          if (!mask[key]) {
            shape[key] = this.shape[key];
          }
        });
        return new _ZodObject({
          ...this._def,
          shape: () => shape
        });
      }
      /**
       * @deprecated
       */
      deepPartial() {
        return deepPartialify(this);
      }
      partial(mask) {
        const newShape = {};
        util_1.util.objectKeys(this.shape).forEach((key) => {
          const fieldSchema = this.shape[key];
          if (mask && !mask[key]) {
            newShape[key] = fieldSchema;
          } else {
            newShape[key] = fieldSchema.optional();
          }
        });
        return new _ZodObject({
          ...this._def,
          shape: () => newShape
        });
      }
      required(mask) {
        const newShape = {};
        util_1.util.objectKeys(this.shape).forEach((key) => {
          if (mask && !mask[key]) {
            newShape[key] = this.shape[key];
          } else {
            const fieldSchema = this.shape[key];
            let newField = fieldSchema;
            while (newField instanceof ZodOptional) {
              newField = newField._def.innerType;
            }
            newShape[key] = newField;
          }
        });
        return new _ZodObject({
          ...this._def,
          shape: () => newShape
        });
      }
      keyof() {
        return createZodEnum(util_1.util.objectKeys(this.shape));
      }
    };
    exports2.ZodObject = ZodObject2;
    ZodObject2.create = (shape, params) => {
      return new ZodObject2({
        shape: () => shape,
        unknownKeys: "strip",
        catchall: ZodNever.create(),
        typeName: ZodFirstPartyTypeKind.ZodObject,
        ...processCreateParams(params)
      });
    };
    ZodObject2.strictCreate = (shape, params) => {
      return new ZodObject2({
        shape: () => shape,
        unknownKeys: "strict",
        catchall: ZodNever.create(),
        typeName: ZodFirstPartyTypeKind.ZodObject,
        ...processCreateParams(params)
      });
    };
    ZodObject2.lazycreate = (shape, params) => {
      return new ZodObject2({
        shape,
        unknownKeys: "strip",
        catchall: ZodNever.create(),
        typeName: ZodFirstPartyTypeKind.ZodObject,
        ...processCreateParams(params)
      });
    };
    var ZodUnion = class extends ZodType {
      _parse(input) {
        const { ctx } = this._processInputParams(input);
        const options = this._def.options;
        function handleResults(results) {
          for (const result of results) {
            if (result.result.status === "valid") {
              return result.result;
            }
          }
          for (const result of results) {
            if (result.result.status === "dirty") {
              ctx.common.issues.push(...result.ctx.common.issues);
              return result.result;
            }
          }
          const unionErrors = results.map((result) => new ZodError_1.ZodError(result.ctx.common.issues));
          (0, parseUtil_1.addIssueToContext)(ctx, {
            code: ZodError_1.ZodIssueCode.invalid_union,
            unionErrors
          });
          return parseUtil_1.INVALID;
        }
        if (ctx.common.async) {
          return Promise.all(options.map(async (option) => {
            const childCtx = {
              ...ctx,
              common: {
                ...ctx.common,
                issues: []
              },
              parent: null
            };
            return {
              result: await option._parseAsync({
                data: ctx.data,
                path: ctx.path,
                parent: childCtx
              }),
              ctx: childCtx
            };
          })).then(handleResults);
        } else {
          let dirty = void 0;
          const issues = [];
          for (const option of options) {
            const childCtx = {
              ...ctx,
              common: {
                ...ctx.common,
                issues: []
              },
              parent: null
            };
            const result = option._parseSync({
              data: ctx.data,
              path: ctx.path,
              parent: childCtx
            });
            if (result.status === "valid") {
              return result;
            } else if (result.status === "dirty" && !dirty) {
              dirty = { result, ctx: childCtx };
            }
            if (childCtx.common.issues.length) {
              issues.push(childCtx.common.issues);
            }
          }
          if (dirty) {
            ctx.common.issues.push(...dirty.ctx.common.issues);
            return dirty.result;
          }
          const unionErrors = issues.map((issues2) => new ZodError_1.ZodError(issues2));
          (0, parseUtil_1.addIssueToContext)(ctx, {
            code: ZodError_1.ZodIssueCode.invalid_union,
            unionErrors
          });
          return parseUtil_1.INVALID;
        }
      }
      get options() {
        return this._def.options;
      }
    };
    exports2.ZodUnion = ZodUnion;
    ZodUnion.create = (types, params) => {
      return new ZodUnion({
        options: types,
        typeName: ZodFirstPartyTypeKind.ZodUnion,
        ...processCreateParams(params)
      });
    };
    var getDiscriminator = (type) => {
      if (type instanceof ZodLazy) {
        return getDiscriminator(type.schema);
      } else if (type instanceof ZodEffects) {
        return getDiscriminator(type.innerType());
      } else if (type instanceof ZodLiteral) {
        return [type.value];
      } else if (type instanceof ZodEnum) {
        return type.options;
      } else if (type instanceof ZodNativeEnum) {
        return util_1.util.objectValues(type.enum);
      } else if (type instanceof ZodDefault) {
        return getDiscriminator(type._def.innerType);
      } else if (type instanceof ZodUndefined) {
        return [void 0];
      } else if (type instanceof ZodNull) {
        return [null];
      } else if (type instanceof ZodOptional) {
        return [void 0, ...getDiscriminator(type.unwrap())];
      } else if (type instanceof ZodNullable) {
        return [null, ...getDiscriminator(type.unwrap())];
      } else if (type instanceof ZodBranded) {
        return getDiscriminator(type.unwrap());
      } else if (type instanceof ZodReadonly) {
        return getDiscriminator(type.unwrap());
      } else if (type instanceof ZodCatch) {
        return getDiscriminator(type._def.innerType);
      } else {
        return [];
      }
    };
    var ZodDiscriminatedUnion = class _ZodDiscriminatedUnion extends ZodType {
      _parse(input) {
        const { ctx } = this._processInputParams(input);
        if (ctx.parsedType !== util_1.ZodParsedType.object) {
          (0, parseUtil_1.addIssueToContext)(ctx, {
            code: ZodError_1.ZodIssueCode.invalid_type,
            expected: util_1.ZodParsedType.object,
            received: ctx.parsedType
          });
          return parseUtil_1.INVALID;
        }
        const discriminator = this.discriminator;
        const discriminatorValue = ctx.data[discriminator];
        const option = this.optionsMap.get(discriminatorValue);
        if (!option) {
          (0, parseUtil_1.addIssueToContext)(ctx, {
            code: ZodError_1.ZodIssueCode.invalid_union_discriminator,
            options: Array.from(this.optionsMap.keys()),
            path: [discriminator]
          });
          return parseUtil_1.INVALID;
        }
        if (ctx.common.async) {
          return option._parseAsync({
            data: ctx.data,
            path: ctx.path,
            parent: ctx
          });
        } else {
          return option._parseSync({
            data: ctx.data,
            path: ctx.path,
            parent: ctx
          });
        }
      }
      get discriminator() {
        return this._def.discriminator;
      }
      get options() {
        return this._def.options;
      }
      get optionsMap() {
        return this._def.optionsMap;
      }
      /**
       * The constructor of the discriminated union schema. Its behaviour is very similar to that of the normal z.union() constructor.
       * However, it only allows a union of objects, all of which need to share a discriminator property. This property must
       * have a different value for each object in the union.
       * @param discriminator the name of the discriminator property
       * @param types an array of object schemas
       * @param params
       */
      static create(discriminator, options, params) {
        const optionsMap = /* @__PURE__ */ new Map();
        for (const type of options) {
          const discriminatorValues = getDiscriminator(type.shape[discriminator]);
          if (!discriminatorValues.length) {
            throw new Error(`A discriminator value for key \`${discriminator}\` could not be extracted from all schema options`);
          }
          for (const value of discriminatorValues) {
            if (optionsMap.has(value)) {
              throw new Error(`Discriminator property ${String(discriminator)} has duplicate value ${String(value)}`);
            }
            optionsMap.set(value, type);
          }
        }
        return new _ZodDiscriminatedUnion({
          typeName: ZodFirstPartyTypeKind.ZodDiscriminatedUnion,
          discriminator,
          options,
          optionsMap,
          ...processCreateParams(params)
        });
      }
    };
    exports2.ZodDiscriminatedUnion = ZodDiscriminatedUnion;
    function mergeValues(a2, b2) {
      const aType = (0, util_1.getParsedType)(a2);
      const bType = (0, util_1.getParsedType)(b2);
      if (a2 === b2) {
        return { valid: true, data: a2 };
      } else if (aType === util_1.ZodParsedType.object && bType === util_1.ZodParsedType.object) {
        const bKeys = util_1.util.objectKeys(b2);
        const sharedKeys = util_1.util.objectKeys(a2).filter((key) => bKeys.indexOf(key) !== -1);
        const newObj = { ...a2, ...b2 };
        for (const key of sharedKeys) {
          const sharedValue = mergeValues(a2[key], b2[key]);
          if (!sharedValue.valid) {
            return { valid: false };
          }
          newObj[key] = sharedValue.data;
        }
        return { valid: true, data: newObj };
      } else if (aType === util_1.ZodParsedType.array && bType === util_1.ZodParsedType.array) {
        if (a2.length !== b2.length) {
          return { valid: false };
        }
        const newArray = [];
        for (let index = 0; index < a2.length; index++) {
          const itemA = a2[index];
          const itemB = b2[index];
          const sharedValue = mergeValues(itemA, itemB);
          if (!sharedValue.valid) {
            return { valid: false };
          }
          newArray.push(sharedValue.data);
        }
        return { valid: true, data: newArray };
      } else if (aType === util_1.ZodParsedType.date && bType === util_1.ZodParsedType.date && +a2 === +b2) {
        return { valid: true, data: a2 };
      } else {
        return { valid: false };
      }
    }
    var ZodIntersection = class extends ZodType {
      _parse(input) {
        const { status, ctx } = this._processInputParams(input);
        const handleParsed = (parsedLeft, parsedRight) => {
          if ((0, parseUtil_1.isAborted)(parsedLeft) || (0, parseUtil_1.isAborted)(parsedRight)) {
            return parseUtil_1.INVALID;
          }
          const merged = mergeValues(parsedLeft.value, parsedRight.value);
          if (!merged.valid) {
            (0, parseUtil_1.addIssueToContext)(ctx, {
              code: ZodError_1.ZodIssueCode.invalid_intersection_types
            });
            return parseUtil_1.INVALID;
          }
          if ((0, parseUtil_1.isDirty)(parsedLeft) || (0, parseUtil_1.isDirty)(parsedRight)) {
            status.dirty();
          }
          return { status: status.value, value: merged.data };
        };
        if (ctx.common.async) {
          return Promise.all([
            this._def.left._parseAsync({
              data: ctx.data,
              path: ctx.path,
              parent: ctx
            }),
            this._def.right._parseAsync({
              data: ctx.data,
              path: ctx.path,
              parent: ctx
            })
          ]).then(([left, right]) => handleParsed(left, right));
        } else {
          return handleParsed(this._def.left._parseSync({
            data: ctx.data,
            path: ctx.path,
            parent: ctx
          }), this._def.right._parseSync({
            data: ctx.data,
            path: ctx.path,
            parent: ctx
          }));
        }
      }
    };
    exports2.ZodIntersection = ZodIntersection;
    ZodIntersection.create = (left, right, params) => {
      return new ZodIntersection({
        left,
        right,
        typeName: ZodFirstPartyTypeKind.ZodIntersection,
        ...processCreateParams(params)
      });
    };
    var ZodTuple = class _ZodTuple extends ZodType {
      _parse(input) {
        const { status, ctx } = this._processInputParams(input);
        if (ctx.parsedType !== util_1.ZodParsedType.array) {
          (0, parseUtil_1.addIssueToContext)(ctx, {
            code: ZodError_1.ZodIssueCode.invalid_type,
            expected: util_1.ZodParsedType.array,
            received: ctx.parsedType
          });
          return parseUtil_1.INVALID;
        }
        if (ctx.data.length < this._def.items.length) {
          (0, parseUtil_1.addIssueToContext)(ctx, {
            code: ZodError_1.ZodIssueCode.too_small,
            minimum: this._def.items.length,
            inclusive: true,
            exact: false,
            type: "array"
          });
          return parseUtil_1.INVALID;
        }
        const rest = this._def.rest;
        if (!rest && ctx.data.length > this._def.items.length) {
          (0, parseUtil_1.addIssueToContext)(ctx, {
            code: ZodError_1.ZodIssueCode.too_big,
            maximum: this._def.items.length,
            inclusive: true,
            exact: false,
            type: "array"
          });
          status.dirty();
        }
        const items = [...ctx.data].map((item, itemIndex) => {
          const schema = this._def.items[itemIndex] || this._def.rest;
          if (!schema)
            return null;
          return schema._parse(new ParseInputLazyPath(ctx, item, ctx.path, itemIndex));
        }).filter((x2) => !!x2);
        if (ctx.common.async) {
          return Promise.all(items).then((results) => {
            return parseUtil_1.ParseStatus.mergeArray(status, results);
          });
        } else {
          return parseUtil_1.ParseStatus.mergeArray(status, items);
        }
      }
      get items() {
        return this._def.items;
      }
      rest(rest) {
        return new _ZodTuple({
          ...this._def,
          rest
        });
      }
    };
    exports2.ZodTuple = ZodTuple;
    ZodTuple.create = (schemas, params) => {
      if (!Array.isArray(schemas)) {
        throw new Error("You must pass an array of schemas to z.tuple([ ... ])");
      }
      return new ZodTuple({
        items: schemas,
        typeName: ZodFirstPartyTypeKind.ZodTuple,
        rest: null,
        ...processCreateParams(params)
      });
    };
    var ZodRecord = class _ZodRecord extends ZodType {
      get keySchema() {
        return this._def.keyType;
      }
      get valueSchema() {
        return this._def.valueType;
      }
      _parse(input) {
        const { status, ctx } = this._processInputParams(input);
        if (ctx.parsedType !== util_1.ZodParsedType.object) {
          (0, parseUtil_1.addIssueToContext)(ctx, {
            code: ZodError_1.ZodIssueCode.invalid_type,
            expected: util_1.ZodParsedType.object,
            received: ctx.parsedType
          });
          return parseUtil_1.INVALID;
        }
        const pairs = [];
        const keyType = this._def.keyType;
        const valueType = this._def.valueType;
        for (const key in ctx.data) {
          pairs.push({
            key: keyType._parse(new ParseInputLazyPath(ctx, key, ctx.path, key)),
            value: valueType._parse(new ParseInputLazyPath(ctx, ctx.data[key], ctx.path, key)),
            alwaysSet: key in ctx.data
          });
        }
        if (ctx.common.async) {
          return parseUtil_1.ParseStatus.mergeObjectAsync(status, pairs);
        } else {
          return parseUtil_1.ParseStatus.mergeObjectSync(status, pairs);
        }
      }
      get element() {
        return this._def.valueType;
      }
      static create(first, second, third) {
        if (second instanceof ZodType) {
          return new _ZodRecord({
            keyType: first,
            valueType: second,
            typeName: ZodFirstPartyTypeKind.ZodRecord,
            ...processCreateParams(third)
          });
        }
        return new _ZodRecord({
          keyType: ZodString.create(),
          valueType: first,
          typeName: ZodFirstPartyTypeKind.ZodRecord,
          ...processCreateParams(second)
        });
      }
    };
    exports2.ZodRecord = ZodRecord;
    var ZodMap = class extends ZodType {
      get keySchema() {
        return this._def.keyType;
      }
      get valueSchema() {
        return this._def.valueType;
      }
      _parse(input) {
        const { status, ctx } = this._processInputParams(input);
        if (ctx.parsedType !== util_1.ZodParsedType.map) {
          (0, parseUtil_1.addIssueToContext)(ctx, {
            code: ZodError_1.ZodIssueCode.invalid_type,
            expected: util_1.ZodParsedType.map,
            received: ctx.parsedType
          });
          return parseUtil_1.INVALID;
        }
        const keyType = this._def.keyType;
        const valueType = this._def.valueType;
        const pairs = [...ctx.data.entries()].map(([key, value], index) => {
          return {
            key: keyType._parse(new ParseInputLazyPath(ctx, key, ctx.path, [index, "key"])),
            value: valueType._parse(new ParseInputLazyPath(ctx, value, ctx.path, [index, "value"]))
          };
        });
        if (ctx.common.async) {
          const finalMap = /* @__PURE__ */ new Map();
          return Promise.resolve().then(async () => {
            for (const pair of pairs) {
              const key = await pair.key;
              const value = await pair.value;
              if (key.status === "aborted" || value.status === "aborted") {
                return parseUtil_1.INVALID;
              }
              if (key.status === "dirty" || value.status === "dirty") {
                status.dirty();
              }
              finalMap.set(key.value, value.value);
            }
            return { status: status.value, value: finalMap };
          });
        } else {
          const finalMap = /* @__PURE__ */ new Map();
          for (const pair of pairs) {
            const key = pair.key;
            const value = pair.value;
            if (key.status === "aborted" || value.status === "aborted") {
              return parseUtil_1.INVALID;
            }
            if (key.status === "dirty" || value.status === "dirty") {
              status.dirty();
            }
            finalMap.set(key.value, value.value);
          }
          return { status: status.value, value: finalMap };
        }
      }
    };
    exports2.ZodMap = ZodMap;
    ZodMap.create = (keyType, valueType, params) => {
      return new ZodMap({
        valueType,
        keyType,
        typeName: ZodFirstPartyTypeKind.ZodMap,
        ...processCreateParams(params)
      });
    };
    var ZodSet = class _ZodSet extends ZodType {
      _parse(input) {
        const { status, ctx } = this._processInputParams(input);
        if (ctx.parsedType !== util_1.ZodParsedType.set) {
          (0, parseUtil_1.addIssueToContext)(ctx, {
            code: ZodError_1.ZodIssueCode.invalid_type,
            expected: util_1.ZodParsedType.set,
            received: ctx.parsedType
          });
          return parseUtil_1.INVALID;
        }
        const def = this._def;
        if (def.minSize !== null) {
          if (ctx.data.size < def.minSize.value) {
            (0, parseUtil_1.addIssueToContext)(ctx, {
              code: ZodError_1.ZodIssueCode.too_small,
              minimum: def.minSize.value,
              type: "set",
              inclusive: true,
              exact: false,
              message: def.minSize.message
            });
            status.dirty();
          }
        }
        if (def.maxSize !== null) {
          if (ctx.data.size > def.maxSize.value) {
            (0, parseUtil_1.addIssueToContext)(ctx, {
              code: ZodError_1.ZodIssueCode.too_big,
              maximum: def.maxSize.value,
              type: "set",
              inclusive: true,
              exact: false,
              message: def.maxSize.message
            });
            status.dirty();
          }
        }
        const valueType = this._def.valueType;
        function finalizeSet(elements2) {
          const parsedSet = /* @__PURE__ */ new Set();
          for (const element of elements2) {
            if (element.status === "aborted")
              return parseUtil_1.INVALID;
            if (element.status === "dirty")
              status.dirty();
            parsedSet.add(element.value);
          }
          return { status: status.value, value: parsedSet };
        }
        const elements = [...ctx.data.values()].map((item, i2) => valueType._parse(new ParseInputLazyPath(ctx, item, ctx.path, i2)));
        if (ctx.common.async) {
          return Promise.all(elements).then((elements2) => finalizeSet(elements2));
        } else {
          return finalizeSet(elements);
        }
      }
      min(minSize, message) {
        return new _ZodSet({
          ...this._def,
          minSize: { value: minSize, message: errorUtil_1.errorUtil.toString(message) }
        });
      }
      max(maxSize, message) {
        return new _ZodSet({
          ...this._def,
          maxSize: { value: maxSize, message: errorUtil_1.errorUtil.toString(message) }
        });
      }
      size(size, message) {
        return this.min(size, message).max(size, message);
      }
      nonempty(message) {
        return this.min(1, message);
      }
    };
    exports2.ZodSet = ZodSet;
    ZodSet.create = (valueType, params) => {
      return new ZodSet({
        valueType,
        minSize: null,
        maxSize: null,
        typeName: ZodFirstPartyTypeKind.ZodSet,
        ...processCreateParams(params)
      });
    };
    var ZodFunction = class _ZodFunction extends ZodType {
      constructor() {
        super(...arguments);
        this.validate = this.implement;
      }
      _parse(input) {
        const { ctx } = this._processInputParams(input);
        if (ctx.parsedType !== util_1.ZodParsedType.function) {
          (0, parseUtil_1.addIssueToContext)(ctx, {
            code: ZodError_1.ZodIssueCode.invalid_type,
            expected: util_1.ZodParsedType.function,
            received: ctx.parsedType
          });
          return parseUtil_1.INVALID;
        }
        function makeArgsIssue(args, error) {
          return (0, parseUtil_1.makeIssue)({
            data: args,
            path: ctx.path,
            errorMaps: [
              ctx.common.contextualErrorMap,
              ctx.schemaErrorMap,
              (0, errors_1.getErrorMap)(),
              errors_1.defaultErrorMap
            ].filter((x2) => !!x2),
            issueData: {
              code: ZodError_1.ZodIssueCode.invalid_arguments,
              argumentsError: error
            }
          });
        }
        function makeReturnsIssue(returns, error) {
          return (0, parseUtil_1.makeIssue)({
            data: returns,
            path: ctx.path,
            errorMaps: [
              ctx.common.contextualErrorMap,
              ctx.schemaErrorMap,
              (0, errors_1.getErrorMap)(),
              errors_1.defaultErrorMap
            ].filter((x2) => !!x2),
            issueData: {
              code: ZodError_1.ZodIssueCode.invalid_return_type,
              returnTypeError: error
            }
          });
        }
        const params = { errorMap: ctx.common.contextualErrorMap };
        const fn = ctx.data;
        if (this._def.returns instanceof ZodPromise) {
          const me = this;
          return (0, parseUtil_1.OK)(async function(...args) {
            const error = new ZodError_1.ZodError([]);
            const parsedArgs = await me._def.args.parseAsync(args, params).catch((e2) => {
              error.addIssue(makeArgsIssue(args, e2));
              throw error;
            });
            const result = await Reflect.apply(fn, this, parsedArgs);
            const parsedReturns = await me._def.returns._def.type.parseAsync(result, params).catch((e2) => {
              error.addIssue(makeReturnsIssue(result, e2));
              throw error;
            });
            return parsedReturns;
          });
        } else {
          const me = this;
          return (0, parseUtil_1.OK)(function(...args) {
            const parsedArgs = me._def.args.safeParse(args, params);
            if (!parsedArgs.success) {
              throw new ZodError_1.ZodError([makeArgsIssue(args, parsedArgs.error)]);
            }
            const result = Reflect.apply(fn, this, parsedArgs.data);
            const parsedReturns = me._def.returns.safeParse(result, params);
            if (!parsedReturns.success) {
              throw new ZodError_1.ZodError([makeReturnsIssue(result, parsedReturns.error)]);
            }
            return parsedReturns.data;
          });
        }
      }
      parameters() {
        return this._def.args;
      }
      returnType() {
        return this._def.returns;
      }
      args(...items) {
        return new _ZodFunction({
          ...this._def,
          args: ZodTuple.create(items).rest(ZodUnknown.create())
        });
      }
      returns(returnType) {
        return new _ZodFunction({
          ...this._def,
          returns: returnType
        });
      }
      implement(func) {
        const validatedFunc = this.parse(func);
        return validatedFunc;
      }
      strictImplement(func) {
        const validatedFunc = this.parse(func);
        return validatedFunc;
      }
      static create(args, returns, params) {
        return new _ZodFunction({
          args: args ? args : ZodTuple.create([]).rest(ZodUnknown.create()),
          returns: returns || ZodUnknown.create(),
          typeName: ZodFirstPartyTypeKind.ZodFunction,
          ...processCreateParams(params)
        });
      }
    };
    exports2.ZodFunction = ZodFunction;
    var ZodLazy = class extends ZodType {
      get schema() {
        return this._def.getter();
      }
      _parse(input) {
        const { ctx } = this._processInputParams(input);
        const lazySchema = this._def.getter();
        return lazySchema._parse({ data: ctx.data, path: ctx.path, parent: ctx });
      }
    };
    exports2.ZodLazy = ZodLazy;
    ZodLazy.create = (getter, params) => {
      return new ZodLazy({
        getter,
        typeName: ZodFirstPartyTypeKind.ZodLazy,
        ...processCreateParams(params)
      });
    };
    var ZodLiteral = class extends ZodType {
      _parse(input) {
        if (input.data !== this._def.value) {
          const ctx = this._getOrReturnCtx(input);
          (0, parseUtil_1.addIssueToContext)(ctx, {
            received: ctx.data,
            code: ZodError_1.ZodIssueCode.invalid_literal,
            expected: this._def.value
          });
          return parseUtil_1.INVALID;
        }
        return { status: "valid", value: input.data };
      }
      get value() {
        return this._def.value;
      }
    };
    exports2.ZodLiteral = ZodLiteral;
    ZodLiteral.create = (value, params) => {
      return new ZodLiteral({
        value,
        typeName: ZodFirstPartyTypeKind.ZodLiteral,
        ...processCreateParams(params)
      });
    };
    function createZodEnum(values, params) {
      return new ZodEnum({
        values,
        typeName: ZodFirstPartyTypeKind.ZodEnum,
        ...processCreateParams(params)
      });
    }
    var ZodEnum = class _ZodEnum extends ZodType {
      constructor() {
        super(...arguments);
        _ZodEnum_cache.set(this, void 0);
      }
      _parse(input) {
        if (typeof input.data !== "string") {
          const ctx = this._getOrReturnCtx(input);
          const expectedValues = this._def.values;
          (0, parseUtil_1.addIssueToContext)(ctx, {
            expected: util_1.util.joinValues(expectedValues),
            received: ctx.parsedType,
            code: ZodError_1.ZodIssueCode.invalid_type
          });
          return parseUtil_1.INVALID;
        }
        if (!__classPrivateFieldGet(this, _ZodEnum_cache, "f")) {
          __classPrivateFieldSet(this, _ZodEnum_cache, new Set(this._def.values), "f");
        }
        if (!__classPrivateFieldGet(this, _ZodEnum_cache, "f").has(input.data)) {
          const ctx = this._getOrReturnCtx(input);
          const expectedValues = this._def.values;
          (0, parseUtil_1.addIssueToContext)(ctx, {
            received: ctx.data,
            code: ZodError_1.ZodIssueCode.invalid_enum_value,
            options: expectedValues
          });
          return parseUtil_1.INVALID;
        }
        return (0, parseUtil_1.OK)(input.data);
      }
      get options() {
        return this._def.values;
      }
      get enum() {
        const enumValues = {};
        for (const val of this._def.values) {
          enumValues[val] = val;
        }
        return enumValues;
      }
      get Values() {
        const enumValues = {};
        for (const val of this._def.values) {
          enumValues[val] = val;
        }
        return enumValues;
      }
      get Enum() {
        const enumValues = {};
        for (const val of this._def.values) {
          enumValues[val] = val;
        }
        return enumValues;
      }
      extract(values, newDef = this._def) {
        return _ZodEnum.create(values, {
          ...this._def,
          ...newDef
        });
      }
      exclude(values, newDef = this._def) {
        return _ZodEnum.create(this.options.filter((opt) => !values.includes(opt)), {
          ...this._def,
          ...newDef
        });
      }
    };
    exports2.ZodEnum = ZodEnum;
    _ZodEnum_cache = /* @__PURE__ */ new WeakMap();
    ZodEnum.create = createZodEnum;
    var ZodNativeEnum = class extends ZodType {
      constructor() {
        super(...arguments);
        _ZodNativeEnum_cache.set(this, void 0);
      }
      _parse(input) {
        const nativeEnumValues = util_1.util.getValidEnumValues(this._def.values);
        const ctx = this._getOrReturnCtx(input);
        if (ctx.parsedType !== util_1.ZodParsedType.string && ctx.parsedType !== util_1.ZodParsedType.number) {
          const expectedValues = util_1.util.objectValues(nativeEnumValues);
          (0, parseUtil_1.addIssueToContext)(ctx, {
            expected: util_1.util.joinValues(expectedValues),
            received: ctx.parsedType,
            code: ZodError_1.ZodIssueCode.invalid_type
          });
          return parseUtil_1.INVALID;
        }
        if (!__classPrivateFieldGet(this, _ZodNativeEnum_cache, "f")) {
          __classPrivateFieldSet(this, _ZodNativeEnum_cache, new Set(util_1.util.getValidEnumValues(this._def.values)), "f");
        }
        if (!__classPrivateFieldGet(this, _ZodNativeEnum_cache, "f").has(input.data)) {
          const expectedValues = util_1.util.objectValues(nativeEnumValues);
          (0, parseUtil_1.addIssueToContext)(ctx, {
            received: ctx.data,
            code: ZodError_1.ZodIssueCode.invalid_enum_value,
            options: expectedValues
          });
          return parseUtil_1.INVALID;
        }
        return (0, parseUtil_1.OK)(input.data);
      }
      get enum() {
        return this._def.values;
      }
    };
    exports2.ZodNativeEnum = ZodNativeEnum;
    _ZodNativeEnum_cache = /* @__PURE__ */ new WeakMap();
    ZodNativeEnum.create = (values, params) => {
      return new ZodNativeEnum({
        values,
        typeName: ZodFirstPartyTypeKind.ZodNativeEnum,
        ...processCreateParams(params)
      });
    };
    var ZodPromise = class extends ZodType {
      unwrap() {
        return this._def.type;
      }
      _parse(input) {
        const { ctx } = this._processInputParams(input);
        if (ctx.parsedType !== util_1.ZodParsedType.promise && ctx.common.async === false) {
          (0, parseUtil_1.addIssueToContext)(ctx, {
            code: ZodError_1.ZodIssueCode.invalid_type,
            expected: util_1.ZodParsedType.promise,
            received: ctx.parsedType
          });
          return parseUtil_1.INVALID;
        }
        const promisified = ctx.parsedType === util_1.ZodParsedType.promise ? ctx.data : Promise.resolve(ctx.data);
        return (0, parseUtil_1.OK)(promisified.then((data) => {
          return this._def.type.parseAsync(data, {
            path: ctx.path,
            errorMap: ctx.common.contextualErrorMap
          });
        }));
      }
    };
    exports2.ZodPromise = ZodPromise;
    ZodPromise.create = (schema, params) => {
      return new ZodPromise({
        type: schema,
        typeName: ZodFirstPartyTypeKind.ZodPromise,
        ...processCreateParams(params)
      });
    };
    var ZodEffects = class extends ZodType {
      innerType() {
        return this._def.schema;
      }
      sourceType() {
        return this._def.schema._def.typeName === ZodFirstPartyTypeKind.ZodEffects ? this._def.schema.sourceType() : this._def.schema;
      }
      _parse(input) {
        const { status, ctx } = this._processInputParams(input);
        const effect = this._def.effect || null;
        const checkCtx = {
          addIssue: (arg) => {
            (0, parseUtil_1.addIssueToContext)(ctx, arg);
            if (arg.fatal) {
              status.abort();
            } else {
              status.dirty();
            }
          },
          get path() {
            return ctx.path;
          }
        };
        checkCtx.addIssue = checkCtx.addIssue.bind(checkCtx);
        if (effect.type === "preprocess") {
          const processed = effect.transform(ctx.data, checkCtx);
          if (ctx.common.async) {
            return Promise.resolve(processed).then(async (processed2) => {
              if (status.value === "aborted")
                return parseUtil_1.INVALID;
              const result = await this._def.schema._parseAsync({
                data: processed2,
                path: ctx.path,
                parent: ctx
              });
              if (result.status === "aborted")
                return parseUtil_1.INVALID;
              if (result.status === "dirty")
                return (0, parseUtil_1.DIRTY)(result.value);
              if (status.value === "dirty")
                return (0, parseUtil_1.DIRTY)(result.value);
              return result;
            });
          } else {
            if (status.value === "aborted")
              return parseUtil_1.INVALID;
            const result = this._def.schema._parseSync({
              data: processed,
              path: ctx.path,
              parent: ctx
            });
            if (result.status === "aborted")
              return parseUtil_1.INVALID;
            if (result.status === "dirty")
              return (0, parseUtil_1.DIRTY)(result.value);
            if (status.value === "dirty")
              return (0, parseUtil_1.DIRTY)(result.value);
            return result;
          }
        }
        if (effect.type === "refinement") {
          const executeRefinement = (acc) => {
            const result = effect.refinement(acc, checkCtx);
            if (ctx.common.async) {
              return Promise.resolve(result);
            }
            if (result instanceof Promise) {
              throw new Error("Async refinement encountered during synchronous parse operation. Use .parseAsync instead.");
            }
            return acc;
          };
          if (ctx.common.async === false) {
            const inner = this._def.schema._parseSync({
              data: ctx.data,
              path: ctx.path,
              parent: ctx
            });
            if (inner.status === "aborted")
              return parseUtil_1.INVALID;
            if (inner.status === "dirty")
              status.dirty();
            executeRefinement(inner.value);
            return { status: status.value, value: inner.value };
          } else {
            return this._def.schema._parseAsync({ data: ctx.data, path: ctx.path, parent: ctx }).then((inner) => {
              if (inner.status === "aborted")
                return parseUtil_1.INVALID;
              if (inner.status === "dirty")
                status.dirty();
              return executeRefinement(inner.value).then(() => {
                return { status: status.value, value: inner.value };
              });
            });
          }
        }
        if (effect.type === "transform") {
          if (ctx.common.async === false) {
            const base = this._def.schema._parseSync({
              data: ctx.data,
              path: ctx.path,
              parent: ctx
            });
            if (!(0, parseUtil_1.isValid)(base))
              return base;
            const result = effect.transform(base.value, checkCtx);
            if (result instanceof Promise) {
              throw new Error(`Asynchronous transform encountered during synchronous parse operation. Use .parseAsync instead.`);
            }
            return { status: status.value, value: result };
          } else {
            return this._def.schema._parseAsync({ data: ctx.data, path: ctx.path, parent: ctx }).then((base) => {
              if (!(0, parseUtil_1.isValid)(base))
                return base;
              return Promise.resolve(effect.transform(base.value, checkCtx)).then((result) => ({ status: status.value, value: result }));
            });
          }
        }
        util_1.util.assertNever(effect);
      }
    };
    exports2.ZodEffects = ZodEffects;
    exports2.ZodTransformer = ZodEffects;
    ZodEffects.create = (schema, effect, params) => {
      return new ZodEffects({
        schema,
        typeName: ZodFirstPartyTypeKind.ZodEffects,
        effect,
        ...processCreateParams(params)
      });
    };
    ZodEffects.createWithPreprocess = (preprocess, schema, params) => {
      return new ZodEffects({
        schema,
        effect: { type: "preprocess", transform: preprocess },
        typeName: ZodFirstPartyTypeKind.ZodEffects,
        ...processCreateParams(params)
      });
    };
    var ZodOptional = class extends ZodType {
      _parse(input) {
        const parsedType = this._getType(input);
        if (parsedType === util_1.ZodParsedType.undefined) {
          return (0, parseUtil_1.OK)(void 0);
        }
        return this._def.innerType._parse(input);
      }
      unwrap() {
        return this._def.innerType;
      }
    };
    exports2.ZodOptional = ZodOptional;
    ZodOptional.create = (type, params) => {
      return new ZodOptional({
        innerType: type,
        typeName: ZodFirstPartyTypeKind.ZodOptional,
        ...processCreateParams(params)
      });
    };
    var ZodNullable = class extends ZodType {
      _parse(input) {
        const parsedType = this._getType(input);
        if (parsedType === util_1.ZodParsedType.null) {
          return (0, parseUtil_1.OK)(null);
        }
        return this._def.innerType._parse(input);
      }
      unwrap() {
        return this._def.innerType;
      }
    };
    exports2.ZodNullable = ZodNullable;
    ZodNullable.create = (type, params) => {
      return new ZodNullable({
        innerType: type,
        typeName: ZodFirstPartyTypeKind.ZodNullable,
        ...processCreateParams(params)
      });
    };
    var ZodDefault = class extends ZodType {
      _parse(input) {
        const { ctx } = this._processInputParams(input);
        let data = ctx.data;
        if (ctx.parsedType === util_1.ZodParsedType.undefined) {
          data = this._def.defaultValue();
        }
        return this._def.innerType._parse({
          data,
          path: ctx.path,
          parent: ctx
        });
      }
      removeDefault() {
        return this._def.innerType;
      }
    };
    exports2.ZodDefault = ZodDefault;
    ZodDefault.create = (type, params) => {
      return new ZodDefault({
        innerType: type,
        typeName: ZodFirstPartyTypeKind.ZodDefault,
        defaultValue: typeof params.default === "function" ? params.default : () => params.default,
        ...processCreateParams(params)
      });
    };
    var ZodCatch = class extends ZodType {
      _parse(input) {
        const { ctx } = this._processInputParams(input);
        const newCtx = {
          ...ctx,
          common: {
            ...ctx.common,
            issues: []
          }
        };
        const result = this._def.innerType._parse({
          data: newCtx.data,
          path: newCtx.path,
          parent: {
            ...newCtx
          }
        });
        if ((0, parseUtil_1.isAsync)(result)) {
          return result.then((result2) => {
            return {
              status: "valid",
              value: result2.status === "valid" ? result2.value : this._def.catchValue({
                get error() {
                  return new ZodError_1.ZodError(newCtx.common.issues);
                },
                input: newCtx.data
              })
            };
          });
        } else {
          return {
            status: "valid",
            value: result.status === "valid" ? result.value : this._def.catchValue({
              get error() {
                return new ZodError_1.ZodError(newCtx.common.issues);
              },
              input: newCtx.data
            })
          };
        }
      }
      removeCatch() {
        return this._def.innerType;
      }
    };
    exports2.ZodCatch = ZodCatch;
    ZodCatch.create = (type, params) => {
      return new ZodCatch({
        innerType: type,
        typeName: ZodFirstPartyTypeKind.ZodCatch,
        catchValue: typeof params.catch === "function" ? params.catch : () => params.catch,
        ...processCreateParams(params)
      });
    };
    var ZodNaN = class extends ZodType {
      _parse(input) {
        const parsedType = this._getType(input);
        if (parsedType !== util_1.ZodParsedType.nan) {
          const ctx = this._getOrReturnCtx(input);
          (0, parseUtil_1.addIssueToContext)(ctx, {
            code: ZodError_1.ZodIssueCode.invalid_type,
            expected: util_1.ZodParsedType.nan,
            received: ctx.parsedType
          });
          return parseUtil_1.INVALID;
        }
        return { status: "valid", value: input.data };
      }
    };
    exports2.ZodNaN = ZodNaN;
    ZodNaN.create = (params) => {
      return new ZodNaN({
        typeName: ZodFirstPartyTypeKind.ZodNaN,
        ...processCreateParams(params)
      });
    };
    exports2.BRAND = /* @__PURE__ */ Symbol("zod_brand");
    var ZodBranded = class extends ZodType {
      _parse(input) {
        const { ctx } = this._processInputParams(input);
        const data = ctx.data;
        return this._def.type._parse({
          data,
          path: ctx.path,
          parent: ctx
        });
      }
      unwrap() {
        return this._def.type;
      }
    };
    exports2.ZodBranded = ZodBranded;
    var ZodPipeline = class _ZodPipeline extends ZodType {
      _parse(input) {
        const { status, ctx } = this._processInputParams(input);
        if (ctx.common.async) {
          const handleAsync = async () => {
            const inResult = await this._def.in._parseAsync({
              data: ctx.data,
              path: ctx.path,
              parent: ctx
            });
            if (inResult.status === "aborted")
              return parseUtil_1.INVALID;
            if (inResult.status === "dirty") {
              status.dirty();
              return (0, parseUtil_1.DIRTY)(inResult.value);
            } else {
              return this._def.out._parseAsync({
                data: inResult.value,
                path: ctx.path,
                parent: ctx
              });
            }
          };
          return handleAsync();
        } else {
          const inResult = this._def.in._parseSync({
            data: ctx.data,
            path: ctx.path,
            parent: ctx
          });
          if (inResult.status === "aborted")
            return parseUtil_1.INVALID;
          if (inResult.status === "dirty") {
            status.dirty();
            return {
              status: "dirty",
              value: inResult.value
            };
          } else {
            return this._def.out._parseSync({
              data: inResult.value,
              path: ctx.path,
              parent: ctx
            });
          }
        }
      }
      static create(a2, b2) {
        return new _ZodPipeline({
          in: a2,
          out: b2,
          typeName: ZodFirstPartyTypeKind.ZodPipeline
        });
      }
    };
    exports2.ZodPipeline = ZodPipeline;
    var ZodReadonly = class extends ZodType {
      _parse(input) {
        const result = this._def.innerType._parse(input);
        const freeze = (data) => {
          if ((0, parseUtil_1.isValid)(data)) {
            data.value = Object.freeze(data.value);
          }
          return data;
        };
        return (0, parseUtil_1.isAsync)(result) ? result.then((data) => freeze(data)) : freeze(result);
      }
      unwrap() {
        return this._def.innerType;
      }
    };
    exports2.ZodReadonly = ZodReadonly;
    ZodReadonly.create = (type, params) => {
      return new ZodReadonly({
        innerType: type,
        typeName: ZodFirstPartyTypeKind.ZodReadonly,
        ...processCreateParams(params)
      });
    };
    function cleanParams(params, data) {
      const p2 = typeof params === "function" ? params(data) : typeof params === "string" ? { message: params } : params;
      const p22 = typeof p2 === "string" ? { message: p2 } : p2;
      return p22;
    }
    function custom(check, _params = {}, fatal) {
      if (check)
        return ZodAny.create().superRefine((data, ctx) => {
          var _a, _b;
          const r2 = check(data);
          if (r2 instanceof Promise) {
            return r2.then((r3) => {
              var _a2, _b2;
              if (!r3) {
                const params = cleanParams(_params, data);
                const _fatal = (_b2 = (_a2 = params.fatal) !== null && _a2 !== void 0 ? _a2 : fatal) !== null && _b2 !== void 0 ? _b2 : true;
                ctx.addIssue({ code: "custom", ...params, fatal: _fatal });
              }
            });
          }
          if (!r2) {
            const params = cleanParams(_params, data);
            const _fatal = (_b = (_a = params.fatal) !== null && _a !== void 0 ? _a : fatal) !== null && _b !== void 0 ? _b : true;
            ctx.addIssue({ code: "custom", ...params, fatal: _fatal });
          }
          return;
        });
      return ZodAny.create();
    }
    exports2.custom = custom;
    exports2.late = {
      object: ZodObject2.lazycreate
    };
    var ZodFirstPartyTypeKind;
    (function(ZodFirstPartyTypeKind2) {
      ZodFirstPartyTypeKind2["ZodString"] = "ZodString";
      ZodFirstPartyTypeKind2["ZodNumber"] = "ZodNumber";
      ZodFirstPartyTypeKind2["ZodNaN"] = "ZodNaN";
      ZodFirstPartyTypeKind2["ZodBigInt"] = "ZodBigInt";
      ZodFirstPartyTypeKind2["ZodBoolean"] = "ZodBoolean";
      ZodFirstPartyTypeKind2["ZodDate"] = "ZodDate";
      ZodFirstPartyTypeKind2["ZodSymbol"] = "ZodSymbol";
      ZodFirstPartyTypeKind2["ZodUndefined"] = "ZodUndefined";
      ZodFirstPartyTypeKind2["ZodNull"] = "ZodNull";
      ZodFirstPartyTypeKind2["ZodAny"] = "ZodAny";
      ZodFirstPartyTypeKind2["ZodUnknown"] = "ZodUnknown";
      ZodFirstPartyTypeKind2["ZodNever"] = "ZodNever";
      ZodFirstPartyTypeKind2["ZodVoid"] = "ZodVoid";
      ZodFirstPartyTypeKind2["ZodArray"] = "ZodArray";
      ZodFirstPartyTypeKind2["ZodObject"] = "ZodObject";
      ZodFirstPartyTypeKind2["ZodUnion"] = "ZodUnion";
      ZodFirstPartyTypeKind2["ZodDiscriminatedUnion"] = "ZodDiscriminatedUnion";
      ZodFirstPartyTypeKind2["ZodIntersection"] = "ZodIntersection";
      ZodFirstPartyTypeKind2["ZodTuple"] = "ZodTuple";
      ZodFirstPartyTypeKind2["ZodRecord"] = "ZodRecord";
      ZodFirstPartyTypeKind2["ZodMap"] = "ZodMap";
      ZodFirstPartyTypeKind2["ZodSet"] = "ZodSet";
      ZodFirstPartyTypeKind2["ZodFunction"] = "ZodFunction";
      ZodFirstPartyTypeKind2["ZodLazy"] = "ZodLazy";
      ZodFirstPartyTypeKind2["ZodLiteral"] = "ZodLiteral";
      ZodFirstPartyTypeKind2["ZodEnum"] = "ZodEnum";
      ZodFirstPartyTypeKind2["ZodEffects"] = "ZodEffects";
      ZodFirstPartyTypeKind2["ZodNativeEnum"] = "ZodNativeEnum";
      ZodFirstPartyTypeKind2["ZodOptional"] = "ZodOptional";
      ZodFirstPartyTypeKind2["ZodNullable"] = "ZodNullable";
      ZodFirstPartyTypeKind2["ZodDefault"] = "ZodDefault";
      ZodFirstPartyTypeKind2["ZodCatch"] = "ZodCatch";
      ZodFirstPartyTypeKind2["ZodPromise"] = "ZodPromise";
      ZodFirstPartyTypeKind2["ZodBranded"] = "ZodBranded";
      ZodFirstPartyTypeKind2["ZodPipeline"] = "ZodPipeline";
      ZodFirstPartyTypeKind2["ZodReadonly"] = "ZodReadonly";
    })(ZodFirstPartyTypeKind || (exports2.ZodFirstPartyTypeKind = ZodFirstPartyTypeKind = {}));
    var instanceOfType = (cls, params = {
      message: `Input not instance of ${cls.name}`
    }) => custom((data) => data instanceof cls, params);
    exports2.instanceof = instanceOfType;
    var stringType = ZodString.create;
    exports2.string = stringType;
    var numberType = ZodNumber.create;
    exports2.number = numberType;
    var nanType = ZodNaN.create;
    exports2.nan = nanType;
    var bigIntType = ZodBigInt.create;
    exports2.bigint = bigIntType;
    var booleanType = ZodBoolean.create;
    exports2.boolean = booleanType;
    var dateType = ZodDate.create;
    exports2.date = dateType;
    var symbolType = ZodSymbol.create;
    exports2.symbol = symbolType;
    var undefinedType = ZodUndefined.create;
    exports2.undefined = undefinedType;
    var nullType = ZodNull.create;
    exports2.null = nullType;
    var anyType = ZodAny.create;
    exports2.any = anyType;
    var unknownType = ZodUnknown.create;
    exports2.unknown = unknownType;
    var neverType = ZodNever.create;
    exports2.never = neverType;
    var voidType = ZodVoid.create;
    exports2.void = voidType;
    var arrayType = ZodArray.create;
    exports2.array = arrayType;
    var objectType = ZodObject2.create;
    exports2.object = objectType;
    var strictObjectType = ZodObject2.strictCreate;
    exports2.strictObject = strictObjectType;
    var unionType = ZodUnion.create;
    exports2.union = unionType;
    var discriminatedUnionType = ZodDiscriminatedUnion.create;
    exports2.discriminatedUnion = discriminatedUnionType;
    var intersectionType = ZodIntersection.create;
    exports2.intersection = intersectionType;
    var tupleType = ZodTuple.create;
    exports2.tuple = tupleType;
    var recordType = ZodRecord.create;
    exports2.record = recordType;
    var mapType = ZodMap.create;
    exports2.map = mapType;
    var setType = ZodSet.create;
    exports2.set = setType;
    var functionType = ZodFunction.create;
    exports2.function = functionType;
    var lazyType = ZodLazy.create;
    exports2.lazy = lazyType;
    var literalType = ZodLiteral.create;
    exports2.literal = literalType;
    var enumType = ZodEnum.create;
    exports2.enum = enumType;
    var nativeEnumType = ZodNativeEnum.create;
    exports2.nativeEnum = nativeEnumType;
    var promiseType = ZodPromise.create;
    exports2.promise = promiseType;
    var effectsType = ZodEffects.create;
    exports2.effect = effectsType;
    exports2.transformer = effectsType;
    var optionalType = ZodOptional.create;
    exports2.optional = optionalType;
    var nullableType = ZodNullable.create;
    exports2.nullable = nullableType;
    var preprocessType = ZodEffects.createWithPreprocess;
    exports2.preprocess = preprocessType;
    var pipelineType = ZodPipeline.create;
    exports2.pipeline = pipelineType;
    var ostring = () => stringType().optional();
    exports2.ostring = ostring;
    var onumber = () => numberType().optional();
    exports2.onumber = onumber;
    var oboolean = () => booleanType().optional();
    exports2.oboolean = oboolean;
    exports2.coerce = {
      string: ((arg) => ZodString.create({ ...arg, coerce: true })),
      number: ((arg) => ZodNumber.create({ ...arg, coerce: true })),
      boolean: ((arg) => ZodBoolean.create({
        ...arg,
        coerce: true
      })),
      bigint: ((arg) => ZodBigInt.create({ ...arg, coerce: true })),
      date: ((arg) => ZodDate.create({ ...arg, coerce: true }))
    };
    exports2.NEVER = parseUtil_1.INVALID;
  }
});

// ../../node_modules/.pnpm/zod@3.24.4/node_modules/zod/lib/external.js
var require_external = __commonJS({
  "../../node_modules/.pnpm/zod@3.24.4/node_modules/zod/lib/external.js"(exports2) {
    "use strict";
    var __createBinding = exports2 && exports2.__createBinding || (Object.create ? (function(o2, m2, k2, k22) {
      if (k22 === void 0) k22 = k2;
      var desc = Object.getOwnPropertyDescriptor(m2, k2);
      if (!desc || ("get" in desc ? !m2.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m2[k2];
        } };
      }
      Object.defineProperty(o2, k22, desc);
    }) : (function(o2, m2, k2, k22) {
      if (k22 === void 0) k22 = k2;
      o2[k22] = m2[k2];
    }));
    var __exportStar = exports2 && exports2.__exportStar || function(m2, exports3) {
      for (var p2 in m2) if (p2 !== "default" && !Object.prototype.hasOwnProperty.call(exports3, p2)) __createBinding(exports3, m2, p2);
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    __exportStar(require_errors(), exports2);
    __exportStar(require_parseUtil(), exports2);
    __exportStar(require_typeAliases(), exports2);
    __exportStar(require_util(), exports2);
    __exportStar(require_types(), exports2);
    __exportStar(require_ZodError(), exports2);
  }
});

// ../../node_modules/.pnpm/zod@3.24.4/node_modules/zod/lib/index.js
var require_lib = __commonJS({
  "../../node_modules/.pnpm/zod@3.24.4/node_modules/zod/lib/index.js"(exports2) {
    "use strict";
    var __createBinding = exports2 && exports2.__createBinding || (Object.create ? (function(o2, m2, k2, k22) {
      if (k22 === void 0) k22 = k2;
      var desc = Object.getOwnPropertyDescriptor(m2, k2);
      if (!desc || ("get" in desc ? !m2.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m2[k2];
        } };
      }
      Object.defineProperty(o2, k22, desc);
    }) : (function(o2, m2, k2, k22) {
      if (k22 === void 0) k22 = k2;
      o2[k22] = m2[k2];
    }));
    var __setModuleDefault = exports2 && exports2.__setModuleDefault || (Object.create ? (function(o2, v2) {
      Object.defineProperty(o2, "default", { enumerable: true, value: v2 });
    }) : function(o2, v2) {
      o2["default"] = v2;
    });
    var __importStar = exports2 && exports2.__importStar || function(mod) {
      if (mod && mod.__esModule) return mod;
      var result = {};
      if (mod != null) {
        for (var k2 in mod) if (k2 !== "default" && Object.prototype.hasOwnProperty.call(mod, k2)) __createBinding(result, mod, k2);
      }
      __setModuleDefault(result, mod);
      return result;
    };
    var __exportStar = exports2 && exports2.__exportStar || function(m2, exports3) {
      for (var p2 in m2) if (p2 !== "default" && !Object.prototype.hasOwnProperty.call(exports3, p2)) __createBinding(exports3, m2, p2);
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.z = void 0;
    var z15 = __importStar(require_external());
    exports2.z = z15;
    __exportStar(require_external(), exports2);
    exports2.default = z15;
  }
});

// ../../node_modules/.pnpm/universalify@2.0.1/node_modules/universalify/index.js
var require_universalify = __commonJS({
  "../../node_modules/.pnpm/universalify@2.0.1/node_modules/universalify/index.js"(exports2) {
    "use strict";
    exports2.fromCallback = function(fn) {
      return Object.defineProperty(function(...args) {
        if (typeof args[args.length - 1] === "function") fn.apply(this, args);
        else {
          return new Promise((resolve, reject) => {
            args.push((err, res) => err != null ? reject(err) : resolve(res));
            fn.apply(this, args);
          });
        }
      }, "name", { value: fn.name });
    };
    exports2.fromPromise = function(fn) {
      return Object.defineProperty(function(...args) {
        const cb = args[args.length - 1];
        if (typeof cb !== "function") return fn.apply(this, args);
        else {
          args.pop();
          fn.apply(this, args).then((r2) => cb(null, r2), cb);
        }
      }, "name", { value: fn.name });
    };
  }
});

// ../../node_modules/.pnpm/graceful-fs@4.2.11/node_modules/graceful-fs/polyfills.js
var require_polyfills = __commonJS({
  "../../node_modules/.pnpm/graceful-fs@4.2.11/node_modules/graceful-fs/polyfills.js"(exports2, module2) {
    var constants = require("constants");
    var origCwd = process.cwd;
    var cwd = null;
    var platform = process.env.GRACEFUL_FS_PLATFORM || process.platform;
    process.cwd = function() {
      if (!cwd)
        cwd = origCwd.call(process);
      return cwd;
    };
    try {
      process.cwd();
    } catch (er) {
    }
    if (typeof process.chdir === "function") {
      chdir = process.chdir;
      process.chdir = function(d2) {
        cwd = null;
        chdir.call(process, d2);
      };
      if (Object.setPrototypeOf) Object.setPrototypeOf(process.chdir, chdir);
    }
    var chdir;
    module2.exports = patch;
    function patch(fs2) {
      if (constants.hasOwnProperty("O_SYMLINK") && process.version.match(/^v0\.6\.[0-2]|^v0\.5\./)) {
        patchLchmod(fs2);
      }
      if (!fs2.lutimes) {
        patchLutimes(fs2);
      }
      fs2.chown = chownFix(fs2.chown);
      fs2.fchown = chownFix(fs2.fchown);
      fs2.lchown = chownFix(fs2.lchown);
      fs2.chmod = chmodFix(fs2.chmod);
      fs2.fchmod = chmodFix(fs2.fchmod);
      fs2.lchmod = chmodFix(fs2.lchmod);
      fs2.chownSync = chownFixSync(fs2.chownSync);
      fs2.fchownSync = chownFixSync(fs2.fchownSync);
      fs2.lchownSync = chownFixSync(fs2.lchownSync);
      fs2.chmodSync = chmodFixSync(fs2.chmodSync);
      fs2.fchmodSync = chmodFixSync(fs2.fchmodSync);
      fs2.lchmodSync = chmodFixSync(fs2.lchmodSync);
      fs2.stat = statFix(fs2.stat);
      fs2.fstat = statFix(fs2.fstat);
      fs2.lstat = statFix(fs2.lstat);
      fs2.statSync = statFixSync(fs2.statSync);
      fs2.fstatSync = statFixSync(fs2.fstatSync);
      fs2.lstatSync = statFixSync(fs2.lstatSync);
      if (fs2.chmod && !fs2.lchmod) {
        fs2.lchmod = function(path6, mode, cb) {
          if (cb) process.nextTick(cb);
        };
        fs2.lchmodSync = function() {
        };
      }
      if (fs2.chown && !fs2.lchown) {
        fs2.lchown = function(path6, uid, gid, cb) {
          if (cb) process.nextTick(cb);
        };
        fs2.lchownSync = function() {
        };
      }
      if (platform === "win32") {
        fs2.rename = typeof fs2.rename !== "function" ? fs2.rename : (function(fs$rename) {
          function rename(from, to, cb) {
            var start = Date.now();
            var backoff = 0;
            fs$rename(from, to, function CB(er) {
              if (er && (er.code === "EACCES" || er.code === "EPERM" || er.code === "EBUSY") && Date.now() - start < 6e4) {
                setTimeout(function() {
                  fs2.stat(to, function(stater, st2) {
                    if (stater && stater.code === "ENOENT")
                      fs$rename(from, to, CB);
                    else
                      cb(er);
                  });
                }, backoff);
                if (backoff < 100)
                  backoff += 10;
                return;
              }
              if (cb) cb(er);
            });
          }
          if (Object.setPrototypeOf) Object.setPrototypeOf(rename, fs$rename);
          return rename;
        })(fs2.rename);
      }
      fs2.read = typeof fs2.read !== "function" ? fs2.read : (function(fs$read) {
        function read(fd, buffer, offset, length, position, callback_) {
          var callback;
          if (callback_ && typeof callback_ === "function") {
            var eagCounter = 0;
            callback = function(er, _2, __) {
              if (er && er.code === "EAGAIN" && eagCounter < 10) {
                eagCounter++;
                return fs$read.call(fs2, fd, buffer, offset, length, position, callback);
              }
              callback_.apply(this, arguments);
            };
          }
          return fs$read.call(fs2, fd, buffer, offset, length, position, callback);
        }
        if (Object.setPrototypeOf) Object.setPrototypeOf(read, fs$read);
        return read;
      })(fs2.read);
      fs2.readSync = typeof fs2.readSync !== "function" ? fs2.readSync : /* @__PURE__ */ (function(fs$readSync) {
        return function(fd, buffer, offset, length, position) {
          var eagCounter = 0;
          while (true) {
            try {
              return fs$readSync.call(fs2, fd, buffer, offset, length, position);
            } catch (er) {
              if (er.code === "EAGAIN" && eagCounter < 10) {
                eagCounter++;
                continue;
              }
              throw er;
            }
          }
        };
      })(fs2.readSync);
      function patchLchmod(fs3) {
        fs3.lchmod = function(path6, mode, callback) {
          fs3.open(
            path6,
            constants.O_WRONLY | constants.O_SYMLINK,
            mode,
            function(err, fd) {
              if (err) {
                if (callback) callback(err);
                return;
              }
              fs3.fchmod(fd, mode, function(err2) {
                fs3.close(fd, function(err22) {
                  if (callback) callback(err2 || err22);
                });
              });
            }
          );
        };
        fs3.lchmodSync = function(path6, mode) {
          var fd = fs3.openSync(path6, constants.O_WRONLY | constants.O_SYMLINK, mode);
          var threw = true;
          var ret;
          try {
            ret = fs3.fchmodSync(fd, mode);
            threw = false;
          } finally {
            if (threw) {
              try {
                fs3.closeSync(fd);
              } catch (er) {
              }
            } else {
              fs3.closeSync(fd);
            }
          }
          return ret;
        };
      }
      function patchLutimes(fs3) {
        if (constants.hasOwnProperty("O_SYMLINK") && fs3.futimes) {
          fs3.lutimes = function(path6, at2, mt2, cb) {
            fs3.open(path6, constants.O_SYMLINK, function(er, fd) {
              if (er) {
                if (cb) cb(er);
                return;
              }
              fs3.futimes(fd, at2, mt2, function(er2) {
                fs3.close(fd, function(er22) {
                  if (cb) cb(er2 || er22);
                });
              });
            });
          };
          fs3.lutimesSync = function(path6, at2, mt2) {
            var fd = fs3.openSync(path6, constants.O_SYMLINK);
            var ret;
            var threw = true;
            try {
              ret = fs3.futimesSync(fd, at2, mt2);
              threw = false;
            } finally {
              if (threw) {
                try {
                  fs3.closeSync(fd);
                } catch (er) {
                }
              } else {
                fs3.closeSync(fd);
              }
            }
            return ret;
          };
        } else if (fs3.futimes) {
          fs3.lutimes = function(_a, _b, _c, cb) {
            if (cb) process.nextTick(cb);
          };
          fs3.lutimesSync = function() {
          };
        }
      }
      function chmodFix(orig) {
        if (!orig) return orig;
        return function(target, mode, cb) {
          return orig.call(fs2, target, mode, function(er) {
            if (chownErOk(er)) er = null;
            if (cb) cb.apply(this, arguments);
          });
        };
      }
      function chmodFixSync(orig) {
        if (!orig) return orig;
        return function(target, mode) {
          try {
            return orig.call(fs2, target, mode);
          } catch (er) {
            if (!chownErOk(er)) throw er;
          }
        };
      }
      function chownFix(orig) {
        if (!orig) return orig;
        return function(target, uid, gid, cb) {
          return orig.call(fs2, target, uid, gid, function(er) {
            if (chownErOk(er)) er = null;
            if (cb) cb.apply(this, arguments);
          });
        };
      }
      function chownFixSync(orig) {
        if (!orig) return orig;
        return function(target, uid, gid) {
          try {
            return orig.call(fs2, target, uid, gid);
          } catch (er) {
            if (!chownErOk(er)) throw er;
          }
        };
      }
      function statFix(orig) {
        if (!orig) return orig;
        return function(target, options, cb) {
          if (typeof options === "function") {
            cb = options;
            options = null;
          }
          function callback(er, stats) {
            if (stats) {
              if (stats.uid < 0) stats.uid += 4294967296;
              if (stats.gid < 0) stats.gid += 4294967296;
            }
            if (cb) cb.apply(this, arguments);
          }
          return options ? orig.call(fs2, target, options, callback) : orig.call(fs2, target, callback);
        };
      }
      function statFixSync(orig) {
        if (!orig) return orig;
        return function(target, options) {
          var stats = options ? orig.call(fs2, target, options) : orig.call(fs2, target);
          if (stats) {
            if (stats.uid < 0) stats.uid += 4294967296;
            if (stats.gid < 0) stats.gid += 4294967296;
          }
          return stats;
        };
      }
      function chownErOk(er) {
        if (!er)
          return true;
        if (er.code === "ENOSYS")
          return true;
        var nonroot = !process.getuid || process.getuid() !== 0;
        if (nonroot) {
          if (er.code === "EINVAL" || er.code === "EPERM")
            return true;
        }
        return false;
      }
    }
  }
});

// ../../node_modules/.pnpm/graceful-fs@4.2.11/node_modules/graceful-fs/legacy-streams.js
var require_legacy_streams = __commonJS({
  "../../node_modules/.pnpm/graceful-fs@4.2.11/node_modules/graceful-fs/legacy-streams.js"(exports2, module2) {
    var Stream = require("stream").Stream;
    module2.exports = legacy;
    function legacy(fs2) {
      return {
        ReadStream,
        WriteStream
      };
      function ReadStream(path6, options) {
        if (!(this instanceof ReadStream)) return new ReadStream(path6, options);
        Stream.call(this);
        var self2 = this;
        this.path = path6;
        this.fd = null;
        this.readable = true;
        this.paused = false;
        this.flags = "r";
        this.mode = 438;
        this.bufferSize = 64 * 1024;
        options = options || {};
        var keys = Object.keys(options);
        for (var index = 0, length = keys.length; index < length; index++) {
          var key = keys[index];
          this[key] = options[key];
        }
        if (this.encoding) this.setEncoding(this.encoding);
        if (this.start !== void 0) {
          if ("number" !== typeof this.start) {
            throw TypeError("start must be a Number");
          }
          if (this.end === void 0) {
            this.end = Infinity;
          } else if ("number" !== typeof this.end) {
            throw TypeError("end must be a Number");
          }
          if (this.start > this.end) {
            throw new Error("start must be <= end");
          }
          this.pos = this.start;
        }
        if (this.fd !== null) {
          process.nextTick(function() {
            self2._read();
          });
          return;
        }
        fs2.open(this.path, this.flags, this.mode, function(err, fd) {
          if (err) {
            self2.emit("error", err);
            self2.readable = false;
            return;
          }
          self2.fd = fd;
          self2.emit("open", fd);
          self2._read();
        });
      }
      function WriteStream(path6, options) {
        if (!(this instanceof WriteStream)) return new WriteStream(path6, options);
        Stream.call(this);
        this.path = path6;
        this.fd = null;
        this.writable = true;
        this.flags = "w";
        this.encoding = "binary";
        this.mode = 438;
        this.bytesWritten = 0;
        options = options || {};
        var keys = Object.keys(options);
        for (var index = 0, length = keys.length; index < length; index++) {
          var key = keys[index];
          this[key] = options[key];
        }
        if (this.start !== void 0) {
          if ("number" !== typeof this.start) {
            throw TypeError("start must be a Number");
          }
          if (this.start < 0) {
            throw new Error("start must be >= zero");
          }
          this.pos = this.start;
        }
        this.busy = false;
        this._queue = [];
        if (this.fd === null) {
          this._open = fs2.open;
          this._queue.push([this._open, this.path, this.flags, this.mode, void 0]);
          this.flush();
        }
      }
    }
  }
});

// ../../node_modules/.pnpm/graceful-fs@4.2.11/node_modules/graceful-fs/clone.js
var require_clone = __commonJS({
  "../../node_modules/.pnpm/graceful-fs@4.2.11/node_modules/graceful-fs/clone.js"(exports2, module2) {
    "use strict";
    module2.exports = clone;
    var getPrototypeOf = Object.getPrototypeOf || function(obj) {
      return obj.__proto__;
    };
    function clone(obj) {
      if (obj === null || typeof obj !== "object")
        return obj;
      if (obj instanceof Object)
        var copy = { __proto__: getPrototypeOf(obj) };
      else
        var copy = /* @__PURE__ */ Object.create(null);
      Object.getOwnPropertyNames(obj).forEach(function(key) {
        Object.defineProperty(copy, key, Object.getOwnPropertyDescriptor(obj, key));
      });
      return copy;
    }
  }
});

// ../../node_modules/.pnpm/graceful-fs@4.2.11/node_modules/graceful-fs/graceful-fs.js
var require_graceful_fs = __commonJS({
  "../../node_modules/.pnpm/graceful-fs@4.2.11/node_modules/graceful-fs/graceful-fs.js"(exports2, module2) {
    var fs2 = require("fs");
    var polyfills = require_polyfills();
    var legacy = require_legacy_streams();
    var clone = require_clone();
    var util = require("util");
    var gracefulQueue;
    var previousSymbol;
    if (typeof Symbol === "function" && typeof Symbol.for === "function") {
      gracefulQueue = /* @__PURE__ */ Symbol.for("graceful-fs.queue");
      previousSymbol = /* @__PURE__ */ Symbol.for("graceful-fs.previous");
    } else {
      gracefulQueue = "___graceful-fs.queue";
      previousSymbol = "___graceful-fs.previous";
    }
    function noop() {
    }
    function publishQueue(context, queue2) {
      Object.defineProperty(context, gracefulQueue, {
        get: function() {
          return queue2;
        }
      });
    }
    var debug = noop;
    if (util.debuglog)
      debug = util.debuglog("gfs4");
    else if (/\bgfs4\b/i.test(process.env.NODE_DEBUG || ""))
      debug = function() {
        var m2 = util.format.apply(util, arguments);
        m2 = "GFS4: " + m2.split(/\n/).join("\nGFS4: ");
        console.error(m2);
      };
    if (!fs2[gracefulQueue]) {
      queue = global[gracefulQueue] || [];
      publishQueue(fs2, queue);
      fs2.close = (function(fs$close) {
        function close(fd, cb) {
          return fs$close.call(fs2, fd, function(err) {
            if (!err) {
              resetQueue();
            }
            if (typeof cb === "function")
              cb.apply(this, arguments);
          });
        }
        Object.defineProperty(close, previousSymbol, {
          value: fs$close
        });
        return close;
      })(fs2.close);
      fs2.closeSync = (function(fs$closeSync) {
        function closeSync(fd) {
          fs$closeSync.apply(fs2, arguments);
          resetQueue();
        }
        Object.defineProperty(closeSync, previousSymbol, {
          value: fs$closeSync
        });
        return closeSync;
      })(fs2.closeSync);
      if (/\bgfs4\b/i.test(process.env.NODE_DEBUG || "")) {
        process.on("exit", function() {
          debug(fs2[gracefulQueue]);
          require("assert").equal(fs2[gracefulQueue].length, 0);
        });
      }
    }
    var queue;
    if (!global[gracefulQueue]) {
      publishQueue(global, fs2[gracefulQueue]);
    }
    module2.exports = patch(clone(fs2));
    if (process.env.TEST_GRACEFUL_FS_GLOBAL_PATCH && !fs2.__patched) {
      module2.exports = patch(fs2);
      fs2.__patched = true;
    }
    function patch(fs3) {
      polyfills(fs3);
      fs3.gracefulify = patch;
      fs3.createReadStream = createReadStream;
      fs3.createWriteStream = createWriteStream;
      var fs$readFile = fs3.readFile;
      fs3.readFile = readFile;
      function readFile(path6, options, cb) {
        if (typeof options === "function")
          cb = options, options = null;
        return go$readFile(path6, options, cb);
        function go$readFile(path7, options2, cb2, startTime) {
          return fs$readFile(path7, options2, function(err) {
            if (err && (err.code === "EMFILE" || err.code === "ENFILE"))
              enqueue([go$readFile, [path7, options2, cb2], err, startTime || Date.now(), Date.now()]);
            else {
              if (typeof cb2 === "function")
                cb2.apply(this, arguments);
            }
          });
        }
      }
      var fs$writeFile = fs3.writeFile;
      fs3.writeFile = writeFile;
      function writeFile(path6, data, options, cb) {
        if (typeof options === "function")
          cb = options, options = null;
        return go$writeFile(path6, data, options, cb);
        function go$writeFile(path7, data2, options2, cb2, startTime) {
          return fs$writeFile(path7, data2, options2, function(err) {
            if (err && (err.code === "EMFILE" || err.code === "ENFILE"))
              enqueue([go$writeFile, [path7, data2, options2, cb2], err, startTime || Date.now(), Date.now()]);
            else {
              if (typeof cb2 === "function")
                cb2.apply(this, arguments);
            }
          });
        }
      }
      var fs$appendFile = fs3.appendFile;
      if (fs$appendFile)
        fs3.appendFile = appendFile;
      function appendFile(path6, data, options, cb) {
        if (typeof options === "function")
          cb = options, options = null;
        return go$appendFile(path6, data, options, cb);
        function go$appendFile(path7, data2, options2, cb2, startTime) {
          return fs$appendFile(path7, data2, options2, function(err) {
            if (err && (err.code === "EMFILE" || err.code === "ENFILE"))
              enqueue([go$appendFile, [path7, data2, options2, cb2], err, startTime || Date.now(), Date.now()]);
            else {
              if (typeof cb2 === "function")
                cb2.apply(this, arguments);
            }
          });
        }
      }
      var fs$copyFile = fs3.copyFile;
      if (fs$copyFile)
        fs3.copyFile = copyFile;
      function copyFile(src, dest, flags, cb) {
        if (typeof flags === "function") {
          cb = flags;
          flags = 0;
        }
        return go$copyFile(src, dest, flags, cb);
        function go$copyFile(src2, dest2, flags2, cb2, startTime) {
          return fs$copyFile(src2, dest2, flags2, function(err) {
            if (err && (err.code === "EMFILE" || err.code === "ENFILE"))
              enqueue([go$copyFile, [src2, dest2, flags2, cb2], err, startTime || Date.now(), Date.now()]);
            else {
              if (typeof cb2 === "function")
                cb2.apply(this, arguments);
            }
          });
        }
      }
      var fs$readdir = fs3.readdir;
      fs3.readdir = readdir;
      var noReaddirOptionVersions = /^v[0-5]\./;
      function readdir(path6, options, cb) {
        if (typeof options === "function")
          cb = options, options = null;
        var go$readdir = noReaddirOptionVersions.test(process.version) ? function go$readdir2(path7, options2, cb2, startTime) {
          return fs$readdir(path7, fs$readdirCallback(
            path7,
            options2,
            cb2,
            startTime
          ));
        } : function go$readdir2(path7, options2, cb2, startTime) {
          return fs$readdir(path7, options2, fs$readdirCallback(
            path7,
            options2,
            cb2,
            startTime
          ));
        };
        return go$readdir(path6, options, cb);
        function fs$readdirCallback(path7, options2, cb2, startTime) {
          return function(err, files) {
            if (err && (err.code === "EMFILE" || err.code === "ENFILE"))
              enqueue([
                go$readdir,
                [path7, options2, cb2],
                err,
                startTime || Date.now(),
                Date.now()
              ]);
            else {
              if (files && files.sort)
                files.sort();
              if (typeof cb2 === "function")
                cb2.call(this, err, files);
            }
          };
        }
      }
      if (process.version.substr(0, 4) === "v0.8") {
        var legStreams = legacy(fs3);
        ReadStream = legStreams.ReadStream;
        WriteStream = legStreams.WriteStream;
      }
      var fs$ReadStream = fs3.ReadStream;
      if (fs$ReadStream) {
        ReadStream.prototype = Object.create(fs$ReadStream.prototype);
        ReadStream.prototype.open = ReadStream$open;
      }
      var fs$WriteStream = fs3.WriteStream;
      if (fs$WriteStream) {
        WriteStream.prototype = Object.create(fs$WriteStream.prototype);
        WriteStream.prototype.open = WriteStream$open;
      }
      Object.defineProperty(fs3, "ReadStream", {
        get: function() {
          return ReadStream;
        },
        set: function(val) {
          ReadStream = val;
        },
        enumerable: true,
        configurable: true
      });
      Object.defineProperty(fs3, "WriteStream", {
        get: function() {
          return WriteStream;
        },
        set: function(val) {
          WriteStream = val;
        },
        enumerable: true,
        configurable: true
      });
      var FileReadStream = ReadStream;
      Object.defineProperty(fs3, "FileReadStream", {
        get: function() {
          return FileReadStream;
        },
        set: function(val) {
          FileReadStream = val;
        },
        enumerable: true,
        configurable: true
      });
      var FileWriteStream = WriteStream;
      Object.defineProperty(fs3, "FileWriteStream", {
        get: function() {
          return FileWriteStream;
        },
        set: function(val) {
          FileWriteStream = val;
        },
        enumerable: true,
        configurable: true
      });
      function ReadStream(path6, options) {
        if (this instanceof ReadStream)
          return fs$ReadStream.apply(this, arguments), this;
        else
          return ReadStream.apply(Object.create(ReadStream.prototype), arguments);
      }
      function ReadStream$open() {
        var that = this;
        open(that.path, that.flags, that.mode, function(err, fd) {
          if (err) {
            if (that.autoClose)
              that.destroy();
            that.emit("error", err);
          } else {
            that.fd = fd;
            that.emit("open", fd);
            that.read();
          }
        });
      }
      function WriteStream(path6, options) {
        if (this instanceof WriteStream)
          return fs$WriteStream.apply(this, arguments), this;
        else
          return WriteStream.apply(Object.create(WriteStream.prototype), arguments);
      }
      function WriteStream$open() {
        var that = this;
        open(that.path, that.flags, that.mode, function(err, fd) {
          if (err) {
            that.destroy();
            that.emit("error", err);
          } else {
            that.fd = fd;
            that.emit("open", fd);
          }
        });
      }
      function createReadStream(path6, options) {
        return new fs3.ReadStream(path6, options);
      }
      function createWriteStream(path6, options) {
        return new fs3.WriteStream(path6, options);
      }
      var fs$open = fs3.open;
      fs3.open = open;
      function open(path6, flags, mode, cb) {
        if (typeof mode === "function")
          cb = mode, mode = null;
        return go$open(path6, flags, mode, cb);
        function go$open(path7, flags2, mode2, cb2, startTime) {
          return fs$open(path7, flags2, mode2, function(err, fd) {
            if (err && (err.code === "EMFILE" || err.code === "ENFILE"))
              enqueue([go$open, [path7, flags2, mode2, cb2], err, startTime || Date.now(), Date.now()]);
            else {
              if (typeof cb2 === "function")
                cb2.apply(this, arguments);
            }
          });
        }
      }
      return fs3;
    }
    function enqueue(elem) {
      debug("ENQUEUE", elem[0].name, elem[1]);
      fs2[gracefulQueue].push(elem);
      retry();
    }
    var retryTimer;
    function resetQueue() {
      var now2 = Date.now();
      for (var i2 = 0; i2 < fs2[gracefulQueue].length; ++i2) {
        if (fs2[gracefulQueue][i2].length > 2) {
          fs2[gracefulQueue][i2][3] = now2;
          fs2[gracefulQueue][i2][4] = now2;
        }
      }
      retry();
    }
    function retry() {
      clearTimeout(retryTimer);
      retryTimer = void 0;
      if (fs2[gracefulQueue].length === 0)
        return;
      var elem = fs2[gracefulQueue].shift();
      var fn = elem[0];
      var args = elem[1];
      var err = elem[2];
      var startTime = elem[3];
      var lastTime = elem[4];
      if (startTime === void 0) {
        debug("RETRY", fn.name, args);
        fn.apply(null, args);
      } else if (Date.now() - startTime >= 6e4) {
        debug("TIMEOUT", fn.name, args);
        var cb = args.pop();
        if (typeof cb === "function")
          cb.call(null, err);
      } else {
        var sinceAttempt = Date.now() - lastTime;
        var sinceStart = Math.max(lastTime - startTime, 1);
        var desiredDelay = Math.min(sinceStart * 1.2, 100);
        if (sinceAttempt >= desiredDelay) {
          debug("RETRY", fn.name, args);
          fn.apply(null, args.concat([startTime]));
        } else {
          fs2[gracefulQueue].push(elem);
        }
      }
      if (retryTimer === void 0) {
        retryTimer = setTimeout(retry, 0);
      }
    }
  }
});

// ../../node_modules/.pnpm/fs-extra@11.3.0/node_modules/fs-extra/lib/fs/index.js
var require_fs = __commonJS({
  "../../node_modules/.pnpm/fs-extra@11.3.0/node_modules/fs-extra/lib/fs/index.js"(exports2) {
    "use strict";
    var u2 = require_universalify().fromCallback;
    var fs2 = require_graceful_fs();
    var api = [
      "access",
      "appendFile",
      "chmod",
      "chown",
      "close",
      "copyFile",
      "cp",
      "fchmod",
      "fchown",
      "fdatasync",
      "fstat",
      "fsync",
      "ftruncate",
      "futimes",
      "glob",
      "lchmod",
      "lchown",
      "lutimes",
      "link",
      "lstat",
      "mkdir",
      "mkdtemp",
      "open",
      "opendir",
      "readdir",
      "readFile",
      "readlink",
      "realpath",
      "rename",
      "rm",
      "rmdir",
      "stat",
      "statfs",
      "symlink",
      "truncate",
      "unlink",
      "utimes",
      "writeFile"
    ].filter((key) => {
      return typeof fs2[key] === "function";
    });
    Object.assign(exports2, fs2);
    api.forEach((method) => {
      exports2[method] = u2(fs2[method]);
    });
    exports2.exists = function(filename, callback) {
      if (typeof callback === "function") {
        return fs2.exists(filename, callback);
      }
      return new Promise((resolve) => {
        return fs2.exists(filename, resolve);
      });
    };
    exports2.read = function(fd, buffer, offset, length, position, callback) {
      if (typeof callback === "function") {
        return fs2.read(fd, buffer, offset, length, position, callback);
      }
      return new Promise((resolve, reject) => {
        fs2.read(fd, buffer, offset, length, position, (err, bytesRead, buffer2) => {
          if (err) return reject(err);
          resolve({ bytesRead, buffer: buffer2 });
        });
      });
    };
    exports2.write = function(fd, buffer, ...args) {
      if (typeof args[args.length - 1] === "function") {
        return fs2.write(fd, buffer, ...args);
      }
      return new Promise((resolve, reject) => {
        fs2.write(fd, buffer, ...args, (err, bytesWritten, buffer2) => {
          if (err) return reject(err);
          resolve({ bytesWritten, buffer: buffer2 });
        });
      });
    };
    exports2.readv = function(fd, buffers, ...args) {
      if (typeof args[args.length - 1] === "function") {
        return fs2.readv(fd, buffers, ...args);
      }
      return new Promise((resolve, reject) => {
        fs2.readv(fd, buffers, ...args, (err, bytesRead, buffers2) => {
          if (err) return reject(err);
          resolve({ bytesRead, buffers: buffers2 });
        });
      });
    };
    exports2.writev = function(fd, buffers, ...args) {
      if (typeof args[args.length - 1] === "function") {
        return fs2.writev(fd, buffers, ...args);
      }
      return new Promise((resolve, reject) => {
        fs2.writev(fd, buffers, ...args, (err, bytesWritten, buffers2) => {
          if (err) return reject(err);
          resolve({ bytesWritten, buffers: buffers2 });
        });
      });
    };
    if (typeof fs2.realpath.native === "function") {
      exports2.realpath.native = u2(fs2.realpath.native);
    } else {
      process.emitWarning(
        "fs.realpath.native is not a function. Is fs being monkey-patched?",
        "Warning",
        "fs-extra-WARN0003"
      );
    }
  }
});

// ../../node_modules/.pnpm/fs-extra@11.3.0/node_modules/fs-extra/lib/mkdirs/utils.js
var require_utils = __commonJS({
  "../../node_modules/.pnpm/fs-extra@11.3.0/node_modules/fs-extra/lib/mkdirs/utils.js"(exports2, module2) {
    "use strict";
    var path6 = require("path");
    module2.exports.checkPath = function checkPath(pth) {
      if (process.platform === "win32") {
        const pathHasInvalidWinCharacters = /[<>:"|?*]/.test(pth.replace(path6.parse(pth).root, ""));
        if (pathHasInvalidWinCharacters) {
          const error = new Error(`Path contains invalid characters: ${pth}`);
          error.code = "EINVAL";
          throw error;
        }
      }
    };
  }
});

// ../../node_modules/.pnpm/fs-extra@11.3.0/node_modules/fs-extra/lib/mkdirs/make-dir.js
var require_make_dir = __commonJS({
  "../../node_modules/.pnpm/fs-extra@11.3.0/node_modules/fs-extra/lib/mkdirs/make-dir.js"(exports2, module2) {
    "use strict";
    var fs2 = require_fs();
    var { checkPath } = require_utils();
    var getMode = (options) => {
      const defaults = { mode: 511 };
      if (typeof options === "number") return options;
      return { ...defaults, ...options }.mode;
    };
    module2.exports.makeDir = async (dir, options) => {
      checkPath(dir);
      return fs2.mkdir(dir, {
        mode: getMode(options),
        recursive: true
      });
    };
    module2.exports.makeDirSync = (dir, options) => {
      checkPath(dir);
      return fs2.mkdirSync(dir, {
        mode: getMode(options),
        recursive: true
      });
    };
  }
});

// ../../node_modules/.pnpm/fs-extra@11.3.0/node_modules/fs-extra/lib/mkdirs/index.js
var require_mkdirs = __commonJS({
  "../../node_modules/.pnpm/fs-extra@11.3.0/node_modules/fs-extra/lib/mkdirs/index.js"(exports2, module2) {
    "use strict";
    var u2 = require_universalify().fromPromise;
    var { makeDir: _makeDir, makeDirSync } = require_make_dir();
    var makeDir = u2(_makeDir);
    module2.exports = {
      mkdirs: makeDir,
      mkdirsSync: makeDirSync,
      // alias
      mkdirp: makeDir,
      mkdirpSync: makeDirSync,
      ensureDir: makeDir,
      ensureDirSync: makeDirSync
    };
  }
});

// ../../node_modules/.pnpm/fs-extra@11.3.0/node_modules/fs-extra/lib/path-exists/index.js
var require_path_exists = __commonJS({
  "../../node_modules/.pnpm/fs-extra@11.3.0/node_modules/fs-extra/lib/path-exists/index.js"(exports2, module2) {
    "use strict";
    var u2 = require_universalify().fromPromise;
    var fs2 = require_fs();
    function pathExists(path6) {
      return fs2.access(path6).then(() => true).catch(() => false);
    }
    module2.exports = {
      pathExists: u2(pathExists),
      pathExistsSync: fs2.existsSync
    };
  }
});

// ../../node_modules/.pnpm/fs-extra@11.3.0/node_modules/fs-extra/lib/util/utimes.js
var require_utimes = __commonJS({
  "../../node_modules/.pnpm/fs-extra@11.3.0/node_modules/fs-extra/lib/util/utimes.js"(exports2, module2) {
    "use strict";
    var fs2 = require_fs();
    var u2 = require_universalify().fromPromise;
    async function utimesMillis(path6, atime, mtime) {
      const fd = await fs2.open(path6, "r+");
      let closeErr = null;
      try {
        await fs2.futimes(fd, atime, mtime);
      } finally {
        try {
          await fs2.close(fd);
        } catch (e2) {
          closeErr = e2;
        }
      }
      if (closeErr) {
        throw closeErr;
      }
    }
    function utimesMillisSync(path6, atime, mtime) {
      const fd = fs2.openSync(path6, "r+");
      fs2.futimesSync(fd, atime, mtime);
      return fs2.closeSync(fd);
    }
    module2.exports = {
      utimesMillis: u2(utimesMillis),
      utimesMillisSync
    };
  }
});

// ../../node_modules/.pnpm/fs-extra@11.3.0/node_modules/fs-extra/lib/util/stat.js
var require_stat = __commonJS({
  "../../node_modules/.pnpm/fs-extra@11.3.0/node_modules/fs-extra/lib/util/stat.js"(exports2, module2) {
    "use strict";
    var fs2 = require_fs();
    var path6 = require("path");
    var u2 = require_universalify().fromPromise;
    function getStats(src, dest, opts) {
      const statFunc = opts.dereference ? (file) => fs2.stat(file, { bigint: true }) : (file) => fs2.lstat(file, { bigint: true });
      return Promise.all([
        statFunc(src),
        statFunc(dest).catch((err) => {
          if (err.code === "ENOENT") return null;
          throw err;
        })
      ]).then(([srcStat, destStat]) => ({ srcStat, destStat }));
    }
    function getStatsSync(src, dest, opts) {
      let destStat;
      const statFunc = opts.dereference ? (file) => fs2.statSync(file, { bigint: true }) : (file) => fs2.lstatSync(file, { bigint: true });
      const srcStat = statFunc(src);
      try {
        destStat = statFunc(dest);
      } catch (err) {
        if (err.code === "ENOENT") return { srcStat, destStat: null };
        throw err;
      }
      return { srcStat, destStat };
    }
    async function checkPaths(src, dest, funcName, opts) {
      const { srcStat, destStat } = await getStats(src, dest, opts);
      if (destStat) {
        if (areIdentical(srcStat, destStat)) {
          const srcBaseName = path6.basename(src);
          const destBaseName = path6.basename(dest);
          if (funcName === "move" && srcBaseName !== destBaseName && srcBaseName.toLowerCase() === destBaseName.toLowerCase()) {
            return { srcStat, destStat, isChangingCase: true };
          }
          throw new Error("Source and destination must not be the same.");
        }
        if (srcStat.isDirectory() && !destStat.isDirectory()) {
          throw new Error(`Cannot overwrite non-directory '${dest}' with directory '${src}'.`);
        }
        if (!srcStat.isDirectory() && destStat.isDirectory()) {
          throw new Error(`Cannot overwrite directory '${dest}' with non-directory '${src}'.`);
        }
      }
      if (srcStat.isDirectory() && isSrcSubdir(src, dest)) {
        throw new Error(errMsg(src, dest, funcName));
      }
      return { srcStat, destStat };
    }
    function checkPathsSync(src, dest, funcName, opts) {
      const { srcStat, destStat } = getStatsSync(src, dest, opts);
      if (destStat) {
        if (areIdentical(srcStat, destStat)) {
          const srcBaseName = path6.basename(src);
          const destBaseName = path6.basename(dest);
          if (funcName === "move" && srcBaseName !== destBaseName && srcBaseName.toLowerCase() === destBaseName.toLowerCase()) {
            return { srcStat, destStat, isChangingCase: true };
          }
          throw new Error("Source and destination must not be the same.");
        }
        if (srcStat.isDirectory() && !destStat.isDirectory()) {
          throw new Error(`Cannot overwrite non-directory '${dest}' with directory '${src}'.`);
        }
        if (!srcStat.isDirectory() && destStat.isDirectory()) {
          throw new Error(`Cannot overwrite directory '${dest}' with non-directory '${src}'.`);
        }
      }
      if (srcStat.isDirectory() && isSrcSubdir(src, dest)) {
        throw new Error(errMsg(src, dest, funcName));
      }
      return { srcStat, destStat };
    }
    async function checkParentPaths(src, srcStat, dest, funcName) {
      const srcParent = path6.resolve(path6.dirname(src));
      const destParent = path6.resolve(path6.dirname(dest));
      if (destParent === srcParent || destParent === path6.parse(destParent).root) return;
      let destStat;
      try {
        destStat = await fs2.stat(destParent, { bigint: true });
      } catch (err) {
        if (err.code === "ENOENT") return;
        throw err;
      }
      if (areIdentical(srcStat, destStat)) {
        throw new Error(errMsg(src, dest, funcName));
      }
      return checkParentPaths(src, srcStat, destParent, funcName);
    }
    function checkParentPathsSync(src, srcStat, dest, funcName) {
      const srcParent = path6.resolve(path6.dirname(src));
      const destParent = path6.resolve(path6.dirname(dest));
      if (destParent === srcParent || destParent === path6.parse(destParent).root) return;
      let destStat;
      try {
        destStat = fs2.statSync(destParent, { bigint: true });
      } catch (err) {
        if (err.code === "ENOENT") return;
        throw err;
      }
      if (areIdentical(srcStat, destStat)) {
        throw new Error(errMsg(src, dest, funcName));
      }
      return checkParentPathsSync(src, srcStat, destParent, funcName);
    }
    function areIdentical(srcStat, destStat) {
      return destStat.ino && destStat.dev && destStat.ino === srcStat.ino && destStat.dev === srcStat.dev;
    }
    function isSrcSubdir(src, dest) {
      const srcArr = path6.resolve(src).split(path6.sep).filter((i2) => i2);
      const destArr = path6.resolve(dest).split(path6.sep).filter((i2) => i2);
      return srcArr.every((cur, i2) => destArr[i2] === cur);
    }
    function errMsg(src, dest, funcName) {
      return `Cannot ${funcName} '${src}' to a subdirectory of itself, '${dest}'.`;
    }
    module2.exports = {
      // checkPaths
      checkPaths: u2(checkPaths),
      checkPathsSync,
      // checkParent
      checkParentPaths: u2(checkParentPaths),
      checkParentPathsSync,
      // Misc
      isSrcSubdir,
      areIdentical
    };
  }
});

// ../../node_modules/.pnpm/fs-extra@11.3.0/node_modules/fs-extra/lib/copy/copy.js
var require_copy = __commonJS({
  "../../node_modules/.pnpm/fs-extra@11.3.0/node_modules/fs-extra/lib/copy/copy.js"(exports2, module2) {
    "use strict";
    var fs2 = require_fs();
    var path6 = require("path");
    var { mkdirs } = require_mkdirs();
    var { pathExists } = require_path_exists();
    var { utimesMillis } = require_utimes();
    var stat = require_stat();
    async function copy(src, dest, opts = {}) {
      if (typeof opts === "function") {
        opts = { filter: opts };
      }
      opts.clobber = "clobber" in opts ? !!opts.clobber : true;
      opts.overwrite = "overwrite" in opts ? !!opts.overwrite : opts.clobber;
      if (opts.preserveTimestamps && process.arch === "ia32") {
        process.emitWarning(
          "Using the preserveTimestamps option in 32-bit node is not recommended;\n\n	see https://github.com/jprichardson/node-fs-extra/issues/269",
          "Warning",
          "fs-extra-WARN0001"
        );
      }
      const { srcStat, destStat } = await stat.checkPaths(src, dest, "copy", opts);
      await stat.checkParentPaths(src, srcStat, dest, "copy");
      const include = await runFilter(src, dest, opts);
      if (!include) return;
      const destParent = path6.dirname(dest);
      const dirExists = await pathExists(destParent);
      if (!dirExists) {
        await mkdirs(destParent);
      }
      await getStatsAndPerformCopy(destStat, src, dest, opts);
    }
    async function runFilter(src, dest, opts) {
      if (!opts.filter) return true;
      return opts.filter(src, dest);
    }
    async function getStatsAndPerformCopy(destStat, src, dest, opts) {
      const statFn = opts.dereference ? fs2.stat : fs2.lstat;
      const srcStat = await statFn(src);
      if (srcStat.isDirectory()) return onDir(srcStat, destStat, src, dest, opts);
      if (srcStat.isFile() || srcStat.isCharacterDevice() || srcStat.isBlockDevice()) return onFile(srcStat, destStat, src, dest, opts);
      if (srcStat.isSymbolicLink()) return onLink(destStat, src, dest, opts);
      if (srcStat.isSocket()) throw new Error(`Cannot copy a socket file: ${src}`);
      if (srcStat.isFIFO()) throw new Error(`Cannot copy a FIFO pipe: ${src}`);
      throw new Error(`Unknown file: ${src}`);
    }
    async function onFile(srcStat, destStat, src, dest, opts) {
      if (!destStat) return copyFile(srcStat, src, dest, opts);
      if (opts.overwrite) {
        await fs2.unlink(dest);
        return copyFile(srcStat, src, dest, opts);
      }
      if (opts.errorOnExist) {
        throw new Error(`'${dest}' already exists`);
      }
    }
    async function copyFile(srcStat, src, dest, opts) {
      await fs2.copyFile(src, dest);
      if (opts.preserveTimestamps) {
        if (fileIsNotWritable(srcStat.mode)) {
          await makeFileWritable(dest, srcStat.mode);
        }
        const updatedSrcStat = await fs2.stat(src);
        await utimesMillis(dest, updatedSrcStat.atime, updatedSrcStat.mtime);
      }
      return fs2.chmod(dest, srcStat.mode);
    }
    function fileIsNotWritable(srcMode) {
      return (srcMode & 128) === 0;
    }
    function makeFileWritable(dest, srcMode) {
      return fs2.chmod(dest, srcMode | 128);
    }
    async function onDir(srcStat, destStat, src, dest, opts) {
      if (!destStat) {
        await fs2.mkdir(dest);
      }
      const promises = [];
      for await (const item of await fs2.opendir(src)) {
        const srcItem = path6.join(src, item.name);
        const destItem = path6.join(dest, item.name);
        promises.push(
          runFilter(srcItem, destItem, opts).then((include) => {
            if (include) {
              return stat.checkPaths(srcItem, destItem, "copy", opts).then(({ destStat: destStat2 }) => {
                return getStatsAndPerformCopy(destStat2, srcItem, destItem, opts);
              });
            }
          })
        );
      }
      await Promise.all(promises);
      if (!destStat) {
        await fs2.chmod(dest, srcStat.mode);
      }
    }
    async function onLink(destStat, src, dest, opts) {
      let resolvedSrc = await fs2.readlink(src);
      if (opts.dereference) {
        resolvedSrc = path6.resolve(process.cwd(), resolvedSrc);
      }
      if (!destStat) {
        return fs2.symlink(resolvedSrc, dest);
      }
      let resolvedDest = null;
      try {
        resolvedDest = await fs2.readlink(dest);
      } catch (e2) {
        if (e2.code === "EINVAL" || e2.code === "UNKNOWN") return fs2.symlink(resolvedSrc, dest);
        throw e2;
      }
      if (opts.dereference) {
        resolvedDest = path6.resolve(process.cwd(), resolvedDest);
      }
      if (stat.isSrcSubdir(resolvedSrc, resolvedDest)) {
        throw new Error(`Cannot copy '${resolvedSrc}' to a subdirectory of itself, '${resolvedDest}'.`);
      }
      if (stat.isSrcSubdir(resolvedDest, resolvedSrc)) {
        throw new Error(`Cannot overwrite '${resolvedDest}' with '${resolvedSrc}'.`);
      }
      await fs2.unlink(dest);
      return fs2.symlink(resolvedSrc, dest);
    }
    module2.exports = copy;
  }
});

// ../../node_modules/.pnpm/fs-extra@11.3.0/node_modules/fs-extra/lib/copy/copy-sync.js
var require_copy_sync = __commonJS({
  "../../node_modules/.pnpm/fs-extra@11.3.0/node_modules/fs-extra/lib/copy/copy-sync.js"(exports2, module2) {
    "use strict";
    var fs2 = require_graceful_fs();
    var path6 = require("path");
    var mkdirsSync = require_mkdirs().mkdirsSync;
    var utimesMillisSync = require_utimes().utimesMillisSync;
    var stat = require_stat();
    function copySync(src, dest, opts) {
      if (typeof opts === "function") {
        opts = { filter: opts };
      }
      opts = opts || {};
      opts.clobber = "clobber" in opts ? !!opts.clobber : true;
      opts.overwrite = "overwrite" in opts ? !!opts.overwrite : opts.clobber;
      if (opts.preserveTimestamps && process.arch === "ia32") {
        process.emitWarning(
          "Using the preserveTimestamps option in 32-bit node is not recommended;\n\n	see https://github.com/jprichardson/node-fs-extra/issues/269",
          "Warning",
          "fs-extra-WARN0002"
        );
      }
      const { srcStat, destStat } = stat.checkPathsSync(src, dest, "copy", opts);
      stat.checkParentPathsSync(src, srcStat, dest, "copy");
      if (opts.filter && !opts.filter(src, dest)) return;
      const destParent = path6.dirname(dest);
      if (!fs2.existsSync(destParent)) mkdirsSync(destParent);
      return getStats(destStat, src, dest, opts);
    }
    function getStats(destStat, src, dest, opts) {
      const statSync = opts.dereference ? fs2.statSync : fs2.lstatSync;
      const srcStat = statSync(src);
      if (srcStat.isDirectory()) return onDir(srcStat, destStat, src, dest, opts);
      else if (srcStat.isFile() || srcStat.isCharacterDevice() || srcStat.isBlockDevice()) return onFile(srcStat, destStat, src, dest, opts);
      else if (srcStat.isSymbolicLink()) return onLink(destStat, src, dest, opts);
      else if (srcStat.isSocket()) throw new Error(`Cannot copy a socket file: ${src}`);
      else if (srcStat.isFIFO()) throw new Error(`Cannot copy a FIFO pipe: ${src}`);
      throw new Error(`Unknown file: ${src}`);
    }
    function onFile(srcStat, destStat, src, dest, opts) {
      if (!destStat) return copyFile(srcStat, src, dest, opts);
      return mayCopyFile(srcStat, src, dest, opts);
    }
    function mayCopyFile(srcStat, src, dest, opts) {
      if (opts.overwrite) {
        fs2.unlinkSync(dest);
        return copyFile(srcStat, src, dest, opts);
      } else if (opts.errorOnExist) {
        throw new Error(`'${dest}' already exists`);
      }
    }
    function copyFile(srcStat, src, dest, opts) {
      fs2.copyFileSync(src, dest);
      if (opts.preserveTimestamps) handleTimestamps(srcStat.mode, src, dest);
      return setDestMode(dest, srcStat.mode);
    }
    function handleTimestamps(srcMode, src, dest) {
      if (fileIsNotWritable(srcMode)) makeFileWritable(dest, srcMode);
      return setDestTimestamps(src, dest);
    }
    function fileIsNotWritable(srcMode) {
      return (srcMode & 128) === 0;
    }
    function makeFileWritable(dest, srcMode) {
      return setDestMode(dest, srcMode | 128);
    }
    function setDestMode(dest, srcMode) {
      return fs2.chmodSync(dest, srcMode);
    }
    function setDestTimestamps(src, dest) {
      const updatedSrcStat = fs2.statSync(src);
      return utimesMillisSync(dest, updatedSrcStat.atime, updatedSrcStat.mtime);
    }
    function onDir(srcStat, destStat, src, dest, opts) {
      if (!destStat) return mkDirAndCopy(srcStat.mode, src, dest, opts);
      return copyDir(src, dest, opts);
    }
    function mkDirAndCopy(srcMode, src, dest, opts) {
      fs2.mkdirSync(dest);
      copyDir(src, dest, opts);
      return setDestMode(dest, srcMode);
    }
    function copyDir(src, dest, opts) {
      const dir = fs2.opendirSync(src);
      try {
        let dirent;
        while ((dirent = dir.readSync()) !== null) {
          copyDirItem(dirent.name, src, dest, opts);
        }
      } finally {
        dir.closeSync();
      }
    }
    function copyDirItem(item, src, dest, opts) {
      const srcItem = path6.join(src, item);
      const destItem = path6.join(dest, item);
      if (opts.filter && !opts.filter(srcItem, destItem)) return;
      const { destStat } = stat.checkPathsSync(srcItem, destItem, "copy", opts);
      return getStats(destStat, srcItem, destItem, opts);
    }
    function onLink(destStat, src, dest, opts) {
      let resolvedSrc = fs2.readlinkSync(src);
      if (opts.dereference) {
        resolvedSrc = path6.resolve(process.cwd(), resolvedSrc);
      }
      if (!destStat) {
        return fs2.symlinkSync(resolvedSrc, dest);
      } else {
        let resolvedDest;
        try {
          resolvedDest = fs2.readlinkSync(dest);
        } catch (err) {
          if (err.code === "EINVAL" || err.code === "UNKNOWN") return fs2.symlinkSync(resolvedSrc, dest);
          throw err;
        }
        if (opts.dereference) {
          resolvedDest = path6.resolve(process.cwd(), resolvedDest);
        }
        if (stat.isSrcSubdir(resolvedSrc, resolvedDest)) {
          throw new Error(`Cannot copy '${resolvedSrc}' to a subdirectory of itself, '${resolvedDest}'.`);
        }
        if (stat.isSrcSubdir(resolvedDest, resolvedSrc)) {
          throw new Error(`Cannot overwrite '${resolvedDest}' with '${resolvedSrc}'.`);
        }
        return copyLink(resolvedSrc, dest);
      }
    }
    function copyLink(resolvedSrc, dest) {
      fs2.unlinkSync(dest);
      return fs2.symlinkSync(resolvedSrc, dest);
    }
    module2.exports = copySync;
  }
});

// ../../node_modules/.pnpm/fs-extra@11.3.0/node_modules/fs-extra/lib/copy/index.js
var require_copy2 = __commonJS({
  "../../node_modules/.pnpm/fs-extra@11.3.0/node_modules/fs-extra/lib/copy/index.js"(exports2, module2) {
    "use strict";
    var u2 = require_universalify().fromPromise;
    module2.exports = {
      copy: u2(require_copy()),
      copySync: require_copy_sync()
    };
  }
});

// ../../node_modules/.pnpm/fs-extra@11.3.0/node_modules/fs-extra/lib/remove/index.js
var require_remove = __commonJS({
  "../../node_modules/.pnpm/fs-extra@11.3.0/node_modules/fs-extra/lib/remove/index.js"(exports2, module2) {
    "use strict";
    var fs2 = require_graceful_fs();
    var u2 = require_universalify().fromCallback;
    function remove(path6, callback) {
      fs2.rm(path6, { recursive: true, force: true }, callback);
    }
    function removeSync(path6) {
      fs2.rmSync(path6, { recursive: true, force: true });
    }
    module2.exports = {
      remove: u2(remove),
      removeSync
    };
  }
});

// ../../node_modules/.pnpm/fs-extra@11.3.0/node_modules/fs-extra/lib/empty/index.js
var require_empty = __commonJS({
  "../../node_modules/.pnpm/fs-extra@11.3.0/node_modules/fs-extra/lib/empty/index.js"(exports2, module2) {
    "use strict";
    var u2 = require_universalify().fromPromise;
    var fs2 = require_fs();
    var path6 = require("path");
    var mkdir = require_mkdirs();
    var remove = require_remove();
    var emptyDir = u2(async function emptyDir2(dir) {
      let items;
      try {
        items = await fs2.readdir(dir);
      } catch {
        return mkdir.mkdirs(dir);
      }
      return Promise.all(items.map((item) => remove.remove(path6.join(dir, item))));
    });
    function emptyDirSync(dir) {
      let items;
      try {
        items = fs2.readdirSync(dir);
      } catch {
        return mkdir.mkdirsSync(dir);
      }
      items.forEach((item) => {
        item = path6.join(dir, item);
        remove.removeSync(item);
      });
    }
    module2.exports = {
      emptyDirSync,
      emptydirSync: emptyDirSync,
      emptyDir,
      emptydir: emptyDir
    };
  }
});

// ../../node_modules/.pnpm/fs-extra@11.3.0/node_modules/fs-extra/lib/ensure/file.js
var require_file = __commonJS({
  "../../node_modules/.pnpm/fs-extra@11.3.0/node_modules/fs-extra/lib/ensure/file.js"(exports2, module2) {
    "use strict";
    var u2 = require_universalify().fromPromise;
    var path6 = require("path");
    var fs2 = require_fs();
    var mkdir = require_mkdirs();
    async function createFile(file) {
      let stats;
      try {
        stats = await fs2.stat(file);
      } catch {
      }
      if (stats && stats.isFile()) return;
      const dir = path6.dirname(file);
      let dirStats = null;
      try {
        dirStats = await fs2.stat(dir);
      } catch (err) {
        if (err.code === "ENOENT") {
          await mkdir.mkdirs(dir);
          await fs2.writeFile(file, "");
          return;
        } else {
          throw err;
        }
      }
      if (dirStats.isDirectory()) {
        await fs2.writeFile(file, "");
      } else {
        await fs2.readdir(dir);
      }
    }
    function createFileSync(file) {
      let stats;
      try {
        stats = fs2.statSync(file);
      } catch {
      }
      if (stats && stats.isFile()) return;
      const dir = path6.dirname(file);
      try {
        if (!fs2.statSync(dir).isDirectory()) {
          fs2.readdirSync(dir);
        }
      } catch (err) {
        if (err && err.code === "ENOENT") mkdir.mkdirsSync(dir);
        else throw err;
      }
      fs2.writeFileSync(file, "");
    }
    module2.exports = {
      createFile: u2(createFile),
      createFileSync
    };
  }
});

// ../../node_modules/.pnpm/fs-extra@11.3.0/node_modules/fs-extra/lib/ensure/link.js
var require_link = __commonJS({
  "../../node_modules/.pnpm/fs-extra@11.3.0/node_modules/fs-extra/lib/ensure/link.js"(exports2, module2) {
    "use strict";
    var u2 = require_universalify().fromPromise;
    var path6 = require("path");
    var fs2 = require_fs();
    var mkdir = require_mkdirs();
    var { pathExists } = require_path_exists();
    var { areIdentical } = require_stat();
    async function createLink(srcpath, dstpath) {
      let dstStat;
      try {
        dstStat = await fs2.lstat(dstpath);
      } catch {
      }
      let srcStat;
      try {
        srcStat = await fs2.lstat(srcpath);
      } catch (err) {
        err.message = err.message.replace("lstat", "ensureLink");
        throw err;
      }
      if (dstStat && areIdentical(srcStat, dstStat)) return;
      const dir = path6.dirname(dstpath);
      const dirExists = await pathExists(dir);
      if (!dirExists) {
        await mkdir.mkdirs(dir);
      }
      await fs2.link(srcpath, dstpath);
    }
    function createLinkSync(srcpath, dstpath) {
      let dstStat;
      try {
        dstStat = fs2.lstatSync(dstpath);
      } catch {
      }
      try {
        const srcStat = fs2.lstatSync(srcpath);
        if (dstStat && areIdentical(srcStat, dstStat)) return;
      } catch (err) {
        err.message = err.message.replace("lstat", "ensureLink");
        throw err;
      }
      const dir = path6.dirname(dstpath);
      const dirExists = fs2.existsSync(dir);
      if (dirExists) return fs2.linkSync(srcpath, dstpath);
      mkdir.mkdirsSync(dir);
      return fs2.linkSync(srcpath, dstpath);
    }
    module2.exports = {
      createLink: u2(createLink),
      createLinkSync
    };
  }
});

// ../../node_modules/.pnpm/fs-extra@11.3.0/node_modules/fs-extra/lib/ensure/symlink-paths.js
var require_symlink_paths = __commonJS({
  "../../node_modules/.pnpm/fs-extra@11.3.0/node_modules/fs-extra/lib/ensure/symlink-paths.js"(exports2, module2) {
    "use strict";
    var path6 = require("path");
    var fs2 = require_fs();
    var { pathExists } = require_path_exists();
    var u2 = require_universalify().fromPromise;
    async function symlinkPaths(srcpath, dstpath) {
      if (path6.isAbsolute(srcpath)) {
        try {
          await fs2.lstat(srcpath);
        } catch (err) {
          err.message = err.message.replace("lstat", "ensureSymlink");
          throw err;
        }
        return {
          toCwd: srcpath,
          toDst: srcpath
        };
      }
      const dstdir = path6.dirname(dstpath);
      const relativeToDst = path6.join(dstdir, srcpath);
      const exists = await pathExists(relativeToDst);
      if (exists) {
        return {
          toCwd: relativeToDst,
          toDst: srcpath
        };
      }
      try {
        await fs2.lstat(srcpath);
      } catch (err) {
        err.message = err.message.replace("lstat", "ensureSymlink");
        throw err;
      }
      return {
        toCwd: srcpath,
        toDst: path6.relative(dstdir, srcpath)
      };
    }
    function symlinkPathsSync(srcpath, dstpath) {
      if (path6.isAbsolute(srcpath)) {
        const exists2 = fs2.existsSync(srcpath);
        if (!exists2) throw new Error("absolute srcpath does not exist");
        return {
          toCwd: srcpath,
          toDst: srcpath
        };
      }
      const dstdir = path6.dirname(dstpath);
      const relativeToDst = path6.join(dstdir, srcpath);
      const exists = fs2.existsSync(relativeToDst);
      if (exists) {
        return {
          toCwd: relativeToDst,
          toDst: srcpath
        };
      }
      const srcExists = fs2.existsSync(srcpath);
      if (!srcExists) throw new Error("relative srcpath does not exist");
      return {
        toCwd: srcpath,
        toDst: path6.relative(dstdir, srcpath)
      };
    }
    module2.exports = {
      symlinkPaths: u2(symlinkPaths),
      symlinkPathsSync
    };
  }
});

// ../../node_modules/.pnpm/fs-extra@11.3.0/node_modules/fs-extra/lib/ensure/symlink-type.js
var require_symlink_type = __commonJS({
  "../../node_modules/.pnpm/fs-extra@11.3.0/node_modules/fs-extra/lib/ensure/symlink-type.js"(exports2, module2) {
    "use strict";
    var fs2 = require_fs();
    var u2 = require_universalify().fromPromise;
    async function symlinkType(srcpath, type) {
      if (type) return type;
      let stats;
      try {
        stats = await fs2.lstat(srcpath);
      } catch {
        return "file";
      }
      return stats && stats.isDirectory() ? "dir" : "file";
    }
    function symlinkTypeSync(srcpath, type) {
      if (type) return type;
      let stats;
      try {
        stats = fs2.lstatSync(srcpath);
      } catch {
        return "file";
      }
      return stats && stats.isDirectory() ? "dir" : "file";
    }
    module2.exports = {
      symlinkType: u2(symlinkType),
      symlinkTypeSync
    };
  }
});

// ../../node_modules/.pnpm/fs-extra@11.3.0/node_modules/fs-extra/lib/ensure/symlink.js
var require_symlink = __commonJS({
  "../../node_modules/.pnpm/fs-extra@11.3.0/node_modules/fs-extra/lib/ensure/symlink.js"(exports2, module2) {
    "use strict";
    var u2 = require_universalify().fromPromise;
    var path6 = require("path");
    var fs2 = require_fs();
    var { mkdirs, mkdirsSync } = require_mkdirs();
    var { symlinkPaths, symlinkPathsSync } = require_symlink_paths();
    var { symlinkType, symlinkTypeSync } = require_symlink_type();
    var { pathExists } = require_path_exists();
    var { areIdentical } = require_stat();
    async function createSymlink(srcpath, dstpath, type) {
      let stats;
      try {
        stats = await fs2.lstat(dstpath);
      } catch {
      }
      if (stats && stats.isSymbolicLink()) {
        const [srcStat, dstStat] = await Promise.all([
          fs2.stat(srcpath),
          fs2.stat(dstpath)
        ]);
        if (areIdentical(srcStat, dstStat)) return;
      }
      const relative = await symlinkPaths(srcpath, dstpath);
      srcpath = relative.toDst;
      const toType = await symlinkType(relative.toCwd, type);
      const dir = path6.dirname(dstpath);
      if (!await pathExists(dir)) {
        await mkdirs(dir);
      }
      return fs2.symlink(srcpath, dstpath, toType);
    }
    function createSymlinkSync(srcpath, dstpath, type) {
      let stats;
      try {
        stats = fs2.lstatSync(dstpath);
      } catch {
      }
      if (stats && stats.isSymbolicLink()) {
        const srcStat = fs2.statSync(srcpath);
        const dstStat = fs2.statSync(dstpath);
        if (areIdentical(srcStat, dstStat)) return;
      }
      const relative = symlinkPathsSync(srcpath, dstpath);
      srcpath = relative.toDst;
      type = symlinkTypeSync(relative.toCwd, type);
      const dir = path6.dirname(dstpath);
      const exists = fs2.existsSync(dir);
      if (exists) return fs2.symlinkSync(srcpath, dstpath, type);
      mkdirsSync(dir);
      return fs2.symlinkSync(srcpath, dstpath, type);
    }
    module2.exports = {
      createSymlink: u2(createSymlink),
      createSymlinkSync
    };
  }
});

// ../../node_modules/.pnpm/fs-extra@11.3.0/node_modules/fs-extra/lib/ensure/index.js
var require_ensure = __commonJS({
  "../../node_modules/.pnpm/fs-extra@11.3.0/node_modules/fs-extra/lib/ensure/index.js"(exports2, module2) {
    "use strict";
    var { createFile, createFileSync } = require_file();
    var { createLink, createLinkSync } = require_link();
    var { createSymlink, createSymlinkSync } = require_symlink();
    module2.exports = {
      // file
      createFile,
      createFileSync,
      ensureFile: createFile,
      ensureFileSync: createFileSync,
      // link
      createLink,
      createLinkSync,
      ensureLink: createLink,
      ensureLinkSync: createLinkSync,
      // symlink
      createSymlink,
      createSymlinkSync,
      ensureSymlink: createSymlink,
      ensureSymlinkSync: createSymlinkSync
    };
  }
});

// ../../node_modules/.pnpm/jsonfile@6.1.0/node_modules/jsonfile/utils.js
var require_utils2 = __commonJS({
  "../../node_modules/.pnpm/jsonfile@6.1.0/node_modules/jsonfile/utils.js"(exports2, module2) {
    function stringify(obj, { EOL = "\n", finalEOL = true, replacer = null, spaces } = {}) {
      const EOF = finalEOL ? EOL : "";
      const str = JSON.stringify(obj, replacer, spaces);
      return str.replace(/\n/g, EOL) + EOF;
    }
    function stripBom(content) {
      if (Buffer.isBuffer(content)) content = content.toString("utf8");
      return content.replace(/^\uFEFF/, "");
    }
    module2.exports = { stringify, stripBom };
  }
});

// ../../node_modules/.pnpm/jsonfile@6.1.0/node_modules/jsonfile/index.js
var require_jsonfile = __commonJS({
  "../../node_modules/.pnpm/jsonfile@6.1.0/node_modules/jsonfile/index.js"(exports2, module2) {
    var _fs;
    try {
      _fs = require_graceful_fs();
    } catch (_2) {
      _fs = require("fs");
    }
    var universalify = require_universalify();
    var { stringify, stripBom } = require_utils2();
    async function _readFile(file, options = {}) {
      if (typeof options === "string") {
        options = { encoding: options };
      }
      const fs2 = options.fs || _fs;
      const shouldThrow = "throws" in options ? options.throws : true;
      let data = await universalify.fromCallback(fs2.readFile)(file, options);
      data = stripBom(data);
      let obj;
      try {
        obj = JSON.parse(data, options ? options.reviver : null);
      } catch (err) {
        if (shouldThrow) {
          err.message = `${file}: ${err.message}`;
          throw err;
        } else {
          return null;
        }
      }
      return obj;
    }
    var readFile = universalify.fromPromise(_readFile);
    function readFileSync(file, options = {}) {
      if (typeof options === "string") {
        options = { encoding: options };
      }
      const fs2 = options.fs || _fs;
      const shouldThrow = "throws" in options ? options.throws : true;
      try {
        let content = fs2.readFileSync(file, options);
        content = stripBom(content);
        return JSON.parse(content, options.reviver);
      } catch (err) {
        if (shouldThrow) {
          err.message = `${file}: ${err.message}`;
          throw err;
        } else {
          return null;
        }
      }
    }
    async function _writeFile(file, obj, options = {}) {
      const fs2 = options.fs || _fs;
      const str = stringify(obj, options);
      await universalify.fromCallback(fs2.writeFile)(file, str, options);
    }
    var writeFile = universalify.fromPromise(_writeFile);
    function writeFileSync(file, obj, options = {}) {
      const fs2 = options.fs || _fs;
      const str = stringify(obj, options);
      return fs2.writeFileSync(file, str, options);
    }
    var jsonfile = {
      readFile,
      readFileSync,
      writeFile,
      writeFileSync
    };
    module2.exports = jsonfile;
  }
});

// ../../node_modules/.pnpm/fs-extra@11.3.0/node_modules/fs-extra/lib/json/jsonfile.js
var require_jsonfile2 = __commonJS({
  "../../node_modules/.pnpm/fs-extra@11.3.0/node_modules/fs-extra/lib/json/jsonfile.js"(exports2, module2) {
    "use strict";
    var jsonFile = require_jsonfile();
    module2.exports = {
      // jsonfile exports
      readJson: jsonFile.readFile,
      readJsonSync: jsonFile.readFileSync,
      writeJson: jsonFile.writeFile,
      writeJsonSync: jsonFile.writeFileSync
    };
  }
});

// ../../node_modules/.pnpm/fs-extra@11.3.0/node_modules/fs-extra/lib/output-file/index.js
var require_output_file = __commonJS({
  "../../node_modules/.pnpm/fs-extra@11.3.0/node_modules/fs-extra/lib/output-file/index.js"(exports2, module2) {
    "use strict";
    var u2 = require_universalify().fromPromise;
    var fs2 = require_fs();
    var path6 = require("path");
    var mkdir = require_mkdirs();
    var pathExists = require_path_exists().pathExists;
    async function outputFile(file, data, encoding = "utf-8") {
      const dir = path6.dirname(file);
      if (!await pathExists(dir)) {
        await mkdir.mkdirs(dir);
      }
      return fs2.writeFile(file, data, encoding);
    }
    function outputFileSync(file, ...args) {
      const dir = path6.dirname(file);
      if (!fs2.existsSync(dir)) {
        mkdir.mkdirsSync(dir);
      }
      fs2.writeFileSync(file, ...args);
    }
    module2.exports = {
      outputFile: u2(outputFile),
      outputFileSync
    };
  }
});

// ../../node_modules/.pnpm/fs-extra@11.3.0/node_modules/fs-extra/lib/json/output-json.js
var require_output_json = __commonJS({
  "../../node_modules/.pnpm/fs-extra@11.3.0/node_modules/fs-extra/lib/json/output-json.js"(exports2, module2) {
    "use strict";
    var { stringify } = require_utils2();
    var { outputFile } = require_output_file();
    async function outputJson(file, data, options = {}) {
      const str = stringify(data, options);
      await outputFile(file, str, options);
    }
    module2.exports = outputJson;
  }
});

// ../../node_modules/.pnpm/fs-extra@11.3.0/node_modules/fs-extra/lib/json/output-json-sync.js
var require_output_json_sync = __commonJS({
  "../../node_modules/.pnpm/fs-extra@11.3.0/node_modules/fs-extra/lib/json/output-json-sync.js"(exports2, module2) {
    "use strict";
    var { stringify } = require_utils2();
    var { outputFileSync } = require_output_file();
    function outputJsonSync(file, data, options) {
      const str = stringify(data, options);
      outputFileSync(file, str, options);
    }
    module2.exports = outputJsonSync;
  }
});

// ../../node_modules/.pnpm/fs-extra@11.3.0/node_modules/fs-extra/lib/json/index.js
var require_json = __commonJS({
  "../../node_modules/.pnpm/fs-extra@11.3.0/node_modules/fs-extra/lib/json/index.js"(exports2, module2) {
    "use strict";
    var u2 = require_universalify().fromPromise;
    var jsonFile = require_jsonfile2();
    jsonFile.outputJson = u2(require_output_json());
    jsonFile.outputJsonSync = require_output_json_sync();
    jsonFile.outputJSON = jsonFile.outputJson;
    jsonFile.outputJSONSync = jsonFile.outputJsonSync;
    jsonFile.writeJSON = jsonFile.writeJson;
    jsonFile.writeJSONSync = jsonFile.writeJsonSync;
    jsonFile.readJSON = jsonFile.readJson;
    jsonFile.readJSONSync = jsonFile.readJsonSync;
    module2.exports = jsonFile;
  }
});

// ../../node_modules/.pnpm/fs-extra@11.3.0/node_modules/fs-extra/lib/move/move.js
var require_move = __commonJS({
  "../../node_modules/.pnpm/fs-extra@11.3.0/node_modules/fs-extra/lib/move/move.js"(exports2, module2) {
    "use strict";
    var fs2 = require_fs();
    var path6 = require("path");
    var { copy } = require_copy2();
    var { remove } = require_remove();
    var { mkdirp } = require_mkdirs();
    var { pathExists } = require_path_exists();
    var stat = require_stat();
    async function move(src, dest, opts = {}) {
      const overwrite = opts.overwrite || opts.clobber || false;
      const { srcStat, isChangingCase = false } = await stat.checkPaths(src, dest, "move", opts);
      await stat.checkParentPaths(src, srcStat, dest, "move");
      const destParent = path6.dirname(dest);
      const parsedParentPath = path6.parse(destParent);
      if (parsedParentPath.root !== destParent) {
        await mkdirp(destParent);
      }
      return doRename(src, dest, overwrite, isChangingCase);
    }
    async function doRename(src, dest, overwrite, isChangingCase) {
      if (!isChangingCase) {
        if (overwrite) {
          await remove(dest);
        } else if (await pathExists(dest)) {
          throw new Error("dest already exists.");
        }
      }
      try {
        await fs2.rename(src, dest);
      } catch (err) {
        if (err.code !== "EXDEV") {
          throw err;
        }
        await moveAcrossDevice(src, dest, overwrite);
      }
    }
    async function moveAcrossDevice(src, dest, overwrite) {
      const opts = {
        overwrite,
        errorOnExist: true,
        preserveTimestamps: true
      };
      await copy(src, dest, opts);
      return remove(src);
    }
    module2.exports = move;
  }
});

// ../../node_modules/.pnpm/fs-extra@11.3.0/node_modules/fs-extra/lib/move/move-sync.js
var require_move_sync = __commonJS({
  "../../node_modules/.pnpm/fs-extra@11.3.0/node_modules/fs-extra/lib/move/move-sync.js"(exports2, module2) {
    "use strict";
    var fs2 = require_graceful_fs();
    var path6 = require("path");
    var copySync = require_copy2().copySync;
    var removeSync = require_remove().removeSync;
    var mkdirpSync = require_mkdirs().mkdirpSync;
    var stat = require_stat();
    function moveSync(src, dest, opts) {
      opts = opts || {};
      const overwrite = opts.overwrite || opts.clobber || false;
      const { srcStat, isChangingCase = false } = stat.checkPathsSync(src, dest, "move", opts);
      stat.checkParentPathsSync(src, srcStat, dest, "move");
      if (!isParentRoot(dest)) mkdirpSync(path6.dirname(dest));
      return doRename(src, dest, overwrite, isChangingCase);
    }
    function isParentRoot(dest) {
      const parent = path6.dirname(dest);
      const parsedPath = path6.parse(parent);
      return parsedPath.root === parent;
    }
    function doRename(src, dest, overwrite, isChangingCase) {
      if (isChangingCase) return rename(src, dest, overwrite);
      if (overwrite) {
        removeSync(dest);
        return rename(src, dest, overwrite);
      }
      if (fs2.existsSync(dest)) throw new Error("dest already exists.");
      return rename(src, dest, overwrite);
    }
    function rename(src, dest, overwrite) {
      try {
        fs2.renameSync(src, dest);
      } catch (err) {
        if (err.code !== "EXDEV") throw err;
        return moveAcrossDevice(src, dest, overwrite);
      }
    }
    function moveAcrossDevice(src, dest, overwrite) {
      const opts = {
        overwrite,
        errorOnExist: true,
        preserveTimestamps: true
      };
      copySync(src, dest, opts);
      return removeSync(src);
    }
    module2.exports = moveSync;
  }
});

// ../../node_modules/.pnpm/fs-extra@11.3.0/node_modules/fs-extra/lib/move/index.js
var require_move2 = __commonJS({
  "../../node_modules/.pnpm/fs-extra@11.3.0/node_modules/fs-extra/lib/move/index.js"(exports2, module2) {
    "use strict";
    var u2 = require_universalify().fromPromise;
    module2.exports = {
      move: u2(require_move()),
      moveSync: require_move_sync()
    };
  }
});

// ../../node_modules/.pnpm/fs-extra@11.3.0/node_modules/fs-extra/lib/index.js
var require_lib2 = __commonJS({
  "../../node_modules/.pnpm/fs-extra@11.3.0/node_modules/fs-extra/lib/index.js"(exports2, module2) {
    "use strict";
    module2.exports = {
      // Export promiseified graceful-fs:
      ...require_fs(),
      // Export extra methods:
      ...require_copy2(),
      ...require_empty(),
      ...require_ensure(),
      ...require_json(),
      ...require_mkdirs(),
      ...require_move2(),
      ...require_output_file(),
      ...require_path_exists(),
      ...require_remove()
    };
  }
});

// ../../node_modules/.pnpm/ssim.js@3.5.0/node_modules/ssim.js/dist/math.js
var require_math = __commonJS({
  "../../node_modules/.pnpm/ssim.js@3.5.0/node_modules/ssim.js/dist/math.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.covariance = exports2.variance = exports2.mean2d = exports2.square2d = exports2.multiply2d = exports2.divide2d = exports2.subtract2d = exports2.add2d = exports2.sum2d = exports2.floor = exports2.sum = exports2.average = void 0;
    function average(xn) {
      return sum(xn) / xn.length;
    }
    exports2.average = average;
    function sum(xn) {
      var out = 0;
      for (var x2 = 0; x2 < xn.length; x2++) {
        out += xn[x2];
      }
      return out;
    }
    exports2.sum = sum;
    function floor(xn) {
      var out = new Array(xn.length);
      for (var x2 = 0; x2 < xn.length; x2++) {
        out[x2] = Math.floor(xn[x2]);
      }
      return out;
    }
    exports2.floor = floor;
    function sum2d(_a) {
      var data = _a.data;
      var out = 0;
      for (var x2 = 0; x2 < data.length; x2++) {
        out += data[x2];
      }
      return out;
    }
    exports2.sum2d = sum2d;
    function add2dMx(_a, _b) {
      var ref1 = _a.data, width = _a.width, height = _a.height;
      var ref2 = _b.data;
      var data = new Array(ref1.length);
      for (var x2 = 0; x2 < height; x2++) {
        var offset = x2 * width;
        for (var y2 = 0; y2 < width; y2++) {
          data[offset + y2] = ref1[offset + y2] + ref2[offset + y2];
        }
      }
      return {
        data,
        width,
        height
      };
    }
    function subtract2dMx(_a, _b) {
      var ref1 = _a.data, width = _a.width, height = _a.height;
      var ref2 = _b.data;
      var data = new Array(ref1.length);
      for (var x2 = 0; x2 < height; x2++) {
        var offset = x2 * width;
        for (var y2 = 0; y2 < width; y2++) {
          data[offset + y2] = ref1[offset + y2] - ref2[offset + y2];
        }
      }
      return {
        data,
        width,
        height
      };
    }
    function add2dScalar(_a, increase) {
      var ref = _a.data, width = _a.width, height = _a.height;
      var data = new Array(ref.length);
      for (var x2 = 0; x2 < ref.length; x2++) {
        data[x2] = ref[x2] + increase;
      }
      return {
        data,
        width,
        height
      };
    }
    function add2d(A2, increase) {
      if (typeof increase === "number") {
        return add2dScalar(A2, increase);
      }
      return add2dMx(A2, increase);
    }
    exports2.add2d = add2d;
    function subtract2d(A2, decrease) {
      if (typeof decrease === "number") {
        return add2dScalar(A2, -decrease);
      }
      return subtract2dMx(A2, decrease);
    }
    exports2.subtract2d = subtract2d;
    function divide2dScalar(_a, divisor) {
      var ref = _a.data, width = _a.width, height = _a.height;
      var data = new Array(ref.length);
      for (var x2 = 0; x2 < ref.length; x2++) {
        data[x2] = ref[x2] / divisor;
      }
      return {
        data,
        width,
        height
      };
    }
    function divide2dMx(_a, _b) {
      var ref1 = _a.data, width = _a.width, height = _a.height;
      var ref2 = _b.data;
      var data = new Array(ref1.length);
      for (var x2 = 0; x2 < ref1.length; x2++) {
        data[x2] = ref1[x2] / ref2[x2];
      }
      return {
        data,
        width,
        height
      };
    }
    function divide2d(A2, divisor) {
      if (typeof divisor === "number") {
        return divide2dScalar(A2, divisor);
      }
      return divide2dMx(A2, divisor);
    }
    exports2.divide2d = divide2d;
    function multiply2dScalar(_a, multiplier) {
      var ref = _a.data, width = _a.width, height = _a.height;
      var data = new Array(ref.length);
      for (var x2 = 0; x2 < ref.length; x2++) {
        data[x2] = ref[x2] * multiplier;
      }
      return {
        data,
        width,
        height
      };
    }
    function multiply2dMx(_a, _b) {
      var ref1 = _a.data, width = _a.width, height = _a.height;
      var ref2 = _b.data;
      var data = new Array(ref1.length);
      for (var x2 = 0; x2 < ref1.length; x2++) {
        data[x2] = ref1[x2] * ref2[x2];
      }
      return {
        data,
        width,
        height
      };
    }
    function multiply2d(A2, multiplier) {
      if (typeof multiplier === "number") {
        return multiply2dScalar(A2, multiplier);
      }
      return multiply2dMx(A2, multiplier);
    }
    exports2.multiply2d = multiply2d;
    function square2d(A2) {
      return multiply2d(A2, A2);
    }
    exports2.square2d = square2d;
    function mean2d(A2) {
      return sum2d(A2) / A2.data.length;
    }
    exports2.mean2d = mean2d;
    function variance(values, avg) {
      if (avg === void 0) {
        avg = average(values);
      }
      var varx = 0;
      var i2 = values.length;
      while (i2--) {
        varx += Math.pow(values[i2] - avg, 2);
      }
      return varx / values.length;
    }
    exports2.variance = variance;
    function covariance(values1, values2, average1, average2) {
      if (average1 === void 0) {
        average1 = average(values1);
      }
      if (average2 === void 0) {
        average2 = average(values2);
      }
      var cov = 0;
      var i2 = values1.length;
      while (i2--) {
        cov += (values1[i2] - average1) * (values2[i2] - average2);
      }
      return cov / values1.length;
    }
    exports2.covariance = covariance;
  }
});

// ../../node_modules/.pnpm/ssim.js@3.5.0/node_modules/ssim.js/dist/matlab/internal/numbers.js
var require_numbers = __commonJS({
  "../../node_modules/.pnpm/ssim.js@3.5.0/node_modules/ssim.js/dist/matlab/internal/numbers.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.numbers = void 0;
    function numbers(height, width, num) {
      var size = width * height;
      var data = new Array(size);
      for (var x2 = 0; x2 < size; x2++) {
        data[x2] = num;
      }
      return {
        data,
        width,
        height
      };
    }
    exports2.numbers = numbers;
  }
});

// ../../node_modules/.pnpm/ssim.js@3.5.0/node_modules/ssim.js/dist/matlab/ones.js
var require_ones = __commonJS({
  "../../node_modules/.pnpm/ssim.js@3.5.0/node_modules/ssim.js/dist/matlab/ones.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.ones = void 0;
    var numbers_1 = require_numbers();
    function ones(height, width) {
      if (width === void 0) {
        width = height;
      }
      return numbers_1.numbers(height, width, 1);
    }
    exports2.ones = ones;
  }
});

// ../../node_modules/.pnpm/ssim.js@3.5.0/node_modules/ssim.js/dist/matlab/sub.js
var require_sub = __commonJS({
  "../../node_modules/.pnpm/ssim.js@3.5.0/node_modules/ssim.js/dist/matlab/sub.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.sub = void 0;
    function sub(_a, x2, height, y2, width) {
      var ref = _a.data, refWidth = _a.width;
      var data = new Array(width * height);
      for (var i2 = 0; i2 < height; i2++) {
        for (var j2 = 0; j2 < width; j2++) {
          data[i2 * width + j2] = ref[(y2 + i2) * refWidth + x2 + j2];
        }
      }
      return {
        data,
        width,
        height
      };
    }
    exports2.sub = sub;
  }
});

// ../../node_modules/.pnpm/ssim.js@3.5.0/node_modules/ssim.js/dist/matlab/zeros.js
var require_zeros = __commonJS({
  "../../node_modules/.pnpm/ssim.js@3.5.0/node_modules/ssim.js/dist/matlab/zeros.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.zeros = void 0;
    var numbers_1 = require_numbers();
    function zeros(height, width) {
      if (width === void 0) {
        width = height;
      }
      return numbers_1.numbers(height, width, 0);
    }
    exports2.zeros = zeros;
  }
});

// ../../node_modules/.pnpm/ssim.js@3.5.0/node_modules/ssim.js/dist/matlab/conv2.js
var require_conv2 = __commonJS({
  "../../node_modules/.pnpm/ssim.js@3.5.0/node_modules/ssim.js/dist/matlab/conv2.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.conv2 = void 0;
    var math_1 = require_math();
    var ones_1 = require_ones();
    var sub_1 = require_sub();
    var zeros_1 = require_zeros();
    function mxConv2(_a, b2, shape) {
      var ref = _a.data, refWidth = _a.width, refHeight = _a.height;
      if (shape === void 0) {
        shape = "full";
      }
      var cWidth = refWidth + b2.width - 1;
      var cHeight = refHeight + b2.height - 1;
      var data = zeros_1.zeros(cHeight, cWidth).data;
      for (var r1 = 0; r1 < b2.height; r1++) {
        for (var c1 = 0; c1 < b2.width; c1++) {
          var br1c1 = b2.data[r1 * b2.width + c1];
          if (br1c1) {
            for (var i2 = 0; i2 < refHeight; i2++) {
              for (var j2 = 0; j2 < refWidth; j2++) {
                data[(i2 + r1) * cWidth + j2 + c1] += ref[i2 * refWidth + j2] * br1c1;
              }
            }
          }
        }
      }
      var c2 = {
        data,
        width: cWidth,
        height: cHeight
      };
      return reshape(c2, shape, refHeight, b2.height, refWidth, b2.width);
    }
    function boxConv(a2, _a, shape) {
      var data = _a.data, width = _a.width, height = _a.height;
      if (shape === void 0) {
        shape = "full";
      }
      var b1 = ones_1.ones(height, 1);
      var b2 = ones_1.ones(1, width);
      var out = convn(a2, b1, b2, shape);
      return math_1.multiply2d(out, data[0]);
    }
    function isBoxKernel(_a) {
      var data = _a.data;
      var expected = data[0];
      for (var i2 = 1; i2 < data.length; i2++) {
        if (data[i2] !== expected) {
          return false;
        }
      }
      return true;
    }
    function convn(a2, b1, b2, shape) {
      if (shape === void 0) {
        shape = "full";
      }
      var mb = Math.max(b1.height, b1.width);
      var nb = Math.max(b2.height, b2.width);
      var temp = mxConv2(a2, b1, "full");
      var c2 = mxConv2(temp, b2, "full");
      return reshape(c2, shape, a2.height, mb, a2.width, nb);
    }
    function reshape(c2, shape, ma, mb, na, nb) {
      if (shape === "full") {
        return c2;
      } else if (shape === "same") {
        var rowStart = Math.ceil((c2.height - ma) / 2);
        var colStart = Math.ceil((c2.width - na) / 2);
        return sub_1.sub(c2, rowStart, ma, colStart, na);
      }
      return sub_1.sub(c2, mb - 1, ma - mb + 1, nb - 1, na - nb + 1);
    }
    function conv2() {
      var args = [];
      for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
      }
      if (args[2] && args[2].data) {
        return convn.apply(void 0, args);
      } else if (isBoxKernel(args[1])) {
        return boxConv.apply(void 0, args);
      }
      return mxConv2.apply(void 0, args);
    }
    exports2.conv2 = conv2;
  }
});

// ../../node_modules/.pnpm/ssim.js@3.5.0/node_modules/ssim.js/dist/matlab/filter2.js
var require_filter2 = __commonJS({
  "../../node_modules/.pnpm/ssim.js@3.5.0/node_modules/ssim.js/dist/matlab/filter2.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.filter2 = void 0;
    var conv2_1 = require_conv2();
    function rotate1802d(_a) {
      var ref = _a.data, width = _a.width, height = _a.height;
      var data = new Array(ref.length);
      for (var i2 = 0; i2 < height; i2++) {
        for (var j2 = 0; j2 < width; j2++) {
          data[i2 * width + j2] = ref[(height - 1 - i2) * width + width - 1 - j2];
        }
      }
      return {
        data,
        width,
        height
      };
    }
    function filter2(h2, X2, shape) {
      if (shape === void 0) {
        shape = "same";
      }
      return conv2_1.conv2(X2, rotate1802d(h2), shape);
    }
    exports2.filter2 = filter2;
  }
});

// ../../node_modules/.pnpm/ssim.js@3.5.0/node_modules/ssim.js/dist/matlab/fspecial.js
var require_fspecial = __commonJS({
  "../../node_modules/.pnpm/ssim.js@3.5.0/node_modules/ssim.js/dist/matlab/fspecial.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.fspecial = void 0;
    var math_1 = require_math();
    function rangeSquare2d(length) {
      var size = length * 2 + 1;
      var data = new Array(Math.pow(size, 2));
      for (var x2 = 0; x2 < size; x2++) {
        for (var y2 = 0; y2 < size; y2++) {
          data[x2 * size + y2] = Math.pow(x2 - length, 2) + Math.pow(y2 - length, 2);
        }
      }
      return {
        data,
        width: size,
        height: size
      };
    }
    function gaussianFilter2d(_a, \u03C3) {
      var ref = _a.data, width = _a.width, height = _a.height;
      var data = new Array(ref.length);
      for (var x2 = 0; x2 < ref.length; x2++) {
        data[x2] = Math.exp(-ref[x2] / (2 * Math.pow(\u03C3, 2)));
      }
      return {
        data,
        width,
        height
      };
    }
    function fspecial(_type, hsize, \u03C3) {
      if (hsize === void 0) {
        hsize = 3;
      }
      if (\u03C3 === void 0) {
        \u03C3 = 1.5;
      }
      hsize = (hsize - 1) / 2;
      var pos = rangeSquare2d(hsize);
      var gauss = gaussianFilter2d(pos, \u03C3);
      var total = math_1.sum2d(gauss);
      return math_1.divide2d(gauss, total);
    }
    exports2.fspecial = fspecial;
  }
});

// ../../node_modules/.pnpm/ssim.js@3.5.0/node_modules/ssim.js/dist/matlab/mod.js
var require_mod = __commonJS({
  "../../node_modules/.pnpm/ssim.js@3.5.0/node_modules/ssim.js/dist/matlab/mod.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.mod = void 0;
    function mod(x2, y2) {
      return x2 - y2 * Math.floor(x2 / y2);
    }
    exports2.mod = mod;
  }
});

// ../../node_modules/.pnpm/ssim.js@3.5.0/node_modules/ssim.js/dist/matlab/padarray.js
var require_padarray = __commonJS({
  "../../node_modules/.pnpm/ssim.js@3.5.0/node_modules/ssim.js/dist/matlab/padarray.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.padarray = void 0;
    var mod_1 = require_mod();
    function mirrorHorizonal(_a) {
      var ref = _a.data, width = _a.width, height = _a.height;
      var data = new Array(ref.length);
      for (var x2 = 0; x2 < height; x2++) {
        for (var y2 = 0; y2 < width; y2++) {
          data[x2 * width + y2] = ref[x2 * width + width - 1 - y2];
        }
      }
      return {
        data,
        width,
        height
      };
    }
    function mirrorVertical(_a) {
      var ref = _a.data, width = _a.width, height = _a.height;
      var data = new Array(ref.length);
      for (var x2 = 0; x2 < height; x2++) {
        for (var y2 = 0; y2 < width; y2++) {
          data[x2 * width + y2] = ref[(height - 1 - x2) * width + y2];
        }
      }
      return {
        data,
        width,
        height
      };
    }
    function concatHorizontal(A2, B2) {
      var width = A2.width + B2.width;
      var data = new Array(A2.height * width);
      for (var x2 = 0; x2 < A2.height; x2++) {
        for (var y2 = 0; y2 < A2.width; y2++) {
          data[x2 * width + y2] = A2.data[x2 * A2.width + y2];
        }
        for (var y2 = 0; y2 < B2.width; y2++) {
          data[x2 * width + y2 + A2.width] = B2.data[x2 * B2.width + y2];
        }
      }
      return {
        data,
        width,
        height: A2.height
      };
    }
    function concatVertical(A2, B2) {
      return {
        data: A2.data.concat(B2.data),
        height: A2.height + B2.height,
        width: A2.width
      };
    }
    function padHorizontal(A2, pad) {
      var width = A2.width + 2 * pad;
      var data = new Array(width * A2.height);
      var mirrored = concatHorizontal(A2, mirrorHorizonal(A2));
      for (var x2 = 0; x2 < A2.height; x2++) {
        for (var y2 = -pad; y2 < A2.width + pad; y2++) {
          data[x2 * width + y2 + pad] = mirrored.data[x2 * mirrored.width + mod_1.mod(y2, mirrored.width)];
        }
      }
      return {
        data,
        width,
        height: A2.height
      };
    }
    function padVertical(A2, pad) {
      var mirrored = concatVertical(A2, mirrorVertical(A2));
      var height = A2.height + pad * 2;
      var data = new Array(A2.width * height);
      for (var x2 = -pad; x2 < A2.height + pad; x2++) {
        for (var y2 = 0; y2 < A2.width; y2++) {
          data[(x2 + pad) * A2.width + y2] = mirrored.data[mod_1.mod(x2, mirrored.height) * A2.width + y2];
        }
      }
      return {
        data,
        width: A2.width,
        height
      };
    }
    function fastPadding(A2, _a) {
      var padHeight = _a[0], padWidth = _a[1];
      var width = A2.width + padWidth * 2;
      var height = A2.height + padHeight * 2;
      var data = new Array(width * height);
      for (var x2 = -padHeight; x2 < 0; x2++) {
        for (var y2 = -padWidth; y2 < 0; y2++) {
          data[(x2 + padHeight) * width + y2 + padWidth] = A2.data[(Math.abs(x2) - 1) * A2.width + Math.abs(y2) - 1];
        }
        for (var y2 = 0; y2 < A2.width; y2++) {
          data[(x2 + padHeight) * width + y2 + padWidth] = A2.data[(Math.abs(x2) - 1) * A2.width + y2];
        }
        for (var y2 = A2.width; y2 < A2.width + padWidth; y2++) {
          data[(x2 + padHeight) * width + y2 + padWidth] = A2.data[(Math.abs(x2) - 1) * A2.width + 2 * A2.width - y2 - 1];
        }
      }
      for (var x2 = 0; x2 < A2.height; x2++) {
        for (var y2 = -padWidth; y2 < 0; y2++) {
          data[(x2 + padHeight) * width + y2 + padWidth] = A2.data[x2 * A2.width + Math.abs(y2) - 1];
        }
        for (var y2 = 0; y2 < A2.width; y2++) {
          data[(x2 + padHeight) * width + y2 + padWidth] = A2.data[x2 * A2.width + y2];
        }
        for (var y2 = A2.width; y2 < A2.width + padWidth; y2++) {
          data[(x2 + padHeight) * width + y2 + padWidth] = A2.data[x2 * A2.width + 2 * A2.width - y2 - 1];
        }
      }
      for (var x2 = A2.height; x2 < A2.height + padHeight; x2++) {
        for (var y2 = -padWidth; y2 < 0; y2++) {
          data[(x2 + padHeight) * width + y2 + padWidth] = A2.data[(2 * A2.height - x2 - 1) * A2.width + Math.abs(y2) - 1];
        }
        for (var y2 = 0; y2 < A2.width; y2++) {
          data[(x2 + padHeight) * width + y2 + padWidth] = A2.data[(2 * A2.height - x2 - 1) * A2.width + y2];
        }
        for (var y2 = A2.width; y2 < A2.width + padWidth; y2++) {
          data[(x2 + padHeight) * width + y2 + padWidth] = A2.data[(2 * A2.height - x2 - 1) * A2.width + 2 * A2.width - y2 - 1];
        }
      }
      return {
        data,
        width,
        height
      };
    }
    function padarray(A2, _a, _padval, _direction) {
      var padHeight = _a[0], padWidth = _a[1];
      if (A2.height >= padHeight && A2.width >= padWidth) {
        return fastPadding(A2, [padHeight, padWidth]);
      }
      return padVertical(padHorizontal(A2, padWidth), padHeight);
    }
    exports2.padarray = padarray;
  }
});

// ../../node_modules/.pnpm/ssim.js@3.5.0/node_modules/ssim.js/dist/matlab/imfilter.js
var require_imfilter = __commonJS({
  "../../node_modules/.pnpm/ssim.js@3.5.0/node_modules/ssim.js/dist/matlab/imfilter.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.imfilter = void 0;
    var mod_1 = require_mod();
    var padarray_1 = require_padarray();
    var math_1 = require_math();
    var filter2_1 = require_filter2();
    function padMatrix(A2, frows, fcols, pad) {
      A2 = padarray_1.padarray(A2, math_1.floor([frows / 2, fcols / 2]), pad);
      if (mod_1.mod(frows, 2) === 0) {
        A2.data = A2.data.slice(0, -A2.width);
        A2.height--;
      }
      if (mod_1.mod(fcols, 2) === 0) {
        var data = [];
        for (var x2 = 0; x2 < A2.data.length; x2++) {
          if ((x2 + 1) % A2.width !== 0) {
            data.push(A2.data[x2]);
          }
        }
        A2.data = data;
        A2.width--;
      }
      return A2;
    }
    function getConv2Size(resSize) {
      if (resSize === "same") {
        resSize = "valid";
      }
      return resSize;
    }
    function imfilter(A2, f2, pad, resSize) {
      if (pad === void 0) {
        pad = "symmetric";
      }
      if (resSize === void 0) {
        resSize = "same";
      }
      A2 = padMatrix(A2, f2.width, f2.height, pad);
      resSize = getConv2Size(resSize);
      return filter2_1.filter2(f2, A2, resSize);
    }
    exports2.imfilter = imfilter;
  }
});

// ../../node_modules/.pnpm/ssim.js@3.5.0/node_modules/ssim.js/dist/matlab/normpdf.js
var require_normpdf = __commonJS({
  "../../node_modules/.pnpm/ssim.js@3.5.0/node_modules/ssim.js/dist/matlab/normpdf.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.normpdf = void 0;
    function normpdf(_a, \u00B5, \u03C3) {
      var ref = _a.data, width = _a.width, height = _a.height;
      if (\u00B5 === void 0) {
        \u00B5 = 0;
      }
      if (\u03C3 === void 0) {
        \u03C3 = 1;
      }
      var SQ2PI = 2.5066282746310007;
      var data = new Array(ref.length);
      for (var i2 = 0; i2 < ref.length; i2++) {
        var z15 = (ref[i2] - \u00B5) / \u03C3;
        data[i2] = Math.exp(-Math.pow(z15, 2) / 2) / (\u03C3 * SQ2PI);
      }
      return {
        data,
        width,
        height
      };
    }
    exports2.normpdf = normpdf;
  }
});

// ../../node_modules/.pnpm/ssim.js@3.5.0/node_modules/ssim.js/dist/matlab/rgb2gray.js
var require_rgb2gray = __commonJS({
  "../../node_modules/.pnpm/ssim.js@3.5.0/node_modules/ssim.js/dist/matlab/rgb2gray.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.rgb2grayInteger = exports2.rgb2gray = void 0;
    function rgb2gray(_a) {
      var d2 = _a.data, width = _a.width, height = _a.height;
      var uint8Array = new Uint8Array(width * height);
      for (var i2 = 0; i2 < d2.length; i2 += 4) {
        var grayIndex = i2 / 4;
        uint8Array[grayIndex] = 0.29894 * d2[i2] + 0.58704 * d2[i2 + 1] + 0.11402 * d2[i2 + 2] + 0.5;
      }
      return {
        data: Array.from(uint8Array),
        width,
        height
      };
    }
    exports2.rgb2gray = rgb2gray;
    function rgb2grayInteger(_a) {
      var d2 = _a.data, width = _a.width, height = _a.height;
      var array = new Array(width * height);
      for (var i2 = 0; i2 < d2.length; i2 += 4) {
        var grayIndex = i2 / 4;
        array[grayIndex] = 77 * d2[i2] + 150 * d2[i2 + 1] + 29 * d2[i2 + 2] + 128 >> 8;
      }
      return {
        data: array,
        width,
        height
      };
    }
    exports2.rgb2grayInteger = rgb2grayInteger;
  }
});

// ../../node_modules/.pnpm/ssim.js@3.5.0/node_modules/ssim.js/dist/matlab/skip2d.js
var require_skip2d = __commonJS({
  "../../node_modules/.pnpm/ssim.js@3.5.0/node_modules/ssim.js/dist/matlab/skip2d.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.skip2d = void 0;
    function skip2d(A2, _a, _b) {
      var startRow = _a[0], everyRow = _a[1], endRow = _a[2];
      var startCol = _b[0], everyCol = _b[1], endCol = _b[2];
      var width = Math.ceil((endCol - startCol) / everyCol);
      var height = Math.ceil((endRow - startRow) / everyRow);
      var data = new Array(width * height);
      for (var i2 = 0; i2 < height; i2++) {
        for (var j2 = 0; j2 < width; j2++) {
          var Ai = startRow + i2 * everyRow;
          var Aj = startCol + j2 * everyCol;
          data[i2 * width + j2] = A2.data[Ai * A2.width + Aj];
        }
      }
      return {
        data,
        width,
        height
      };
    }
    exports2.skip2d = skip2d;
  }
});

// ../../node_modules/.pnpm/ssim.js@3.5.0/node_modules/ssim.js/dist/matlab/transpose.js
var require_transpose = __commonJS({
  "../../node_modules/.pnpm/ssim.js@3.5.0/node_modules/ssim.js/dist/matlab/transpose.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.transpose = void 0;
    function transpose(_a) {
      var ref = _a.data, width = _a.width, height = _a.height;
      var data = new Array(width * height);
      for (var i2 = 0; i2 < height; i2++) {
        for (var j2 = 0; j2 < width; j2++) {
          data[j2 * height + i2] = ref[i2 * width + j2];
        }
      }
      return {
        data,
        height: width,
        width: height
      };
    }
    exports2.transpose = transpose;
  }
});

// ../../node_modules/.pnpm/ssim.js@3.5.0/node_modules/ssim.js/dist/matlab/index.js
var require_matlab = __commonJS({
  "../../node_modules/.pnpm/ssim.js@3.5.0/node_modules/ssim.js/dist/matlab/index.js"(exports2) {
    "use strict";
    var __createBinding = exports2 && exports2.__createBinding || (Object.create ? (function(o2, m2, k2, k22) {
      if (k22 === void 0) k22 = k2;
      Object.defineProperty(o2, k22, { enumerable: true, get: function() {
        return m2[k2];
      } });
    }) : (function(o2, m2, k2, k22) {
      if (k22 === void 0) k22 = k2;
      o2[k22] = m2[k2];
    }));
    var __exportStar = exports2 && exports2.__exportStar || function(m2, exports3) {
      for (var p2 in m2) if (p2 !== "default" && !Object.prototype.hasOwnProperty.call(exports3, p2)) __createBinding(exports3, m2, p2);
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    __exportStar(require_conv2(), exports2);
    __exportStar(require_filter2(), exports2);
    __exportStar(require_fspecial(), exports2);
    __exportStar(require_imfilter(), exports2);
    __exportStar(require_normpdf(), exports2);
    __exportStar(require_ones(), exports2);
    __exportStar(require_padarray(), exports2);
    __exportStar(require_rgb2gray(), exports2);
    __exportStar(require_skip2d(), exports2);
    __exportStar(require_sub(), exports2);
    __exportStar(require_transpose(), exports2);
    __exportStar(require_zeros(), exports2);
  }
});

// ../../node_modules/.pnpm/ssim.js@3.5.0/node_modules/ssim.js/dist/ssim.js
var require_ssim = __commonJS({
  "../../node_modules/.pnpm/ssim.js@3.5.0/node_modules/ssim.js/dist/ssim.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.ssim = void 0;
    var math_1 = require_math();
    var matlab_1 = require_matlab();
    function ssim2(pixels1, pixels2, options) {
      var w2 = matlab_1.normpdf(getRange(options.windowSize), 0, 1.5);
      var L2 = Math.pow(2, options.bitDepth) - 1;
      var c1 = Math.pow(options.k1 * L2, 2);
      var c2 = Math.pow(options.k2 * L2, 2);
      w2 = math_1.divide2d(w2, math_1.sum2d(w2));
      var wt2 = matlab_1.transpose(w2);
      var \u03BC1 = matlab_1.conv2(pixels1, w2, wt2, "valid");
      var \u03BC2 = matlab_1.conv2(pixels2, w2, wt2, "valid");
      var \u03BC1Sq = math_1.square2d(\u03BC1);
      var \u03BC2Sq = math_1.square2d(\u03BC2);
      var \u03BC12 = math_1.multiply2d(\u03BC1, \u03BC2);
      var pixels1Sq = math_1.square2d(pixels1);
      var pixels2Sq = math_1.square2d(pixels2);
      var \u03C31Sq = math_1.subtract2d(matlab_1.conv2(pixels1Sq, w2, wt2, "valid"), \u03BC1Sq);
      var \u03C32Sq = math_1.subtract2d(matlab_1.conv2(pixels2Sq, w2, wt2, "valid"), \u03BC2Sq);
      var \u03C312 = math_1.subtract2d(matlab_1.conv2(math_1.multiply2d(pixels1, pixels2), w2, wt2, "valid"), \u03BC12);
      if (c1 > 0 && c2 > 0) {
        return genSSIM(\u03BC12, \u03C312, \u03BC1Sq, \u03BC2Sq, \u03C31Sq, \u03C32Sq, c1, c2);
      }
      return genUQI(\u03BC12, \u03C312, \u03BC1Sq, \u03BC2Sq, \u03C31Sq, \u03C32Sq);
    }
    exports2.ssim = ssim2;
    function getRange(size) {
      var offset = Math.floor(size / 2);
      var data = new Array(offset * 2 + 1);
      for (var x2 = -offset; x2 <= offset; x2++) {
        data[x2 + offset] = Math.abs(x2);
      }
      return {
        data,
        width: data.length,
        height: 1
      };
    }
    function genSSIM(\u03BC12, \u03C312, \u03BC1Sq, \u03BC2Sq, \u03C31Sq, \u03C32Sq, c1, c2) {
      var num1 = math_1.add2d(math_1.multiply2d(\u03BC12, 2), c1);
      var num2 = math_1.add2d(math_1.multiply2d(\u03C312, 2), c2);
      var denom1 = math_1.add2d(math_1.add2d(\u03BC1Sq, \u03BC2Sq), c1);
      var denom2 = math_1.add2d(math_1.add2d(\u03C31Sq, \u03C32Sq), c2);
      return math_1.divide2d(math_1.multiply2d(num1, num2), math_1.multiply2d(denom1, denom2));
    }
    function genUQI(\u03BC12, \u03C312, \u03BC1Sq, \u03BC2Sq, \u03C31Sq, \u03C32Sq) {
      var numerator1 = math_1.multiply2d(\u03BC12, 2);
      var numerator2 = math_1.multiply2d(\u03C312, 2);
      var denominator1 = math_1.add2d(\u03BC1Sq, \u03BC2Sq);
      var denominator2 = math_1.add2d(\u03C31Sq, \u03C32Sq);
      return math_1.divide2d(math_1.multiply2d(numerator1, numerator2), math_1.multiply2d(denominator1, denominator2));
    }
  }
});

// ../../node_modules/.pnpm/ssim.js@3.5.0/node_modules/ssim.js/dist/originalSsim.js
var require_originalSsim = __commonJS({
  "../../node_modules/.pnpm/ssim.js@3.5.0/node_modules/ssim.js/dist/originalSsim.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.originalSsim = void 0;
    var math_1 = require_math();
    var matlab_1 = require_matlab();
    function originalSsim(pixels1, pixels2, options) {
      var w2 = matlab_1.fspecial("gaussian", options.windowSize, 1.5);
      var L2 = Math.pow(2, options.bitDepth) - 1;
      var c1 = Math.pow(options.k1 * L2, 2);
      var c2 = Math.pow(options.k2 * L2, 2);
      w2 = math_1.divide2d(w2, math_1.sum2d(w2));
      var \u03BC1 = matlab_1.filter2(w2, pixels1, "valid");
      var \u03BC2 = matlab_1.filter2(w2, pixels2, "valid");
      var \u03BC1Sq = math_1.square2d(\u03BC1);
      var \u03BC2Sq = math_1.square2d(\u03BC2);
      var \u03BC12 = math_1.multiply2d(\u03BC1, \u03BC2);
      var pixels1Sq = math_1.square2d(pixels1);
      var pixels2Sq = math_1.square2d(pixels2);
      var \u03C31Sq = math_1.subtract2d(matlab_1.filter2(w2, pixels1Sq, "valid"), \u03BC1Sq);
      var \u03C32Sq = math_1.subtract2d(matlab_1.filter2(w2, pixels2Sq, "valid"), \u03BC2Sq);
      var \u03C312 = math_1.subtract2d(matlab_1.filter2(w2, math_1.multiply2d(pixels1, pixels2), "valid"), \u03BC12);
      if (c1 > 0 && c2 > 0) {
        var num1 = math_1.add2d(math_1.multiply2d(\u03BC12, 2), c1);
        var num2 = math_1.add2d(math_1.multiply2d(\u03C312, 2), c2);
        var denom1 = math_1.add2d(math_1.add2d(\u03BC1Sq, \u03BC2Sq), c1);
        var denom2 = math_1.add2d(math_1.add2d(\u03C31Sq, \u03C32Sq), c2);
        return math_1.divide2d(math_1.multiply2d(num1, num2), math_1.multiply2d(denom1, denom2));
      }
      var numerator1 = math_1.multiply2d(\u03BC12, 2);
      var numerator2 = math_1.multiply2d(\u03C312, 2);
      var denominator1 = math_1.add2d(\u03BC1Sq, \u03BC2Sq);
      var denominator2 = math_1.add2d(\u03C31Sq, \u03C32Sq);
      return math_1.divide2d(math_1.multiply2d(numerator1, numerator2), math_1.multiply2d(denominator1, denominator2));
    }
    exports2.originalSsim = originalSsim;
  }
});

// ../../node_modules/.pnpm/ssim.js@3.5.0/node_modules/ssim.js/dist/bezkrovnySsim.js
var require_bezkrovnySsim = __commonJS({
  "../../node_modules/.pnpm/ssim.js@3.5.0/node_modules/ssim.js/dist/bezkrovnySsim.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.bezkrovnySsim = void 0;
    var math_1 = require_math();
    var matlab_1 = require_matlab();
    function bezkrovnySsim(pixels1, pixels2, options) {
      var windowSize = options.windowSize;
      var width = Math.ceil(pixels1.width / windowSize);
      var height = Math.ceil(pixels1.height / windowSize);
      var data = new Array(width * height);
      var counter = 0;
      for (var y2 = 0; y2 < pixels1.height; y2 += windowSize) {
        for (var x2 = 0; x2 < pixels1.width; x2 += windowSize) {
          var windowWidth = Math.min(windowSize, pixels1.width - x2);
          var windowHeight = Math.min(windowSize, pixels1.height - y2);
          var values1 = matlab_1.sub(pixels1, x2, windowHeight, y2, windowWidth);
          var values2 = matlab_1.sub(pixels2, x2, windowHeight, y2, windowWidth);
          data[counter++] = windowSsim(values1, values2, options);
        }
      }
      return { data, width, height };
    }
    exports2.bezkrovnySsim = bezkrovnySsim;
    function windowSsim(_a, _b, _c) {
      var values1 = _a.data;
      var values2 = _b.data;
      var bitDepth = _c.bitDepth, k1 = _c.k1, k2 = _c.k2;
      var L2 = Math.pow(2, bitDepth) - 1;
      var c1 = Math.pow(k1 * L2, 2);
      var c2 = Math.pow(k2 * L2, 2);
      var average1 = math_1.average(values1);
      var average2 = math_1.average(values2);
      var \u03C3Sqx = math_1.variance(values1, average1);
      var \u03C3Sqy = math_1.variance(values2, average2);
      var \u03C3xy = math_1.covariance(values1, values2, average1, average2);
      var numerator = (2 * average1 * average2 + c1) * (2 * \u03C3xy + c2);
      var denom1 = Math.pow(average1, 2) + Math.pow(average2, 2) + c1;
      var denom2 = \u03C3Sqx + \u03C3Sqy + c2;
      return numerator / (denom1 * denom2);
    }
  }
});

// ../../node_modules/.pnpm/ssim.js@3.5.0/node_modules/ssim.js/dist/downsample.js
var require_downsample = __commonJS({
  "../../node_modules/.pnpm/ssim.js@3.5.0/node_modules/ssim.js/dist/downsample.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.downsample = void 0;
    var math_1 = require_math();
    var matlab_1 = require_matlab();
    function imageDownsample(pixels, filter, f2) {
      var imdown = matlab_1.imfilter(pixels, filter, "symmetric", "same");
      return matlab_1.skip2d(imdown, [0, f2, imdown.height], [0, f2, imdown.width]);
    }
    function originalDownsample(pixels1, pixels2, maxSize) {
      if (maxSize === void 0) {
        maxSize = 256;
      }
      var factor = Math.min(pixels1.width, pixels2.height) / maxSize;
      var f2 = Math.round(factor);
      if (f2 > 1) {
        var lpf = matlab_1.ones(f2);
        lpf = math_1.divide2d(lpf, math_1.sum2d(lpf));
        pixels1 = imageDownsample(pixels1, lpf, f2);
        pixels2 = imageDownsample(pixels2, lpf, f2);
      }
      return [pixels1, pixels2];
    }
    function downsample(pixels, options) {
      if (options.downsample === "original") {
        return originalDownsample(pixels[0], pixels[1], options.maxSize);
      }
      return pixels;
    }
    exports2.downsample = downsample;
  }
});

// ../../node_modules/.pnpm/ssim.js@3.5.0/node_modules/ssim.js/dist/defaults.js
var require_defaults = __commonJS({
  "../../node_modules/.pnpm/ssim.js@3.5.0/node_modules/ssim.js/dist/defaults.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.defaults = void 0;
    exports2.defaults = {
      windowSize: 11,
      k1: 0.01,
      k2: 0.03,
      bitDepth: 8,
      downsample: "original",
      ssim: "weber",
      maxSize: 256,
      rgb2grayVersion: "integer"
    };
  }
});

// ../../node_modules/.pnpm/ssim.js@3.5.0/node_modules/ssim.js/dist/weberSsim.js
var require_weberSsim = __commonJS({
  "../../node_modules/.pnpm/ssim.js@3.5.0/node_modules/ssim.js/dist/weberSsim.js"(exports2) {
    "use strict";
    var __assign = exports2 && exports2.__assign || function() {
      __assign = Object.assign || function(t2) {
        for (var s2, i2 = 1, n2 = arguments.length; i2 < n2; i2++) {
          s2 = arguments[i2];
          for (var p2 in s2) if (Object.prototype.hasOwnProperty.call(s2, p2))
            t2[p2] = s2[p2];
        }
        return t2;
      };
      return __assign.apply(this, arguments);
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.weberSsim = exports2.windowCovariance = exports2.windowVariance = exports2.windowSums = exports2.windowMatrix = exports2.partialSumMatrix2 = exports2.partialSumMatrix1 = void 0;
    function edgeHandler(w2, h2, sumArray, matrixWidth) {
      var rightEdge = sumArray[h2 * matrixWidth + w2 + 1];
      var bottomEdge = sumArray[(h2 + 1) * matrixWidth + w2];
      var bottomRightEdge = sumArray[(h2 + 1) * matrixWidth + w2 + 1];
      return { rightEdge, bottomEdge, bottomRightEdge };
    }
    function partialSumMatrix1(pixels, f2) {
      var width = pixels.width, height = pixels.height, data = pixels.data;
      var matrixWidth = width + 1;
      var matrixHeight = height + 1;
      var sumArray = new Int32Array(matrixWidth * matrixHeight);
      for (var h2 = height - 1; h2 >= 0; --h2) {
        for (var w2 = width - 1; w2 >= 0; --w2) {
          var _a = edgeHandler(w2, h2, sumArray, matrixWidth), rightEdge = _a.rightEdge, bottomEdge = _a.bottomEdge, bottomRightEdge = _a.bottomRightEdge;
          sumArray[h2 * matrixWidth + w2] = f2(data[h2 * width + w2], w2, h2) + rightEdge + bottomEdge - bottomRightEdge;
        }
      }
      return { data: sumArray, height: matrixHeight, width: matrixWidth };
    }
    exports2.partialSumMatrix1 = partialSumMatrix1;
    function partialSumMatrix2(pixels1, pixels2, f2) {
      var width = pixels1.width, height = pixels1.height, data1 = pixels1.data;
      var data2 = pixels2.data;
      var matrixWidth = width + 1;
      var matrixHeight = height + 1;
      var sumArray = new Int32Array(matrixWidth * matrixHeight);
      for (var h2 = height - 1; h2 >= 0; --h2) {
        for (var w2 = width - 1; w2 >= 0; --w2) {
          var _a = edgeHandler(w2, h2, sumArray, matrixWidth), rightEdge = _a.rightEdge, bottomEdge = _a.bottomEdge, bottomRightEdge = _a.bottomRightEdge;
          var offset = h2 * width + w2;
          sumArray[h2 * matrixWidth + w2] = f2(data1[offset], data2[offset], w2, h2) + rightEdge + bottomEdge - bottomRightEdge;
        }
      }
      return { data: sumArray, height: matrixHeight, width: matrixWidth };
    }
    exports2.partialSumMatrix2 = partialSumMatrix2;
    function windowMatrix(sumMatrix, windowSize, divisor) {
      var matrixWidth = sumMatrix.width, matrixHeight = sumMatrix.height, sumArray = sumMatrix.data;
      var imageWidth = matrixWidth - 1;
      var imageHeight = matrixHeight - 1;
      var windowWidth = imageWidth - windowSize + 1;
      var windowHeight = imageHeight - windowSize + 1;
      var windows = new Int32Array(windowWidth * windowHeight);
      for (var h2 = 0; h2 < imageHeight; ++h2) {
        for (var w2 = 0; w2 < imageWidth; ++w2) {
          if (w2 < windowWidth && h2 < windowHeight) {
            var sum = (
              // value at (w,h)
              sumArray[matrixWidth * h2 + w2] - // value at (w+windowSize,h) == right side
              sumArray[matrixWidth * h2 + w2 + windowSize] - // value at (w,h+windowSize) == bottom side
              sumArray[matrixWidth * (h2 + windowSize) + w2] + // value at (w+windowSize, h+windowSize) == bottomRight corner
              sumArray[matrixWidth * (h2 + windowSize) + w2 + windowSize]
            );
            windows[h2 * windowWidth + w2] = sum / divisor;
          }
        }
      }
      return { height: windowHeight, width: windowWidth, data: windows };
    }
    exports2.windowMatrix = windowMatrix;
    function windowSums(pixels, windowSize) {
      return windowMatrix(partialSumMatrix1(pixels, function(a2) {
        return a2;
      }), windowSize, 1);
    }
    exports2.windowSums = windowSums;
    function windowVariance(pixels, sums, windowSize) {
      var varianceCalculation = function(v2) {
        return v2 * v2;
      };
      var windowSquared = windowSize * windowSize;
      var varX = windowMatrix(partialSumMatrix1(pixels, varianceCalculation), windowSize, 1);
      for (var i2 = 0; i2 < sums.data.length; ++i2) {
        var mean = sums.data[i2] / windowSquared;
        var sumSquares = varX.data[i2] / windowSquared;
        var squareMeans = mean * mean;
        varX.data[i2] = 1024 * (sumSquares - squareMeans);
      }
      return varX;
    }
    exports2.windowVariance = windowVariance;
    function windowCovariance(pixels1, pixels2, sums1, sums2, windowSize) {
      var covarianceCalculation = function(a2, b2) {
        return a2 * b2;
      };
      var windowSquared = windowSize * windowSize;
      var covXY = windowMatrix(partialSumMatrix2(pixels1, pixels2, covarianceCalculation), windowSize, 1);
      for (var i2 = 0; i2 < sums1.data.length; ++i2) {
        covXY.data[i2] = 1024 * (covXY.data[i2] / windowSquared - sums1.data[i2] / windowSquared * (sums2.data[i2] / windowSquared));
      }
      return covXY;
    }
    exports2.windowCovariance = windowCovariance;
    function weberSsim(pixels1, pixels2, options) {
      var bitDepth = options.bitDepth, k1 = options.k1, k2 = options.k2, windowSize = options.windowSize;
      var L2 = Math.pow(2, bitDepth) - 1;
      var c1 = k1 * L2 * (k1 * L2);
      var c2 = k2 * L2 * (k2 * L2);
      var windowSquared = windowSize * windowSize;
      var pixels1Rounded = __assign(__assign({}, pixels1), { data: Int32Array.from(pixels1.data, function(v2) {
        return v2 + 0.5;
      }) });
      var pixels2Rounded = __assign(__assign({}, pixels2), { data: Int32Array.from(pixels2.data, function(v2) {
        return v2 + 0.5;
      }) });
      var sums1 = windowSums(pixels1Rounded, windowSize);
      var variance1 = windowVariance(pixels1Rounded, sums1, windowSize);
      var sums2 = windowSums(pixels2Rounded, windowSize);
      var variance2 = windowVariance(pixels2Rounded, sums2, windowSize);
      var covariance = windowCovariance(pixels1Rounded, pixels2Rounded, sums1, sums2, windowSize);
      var size = sums1.data.length;
      var mssim = 0;
      var ssims = new Array(size);
      for (var i2 = 0; i2 < size; ++i2) {
        var meanx = sums1.data[i2] / windowSquared;
        var meany = sums2.data[i2] / windowSquared;
        var varx = variance1.data[i2] / 1024;
        var vary = variance2.data[i2] / 1024;
        var cov = covariance.data[i2] / 1024;
        var na = 2 * meanx * meany + c1;
        var nb = 2 * cov + c2;
        var da = meanx * meanx + meany * meany + c1;
        var db = varx + vary + c2;
        var ssim2 = na * nb / da / db;
        ssims[i2] = ssim2;
        if (i2 == 0) {
          mssim = ssim2;
        } else {
          mssim = mssim + (ssim2 - mssim) / (i2 + 1);
        }
      }
      return { data: ssims, width: sums1.width, height: sums1.height, mssim };
    }
    exports2.weberSsim = weberSsim;
  }
});

// ../../node_modules/.pnpm/ssim.js@3.5.0/node_modules/ssim.js/dist/index.js
var require_dist3 = __commonJS({
  "../../node_modules/.pnpm/ssim.js@3.5.0/node_modules/ssim.js/dist/index.js"(exports2) {
    "use strict";
    var __assign = exports2 && exports2.__assign || function() {
      __assign = Object.assign || function(t2) {
        for (var s2, i2 = 1, n2 = arguments.length; i2 < n2; i2++) {
          s2 = arguments[i2];
          for (var p2 in s2) if (Object.prototype.hasOwnProperty.call(s2, p2))
            t2[p2] = s2[p2];
        }
        return t2;
      };
      return __assign.apply(this, arguments);
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.ssim = exports2.getOptions = void 0;
    var matlab_1 = require_matlab();
    var math_1 = require_math();
    var ssim_1 = require_ssim();
    var originalSsim_1 = require_originalSsim();
    var bezkrovnySsim_1 = require_bezkrovnySsim();
    var downsample_1 = require_downsample();
    var defaults_1 = require_defaults();
    var weberSsim_1 = require_weberSsim();
    var ssimTargets = {
      fast: ssim_1.ssim,
      original: originalSsim_1.originalSsim,
      bezkrovny: bezkrovnySsim_1.bezkrovnySsim,
      weber: weberSsim_1.weberSsim
    };
    function validateOptions(options) {
      Object.keys(options).forEach(function(option) {
        if (!(option in defaults_1.defaults)) {
          throw new Error('"' + option + '" is not a valid option');
        }
      });
      if ("k1" in options && (typeof options.k1 !== "number" || options.k1 < 0)) {
        throw new Error("Invalid k1 value. Default is " + defaults_1.defaults.k1);
      }
      if ("k2" in options && (typeof options.k2 !== "number" || options.k2 < 0)) {
        throw new Error("Invalid k2 value. Default is " + defaults_1.defaults.k2);
      }
      if (!(options.ssim in ssimTargets)) {
        throw new Error("Invalid ssim option (use: " + Object.keys(ssimTargets).join(", ") + ")");
      }
    }
    function getOptions(userOptions) {
      var options = __assign(__assign({}, defaults_1.defaults), userOptions);
      validateOptions(options);
      return options;
    }
    exports2.getOptions = getOptions;
    function validateDimensions(_a) {
      var pixels1 = _a[0], pixels2 = _a[1], options = _a[2];
      if (pixels1.width !== pixels2.width || pixels1.height !== pixels2.height) {
        throw new Error("Image dimensions do not match");
      }
      return [pixels1, pixels2, options];
    }
    function toGrayScale(_a) {
      var pixels1 = _a[0], pixels2 = _a[1], options = _a[2];
      if (options.rgb2grayVersion === "original") {
        return [matlab_1.rgb2gray(pixels1), matlab_1.rgb2gray(pixels2), options];
      } else {
        return [matlab_1.rgb2grayInteger(pixels1), matlab_1.rgb2grayInteger(pixels2), options];
      }
    }
    function toResize(_a) {
      var pixels1 = _a[0], pixels2 = _a[1], options = _a[2];
      var pixels = downsample_1.downsample([pixels1, pixels2], options);
      return [pixels[0], pixels[1], options];
    }
    function comparison(_a) {
      var pixels1 = _a[0], pixels2 = _a[1], options = _a[2];
      return ssimTargets[options.ssim](pixels1, pixels2, options);
    }
    function ssim2(image1, image2, userOptions) {
      var start = (/* @__PURE__ */ new Date()).getTime();
      var options = getOptions(userOptions);
      var ssimMap = comparison(toResize(toGrayScale(validateDimensions([image1, image2, options]))));
      var mssim = ssimMap.mssim !== void 0 ? ssimMap.mssim : math_1.mean2d(ssimMap);
      return {
        mssim,
        ssim_map: ssimMap,
        performance: (/* @__PURE__ */ new Date()).getTime() - start
      };
    }
    exports2.ssim = ssim2;
    exports2.default = ssim2;
  }
});

// ../../node_modules/.pnpm/dotenv@17.2.2/node_modules/dotenv/config.js
(function() {
  require_main().config(
    Object.assign(
      {},
      require_env_options(),
      require_cli_options()(process.argv)
    )
  );
})();

// src/apm.ts
var import_node = __toESM(require("@sentry/node"));
var import_node_machine_id = __toESM(require_dist());
import_node.default.init({
  environment: process.env.NODE_ENV || "production",
  dsn: process.env.VERYPIC_SIDECAR_SENTRY_DSN,
  enableLogs: true,
  tracesSampleRate: 0.05,
  profileSessionSampleRate: 0.01,
  profileLifecycle: "trace",
  sendDefaultPii: true
});
(0, import_node_machine_id.machineId)(true).then((id2) => {
  import_node.default.setUser({
    id: process.env.VERYPIC_SIDECAR_USER_ID || id2
  });
});

// src/server.ts
var import_node_cluster4 = __toESM(require("node:cluster"));
var import_node_server2 = __toESM(require_dist2());

// ../../node_modules/.pnpm/hono@4.7.8/node_modules/hono/dist/compose.js
var compose = (middleware, onError, onNotFound) => {
  return (context, next) => {
    let index = -1;
    return dispatch(0);
    async function dispatch(i2) {
      if (i2 <= index) {
        throw new Error("next() called multiple times");
      }
      index = i2;
      let res;
      let isError = false;
      let handler;
      if (middleware[i2]) {
        handler = middleware[i2][0][0];
        context.req.routeIndex = i2;
      } else {
        handler = i2 === middleware.length && next || void 0;
      }
      if (handler) {
        try {
          res = await handler(context, () => dispatch(i2 + 1));
        } catch (err) {
          if (err instanceof Error && onError) {
            context.error = err;
            res = await onError(err, context);
            isError = true;
          } else {
            throw err;
          }
        }
      } else {
        if (context.finalized === false && onNotFound) {
          res = await onNotFound(context);
        }
      }
      if (res && (context.finalized === false || isError)) {
        context.res = res;
      }
      return context;
    }
  };
};

// ../../node_modules/.pnpm/hono@4.7.8/node_modules/hono/dist/utils/body.js
var parseBody = async (request, options = /* @__PURE__ */ Object.create(null)) => {
  const { all = false, dot = false } = options;
  const headers = request instanceof HonoRequest ? request.raw.headers : request.headers;
  const contentType = headers.get("Content-Type");
  if (contentType?.startsWith("multipart/form-data") || contentType?.startsWith("application/x-www-form-urlencoded")) {
    return parseFormData(request, { all, dot });
  }
  return {};
};
async function parseFormData(request, options) {
  const formData = await request.formData();
  if (formData) {
    return convertFormDataToBodyData(formData, options);
  }
  return {};
}
function convertFormDataToBodyData(formData, options) {
  const form = /* @__PURE__ */ Object.create(null);
  formData.forEach((value, key) => {
    const shouldParseAllValues = options.all || key.endsWith("[]");
    if (!shouldParseAllValues) {
      form[key] = value;
    } else {
      handleParsingAllValues(form, key, value);
    }
  });
  if (options.dot) {
    Object.entries(form).forEach(([key, value]) => {
      const shouldParseDotValues = key.includes(".");
      if (shouldParseDotValues) {
        handleParsingNestedValues(form, key, value);
        delete form[key];
      }
    });
  }
  return form;
}
var handleParsingAllValues = (form, key, value) => {
  if (form[key] !== void 0) {
    if (Array.isArray(form[key])) {
      ;
      form[key].push(value);
    } else {
      form[key] = [form[key], value];
    }
  } else {
    form[key] = value;
  }
};
var handleParsingNestedValues = (form, key, value) => {
  let nestedForm = form;
  const keys = key.split(".");
  keys.forEach((key2, index) => {
    if (index === keys.length - 1) {
      nestedForm[key2] = value;
    } else {
      if (!nestedForm[key2] || typeof nestedForm[key2] !== "object" || Array.isArray(nestedForm[key2]) || nestedForm[key2] instanceof File) {
        nestedForm[key2] = /* @__PURE__ */ Object.create(null);
      }
      nestedForm = nestedForm[key2];
    }
  });
};

// ../../node_modules/.pnpm/hono@4.7.8/node_modules/hono/dist/utils/url.js
var splitPath = (path6) => {
  const paths = path6.split("/");
  if (paths[0] === "") {
    paths.shift();
  }
  return paths;
};
var splitRoutingPath = (routePath) => {
  const { groups, path: path6 } = extractGroupsFromPath(routePath);
  const paths = splitPath(path6);
  return replaceGroupMarks(paths, groups);
};
var extractGroupsFromPath = (path6) => {
  const groups = [];
  path6 = path6.replace(/\{[^}]+\}/g, (match, index) => {
    const mark = `@${index}`;
    groups.push([mark, match]);
    return mark;
  });
  return { groups, path: path6 };
};
var replaceGroupMarks = (paths, groups) => {
  for (let i2 = groups.length - 1; i2 >= 0; i2--) {
    const [mark] = groups[i2];
    for (let j2 = paths.length - 1; j2 >= 0; j2--) {
      if (paths[j2].includes(mark)) {
        paths[j2] = paths[j2].replace(mark, groups[i2][1]);
        break;
      }
    }
  }
  return paths;
};
var patternCache = {};
var getPattern = (label, next) => {
  if (label === "*") {
    return "*";
  }
  const match = label.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
  if (match) {
    const cacheKey = `${label}#${next}`;
    if (!patternCache[cacheKey]) {
      if (match[2]) {
        patternCache[cacheKey] = next && next[0] !== ":" && next[0] !== "*" ? [cacheKey, match[1], new RegExp(`^${match[2]}(?=/${next})`)] : [label, match[1], new RegExp(`^${match[2]}$`)];
      } else {
        patternCache[cacheKey] = [label, match[1], true];
      }
    }
    return patternCache[cacheKey];
  }
  return null;
};
var tryDecode = (str, decoder) => {
  try {
    return decoder(str);
  } catch {
    return str.replace(/(?:%[0-9A-Fa-f]{2})+/g, (match) => {
      try {
        return decoder(match);
      } catch {
        return match;
      }
    });
  }
};
var tryDecodeURI = (str) => tryDecode(str, decodeURI);
var getPath = (request) => {
  const url = request.url;
  const start = url.indexOf("/", 8);
  let i2 = start;
  for (; i2 < url.length; i2++) {
    const charCode = url.charCodeAt(i2);
    if (charCode === 37) {
      const queryIndex = url.indexOf("?", i2);
      const path6 = url.slice(start, queryIndex === -1 ? void 0 : queryIndex);
      return tryDecodeURI(path6.includes("%25") ? path6.replace(/%25/g, "%2525") : path6);
    } else if (charCode === 63) {
      break;
    }
  }
  return url.slice(start, i2);
};
var getPathNoStrict = (request) => {
  const result = getPath(request);
  return result.length > 1 && result.at(-1) === "/" ? result.slice(0, -1) : result;
};
var mergePath = (base, sub, ...rest) => {
  if (rest.length) {
    sub = mergePath(sub, ...rest);
  }
  return `${base?.[0] === "/" ? "" : "/"}${base}${sub === "/" ? "" : `${base?.at(-1) === "/" ? "" : "/"}${sub?.[0] === "/" ? sub.slice(1) : sub}`}`;
};
var checkOptionalParameter = (path6) => {
  if (path6.charCodeAt(path6.length - 1) !== 63 || !path6.includes(":")) {
    return null;
  }
  const segments = path6.split("/");
  const results = [];
  let basePath = "";
  segments.forEach((segment) => {
    if (segment !== "" && !/\:/.test(segment)) {
      basePath += "/" + segment;
    } else if (/\:/.test(segment)) {
      if (/\?/.test(segment)) {
        if (results.length === 0 && basePath === "") {
          results.push("/");
        } else {
          results.push(basePath);
        }
        const optionalSegment = segment.replace("?", "");
        basePath += "/" + optionalSegment;
        results.push(basePath);
      } else {
        basePath += "/" + segment;
      }
    }
  });
  return results.filter((v2, i2, a2) => a2.indexOf(v2) === i2);
};
var _decodeURI = (value) => {
  if (!/[%+]/.test(value)) {
    return value;
  }
  if (value.indexOf("+") !== -1) {
    value = value.replace(/\+/g, " ");
  }
  return value.indexOf("%") !== -1 ? decodeURIComponent_(value) : value;
};
var _getQueryParam = (url, key, multiple) => {
  let encoded;
  if (!multiple && key && !/[%+]/.test(key)) {
    let keyIndex2 = url.indexOf(`?${key}`, 8);
    if (keyIndex2 === -1) {
      keyIndex2 = url.indexOf(`&${key}`, 8);
    }
    while (keyIndex2 !== -1) {
      const trailingKeyCode = url.charCodeAt(keyIndex2 + key.length + 1);
      if (trailingKeyCode === 61) {
        const valueIndex = keyIndex2 + key.length + 2;
        const endIndex = url.indexOf("&", valueIndex);
        return _decodeURI(url.slice(valueIndex, endIndex === -1 ? void 0 : endIndex));
      } else if (trailingKeyCode == 38 || isNaN(trailingKeyCode)) {
        return "";
      }
      keyIndex2 = url.indexOf(`&${key}`, keyIndex2 + 1);
    }
    encoded = /[%+]/.test(url);
    if (!encoded) {
      return void 0;
    }
  }
  const results = {};
  encoded ??= /[%+]/.test(url);
  let keyIndex = url.indexOf("?", 8);
  while (keyIndex !== -1) {
    const nextKeyIndex = url.indexOf("&", keyIndex + 1);
    let valueIndex = url.indexOf("=", keyIndex);
    if (valueIndex > nextKeyIndex && nextKeyIndex !== -1) {
      valueIndex = -1;
    }
    let name = url.slice(
      keyIndex + 1,
      valueIndex === -1 ? nextKeyIndex === -1 ? void 0 : nextKeyIndex : valueIndex
    );
    if (encoded) {
      name = _decodeURI(name);
    }
    keyIndex = nextKeyIndex;
    if (name === "") {
      continue;
    }
    let value;
    if (valueIndex === -1) {
      value = "";
    } else {
      value = url.slice(valueIndex + 1, nextKeyIndex === -1 ? void 0 : nextKeyIndex);
      if (encoded) {
        value = _decodeURI(value);
      }
    }
    if (multiple) {
      if (!(results[name] && Array.isArray(results[name]))) {
        results[name] = [];
      }
      ;
      results[name].push(value);
    } else {
      results[name] ??= value;
    }
  }
  return key ? results[key] : results;
};
var getQueryParam = _getQueryParam;
var getQueryParams = (url, key) => {
  return _getQueryParam(url, key, true);
};
var decodeURIComponent_ = decodeURIComponent;

// ../../node_modules/.pnpm/hono@4.7.8/node_modules/hono/dist/request.js
var tryDecodeURIComponent = (str) => tryDecode(str, decodeURIComponent_);
var HonoRequest = class {
  raw;
  #validatedData;
  #matchResult;
  routeIndex = 0;
  path;
  bodyCache = {};
  constructor(request, path6 = "/", matchResult = [[]]) {
    this.raw = request;
    this.path = path6;
    this.#matchResult = matchResult;
    this.#validatedData = {};
  }
  param(key) {
    return key ? this.#getDecodedParam(key) : this.#getAllDecodedParams();
  }
  #getDecodedParam(key) {
    const paramKey = this.#matchResult[0][this.routeIndex][1][key];
    const param = this.#getParamValue(paramKey);
    return param ? /\%/.test(param) ? tryDecodeURIComponent(param) : param : void 0;
  }
  #getAllDecodedParams() {
    const decoded = {};
    const keys = Object.keys(this.#matchResult[0][this.routeIndex][1]);
    for (const key of keys) {
      const value = this.#getParamValue(this.#matchResult[0][this.routeIndex][1][key]);
      if (value && typeof value === "string") {
        decoded[key] = /\%/.test(value) ? tryDecodeURIComponent(value) : value;
      }
    }
    return decoded;
  }
  #getParamValue(paramKey) {
    return this.#matchResult[1] ? this.#matchResult[1][paramKey] : paramKey;
  }
  query(key) {
    return getQueryParam(this.url, key);
  }
  queries(key) {
    return getQueryParams(this.url, key);
  }
  header(name) {
    if (name) {
      return this.raw.headers.get(name) ?? void 0;
    }
    const headerData = {};
    this.raw.headers.forEach((value, key) => {
      headerData[key] = value;
    });
    return headerData;
  }
  async parseBody(options) {
    return this.bodyCache.parsedBody ??= await parseBody(this, options);
  }
  #cachedBody = (key) => {
    const { bodyCache, raw: raw2 } = this;
    const cachedBody = bodyCache[key];
    if (cachedBody) {
      return cachedBody;
    }
    const anyCachedKey = Object.keys(bodyCache)[0];
    if (anyCachedKey) {
      return bodyCache[anyCachedKey].then((body) => {
        if (anyCachedKey === "json") {
          body = JSON.stringify(body);
        }
        return new Response(body)[key]();
      });
    }
    return bodyCache[key] = raw2[key]();
  };
  json() {
    return this.#cachedBody("json");
  }
  text() {
    return this.#cachedBody("text");
  }
  arrayBuffer() {
    return this.#cachedBody("arrayBuffer");
  }
  blob() {
    return this.#cachedBody("blob");
  }
  formData() {
    return this.#cachedBody("formData");
  }
  addValidatedData(target, data) {
    this.#validatedData[target] = data;
  }
  valid(target) {
    return this.#validatedData[target];
  }
  get url() {
    return this.raw.url;
  }
  get method() {
    return this.raw.method;
  }
  get matchedRoutes() {
    return this.#matchResult[0].map(([[, route]]) => route);
  }
  get routePath() {
    return this.#matchResult[0].map(([[, route]]) => route)[this.routeIndex].path;
  }
};

// ../../node_modules/.pnpm/hono@4.7.8/node_modules/hono/dist/utils/html.js
var HtmlEscapedCallbackPhase = {
  Stringify: 1,
  BeforeStream: 2,
  Stream: 3
};
var raw = (value, callbacks) => {
  const escapedString = new String(value);
  escapedString.isEscaped = true;
  escapedString.callbacks = callbacks;
  return escapedString;
};
var resolveCallback = async (str, phase, preserveCallbacks, context, buffer) => {
  if (typeof str === "object" && !(str instanceof String)) {
    if (!(str instanceof Promise)) {
      str = str.toString();
    }
    if (str instanceof Promise) {
      str = await str;
    }
  }
  const callbacks = str.callbacks;
  if (!callbacks?.length) {
    return Promise.resolve(str);
  }
  if (buffer) {
    buffer[0] += str;
  } else {
    buffer = [str];
  }
  const resStr = Promise.all(callbacks.map((c2) => c2({ phase, buffer, context }))).then(
    (res) => Promise.all(
      res.filter(Boolean).map((str2) => resolveCallback(str2, phase, false, context, buffer))
    ).then(() => buffer[0])
  );
  if (preserveCallbacks) {
    return raw(await resStr, callbacks);
  } else {
    return resStr;
  }
};

// ../../node_modules/.pnpm/hono@4.7.8/node_modules/hono/dist/context.js
var TEXT_PLAIN = "text/plain; charset=UTF-8";
var setHeaders = (headers, map = {}) => {
  for (const key of Object.keys(map)) {
    headers.set(key, map[key]);
  }
  return headers;
};
var Context = class {
  #rawRequest;
  #req;
  env = {};
  #var;
  finalized = false;
  error;
  #status = 200;
  #executionCtx;
  #headers;
  #preparedHeaders;
  #res;
  #isFresh = true;
  #layout;
  #renderer;
  #notFoundHandler;
  #matchResult;
  #path;
  constructor(req, options) {
    this.#rawRequest = req;
    if (options) {
      this.#executionCtx = options.executionCtx;
      this.env = options.env;
      this.#notFoundHandler = options.notFoundHandler;
      this.#path = options.path;
      this.#matchResult = options.matchResult;
    }
  }
  get req() {
    this.#req ??= new HonoRequest(this.#rawRequest, this.#path, this.#matchResult);
    return this.#req;
  }
  get event() {
    if (this.#executionCtx && "respondWith" in this.#executionCtx) {
      return this.#executionCtx;
    } else {
      throw Error("This context has no FetchEvent");
    }
  }
  get executionCtx() {
    if (this.#executionCtx) {
      return this.#executionCtx;
    } else {
      throw Error("This context has no ExecutionContext");
    }
  }
  get res() {
    this.#isFresh = false;
    return this.#res ||= new Response("404 Not Found", { status: 404 });
  }
  set res(_res) {
    this.#isFresh = false;
    if (this.#res && _res) {
      _res = new Response(_res.body, _res);
      for (const [k2, v2] of this.#res.headers.entries()) {
        if (k2 === "content-type") {
          continue;
        }
        if (k2 === "set-cookie") {
          const cookies = this.#res.headers.getSetCookie();
          _res.headers.delete("set-cookie");
          for (const cookie of cookies) {
            _res.headers.append("set-cookie", cookie);
          }
        } else {
          _res.headers.set(k2, v2);
        }
      }
    }
    this.#res = _res;
    this.finalized = true;
  }
  render = (...args) => {
    this.#renderer ??= (content) => this.html(content);
    return this.#renderer(...args);
  };
  setLayout = (layout) => this.#layout = layout;
  getLayout = () => this.#layout;
  setRenderer = (renderer) => {
    this.#renderer = renderer;
  };
  header = (name, value, options) => {
    if (this.finalized) {
      this.#res = new Response(this.#res.body, this.#res);
    }
    if (value === void 0) {
      if (this.#headers) {
        this.#headers.delete(name);
      } else if (this.#preparedHeaders) {
        delete this.#preparedHeaders[name.toLocaleLowerCase()];
      }
      if (this.finalized) {
        this.res.headers.delete(name);
      }
      return;
    }
    if (options?.append) {
      if (!this.#headers) {
        this.#isFresh = false;
        this.#headers = new Headers(this.#preparedHeaders);
        this.#preparedHeaders = {};
      }
      this.#headers.append(name, value);
    } else {
      if (this.#headers) {
        this.#headers.set(name, value);
      } else {
        this.#preparedHeaders ??= {};
        this.#preparedHeaders[name.toLowerCase()] = value;
      }
    }
    if (this.finalized) {
      if (options?.append) {
        this.res.headers.append(name, value);
      } else {
        this.res.headers.set(name, value);
      }
    }
  };
  status = (status) => {
    this.#isFresh = false;
    this.#status = status;
  };
  set = (key, value) => {
    this.#var ??= /* @__PURE__ */ new Map();
    this.#var.set(key, value);
  };
  get = (key) => {
    return this.#var ? this.#var.get(key) : void 0;
  };
  get var() {
    if (!this.#var) {
      return {};
    }
    return Object.fromEntries(this.#var);
  }
  #newResponse(data, arg, headers) {
    if (this.#isFresh && !headers && !arg && this.#status === 200) {
      return new Response(data, {
        headers: this.#preparedHeaders
      });
    }
    if (arg && typeof arg !== "number") {
      const header = new Headers(arg.headers);
      if (this.#headers) {
        this.#headers.forEach((v2, k2) => {
          if (k2 === "set-cookie") {
            header.append(k2, v2);
          } else {
            header.set(k2, v2);
          }
        });
      }
      const headers2 = setHeaders(header, this.#preparedHeaders);
      return new Response(data, {
        headers: headers2,
        status: arg.status ?? this.#status
      });
    }
    const status = typeof arg === "number" ? arg : this.#status;
    this.#preparedHeaders ??= {};
    this.#headers ??= new Headers();
    setHeaders(this.#headers, this.#preparedHeaders);
    if (this.#res) {
      this.#res.headers.forEach((v2, k2) => {
        if (k2 === "set-cookie") {
          this.#headers?.append(k2, v2);
        } else {
          this.#headers?.set(k2, v2);
        }
      });
      setHeaders(this.#headers, this.#preparedHeaders);
    }
    headers ??= {};
    for (const [k2, v2] of Object.entries(headers)) {
      if (typeof v2 === "string") {
        this.#headers.set(k2, v2);
      } else {
        this.#headers.delete(k2);
        for (const v22 of v2) {
          this.#headers.append(k2, v22);
        }
      }
    }
    return new Response(data, {
      status,
      headers: this.#headers
    });
  }
  newResponse = (...args) => this.#newResponse(...args);
  body = (data, arg, headers) => {
    return typeof arg === "number" ? this.#newResponse(data, arg, headers) : this.#newResponse(data, arg);
  };
  text = (text, arg, headers) => {
    if (!this.#preparedHeaders) {
      if (this.#isFresh && !headers && !arg) {
        return new Response(text);
      }
      this.#preparedHeaders = {};
    }
    this.#preparedHeaders["content-type"] = TEXT_PLAIN;
    if (typeof arg === "number") {
      return this.#newResponse(text, arg, headers);
    }
    return this.#newResponse(text, arg);
  };
  json = (object, arg, headers) => {
    const body = JSON.stringify(object);
    this.#preparedHeaders ??= {};
    this.#preparedHeaders["content-type"] = "application/json";
    return typeof arg === "number" ? this.#newResponse(body, arg, headers) : this.#newResponse(body, arg);
  };
  html = (html, arg, headers) => {
    this.#preparedHeaders ??= {};
    this.#preparedHeaders["content-type"] = "text/html; charset=UTF-8";
    if (typeof html === "object") {
      return resolveCallback(html, HtmlEscapedCallbackPhase.Stringify, false, {}).then((html2) => {
        return typeof arg === "number" ? this.#newResponse(html2, arg, headers) : this.#newResponse(html2, arg);
      });
    }
    return typeof arg === "number" ? this.#newResponse(html, arg, headers) : this.#newResponse(html, arg);
  };
  redirect = (location, status) => {
    this.#headers ??= new Headers();
    this.#headers.set("Location", String(location));
    return this.newResponse(null, status ?? 302);
  };
  notFound = () => {
    this.#notFoundHandler ??= () => new Response();
    return this.#notFoundHandler(this);
  };
};

// ../../node_modules/.pnpm/hono@4.7.8/node_modules/hono/dist/router.js
var METHOD_NAME_ALL = "ALL";
var METHOD_NAME_ALL_LOWERCASE = "all";
var METHODS = ["get", "post", "put", "delete", "options", "patch"];
var MESSAGE_MATCHER_IS_ALREADY_BUILT = "Can not add a route since the matcher is already built.";
var UnsupportedPathError = class extends Error {
};

// ../../node_modules/.pnpm/hono@4.7.8/node_modules/hono/dist/utils/constants.js
var COMPOSED_HANDLER = "__COMPOSED_HANDLER";

// ../../node_modules/.pnpm/hono@4.7.8/node_modules/hono/dist/hono-base.js
var notFoundHandler = (c2) => {
  return c2.text("404 Not Found", 404);
};
var errorHandler = (err, c2) => {
  if ("getResponse" in err) {
    return err.getResponse();
  }
  console.error(err);
  return c2.text("Internal Server Error", 500);
};
var Hono = class {
  get;
  post;
  put;
  delete;
  options;
  patch;
  all;
  on;
  use;
  router;
  getPath;
  _basePath = "/";
  #path = "/";
  routes = [];
  constructor(options = {}) {
    const allMethods = [...METHODS, METHOD_NAME_ALL_LOWERCASE];
    allMethods.forEach((method) => {
      this[method] = (args1, ...args) => {
        if (typeof args1 === "string") {
          this.#path = args1;
        } else {
          this.#addRoute(method, this.#path, args1);
        }
        args.forEach((handler) => {
          this.#addRoute(method, this.#path, handler);
        });
        return this;
      };
    });
    this.on = (method, path6, ...handlers) => {
      for (const p2 of [path6].flat()) {
        this.#path = p2;
        for (const m2 of [method].flat()) {
          handlers.map((handler) => {
            this.#addRoute(m2.toUpperCase(), this.#path, handler);
          });
        }
      }
      return this;
    };
    this.use = (arg1, ...handlers) => {
      if (typeof arg1 === "string") {
        this.#path = arg1;
      } else {
        this.#path = "*";
        handlers.unshift(arg1);
      }
      handlers.forEach((handler) => {
        this.#addRoute(METHOD_NAME_ALL, this.#path, handler);
      });
      return this;
    };
    const { strict, ...optionsWithoutStrict } = options;
    Object.assign(this, optionsWithoutStrict);
    this.getPath = strict ?? true ? options.getPath ?? getPath : getPathNoStrict;
  }
  #clone() {
    const clone = new Hono({
      router: this.router,
      getPath: this.getPath
    });
    clone.routes = this.routes;
    return clone;
  }
  #notFoundHandler = notFoundHandler;
  errorHandler = errorHandler;
  route(path6, app13) {
    const subApp = this.basePath(path6);
    app13.routes.map((r2) => {
      let handler;
      if (app13.errorHandler === errorHandler) {
        handler = r2.handler;
      } else {
        handler = async (c2, next) => (await compose([], app13.errorHandler)(c2, () => r2.handler(c2, next))).res;
        handler[COMPOSED_HANDLER] = r2.handler;
      }
      subApp.#addRoute(r2.method, r2.path, handler);
    });
    return this;
  }
  basePath(path6) {
    const subApp = this.#clone();
    subApp._basePath = mergePath(this._basePath, path6);
    return subApp;
  }
  onError = (handler) => {
    this.errorHandler = handler;
    return this;
  };
  notFound = (handler) => {
    this.#notFoundHandler = handler;
    return this;
  };
  mount(path6, applicationHandler, options) {
    let replaceRequest;
    let optionHandler;
    if (options) {
      if (typeof options === "function") {
        optionHandler = options;
      } else {
        optionHandler = options.optionHandler;
        if (options.replaceRequest === false) {
          replaceRequest = (request) => request;
        } else {
          replaceRequest = options.replaceRequest;
        }
      }
    }
    const getOptions = optionHandler ? (c2) => {
      const options2 = optionHandler(c2);
      return Array.isArray(options2) ? options2 : [options2];
    } : (c2) => {
      let executionContext = void 0;
      try {
        executionContext = c2.executionCtx;
      } catch {
      }
      return [c2.env, executionContext];
    };
    replaceRequest ||= (() => {
      const mergedPath = mergePath(this._basePath, path6);
      const pathPrefixLength = mergedPath === "/" ? 0 : mergedPath.length;
      return (request) => {
        const url = new URL(request.url);
        url.pathname = url.pathname.slice(pathPrefixLength) || "/";
        return new Request(url, request);
      };
    })();
    const handler = async (c2, next) => {
      const res = await applicationHandler(replaceRequest(c2.req.raw), ...getOptions(c2));
      if (res) {
        return res;
      }
      await next();
    };
    this.#addRoute(METHOD_NAME_ALL, mergePath(path6, "*"), handler);
    return this;
  }
  #addRoute(method, path6, handler) {
    method = method.toUpperCase();
    path6 = mergePath(this._basePath, path6);
    const r2 = { path: path6, method, handler };
    this.router.add(method, path6, [handler, r2]);
    this.routes.push(r2);
  }
  #handleError(err, c2) {
    if (err instanceof Error) {
      return this.errorHandler(err, c2);
    }
    throw err;
  }
  #dispatch(request, executionCtx, env, method) {
    if (method === "HEAD") {
      return (async () => new Response(null, await this.#dispatch(request, executionCtx, env, "GET")))();
    }
    const path6 = this.getPath(request, { env });
    const matchResult = this.router.match(method, path6);
    const c2 = new Context(request, {
      path: path6,
      matchResult,
      env,
      executionCtx,
      notFoundHandler: this.#notFoundHandler
    });
    if (matchResult[0].length === 1) {
      let res;
      try {
        res = matchResult[0][0][0][0](c2, async () => {
          c2.res = await this.#notFoundHandler(c2);
        });
      } catch (err) {
        return this.#handleError(err, c2);
      }
      return res instanceof Promise ? res.then(
        (resolved) => resolved || (c2.finalized ? c2.res : this.#notFoundHandler(c2))
      ).catch((err) => this.#handleError(err, c2)) : res ?? this.#notFoundHandler(c2);
    }
    const composed = compose(matchResult[0], this.errorHandler, this.#notFoundHandler);
    return (async () => {
      try {
        const context = await composed(c2);
        if (!context.finalized) {
          throw new Error(
            "Context is not finalized. Did you forget to return a Response object or `await next()`?"
          );
        }
        return context.res;
      } catch (err) {
        return this.#handleError(err, c2);
      }
    })();
  }
  fetch = (request, ...rest) => {
    return this.#dispatch(request, rest[1], rest[0], request.method);
  };
  request = (input, requestInit, Env, executionCtx) => {
    if (input instanceof Request) {
      return this.fetch(requestInit ? new Request(input, requestInit) : input, Env, executionCtx);
    }
    input = input.toString();
    return this.fetch(
      new Request(
        /^https?:\/\//.test(input) ? input : `http://localhost${mergePath("/", input)}`,
        requestInit
      ),
      Env,
      executionCtx
    );
  };
  fire = () => {
    addEventListener("fetch", (event) => {
      event.respondWith(this.#dispatch(event.request, event, void 0, event.request.method));
    });
  };
};

// ../../node_modules/.pnpm/hono@4.7.8/node_modules/hono/dist/router/reg-exp-router/node.js
var LABEL_REG_EXP_STR = "[^/]+";
var ONLY_WILDCARD_REG_EXP_STR = ".*";
var TAIL_WILDCARD_REG_EXP_STR = "(?:|/.*)";
var PATH_ERROR = /* @__PURE__ */ Symbol();
var regExpMetaChars = new Set(".\\+*[^]$()");
function compareKey(a2, b2) {
  if (a2.length === 1) {
    return b2.length === 1 ? a2 < b2 ? -1 : 1 : -1;
  }
  if (b2.length === 1) {
    return 1;
  }
  if (a2 === ONLY_WILDCARD_REG_EXP_STR || a2 === TAIL_WILDCARD_REG_EXP_STR) {
    return 1;
  } else if (b2 === ONLY_WILDCARD_REG_EXP_STR || b2 === TAIL_WILDCARD_REG_EXP_STR) {
    return -1;
  }
  if (a2 === LABEL_REG_EXP_STR) {
    return 1;
  } else if (b2 === LABEL_REG_EXP_STR) {
    return -1;
  }
  return a2.length === b2.length ? a2 < b2 ? -1 : 1 : b2.length - a2.length;
}
var Node = class {
  #index;
  #varIndex;
  #children = /* @__PURE__ */ Object.create(null);
  insert(tokens, index, paramMap, context, pathErrorCheckOnly) {
    if (tokens.length === 0) {
      if (this.#index !== void 0) {
        throw PATH_ERROR;
      }
      if (pathErrorCheckOnly) {
        return;
      }
      this.#index = index;
      return;
    }
    const [token, ...restTokens] = tokens;
    const pattern = token === "*" ? restTokens.length === 0 ? ["", "", ONLY_WILDCARD_REG_EXP_STR] : ["", "", LABEL_REG_EXP_STR] : token === "/*" ? ["", "", TAIL_WILDCARD_REG_EXP_STR] : token.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
    let node;
    if (pattern) {
      const name = pattern[1];
      let regexpStr = pattern[2] || LABEL_REG_EXP_STR;
      if (name && pattern[2]) {
        regexpStr = regexpStr.replace(/^\((?!\?:)(?=[^)]+\)$)/, "(?:");
        if (/\((?!\?:)/.test(regexpStr)) {
          throw PATH_ERROR;
        }
      }
      node = this.#children[regexpStr];
      if (!node) {
        if (Object.keys(this.#children).some(
          (k2) => k2 !== ONLY_WILDCARD_REG_EXP_STR && k2 !== TAIL_WILDCARD_REG_EXP_STR
        )) {
          throw PATH_ERROR;
        }
        if (pathErrorCheckOnly) {
          return;
        }
        node = this.#children[regexpStr] = new Node();
        if (name !== "") {
          node.#varIndex = context.varIndex++;
        }
      }
      if (!pathErrorCheckOnly && name !== "") {
        paramMap.push([name, node.#varIndex]);
      }
    } else {
      node = this.#children[token];
      if (!node) {
        if (Object.keys(this.#children).some(
          (k2) => k2.length > 1 && k2 !== ONLY_WILDCARD_REG_EXP_STR && k2 !== TAIL_WILDCARD_REG_EXP_STR
        )) {
          throw PATH_ERROR;
        }
        if (pathErrorCheckOnly) {
          return;
        }
        node = this.#children[token] = new Node();
      }
    }
    node.insert(restTokens, index, paramMap, context, pathErrorCheckOnly);
  }
  buildRegExpStr() {
    const childKeys = Object.keys(this.#children).sort(compareKey);
    const strList = childKeys.map((k2) => {
      const c2 = this.#children[k2];
      return (typeof c2.#varIndex === "number" ? `(${k2})@${c2.#varIndex}` : regExpMetaChars.has(k2) ? `\\${k2}` : k2) + c2.buildRegExpStr();
    });
    if (typeof this.#index === "number") {
      strList.unshift(`#${this.#index}`);
    }
    if (strList.length === 0) {
      return "";
    }
    if (strList.length === 1) {
      return strList[0];
    }
    return "(?:" + strList.join("|") + ")";
  }
};

// ../../node_modules/.pnpm/hono@4.7.8/node_modules/hono/dist/router/reg-exp-router/trie.js
var Trie = class {
  #context = { varIndex: 0 };
  #root = new Node();
  insert(path6, index, pathErrorCheckOnly) {
    const paramAssoc = [];
    const groups = [];
    for (let i2 = 0; ; ) {
      let replaced = false;
      path6 = path6.replace(/\{[^}]+\}/g, (m2) => {
        const mark = `@\\${i2}`;
        groups[i2] = [mark, m2];
        i2++;
        replaced = true;
        return mark;
      });
      if (!replaced) {
        break;
      }
    }
    const tokens = path6.match(/(?::[^\/]+)|(?:\/\*$)|./g) || [];
    for (let i2 = groups.length - 1; i2 >= 0; i2--) {
      const [mark] = groups[i2];
      for (let j2 = tokens.length - 1; j2 >= 0; j2--) {
        if (tokens[j2].indexOf(mark) !== -1) {
          tokens[j2] = tokens[j2].replace(mark, groups[i2][1]);
          break;
        }
      }
    }
    this.#root.insert(tokens, index, paramAssoc, this.#context, pathErrorCheckOnly);
    return paramAssoc;
  }
  buildRegExp() {
    let regexp = this.#root.buildRegExpStr();
    if (regexp === "") {
      return [/^$/, [], []];
    }
    let captureIndex = 0;
    const indexReplacementMap = [];
    const paramReplacementMap = [];
    regexp = regexp.replace(/#(\d+)|@(\d+)|\.\*\$/g, (_2, handlerIndex, paramIndex) => {
      if (handlerIndex !== void 0) {
        indexReplacementMap[++captureIndex] = Number(handlerIndex);
        return "$()";
      }
      if (paramIndex !== void 0) {
        paramReplacementMap[Number(paramIndex)] = ++captureIndex;
        return "";
      }
      return "";
    });
    return [new RegExp(`^${regexp}`), indexReplacementMap, paramReplacementMap];
  }
};

// ../../node_modules/.pnpm/hono@4.7.8/node_modules/hono/dist/router/reg-exp-router/router.js
var emptyParam = [];
var nullMatcher = [/^$/, [], /* @__PURE__ */ Object.create(null)];
var wildcardRegExpCache = /* @__PURE__ */ Object.create(null);
function buildWildcardRegExp(path6) {
  return wildcardRegExpCache[path6] ??= new RegExp(
    path6 === "*" ? "" : `^${path6.replace(
      /\/\*$|([.\\+*[^\]$()])/g,
      (_2, metaChar) => metaChar ? `\\${metaChar}` : "(?:|/.*)"
    )}$`
  );
}
function clearWildcardRegExpCache() {
  wildcardRegExpCache = /* @__PURE__ */ Object.create(null);
}
function buildMatcherFromPreprocessedRoutes(routes) {
  const trie = new Trie();
  const handlerData = [];
  if (routes.length === 0) {
    return nullMatcher;
  }
  const routesWithStaticPathFlag = routes.map(
    (route) => [!/\*|\/:/.test(route[0]), ...route]
  ).sort(
    ([isStaticA, pathA], [isStaticB, pathB]) => isStaticA ? 1 : isStaticB ? -1 : pathA.length - pathB.length
  );
  const staticMap = /* @__PURE__ */ Object.create(null);
  for (let i2 = 0, j2 = -1, len = routesWithStaticPathFlag.length; i2 < len; i2++) {
    const [pathErrorCheckOnly, path6, handlers] = routesWithStaticPathFlag[i2];
    if (pathErrorCheckOnly) {
      staticMap[path6] = [handlers.map(([h2]) => [h2, /* @__PURE__ */ Object.create(null)]), emptyParam];
    } else {
      j2++;
    }
    let paramAssoc;
    try {
      paramAssoc = trie.insert(path6, j2, pathErrorCheckOnly);
    } catch (e2) {
      throw e2 === PATH_ERROR ? new UnsupportedPathError(path6) : e2;
    }
    if (pathErrorCheckOnly) {
      continue;
    }
    handlerData[j2] = handlers.map(([h2, paramCount]) => {
      const paramIndexMap = /* @__PURE__ */ Object.create(null);
      paramCount -= 1;
      for (; paramCount >= 0; paramCount--) {
        const [key, value] = paramAssoc[paramCount];
        paramIndexMap[key] = value;
      }
      return [h2, paramIndexMap];
    });
  }
  const [regexp, indexReplacementMap, paramReplacementMap] = trie.buildRegExp();
  for (let i2 = 0, len = handlerData.length; i2 < len; i2++) {
    for (let j2 = 0, len2 = handlerData[i2].length; j2 < len2; j2++) {
      const map = handlerData[i2][j2]?.[1];
      if (!map) {
        continue;
      }
      const keys = Object.keys(map);
      for (let k2 = 0, len3 = keys.length; k2 < len3; k2++) {
        map[keys[k2]] = paramReplacementMap[map[keys[k2]]];
      }
    }
  }
  const handlerMap = [];
  for (const i2 in indexReplacementMap) {
    handlerMap[i2] = handlerData[indexReplacementMap[i2]];
  }
  return [regexp, handlerMap, staticMap];
}
function findMiddleware(middleware, path6) {
  if (!middleware) {
    return void 0;
  }
  for (const k2 of Object.keys(middleware).sort((a2, b2) => b2.length - a2.length)) {
    if (buildWildcardRegExp(k2).test(path6)) {
      return [...middleware[k2]];
    }
  }
  return void 0;
}
var RegExpRouter = class {
  name = "RegExpRouter";
  #middleware;
  #routes;
  constructor() {
    this.#middleware = { [METHOD_NAME_ALL]: /* @__PURE__ */ Object.create(null) };
    this.#routes = { [METHOD_NAME_ALL]: /* @__PURE__ */ Object.create(null) };
  }
  add(method, path6, handler) {
    const middleware = this.#middleware;
    const routes = this.#routes;
    if (!middleware || !routes) {
      throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
    }
    if (!middleware[method]) {
      ;
      [middleware, routes].forEach((handlerMap) => {
        handlerMap[method] = /* @__PURE__ */ Object.create(null);
        Object.keys(handlerMap[METHOD_NAME_ALL]).forEach((p2) => {
          handlerMap[method][p2] = [...handlerMap[METHOD_NAME_ALL][p2]];
        });
      });
    }
    if (path6 === "/*") {
      path6 = "*";
    }
    const paramCount = (path6.match(/\/:/g) || []).length;
    if (/\*$/.test(path6)) {
      const re = buildWildcardRegExp(path6);
      if (method === METHOD_NAME_ALL) {
        Object.keys(middleware).forEach((m2) => {
          middleware[m2][path6] ||= findMiddleware(middleware[m2], path6) || findMiddleware(middleware[METHOD_NAME_ALL], path6) || [];
        });
      } else {
        middleware[method][path6] ||= findMiddleware(middleware[method], path6) || findMiddleware(middleware[METHOD_NAME_ALL], path6) || [];
      }
      Object.keys(middleware).forEach((m2) => {
        if (method === METHOD_NAME_ALL || method === m2) {
          Object.keys(middleware[m2]).forEach((p2) => {
            re.test(p2) && middleware[m2][p2].push([handler, paramCount]);
          });
        }
      });
      Object.keys(routes).forEach((m2) => {
        if (method === METHOD_NAME_ALL || method === m2) {
          Object.keys(routes[m2]).forEach(
            (p2) => re.test(p2) && routes[m2][p2].push([handler, paramCount])
          );
        }
      });
      return;
    }
    const paths = checkOptionalParameter(path6) || [path6];
    for (let i2 = 0, len = paths.length; i2 < len; i2++) {
      const path22 = paths[i2];
      Object.keys(routes).forEach((m2) => {
        if (method === METHOD_NAME_ALL || method === m2) {
          routes[m2][path22] ||= [
            ...findMiddleware(middleware[m2], path22) || findMiddleware(middleware[METHOD_NAME_ALL], path22) || []
          ];
          routes[m2][path22].push([handler, paramCount - len + i2 + 1]);
        }
      });
    }
  }
  match(method, path6) {
    clearWildcardRegExpCache();
    const matchers = this.#buildAllMatchers();
    this.match = (method2, path22) => {
      const matcher = matchers[method2] || matchers[METHOD_NAME_ALL];
      const staticMatch = matcher[2][path22];
      if (staticMatch) {
        return staticMatch;
      }
      const match = path22.match(matcher[0]);
      if (!match) {
        return [[], emptyParam];
      }
      const index = match.indexOf("", 1);
      return [matcher[1][index], match];
    };
    return this.match(method, path6);
  }
  #buildAllMatchers() {
    const matchers = /* @__PURE__ */ Object.create(null);
    Object.keys(this.#routes).concat(Object.keys(this.#middleware)).forEach((method) => {
      matchers[method] ||= this.#buildMatcher(method);
    });
    this.#middleware = this.#routes = void 0;
    return matchers;
  }
  #buildMatcher(method) {
    const routes = [];
    let hasOwnRoute = method === METHOD_NAME_ALL;
    [this.#middleware, this.#routes].forEach((r2) => {
      const ownRoute = r2[method] ? Object.keys(r2[method]).map((path6) => [path6, r2[method][path6]]) : [];
      if (ownRoute.length !== 0) {
        hasOwnRoute ||= true;
        routes.push(...ownRoute);
      } else if (method !== METHOD_NAME_ALL) {
        routes.push(
          ...Object.keys(r2[METHOD_NAME_ALL]).map((path6) => [path6, r2[METHOD_NAME_ALL][path6]])
        );
      }
    });
    if (!hasOwnRoute) {
      return null;
    } else {
      return buildMatcherFromPreprocessedRoutes(routes);
    }
  }
};

// ../../node_modules/.pnpm/hono@4.7.8/node_modules/hono/dist/router/smart-router/router.js
var SmartRouter = class {
  name = "SmartRouter";
  #routers = [];
  #routes = [];
  constructor(init) {
    this.#routers = init.routers;
  }
  add(method, path6, handler) {
    if (!this.#routes) {
      throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
    }
    this.#routes.push([method, path6, handler]);
  }
  match(method, path6) {
    if (!this.#routes) {
      throw new Error("Fatal error");
    }
    const routers = this.#routers;
    const routes = this.#routes;
    const len = routers.length;
    let i2 = 0;
    let res;
    for (; i2 < len; i2++) {
      const router = routers[i2];
      try {
        for (let i22 = 0, len2 = routes.length; i22 < len2; i22++) {
          router.add(...routes[i22]);
        }
        res = router.match(method, path6);
      } catch (e2) {
        if (e2 instanceof UnsupportedPathError) {
          continue;
        }
        throw e2;
      }
      this.match = router.match.bind(router);
      this.#routers = [router];
      this.#routes = void 0;
      break;
    }
    if (i2 === len) {
      throw new Error("Fatal error");
    }
    this.name = `SmartRouter + ${this.activeRouter.name}`;
    return res;
  }
  get activeRouter() {
    if (this.#routes || this.#routers.length !== 1) {
      throw new Error("No active router has been determined yet.");
    }
    return this.#routers[0];
  }
};

// ../../node_modules/.pnpm/hono@4.7.8/node_modules/hono/dist/router/trie-router/node.js
var emptyParams = /* @__PURE__ */ Object.create(null);
var Node2 = class {
  #methods;
  #children;
  #patterns;
  #order = 0;
  #params = emptyParams;
  constructor(method, handler, children) {
    this.#children = children || /* @__PURE__ */ Object.create(null);
    this.#methods = [];
    if (method && handler) {
      const m2 = /* @__PURE__ */ Object.create(null);
      m2[method] = { handler, possibleKeys: [], score: 0 };
      this.#methods = [m2];
    }
    this.#patterns = [];
  }
  insert(method, path6, handler) {
    this.#order = ++this.#order;
    let curNode = this;
    const parts = splitRoutingPath(path6);
    const possibleKeys = [];
    for (let i2 = 0, len = parts.length; i2 < len; i2++) {
      const p2 = parts[i2];
      const nextP = parts[i2 + 1];
      const pattern = getPattern(p2, nextP);
      const key = Array.isArray(pattern) ? pattern[0] : p2;
      if (Object.keys(curNode.#children).includes(key)) {
        curNode = curNode.#children[key];
        const pattern2 = getPattern(p2, nextP);
        if (pattern2) {
          possibleKeys.push(pattern2[1]);
        }
        continue;
      }
      curNode.#children[key] = new Node2();
      if (pattern) {
        curNode.#patterns.push(pattern);
        possibleKeys.push(pattern[1]);
      }
      curNode = curNode.#children[key];
    }
    const m2 = /* @__PURE__ */ Object.create(null);
    const handlerSet = {
      handler,
      possibleKeys: possibleKeys.filter((v2, i2, a2) => a2.indexOf(v2) === i2),
      score: this.#order
    };
    m2[method] = handlerSet;
    curNode.#methods.push(m2);
    return curNode;
  }
  #getHandlerSets(node, method, nodeParams, params) {
    const handlerSets = [];
    for (let i2 = 0, len = node.#methods.length; i2 < len; i2++) {
      const m2 = node.#methods[i2];
      const handlerSet = m2[method] || m2[METHOD_NAME_ALL];
      const processedSet = {};
      if (handlerSet !== void 0) {
        handlerSet.params = /* @__PURE__ */ Object.create(null);
        handlerSets.push(handlerSet);
        if (nodeParams !== emptyParams || params && params !== emptyParams) {
          for (let i22 = 0, len2 = handlerSet.possibleKeys.length; i22 < len2; i22++) {
            const key = handlerSet.possibleKeys[i22];
            const processed = processedSet[handlerSet.score];
            handlerSet.params[key] = params?.[key] && !processed ? params[key] : nodeParams[key] ?? params?.[key];
            processedSet[handlerSet.score] = true;
          }
        }
      }
    }
    return handlerSets;
  }
  search(method, path6) {
    const handlerSets = [];
    this.#params = emptyParams;
    const curNode = this;
    let curNodes = [curNode];
    const parts = splitPath(path6);
    const curNodesQueue = [];
    for (let i2 = 0, len = parts.length; i2 < len; i2++) {
      const part = parts[i2];
      const isLast = i2 === len - 1;
      const tempNodes = [];
      for (let j2 = 0, len2 = curNodes.length; j2 < len2; j2++) {
        const node = curNodes[j2];
        const nextNode = node.#children[part];
        if (nextNode) {
          nextNode.#params = node.#params;
          if (isLast) {
            if (nextNode.#children["*"]) {
              handlerSets.push(
                ...this.#getHandlerSets(nextNode.#children["*"], method, node.#params)
              );
            }
            handlerSets.push(...this.#getHandlerSets(nextNode, method, node.#params));
          } else {
            tempNodes.push(nextNode);
          }
        }
        for (let k2 = 0, len3 = node.#patterns.length; k2 < len3; k2++) {
          const pattern = node.#patterns[k2];
          const params = node.#params === emptyParams ? {} : { ...node.#params };
          if (pattern === "*") {
            const astNode = node.#children["*"];
            if (astNode) {
              handlerSets.push(...this.#getHandlerSets(astNode, method, node.#params));
              astNode.#params = params;
              tempNodes.push(astNode);
            }
            continue;
          }
          if (part === "") {
            continue;
          }
          const [key, name, matcher] = pattern;
          const child = node.#children[key];
          const restPathString = parts.slice(i2).join("/");
          if (matcher instanceof RegExp) {
            const m2 = matcher.exec(restPathString);
            if (m2) {
              params[name] = m2[0];
              handlerSets.push(...this.#getHandlerSets(child, method, node.#params, params));
              if (Object.keys(child.#children).length) {
                child.#params = params;
                const componentCount = m2[0].match(/\//)?.length ?? 0;
                const targetCurNodes = curNodesQueue[componentCount] ||= [];
                targetCurNodes.push(child);
              }
              continue;
            }
          }
          if (matcher === true || matcher.test(part)) {
            params[name] = part;
            if (isLast) {
              handlerSets.push(...this.#getHandlerSets(child, method, params, node.#params));
              if (child.#children["*"]) {
                handlerSets.push(
                  ...this.#getHandlerSets(child.#children["*"], method, params, node.#params)
                );
              }
            } else {
              child.#params = params;
              tempNodes.push(child);
            }
          }
        }
      }
      curNodes = tempNodes.concat(curNodesQueue.shift() ?? []);
    }
    if (handlerSets.length > 1) {
      handlerSets.sort((a2, b2) => {
        return a2.score - b2.score;
      });
    }
    return [handlerSets.map(({ handler, params }) => [handler, params])];
  }
};

// ../../node_modules/.pnpm/hono@4.7.8/node_modules/hono/dist/router/trie-router/router.js
var TrieRouter = class {
  name = "TrieRouter";
  #node;
  constructor() {
    this.#node = new Node2();
  }
  add(method, path6, handler) {
    const results = checkOptionalParameter(path6);
    if (results) {
      for (let i2 = 0, len = results.length; i2 < len; i2++) {
        this.#node.insert(method, results[i2], handler);
      }
      return;
    }
    this.#node.insert(method, path6, handler);
  }
  match(method, path6) {
    return this.#node.search(method, path6);
  }
};

// ../../node_modules/.pnpm/hono@4.7.8/node_modules/hono/dist/hono.js
var Hono2 = class extends Hono {
  constructor(options = {}) {
    super(options);
    this.router = options.router ?? new SmartRouter({
      routers: [new RegExpRouter(), new TrieRouter()]
    });
  }
};

// ../../node_modules/.pnpm/hono@4.7.8/node_modules/hono/dist/middleware/cors/index.js
var cors = (options) => {
  const defaults = {
    origin: "*",
    allowMethods: ["GET", "HEAD", "PUT", "POST", "DELETE", "PATCH"],
    allowHeaders: [],
    exposeHeaders: []
  };
  const opts = {
    ...defaults,
    ...options
  };
  const findAllowOrigin = ((optsOrigin) => {
    if (typeof optsOrigin === "string") {
      if (optsOrigin === "*") {
        return () => optsOrigin;
      } else {
        return (origin) => optsOrigin === origin ? origin : null;
      }
    } else if (typeof optsOrigin === "function") {
      return optsOrigin;
    } else {
      return (origin) => optsOrigin.includes(origin) ? origin : null;
    }
  })(opts.origin);
  return async function cors2(c2, next) {
    function set(key, value) {
      c2.res.headers.set(key, value);
    }
    const allowOrigin = findAllowOrigin(c2.req.header("origin") || "", c2);
    if (allowOrigin) {
      set("Access-Control-Allow-Origin", allowOrigin);
    }
    if (opts.origin !== "*") {
      const existingVary = c2.req.header("Vary");
      if (existingVary) {
        set("Vary", existingVary);
      } else {
        set("Vary", "Origin");
      }
    }
    if (opts.credentials) {
      set("Access-Control-Allow-Credentials", "true");
    }
    if (opts.exposeHeaders?.length) {
      set("Access-Control-Expose-Headers", opts.exposeHeaders.join(","));
    }
    if (c2.req.method === "OPTIONS") {
      if (opts.maxAge != null) {
        set("Access-Control-Max-Age", opts.maxAge.toString());
      }
      if (opts.allowMethods?.length) {
        set("Access-Control-Allow-Methods", opts.allowMethods.join(","));
      }
      let headers = opts.allowHeaders;
      if (!headers?.length) {
        const requestHeaders = c2.req.header("Access-Control-Request-Headers");
        if (requestHeaders) {
          headers = requestHeaders.split(/\s*,\s*/);
        }
      }
      if (headers?.length) {
        set("Access-Control-Allow-Headers", headers.join(","));
        c2.res.headers.append("Vary", "Access-Control-Request-Headers");
      }
      c2.res.headers.delete("Content-Length");
      c2.res.headers.delete("Content-Type");
      return new Response(null, {
        headers: c2.res.headers,
        status: 204,
        statusText: "No Content"
      });
    }
    await next();
  };
};

// ../../node_modules/.pnpm/hono@4.7.8/node_modules/hono/dist/utils/color.js
function getColorEnabled() {
  const { process: process2, Deno } = globalThis;
  const isNoColor = typeof Deno?.noColor === "boolean" ? Deno.noColor : process2 !== void 0 ? "NO_COLOR" in process2?.env : false;
  return !isNoColor;
}

// ../../node_modules/.pnpm/hono@4.7.8/node_modules/hono/dist/middleware/logger/index.js
var humanize = (times) => {
  const [delimiter, separator] = [",", "."];
  const orderTimes = times.map((v2) => v2.replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1" + delimiter));
  return orderTimes.join(separator);
};
var time = (start) => {
  const delta = Date.now() - start;
  return humanize([delta < 1e3 ? delta + "ms" : Math.round(delta / 1e3) + "s"]);
};
var colorStatus = (status) => {
  const colorEnabled = getColorEnabled();
  if (colorEnabled) {
    switch (status / 100 | 0) {
      case 5:
        return `\x1B[31m${status}\x1B[0m`;
      case 4:
        return `\x1B[33m${status}\x1B[0m`;
      case 3:
        return `\x1B[36m${status}\x1B[0m`;
      case 2:
        return `\x1B[32m${status}\x1B[0m`;
    }
  }
  return `${status}`;
};
function log(fn, prefix, method, path6, status = 0, elapsed) {
  const out = prefix === "<--" ? `${prefix} ${method} ${path6}` : `${prefix} ${method} ${path6} ${colorStatus(status)} ${elapsed}`;
  fn(out);
}
var logger = (fn = console.log) => {
  return async function logger2(c2, next) {
    const { method, url } = c2.req;
    const path6 = url.slice(url.indexOf("/", 8));
    log(fn, "<--", method, path6);
    const start = Date.now();
    await next();
    log(fn, "-->", method, path6, c2.res.status, time(start));
  };
};

// ../../node_modules/.pnpm/hono@4.7.8/node_modules/hono/dist/http-exception.js
var HTTPException = class extends Error {
  res;
  status;
  constructor(status = 500, options) {
    super(options?.message, { cause: options?.cause });
    this.res = options?.res;
    this.status = status;
  }
  getResponse() {
    if (this.res) {
      const newResponse = new Response(this.res.body, {
        status: this.status,
        headers: this.res.headers
      });
      return newResponse;
    }
    return new Response(this.message, {
      status: this.status
    });
  }
};

// ../../node_modules/.pnpm/hono@4.7.8/node_modules/hono/dist/middleware/timeout/index.js
var defaultTimeoutException = new HTTPException(504, {
  message: "Gateway Timeout"
});
var timeout = (duration, exception = defaultTimeoutException) => {
  return async function timeout22(context, next) {
    let timer;
    const timeoutPromise = new Promise((_2, reject) => {
      timer = setTimeout(() => {
        reject(typeof exception === "function" ? exception(context) : exception);
      }, duration);
    });
    try {
      await Promise.race([next(), timeoutPromise]);
    } finally {
      if (timer !== void 0) {
        clearTimeout(timer);
      }
    }
  };
};

// ../../node_modules/.pnpm/hono@4.7.8/node_modules/hono/dist/utils/cookie.js
var validCookieNameRegEx = /^[\w!#$%&'*.^`|~+-]+$/;
var validCookieValueRegEx = /^[ !#-:<-[\]-~]*$/;
var parse = (cookie, name) => {
  if (name && cookie.indexOf(name) === -1) {
    return {};
  }
  const pairs = cookie.trim().split(";");
  const parsedCookie = {};
  for (let pairStr of pairs) {
    pairStr = pairStr.trim();
    const valueStartPos = pairStr.indexOf("=");
    if (valueStartPos === -1) {
      continue;
    }
    const cookieName = pairStr.substring(0, valueStartPos).trim();
    if (name && name !== cookieName || !validCookieNameRegEx.test(cookieName)) {
      continue;
    }
    let cookieValue = pairStr.substring(valueStartPos + 1).trim();
    if (cookieValue.startsWith('"') && cookieValue.endsWith('"')) {
      cookieValue = cookieValue.slice(1, -1);
    }
    if (validCookieValueRegEx.test(cookieValue)) {
      parsedCookie[cookieName] = decodeURIComponent_(cookieValue);
      if (name) {
        break;
      }
    }
  }
  return parsedCookie;
};

// ../../node_modules/.pnpm/hono@4.7.8/node_modules/hono/dist/helper/cookie/index.js
var getCookie = (c2, key, prefix) => {
  const cookie = c2.req.raw.headers.get("Cookie");
  if (typeof key === "string") {
    if (!cookie) {
      return void 0;
    }
    let finalKey = key;
    if (prefix === "secure") {
      finalKey = "__Secure-" + key;
    } else if (prefix === "host") {
      finalKey = "__Host-" + key;
    }
    const obj2 = parse(cookie, finalKey);
    return obj2[finalKey];
  }
  if (!cookie) {
    return {};
  }
  const obj = parse(cookie);
  return obj;
};

// ../../node_modules/.pnpm/hono@4.7.8/node_modules/hono/dist/utils/buffer.js
var bufferToFormData = (arrayBuffer, contentType) => {
  const response = new Response(arrayBuffer, {
    headers: {
      "Content-Type": contentType
    }
  });
  return response.formData();
};

// ../../node_modules/.pnpm/hono@4.7.8/node_modules/hono/dist/validator/validator.js
var jsonRegex = /^application\/([a-z-\.]+\+)?json(;\s*[a-zA-Z0-9\-]+\=([^;]+))*$/;
var multipartRegex = /^multipart\/form-data(;\s?boundary=[a-zA-Z0-9'"()+_,\-./:=?]+)?$/;
var urlencodedRegex = /^application\/x-www-form-urlencoded(;\s*[a-zA-Z0-9\-]+\=([^;]+))*$/;
var validator = (target, validationFunc) => {
  return async (c2, next) => {
    let value = {};
    const contentType = c2.req.header("Content-Type");
    switch (target) {
      case "json":
        if (!contentType || !jsonRegex.test(contentType)) {
          break;
        }
        try {
          value = await c2.req.json();
        } catch {
          const message = "Malformed JSON in request body";
          throw new HTTPException(400, { message });
        }
        break;
      case "form": {
        if (!contentType || !(multipartRegex.test(contentType) || urlencodedRegex.test(contentType))) {
          break;
        }
        let formData;
        if (c2.req.bodyCache.formData) {
          formData = await c2.req.bodyCache.formData;
        } else {
          try {
            const arrayBuffer = await c2.req.arrayBuffer();
            formData = await bufferToFormData(arrayBuffer, contentType);
            c2.req.bodyCache.formData = formData;
          } catch (e2) {
            let message = "Malformed FormData request.";
            message += e2 instanceof Error ? ` ${e2.message}` : ` ${String(e2)}`;
            throw new HTTPException(400, { message });
          }
        }
        const form = {};
        formData.forEach((value2, key) => {
          if (key.endsWith("[]")) {
            ;
            (form[key] ??= []).push(value2);
          } else if (Array.isArray(form[key])) {
            ;
            form[key].push(value2);
          } else if (key in form) {
            form[key] = [form[key], value2];
          } else {
            form[key] = value2;
          }
        });
        value = form;
        break;
      }
      case "query":
        value = Object.fromEntries(
          Object.entries(c2.req.queries()).map(([k2, v2]) => {
            return v2.length === 1 ? [k2, v2[0]] : [k2, v2];
          })
        );
        break;
      case "param":
        value = c2.req.param();
        break;
      case "header":
        value = c2.req.header();
        break;
      case "cookie":
        value = getCookie(c2);
        break;
    }
    const res = await validationFunc(value, c2);
    if (res instanceof Response) {
      return res;
    }
    c2.req.addValidatedData(target, res);
    await next();
  };
};

// ../../node_modules/.pnpm/@hono+zod-validator@0.4.3_hono@4.7.8_zod@3.24.4/node_modules/@hono/zod-validator/dist/index.js
var import_zod = __toESM(require_lib(), 1);
var zValidator = (target, schema, hook) => (
  // @ts-expect-error not typed well
  validator(target, async (value, c2) => {
    let validatorValue = value;
    if (target === "header" && schema instanceof import_zod.ZodObject) {
      const schemaKeys = Object.keys(schema.shape);
      const caseInsensitiveKeymap = Object.fromEntries(
        schemaKeys.map((key) => [key.toLowerCase(), key])
      );
      validatorValue = Object.fromEntries(
        Object.entries(value).map(([key, value2]) => [caseInsensitiveKeymap[key] || key, value2])
      );
    }
    const result = await schema.safeParseAsync(validatorValue);
    if (hook) {
      const hookResult = await hook({ data: validatorValue, ...result, target }, c2);
      if (hookResult) {
        if (hookResult instanceof Response) {
          return hookResult;
        }
        if ("response" in hookResult) {
          return hookResult.response;
        }
      }
    }
    if (!result.success) {
      return c2.json(result, 400);
    }
    return result.data;
  })
);

// src/controllers/codec.ts
var import_zod2 = __toESM(require_lib());

// src/workers/thread-pool.ts
var import_node_os2 = __toESM(require("node:os"));
var import_node_worker_threads = require("node:worker_threads");
var import_node_path2 = __toESM(require("node:path"));

// src/utils.ts
var import_fs_extra = __toESM(require_lib2());
var import_node_path = __toESM(require("node:path"));
var import_promises = __toESM(require("node:fs/promises"));

// src/get-port.ts
var import_node_net = __toESM(require("node:net"));
var import_node_os = __toESM(require("node:os"));
var Locked = class extends Error {
  constructor(port) {
    super(`${port} is locked`);
  }
};
var lockedPorts = {
  old: /* @__PURE__ */ new Set(),
  young: /* @__PURE__ */ new Set()
};
var releaseOldLockedPortsIntervalMs = 1e3 * 15;
var minPort = 1024;
var maxPort = 49151;
var timeout2;
var getLocalHosts = () => {
  const interfaces = import_node_os.default.networkInterfaces();
  const results = /* @__PURE__ */ new Set(["127.0.0.1"]);
  for (const _interface of Object.values(interfaces)) {
    for (const config of _interface) {
      results.add(config.address);
    }
  }
  return results;
};
var checkAvailablePort = (options) => new Promise((resolve, reject) => {
  const server = import_node_net.default.createServer();
  server.unref();
  server.on("error", reject);
  server.listen(options, () => {
    const { port } = server.address();
    server.close(() => {
      resolve(port);
    });
  });
});
var getAvailablePort = async (options, hosts) => {
  if (options.host || options.port === 0) {
    return checkAvailablePort(options);
  }
  for (const host of hosts) {
    try {
      await checkAvailablePort({ port: options.port, host });
    } catch (error) {
      if (!["EADDRNOTAVAIL", "EINVAL"].includes(error.code)) {
        throw error;
      }
    }
  }
  return options.port;
};
var portCheckSequence = function* (ports) {
  if (ports) {
    yield* ports;
  }
  yield 0;
};
async function getPorts(options) {
  let ports;
  let exclude = /* @__PURE__ */ new Set();
  if (options) {
    if (options.port) {
      ports = typeof options.port === "number" ? [options.port] : options.port;
    }
    if (options.exclude) {
      const excludeIterable = options.exclude;
      if (typeof excludeIterable[Symbol.iterator] !== "function") {
        throw new TypeError("The `exclude` option must be an iterable.");
      }
      for (const element of excludeIterable) {
        if (typeof element !== "number") {
          throw new TypeError(
            "Each item in the `exclude` option must be a number corresponding to the port you want excluded."
          );
        }
        if (!Number.isSafeInteger(element)) {
          throw new TypeError(
            `Number ${element} in the exclude option is not a safe integer and can't be used`
          );
        }
      }
      exclude = new Set(excludeIterable);
    }
  }
  if (timeout2 === void 0) {
    timeout2 = setTimeout(() => {
      timeout2 = void 0;
      lockedPorts.old = lockedPorts.young;
      lockedPorts.young = /* @__PURE__ */ new Set();
    }, releaseOldLockedPortsIntervalMs);
    if (timeout2.unref) {
      timeout2.unref();
    }
  }
  const hosts = getLocalHosts();
  for (const port of portCheckSequence(ports)) {
    try {
      if (exclude.has(port)) {
        continue;
      }
      let availablePort = await getAvailablePort({ ...options, port }, hosts);
      while (lockedPorts.old.has(availablePort) || lockedPorts.young.has(availablePort)) {
        if (port !== 0) {
          throw new Locked(port);
        }
        availablePort = await getAvailablePort({ ...options, port }, hosts);
      }
      lockedPorts.young.add(availablePort);
      return availablePort;
    } catch (error) {
      if (!["EADDRINUSE", "EACCES"].includes(error.code) && !(error instanceof Locked)) {
        throw error;
      }
    }
  }
  throw new Error("No available ports found");
}
function portNumbers(from, to) {
  if (!Number.isInteger(from) || !Number.isInteger(to)) {
    throw new TypeError("`from` and `to` must be integer numbers");
  }
  if (from < minPort || from > maxPort) {
    throw new RangeError(`'from' must be between ${minPort} and ${maxPort}`);
  }
  if (to < minPort || to > maxPort) {
    throw new RangeError(`'to' must be between ${minPort} and ${maxPort}`);
  }
  if (from > to) {
    throw new RangeError("`to` must be greater than or equal to `from`");
  }
  const generator = function* (from2, to2) {
    for (let port = from2; port <= to2; port++) {
      yield port;
    }
  };
  return generator(from, to);
}

// src/utils.ts
var import_ssim = __toESM(require_dist3());
var import_sharp = __toESM(require("sharp"));
var import_node5 = __toESM(require("@sentry/node"));
var isFile = async (path6) => {
  return (await import_promises.default.stat(path6)).isFile();
};
var isDirectory = async (path6) => {
  if (!path6 || String(path6).trim() === "") return false;
  return (await import_promises.default.stat(path6)).isDirectory();
};
var isExists = async (path6) => {
  return await import_fs_extra.default.pathExists(path6);
};
var checkFile = async (path6) => {
  if (!await isExists(path6)) {
    throw new Error(`Path '${path6}' does not exist`);
  } else if (!await isFile(path6)) {
    throw new Error(`File '${path6}' is not a file`);
  }
};
var getFileSize = async (path6) => {
  const stats = await import_promises.default.stat(path6);
  return stats.size;
};
var createOutputPath = async (inputPath, options) => {
  const mode = options.mode || "overwrite";
  switch (mode) {
    case "overwrite":
      return inputPath;
    case "save_as_new_file": {
      const fileExt = import_node_path.default.extname(inputPath);
      const filename = import_node_path.default.basename(inputPath, fileExt);
      return import_node_path.default.join(import_node_path.default.dirname(inputPath), `${filename}${options.new_file_suffix || "_compressed"}${fileExt}`);
    }
    case "save_to_new_folder": {
      const folder = options.new_folder_path?.trim();
      if (!folder) {
        throw new Error("Save to folder mode requires new_folder_path to be set");
      }
      if (!await isDirectory(folder)) {
        throw new Error(`Directory '${folder}' does not exist`);
      }
      const fileExt = import_node_path.default.extname(inputPath);
      const baseName = import_node_path.default.basename(inputPath, fileExt);
      const filename = import_node_path.default.basename(inputPath);
      const candidate = import_node_path.default.join(folder, filename);
      let targetExists = false;
      try {
        const st2 = await import_promises.default.stat(candidate);
        targetExists = st2.isFile();
      } catch {
      }
      if (targetExists) {
        return import_node_path.default.join(folder, `${baseName}${options.new_file_suffix || "_compressed"}${fileExt}`);
      }
      return candidate;
    }
    default:
      throw new Error(`Unknown save mode: ${mode}`);
  }
};
async function findAvailablePort(preferredPort) {
  return getPorts({ port: preferredPort || portNumbers(1024, 49151) });
}
var isWindows = process.platform === "win32";
var isMac = process.platform === "darwin";
var isLinux = process.platform === "linux";
function isBigInt(value) {
  return typeof value === "bigint";
}
function jsonBigInt(key, value) {
  if (isBigInt(value)) {
    return value.toString();
  }
  return value;
}
var isBuilt = __dirname.includes("dist");
var isDev = process.env.NODE_ENV !== "production" && !isBuilt;
function pxToPangoSize(px) {
  return Math.round(px * 768);
}
function captureError(error, payload, tag) {
  try {
    import_node5.default.withScope((scope) => {
      if (payload) {
        scope.setContext("Error Payload", payload);
      }
      if (tag) {
        scope.setTag("tag", tag);
      }
      scope.captureException(error);
    });
  } catch (_2) {
  }
}

// src/workers/thread-pool.ts
var import_node6 = __toESM(require("@sentry/node"));
var import_node_cluster = __toESM(require("node:cluster"));
function getWorkerEntry() {
  if (isDev) {
    return import_node_path2.default.join(__dirname, "dispatcher.dev.js");
  }
  return import_node_path2.default.join(__dirname, "dispatcher.js");
}
function createWorkerInstance() {
  const entry = getWorkerEntry();
  return new import_node_worker_threads.Worker(entry, {
    workerData: {
      workerId: import_node_cluster.default.worker?.id
    }
  });
}
var singletonPool;
function initThreadPool() {
  const size = Math.max(1, Math.floor(import_node_os2.default.cpus().length || 2));
  const poolSize = Number(process.env.VERYPIC_SIDECAR_THREADS) || size;
  const workers = /* @__PURE__ */ new Map();
  const pendings = /* @__PURE__ */ new Map();
  function nextId() {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  }
  function getIdle() {
    return Array.from(workers.values()).find((w2) => !w2.busy);
  }
  function spawn() {
    const w2 = createWorkerInstance();
    const wrap = { id: w2.threadId, worker: w2, busy: false };
    w2.on("message", (msg) => {
      const { requestId, data, error, errorPayload } = msg || {};
      if (!requestId) return;
      const pending = pendings.get(requestId);
      if (!pending) return;
      if (pending.timeout) clearTimeout(pending.timeout);
      pendings.delete(requestId);
      wrap.busy = false;
      wrap.currentId = void 0;
      if (error) {
        if (errorPayload) {
          import_node6.default.setContext("Error Payload", errorPayload);
        }
        pending.reject(error);
      } else {
        pending.resolve(data);
      }
    });
    w2.on("error", (error) => {
      if (wrap.currentId) {
        const p2 = pendings.get(wrap.currentId);
        if (p2) {
          if (p2.timeout) clearTimeout(p2.timeout);
          pendings.delete(wrap.currentId);
          p2.reject(error);
          captureError(
            new Error(`[WorkerThread<${w2.threadId}> Error]: ${error.message || error.toString()}`),
            void 0,
            "worker_thread_error"
          );
        }
      }
    });
    w2.on("exit", (code) => {
      console.log(`[WorkerThread<${w2.threadId}> Exit]:`, code);
      workers.delete(wrap.id);
      spawn();
      captureError(
        new Error(`[WorkerThread<${w2.threadId}> Exit]: ${code}`),
        void 0,
        "worker_thread_exit"
      );
    });
    workers.set(wrap.id, wrap);
  }
  for (let i2 = 0; i2 < poolSize; i2++) spawn();
  async function run2(task, timeoutMs = 6e4 * 5) {
    const idle = getIdle();
    if (!idle) {
      await new Promise((r2) => setTimeout(r2, 5));
      return run2(task, timeoutMs);
    }
    const requestId = nextId();
    idle.busy = true;
    idle.currentId = requestId;
    const result = new Promise((resolve, reject) => {
      const pending = { resolve, reject };
      if (timeoutMs > 0) {
        pending.timeout = setTimeout(() => {
          pendings.delete(requestId);
          idle.busy = false;
          idle.currentId = void 0;
          reject(new Error(`Task Timeout: ${task.type}`));
        }, timeoutMs).unref();
      }
      pendings.set(requestId, pending);
      idle.worker.postMessage({ requestId, type: task.type, payload: task.payload });
    });
    return result;
  }
  return { run: run2 };
}
function getThreadPool() {
  if (singletonPool) return singletonPool;
  singletonPool = initThreadPool();
  return singletonPool;
}

// src/controllers/codec.ts
var GetRawPixelsPayloadSchema = import_zod2.z.object({
  input_path: import_zod2.z.string()
});
var ToBase64PayloadSchema = import_zod2.z.object({
  input_path: import_zod2.z.string()
});
function createCodecRouter() {
  const app13 = new Hono2();
  app13.post("/get-raw-pixels", zValidator("json", GetRawPixelsPayloadSchema), async (c2) => {
    const { input_path } = await c2.req.json();
    const pool = getThreadPool();
    const data = await pool.run({
      type: "codec:get-raw-pixels",
      payload: { input_path }
    });
    return c2.json(data);
  });
  app13.post("/base64", zValidator("json", ToBase64PayloadSchema), async (c2) => {
    const { input_path } = await c2.req.json();
    const pool = getThreadPool();
    const data = await pool.run({
      type: "codec:to-base64",
      payload: { input_path }
    });
    return c2.json(data);
  });
  return app13;
}

// src/controllers/image-viewer.ts
var import_zod3 = __toESM(require_lib());
var ThumbnailPayloadSchema = import_zod3.z.object({
  input_path: import_zod3.z.string(),
  output_dir: import_zod3.z.string(),
  ext: import_zod3.z.string(),
  width: import_zod3.z.number(),
  height: import_zod3.z.number(),
  options: import_zod3.z.custom().optional()
});
function createImageViewerRouter() {
  const app13 = new Hono2();
  app13.post("/thumbnail", zValidator("json", ThumbnailPayloadSchema), async (c2) => {
    try {
      const payload = await c2.req.json();
      const pool = getThreadPool();
      const data = await pool.run({ type: "image:thumbnail", payload });
      return c2.json(data);
    } catch (err) {
      const msg = err?.message || String(err);
      console.error("[image-viewer/thumbnail]", msg);
      return c2.json({ error: msg, output_path: null }, 500);
    }
  });
  return app13;
}

// src/controllers/compress/png.ts
var import_zod4 = __toESM(require_lib());

// src/constants.ts
var HOSTNAME = "127.0.0.1";
var SaveMode = /* @__PURE__ */ ((SaveMode2) => {
  SaveMode2["Overwrite"] = "overwrite";
  SaveMode2["SaveAsNewFile"] = "save_as_new_file";
  SaveMode2["SaveToNewFolder"] = "save_to_new_folder";
  return SaveMode2;
})(SaveMode || {});
var ConvertFormat = /* @__PURE__ */ ((ConvertFormat2) => {
  ConvertFormat2["PNG"] = "png";
  ConvertFormat2["JPG"] = "jpg";
  ConvertFormat2["WEBP"] = "webp";
  ConvertFormat2["AVIF"] = "avif";
  ConvertFormat2["GIF"] = "gif";
  return ConvertFormat2;
})(ConvertFormat || {});
var VALID_IMAGE_EXTS = [
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".avif",
  ".svg",
  ".gif",
  ".tiff",
  ".tif"
];
var ResizeFit = /* @__PURE__ */ ((ResizeFit2) => {
  ResizeFit2["Contain"] = "contain";
  ResizeFit2["Cover"] = "cover";
  ResizeFit2["Fill"] = "fill";
  ResizeFit2["Inside"] = "inside";
  ResizeFit2["Outside"] = "outside";
  return ResizeFit2;
})(ResizeFit || {});
var WatermarkType = /* @__PURE__ */ ((WatermarkType2) => {
  WatermarkType2["None"] = "none";
  WatermarkType2["Text"] = "text";
  WatermarkType2["Image"] = "image";
  WatermarkType2["Tile"] = "tile";
  return WatermarkType2;
})(WatermarkType || {});
var WatermarkPosition = /* @__PURE__ */ ((WatermarkPosition2) => {
  WatermarkPosition2["Top"] = "north";
  WatermarkPosition2["TopLeft"] = "northwest";
  WatermarkPosition2["TopRight"] = "northeast";
  WatermarkPosition2["Bottom"] = "south";
  WatermarkPosition2["BottomRight"] = "southeast";
  WatermarkPosition2["BottomLeft"] = "southwest";
  WatermarkPosition2["Left"] = "west";
  WatermarkPosition2["Right"] = "east";
  WatermarkPosition2["Center"] = "center";
  WatermarkPosition2["Custom"] = "custom";
  return WatermarkPosition2;
})(WatermarkPosition || {});

// src/controllers/compress/png.ts
var import_image = require("@napi-rs/image");

// src/controllers/utils.ts
var payloadValidator = (result, c2) => {
  if (!result.success) {
    return c2.json(
      {
        code: -1,
        err_msg: `Parameter verification failed`,
        errors: JSON.stringify(result.error.issues),
        status: 400
      },
      400
    );
  }
};

// src/controllers/compress/png.ts
var app = new Hono2();
var OptionsSchema = import_zod4.z.object({
  limit_compress_rate: import_zod4.z.number().min(0).max(1).optional(),
  target_size_enable: import_zod4.z.boolean().optional().default(false),
  target_size_kb: import_zod4.z.number().min(1).optional(),
  target_size_tolerance: import_zod4.z.number().min(0).max(1).optional().default(0.1),
  save: import_zod4.z.object({
    mode: import_zod4.z.nativeEnum(SaveMode).optional().default("overwrite" /* Overwrite */),
    new_file_suffix: import_zod4.z.string().optional().default("_compressed"),
    new_folder_path: import_zod4.z.string().optional()
  }).optional().default({}),
  temp_dir: import_zod4.z.string().optional(),
  convert_enable: import_zod4.z.boolean().optional().default(false),
  convert_types: import_zod4.z.array(import_zod4.z.nativeEnum(ConvertFormat)).optional().default([]),
  convert_alpha: import_zod4.z.string().optional().default("#FFFFFF"),
  resize_enable: import_zod4.z.boolean().optional().default(false),
  resize_scale: import_zod4.z.number().optional().default(0),
  resize_dimensions: import_zod4.z.array(import_zod4.z.number()).optional().default([0, 0]),
  resize_fit: import_zod4.z.nativeEnum(ResizeFit).optional().default("cover" /* Cover */),
  watermark_type: import_zod4.z.nativeEnum(WatermarkType).optional().default("none" /* None */),
  watermark_position: import_zod4.z.nativeEnum(WatermarkPosition).optional().default("southeast" /* BottomRight */),
  watermark_text: import_zod4.z.string().optional().default(""),
  watermark_text_color: import_zod4.z.string().optional().default("#FFFFFF"),
  watermark_font_size: import_zod4.z.number().optional().default(16),
  watermark_image_path: import_zod4.z.string().optional().default(""),
  watermark_image_opacity: import_zod4.z.number().min(0).max(1).optional().default(1),
  watermark_image_scale: import_zod4.z.number().min(0).max(1).optional().default(0.15),
  keep_metadata: import_zod4.z.boolean().optional().default(false)
}).optional().default({});
var LossyProcessOptionsSchema = import_zod4.z.object({
  // pngquant ???????�?-100??????????
  minQuality: import_zod4.z.number().min(0).max(100).optional().default(70),
  // pngquant ???????0-100
  maxQuality: import_zod4.z.number().min(0).max(100).optional().default(99),
  // ????�???????�?0????????�?
  speed: import_zod4.z.number().min(1).max(10).optional().default(5)
}).optional().default({});
var LosslessProcessOptionsSchema = import_zod4.z.object({
  fixErrors: import_zod4.z.boolean().optional().default(false),
  force: import_zod4.z.boolean().optional().default(false),
  // Brute = 9???????????????????? pngcrush --all-filters??????
  filter: import_zod4.z.array(import_zod4.z.nativeEnum(import_image.PngRowFilter)).optional().default([import_image.PngRowFilter.Brute]),
  bitDepthReduction: import_zod4.z.boolean().optional().default(true),
  colorTypeReduction: import_zod4.z.boolean().optional().default(true),
  paletteReduction: import_zod4.z.boolean().optional().default(true),
  grayscaleReduction: import_zod4.z.boolean().optional().default(true),
  idatRecoding: import_zod4.z.boolean().optional().default(true),
  strip: import_zod4.z.boolean().optional().default(true)
}).optional().default({});
var LossyPayloadSchema = import_zod4.z.object({
  input_path: import_zod4.z.string(),
  options: OptionsSchema,
  process_options: LossyProcessOptionsSchema
});
var LosslessPayloadSchema = import_zod4.z.object({
  input_path: import_zod4.z.string(),
  options: OptionsSchema,
  process_options: LosslessProcessOptionsSchema
});
app.post("/", zValidator("json", LossyPayloadSchema, payloadValidator), async (context) => {
  let { input_path, options, process_options } = await context.req.json();
  await checkFile(input_path);
  options = OptionsSchema.parse(options);
  process_options = LossyProcessOptionsSchema.parse(process_options);
  const result = await getThreadPool().run({
    type: "png",
    payload: { input_path, options, process_options }
  });
  return context.json(result);
});
app.post("/lossless", zValidator("json", LosslessPayloadSchema), async (context) => {
  let { input_path, options, process_options } = await context.req.json();
  await checkFile(input_path);
  options = OptionsSchema.parse(options);
  process_options = LosslessProcessOptionsSchema.parse(process_options);
  const result = await getThreadPool().run({
    type: "png-lossless",
    payload: { input_path, options, process_options }
  });
  return context.json(result);
});
var png_default = app;

// src/controllers/compress/avif.ts
var import_zod5 = __toESM(require_lib());
var app2 = new Hono2();
var OptionsSchema2 = import_zod5.z.object({
  limit_compress_rate: import_zod5.z.number().min(0).max(1).optional(),
  target_size_enable: import_zod5.z.boolean().optional().default(false),
  target_size_kb: import_zod5.z.number().min(1).optional(),
  target_size_tolerance: import_zod5.z.number().min(0).max(1).optional().default(0.1),
  save: import_zod5.z.object({
    mode: import_zod5.z.nativeEnum(SaveMode).optional().default("overwrite" /* Overwrite */),
    new_file_suffix: import_zod5.z.string().optional().default("_compressed"),
    new_folder_path: import_zod5.z.string().optional()
  }).optional().default({}),
  temp_dir: import_zod5.z.string().optional(),
  convert_enable: import_zod5.z.boolean().optional().default(false),
  convert_types: import_zod5.z.array(import_zod5.z.nativeEnum(ConvertFormat)).optional().default([]),
  convert_alpha: import_zod5.z.string().optional().default("#FFFFFF"),
  resize_enable: import_zod5.z.boolean().optional().default(false),
  resize_scale: import_zod5.z.number().optional().default(0),
  resize_dimensions: import_zod5.z.array(import_zod5.z.number()).optional().default([]),
  resize_fit: import_zod5.z.nativeEnum(ResizeFit).optional().default("cover" /* Cover */),
  watermark_type: import_zod5.z.nativeEnum(WatermarkType).optional().default("none" /* None */),
  watermark_position: import_zod5.z.nativeEnum(WatermarkPosition).optional().default("southeast" /* BottomRight */),
  watermark_text: import_zod5.z.string().optional().default(""),
  watermark_text_color: import_zod5.z.string().optional().default("#FFFFFF"),
  watermark_font_size: import_zod5.z.number().optional().default(16),
  watermark_image_path: import_zod5.z.string().optional().default(""),
  watermark_image_opacity: import_zod5.z.number().min(0).max(1).optional().default(1),
  watermark_image_scale: import_zod5.z.number().min(0).max(1).optional().default(0.15),
  keep_metadata: import_zod5.z.boolean().optional().default(false)
}).optional().default({});
var ProcessOptionsSchema = import_zod5.z.object({
  // 质量，整�?-100
  quality: import_zod5.z.number().min(1).max(100).optional().default(50),
  // 使用无损压缩模式
  lossless: import_zod5.z.boolean().optional().default(false),
  // CPU努力程度，介�?（最快）�?（最慢）之间
  effort: import_zod5.z.number().min(0).max(9).optional().default(4),
  // 色度子采样，设置�?4:2:0'以使用色度子采样，默认为'4:4:4'
  chromaSubsampling: import_zod5.z.string().optional().default("4:4:4")
  // 位深度，设置�?�?0�?2�?    bitdepth: z.nativeEnum(BitDepthEnum).optional().default(BitDepthEnum.Eight),
}).optional().default({});
var PayloadSchema = import_zod5.z.object({
  input_path: import_zod5.z.string(),
  options: OptionsSchema2,
  process_options: ProcessOptionsSchema
});
app2.post("/", zValidator("json", PayloadSchema, payloadValidator), async (context) => {
  let { input_path, options, process_options } = await context.req.json();
  await checkFile(input_path);
  options = OptionsSchema2.parse(options);
  process_options = ProcessOptionsSchema.parse(process_options);
  const result = await getThreadPool().run({
    type: "avif",
    payload: { input_path, options, process_options }
  });
  return context.json(result);
});
var avif_default = app2;

// src/controllers/compress/gif.ts
var import_zod6 = __toESM(require_lib());
var app3 = new Hono2();
var OptionsSchema3 = import_zod6.z.object({
  limit_compress_rate: import_zod6.z.number().min(0).max(1).optional(),
  target_size_enable: import_zod6.z.boolean().optional().default(false),
  target_size_kb: import_zod6.z.number().min(1).optional(),
  target_size_tolerance: import_zod6.z.number().min(0).max(1).optional().default(0.1),
  save: import_zod6.z.object({
    mode: import_zod6.z.nativeEnum(SaveMode).optional().default("overwrite" /* Overwrite */),
    new_file_suffix: import_zod6.z.string().optional().default("_compressed"),
    new_folder_path: import_zod6.z.string().optional()
  }).optional().default({}),
  temp_dir: import_zod6.z.string().optional(),
  convert_enable: import_zod6.z.boolean().optional().default(false),
  convert_types: import_zod6.z.array(import_zod6.z.nativeEnum(ConvertFormat)).optional().default([]),
  convert_alpha: import_zod6.z.string().optional().default("#FFFFFF"),
  resize_enable: import_zod6.z.boolean().optional().default(false),
  resize_scale: import_zod6.z.number().optional().default(0),
  resize_dimensions: import_zod6.z.array(import_zod6.z.number()).optional().default([]),
  resize_fit: import_zod6.z.nativeEnum(ResizeFit).optional().default("cover" /* Cover */),
  watermark_type: import_zod6.z.nativeEnum(WatermarkType).optional().default("none" /* None */),
  watermark_position: import_zod6.z.nativeEnum(WatermarkPosition).optional().default("southeast" /* BottomRight */),
  watermark_text: import_zod6.z.string().optional().default(""),
  watermark_text_color: import_zod6.z.string().optional().default("#FFFFFF"),
  watermark_font_size: import_zod6.z.number().optional().default(16),
  watermark_image_path: import_zod6.z.string().optional().default(""),
  watermark_image_opacity: import_zod6.z.number().min(0).max(1).optional().default(1),
  watermark_image_scale: import_zod6.z.number().min(0).max(1).optional().default(0.15),
  keep_metadata: import_zod6.z.boolean().optional().default(false)
}).optional().default({});
var ProcessOptionsSchema2 = import_zod6.z.object({
  // ??????????????????
  reuse: import_zod6.z.boolean().optional().default(true),
  // ???????????
  progressive: import_zod6.z.boolean().optional().default(false),
  // ????????????? 2~256 ???
  // ??????service ??? undefined ?????????????256?128?64?32??
  // ?????????????????????
  colours: import_zod6.z.number().min(2).max(256).optional(),
  // `colours` ??????????????????
  colors: import_zod6.z.number().min(2).max(256).optional(),
  // CPU ??????? 1????? 10??????
  effort: import_zod6.z.number().min(1).max(10).optional().default(7),
  // Floyd-Steinberg ?????????? 0????? 1??????
  dither: import_zod6.z.number().min(0).max(1).optional().default(1),
  // ???????????? 0????? 32 ????? GIF ? service ??????
  interFrameMaxError: import_zod6.z.number().min(0).max(32).optional().default(0),
  // ??????????????? 0 ? 256 ??
  interPaletteMaxError: import_zod6.z.number().min(0).max(256).optional().default(3),
  // ???????0 ??????
  loop: import_zod6.z.number().optional().default(0),
  // ????????????
  delay: import_zod6.z.union([import_zod6.z.number(), import_zod6.z.array(import_zod6.z.number())]).optional(),
  // ?? GIF ??
  force: import_zod6.z.boolean().optional().default(true)
}).optional().default({});
var PayloadSchema2 = import_zod6.z.object({
  input_path: import_zod6.z.string(),
  options: OptionsSchema3,
  process_options: ProcessOptionsSchema2
});
app3.post("/", zValidator("json", PayloadSchema2, payloadValidator), async (context) => {
  let { input_path, options, process_options } = await context.req.json();
  await checkFile(input_path);
  options = OptionsSchema3.parse(options);
  process_options = ProcessOptionsSchema2.parse(process_options);
  const result = await getThreadPool().run({
    type: "gif",
    payload: { input_path, options, process_options }
  });
  return context.json(result);
});
var gif_default = app3;

// src/controllers/compress/webp.ts
var import_zod7 = __toESM(require_lib());
var app4 = new Hono2();
var OptionsSchema4 = import_zod7.z.object({
  limit_compress_rate: import_zod7.z.number().min(0).max(1).optional(),
  target_size_enable: import_zod7.z.boolean().optional().default(false),
  target_size_kb: import_zod7.z.number().min(1).optional(),
  target_size_tolerance: import_zod7.z.number().min(0).max(1).optional().default(0.1),
  save: import_zod7.z.object({
    mode: import_zod7.z.nativeEnum(SaveMode).optional().default("overwrite" /* Overwrite */),
    new_file_suffix: import_zod7.z.string().optional().default("_compressed"),
    new_folder_path: import_zod7.z.string().optional()
  }).optional().default({}),
  temp_dir: import_zod7.z.string().optional(),
  convert_enable: import_zod7.z.boolean().optional().default(false),
  convert_types: import_zod7.z.array(import_zod7.z.nativeEnum(ConvertFormat)).optional().default([]),
  convert_alpha: import_zod7.z.string().optional().default("#FFFFFF"),
  resize_enable: import_zod7.z.boolean().optional().default(false),
  resize_scale: import_zod7.z.number().optional().default(0),
  resize_dimensions: import_zod7.z.array(import_zod7.z.number()).optional().default([]),
  resize_fit: import_zod7.z.nativeEnum(ResizeFit).optional().default("cover" /* Cover */),
  watermark_type: import_zod7.z.nativeEnum(WatermarkType).optional().default("none" /* None */),
  watermark_position: import_zod7.z.nativeEnum(WatermarkPosition).optional().default("southeast" /* BottomRight */),
  watermark_text: import_zod7.z.string().optional().default(""),
  watermark_text_color: import_zod7.z.string().optional().default("#FFFFFF"),
  watermark_font_size: import_zod7.z.number().optional().default(16),
  watermark_image_path: import_zod7.z.string().optional().default(""),
  watermark_image_opacity: import_zod7.z.number().min(0).max(1).optional().default(1),
  watermark_image_scale: import_zod7.z.number().min(0).max(1).optional().default(0.15),
  keep_metadata: import_zod7.z.boolean().optional().default(false)
}).optional().default({});
var PresetEnum = /* @__PURE__ */ ((PresetEnum2) => {
  PresetEnum2["Default"] = "default";
  PresetEnum2["Photo"] = "photo";
  PresetEnum2["Picture"] = "picture";
  PresetEnum2["Drawing"] = "drawing";
  PresetEnum2["Icon"] = "icon";
  PresetEnum2["Text"] = "text";
  return PresetEnum2;
})(PresetEnum || {});
var ProcessOptionsSchema3 = import_zod7.z.object({
  // 质量，整�?-100
  quality: import_zod7.z.number().min(1).max(100).optional().default(80),
  // alpha层的质量，整�?-100
  alphaQuality: import_zod7.z.number().min(0).max(100).optional().default(100),
  // 使用无损压缩模式
  lossless: import_zod7.z.boolean().optional().default(false),
  // 使用近无损压缩模�?    nearLossless: z.boolean().optional().default(false),
  // 使用高质量色度子采样
  smartSubsample: import_zod7.z.boolean().optional().default(false),
  // 自动调整去块滤波器，可以改善低对比度边缘（较慢）
  smartDeblock: import_zod7.z.boolean().optional().default(false),
  // 预处�?过滤的命名预设，可选值：default, photo, picture, drawing, icon, text
  preset: import_zod7.z.nativeEnum(PresetEnum).optional().default("default" /* Default */),
  // CPU努力程度，介�?（最快）�?（最慢）之间
  effort: import_zod7.z.number().min(0).max(6).optional().default(4),
  // 动画迭代次数，使�?表示无限动画
  loop: import_zod7.z.number().optional().default(0),
  // 动画帧之间的延迟（以毫秒为单位）
  delay: import_zod7.z.union([import_zod7.z.number(), import_zod7.z.array(import_zod7.z.number())]).optional(),
  // 防止使用动画关键帧以最小化文件大小（较慢）
  minSize: import_zod7.z.boolean().optional().default(false),
  // 允许混合有损和无损动画帧（较慢）
  mixed: import_zod7.z.boolean().optional().default(false)
  // 强制WebP输出，否则尝试使用输入格�?    force: z.boolean().optional().default(true),
}).optional().default({});
var PayloadSchema3 = import_zod7.z.object({
  input_path: import_zod7.z.string(),
  options: OptionsSchema4,
  process_options: ProcessOptionsSchema3
});
app4.post("/", zValidator("json", PayloadSchema3, payloadValidator), async (context) => {
  let { input_path, options, process_options } = await context.req.json();
  await checkFile(input_path);
  options = OptionsSchema4.parse(options);
  process_options = ProcessOptionsSchema3.parse(process_options);
  const result = await getThreadPool().run({
    type: "webp",
    payload: { input_path, options, process_options }
  });
  return context.json(result);
});
var webp_default = app4;

// src/controllers/compress/jpeg.ts
var import_zod8 = __toESM(require_lib());
var app5 = new Hono2();
var OptionsSchema5 = import_zod8.z.object({
  limit_compress_rate: import_zod8.z.number().min(0).max(1).optional(),
  target_size_enable: import_zod8.z.boolean().optional().default(false),
  target_size_kb: import_zod8.z.number().min(1).optional(),
  target_size_tolerance: import_zod8.z.number().min(0).max(1).optional().default(0.1),
  save: import_zod8.z.object({
    mode: import_zod8.z.nativeEnum(SaveMode).optional().default("overwrite" /* Overwrite */),
    new_file_suffix: import_zod8.z.string().optional().default("_compressed"),
    new_folder_path: import_zod8.z.string().optional()
  }).optional().default({}),
  temp_dir: import_zod8.z.string().optional(),
  convert_enable: import_zod8.z.boolean().optional().default(false),
  convert_types: import_zod8.z.array(import_zod8.z.nativeEnum(ConvertFormat)).optional().default([]),
  convert_alpha: import_zod8.z.string().optional().default("#FFFFFF"),
  resize_enable: import_zod8.z.boolean().optional().default(false),
  resize_scale: import_zod8.z.number().optional().default(0),
  resize_dimensions: import_zod8.z.array(import_zod8.z.number()).optional().default([]),
  resize_fit: import_zod8.z.nativeEnum(ResizeFit).optional().default("cover" /* Cover */),
  watermark_type: import_zod8.z.nativeEnum(WatermarkType).optional().default("none" /* None */),
  watermark_position: import_zod8.z.nativeEnum(WatermarkPosition).optional().default("southeast" /* BottomRight */),
  watermark_text: import_zod8.z.string().optional().default(""),
  watermark_text_color: import_zod8.z.string().optional().default("#FFFFFF"),
  watermark_font_size: import_zod8.z.number().optional().default(16),
  watermark_image_path: import_zod8.z.string().optional().default(""),
  watermark_image_opacity: import_zod8.z.number().min(0).max(1).optional().default(1),
  watermark_image_scale: import_zod8.z.number().min(0).max(1).optional().default(0.15),
  keep_metadata: import_zod8.z.boolean().optional().default(false)
}).optional().default({});
var ProcessOptionsSchema4 = import_zod8.z.object({
  // 质量，整�?-100
  quality: import_zod8.z.number().min(0).max(100).optional().default(80),
  // 是否使用渐进式（交错）扫�?    progressive: z.boolean().optional().default(false),
  // 色度子采样，设置�?4:4:4'以防止色度子采样，默认为'4:2:0'
  chromaSubsampling: import_zod8.z.string().optional().default("4:2:0"),
  // 优化霍夫曼编码表
  optimiseCoding: import_zod8.z.boolean().optional().default(true),
  // 优化编码的替代拼�?    optimizeCoding: z.boolean().optional().default(true),
  // 使用mozjpeg默认�?    mozjpeg: z.boolean().optional().default(false),
  // 应用网格量化
  trellisQuantisation: import_zod8.z.boolean().optional().default(false),
  // 应用过冲去振�?    overshootDeringing: z.boolean().optional().default(false),
  // 优化渐进式扫�?    optimiseScans: z.boolean().optional().default(false),
  // 优化扫描的替代拼�?    optimizeScans: z.boolean().optional().default(false),
  // 量化表，整数0-8
  quantisationTable: import_zod8.z.number().optional(),
  // 量化表的替代拼写
  quantizationTable: import_zod8.z.number().optional()
  // 强制JPEG输出，即使输入图像的alpha通道被使�?    force: z.boolean().optional().default(true),
}).optional().default({});
var PayloadSchema4 = import_zod8.z.object({
  input_path: import_zod8.z.string(),
  options: OptionsSchema5,
  process_options: ProcessOptionsSchema4
});
app5.post("/", zValidator("json", PayloadSchema4, payloadValidator), async (context) => {
  let { input_path, options, process_options } = await context.req.json();
  await checkFile(input_path);
  options = OptionsSchema5.parse(options);
  process_options = ProcessOptionsSchema4.parse(process_options);
  const result = await getThreadPool().run({
    type: "jpeg",
    payload: { input_path, options, process_options }
  });
  return context.json(result);
});
var jpeg_default = app5;

// src/controllers/compress/tiff.ts
var import_zod9 = __toESM(require_lib());
var app6 = new Hono2();
var OptionsSchema6 = import_zod9.z.object({
  limit_compress_rate: import_zod9.z.number().min(0).max(1).optional(),
  target_size_enable: import_zod9.z.boolean().optional().default(false),
  target_size_kb: import_zod9.z.number().min(1).optional(),
  target_size_tolerance: import_zod9.z.number().min(0).max(1).optional().default(0.1),
  save: import_zod9.z.object({
    mode: import_zod9.z.nativeEnum(SaveMode).optional().default("overwrite" /* Overwrite */),
    new_file_suffix: import_zod9.z.string().optional().default("_compressed"),
    new_folder_path: import_zod9.z.string().optional()
  }).optional().default({}),
  temp_dir: import_zod9.z.string().optional(),
  convert_enable: import_zod9.z.boolean().optional().default(false),
  convert_types: import_zod9.z.array(import_zod9.z.nativeEnum(ConvertFormat)).optional().default([]),
  convert_alpha: import_zod9.z.string().optional().default("#FFFFFF"),
  resize_enable: import_zod9.z.boolean().optional().default(false),
  resize_scale: import_zod9.z.number().optional().default(0),
  resize_dimensions: import_zod9.z.array(import_zod9.z.number()).optional().default([]),
  resize_fit: import_zod9.z.nativeEnum(ResizeFit).optional().default("cover" /* Cover */),
  watermark_type: import_zod9.z.nativeEnum(WatermarkType).optional().default("none" /* None */),
  watermark_position: import_zod9.z.nativeEnum(WatermarkPosition).optional().default("southeast" /* BottomRight */),
  watermark_text: import_zod9.z.string().optional().default(""),
  watermark_text_color: import_zod9.z.string().optional().default("#FFFFFF"),
  watermark_font_size: import_zod9.z.number().optional().default(16),
  watermark_image_path: import_zod9.z.string().optional().default(""),
  watermark_image_opacity: import_zod9.z.number().min(0).max(1).optional().default(1),
  watermark_image_scale: import_zod9.z.number().min(0).max(1).optional().default(0.15),
  keep_metadata: import_zod9.z.boolean().optional().default(false)
}).optional().default({});
var CompressionEnum = /* @__PURE__ */ ((CompressionEnum2) => {
  CompressionEnum2["None"] = "none";
  CompressionEnum2["Jpeg"] = "jpeg";
  CompressionEnum2["Deflate"] = "deflate";
  CompressionEnum2["Packbits"] = "packbits";
  CompressionEnum2["Ccittfax4"] = "ccittfax4";
  CompressionEnum2["Lzw"] = "lzw";
  CompressionEnum2["Webp"] = "webp";
  CompressionEnum2["Zstd"] = "zstd";
  CompressionEnum2["Jp2k"] = "jp2k";
  return CompressionEnum2;
})(CompressionEnum || {});
var ResolutionUnitEnum = /* @__PURE__ */ ((ResolutionUnitEnum2) => {
  ResolutionUnitEnum2["Inch"] = "inch";
  ResolutionUnitEnum2["Cm"] = "cm";
  return ResolutionUnitEnum2;
})(ResolutionUnitEnum || {});
var PredictorEnum = /* @__PURE__ */ ((PredictorEnum2) => {
  PredictorEnum2["None"] = "none";
  PredictorEnum2["Horizontal"] = "horizontal";
  PredictorEnum2["Float"] = "float";
  return PredictorEnum2;
})(PredictorEnum || {});
var ProcessOptionsSchema5 = import_zod9.z.object({
  // 质量，整�?-100
  quality: import_zod9.z.number().min(1).max(100).optional().default(80),
  // 强制TIFF输出，否则尝试使用输入格�?    force: z.boolean().optional().default(true),
  // 压缩选项：none, jpeg, deflate, packbits, ccittfax4, lzw, webp, zstd, jp2k
  compression: import_zod9.z.nativeEnum(CompressionEnum).optional().default("jpeg" /* Jpeg */),
  // 压缩预测器选项：none, horizontal, float
  predictor: import_zod9.z.nativeEnum(PredictorEnum).optional().default("horizontal" /* Horizontal */),
  // 写入图像金字�?    pyramid: z.boolean().optional().default(false),
  // 写入平铺TIFF
  tile: import_zod9.z.boolean().optional().default(false),
  // 水平平铺大小
  tileWidth: import_zod9.z.number().optional().default(256),
  // 垂直平铺大小
  tileHeight: import_zod9.z.number().optional().default(256),
  // 水平分辨率（像素/毫米�?    xres: z.number().optional().default(1.0),
  // 垂直分辨率（像素/毫米�?    yres: z.number().optional().default(1.0),
  // 分辨率单位选项：inch, cm
  resolutionUnit: import_zod9.z.nativeEnum(ResolutionUnitEnum).optional().default("inch" /* Inch */),
  // 降低位深度至1�?�?�?    bitdepth: z.nativeEnum(BitDepthEnum).optional().default(BitDepthEnum.Eight),
  // �?位图像写为miniswhite
  miniswhite: import_zod9.z.boolean().optional().default(false)
}).optional().default({});
var PayloadSchema5 = import_zod9.z.object({
  input_path: import_zod9.z.string(),
  options: OptionsSchema6,
  process_options: ProcessOptionsSchema5
});
app6.post("/", zValidator("json", PayloadSchema5, payloadValidator), async (context) => {
  let { input_path, options, process_options } = await context.req.json();
  await checkFile(input_path);
  options = OptionsSchema6.parse(options);
  process_options = ProcessOptionsSchema5.parse(process_options);
  const result = await getThreadPool().run({
    type: "tiff",
    payload: { input_path, options, process_options }
  });
  return context.json(result);
});
var tiff_default = app6;

// src/controllers/compress/svg.ts
var import_zod10 = __toESM(require_lib());
var app7 = new Hono2();
var OptionsSchema7 = import_zod10.z.object({
  limit_compress_rate: import_zod10.z.number().min(0).max(1).optional(),
  target_size_enable: import_zod10.z.boolean().optional().default(false),
  target_size_kb: import_zod10.z.number().min(1).optional(),
  target_size_tolerance: import_zod10.z.number().min(0).max(1).optional().default(0.1),
  save: import_zod10.z.object({
    mode: import_zod10.z.nativeEnum(SaveMode).optional().default("overwrite" /* Overwrite */),
    new_file_suffix: import_zod10.z.string().optional().default("_compressed"),
    new_folder_path: import_zod10.z.string().optional()
  }).optional().default({}),
  temp_dir: import_zod10.z.string().optional()
}).optional().default({});
var PayloadSchema6 = import_zod10.z.object({
  input_path: import_zod10.z.string(),
  options: OptionsSchema7
});
app7.post("/", zValidator("json", PayloadSchema6, payloadValidator), async (context) => {
  let { input_path, options } = await context.req.json();
  await checkFile(input_path);
  options = OptionsSchema7.parse(options);
  const result = await getThreadPool().run({
    type: "svg",
    payload: { input_path, options }
  });
  return context.json(result);
});
var svg_default = app7;

// src/controllers/compress/tinypng.ts
var import_zod11 = __toESM(require_lib());
var app8 = new Hono2();
var OptionsSchema8 = import_zod11.z.object({
  limit_compress_rate: import_zod11.z.number().min(0).max(1).optional(),
  target_size_enable: import_zod11.z.boolean().optional().default(false),
  target_size_kb: import_zod11.z.number().min(1).optional(),
  target_size_tolerance: import_zod11.z.number().min(0).max(1).optional().default(0.1),
  save: import_zod11.z.object({
    mode: import_zod11.z.nativeEnum(SaveMode).optional().default("overwrite" /* Overwrite */),
    new_file_suffix: import_zod11.z.string().optional().default("_compressed"),
    new_folder_path: import_zod11.z.string().optional()
  }).optional().default({}),
  temp_dir: import_zod11.z.string().optional(),
  convert_enable: import_zod11.z.boolean().optional().default(false),
  convert_types: import_zod11.z.array(import_zod11.z.nativeEnum(ConvertFormat)).optional().default([]),
  convert_alpha: import_zod11.z.string().optional().default("#FFFFFF"),
  resize_enable: import_zod11.z.boolean().optional().default(false),
  resize_scale: import_zod11.z.number().optional().default(0),
  resize_dimensions: import_zod11.z.array(import_zod11.z.number()).optional().default([]),
  resize_fit: import_zod11.z.nativeEnum(ResizeFit).optional().default("cover" /* Cover */),
  watermark_type: import_zod11.z.nativeEnum(WatermarkType).optional().default("none" /* None */),
  watermark_position: import_zod11.z.nativeEnum(WatermarkPosition).optional().default("southeast" /* BottomRight */),
  watermark_text: import_zod11.z.string().optional().default(""),
  watermark_text_color: import_zod11.z.string().optional().default("#FFFFFF"),
  watermark_font_size: import_zod11.z.number().optional().default(16),
  watermark_image_path: import_zod11.z.string().optional().default(""),
  watermark_image_opacity: import_zod11.z.number().min(0).max(1).optional().default(1),
  watermark_image_scale: import_zod11.z.number().min(0).max(1).optional().default(0.15)
}).optional().default({});
var ProcessOptionsSchema6 = import_zod11.z.object({
  api_key: import_zod11.z.string(),
  mime_type: import_zod11.z.string(),
  preserveMetadata: import_zod11.z.array(import_zod11.z.string()).optional()
}).optional().default({
  api_key: "",
  mime_type: ""
});
var PayloadSchema7 = import_zod11.z.object({
  input_path: import_zod11.z.string(),
  options: OptionsSchema8,
  process_options: ProcessOptionsSchema6
});
app8.post("/", zValidator("json", PayloadSchema7, payloadValidator), async (context) => {
  let { input_path, options, process_options } = await context.req.json();
  await checkFile(input_path);
  options = OptionsSchema8.parse(options);
  process_options = ProcessOptionsSchema6.parse(process_options);
  const result = await getThreadPool().run({
    type: "tinypng",
    payload: { input_path, options, process_options }
  });
  return context.json(result);
});
var tinypng_default = app8;

// src/controllers/watermark.ts
var import_zod12 = __toESM(require_lib());
var import_sharp3 = __toESM(require("sharp"));
var import_node_path3 = __toESM(require("node:path"));

// src/services/watermark.ts
var import_sharp2 = __toESM(require("sharp"));
async function addTileWatermark(payload) {
  const {
    stream: stream2,
    contentType,
    text = "",
    color = "#FFFFFF",
    fontSize = 16,
    imagePath = "",
    opacity = 0.5,
    rotation = 0,
    tileGapX = 0,
    tileGapY = 0,
    container
  } = payload;
  const imgWidth = container.width || 800;
  const imgHeight = container.height || 600;
  let singleBuffer;
  if (contentType === "text") {
    singleBuffer = await (0, import_sharp2.default)({
      text: {
        text: `<span foreground="${color}" size="${pxToPangoSize(Number(fontSize))}">${text}</span>`,
        font: "sans",
        rgba: true
      }
    }).png().toBuffer();
  } else {
    const rawW = Math.max(1, Math.floor(imgWidth * 0.15));
    singleBuffer = await (0, import_sharp2.default)(imagePath).ensureAlpha(0).resize({ width: rawW, fit: "inside", withoutEnlargement: true }).composite([
      {
        input: Buffer.from([255, 255, 255, Math.floor(255 * opacity)]),
        raw: { width: 1, height: 1, channels: 4 },
        tile: true,
        blend: "dest-in"
      }
    ]).png({ force: true }).toBuffer();
  }
  if (rotation !== 0) {
    singleBuffer = await (0, import_sharp2.default)(singleBuffer).rotate(rotation, { background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
  }
  const singleMeta = await (0, import_sharp2.default)(singleBuffer).metadata();
  const unitW = (singleMeta.width || 100) + tileGapX;
  const unitH = (singleMeta.height || 30) + tileGapY;
  const cols = Math.ceil(imgWidth / unitW) + 1;
  const rows = Math.ceil(imgHeight / unitH) + 1;
  const composites = [];
  for (let r2 = 0; r2 < rows; r2++) {
    for (let c2 = 0; c2 < cols; c2++) {
      composites.push({
        input: singleBuffer,
        left: c2 * unitW,
        top: r2 * unitH,
        limitInputPixels: false
      });
    }
  }
  return stream2.composite(composites);
}
async function addTextWatermark(payload) {
  const { stream: stream2, text, color, fontSize, position, positionNorm, container } = payload;
  const watermarkImage = (0, import_sharp2.default)({
    text: {
      text: `<span foreground="${color}" size="${pxToPangoSize(Number(fontSize))}">${text}</span>`,
      font: "sans",
      rgba: true
    }
  });
  const watermarkBuffer = await watermarkImage.png().toBuffer();
  const watermarkMeta = await (0, import_sharp2.default)(watermarkBuffer).metadata();
  const shouldResize = (watermarkMeta.width || 0) > (container.width || 0) || (watermarkMeta.height || 0) > (container.height || 0);
  const watermarkInput = shouldResize ? await (0, import_sharp2.default)(watermarkBuffer).resize({
    width: container.width,
    height: container.height,
    fit: "inside",
    withoutEnlargement: true
  }).toBuffer() : watermarkBuffer;
  const cw = container.width || 0;
  const ch = container.height || 0;
  if (positionNorm && cw > 0 && ch > 0) {
    const placedMeta = await (0, import_sharp2.default)(watermarkInput).metadata();
    const wmW = placedMeta.width || 0;
    const wmH = placedMeta.height || 0;
    const anchorX = Math.round(positionNorm.x * cw);
    const anchorY = Math.round(positionNorm.y * ch);
    const left = Math.max(0, Math.min(Math.max(0, cw - wmW), anchorX - Math.floor(wmW / 2)));
    const top = Math.max(0, Math.min(Math.max(0, ch - wmH), anchorY - Math.floor(wmH / 2)));
    return stream2.composite([
      {
        input: watermarkInput,
        left,
        top,
        limitInputPixels: false,
        animated: true
      }
    ]);
  }
  return stream2.composite([
    {
      input: watermarkInput,
      gravity: position,
      limitInputPixels: false,
      animated: true
    }
  ]);
}
async function addImageWatermark(payload) {
  const { stream: stream2, imagePath, opacity = 0, scale, position, positionNorm, container } = payload;
  const watermarkWidth = Math.floor((container.width || 0) * scale);
  const watermarkBuffer = await (0, import_sharp2.default)(imagePath).ensureAlpha(0).resize({
    width: watermarkWidth,
    fit: "inside",
    withoutEnlargement: true
  }).composite([
    {
      input: Buffer.from([255, 255, 255, Math.floor(255 * opacity)]),
      raw: { width: 1, height: 1, channels: 4 },
      tile: true,
      blend: "dest-in"
    }
  ]).png({
    quality: 90,
    force: true
  }).toBuffer();
  const cw = container.width || 0;
  const ch = container.height || 0;
  if (positionNorm && cw > 0 && ch > 0) {
    const placedMeta = await (0, import_sharp2.default)(watermarkBuffer).metadata();
    const wmW = placedMeta.width || 0;
    const wmH = placedMeta.height || 0;
    const anchorX = Math.round(positionNorm.x * cw);
    const anchorY = Math.round(positionNorm.y * ch);
    const left = Math.max(0, Math.min(Math.max(0, cw - wmW), anchorX - Math.floor(wmW / 2)));
    const top = Math.max(0, Math.min(Math.max(0, ch - wmH), anchorY - Math.floor(wmH / 2)));
    return stream2.composite([
      {
        input: watermarkBuffer,
        left,
        top,
        limitInputPixels: false,
        animated: true
      }
    ]);
  }
  return stream2.composite([
    {
      input: watermarkBuffer,
      gravity: position,
      limitInputPixels: false,
      animated: true
    }
  ]);
}

// src/controllers/watermark.ts
var app9 = new Hono2();
var PayloadSchema8 = import_zod12.z.object({
  input_path: import_zod12.z.string(),
  options: import_zod12.z.object({
    watermark_type: import_zod12.z.nativeEnum(WatermarkType),
    watermark_position: import_zod12.z.nativeEnum(WatermarkPosition).optional().default("southeast" /* BottomRight */),
    watermark_text: import_zod12.z.string().optional().default(""),
    watermark_text_color: import_zod12.z.string().optional().default("#FFFFFF"),
    watermark_font_size: import_zod12.z.number().optional().default(16),
    watermark_image_path: import_zod12.z.string().optional().default(""),
    watermark_image_opacity: import_zod12.z.number().min(0).max(1).optional().default(1),
    watermark_image_scale: import_zod12.z.number().min(0).max(1).optional().default(0.15),
    /** 平铺水印：横向间距 (px) */
    tile_gap_x: import_zod12.z.number().int().min(0).optional().default(40),
    /** 平铺水印：纵向间距 (px) */
    tile_gap_y: import_zod12.z.number().int().min(0).optional().default(40),
    /** 平铺水印：旋转角度 (度) */
    tile_rotation: import_zod12.z.number().min(-360).max(360).optional().default(0),
    /** 锚点归一化坐标 0–1（相对原图），与拖拽预览一致 */
    position_norm_x: import_zod12.z.number().min(0).max(1).optional(),
    position_norm_y: import_zod12.z.number().min(0).max(1).optional()
  }).optional().default({}),
  save: import_zod12.z.object({
    mode: import_zod12.z.nativeEnum(SaveMode).optional().default("overwrite" /* Overwrite */),
    new_file_suffix: import_zod12.z.string().optional().default("_watermark"),
    new_folder_path: import_zod12.z.string().optional()
  }).optional().default({})
});
var FORMAT_EXT_MAP = {
  ".png": "png",
  ".jpg": "jpeg",
  ".jpeg": "jpeg",
  ".webp": "webp",
  ".avif": "avif",
  ".gif": "gif",
  ".tiff": "tiff",
  ".tif": "tiff"
};
function getFormatFromPath(inputPath) {
  const ext = import_node_path3.default.extname(inputPath).toLowerCase();
  return FORMAT_EXT_MAP[ext] || "png";
}
function getFormatOptions(format) {
  switch (format) {
    case "png":
      return { compressionLevel: 6 };
    case "jpeg":
    case "jpg":
      return { quality: 90 };
    case "webp":
      return { quality: 90 };
    case "avif":
      return { quality: 90 };
    case "gif":
      return { effort: 4 };
    case "tiff":
      return { compression: "lzw" };
    default:
      return { quality: 90 };
  }
}
app9.post("/", zValidator("json", PayloadSchema8, payloadValidator), async (context) => {
  const { input_path, options, save } = await context.req.json();
  await checkFile(input_path);
  if (options.watermark_type === "none" /* None */) {
    return context.json({
      success: false,
      input_path,
      error_msg: "Watermark type must be text, image or tile"
    });
  }
  if ((options.watermark_type === "text" /* Text */ || options.watermark_type === "tile" /* Tile */) && options.watermark_text?.trim() === "" && options.watermark_image_path?.trim() === "") {
    if (options.watermark_type === "text" /* Text */) {
      return context.json({
        success: false,
        input_path,
        error_msg: "Text watermark requires watermark_text"
      });
    }
  }
  if (options.watermark_type === "image" /* Image */ && (!options.watermark_image_path || options.watermark_image_path.trim() === "")) {
    return context.json({
      success: false,
      input_path,
      error_msg: "Image watermark requires watermark_image_path"
    });
  }
  try {
    const outputPath = await createOutputPath(input_path, {
      mode: save.mode,
      new_file_suffix: save.new_file_suffix,
      new_folder_path: save.new_folder_path
    });
    const originalSize = await getFileSize(input_path);
    const format = getFormatFromPath(input_path);
    const formatOptions = getFormatOptions(format);
    let stream2 = (0, import_sharp3.default)(input_path, { limitInputPixels: false });
    const metadata = await stream2.metadata();
    const dimensions = {
      width: metadata.width || 0,
      height: metadata.height || 0
    };
    const gravityForSharp = options.watermark_position === "custom" /* Custom */ ? "southeast" : options.watermark_position;
    const positionNorm = typeof options.position_norm_x === "number" && typeof options.position_norm_y === "number" ? { x: options.position_norm_x, y: options.position_norm_y } : void 0;
    if (options.watermark_type === "text" /* Text */) {
      stream2 = await addTextWatermark({
        stream: stream2,
        text: options.watermark_text,
        color: options.watermark_text_color,
        fontSize: options.watermark_font_size,
        position: gravityForSharp,
        positionNorm,
        container: dimensions
      });
    } else if (options.watermark_type === "image" /* Image */) {
      stream2 = await addImageWatermark({
        stream: stream2,
        imagePath: options.watermark_image_path,
        opacity: options.watermark_image_opacity,
        scale: options.watermark_image_scale,
        position: gravityForSharp,
        positionNorm,
        container: dimensions
      });
    } else if (options.watermark_type === "tile" /* Tile */) {
      const contentType = options.watermark_image_path?.trim() ? "image" : "text";
      stream2 = await addTileWatermark({
        stream: stream2,
        contentType,
        text: options.watermark_text,
        color: options.watermark_text_color,
        fontSize: options.watermark_font_size,
        imagePath: options.watermark_image_path,
        opacity: options.watermark_image_opacity,
        rotation: options.tile_rotation,
        tileGapX: options.tile_gap_x,
        tileGapY: options.tile_gap_y,
        container: dimensions
      });
    }
    await stream2.toFormat(format, formatOptions).toFile(outputPath);
    const outputSize = await getFileSize(outputPath);
    return context.json({
      success: true,
      input_path,
      input_size: originalSize,
      output_path: outputPath,
      output_size: outputSize
    });
  } catch (error) {
    return context.json({
      success: false,
      input_path,
      error_msg: error?.message || error?.toString() || "Unknown error"
    });
  }
});
var watermark_default = app9;

// src/controllers/resize.ts
var import_zod13 = __toESM(require_lib());
var import_sharp4 = __toESM(require("sharp"));
var import_node_path4 = __toESM(require("node:path"));
var app10 = new Hono2();
var PayloadSchema9 = import_zod13.z.object({
  input_path: import_zod13.z.string(),
  options: import_zod13.z.object({
    resize_dimensions: import_zod13.z.tuple([import_zod13.z.number(), import_zod13.z.number()]).or(import_zod13.z.array(import_zod13.z.number()).length(2)),
    resize_fit: import_zod13.z.nativeEnum(ResizeFit).optional().default("inside" /* Inside */)
  }).optional().default({}),
  save: import_zod13.z.object({
    mode: import_zod13.z.nativeEnum(SaveMode).optional().default("overwrite" /* Overwrite */),
    new_file_suffix: import_zod13.z.string().optional().default("_resized"),
    new_folder_path: import_zod13.z.string().optional()
  }).optional().default({})
});
var FORMAT_EXT_MAP2 = {
  ".png": "png",
  ".jpg": "jpeg",
  ".jpeg": "jpeg",
  ".webp": "webp",
  ".avif": "avif",
  ".gif": "gif",
  ".tiff": "tiff",
  ".tif": "tiff"
};
function getFormatFromPath2(inputPath) {
  const ext = import_node_path4.default.extname(inputPath).toLowerCase();
  return FORMAT_EXT_MAP2[ext] || "png";
}
function getFormatOptions2(format) {
  switch (format) {
    case "png":
      return { compressionLevel: 6 };
    case "jpeg":
    case "jpg":
      return { quality: 90 };
    case "webp":
      return { quality: 90 };
    case "avif":
      return { quality: 90 };
    case "gif":
      return { effort: 4 };
    case "tiff":
      return { compression: "lzw" };
    default:
      return { quality: 90 };
  }
}
app10.post("/", zValidator("json", PayloadSchema9, payloadValidator), async (context) => {
  const { input_path, options, save } = await context.req.json();
  await checkFile(input_path);
  const MAX_DIMENSION = 32767;
  const dims = options.resize_dimensions || [0, 0];
  const width = Math.max(0, Math.min(MAX_DIMENSION, dims[0] || 0));
  const height = Math.max(0, Math.min(MAX_DIMENSION, dims[1] || 0));
  if (width <= 0 && height <= 0) {
    return context.json({
      success: false,
      input_path,
      error_msg: "At least one of width or height must be greater than 0"
    });
  }
  try {
    const outputPath = await createOutputPath(input_path, {
      mode: save.mode,
      new_file_suffix: save.new_file_suffix,
      new_folder_path: save.new_folder_path
    });
    const originalSize = await getFileSize(input_path);
    const format = getFormatFromPath2(input_path);
    const formatOptions = getFormatOptions2(format);
    const resizeOptions = {};
    if (width > 0) resizeOptions.width = width;
    if (height > 0) resizeOptions.height = height;
    resizeOptions.fit = options.resize_fit || "inside" /* Inside */;
    let stream2 = (0, import_sharp4.default)(input_path, { limitInputPixels: false });
    stream2 = stream2.resize(resizeOptions);
    await stream2.toFormat(format, formatOptions).toFile(outputPath);
    const outputSize = await getFileSize(outputPath);
    return context.json({
      success: true,
      input_path,
      input_size: originalSize,
      output_path: outputPath,
      output_size: outputSize
    });
  } catch (error) {
    return context.json({
      success: false,
      input_path,
      error_msg: error?.message || error?.toString() || "Unknown error"
    });
  }
});
var resize_default = app10;

// src/controllers/convert.ts
var import_zod14 = __toESM(require_lib());
var import_sharp5 = __toESM(require("sharp"));
var import_node_path5 = __toESM(require("node:path"));

// src/services/convert.ts
async function convert(stream2, outputPath, format, alpha) {
  try {
    let result = null;
    switch (format) {
      case "png" /* PNG */:
        result = await stream2.png().toFile(outputPath);
        break;
      case "jpg" /* JPG */:
        result = await stream2.flatten({ background: alpha }).jpeg().toFile(outputPath);
        break;
      case "webp" /* WEBP */:
        result = await stream2.webp().toFile(outputPath);
        break;
      case "avif" /* AVIF */:
        result = await stream2.avif().toFile(outputPath);
        break;
      case "gif" /* GIF */:
        result = await stream2.gif().toFile(outputPath);
        break;
      default:
        throw new Error(`Unsupported convert format: ${format}`);
    }
    return {
      success: true,
      output_path: outputPath,
      format,
      info: result
    };
  } catch (error) {
    captureError(error);
    return {
      success: false,
      output_path: outputPath,
      format,
      error_msg: error instanceof Error ? error.message : error.toString()
    };
  }
}

// src/controllers/convert.ts
var app11 = new Hono2();
async function createConvertOutputPath(inputPath, targetFormat, options) {
  const ext = `.${targetFormat}`;
  const baseName = import_node_path5.default.basename(inputPath, import_node_path5.default.extname(inputPath));
  switch (options.mode) {
    case "overwrite":
      return import_node_path5.default.join(import_node_path5.default.dirname(inputPath), `${baseName}${ext}`);
    case "save_as_new_file": {
      const suffix = options.new_file_suffix || "_converted";
      return import_node_path5.default.join(import_node_path5.default.dirname(inputPath), `${baseName}${suffix}${ext}`);
    }
    case "save_to_new_folder": {
      if (!await isDirectory(options.new_folder_path || "")) {
        throw new Error(`Directory '${options.new_folder_path}' does not exist`);
      }
      return import_node_path5.default.join(options.new_folder_path, `${baseName}${ext}`);
    }
    default:
      return import_node_path5.default.join(import_node_path5.default.dirname(inputPath), `${baseName}${ext}`);
  }
}
var PayloadSchema10 = import_zod14.z.object({
  input_path: import_zod14.z.string(),
  options: import_zod14.z.object({
    target_format: import_zod14.z.nativeEnum(ConvertFormat),
    convert_alpha: import_zod14.z.string().optional().default("#FFFFFF")
  }).optional().default({}),
  save: import_zod14.z.object({
    mode: import_zod14.z.nativeEnum(SaveMode).optional().default("overwrite" /* Overwrite */),
    new_file_suffix: import_zod14.z.string().optional().default("_converted"),
    new_folder_path: import_zod14.z.string().optional()
  }).optional().default({})
});
app11.post("/", zValidator("json", PayloadSchema10, payloadValidator), async (context) => {
  const { input_path, options, save } = await context.req.json();
  await checkFile(input_path);
  const alpha = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(options.convert_alpha?.trim() || "") ? options.convert_alpha.trim() : "#FFFFFF";
  try {
    const outputPath = await createConvertOutputPath(input_path, options.target_format, {
      mode: save.mode,
      new_file_suffix: save.new_file_suffix,
      new_folder_path: save.new_folder_path
    });
    const originalSize = await getFileSize(input_path);
    const stream2 = (0, import_sharp5.default)(input_path, { limitInputPixels: false });
    const result = await convert(stream2, outputPath, options.target_format, alpha);
    if (!result.success) {
      return context.json({
        success: false,
        input_path,
        error_msg: result.error_msg || "Conversion failed"
      });
    }
    const outputSize = await getFileSize(outputPath);
    return context.json({
      success: true,
      input_path,
      input_size: originalSize,
      output_path: outputPath,
      output_size: outputSize
    });
  } catch (error) {
    return context.json({
      success: false,
      input_path,
      error_msg: error?.message || error?.toString() || "Unknown error"
    });
  }
});
var convert_default = app11;

// ../../node_modules/.pnpm/hono@4.7.8/node_modules/hono/dist/utils/stream.js
var StreamingApi = class {
  writer;
  encoder;
  writable;
  abortSubscribers = [];
  responseReadable;
  aborted = false;
  closed = false;
  constructor(writable, _readable) {
    this.writable = writable;
    this.writer = writable.getWriter();
    this.encoder = new TextEncoder();
    const reader = _readable.getReader();
    this.abortSubscribers.push(async () => {
      await reader.cancel();
    });
    this.responseReadable = new ReadableStream({
      async pull(controller) {
        const { done, value } = await reader.read();
        done ? controller.close() : controller.enqueue(value);
      },
      cancel: () => {
        this.abort();
      }
    });
  }
  async write(input) {
    try {
      if (typeof input === "string") {
        input = this.encoder.encode(input);
      }
      await this.writer.write(input);
    } catch {
    }
    return this;
  }
  async writeln(input) {
    await this.write(input + "\n");
    return this;
  }
  sleep(ms) {
    return new Promise((res) => setTimeout(res, ms));
  }
  async close() {
    try {
      await this.writer.close();
    } catch {
    }
    this.closed = true;
  }
  async pipe(body) {
    this.writer.releaseLock();
    await body.pipeTo(this.writable, { preventClose: true });
    this.writer = this.writable.getWriter();
  }
  onAbort(listener) {
    this.abortSubscribers.push(listener);
  }
  abort() {
    if (!this.aborted) {
      this.aborted = true;
      this.abortSubscribers.forEach((subscriber) => subscriber());
    }
  }
};

// ../../node_modules/.pnpm/hono@4.7.8/node_modules/hono/dist/helper/streaming/utils.js
var isOldBunVersion = () => {
  const version = typeof Bun !== "undefined" ? Bun.version : void 0;
  if (version === void 0) {
    return false;
  }
  const result = version.startsWith("1.1") || version.startsWith("1.0") || version.startsWith("0.");
  isOldBunVersion = () => result;
  return result;
};

// ../../node_modules/.pnpm/hono@4.7.8/node_modules/hono/dist/helper/streaming/sse.js
var SSEStreamingApi = class extends StreamingApi {
  constructor(writable, readable) {
    super(writable, readable);
  }
  async writeSSE(message) {
    const data = await resolveCallback(message.data, HtmlEscapedCallbackPhase.Stringify, false, {});
    const dataLines = data.split("\n").map((line) => {
      return `data: ${line}`;
    }).join("\n");
    const sseData = [
      message.event && `event: ${message.event}`,
      dataLines,
      message.id && `id: ${message.id}`,
      message.retry && `retry: ${message.retry}`
    ].filter(Boolean).join("\n") + "\n\n";
    await this.write(sseData);
  }
};
var run = async (stream2, cb, onError) => {
  try {
    await cb(stream2);
  } catch (e2) {
    if (e2 instanceof Error && onError) {
      await onError(e2, stream2);
      await stream2.writeSSE({
        event: "error",
        data: e2.message
      });
    } else {
      console.error(e2);
    }
  } finally {
    stream2.close();
  }
};
var contextStash = /* @__PURE__ */ new WeakMap();
var streamSSE = (c2, cb, onError) => {
  const { readable, writable } = new TransformStream();
  const stream2 = new SSEStreamingApi(writable, readable);
  if (isOldBunVersion()) {
    c2.req.raw.signal.addEventListener("abort", () => {
      if (!stream2.closed) {
        stream2.abort();
      }
    });
  }
  contextStash.set(stream2.responseReadable, c2);
  c2.header("Transfer-Encoding", "chunked");
  c2.header("Content-Type", "text/event-stream");
  c2.header("Cache-Control", "no-cache");
  c2.header("Connection", "keep-alive");
  run(stream2, cb, onError);
  return c2.newResponse(stream2.responseReadable);
};

// src/controllers/watch/index.ts
var import_node_path7 = require("node:path");

// ../../node_modules/.pnpm/dirspy@1.0.3/node_modules/dirspy/dist/esm/index.js
var import_promises2 = require("node:fs/promises");
var import_node_path6 = require("node:path");
var import_node_crypto = require("node:crypto");
var import_node_fs = require("node:fs");
var import_node_stream = require("node:stream");
var import_node_events = require("node:events");
var import_util = __toESM(require("util"));
var import_path = __toESM(require("path"));
function v(t2, e2, n2, r2) {
  return new (n2 || (n2 = Promise))(function(i2, o2) {
    function s2(t3) {
      try {
        u2(r2.next(t3));
      } catch (t4) {
        o2(t4);
      }
    }
    function a2(t3) {
      try {
        u2(r2.throw(t3));
      } catch (t4) {
        o2(t4);
      }
    }
    function u2(t3) {
      var e3;
      t3.done ? i2(t3.value) : (e3 = t3.value, e3 instanceof n2 ? e3 : new n2(function(t4) {
        t4(e3);
      })).then(s2, a2);
    }
    u2((r2 = r2.apply(t2, e2 || [])).next());
  });
}
function E(n2) {
  return v(this, arguments, void 0, function* (n3, r2 = import_promises2.constants.F_OK) {
    try {
      return yield (0, import_promises2.access)(n3, r2), true;
    } catch (t2) {
      return false;
    }
  });
}
function C(t2) {
  return v(this, void 0, void 0, function* () {
    return E(t2);
  });
}
function m(t2) {
  return t2 && t2 !== import_node_path6.sep ? t2.replace(/[/\\]+$/, "") : t2;
}
var b = "files";
var S = "directories";
var x = "files_directories";
var H = "all";
var T = { root: ".", fileFilter: (t2) => true, directoryFilter: (t2) => true, type: b, lstat: false, depth: 2147483648, alwaysStat: false, highWaterMark: 4096 };
Object.freeze(T);
var $ = "READDIRP_RECURSIVE_ERROR";
var O = /* @__PURE__ */ new Set(["ENOENT", "EPERM", "EACCES", "ELOOP", $]);
var w = [S, H, x, b];
var L = /* @__PURE__ */ new Set([S, H, x]);
var k = /* @__PURE__ */ new Set([H, x, b]);
var N = "win32" === process.platform;
var D = (t2) => true;
var M = (t2) => {
  if (void 0 === t2) return D;
  if ("function" == typeof t2) return t2;
  if ("string" == typeof t2) {
    const e2 = t2.trim();
    return (t3) => t3.basename === e2;
  }
  if (Array.isArray(t2)) {
    const e2 = t2.map((t3) => t3.trim());
    return (t3) => e2.some((e3) => t3.basename === e3);
  }
  return D;
};
var P = class extends import_node_stream.Readable {
  constructor(t2 = {}) {
    super({ objectMode: true, autoDestroy: true, highWaterMark: t2.highWaterMark });
    const e2 = { ...T, ...t2 }, { root: i2, type: o2 } = e2;
    this._fileFilter = M(e2.fileFilter), this._directoryFilter = M(e2.directoryFilter);
    const s2 = e2.lstat ? import_promises2.lstat : import_promises2.stat;
    this._stat = N ? (t3) => s2(t3, { bigint: true }) : s2, this._maxDepth = e2.depth ?? T.depth, this._wantsDir = !!o2 && L.has(o2), this._wantsFile = !!o2 && k.has(o2), this._wantsEverything = o2 === H, this._root = (0, import_node_path6.resolve)(i2), this._isDirent = !e2.alwaysStat, this._statsProp = this._isDirent ? "dirent" : "stats", this._rdOptions = { encoding: "utf8", withFileTypes: this._isDirent }, this.parents = [this._exploreDir(i2, 1)], this.reading = false, this.parent = void 0;
  }
  async _read(t2) {
    if (!this.reading) {
      this.reading = true;
      try {
        for (; !this.destroyed && t2 > 0; ) {
          const e2 = this.parent, n2 = e2 && e2.files;
          if (n2 && n2.length > 0) {
            const { path: r2, depth: i2 } = e2, o2 = n2.splice(0, t2).map((t3) => this._formatEntry(t3, r2)), s2 = await Promise.all(o2);
            for (const e3 of s2) {
              if (!e3) continue;
              if (this.destroyed) return;
              const n3 = await this._getEntryType(e3);
              "directory" === n3 && this._directoryFilter(e3) ? (i2 <= this._maxDepth && this.parents.push(this._exploreDir(e3.fullPath, i2 + 1)), this._wantsDir && (this.push(e3), t2--)) : ("file" === n3 || this._includeAsFile(e3)) && this._fileFilter(e3) && this._wantsFile && (this.push(e3), t2--);
            }
          } else {
            const t3 = this.parents.pop();
            if (!t3) {
              this.push(null);
              break;
            }
            if (this.parent = await t3, this.destroyed) return;
          }
        }
      } catch (t3) {
        this.destroy(t3);
      } finally {
        this.reading = false;
      }
    }
  }
  async _exploreDir(t2, e2) {
    let n2;
    try {
      n2 = await (0, import_promises2.readdir)(t2, this._rdOptions);
    } catch (t3) {
      this._onError(t3);
    }
    return { files: n2, depth: e2, path: t2 };
  }
  async _formatEntry(t2, e2) {
    let n2;
    const r2 = this._isDirent ? t2.name : t2;
    try {
      const i2 = (0, import_node_path6.resolve)((0, import_node_path6.join)(e2, r2));
      n2 = { path: (0, import_node_path6.relative)(this._root, i2), fullPath: i2, basename: r2 }, n2[this._statsProp] = this._isDirent ? t2 : await this._stat(i2);
    } catch (t3) {
      return void this._onError(t3);
    }
    return n2;
  }
  _onError(t2) {
    var e2;
    e2 = t2, O.has(e2.code) && !this.destroyed ? this.emit("warn", t2) : this.destroy(t2);
  }
  async _getEntryType(t2) {
    if (!t2 && this._statsProp in t2) return "";
    const e2 = t2[this._statsProp];
    if (e2.isFile()) return "file";
    if (e2.isDirectory()) return "directory";
    if (e2 && e2.isSymbolicLink()) {
      const e3 = t2.fullPath;
      try {
        const t3 = await (0, import_promises2.realpath)(e3), r2 = await (0, import_promises2.lstat)(t3);
        if (r2.isFile()) return "file";
        if (r2.isDirectory()) {
          const n2 = t3.length;
          if (e3.startsWith(t3) && e3.substr(n2, 1) === import_node_path6.sep) {
            const n3 = new Error(`Circular symlink detected: "${e3}" points to "${t3}"`);
            return n3.code = $, this._onError(n3);
          }
          return "directory";
        }
      } catch (t3) {
        return this._onError(t3), "";
      }
    }
  }
  _includeAsFile(t2) {
    const e2 = t2 && t2[this._statsProp];
    return e2 && this._wantsEverything && !e2.isDirectory();
  }
};
var I;
var F;
!(function(t2) {
  t2.FILE = "file", t2.DIRECTORY = "directory";
})(I || (I = {})), (function(t2) {
  t2.READY = "READY", t2.WALK_WARN = "WALK_WARN", t2.SELF_ENOENT = "SELF_ENOENT", t2.RAW = "RAW", t2.ERROR = "ERROR", t2.CLOSE = "CLOSE", t2.ADD = "ADD", t2.REMOVE = "REMOVE", t2.CHANGE = "CHANGE", t2.RENAME = "RENAME", t2.MOVE = "MOVE";
})(F || (F = {}));
var B = class {
  constructor(t2) {
    this.name = t2.name, this.key = t2.key, this.fullPath = t2.fullPath, this.node_type = t2.node_type, this.parent = t2.parent, this.children = t2.children, this.content_hash = t2.content_hash;
  }
  get isFile() {
    return this.node_type === I.FILE;
  }
  get isDirectory() {
    return this.node_type === I.DIRECTORY;
  }
};
var G = class {
  constructor(t2, e2, n2) {
    this._nodeMap = /* @__PURE__ */ new Map(), this._createNode = (t3, e3, n3, r3, i2) => {
      const o2 = t3.replace(this.root.fullPath, "").split(import_node_path6.sep).filter(Boolean);
      let a2 = this.root;
      for (let t4 = 0; t4 < o2.length; t4++) {
        const u2 = t4 === o2.length - 1;
        let l2 = e3 === I.DIRECTORY || !u2;
        if (!a2.children) break;
        {
          const u3 = [this.root.fullPath, ...o2.slice(0, t4 + 1)].join(import_node_path6.sep);
          if (!a2.children.has(u3)) {
            const s2 = new B({ name: o2[t4], fullPath: u3, parent: a2, node_type: e3, key: n3 });
            l2 ? s2.children = /* @__PURE__ */ new Map() : (s2.data = i2, s2.content_hash = r3), a2.children.set(u3, s2);
          }
          a2 = a2.children.get(u3);
        }
      }
      return a2;
    }, this.add = (t3, e3, n3, r3, i2) => {
      if (!(t3 = m(t3)).startsWith(this.root.fullPath) || this._nodeMap.has(t3)) return;
      const o2 = this._createNode(t3, e3, n3, r3, i2);
      return this._nodeMap.set(t3, o2), o2;
    }, this.delete = (t3) => {
      if (t3 = m(t3), !this._nodeMap.has(t3)) return;
      const e3 = this._nodeMap.get(t3);
      if (e3.parent && e3.parent.children.delete(e3.fullPath), e3.isDirectory) for (const e4 of this._nodeMap.keys()) e4.startsWith(t3) && this._nodeMap.delete(e4);
      return this._nodeMap.delete(t3), e3;
    }, this.update = (t3, e3) => {
      if (t3 = m(t3), !this._nodeMap.has(t3)) return;
      const n3 = this._nodeMap.get(t3);
      return e3.key && (n3.key = e3.key), e3.data && (n3.data = e3.data), e3.content_hash && (n3.content_hash = e3.content_hash), n3;
    }, this.has = (t3, e3 = "all") => {
      if (t3 = m(t3), !this._nodeMap.has(t3)) return;
      const n3 = this._nodeMap.get(t3);
      return "all" === e3 || (e3 === I.FILE ? n3.isFile : n3.isDirectory);
    }, this.getNode = (t3) => (t3 = m(t3), this._nodeMap.get(t3));
    const r2 = new B({ name: e2, key: n2, fullPath: m(t2), node_type: I.DIRECTORY, parent: null, children: /* @__PURE__ */ new Map() });
    this.root = r2, this._nodeMap.set(r2.fullPath, r2);
  }
  getPaths(t2) {
    const e2 = [];
    if (!this.root.children) return e2;
    const n2 = [];
    for (const t3 of this.root.children.values()) n2.push(t3);
    for (; n2.length > 0; ) {
      const r2 = n2.shift();
      if (("all" === t2 || t2 === I.FILE && r2.isFile || t2 === I.DIRECTORY && r2.isDirectory) && e2.push(r2.fullPath), r2.children) for (const t3 of r2.children.values()) n2.push(t3);
    }
    return e2;
  }
  stats() {
    let t2 = 0, e2 = 0, n2 = 0;
    if (!this.root.children) return { fileCount: e2, directoryCount: t2, maxDepth: n2 };
    const r2 = [];
    for (const t3 of this.root.children.values()) r2.push([t3, 0]);
    for (; r2.length > 0; ) {
      const [i2, o2] = r2.shift();
      if (n2 = Math.max(n2, o2), i2.isFile) e2++;
      else if (t2++, i2.children) for (const t3 of i2.children.values()) r2.push([t3, o2 + 1]);
    }
    return { fileCount: e2, directoryCount: t2, maxDepth: n2 };
  }
  destroy() {
    var t2;
    this._nodeMap.clear(), null === (t2 = this.root.children) || void 0 === t2 || t2.clear(), this.root = null;
  }
};
var U;
var K;
var W = "undefined" != typeof globalThis ? globalThis : "undefined" != typeof window ? window : "undefined" != typeof global ? global : "undefined" != typeof self ? self : {};
function Q(t2) {
  return t2 && t2.__esModule && Object.prototype.hasOwnProperty.call(t2, "default") ? t2.default : t2;
}
var j;
var X;
var Y;
var Z;
var V;
var q;
var z14;
var J;
var tt;
var et;
var nt;
var rt;
var it;
var ot;
var st;
var at;
var ut;
var lt;
var ct;
var pt = Q((function() {
  if (K) return U;
  K = 1;
  var t2 = /^\s+|\s+$/g, e2 = /^[-+]0x[0-9a-f]+$/i, n2 = /^0b[01]+$/i, r2 = /^0o[0-7]+$/i, i2 = parseInt, o2 = "object" == typeof W && W && W.Object === Object && W, s2 = "object" == typeof self && self && self.Object === Object && self, a2 = o2 || s2 || Function("return this")(), u2 = Object.prototype.toString, l2 = Math.max, c2 = Math.min, p2 = function() {
    return a2.Date.now();
  };
  function h2(t3) {
    var e3 = typeof t3;
    return !!t3 && ("object" == e3 || "function" == e3);
  }
  function f2(o3) {
    if ("number" == typeof o3) return o3;
    if ((function(t3) {
      return "symbol" == typeof t3 || /* @__PURE__ */ (function(t4) {
        return !!t4 && "object" == typeof t4;
      })(t3) && "[object Symbol]" == u2.call(t3);
    })(o3)) return NaN;
    if (h2(o3)) {
      var s3 = "function" == typeof o3.valueOf ? o3.valueOf() : o3;
      o3 = h2(s3) ? s3 + "" : s3;
    }
    if ("string" != typeof o3) return 0 === o3 ? o3 : +o3;
    o3 = o3.replace(t2, "");
    var a3 = n2.test(o3);
    return a3 || r2.test(o3) ? i2(o3.slice(2), a3 ? 2 : 8) : e2.test(o3) ? NaN : +o3;
  }
  return U = function(t3, e3, n3) {
    var r3, i3, o3, s3, a3, u3, d2 = 0, _2 = false, y2 = false, g2 = true;
    if ("function" != typeof t3) throw new TypeError("Expected a function");
    function A2(e4) {
      var n4 = r3, o4 = i3;
      return r3 = i3 = void 0, d2 = e4, s3 = t3.apply(o4, n4);
    }
    function R2(t4) {
      var n4 = t4 - u3;
      return void 0 === u3 || n4 >= e3 || n4 < 0 || y2 && t4 - d2 >= o3;
    }
    function v2() {
      var t4 = p2();
      if (R2(t4)) return E2(t4);
      a3 = setTimeout(v2, (function(t5) {
        var n4 = e3 - (t5 - u3);
        return y2 ? c2(n4, o3 - (t5 - d2)) : n4;
      })(t4));
    }
    function E2(t4) {
      return a3 = void 0, g2 && r3 ? A2(t4) : (r3 = i3 = void 0, s3);
    }
    function C2() {
      var t4 = p2(), n4 = R2(t4);
      if (r3 = arguments, i3 = this, u3 = t4, n4) {
        if (void 0 === a3) return (function(t5) {
          return d2 = t5, a3 = setTimeout(v2, e3), _2 ? A2(t5) : s3;
        })(u3);
        if (y2) return a3 = setTimeout(v2, e3), A2(u3);
      }
      return void 0 === a3 && (a3 = setTimeout(v2, e3)), s3;
    }
    return e3 = f2(e3) || 0, h2(n3) && (_2 = !!n3.leading, o3 = (y2 = "maxWait" in n3) ? l2(f2(n3.maxWait) || 0, e3) : o3, g2 = "trailing" in n3 ? !!n3.trailing : g2), C2.cancel = function() {
      void 0 !== a3 && clearTimeout(a3), d2 = 0, r3 = u3 = i3 = a3 = void 0;
    }, C2.flush = function() {
      return void 0 === a3 ? s3 : E2(p2());
    }, C2;
  };
})());
var ht = {};
function ft() {
  return j || (j = 1, (t2 = ht).isInteger = (t3) => "number" == typeof t3 ? Number.isInteger(t3) : "string" == typeof t3 && "" !== t3.trim() && Number.isInteger(Number(t3)), t2.find = (t3, e2) => t3.nodes.find((t4) => t4.type === e2), t2.exceedsLimit = (e2, n2, r2 = 1, i2) => false !== i2 && !(!t2.isInteger(e2) || !t2.isInteger(n2)) && (Number(n2) - Number(e2)) / Number(r2) >= i2, t2.escapeNode = (t3, e2 = 0, n2) => {
    const r2 = t3.nodes[e2];
    r2 && (n2 && r2.type === n2 || "open" === r2.type || "close" === r2.type) && true !== r2.escaped && (r2.value = "\\" + r2.value, r2.escaped = true);
  }, t2.encloseBrace = (t3) => !("brace" !== t3.type || t3.commas >> 0 + t3.ranges | 0 || (t3.invalid = true, 0)), t2.isInvalidBrace = (t3) => !("brace" !== t3.type || true !== t3.invalid && !t3.dollar && (t3.commas >> 0 + t3.ranges | 0 && true === t3.open && true === t3.close || (t3.invalid = true, 0))), t2.isOpenOrClose = (t3) => "open" === t3.type || "close" === t3.type || true === t3.open || true === t3.close, t2.reduce = (t3) => t3.reduce((t4, e2) => ("text" === e2.type && t4.push(e2.value), "range" === e2.type && (e2.type = "text"), t4), []), t2.flatten = (...t3) => {
    const e2 = [], n2 = (t4) => {
      for (let r2 = 0; r2 < t4.length; r2++) {
        const i2 = t4[r2];
        Array.isArray(i2) ? n2(i2) : void 0 !== i2 && e2.push(i2);
      }
      return e2;
    };
    return n2(t3), e2;
  }), ht;
  var t2;
}
function dt() {
  if (Y) return X;
  Y = 1;
  const t2 = ft();
  return X = (e2, n2 = {}) => {
    const r2 = (e3, i2 = {}) => {
      const o2 = n2.escapeInvalid && t2.isInvalidBrace(i2), s2 = true === e3.invalid && true === n2.escapeInvalid;
      let a2 = "";
      if (e3.value) return (o2 || s2) && t2.isOpenOrClose(e3) ? "\\" + e3.value : e3.value;
      if (e3.value) return e3.value;
      if (e3.nodes) for (const t3 of e3.nodes) a2 += r2(t3);
      return a2;
    };
    return r2(e2);
  };
}
function _t() {
  return V ? Z : (V = 1, Z = function(t2) {
    return "number" == typeof t2 ? t2 - t2 === 0 : "string" == typeof t2 && "" !== t2.trim() && (Number.isFinite ? Number.isFinite(+t2) : isFinite(+t2));
  });
}
function yt() {
  if (z14) return q;
  z14 = 1;
  const t2 = _t(), e2 = (n3, o3, s3) => {
    if (false === t2(n3)) throw new TypeError("toRegexRange: expected the first argument to be a number");
    if (void 0 === o3 || n3 === o3) return String(n3);
    if (false === t2(o3)) throw new TypeError("toRegexRange: expected the second argument to be a number.");
    let a3 = { relaxZeros: true, ...s3 };
    "boolean" == typeof a3.strictZeros && (a3.relaxZeros = false === a3.strictZeros);
    let u3 = n3 + ":" + o3 + "=" + String(a3.relaxZeros) + String(a3.shorthand) + String(a3.capture) + String(a3.wrap);
    if (e2.cache.hasOwnProperty(u3)) return e2.cache[u3].result;
    let l3 = Math.min(n3, o3), c3 = Math.max(n3, o3);
    if (1 === Math.abs(l3 - c3)) {
      let t3 = n3 + "|" + o3;
      return a3.capture ? `(${t3})` : false === a3.wrap ? t3 : `(?:${t3})`;
    }
    let h3 = p2(n3) || p2(o3), f2 = { min: n3, max: o3, a: l3, b: c3 }, d2 = [], _2 = [];
    if (h3 && (f2.isPadded = h3, f2.maxLen = String(f2.max).length), l3 < 0) {
      _2 = r2(c3 < 0 ? Math.abs(c3) : 1, Math.abs(l3), f2, a3), l3 = f2.a = 0;
    }
    return c3 >= 0 && (d2 = r2(l3, c3, f2, a3)), f2.negatives = _2, f2.positives = d2, f2.result = (function(t3, e3) {
      let n4 = i2(t3, e3, "-", false) || [], r3 = i2(e3, t3, "", false) || [], o4 = i2(t3, e3, "-?", true) || [];
      return n4.concat(o4).concat(r3).join("|");
    })(_2, d2), true === a3.capture ? f2.result = `(${f2.result})` : false !== a3.wrap && d2.length + _2.length > 1 && (f2.result = `(?:${f2.result})`), e2.cache[u3] = f2, f2.result;
  };
  function n2(t3, e3, n3) {
    if (t3 === e3) return { pattern: t3, count: [], digits: 0 };
    let r3 = (function(t4, e4) {
      let n4 = [];
      for (let r4 = 0; r4 < t4.length; r4++) n4.push([t4[r4], e4[r4]]);
      return n4;
    })(t3, e3), i3 = r3.length, o3 = "", s3 = 0;
    for (let t4 = 0; t4 < i3; t4++) {
      let [e4, n4] = r3[t4];
      e4 === n4 ? o3 += e4 : "0" !== e4 || "9" !== n4 ? o3 += c2(e4, n4) : s3++;
    }
    return s3 && (o3 += true === n3.shorthand ? "\\d" : "[0-9]"), { pattern: o3, count: [s3], digits: i3 };
  }
  function r2(t3, e3, r3, i3) {
    let s3, c3 = (function(t4, e4) {
      let n3 = 1, r4 = 1, i4 = a2(t4, n3), s4 = /* @__PURE__ */ new Set([e4]);
      for (; t4 <= i4 && i4 <= e4; ) s4.add(i4), n3 += 1, i4 = a2(t4, n3);
      for (i4 = u2(e4 + 1, r4) - 1; t4 < i4 && i4 <= e4; ) s4.add(i4), r4 += 1, i4 = u2(e4 + 1, r4) - 1;
      return s4 = [...s4], s4.sort(o2), s4;
    })(t3, e3), p3 = [], f2 = t3;
    for (let t4 = 0; t4 < c3.length; t4++) {
      let e4 = c3[t4], o3 = n2(String(f2), String(e4), i3), a3 = "";
      r3.isPadded || !s3 || s3.pattern !== o3.pattern ? (r3.isPadded && (a3 = h2(e4, r3, i3)), o3.string = a3 + o3.pattern + l2(o3.count), p3.push(o3), f2 = e4 + 1, s3 = o3) : (s3.count.length > 1 && s3.count.pop(), s3.count.push(o3.count[0]), s3.string = s3.pattern + l2(s3.count), f2 = e4 + 1);
    }
    return p3;
  }
  function i2(t3, e3, n3, r3, i3) {
    let o3 = [];
    for (let i4 of t3) {
      let { string: t4 } = i4;
      r3 || s2(e3, "string", t4) || o3.push(n3 + t4), r3 && s2(e3, "string", t4) && o3.push(n3 + t4);
    }
    return o3;
  }
  function o2(t3, e3) {
    return t3 > e3 ? 1 : e3 > t3 ? -1 : 0;
  }
  function s2(t3, e3, n3) {
    return t3.some((t4) => t4[e3] === n3);
  }
  function a2(t3, e3) {
    return Number(String(t3).slice(0, -e3) + "9".repeat(e3));
  }
  function u2(t3, e3) {
    return t3 - t3 % Math.pow(10, e3);
  }
  function l2(t3) {
    let [e3 = 0, n3 = ""] = t3;
    return n3 || e3 > 1 ? `{${e3 + (n3 ? "," + n3 : "")}}` : "";
  }
  function c2(t3, e3, n3) {
    return `[${t3}${e3 - t3 === 1 ? "" : "-"}${e3}]`;
  }
  function p2(t3) {
    return /^-?(0+)\d/.test(t3);
  }
  function h2(t3, e3, n3) {
    if (!e3.isPadded) return t3;
    let r3 = Math.abs(e3.maxLen - String(t3).length), i3 = false !== n3.relaxZeros;
    switch (r3) {
      case 0:
        return "";
      case 1:
        return i3 ? "0?" : "0";
      case 2:
        return i3 ? "0{0,2}" : "00";
      default:
        return i3 ? `0{0,${r3}}` : `0{${r3}}`;
    }
  }
  return e2.cache = {}, e2.clearCache = () => e2.cache = {}, q = e2;
}
function gt() {
  if (tt) return J;
  tt = 1;
  const t2 = import_util.default, e2 = yt(), n2 = (t3) => null !== t3 && "object" == typeof t3 && !Array.isArray(t3), r2 = (t3) => "number" == typeof t3 || "string" == typeof t3 && "" !== t3, i2 = (t3) => Number.isInteger(+t3), o2 = (t3) => {
    let e3 = `${t3}`, n3 = -1;
    if ("-" === e3[0] && (e3 = e3.slice(1)), "0" === e3) return false;
    for (; "0" === e3[++n3]; ) ;
    return n3 > 0;
  }, s2 = (t3, e3, n3) => {
    if (e3 > 0) {
      let n4 = "-" === t3[0] ? "-" : "";
      n4 && (t3 = t3.slice(1)), t3 = n4 + t3.padStart(n4 ? e3 - 1 : e3, "0");
    }
    return false === n3 ? String(t3) : t3;
  }, a2 = (t3, e3) => {
    let n3 = "-" === t3[0] ? "-" : "";
    for (n3 && (t3 = t3.slice(1), e3--); t3.length < e3; ) t3 = "0" + t3;
    return n3 ? "-" + t3 : t3;
  }, u2 = (t3, n3, r3, i3) => {
    if (r3) return e2(t3, n3, { wrap: false, ...i3 });
    let o3 = String.fromCharCode(t3);
    return t3 === n3 ? o3 : `[${o3}-${String.fromCharCode(n3)}]`;
  }, l2 = (t3, n3, r3) => {
    if (Array.isArray(t3)) {
      let e3 = true === r3.wrap, n4 = r3.capture ? "" : "?:";
      return e3 ? `(${n4}${t3.join("|")})` : t3.join("|");
    }
    return e2(t3, n3, r3);
  }, c2 = (...e3) => new RangeError("Invalid range arguments: " + t2.inspect(...e3)), p2 = (t3, e3, n3) => {
    if (true === n3.strictRanges) throw c2([t3, e3]);
    return [];
  }, h2 = (t3, e3, n3 = 1, r3 = {}) => {
    let i3 = Number(t3), p3 = Number(e3);
    if (!Number.isInteger(i3) || !Number.isInteger(p3)) {
      if (true === r3.strictRanges) throw c2([t3, e3]);
      return [];
    }
    0 === i3 && (i3 = 0), 0 === p3 && (p3 = 0);
    let h3 = i3 > p3, f3 = String(t3), d2 = String(e3), _2 = String(n3);
    n3 = Math.max(Math.abs(n3), 1);
    let y2 = o2(f3) || o2(d2) || o2(_2), g2 = y2 ? Math.max(f3.length, d2.length, _2.length) : 0, A2 = false === y2 && false === ((t4, e4, n4) => "string" == typeof t4 || "string" == typeof e4 || true === n4.stringify)(t3, e3, r3), R2 = r3.transform || /* @__PURE__ */ ((t4) => (e4) => true === t4 ? Number(e4) : String(e4))(A2);
    if (r3.toRegex && 1 === n3) return u2(a2(t3, g2), a2(e3, g2), true, r3);
    let v2 = { negatives: [], positives: [] }, E2 = (t4) => v2[t4 < 0 ? "negatives" : "positives"].push(Math.abs(t4)), C2 = [], m2 = 0;
    for (; h3 ? i3 >= p3 : i3 <= p3; ) true === r3.toRegex && n3 > 1 ? E2(i3) : C2.push(s2(R2(i3, m2), g2, A2)), i3 = h3 ? i3 - n3 : i3 + n3, m2++;
    return true === r3.toRegex ? n3 > 1 ? ((t4, e4, n4) => {
      t4.negatives.sort((t5, e5) => t5 < e5 ? -1 : t5 > e5 ? 1 : 0), t4.positives.sort((t5, e5) => t5 < e5 ? -1 : t5 > e5 ? 1 : 0);
      let r4, i4 = e4.capture ? "" : "?:", o3 = "", s3 = "";
      return t4.positives.length && (o3 = t4.positives.map((t5) => a2(String(t5), n4)).join("|")), t4.negatives.length && (s3 = `-(${i4}${t4.negatives.map((t5) => a2(String(t5), n4)).join("|")})`), r4 = o3 && s3 ? `${o3}|${s3}` : o3 || s3, e4.wrap ? `(${i4}${r4})` : r4;
    })(v2, r3, g2) : l2(C2, null, { wrap: false, ...r3 }) : C2;
  }, f2 = (t3, e3, o3, s3 = {}) => {
    if (null == e3 && r2(t3)) return [t3];
    if (!r2(t3) || !r2(e3)) return p2(t3, e3, s3);
    if ("function" == typeof o3) return f2(t3, e3, 1, { transform: o3 });
    if (n2(o3)) return f2(t3, e3, 0, o3);
    let a3 = { ...s3 };
    return true === a3.capture && (a3.wrap = true), o3 = o3 || a3.step || 1, i2(o3) ? i2(t3) && i2(e3) ? h2(t3, e3, o3, a3) : ((t4, e4, n3 = 1, r3 = {}) => {
      if (!i2(t4) && t4.length > 1 || !i2(e4) && e4.length > 1) return p2(t4, e4, r3);
      let o4 = r3.transform || ((t5) => String.fromCharCode(t5)), s4 = `${t4}`.charCodeAt(0), a4 = `${e4}`.charCodeAt(0), c3 = s4 > a4, h3 = Math.min(s4, a4), f3 = Math.max(s4, a4);
      if (r3.toRegex && 1 === n3) return u2(h3, f3, false, r3);
      let d2 = [], _2 = 0;
      for (; c3 ? s4 >= a4 : s4 <= a4; ) d2.push(o4(s4, _2)), s4 = c3 ? s4 - n3 : s4 + n3, _2++;
      return true === r3.toRegex ? l2(d2, null, { wrap: false, options: r3 }) : d2;
    })(t3, e3, Math.max(Math.abs(o3), 1), a3) : null == o3 || n2(o3) ? f2(t3, e3, 1, o3) : ((t4, e4) => {
      if (true === e4.strictRanges) throw new TypeError(`Expected step "${t4}" to be a number`);
      return [];
    })(o3, a3);
  };
  return J = f2;
}
function At() {
  if (ut) return at;
  ut = 1;
  const t2 = dt(), { MAX_LENGTH: e2, CHAR_BACKSLASH: n2, CHAR_BACKTICK: r2, CHAR_COMMA: i2, CHAR_DOT: o2, CHAR_LEFT_PARENTHESES: s2, CHAR_RIGHT_PARENTHESES: a2, CHAR_LEFT_CURLY_BRACE: u2, CHAR_RIGHT_CURLY_BRACE: l2, CHAR_LEFT_SQUARE_BRACKET: c2, CHAR_RIGHT_SQUARE_BRACKET: p2, CHAR_DOUBLE_QUOTE: h2, CHAR_SINGLE_QUOTE: f2, CHAR_NO_BREAK_SPACE: d2, CHAR_ZERO_WIDTH_NOBREAK_SPACE: _2 } = st ? ot : (st = 1, ot = { MAX_LENGTH: 1e4, CHAR_0: "0", CHAR_9: "9", CHAR_UPPERCASE_A: "A", CHAR_LOWERCASE_A: "a", CHAR_UPPERCASE_Z: "Z", CHAR_LOWERCASE_Z: "z", CHAR_LEFT_PARENTHESES: "(", CHAR_RIGHT_PARENTHESES: ")", CHAR_ASTERISK: "*", CHAR_AMPERSAND: "&", CHAR_AT: "@", CHAR_BACKSLASH: "\\", CHAR_BACKTICK: "`", CHAR_CARRIAGE_RETURN: "\r", CHAR_CIRCUMFLEX_ACCENT: "^", CHAR_COLON: ":", CHAR_COMMA: ",", CHAR_DOLLAR: "$", CHAR_DOT: ".", CHAR_DOUBLE_QUOTE: '"', CHAR_EQUAL: "=", CHAR_EXCLAMATION_MARK: "!", CHAR_FORM_FEED: "\f", CHAR_FORWARD_SLASH: "/", CHAR_HASH: "#", CHAR_HYPHEN_MINUS: "-", CHAR_LEFT_ANGLE_BRACKET: "<", CHAR_LEFT_CURLY_BRACE: "{", CHAR_LEFT_SQUARE_BRACKET: "[", CHAR_LINE_FEED: "\n", CHAR_NO_BREAK_SPACE: "\xA0", CHAR_PERCENT: "%", CHAR_PLUS: "+", CHAR_QUESTION_MARK: "?", CHAR_RIGHT_ANGLE_BRACKET: ">", CHAR_RIGHT_CURLY_BRACE: "}", CHAR_RIGHT_SQUARE_BRACKET: "]", CHAR_SEMICOLON: ";", CHAR_SINGLE_QUOTE: "'", CHAR_SPACE: " ", CHAR_TAB: "	", CHAR_UNDERSCORE: "_", CHAR_VERTICAL_LINE: "|", CHAR_ZERO_WIDTH_NOBREAK_SPACE: "\uFEFF" });
  return at = (y2, g2 = {}) => {
    if ("string" != typeof y2) throw new TypeError("Expected a string");
    const A2 = g2 || {}, R2 = "number" == typeof A2.maxLength ? Math.min(e2, A2.maxLength) : e2;
    if (y2.length > R2) throw new SyntaxError(`Input length (${y2.length}), exceeds max characters (${R2})`);
    const v2 = { type: "root", input: y2, nodes: [] }, E2 = [v2];
    let C2 = v2, m2 = v2, b2 = 0;
    const S2 = y2.length;
    let x2, H2 = 0, T2 = 0;
    const $2 = () => y2[H2++], O2 = (t3) => {
      if ("text" === t3.type && "dot" === m2.type && (m2.type = "text"), !m2 || "text" !== m2.type || "text" !== t3.type) return C2.nodes.push(t3), t3.parent = C2, t3.prev = m2, m2 = t3, t3;
      m2.value += t3.value;
    };
    for (O2({ type: "bos" }); H2 < S2; ) if (C2 = E2[E2.length - 1], x2 = $2(), x2 !== _2 && x2 !== d2) if (x2 !== n2) if (x2 !== p2) {
      if (x2 === c2) {
        let t3;
        for (b2++; H2 < S2 && (t3 = $2()); ) if (x2 += t3, t3 !== c2) if (t3 !== n2) {
          if (t3 === p2 && (b2--, 0 === b2)) break;
        } else x2 += $2();
        else b2++;
        O2({ type: "text", value: x2 });
        continue;
      }
      if (x2 !== s2) if (x2 !== a2) {
        if (x2 === h2 || x2 === f2 || x2 === r2) {
          const t3 = x2;
          let e3;
          for (true !== g2.keepQuotes && (x2 = ""); H2 < S2 && (e3 = $2()); ) if (e3 !== n2) {
            if (e3 === t3) {
              true === g2.keepQuotes && (x2 += e3);
              break;
            }
            x2 += e3;
          } else x2 += e3 + $2();
          O2({ type: "text", value: x2 });
          continue;
        }
        if (x2 === u2) {
          T2++;
          const t3 = m2.value && "$" === m2.value.slice(-1) || true === C2.dollar;
          C2 = O2({ type: "brace", open: true, close: false, dollar: t3, depth: T2, commas: 0, ranges: 0, nodes: [] }), E2.push(C2), O2({ type: "open", value: x2 });
          continue;
        }
        if (x2 === l2) {
          if ("brace" !== C2.type) {
            O2({ type: "text", value: x2 });
            continue;
          }
          const t3 = "close";
          C2 = E2.pop(), C2.close = true, O2({ type: t3, value: x2 }), T2--, C2 = E2[E2.length - 1];
          continue;
        }
        if (x2 === i2 && T2 > 0) {
          if (C2.ranges > 0) {
            C2.ranges = 0;
            const e3 = C2.nodes.shift();
            C2.nodes = [e3, { type: "text", value: t2(C2) }];
          }
          O2({ type: "comma", value: x2 }), C2.commas++;
        } else {
          if (x2 === o2 && T2 > 0 && 0 === C2.commas) {
            const t3 = C2.nodes;
            if (0 === T2 || 0 === t3.length) {
              O2({ type: "text", value: x2 });
              continue;
            }
            if ("dot" === m2.type) {
              if (C2.range = [], m2.value += x2, m2.type = "range", 3 !== C2.nodes.length && 5 !== C2.nodes.length) {
                C2.invalid = true, C2.ranges = 0, m2.type = "text";
                continue;
              }
              C2.ranges++, C2.args = [];
              continue;
            }
            if ("range" === m2.type) {
              t3.pop();
              const e3 = t3[t3.length - 1];
              e3.value += m2.value + x2, m2 = e3, C2.ranges--;
              continue;
            }
            O2({ type: "dot", value: x2 });
            continue;
          }
          O2({ type: "text", value: x2 });
        }
      } else {
        if ("paren" !== C2.type) {
          O2({ type: "text", value: x2 });
          continue;
        }
        C2 = E2.pop(), O2({ type: "text", value: x2 }), C2 = E2[E2.length - 1];
      }
      else C2 = O2({ type: "paren", nodes: [] }), E2.push(C2), O2({ type: "text", value: x2 });
    } else O2({ type: "text", value: "\\" + x2 });
    else O2({ type: "text", value: (g2.keepEscaping ? x2 : "") + $2() });
    do {
      if (C2 = E2.pop(), "root" !== C2.type) {
        C2.nodes.forEach((t4) => {
          t4.nodes || ("open" === t4.type && (t4.isOpen = true), "close" === t4.type && (t4.isClose = true), t4.nodes || (t4.type = "text"), t4.invalid = true);
        });
        const t3 = E2[E2.length - 1], e3 = t3.nodes.indexOf(C2);
        t3.nodes.splice(e3, 1, ...C2.nodes);
      }
    } while (E2.length > 0);
    return O2({ type: "eos" }), v2;
  };
}
function Rt() {
  if (ct) return lt;
  ct = 1;
  const t2 = dt(), e2 = (function() {
    if (nt) return et;
    nt = 1;
    const t3 = gt(), e3 = ft();
    return et = (n3, r3 = {}) => {
      const i3 = (n4, o2 = {}) => {
        const s2 = e3.isInvalidBrace(o2), a2 = true === n4.invalid && true === r3.escapeInvalid, u2 = true === s2 || true === a2, l2 = true === r3.escapeInvalid ? "\\" : "";
        let c2 = "";
        if (true === n4.isOpen) return l2 + n4.value;
        if (true === n4.isClose) return l2 + n4.value;
        if ("open" === n4.type) return u2 ? l2 + n4.value : "(";
        if ("close" === n4.type) return u2 ? l2 + n4.value : ")";
        if ("comma" === n4.type) return "comma" === n4.prev.type ? "" : u2 ? n4.value : "|";
        if (n4.value) return n4.value;
        if (n4.nodes && n4.ranges > 0) {
          const i4 = e3.reduce(n4.nodes), o3 = t3(...i4, { ...r3, wrap: false, toRegex: true, strictZeros: true });
          if (0 !== o3.length) return i4.length > 1 && o3.length > 1 ? `(${o3})` : o3;
        }
        if (n4.nodes) for (const t4 of n4.nodes) c2 += i3(t4, n4);
        return c2;
      };
      return i3(n3);
    };
  })(), n2 = (function() {
    if (it) return rt;
    it = 1;
    const t3 = gt(), e3 = dt(), n3 = ft(), r3 = (t4 = "", e4 = "", i3 = false) => {
      const o2 = [];
      if (t4 = [].concat(t4), !(e4 = [].concat(e4)).length) return t4;
      if (!t4.length) return i3 ? n3.flatten(e4).map((t5) => `{${t5}}`) : e4;
      for (const n4 of t4) if (Array.isArray(n4)) for (const t5 of n4) o2.push(r3(t5, e4, i3));
      else for (let t5 of e4) true === i3 && "string" == typeof t5 && (t5 = `{${t5}}`), o2.push(Array.isArray(t5) ? r3(n4, t5, i3) : n4 + t5);
      return n3.flatten(o2);
    };
    return rt = (i3, o2 = {}) => {
      const s2 = void 0 === o2.rangeLimit ? 1e3 : o2.rangeLimit, a2 = (i4, u2 = {}) => {
        i4.queue = [];
        let l2 = u2, c2 = u2.queue;
        for (; "brace" !== l2.type && "root" !== l2.type && l2.parent; ) l2 = l2.parent, c2 = l2.queue;
        if (i4.invalid || i4.dollar) return void c2.push(r3(c2.pop(), e3(i4, o2)));
        if ("brace" === i4.type && true !== i4.invalid && 2 === i4.nodes.length) return void c2.push(r3(c2.pop(), ["{}"]));
        if (i4.nodes && i4.ranges > 0) {
          const a3 = n3.reduce(i4.nodes);
          if (n3.exceedsLimit(...a3, o2.step, s2)) throw new RangeError("expanded array length exceeds range limit. Use options.rangeLimit to increase or disable the limit.");
          let u3 = t3(...a3, o2);
          return 0 === u3.length && (u3 = e3(i4, o2)), c2.push(r3(c2.pop(), u3)), void (i4.nodes = []);
        }
        const p2 = n3.encloseBrace(i4);
        let h2 = i4.queue, f2 = i4;
        for (; "brace" !== f2.type && "root" !== f2.type && f2.parent; ) f2 = f2.parent, h2 = f2.queue;
        for (let t4 = 0; t4 < i4.nodes.length; t4++) {
          const e4 = i4.nodes[t4];
          "comma" !== e4.type || "brace" !== i4.type ? "close" !== e4.type ? e4.value && "open" !== e4.type ? h2.push(r3(h2.pop(), e4.value)) : e4.nodes && a2(e4, i4) : c2.push(r3(c2.pop(), h2, p2)) : (1 === t4 && h2.push(""), h2.push(""));
        }
        return h2;
      };
      return n3.flatten(a2(i3));
    };
  })(), r2 = At(), i2 = (t3, e3 = {}) => {
    let n3 = [];
    if (Array.isArray(t3)) for (const r3 of t3) {
      const t4 = i2.create(r3, e3);
      Array.isArray(t4) ? n3.push(...t4) : n3.push(t4);
    }
    else n3 = [].concat(i2.create(t3, e3));
    return e3 && true === e3.expand && true === e3.nodupes && (n3 = [...new Set(n3)]), n3;
  };
  return i2.parse = (t3, e3 = {}) => r2(t3, e3), i2.stringify = (e3, n3 = {}) => t2("string" == typeof e3 ? i2.parse(e3, n3) : e3, n3), i2.compile = (t3, n3 = {}) => ("string" == typeof t3 && (t3 = i2.parse(t3, n3)), e2(t3, n3)), i2.expand = (t3, e3 = {}) => {
    "string" == typeof t3 && (t3 = i2.parse(t3, e3));
    let r3 = n2(t3, e3);
    return true === e3.noempty && (r3 = r3.filter(Boolean)), true === e3.nodupes && (r3 = [...new Set(r3)]), r3;
  }, i2.create = (t3, e3 = {}) => "" === t3 || t3.length < 3 ? [t3] : true !== e3.expand ? i2.compile(t3, e3) : i2.expand(t3, e3), lt = i2;
}
var vt;
var Et;
var Ct;
var mt;
var bt;
var St;
var xt;
var Ht;
var Tt;
var $t;
var Ot;
var wt;
var Lt;
var kt = {};
function Nt() {
  if (Et) return vt;
  Et = 1;
  const t2 = import_path.default, e2 = "\\\\/", n2 = `[^${e2}]`, r2 = "\\.", i2 = "\\/", o2 = "[^/]", s2 = `(?:${i2}|$)`, a2 = `(?:^|${i2})`, u2 = `${r2}{1,2}${s2}`, l2 = { DOT_LITERAL: r2, PLUS_LITERAL: "\\+", QMARK_LITERAL: "\\?", SLASH_LITERAL: i2, ONE_CHAR: "(?=.)", QMARK: o2, END_ANCHOR: s2, DOTS_SLASH: u2, NO_DOT: `(?!${r2})`, NO_DOTS: `(?!${a2}${u2})`, NO_DOT_SLASH: `(?!${r2}{0,1}${s2})`, NO_DOTS_SLASH: `(?!${u2})`, QMARK_NO_DOT: `[^.${i2}]`, STAR: `${o2}*?`, START_ANCHOR: a2 }, c2 = { ...l2, SLASH_LITERAL: `[${e2}]`, QMARK: n2, STAR: `${n2}*?`, DOTS_SLASH: `${r2}{1,2}(?:[${e2}]|$)`, NO_DOT: `(?!${r2})`, NO_DOTS: `(?!(?:^|[${e2}])${r2}{1,2}(?:[${e2}]|$))`, NO_DOT_SLASH: `(?!${r2}{0,1}(?:[${e2}]|$))`, NO_DOTS_SLASH: `(?!${r2}{1,2}(?:[${e2}]|$))`, QMARK_NO_DOT: `[^.${e2}]`, START_ANCHOR: `(?:^|[${e2}])`, END_ANCHOR: `(?:[${e2}]|$)` };
  return vt = { MAX_LENGTH: 65536, POSIX_REGEX_SOURCE: { alnum: "a-zA-Z0-9", alpha: "a-zA-Z", ascii: "\\x00-\\x7F", blank: " \\t", cntrl: "\\x00-\\x1F\\x7F", digit: "0-9", graph: "\\x21-\\x7E", lower: "a-z", print: "\\x20-\\x7E ", punct: "\\-!\"#$%&'()\\*+,./:;<=>?@[\\]^_`{|}~", space: " \\t\\r\\n\\v\\f", upper: "A-Z", word: "A-Za-z0-9_", xdigit: "A-Fa-f0-9" }, REGEX_BACKSLASH: /\\(?![*+?^${}(|)[\]])/g, REGEX_NON_SPECIAL_CHARS: /^[^@![\].,$*+?^{}()|\\/]+/, REGEX_SPECIAL_CHARS: /[-*+?.^${}(|)[\]]/, REGEX_SPECIAL_CHARS_BACKREF: /(\\?)((\W)(\3*))/g, REGEX_SPECIAL_CHARS_GLOBAL: /([-*+?.^${}(|)[\]])/g, REGEX_REMOVE_BACKSLASH: /(?:\[.*?[^\\]\]|\\(?=.))/g, REPLACEMENTS: { "***": "*", "**/**": "**", "**/**/**": "**" }, CHAR_0: 48, CHAR_9: 57, CHAR_UPPERCASE_A: 65, CHAR_LOWERCASE_A: 97, CHAR_UPPERCASE_Z: 90, CHAR_LOWERCASE_Z: 122, CHAR_LEFT_PARENTHESES: 40, CHAR_RIGHT_PARENTHESES: 41, CHAR_ASTERISK: 42, CHAR_AMPERSAND: 38, CHAR_AT: 64, CHAR_BACKWARD_SLASH: 92, CHAR_CARRIAGE_RETURN: 13, CHAR_CIRCUMFLEX_ACCENT: 94, CHAR_COLON: 58, CHAR_COMMA: 44, CHAR_DOT: 46, CHAR_DOUBLE_QUOTE: 34, CHAR_EQUAL: 61, CHAR_EXCLAMATION_MARK: 33, CHAR_FORM_FEED: 12, CHAR_FORWARD_SLASH: 47, CHAR_GRAVE_ACCENT: 96, CHAR_HASH: 35, CHAR_HYPHEN_MINUS: 45, CHAR_LEFT_ANGLE_BRACKET: 60, CHAR_LEFT_CURLY_BRACE: 123, CHAR_LEFT_SQUARE_BRACKET: 91, CHAR_LINE_FEED: 10, CHAR_NO_BREAK_SPACE: 160, CHAR_PERCENT: 37, CHAR_PLUS: 43, CHAR_QUESTION_MARK: 63, CHAR_RIGHT_ANGLE_BRACKET: 62, CHAR_RIGHT_CURLY_BRACE: 125, CHAR_RIGHT_SQUARE_BRACKET: 93, CHAR_SEMICOLON: 59, CHAR_SINGLE_QUOTE: 39, CHAR_SPACE: 32, CHAR_TAB: 9, CHAR_UNDERSCORE: 95, CHAR_VERTICAL_LINE: 124, CHAR_ZERO_WIDTH_NOBREAK_SPACE: 65279, SEP: t2.sep, extglobChars: (t3) => ({ "!": { type: "negate", open: "(?:(?!(?:", close: `))${t3.STAR})` }, "?": { type: "qmark", open: "(?:", close: ")?" }, "+": { type: "plus", open: "(?:", close: ")+" }, "*": { type: "star", open: "(?:", close: ")*" }, "@": { type: "at", open: "(?:", close: ")" } }), globChars: (t3) => true === t3 ? c2 : l2 };
}
function Dt() {
  return Ct || (Ct = 1, (function(t2) {
    const e2 = import_path.default, n2 = "win32" === process.platform, { REGEX_BACKSLASH: r2, REGEX_REMOVE_BACKSLASH: i2, REGEX_SPECIAL_CHARS: o2, REGEX_SPECIAL_CHARS_GLOBAL: s2 } = Nt();
    t2.isObject = (t3) => null !== t3 && "object" == typeof t3 && !Array.isArray(t3), t2.hasRegexChars = (t3) => o2.test(t3), t2.isRegexChar = (e3) => 1 === e3.length && t2.hasRegexChars(e3), t2.escapeRegex = (t3) => t3.replace(s2, "\\$1"), t2.toPosixSlashes = (t3) => t3.replace(r2, "/"), t2.removeBackslashes = (t3) => t3.replace(i2, (t4) => "\\" === t4 ? "" : t4), t2.supportsLookbehinds = () => {
      const t3 = process.version.slice(1).split(".").map(Number);
      return 3 === t3.length && t3[0] >= 9 || 8 === t3[0] && t3[1] >= 10;
    }, t2.isWindows = (t3) => t3 && "boolean" == typeof t3.windows ? t3.windows : true === n2 || "\\" === e2.sep, t2.escapeLast = (e3, n3, r3) => {
      const i3 = e3.lastIndexOf(n3, r3);
      return -1 === i3 ? e3 : "\\" === e3[i3 - 1] ? t2.escapeLast(e3, n3, i3 - 1) : `${e3.slice(0, i3)}\\${e3.slice(i3)}`;
    }, t2.removePrefix = (t3, e3 = {}) => {
      let n3 = t3;
      return n3.startsWith("./") && (n3 = n3.slice(2), e3.prefix = "./"), n3;
    }, t2.wrapOutput = (t3, e3 = {}, n3 = {}) => {
      let r3 = `${n3.contains ? "" : "^"}(?:${t3})${n3.contains ? "" : "$"}`;
      return true === e3.negated && (r3 = `(?:^(?!${r3}).*$)`), r3;
    };
  })(kt)), kt;
}
function Mt() {
  if (Tt) return Ht;
  Tt = 1;
  const t2 = import_path.default, e2 = (function() {
    if (bt) return mt;
    bt = 1;
    const t3 = Dt(), { CHAR_ASTERISK: e3, CHAR_AT: n3, CHAR_BACKWARD_SLASH: r3, CHAR_COMMA: i3, CHAR_DOT: o3, CHAR_EXCLAMATION_MARK: s2, CHAR_FORWARD_SLASH: a2, CHAR_LEFT_CURLY_BRACE: u2, CHAR_LEFT_PARENTHESES: l2, CHAR_LEFT_SQUARE_BRACKET: c2, CHAR_PLUS: p2, CHAR_QUESTION_MARK: h2, CHAR_RIGHT_CURLY_BRACE: f2, CHAR_RIGHT_PARENTHESES: d2, CHAR_RIGHT_SQUARE_BRACKET: _2 } = Nt(), y2 = (t4) => t4 === a2 || t4 === r3, g2 = (t4) => {
      true !== t4.isPrefix && (t4.depth = t4.isGlobstar ? 1 / 0 : 1);
    };
    return mt = (A2, R2) => {
      const v2 = R2 || {}, E2 = A2.length - 1, C2 = true === v2.parts || true === v2.scanToEnd, m2 = [], b2 = [], S2 = [];
      let x2, H2, T2 = A2, $2 = -1, O2 = 0, w2 = 0, L2 = false, k2 = false, N2 = false, D2 = false, M2 = false, P2 = false, I2 = false, F2 = false, B2 = false, G2 = false, U2 = 0, K2 = { value: "", depth: 0, isGlob: false };
      const W2 = () => $2 >= E2, Q2 = () => T2.charCodeAt($2 + 1), j2 = () => (x2 = H2, T2.charCodeAt(++$2));
      for (; $2 < E2; ) {
        let t4;
        if (H2 = j2(), H2 !== r3) {
          if (true === P2 || H2 === u2) {
            for (U2++; true !== W2() && (H2 = j2()); ) if (H2 !== r3) if (H2 !== u2) {
              if (true !== P2 && H2 === o3 && (H2 = j2()) === o3) {
                if (L2 = K2.isBrace = true, N2 = K2.isGlob = true, G2 = true, true === C2) continue;
                break;
              }
              if (true !== P2 && H2 === i3) {
                if (L2 = K2.isBrace = true, N2 = K2.isGlob = true, G2 = true, true === C2) continue;
                break;
              }
              if (H2 === f2 && (U2--, 0 === U2)) {
                P2 = false, L2 = K2.isBrace = true, G2 = true;
                break;
              }
            } else U2++;
            else I2 = K2.backslashes = true, j2();
            if (true === C2) continue;
            break;
          }
          if (H2 !== a2) {
            if (true !== v2.noext && true == (H2 === p2 || H2 === n3 || H2 === e3 || H2 === h2 || H2 === s2) && Q2() === l2) {
              if (N2 = K2.isGlob = true, D2 = K2.isExtglob = true, G2 = true, H2 === s2 && $2 === O2 && (B2 = true), true === C2) {
                for (; true !== W2() && (H2 = j2()); ) if (H2 !== r3) {
                  if (H2 === d2) {
                    N2 = K2.isGlob = true, G2 = true;
                    break;
                  }
                } else I2 = K2.backslashes = true, H2 = j2();
                continue;
              }
              break;
            }
            if (H2 === e3) {
              if (x2 === e3 && (M2 = K2.isGlobstar = true), N2 = K2.isGlob = true, G2 = true, true === C2) continue;
              break;
            }
            if (H2 === h2) {
              if (N2 = K2.isGlob = true, G2 = true, true === C2) continue;
              break;
            }
            if (H2 === c2) {
              for (; true !== W2() && (t4 = j2()); ) if (t4 !== r3) {
                if (t4 === _2) {
                  k2 = K2.isBracket = true, N2 = K2.isGlob = true, G2 = true;
                  break;
                }
              } else I2 = K2.backslashes = true, j2();
              if (true === C2) continue;
              break;
            }
            if (true === v2.nonegate || H2 !== s2 || $2 !== O2) {
              if (true !== v2.noparen && H2 === l2) {
                if (N2 = K2.isGlob = true, true === C2) {
                  for (; true !== W2() && (H2 = j2()); ) if (H2 !== l2) {
                    if (H2 === d2) {
                      G2 = true;
                      break;
                    }
                  } else I2 = K2.backslashes = true, H2 = j2();
                  continue;
                }
                break;
              }
              if (true === N2) {
                if (G2 = true, true === C2) continue;
                break;
              }
            } else F2 = K2.negated = true, O2++;
          } else {
            if (m2.push($2), b2.push(K2), K2 = { value: "", depth: 0, isGlob: false }, true === G2) continue;
            if (x2 === o3 && $2 === O2 + 1) {
              O2 += 2;
              continue;
            }
            w2 = $2 + 1;
          }
        } else I2 = K2.backslashes = true, H2 = j2(), H2 === u2 && (P2 = true);
      }
      true === v2.noext && (D2 = false, N2 = false);
      let X2 = T2, Y2 = "", Z2 = "";
      O2 > 0 && (Y2 = T2.slice(0, O2), T2 = T2.slice(O2), w2 -= O2), X2 && true === N2 && w2 > 0 ? (X2 = T2.slice(0, w2), Z2 = T2.slice(w2)) : true === N2 ? (X2 = "", Z2 = T2) : X2 = T2, X2 && "" !== X2 && "/" !== X2 && X2 !== T2 && y2(X2.charCodeAt(X2.length - 1)) && (X2 = X2.slice(0, -1)), true === v2.unescape && (Z2 && (Z2 = t3.removeBackslashes(Z2)), X2 && true === I2 && (X2 = t3.removeBackslashes(X2)));
      const V2 = { prefix: Y2, input: A2, start: O2, base: X2, glob: Z2, isBrace: L2, isBracket: k2, isGlob: N2, isExtglob: D2, isGlobstar: M2, negated: F2, negatedExtglob: B2 };
      if (true === v2.tokens && (V2.maxDepth = 0, y2(H2) || b2.push(K2), V2.tokens = b2), true === v2.parts || true === v2.tokens) {
        let t4;
        for (let e4 = 0; e4 < m2.length; e4++) {
          const n4 = t4 ? t4 + 1 : O2, r4 = m2[e4], i4 = A2.slice(n4, r4);
          v2.tokens && (0 === e4 && 0 !== O2 ? (b2[e4].isPrefix = true, b2[e4].value = Y2) : b2[e4].value = i4, g2(b2[e4]), V2.maxDepth += b2[e4].depth), 0 === e4 && "" === i4 || S2.push(i4), t4 = r4;
        }
        if (t4 && t4 + 1 < A2.length) {
          const e4 = A2.slice(t4 + 1);
          S2.push(e4), v2.tokens && (b2[b2.length - 1].value = e4, g2(b2[b2.length - 1]), V2.maxDepth += b2[b2.length - 1].depth);
        }
        V2.slashes = m2, V2.parts = S2;
      }
      return V2;
    };
  })(), n2 = (function() {
    if (xt) return St;
    xt = 1;
    const t3 = Nt(), e3 = Dt(), { MAX_LENGTH: n3, POSIX_REGEX_SOURCE: r3, REGEX_NON_SPECIAL_CHARS: i3, REGEX_SPECIAL_CHARS_BACKREF: o3, REPLACEMENTS: s2 } = t3, a2 = (t4, n4) => {
      if ("function" == typeof n4.expandRange) return n4.expandRange(...t4, n4);
      t4.sort();
      const r4 = `[${t4.join("-")}]`;
      try {
        new RegExp(r4);
      } catch (n5) {
        return t4.map((t5) => e3.escapeRegex(t5)).join("..");
      }
      return r4;
    }, u2 = (t4, e4) => `Missing ${t4}: "${e4}" - use "\\\\${e4}" to match literal characters`, l2 = (c2, p2) => {
      if ("string" != typeof c2) throw new TypeError("Expected a string");
      c2 = s2[c2] || c2;
      const h2 = { ...p2 }, f2 = "number" == typeof h2.maxLength ? Math.min(n3, h2.maxLength) : n3;
      let d2 = c2.length;
      if (d2 > f2) throw new SyntaxError(`Input length: ${d2}, exceeds maximum allowed length: ${f2}`);
      const _2 = { type: "bos", value: "", output: h2.prepend || "" }, y2 = [_2], g2 = h2.capture ? "" : "?:", A2 = e3.isWindows(p2), R2 = t3.globChars(A2), v2 = t3.extglobChars(R2), { DOT_LITERAL: E2, PLUS_LITERAL: C2, SLASH_LITERAL: m2, ONE_CHAR: b2, DOTS_SLASH: S2, NO_DOT: x2, NO_DOT_SLASH: H2, NO_DOTS_SLASH: T2, QMARK: $2, QMARK_NO_DOT: O2, STAR: w2, START_ANCHOR: L2 } = R2, k2 = (t4) => `(${g2}(?:(?!${L2}${t4.dot ? S2 : E2}).)*?)`, N2 = h2.dot ? "" : x2, D2 = h2.dot ? $2 : O2;
      let M2 = true === h2.bash ? k2(h2) : w2;
      h2.capture && (M2 = `(${M2})`), "boolean" == typeof h2.noext && (h2.noextglob = h2.noext);
      const P2 = { input: c2, index: -1, start: 0, dot: true === h2.dot, consumed: "", output: "", prefix: "", backtrack: false, negated: false, brackets: 0, braces: 0, parens: 0, quotes: 0, globstar: false, tokens: y2 };
      c2 = e3.removePrefix(c2, P2), d2 = c2.length;
      const I2 = [], F2 = [], B2 = [];
      let G2, U2 = _2;
      const K2 = () => P2.index === d2 - 1, W2 = P2.peek = (t4 = 1) => c2[P2.index + t4], Q2 = P2.advance = () => c2[++P2.index] || "", j2 = () => c2.slice(P2.index + 1), X2 = (t4 = "", e4 = 0) => {
        P2.consumed += t4, P2.index += e4;
      }, Y2 = (t4) => {
        P2.output += null != t4.output ? t4.output : t4.value, X2(t4.value);
      }, Z2 = () => {
        let t4 = 1;
        for (; "!" === W2() && ("(" !== W2(2) || "?" === W2(3)); ) Q2(), P2.start++, t4++;
        return t4 % 2 != 0 && (P2.negated = true, P2.start++, true);
      }, V2 = (t4) => {
        P2[t4]++, B2.push(t4);
      }, q2 = (t4) => {
        P2[t4]--, B2.pop();
      }, z15 = (t4) => {
        if ("globstar" === U2.type) {
          const e4 = P2.braces > 0 && ("comma" === t4.type || "brace" === t4.type), n4 = true === t4.extglob || I2.length && ("pipe" === t4.type || "paren" === t4.type);
          "slash" === t4.type || "paren" === t4.type || e4 || n4 || (P2.output = P2.output.slice(0, -U2.output.length), U2.type = "star", U2.value = "*", U2.output = M2, P2.output += U2.output);
        }
        if (I2.length && "paren" !== t4.type && (I2[I2.length - 1].inner += t4.value), (t4.value || t4.output) && Y2(t4), U2 && "text" === U2.type && "text" === t4.type) return U2.value += t4.value, void (U2.output = (U2.output || "") + t4.value);
        t4.prev = U2, y2.push(t4), U2 = t4;
      }, J2 = (t4, e4) => {
        const n4 = { ...v2[e4], conditions: 1, inner: "" };
        n4.prev = U2, n4.parens = P2.parens, n4.output = P2.output;
        const r4 = (h2.capture ? "(" : "") + n4.open;
        V2("parens"), z15({ type: t4, value: e4, output: P2.output ? "" : b2 }), z15({ type: "paren", extglob: true, value: Q2(), output: r4 }), I2.push(n4);
      }, tt2 = (t4) => {
        let e4, n4 = t4.close + (h2.capture ? ")" : "");
        if ("negate" === t4.type) {
          let r4 = M2;
          if (t4.inner && t4.inner.length > 1 && t4.inner.includes("/") && (r4 = k2(h2)), (r4 !== M2 || K2() || /^\)+$/.test(j2())) && (n4 = t4.close = `)$))${r4}`), t4.inner.includes("*") && (e4 = j2()) && /^\.[^\\/.]+$/.test(e4)) {
            const i4 = l2(e4, { ...p2, fastpaths: false }).output;
            n4 = t4.close = `)${i4})${r4})`;
          }
          "bos" === t4.prev.type && (P2.negatedExtglob = true);
        }
        z15({ type: "paren", extglob: true, value: G2, output: n4 }), q2("parens");
      };
      if (false !== h2.fastpaths && !/(^[*!]|[/()[\]{}"])/.test(c2)) {
        let t4 = false, n4 = c2.replace(o3, (e4, n5, r4, i4, o4, s3) => "\\" === i4 ? (t4 = true, e4) : "?" === i4 ? n5 ? n5 + i4 + (o4 ? $2.repeat(o4.length) : "") : 0 === s3 ? D2 + (o4 ? $2.repeat(o4.length) : "") : $2.repeat(r4.length) : "." === i4 ? E2.repeat(r4.length) : "*" === i4 ? n5 ? n5 + i4 + (o4 ? M2 : "") : M2 : n5 ? e4 : `\\${e4}`);
        return true === t4 && (n4 = true === h2.unescape ? n4.replace(/\\/g, "") : n4.replace(/\\+/g, (t5) => t5.length % 2 == 0 ? "\\\\" : t5 ? "\\" : "")), n4 === c2 && true === h2.contains ? (P2.output = c2, P2) : (P2.output = e3.wrapOutput(n4, P2, p2), P2);
      }
      for (; !K2(); ) {
        if (G2 = Q2(), "\0" === G2) continue;
        if ("\\" === G2) {
          const t5 = W2();
          if ("/" === t5 && true !== h2.bash) continue;
          if ("." === t5 || ";" === t5) continue;
          if (!t5) {
            G2 += "\\", z15({ type: "text", value: G2 });
            continue;
          }
          const e4 = /^\\+/.exec(j2());
          let n5 = 0;
          if (e4 && e4[0].length > 2 && (n5 = e4[0].length, P2.index += n5, n5 % 2 != 0 && (G2 += "\\")), true === h2.unescape ? G2 = Q2() : G2 += Q2(), 0 === P2.brackets) {
            z15({ type: "text", value: G2 });
            continue;
          }
        }
        if (P2.brackets > 0 && ("]" !== G2 || "[" === U2.value || "[^" === U2.value)) {
          if (false !== h2.posix && ":" === G2) {
            const t5 = U2.value.slice(1);
            if (t5.includes("[") && (U2.posix = true, t5.includes(":"))) {
              const t6 = U2.value.lastIndexOf("["), e4 = U2.value.slice(0, t6), n5 = U2.value.slice(t6 + 2), i4 = r3[n5];
              if (i4) {
                U2.value = e4 + i4, P2.backtrack = true, Q2(), _2.output || 1 !== y2.indexOf(U2) || (_2.output = b2);
                continue;
              }
            }
          }
          ("[" === G2 && ":" !== W2() || "-" === G2 && "]" === W2()) && (G2 = `\\${G2}`), "]" !== G2 || "[" !== U2.value && "[^" !== U2.value || (G2 = `\\${G2}`), true === h2.posix && "!" === G2 && "[" === U2.value && (G2 = "^"), U2.value += G2, Y2({ value: G2 });
          continue;
        }
        if (1 === P2.quotes && '"' !== G2) {
          G2 = e3.escapeRegex(G2), U2.value += G2, Y2({ value: G2 });
          continue;
        }
        if ('"' === G2) {
          P2.quotes = 1 === P2.quotes ? 0 : 1, true === h2.keepQuotes && z15({ type: "text", value: G2 });
          continue;
        }
        if ("(" === G2) {
          V2("parens"), z15({ type: "paren", value: G2 });
          continue;
        }
        if (")" === G2) {
          if (0 === P2.parens && true === h2.strictBrackets) throw new SyntaxError(u2("opening", "("));
          const t5 = I2[I2.length - 1];
          if (t5 && P2.parens === t5.parens + 1) {
            tt2(I2.pop());
            continue;
          }
          z15({ type: "paren", value: G2, output: P2.parens ? ")" : "\\)" }), q2("parens");
          continue;
        }
        if ("[" === G2) {
          if (true !== h2.nobracket && j2().includes("]")) V2("brackets");
          else {
            if (true !== h2.nobracket && true === h2.strictBrackets) throw new SyntaxError(u2("closing", "]"));
            G2 = `\\${G2}`;
          }
          z15({ type: "bracket", value: G2 });
          continue;
        }
        if ("]" === G2) {
          if (true === h2.nobracket || U2 && "bracket" === U2.type && 1 === U2.value.length) {
            z15({ type: "text", value: G2, output: `\\${G2}` });
            continue;
          }
          if (0 === P2.brackets) {
            if (true === h2.strictBrackets) throw new SyntaxError(u2("opening", "["));
            z15({ type: "text", value: G2, output: `\\${G2}` });
            continue;
          }
          q2("brackets");
          const t5 = U2.value.slice(1);
          if (true === U2.posix || "^" !== t5[0] || t5.includes("/") || (G2 = `/${G2}`), U2.value += G2, Y2({ value: G2 }), false === h2.literalBrackets || e3.hasRegexChars(t5)) continue;
          const n5 = e3.escapeRegex(U2.value);
          if (P2.output = P2.output.slice(0, -U2.value.length), true === h2.literalBrackets) {
            P2.output += n5, U2.value = n5;
            continue;
          }
          U2.value = `(${g2}${n5}|${U2.value})`, P2.output += U2.value;
          continue;
        }
        if ("{" === G2 && true !== h2.nobrace) {
          V2("braces");
          const t5 = { type: "brace", value: G2, output: "(", outputIndex: P2.output.length, tokensIndex: P2.tokens.length };
          F2.push(t5), z15(t5);
          continue;
        }
        if ("}" === G2) {
          const t5 = F2[F2.length - 1];
          if (true === h2.nobrace || !t5) {
            z15({ type: "text", value: G2, output: G2 });
            continue;
          }
          let e4 = ")";
          if (true === t5.dots) {
            const t6 = y2.slice(), n5 = [];
            for (let e5 = t6.length - 1; e5 >= 0 && (y2.pop(), "brace" !== t6[e5].type); e5--) "dots" !== t6[e5].type && n5.unshift(t6[e5].value);
            e4 = a2(n5, h2), P2.backtrack = true;
          }
          if (true !== t5.comma && true !== t5.dots) {
            const n5 = P2.output.slice(0, t5.outputIndex), r4 = P2.tokens.slice(t5.tokensIndex);
            t5.value = t5.output = "\\{", G2 = e4 = "\\}", P2.output = n5;
            for (const t6 of r4) P2.output += t6.output || t6.value;
          }
          z15({ type: "brace", value: G2, output: e4 }), q2("braces"), F2.pop();
          continue;
        }
        if ("|" === G2) {
          I2.length > 0 && I2[I2.length - 1].conditions++, z15({ type: "text", value: G2 });
          continue;
        }
        if ("," === G2) {
          let t5 = G2;
          const e4 = F2[F2.length - 1];
          e4 && "braces" === B2[B2.length - 1] && (e4.comma = true, t5 = "|"), z15({ type: "comma", value: G2, output: t5 });
          continue;
        }
        if ("/" === G2) {
          if ("dot" === U2.type && P2.index === P2.start + 1) {
            P2.start = P2.index + 1, P2.consumed = "", P2.output = "", y2.pop(), U2 = _2;
            continue;
          }
          z15({ type: "slash", value: G2, output: m2 });
          continue;
        }
        if ("." === G2) {
          if (P2.braces > 0 && "dot" === U2.type) {
            "." === U2.value && (U2.output = E2);
            const t5 = F2[F2.length - 1];
            U2.type = "dots", U2.output += G2, U2.value += G2, t5.dots = true;
            continue;
          }
          if (P2.braces + P2.parens === 0 && "bos" !== U2.type && "slash" !== U2.type) {
            z15({ type: "text", value: G2, output: E2 });
            continue;
          }
          z15({ type: "dot", value: G2, output: E2 });
          continue;
        }
        if ("?" === G2) {
          if ((!U2 || "(" !== U2.value) && true !== h2.noextglob && "(" === W2() && "?" !== W2(2)) {
            J2("qmark", G2);
            continue;
          }
          if (U2 && "paren" === U2.type) {
            const t5 = W2();
            let n5 = G2;
            if ("<" === t5 && !e3.supportsLookbehinds()) throw new Error("Node.js v10 or higher is required for regex lookbehinds");
            ("(" === U2.value && !/[!=<:]/.test(t5) || "<" === t5 && !/<([!=]|\w+>)/.test(j2())) && (n5 = `\\${G2}`), z15({ type: "text", value: G2, output: n5 });
            continue;
          }
          if (true !== h2.dot && ("slash" === U2.type || "bos" === U2.type)) {
            z15({ type: "qmark", value: G2, output: O2 });
            continue;
          }
          z15({ type: "qmark", value: G2, output: $2 });
          continue;
        }
        if ("!" === G2) {
          if (true !== h2.noextglob && "(" === W2() && ("?" !== W2(2) || !/[!=<:]/.test(W2(3)))) {
            J2("negate", G2);
            continue;
          }
          if (true !== h2.nonegate && 0 === P2.index) {
            Z2();
            continue;
          }
        }
        if ("+" === G2) {
          if (true !== h2.noextglob && "(" === W2() && "?" !== W2(2)) {
            J2("plus", G2);
            continue;
          }
          if (U2 && "(" === U2.value || false === h2.regex) {
            z15({ type: "plus", value: G2, output: C2 });
            continue;
          }
          if (U2 && ("bracket" === U2.type || "paren" === U2.type || "brace" === U2.type) || P2.parens > 0) {
            z15({ type: "plus", value: G2 });
            continue;
          }
          z15({ type: "plus", value: C2 });
          continue;
        }
        if ("@" === G2) {
          if (true !== h2.noextglob && "(" === W2() && "?" !== W2(2)) {
            z15({ type: "at", extglob: true, value: G2, output: "" });
            continue;
          }
          z15({ type: "text", value: G2 });
          continue;
        }
        if ("*" !== G2) {
          "$" !== G2 && "^" !== G2 || (G2 = `\\${G2}`);
          const t5 = i3.exec(j2());
          t5 && (G2 += t5[0], P2.index += t5[0].length), z15({ type: "text", value: G2 });
          continue;
        }
        if (U2 && ("globstar" === U2.type || true === U2.star)) {
          U2.type = "star", U2.star = true, U2.value += G2, U2.output = M2, P2.backtrack = true, P2.globstar = true, X2(G2);
          continue;
        }
        let t4 = j2();
        if (true !== h2.noextglob && /^\([^?]/.test(t4)) {
          J2("star", G2);
          continue;
        }
        if ("star" === U2.type) {
          if (true === h2.noglobstar) {
            X2(G2);
            continue;
          }
          const e4 = U2.prev, n5 = e4.prev, r4 = "slash" === e4.type || "bos" === e4.type, i4 = n5 && ("star" === n5.type || "globstar" === n5.type);
          if (true === h2.bash && (!r4 || t4[0] && "/" !== t4[0])) {
            z15({ type: "star", value: G2, output: "" });
            continue;
          }
          const o4 = P2.braces > 0 && ("comma" === e4.type || "brace" === e4.type), s3 = I2.length && ("pipe" === e4.type || "paren" === e4.type);
          if (!r4 && "paren" !== e4.type && !o4 && !s3) {
            z15({ type: "star", value: G2, output: "" });
            continue;
          }
          for (; "/**" === t4.slice(0, 3); ) {
            const e5 = c2[P2.index + 4];
            if (e5 && "/" !== e5) break;
            t4 = t4.slice(3), X2("/**", 3);
          }
          if ("bos" === e4.type && K2()) {
            U2.type = "globstar", U2.value += G2, U2.output = k2(h2), P2.output = U2.output, P2.globstar = true, X2(G2);
            continue;
          }
          if ("slash" === e4.type && "bos" !== e4.prev.type && !i4 && K2()) {
            P2.output = P2.output.slice(0, -(e4.output + U2.output).length), e4.output = `(?:${e4.output}`, U2.type = "globstar", U2.output = k2(h2) + (h2.strictSlashes ? ")" : "|$)"), U2.value += G2, P2.globstar = true, P2.output += e4.output + U2.output, X2(G2);
            continue;
          }
          if ("slash" === e4.type && "bos" !== e4.prev.type && "/" === t4[0]) {
            const n6 = void 0 !== t4[1] ? "|$" : "";
            P2.output = P2.output.slice(0, -(e4.output + U2.output).length), e4.output = `(?:${e4.output}`, U2.type = "globstar", U2.output = `${k2(h2)}${m2}|${m2}${n6})`, U2.value += G2, P2.output += e4.output + U2.output, P2.globstar = true, X2(G2 + Q2()), z15({ type: "slash", value: "/", output: "" });
            continue;
          }
          if ("bos" === e4.type && "/" === t4[0]) {
            U2.type = "globstar", U2.value += G2, U2.output = `(?:^|${m2}|${k2(h2)}${m2})`, P2.output = U2.output, P2.globstar = true, X2(G2 + Q2()), z15({ type: "slash", value: "/", output: "" });
            continue;
          }
          P2.output = P2.output.slice(0, -U2.output.length), U2.type = "globstar", U2.output = k2(h2), U2.value += G2, P2.output += U2.output, P2.globstar = true, X2(G2);
          continue;
        }
        const n4 = { type: "star", value: G2, output: M2 };
        true !== h2.bash ? !U2 || "bracket" !== U2.type && "paren" !== U2.type || true !== h2.regex ? (P2.index !== P2.start && "slash" !== U2.type && "dot" !== U2.type || ("dot" === U2.type ? (P2.output += H2, U2.output += H2) : true === h2.dot ? (P2.output += T2, U2.output += T2) : (P2.output += N2, U2.output += N2), "*" !== W2() && (P2.output += b2, U2.output += b2)), z15(n4)) : (n4.output = G2, z15(n4)) : (n4.output = ".*?", "bos" !== U2.type && "slash" !== U2.type || (n4.output = N2 + n4.output), z15(n4));
      }
      for (; P2.brackets > 0; ) {
        if (true === h2.strictBrackets) throw new SyntaxError(u2("closing", "]"));
        P2.output = e3.escapeLast(P2.output, "["), q2("brackets");
      }
      for (; P2.parens > 0; ) {
        if (true === h2.strictBrackets) throw new SyntaxError(u2("closing", ")"));
        P2.output = e3.escapeLast(P2.output, "("), q2("parens");
      }
      for (; P2.braces > 0; ) {
        if (true === h2.strictBrackets) throw new SyntaxError(u2("closing", "}"));
        P2.output = e3.escapeLast(P2.output, "{"), q2("braces");
      }
      if (true === h2.strictSlashes || "star" !== U2.type && "bracket" !== U2.type || z15({ type: "maybe_slash", value: "", output: `${m2}?` }), true === P2.backtrack) {
        P2.output = "";
        for (const t4 of P2.tokens) P2.output += null != t4.output ? t4.output : t4.value, t4.suffix && (P2.output += t4.suffix);
      }
      return P2;
    };
    return l2.fastpaths = (r4, i4) => {
      const o4 = { ...i4 }, a3 = "number" == typeof o4.maxLength ? Math.min(n3, o4.maxLength) : n3, u3 = r4.length;
      if (u3 > a3) throw new SyntaxError(`Input length: ${u3}, exceeds maximum allowed length: ${a3}`);
      r4 = s2[r4] || r4;
      const l3 = e3.isWindows(i4), { DOT_LITERAL: c2, SLASH_LITERAL: p2, ONE_CHAR: h2, DOTS_SLASH: f2, NO_DOT: d2, NO_DOTS: _2, NO_DOTS_SLASH: y2, STAR: g2, START_ANCHOR: A2 } = t3.globChars(l3), R2 = o4.dot ? _2 : d2, v2 = o4.dot ? y2 : d2, E2 = o4.capture ? "" : "?:";
      let C2 = true === o4.bash ? ".*?" : g2;
      o4.capture && (C2 = `(${C2})`);
      const m2 = (t4) => true === t4.noglobstar ? C2 : `(${E2}(?:(?!${A2}${t4.dot ? f2 : c2}).)*?)`, b2 = (t4) => {
        switch (t4) {
          case "*":
            return `${R2}${h2}${C2}`;
          case ".*":
            return `${c2}${h2}${C2}`;
          case "*.*":
            return `${R2}${C2}${c2}${h2}${C2}`;
          case "*/*":
            return `${R2}${C2}${p2}${h2}${v2}${C2}`;
          case "**":
            return R2 + m2(o4);
          case "**/*":
            return `(?:${R2}${m2(o4)}${p2})?${v2}${h2}${C2}`;
          case "**/*.*":
            return `(?:${R2}${m2(o4)}${p2})?${v2}${C2}${c2}${h2}${C2}`;
          case "**/.*":
            return `(?:${R2}${m2(o4)}${p2})?${c2}${h2}${C2}`;
          default: {
            const e4 = /^(.*?)\.(\w+)$/.exec(t4);
            if (!e4) return;
            const n4 = b2(e4[1]);
            if (!n4) return;
            return n4 + c2 + e4[2];
          }
        }
      }, S2 = e3.removePrefix(r4, { negated: false, prefix: "" });
      let x2 = b2(S2);
      return x2 && true !== o4.strictSlashes && (x2 += `${p2}?`), x2;
    }, St = l2;
  })(), r2 = Dt(), i2 = Nt(), o2 = (t3, e3, n3 = false) => {
    if (Array.isArray(t3)) {
      const r3 = t3.map((t4) => o2(t4, e3, n3)), i4 = (t4) => {
        for (const e4 of r3) {
          const n4 = e4(t4);
          if (n4) return n4;
        }
        return false;
      };
      return i4;
    }
    const i3 = (s2 = t3) && "object" == typeof s2 && !Array.isArray(s2) && t3.tokens && t3.input;
    var s2;
    if ("" === t3 || "string" != typeof t3 && !i3) throw new TypeError("Expected pattern to be a non-empty string");
    const a2 = e3 || {}, u2 = r2.isWindows(e3), l2 = i3 ? o2.compileRe(t3, e3) : o2.makeRe(t3, e3, false, true), c2 = l2.state;
    delete l2.state;
    let p2 = () => false;
    if (a2.ignore) {
      const t4 = { ...e3, ignore: null, onMatch: null, onResult: null };
      p2 = o2(a2.ignore, t4, n3);
    }
    const h2 = (n4, r3 = false) => {
      const { isMatch: i4, match: s3, output: h3 } = o2.test(n4, l2, e3, { glob: t3, posix: u2 }), f2 = { glob: t3, state: c2, regex: l2, posix: u2, input: n4, output: h3, match: s3, isMatch: i4 };
      return "function" == typeof a2.onResult && a2.onResult(f2), false === i4 ? (f2.isMatch = false, !!r3 && f2) : p2(n4) ? ("function" == typeof a2.onIgnore && a2.onIgnore(f2), f2.isMatch = false, !!r3 && f2) : ("function" == typeof a2.onMatch && a2.onMatch(f2), !r3 || f2);
    };
    return n3 && (h2.state = c2), h2;
  };
  return o2.test = (t3, e3, n3, { glob: i3, posix: s2 } = {}) => {
    if ("string" != typeof t3) throw new TypeError("Expected input to be a string");
    if ("" === t3) return { isMatch: false, output: "" };
    const a2 = n3 || {}, u2 = a2.format || (s2 ? r2.toPosixSlashes : null);
    let l2 = t3 === i3, c2 = l2 && u2 ? u2(t3) : t3;
    return false === l2 && (c2 = u2 ? u2(t3) : t3, l2 = c2 === i3), false !== l2 && true !== a2.capture || (l2 = true === a2.matchBase || true === a2.basename ? o2.matchBase(t3, e3, n3, s2) : e3.exec(c2)), { isMatch: Boolean(l2), match: l2, output: c2 };
  }, o2.matchBase = (e3, n3, i3, s2 = r2.isWindows(i3)) => (n3 instanceof RegExp ? n3 : o2.makeRe(n3, i3)).test(t2.basename(e3)), o2.isMatch = (t3, e3, n3) => o2(e3, n3)(t3), o2.parse = (t3, e3) => Array.isArray(t3) ? t3.map((t4) => o2.parse(t4, e3)) : n2(t3, { ...e3, fastpaths: false }), o2.scan = (t3, n3) => e2(t3, n3), o2.compileRe = (t3, e3, n3 = false, r3 = false) => {
    if (true === n3) return t3.output;
    const i3 = e3 || {}, s2 = i3.contains ? "" : "^", a2 = i3.contains ? "" : "$";
    let u2 = `${s2}(?:${t3.output})${a2}`;
    t3 && true === t3.negated && (u2 = `^(?!${u2}).*$`);
    const l2 = o2.toRegex(u2, e3);
    return true === r3 && (l2.state = t3), l2;
  }, o2.makeRe = (t3, e3 = {}, r3 = false, i3 = false) => {
    if (!t3 || "string" != typeof t3) throw new TypeError("Expected a non-empty string");
    let s2 = { negated: false, fastpaths: true };
    return false === e3.fastpaths || "." !== t3[0] && "*" !== t3[0] || (s2.output = n2.fastpaths(t3, e3)), s2.output || (s2 = n2(t3, e3)), o2.compileRe(s2, e3, r3, i3);
  }, o2.toRegex = (t3, e3) => {
    try {
      const n3 = e3 || {};
      return new RegExp(t3, n3.flags || (n3.nocase ? "i" : ""));
    } catch (t4) {
      if (e3 && true === e3.debug) throw t4;
      return /$^/;
    }
  }, o2.constants = i2, Ht = o2;
}
function Pt() {
  return Ot ? $t : (Ot = 1, $t = Mt());
}
var It = (function() {
  if (Lt) return wt;
  Lt = 1;
  const t2 = import_util.default, e2 = Rt(), n2 = Pt(), r2 = Dt(), i2 = (t3) => "" === t3 || "./" === t3, o2 = (t3) => {
    const e3 = t3.indexOf("{");
    return e3 > -1 && t3.indexOf("}", e3) > -1;
  }, s2 = (t3, e3, r3) => {
    e3 = [].concat(e3), t3 = [].concat(t3);
    let i3 = /* @__PURE__ */ new Set(), o3 = /* @__PURE__ */ new Set(), s3 = /* @__PURE__ */ new Set(), a2 = 0, u2 = (t4) => {
      s3.add(t4.output), r3 && r3.onResult && r3.onResult(t4);
    };
    for (let s4 = 0; s4 < e3.length; s4++) {
      let l3 = n2(String(e3[s4]), { ...r3, onResult: u2 }, true), c2 = l3.state.negated || l3.state.negatedExtglob;
      c2 && a2++;
      for (let e4 of t3) {
        let t4 = l3(e4, true);
        (c2 ? !t4.isMatch : t4.isMatch) && (c2 ? i3.add(t4.output) : (i3.delete(t4.output), o3.add(t4.output)));
      }
    }
    let l2 = (a2 === e3.length ? [...s3] : [...o3]).filter((t4) => !i3.has(t4));
    if (r3 && 0 === l2.length) {
      if (true === r3.failglob) throw new Error(`No matches found for "${e3.join(", ")}"`);
      if (true === r3.nonull || true === r3.nullglob) return r3.unescape ? e3.map((t4) => t4.replace(/\\/g, "")) : e3;
    }
    return l2;
  };
  return s2.match = s2, s2.matcher = (t3, e3) => n2(t3, e3), s2.any = s2.isMatch = (t3, e3, r3) => n2(e3, r3)(t3), s2.not = (t3, e3, n3 = {}) => {
    e3 = [].concat(e3).map(String);
    let r3 = /* @__PURE__ */ new Set(), i3 = [], o3 = new Set(s2(t3, e3, { ...n3, onResult: (t4) => {
      n3.onResult && n3.onResult(t4), i3.push(t4.output);
    } }));
    for (let t4 of i3) o3.has(t4) || r3.add(t4);
    return [...r3];
  }, s2.contains = (e3, n3, r3) => {
    if ("string" != typeof e3) throw new TypeError(`Expected a string: "${t2.inspect(e3)}"`);
    if (Array.isArray(n3)) return n3.some((t3) => s2.contains(e3, t3, r3));
    if ("string" == typeof n3) {
      if (i2(e3) || i2(n3)) return false;
      if (e3.includes(n3) || e3.startsWith("./") && e3.slice(2).includes(n3)) return true;
    }
    return s2.isMatch(e3, n3, { ...r3, contains: true });
  }, s2.matchKeys = (t3, e3, n3) => {
    if (!r2.isObject(t3)) throw new TypeError("Expected the first argument to be an object");
    let i3 = s2(Object.keys(t3), e3, n3), o3 = {};
    for (let e4 of i3) o3[e4] = t3[e4];
    return o3;
  }, s2.some = (t3, e3, r3) => {
    let i3 = [].concat(t3);
    for (let t4 of [].concat(e3)) {
      let e4 = n2(String(t4), r3);
      if (i3.some((t5) => e4(t5))) return true;
    }
    return false;
  }, s2.every = (t3, e3, r3) => {
    let i3 = [].concat(t3);
    for (let t4 of [].concat(e3)) {
      let e4 = n2(String(t4), r3);
      if (!i3.every((t5) => e4(t5))) return false;
    }
    return true;
  }, s2.all = (e3, r3, i3) => {
    if ("string" != typeof e3) throw new TypeError(`Expected a string: "${t2.inspect(e3)}"`);
    return [].concat(r3).every((t3) => n2(t3, i3)(e3));
  }, s2.capture = (t3, e3, i3) => {
    let o3 = r2.isWindows(i3), s3 = n2.makeRe(String(t3), { ...i3, capture: true }).exec(o3 ? r2.toPosixSlashes(e3) : e3);
    if (s3) return s3.slice(1).map((t4) => void 0 === t4 ? "" : t4);
  }, s2.makeRe = (...t3) => n2.makeRe(...t3), s2.scan = (...t3) => n2.scan(...t3), s2.parse = (t3, r3) => {
    let i3 = [];
    for (let o3 of [].concat(t3 || [])) for (let t4 of e2(String(o3), r3)) i3.push(n2.parse(t4, r3));
    return i3;
  }, s2.braces = (t3, n3) => {
    if ("string" != typeof t3) throw new TypeError("Expected a string");
    return n3 && true === n3.nobrace || !o2(t3) ? [t3] : e2(t3, n3);
  }, s2.braceExpand = (t3, e3) => {
    if ("string" != typeof t3) throw new TypeError("Expected a string");
    return s2.braces(t3, { ...e3, expand: true });
  }, s2.hasBraces = o2, wt = s2;
})();
var Ft = Q(It);
var Bt = class extends import_node_events.EventEmitter {
  constructor(t2, e2 = {}) {
    super(), this.ready = false, this.closed = false, this._selfWatcher = null, this._watcher = null, this._isProcessing = false, this._isInitializing = true, this._eventQueue = /* @__PURE__ */ new Map(), this._isIgnored = (t3) => !!this._options.ignore && ("function" == typeof this._options.ignore ? this._options.ignore(t3) : Ft.isMatch(t3, this._options.ignore)), this._init = () => v(this, void 0, void 0, function* () {
      var t3, e3, n2;
      this._guardSelf(), this._watch(), this._dirTree = yield this._buildDirTree(this._path, { fileFilter: null === (t3 = this._options) || void 0 === t3 ? void 0 : t3.fileFilter, directoryFilter: null === (e3 = this._options) || void 0 === e3 ? void 0 : e3.directoryFilter, depth: null === (n2 = this._options) || void 0 === n2 ? void 0 : n2.depth, type: "files_directories", alwaysStat: true }), this._isInitializing = false, this._eventsHandler(), this.ready = true, this.emit(F.READY);
    }), this._guardSelf = () => {
      this._selfWatcher = (0, import_node_fs.watchFile)(this._path, { persistent: true, interval: 1e3 }, (t3) => {
        Object.values(t3).every((t4) => "number" == typeof t4 ? 0 === t4 : t4 instanceof Date && 0 === t4.getTime()) && (this.emit(F.SELF_ENOENT), this.close());
      });
    }, this._buildDirTree = (t3, e3) => v(this, void 0, void 0, function* () {
      function n2(t4, e4, n3) {
        return v(this, void 0, void 0, function* () {
          const r2 = yield (function(t5, e5 = "md5", n4 = 1048576) {
            return new Promise((r3, i2) => {
              const o2 = (0, import_node_crypto.createHash)(e5), s2 = (0, import_node_fs.createReadStream)(t5, { highWaterMark: n4 });
              s2.on("error", i2), o2.on("error", i2), s2.on("data", (t6) => o2.update(t6)), s2.on("end", () => r3(o2.digest("hex")));
            });
          })(e4);
          t4.key = r2 + n3.ino.toString() + n3.dev.toString(), t4.content_hash = r2;
        });
      }
      return new Promise((i2, o2) => v(this, void 0, void 0, function* () {
        if (!(yield C(t3))) return void o2(new Error(`[DirWatcher] path ${t3} not exists`));
        const s2 = yield (0, import_promises2.stat)(t3), { name: a2 } = (0, import_node_path6.parse)(t3), u2 = new G(t3, a2, s2.ino.toString() + s2.dev.toString()), l2 = [];
        (function(t4, e4 = {}) {
          let n3 = e4.entryType || e4.type;
          if ("both" === n3 && (n3 = x), n3 && (e4.type = n3), !t4) throw new Error("readdirp: root argument is required. Usage: readdirp(root, options)");
          if ("string" != typeof t4) throw new TypeError("readdirp: root argument must be a string. Usage: readdirp(root, options)");
          if (n3 && !w.includes(n3)) throw new Error(`readdirp: Invalid type passed. Use one of ${w.join(", ")}`);
          return e4.root = t4, new P(e4);
        })(t3, e3).on("data", (t4) => {
          const { fullPath: e4, stats: r2 } = t4;
          if (null == r2 ? void 0 : r2.isDirectory()) u2.add(e4, I.DIRECTORY, r2.ino.toString() + r2.dev.toString());
          else {
            const { dir: r3, name: i3, ext: o3, base: s3 } = (0, import_node_path6.parse)(e4), a3 = u2.add(e4, I.FILE, "", "", { fullPath: e4, dir: r3, name: s3, basename: i3, ext: o3, stats: t4.stats });
            l2.push(n2(a3, e4, t4.stats));
          }
        }).on("warn", (t4) => {
        }).on("error", (t4) => {
          o2(t4);
        }).on("end", () => v(this, void 0, void 0, function* () {
          yield Promise.all(l2), i2(u2);
        }));
      }));
    }), this._eventsHandler = () => v(this, void 0, void 0, function* () {
      var t3, e3, n2;
      if (!this._isProcessing && 0 !== this._eventQueue.size && !this._isInitializing) {
        for (this._isProcessing = true; this._eventQueue.size > 0; ) {
          const r2 = Array.from(this._eventQueue.entries());
          this._eventQueue.clear();
          const i2 = /* @__PURE__ */ new Map([[F.ADD, /* @__PURE__ */ new Map()], [F.REMOVE, /* @__PURE__ */ new Map()]]);
          yield Promise.all(r2.map((t4) => v(this, [t4], void 0, function* ([t5, e4]) {
            return this._diff(t5, e4, i2);
          })));
          for (const [r3, o2] of i2.entries()) if (r3 === F.ADD) for (const [n3, s2] of o2.entries()) if (null === (t3 = i2.get(F.REMOVE)) || void 0 === t3 ? void 0 : t3.has(n3)) {
            const t4 = null === (e3 = i2.get(F.REMOVE)) || void 0 === e3 ? void 0 : e3.get(n3);
            s2 && t4 && s2.name !== t4.name ? this.emit(F.RENAME, t4, s2) : this.emit(F.MOVE, t4, s2);
          } else this.emit(r3, s2);
          else if (r3 === F.REMOVE) for (const [t4, e4] of o2.entries()) (null === (n2 = i2.get(F.ADD)) || void 0 === n2 ? void 0 : n2.has(t4)) || this.emit(r3, e4);
        }
        this._isProcessing = false;
      }
    }), this._diff = (t3, e3, n2) => v(this, void 0, void 0, function* () {
      var r2, i2, o2, s2, a2, u2, l2, c2, p2, h2, f2, d2, _2, y2, g2, A2;
      try {
        const R2 = yield this._buildDirTree(t3, { depth: 1, type: "files_directories", alwaysStat: true, fileFilter: null === (r2 = this._options) || void 0 === r2 ? void 0 : r2.fileFilter, directoryFilter: null === (i2 = this._options) || void 0 === i2 ? void 0 : i2.directoryFilter });
        for (const t4 of e3) {
          const e4 = R2.getNode(t4), r3 = this._dirTree.getNode(t4);
          if (e4 && !r3) if (null == e4 ? void 0 : e4.isDirectory) {
            const t5 = yield this._buildDirTree(null == e4 ? void 0 : e4.fullPath, { type: "files_directories", alwaysStat: true, fileFilter: null === (o2 = this._options) || void 0 === o2 ? void 0 : o2.fileFilter, directoryFilter: null === (s2 = this._options) || void 0 === s2 ? void 0 : s2.directoryFilter });
            this._dirTree.add(t5.root.fullPath, t5.root.node_type, t5.root.key).children = t5.root.children, null === (a2 = n2.get(F.ADD)) || void 0 === a2 || a2.set(null == e4 ? void 0 : e4.key, { fullPath: null == e4 ? void 0 : e4.fullPath, isDirectory: null == e4 ? void 0 : e4.isDirectory, isFile: null == e4 ? void 0 : e4.isFile, key: null == e4 ? void 0 : e4.key, name: null == e4 ? void 0 : e4.name });
          } else this._dirTree.add(t4, e4.node_type, e4.key, null == e4 ? void 0 : e4.content_hash, null == e4 ? void 0 : e4.data), null === (u2 = n2.get(F.ADD)) || void 0 === u2 || u2.set(null == e4 ? void 0 : e4.key, { fullPath: null == e4 ? void 0 : e4.fullPath, isDirectory: null == e4 ? void 0 : e4.isDirectory, isFile: null == e4 ? void 0 : e4.isFile, key: null == e4 ? void 0 : e4.key, name: null == e4 ? void 0 : e4.name, basename: null === (l2 = null == e4 ? void 0 : e4.data) || void 0 === l2 ? void 0 : l2.basename, ext: null === (c2 = null == e4 ? void 0 : e4.data) || void 0 === c2 ? void 0 : c2.ext, content_hash: null == e4 ? void 0 : e4.content_hash });
          else !e4 && r3 ? (yield C(null == r3 ? void 0 : r3.fullPath)) || ((null == r3 ? void 0 : r3.isDirectory) ? null === (p2 = n2.get(F.REMOVE)) || void 0 === p2 || p2.set(null == r3 ? void 0 : r3.key, { fullPath: null == r3 ? void 0 : r3.fullPath, isDirectory: null == r3 ? void 0 : r3.isDirectory, isFile: null == r3 ? void 0 : r3.isFile, key: null == r3 ? void 0 : r3.key, name: null == r3 ? void 0 : r3.name }) : null === (h2 = n2.get(F.REMOVE)) || void 0 === h2 || h2.set(null == r3 ? void 0 : r3.key, { fullPath: null == r3 ? void 0 : r3.fullPath, isDirectory: null == r3 ? void 0 : r3.isDirectory, isFile: null == r3 ? void 0 : r3.isFile, key: null == r3 ? void 0 : r3.key, name: null == r3 ? void 0 : r3.name, basename: null === (f2 = null == r3 ? void 0 : r3.data) || void 0 === f2 ? void 0 : f2.basename, ext: null === (d2 = null == r3 ? void 0 : r3.data) || void 0 === d2 ? void 0 : d2.ext, content_hash: null == r3 ? void 0 : r3.content_hash }), this._dirTree.delete(null == r3 ? void 0 : r3.fullPath)) : e4 && r3 && e4.key !== r3.key && (e4.isDirectory && e4.key !== r3.key ? this.emit(F.CHANGE, { fullPath: null == e4 ? void 0 : e4.fullPath, isDirectory: null == e4 ? void 0 : e4.isDirectory, isFile: null == e4 ? void 0 : e4.isFile, key: null == e4 ? void 0 : e4.key, name: null == e4 ? void 0 : e4.name }, { fullPath: null == r3 ? void 0 : r3.fullPath, isDirectory: null == r3 ? void 0 : r3.isDirectory, isFile: null == r3 ? void 0 : r3.isFile, key: null == r3 ? void 0 : r3.key, name: null == r3 ? void 0 : r3.name }) : e4.content_hash !== r3.content_hash && this.emit(F.CHANGE, { fullPath: null == r3 ? void 0 : r3.fullPath, isDirectory: null == r3 ? void 0 : r3.isDirectory, isFile: null == r3 ? void 0 : r3.isFile, key: null == r3 ? void 0 : r3.key, name: null == r3 ? void 0 : r3.name, basename: null === (_2 = null == r3 ? void 0 : r3.data) || void 0 === _2 ? void 0 : _2.basename, ext: null === (y2 = null == r3 ? void 0 : r3.data) || void 0 === y2 ? void 0 : y2.ext, content_hash: null == r3 ? void 0 : r3.content_hash }, { fullPath: null == e4 ? void 0 : e4.fullPath, isDirectory: null == e4 ? void 0 : e4.isDirectory, isFile: null == e4 ? void 0 : e4.isFile, key: null == e4 ? void 0 : e4.key, name: null == e4 ? void 0 : e4.name, basename: null === (g2 = null == e4 ? void 0 : e4.data) || void 0 === g2 ? void 0 : g2.basename, ext: null === (A2 = null == e4 ? void 0 : e4.data) || void 0 === A2 ? void 0 : A2.ext, content_hash: null == e4 ? void 0 : e4.content_hash }), this._dirTree.update(null == e4 ? void 0 : e4.fullPath, e4));
        }
      } catch (t4) {
        this._errorHandler(t4);
      }
    }), this._debouncedHandler = pt(this._eventsHandler, 100), this._watch = () => {
      try {
        this._watcher = (0, import_node_fs.watch)(this._path, { recursive: true }, (t3, e3) => {
          var n2;
          if (e3) {
            const t4 = (0, import_node_path6.join)(this._path, e3.toString());
            if (this._isIgnored(t4)) return;
            const { dir: r2 } = (0, import_node_path6.parse)(t4);
            this._eventQueue.has(r2) || this._eventQueue.set(r2, /* @__PURE__ */ new Set()), null === (n2 = this._eventQueue.get(r2)) || void 0 === n2 || n2.add(t4), this._debouncedHandler();
          }
        });
      } catch (t3) {
        this._errorHandler(t3);
      }
    }, this._errorHandler = (t3) => {
      this.emit(F.ERROR, t3 instanceof Error ? t3 : new Error(String(t3)));
    }, this.close = () => {
      var t3, e3, n2, r2;
      this.closed || (this.closed = true, this._isProcessing = false, this._eventQueue.clear(), this._dirTree.destroy(), this._dirTree = null, null === (t3 = this._selfWatcher) || void 0 === t3 || t3.unref(), null === (e3 = this._watcher) || void 0 === e3 || e3.close(), null === (n2 = this._watcher) || void 0 === n2 || n2.unref(), (0, import_node_fs.unwatchFile)(this._path), null === (r2 = this._watcher) || void 0 === r2 || r2.removeAllListeners(), this._selfWatcher = null, this._watcher = null, this.emit(F.CLOSE), this.removeAllListeners());
    }, this._path = t2, this._options = e2, this._init();
  }
};
function Gt(t2, e2) {
  return v(this, void 0, void 0, function* () {
    if (!(yield C(t2))) throw new Error(`Path <${t2}> does not exist`);
    if (!E(t2)) throw new Error(`Path <${t2}> is not accessible`);
    if (!(yield (0, import_promises2.stat)(t2)).isDirectory()) throw new Error(`Path <${t2}> is not a directory`);
    return new Bt(t2, e2);
  });
}

// src/controllers/watch/index.ts
var app12 = new Hono2();
var id = BigInt(0);
app12.post("/new-images", (c2) => {
  return streamSSE(c2, async (stream2) => {
    try {
      const { path: path6, ignores = [] } = await c2.req.json();
      let ready = false;
      let abort = false;
      const watcher = await Gt(path6, {
        ignore(path7) {
          const ext = (0, import_node_path7.parse)(path7).ext;
          return ignores.some((ignore) => path7.includes(ignore)) || !VALID_IMAGE_EXTS.includes(ext);
        },
        fileFilter: (entry) => {
          if (ignores.some((ignore) => entry.fullPath.includes(ignore))) return false;
          return VALID_IMAGE_EXTS.includes((0, import_node_path7.parse)(entry.path).ext);
        },
        directoryFilter: (entry) => {
          return !ignores.includes(entry.basename);
        }
      });
      stream2.onAbort(() => {
        console.log(`Watch <${path6}> aborted`);
        watcher.close();
        stream2.close();
        abort = true;
      });
      while (true) {
        if (abort) break;
        if (!ready) {
          ready = true;
          watcher.on(F.READY, () => {
            stream2.writeSSE({
              data: "",
              event: "ready",
              id: (++id).toString()
            });
            watcher.on(F.ADD, (payload) => {
              stream2.writeSSE({
                data: JSON.stringify(payload, jsonBigInt),
                event: "add",
                id: (++id).toString()
              });
            }).on(F.REMOVE, (payload) => {
              stream2.writeSSE({
                data: JSON.stringify(payload, jsonBigInt),
                event: "remove",
                id: (++id).toString()
              });
            }).on(F.RENAME, (oldData, newData) => {
              stream2.writeSSE({
                data: JSON.stringify(
                  { oldPath: oldData.fullPath, newPath: newData.fullPath, oldData, newData },
                  jsonBigInt
                ),
                event: "rename",
                id: (++id).toString()
              });
            }).on(F.MOVE, (from, to) => {
              stream2.writeSSE({
                data: JSON.stringify(
                  { oldPath: from.fullPath, newPath: to.fullPath, from, to },
                  jsonBigInt
                ),
                event: "rename",
                id: (++id).toString()
              });
            }).on(F.SELF_ENOENT, () => {
              stream2.writeSSE({
                data: "",
                event: "self-enoent",
                id: (++id).toString()
              });
            }).on(F.ERROR, (error) => {
              stream2.writeSSE({
                data: error.toString(),
                event: "fault",
                id: (++id).toString()
              });
            });
          });
        }
        await stream2.sleep(1e3 * 10);
        await stream2.writeSSE({
          data: "",
          event: "ping",
          id: (++id).toString()
        });
      }
    } catch (error) {
      await stream2.writeSSE({
        data: error.toString(),
        event: "abort",
        id: (++id).toString()
      });
      stream2.close();
    }
  });
});
var watch_default = app12;

// src/app.ts
var import_node7 = __toESM(require("@sentry/node"));
function createApp() {
  const app13 = new Hono2().use(logger()).use(
    "*",
    cors({
      origin: "*",
      maxAge: 600
    })
  ).use(
    "*",
    timeout(6e4 * 3, () => new HTTPException(500, { message: "Process timeout" }))
  ).onError(async (error, c2) => {
    console.error("[ERROR Catch]", error);
    if (error instanceof HTTPException) {
      const response = error.getResponse();
      const data = await response.json();
      captureError(error);
      return c2.json(
        {
          code: -1,
          data,
          err_msg: error.message || "Internal Server Error",
          status: 501
        },
        501
      );
    }
    captureError(error);
    return c2.json({ code: -1, err_msg: error.message || "Internal Server Error" }, 500);
  }).get("/ping", (c2) => c2.text("pong")).get("/debug-sentry", () => {
    import_node7.default.logger.info("User triggered test error", {
      action: "test_error_endpoint"
    });
    throw new Error("Sentry error test!");
  });
  app13.route("/api/codec", createCodecRouter());
  app13.route("/api/image-viewer", createImageViewerRouter());
  app13.route("/api/compress/png", png_default);
  app13.route("/api/compress/avif", avif_default);
  app13.route("/api/compress/gif", gif_default);
  app13.route("/api/compress/webp", webp_default);
  app13.route("/api/compress/jpg", jpeg_default);
  app13.route("/api/compress/jpeg", jpeg_default);
  app13.route("/api/compress/tiff", tiff_default);
  app13.route("/api/compress/tif", tiff_default);
  app13.route("/api/compress/svg", svg_default);
  app13.route("/api/compress/tinify", tinypng_default);
  app13.route("/api/watermark", watermark_default);
  app13.route("/api/resize", resize_default);
  app13.route("/api/convert", convert_default);
  app13.route("/stream/watch", watch_default);
  return app13;
}

// src/cluster/master.ts
var import_node_cluster2 = __toESM(require("node:cluster"));
var import_node_os3 = __toESM(require("node:os"));
var kvStore = /* @__PURE__ */ new Map();
function now() {
  return Date.now();
}
function handleMessage(worker, message) {
  const { type, payload, requestId } = message;
  if (type === "kv:set") {
    const { key, value, ttlMs } = payload;
    const entry = { value };
    if (ttlMs && ttlMs > 0) {
      entry.expireAt = now() + ttlMs;
    }
    kvStore.set(key, entry);
    if (requestId) {
      worker.send({ type: "kv:ack", payload: { ok: true }, requestId });
    }
  } else if (type === "kv:get") {
    const { key } = payload;
    const entry = kvStore.get(key);
    if (entry && entry.expireAt && entry.expireAt <= now()) {
      kvStore.delete(key);
    }
    const value = kvStore.get(key)?.value;
    if (requestId) {
      worker.send({
        type: "kv:resp",
        payload: { key, value },
        requestId
      });
    }
  } else if (type === "kv:del") {
    const { key } = payload;
    kvStore.delete(key);
    if (requestId) {
      worker.send({ type: "kv:ack", payload: { ok: true }, requestId });
    }
  }
}
async function startMaster(config) {
  if (!import_node_cluster2.default.isPrimary) return;
  if (import_node_os3.default.platform() !== "win32") {
    import_node_cluster2.default.schedulingPolicy = import_node_cluster2.default.SCHED_RR;
  }
  import_node_cluster2.default.setupPrimary({
    execArgv: process.execArgv
  });
  if (config.store && typeof config.store === "object") {
    for (const [k2, v2] of Object.entries(config.store)) {
      kvStore.set(k2, { value: v2 });
    }
  }
  for (let i2 = 0; i2 < config.concurrency; i2++) {
    const worker = import_node_cluster2.default.fork(config);
    worker.on("message", (msg) => handleMessage(worker, msg));
  }
  import_node_cluster2.default.on("exit", (worker, code, signal) => {
    captureError(
      new Error(`Worker Exit`),
      {
        extra: {
          worker_id: worker.id,
          worker_pid: worker.process.pid,
          code,
          signal
        }
      },
      "worker_exit"
    );
    console.error(
      JSON.stringify({
        msg: "[Worker Exit]",
        id: worker.id,
        pid: worker.process.pid,
        code,
        signal
      })
    );
    const w2 = import_node_cluster2.default.fork(config);
    w2.on("message", (msg) => handleMessage(w2, msg));
  });
  console.log(
    JSON.stringify({
      origin: `http://localhost:${config.port}`
    })
  );
}

// src/cluster/worker.ts
var import_node_cluster3 = __toESM(require("node:cluster"));
var import_node_server = __toESM(require_dist2());
async function startWorker(config) {
  if (import_node_cluster3.default.isPrimary) return;
  const app13 = createApp();
  (0, import_node_server.serve)({ fetch: app13.fetch, port: config.port, hostname: HOSTNAME }, (info) => {
    console.log(`[worker]: worker_id:${import_node_cluster3.default.worker?.id}  pid:${process.pid}`);
  });
  if (process.send) {
    const msg = { type: "worker:ready", payload: { pid: process.pid } };
    process.send(msg);
  }
}

// src/server.ts
async function startServer(config) {
  if (config.cluster) {
    if (import_node_cluster4.default.isPrimary) {
      await startMaster(config);
    } else {
      await startWorker(config);
    }
  } else {
    const app13 = createApp();
    (0, import_node_server2.serve)({ fetch: app13.fetch, port: config.port, hostname: HOSTNAME }, (info) => {
      console.log(JSON.stringify({ origin: `http://localhost:${info.port}` }));
    });
  }
}

// src/config/index.ts
var import_node_os4 = __toESM(require("node:os"));
function parseNumber(value, fallback) {
  const parsed = Number(value);
  if (Number.isFinite(parsed) && parsed > 0) {
    return parsed;
  }
  return fallback;
}
function parseBoolean(value, fallback) {
  if (typeof value === "string") {
    const lowered = value.toLowerCase();
    if (["1", "true", "yes", "on"].includes(lowered)) {
      return true;
    }
    if (["0", "false", "no", "off"].includes(lowered)) {
      return false;
    }
  }
  if (typeof value === "boolean") {
    return value;
  }
  return fallback;
}
async function loadConfig() {
  const enable = parseBoolean(process.env.VERYPIC_SIDECAR_ENABLE, false);
  const cpuCount = Math.max(1, Math.floor(import_node_os4.default.cpus().length / 2));
  const concurrency = parseNumber(process.env.VERYPIC_SIDECAR_CONCURRENCY, cpuCount);
  const cluster5 = parseBoolean(process.env.VERYPIC_SIDECAR_CLUSTER, false);
  const port = await findAvailablePort(isDev ? 3e3 : void 0);
  const mode = String(process.env.VERYPIC_SIDECAR_MODE || "server").toLowerCase() || "server";
  let store = {};
  if (process.env.VERYPIC_SIDECAR_STORE) {
    try {
      store = JSON.parse(String(process.env.VERYPIC_SIDECAR_STORE));
    } catch (e2) {
      console.error("[shared-kv] invalid JSON");
      process.exit(1);
    }
  }
  return {
    enable,
    port,
    concurrency,
    cluster: cluster5,
    mode,
    store
  };
}

// src/index.ts
async function main() {
  try {
    const config = await loadConfig();
    if (!config.enable) {
      process.exit(0);
    }
    if (config.mode === "cli") {
      console.log(
        JSON.stringify({
          mode: "cli",
          message: "VeryPic Sidecar CLI is under construction."
        })
      );
      return;
    } else {
      await startServer(config);
    }
  } catch (error) {
    captureError(error);
    process.exit(1);
  }
}
main();
/*! Bundled license information:

dirspy/dist/esm/index.js:
  (*!
   * is-number <https://github.com/jonschlinkert/is-number>
   *
   * Copyright (c) 2014-present, Jon Schlinkert.
   * Released under the MIT License.
   *)
  (*!
   * to-regex-range <https://github.com/micromatch/to-regex-range>
   *
   * Copyright (c) 2015-present, Jon Schlinkert.
   * Released under the MIT License.
   *)
  (*!
   * fill-range <https://github.com/jonschlinkert/fill-range>
   *
   * Copyright (c) 2014-present, Jon Schlinkert.
   * Licensed under the MIT License.
   *)
*/
