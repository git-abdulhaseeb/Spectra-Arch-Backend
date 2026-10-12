import 'dotenv/config';
export const env = {
    port: Number(process.env.PORT || 5000),
    mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/archbackend',
    jwtSecret: process.env.JWT_SECRET || 'development-only-secret',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
    nodeEnv: process.env.NODE_ENV || 'development',
    openAiApiKey: process.env.OPENAI_API_KEY || '',
    openAiGraphModel: process.env.OPENAI_GRAPH_MODEL || 'gpt-5-mini',
};
if (env.nodeEnv === 'production' && env.jwtSecret === 'development-only-secret')
    throw new Error('JWT_SECRET must be configured in production.');
