"use strict";
const cluster = require('cluster');
const fs = require('fs');
const numCPUs = require('os').cpus().length;

var greetingRe = new RegExp("^\/greeting\/([a-z]+)$", "i");
var portRe = new RegExp("^--port=(\\d+)$", "i");

var port = 3000;
process.argv.forEach((val, index) => {
    var match = portRe.exec(val);
    if (match) {
        port = parseInt(match[1]);
    }
});

if (cluster.isMaster) {
    const pid = process.pid;
    fs.writeFileSync(".pid", pid.toString());
    console.log(`Master ${pid} is running on port ${port}`);

    // Fork workers.
    for (let i = 0; i < numCPUs; i++) {
        cluster.fork();
    }

    cluster.on('exit', (worker, code, signal) => {
        console.log(`Worker ${worker.process.pid} terminated`);
    });
} else {
    // Workers can share any TCP connection
    // In this case it is an HTTP server

    const app = require('fastify')();

    app.get('/', async (request, reply) => {
      reply.status(200);
      return "Hello World!";
    });
    app.get('/greeting/:name', async (request, reply) => {
      reply.status(200);
      return `Hello ${request.params.name}`;
    });

    app.listen(port);

    console.log(`Worker ${process.pid} started`);
}
