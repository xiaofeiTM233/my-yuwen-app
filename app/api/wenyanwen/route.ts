import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Wenyanwen } from '@/lib/models';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const keyword = searchParams.get('keyword') || '';
    
    const skip = (page - 1) * pageSize;
    
    const query: any = {};
    if (keyword) {
      query.$or = [
        { 'meta.title': { $regex: keyword, $options: 'i' } },
        { 'meta.author': { $regex: keyword, $options: 'i' } },
        { 'meta.book': { $regex: keyword, $options: 'i' } }
      ];
    }
    
    const total = await Wenyanwen.countDocuments(query);
    const data = await Wenyanwen.find(query).sort({ createdAt: -1 }).skip(skip).limit(pageSize).lean();
    
    return NextResponse.json({
      success: true,
      data,
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) }
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: '获取失败' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();
    
    if (!body.meta?.title || !body.meta?.author || !body.meta?.book) {
      return NextResponse.json({ success: false, error: '缺少必填字段' }, { status: 400 });
    }
    
    const wenyanwen = new Wenyanwen(body);
    await wenyanwen.save();
    
    return NextResponse.json({ success: true, data: wenyanwen }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: '添加失败' }, { status: 500 });
  }
}
