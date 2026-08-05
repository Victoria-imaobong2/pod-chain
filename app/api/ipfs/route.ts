import { NextResponse } from "next/server";

export async function POST(request: Request){
    try {
        const data = await request.formData();
        const file: File | null = data.get("file") as unknown as File;

        if (!file){
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        const pinataFormData = new FormData();
        pinataFormData.append("file", file);

        const pinataMetaData = JSON.stringify({
            name: file.name,
        });
        pinataFormData.append("pinataMetadata", pinataMetaData);

       const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PINATA_JWT}`,
      },
      body: pinataFormData,
    });

    if (!res.ok) {
      const errorData = await res.json();
      return NextResponse.json(errorData, { status: res.status });
    }

    const resData = await res.json();
    return NextResponse.json({ IpfsHash: resData.IpfsHash }, { status: 200 });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: (error as Error).message || "Failed to upload to Pinata" },
      { status: 500 }
    );
  }
}