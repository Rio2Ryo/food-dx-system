import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// 商品一覧取得
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const companyId = searchParams.get("companyId");
  const category = searchParams.get("category");

  const where: Record<string, unknown> = { isActive: true };
  if (companyId) where.companyId = companyId;
  if (category) where.category = category;

  const products = await prisma.product.findMany({
    where,
    orderBy: { name: "asc" },
  });

  return NextResponse.json(products);
}

// 商品登録
export async function POST(request: NextRequest) {
  const body = await request.json();

  const product = await prisma.product.create({
    data: {
      name: body.name,
      code: body.code,
      description: body.description,
      unit: body.unit,
      price: body.price,
      category: body.category,
      companyId: body.companyId,
    },
  });

  return NextResponse.json(product, { status: 201 });
}
