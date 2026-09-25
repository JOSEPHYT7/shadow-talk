/**
 * ShadowTalk High-Performance Cluster Manager & Load Dispatcher
 * Leverages multi-core processing to distribute incoming HTTP & WebSocket traffic.
 * Implements auto-healing, graceful worker restarts, and zero-downtime health telemetry.
 */

const cluster = require('cluster');
const os = require('os');
const path = require('path');

const numCPUs = Math.min(os.cpus().length, 4); // Max 4 workers for optimal local & container efficiency
const WORKER_RESTART_DELAY = 1500;

if (cluster.isMaster || cluster.isPrimary) {
  console.log(`\n=========================================================`);
  console.log(`⚡ [SHADOWTALK LOAD BALANCER] Primary Process ${process.pid} Online`);
  console.log(`⚡ Available CPU Cores: ${os.cpus().length} | Allocating ${numCPUs} Cluster Workers`);
  console.log(`=========================================================\n`);

  // Track worker metrics
  const workerStats = new Map();

  // Fork workers
  for (let i = 0; i < numCPUs; i++) {
    const worker = cluster.fork({ WORKER_ID: i + 1 });
    workerStats.set(worker.id, {
      pid: worker.process.pid,
      startTime: Date.now(),
      restarts: 0
    });
  }

  cluster.on('online', (worker) => {
    console.log(`[Load Balancer]: Worker #${worker.id} (PID ${worker.process.pid}) active and serving requests.`);
  });

  cluster.on('exit', (worker, code, signal) => {
    console.warn(`[Load Balancer]: Worker #${worker.id} (PID ${worker.process.pid}) exited (code: ${code}, signal: ${signal}).`);
    const currentStats = workerStats.get(worker.id) || { restarts: 0 };
    workerStats.delete(worker.id);

    // Auto-heal: restart replacement worker after cooldown
    setTimeout(() => {
      console.log(`[Load Balancer]: Auto-healing... Spawning replacement worker.`);
      const newWorker = cluster.fork({ WORKER_ID: (currentStats.restarts || 0) + 1 });
      workerStats.set(newWorker.id, {
        pid: newWorker.process.pid,
        startTime: Date.now(),
        restarts: (currentStats.restarts || 0) + 1
      });
    }, WORKER_RESTART_DELAY);
  });

  // Graceful shutdown on SIGTERM / SIGINT
  const handleShutdown = () => {
    console.log('\n[Load Balancer]: Terminating all cluster nodes gracefully...');
    for (const id in cluster.workers) {
      cluster.workers[id]?.process.kill('SIGTERM');
    }
    process.exit(0);
  };

  process.on('SIGINT', handleShutdown);
  process.on('SIGTERM', handleShutdown);

} else {
  // Worker process runs the server instance
  require('./server.js');
}
