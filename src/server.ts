import { app } from './app.js';import { connectDatabase } from './config/db.js';import { env } from './config/env.js';
connectDatabase().then(()=>app.listen(env.port,()=>console.log(`ArchBackend API listening on http://localhost:${env.port}`))).catch(error=>{console.error('Failed to start:',error);process.exit(1)});
