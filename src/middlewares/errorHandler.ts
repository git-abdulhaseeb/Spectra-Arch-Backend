import type { ErrorRequestHandler } from 'express';
export const errorHandler:ErrorRequestHandler=(error,_req,res,_next)=>{console.error(error);res.status((error as {status?:number}).status||500).json({message:error instanceof Error?error.message:'Unexpected server error'})};
