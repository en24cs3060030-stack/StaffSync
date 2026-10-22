// Performance monitoring: measures every request, sets X-Response-Time and warns about slow ones
module.exports = (req, res, next) => {
  const start = process.hrtime.bigint();
  const originalWriteHead = res.writeHead;
  res.writeHead = function (...args) {
    const ms = Number(process.hrtime.bigint() - start) / 1e6;
    if (!res.headersSent) res.setHeader('X-Response-Time', `${ms.toFixed(1)}ms`);
    const limit = Number(process.env.SLOW_REQUEST_MS) || 500;
    if (ms > limit) console.warn(`[SLOW] ${req.method} ${req.originalUrl} took ${ms.toFixed(0)}ms`);
    return originalWriteHead.apply(this, args);
  };
  next();
};
