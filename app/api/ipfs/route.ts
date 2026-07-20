import { NextResponse, NextRequest } from "next/server";
import { pinata } from "@/utils/config";

export async function POST(request: NextRequest){
    try {
        const data = await request.formData();
        const file: File | null = data.get("file") as unknown as File;

        if (!file){
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        const uploadResponse = await pinata.upload.public.file(file);

        return NextResponse.json({ cid: uploadResponse.cid }, { status: 200 });
    } catch (error) {
        console.error("IPFS Upload Error: ", error);
        return NextResponse.json(
            { error: "Internal Server Error during IPFS pinning" },
            { status: 500 }
        );
    }
}
