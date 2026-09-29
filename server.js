require('dotenv').config();
const app = require('./src/app');

const preferredPort = Number(process.env.PORT) || 3000;
const portRange = Array.from({ length: 201 }, (_, index) => 3200 - index)
  .filter((port) => port >= 3000 && port <= 3200);
const portsToTry = [...new Set([preferredPort, ...portRange])].filter((port) => Number.isInteger(port) && port > 0);

let currentPortIndex = 0;

function startServer(port) {
  const server = app.listen(port, () => {
    console.log(`Trading bot server running on http://localhost:${port}`);
  });

  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE' && currentPortIndex < portsToTry.length - 1) {
      currentPortIndex += 1;
      startServer(portsToTry[currentPortIndex]);
      return;
    }

    console.error(`Unable to start server on any port in range ${portsToTry[0]}-${portsToTry[portsToTry.length - 1]}: ${error.message}`);
    process.exit(1);
  });
}

startServer(portsToTry[0]);
