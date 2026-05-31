import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Wenyanwen } from '@/lib/models';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const { id } = await params;
    
    const data = await Wenyanwen.findById(id).lean();
    if (!data) {
      return NextResponse.json({ success: false, error: '不存在' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ success: false, error: '获取失败' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const { id } = await params;
    const body = await request.json();
    
    const data = await Wenyanwen.findByIdAndUpdate(id, body, { new: true }).lean();
    if (!data) {
      return NextResponse.json({ success: false, error: '不存在' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ success: false, error: '更新失败' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const { id } = await params;
    
    const data = await Wenyanwen.findByIdAndDelete(id);
    if (!data) {
      return NextResponse.json({ success: false, error: '不存在' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true, message: '删除成功' });
  } catch (error) {
    return NextResponse.json({ success: false, error: '删除失败' }, { status: 500 });
  }
}
