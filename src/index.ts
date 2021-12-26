import * as logging from './logging';

async function stop(error?: Error | string): Promise<void> {
    try {
        await logging.log(2, 'process.log.shuttingDown');

        // Complete graceful shutdown.

        await logging.logLine(2, 'process.log.done');

        if (!error || typeof error === 'string') {
            process.exit(0);
        } else {
            await logging.error(error);
            process.exit(1);
        }
    } catch (newError) {
        await logging.error(newError as Error);
        process.exit(1);
    }
}

process.on('SIGINT', stop);
process.on('SIGTERM', stop);
process.on('SIGHUP', stop);
process.on('SIGBREAK', stop);
process.on('uncaughtException', stop);

await logging.log(2, 'process.log.initializing');

await logging.logLine(2, 'process.log.done');
