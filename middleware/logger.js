import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const logsConfig = JSON.parse(readFileSync(path.join(__dirname, '../logs.json'), 'utf8'));

// Middleware to log incoming requests with timestamp, method, path, and source file
export const logger = (req, res, next) => {
    // Skip logging if logger is disabled
    if (!logsConfig.enableLogs.logger) {
        return next();
    }

    const originalJson = res.json;
    const originalSend = res.send;
    const originalEnd = res.end;

    let logged = false;

    const logRequest = () => {
        if (logged) return;
        logged = true;

        const { file, line } = getRealCallerFile();
        const timestamp = formatTime(new Date());
        const methodColor = getMethodColor(req.method);

        console.log(
            `${colors.cyan}${timestamp}${colors.reset} ${colors.gray}|${colors.reset} ${methodColor}${req.method}${colors.reset} ${colors.yellow}${req.path}${colors.reset} ${colors.gray}|${colors.reset} ${colors.green}${file}${colors.reset}${colors.gray}:${colors.reset}${colors.magenta}${line}${colors.reset}`
        );
    };

    // Override res.json
    res.json = function (body) {
        logRequest();
        return originalJson.call(this, body);
    };

    // Override res.send
    res.send = function (body) {
        logRequest();
        return originalSend.call(this, body);
    };

    // Override res.end as fallback
    res.end = function (chunk, encoding) {
        logRequest();
        return originalEnd.call(this, chunk, encoding);
    };

    next();
};

// ANSI color codes
const colors = {
    reset: '\x1b[0m',
    cyan: '\x1b[36m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    red: '\x1b[31m',
    gray: '\x1b[90m',
    brightGreen: '\x1b[92m',
    brightYellow: '\x1b[93m',
    brightBlue: '\x1b[94m',
    brightMagenta: '\x1b[95m'
};

// Returns appropriate ANSI color code based on HTTP method
function getMethodColor(method) {
    const methodColors = {
        GET: colors.brightGreen,
        POST: colors.brightBlue,
        PUT: colors.brightYellow,
        DELETE: colors.red,
        PATCH: colors.brightMagenta
    };
    return methodColors[method] || colors.reset;
}

// Formats a Date object into 12-hour time format (HH:MM AM/PM)
function formatTime(date) {
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';

    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'

    const minutesStr = minutes < 10 ? '0' + minutes : minutes;

    return `${hours}:${minutesStr} ${ampm}`;
}

// Extracts the actual source file and line number from the call stack
function getRealCallerFile() {
    const original = Error.prepareStackTrace;

    try {
        Error.prepareStackTrace = (_, stack) => stack;
        const err = new Error();
        const stack = err.stack;
        Error.prepareStackTrace = original;

        // Skip frames that come from node internals, node_modules, or express/router internals
        const frame = stack.find((callSite) => {
            const fileName = callSite.getFileName();
            if (!fileName) return false;

            // Skip node internals
            if (fileName.includes("internal") || fileName.includes("node:")) return false;

            // Skip node_modules
            if (fileName.includes("node_modules")) return false;

            // Skip express and router internals
            if (fileName.includes("express/lib") || fileName.includes("router/lib")) return false;

            // Skip the logger middleware itself
            if (fileName.includes("middleware/logger.js")) return false;

            // This should be a project file
            return true;
        });

        if (!frame) return { file: "Unknown", line: 0 };

        const fullPath = frame.getFileName();
        const lineNumber = frame.getLineNumber();

        // Extract relative path from project root
        // Look for /server/ in the path and return from there
        const serverIndex = fullPath.indexOf("/server/");
        let filePath = fullPath;

        if (serverIndex !== -1) {
            filePath = fullPath.substring(serverIndex);
        }

        return { file: filePath, line: lineNumber };
    } catch (e) {
        return { file: "Unknown", line: 0 };
    }
}
