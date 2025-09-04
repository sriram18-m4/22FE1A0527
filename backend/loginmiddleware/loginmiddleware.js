const axios = require('axios');

// Replace this with your actual token from onboarding/docs
const AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiYXVkIjoiaHR0cDovLzIwLjI0NC41Ni4xNDQvZXZhbHVhdGlvbi1zZXJ2aWNlIiwiZW1haWwiOiJzcmlyYW12YXJtYTE4MjAwNUBnbWFpbC5jb20iLCJleHAiOjE3NTY5NzIyNzUsImlhdCI6MTc1Njk3MTM3NSwiaXNzIjoiQWZmb3JkIE1lZGljYWwgVGVjaG5vbG9naWVzIFByaXZhdGUgTGltaXRlZCIsImp0aSI6IjU1ZDRlZmQyLTE0MzQtNDE3ZS05NjRjLWI2NTYwM2U0MzkxMiIsImxvY2FsZSI6ImVuLUlOIiwibmFtZSI6InNyaSByYW0gdmFybWEiLCJzdWIiOiIxODFmOTI3YS1iNjMzLTQ3YzctOGFjZS1iODg5NTM3MTZiZTcifSwiZW1haWwiOiJzcmlyYW12YXJtYTE4MjAwNUBnbWFpbC5jb20iLCJuYW1lIjoic3JpIHJhbSB2YXJtYSIsInJvbGxObyI6IjIyZmUxYTA1MjciLCJhY2Nlc3NDb2RlIjoiWXp1SmVVIiwiY2xpZW50SUQiOiIxODFmOTI3YS1iNjMzLTQ3YzctOGFjZS1iODg5NTM3MTZiZTciLCJjbGllbnRTZWNyZXQiOiJFTWdWZmdkQ2tEdGNtUlNSIn0.cGmh7dpsdb5qv-rVGrHsNdfOUHRrwFQYhZ8IEZLM79I';

const STACKS = ["backend", "frontend"];
const LEVELS = ["debug", "info", "warn", "error", "fatal"];
const PACKAGES = {
    backend: [
        "cache", "controller", "cron_job", "db", "domain", "handler",
        "repository", "route", "service",
        "auth", "config", "middleware", "utils"
    ],
    frontend: [
        "api", "component", "hook", "page", "state", "style",
        "auth", "config", "middleware", "utils"
    ]
};

function isValid(stack, level, pkg) {
    if (!STACKS.includes(stack)) return false;
    if (!LEVELS.includes(level)) return false;
    if (!PACKAGES[stack].includes(pkg)) return false;
    return true;
}

async function log(stack, level, pkg, message) {
    stack = (stack || "").toLowerCase();
    level = (level || "").toLowerCase();
    pkg = (pkg || "").toLowerCase();

    if (!isValid(stack, level, pkg)) {
        throw new Error(`Invalid input: stack='${stack}', level='${level}', package='${pkg}'`);
    }

    const logData = { stack, level, package: pkg, message };

    try {
        const response = await axios.post(
            'http://20.244.56.144/evaluation-service/logs',
            logData,
            {
                headers: {
                    Authorization: `Bearer ${AUTH_TOKEN}`
                }
            }
        );
        return response.data;
    } catch (err) {
        // Do not block request in case of logging failure
        return null;
    }
}

module.exports = async function loggingMiddleware(req, res, next) {
    try {
        await log(
            "backend",                // stack
            "info",                   // level
            "middleware",             // package
            `${req.method} ${req.originalUrl} | IP: ${req.ip}` // message
        );
    } catch (err) {
        // Optionally console.error(err);
    }
    next();
};