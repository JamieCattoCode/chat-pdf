// Route for /api/create-chat

import { loadS3IntoPinecone } from "@/lib/pinecone";
import { NextResponse } from "next/server";

export async function POST(req: Request, res: Response) {
    try {
        const body = await req.json();
        const { fileKey, fileName } = body;

        const pages = await loadS3IntoPinecone(fileKey);
        
        console.log(`File key: ${fileKey}\n File name: ${fileName}`);
        return NextResponse.json({ pages });
        
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}