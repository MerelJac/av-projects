import { NextRequest, NextResponse } from "next/server";
import { calculateVertexTax } from "@/lib/utils/vertex";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { documentNumber, customerCode, destination, lines } = body;

  if (!destination || !lines?.length) {
    return NextResponse.json(
      { error: "destination and lines are required" },
      { status: 400 },
    );
  }


  
  const result = await calculateVertexTax({
    documentNumber,
    customerCode,
    destination,
    lines,
  });
  
  if (!result) {
    return NextResponse.json({ error: "Vertex request failed" }, { status: 502 });
  }

  return NextResponse.json(result);
}
