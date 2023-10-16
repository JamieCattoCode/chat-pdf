// Route for /api/create-chat

import { NextResponse } from "next/server";

export async function POST(req: Request, res: Response) {
    try {
        const body = await req.json();
        const { fileKey, fileName } = body;

        console.log(`File key: ${fileKey}\n File name: ${fileName}`);
        return NextResponse.json({message: 'Success!'});
        
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}