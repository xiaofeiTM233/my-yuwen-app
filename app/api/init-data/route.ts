import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Wenyanwen } from '@/lib/models';

const sampleData = [
  {
    meta: { author: "荀子", title: "劝学", book: "高中语文必修上册" },
    contents: [
      {
        origin: "君子曰：学不可以已。",
        translations: [{ content: "君子说：学习是不可以停止的。", types: ["直译"], start: 0, end: 6 }],
        pronunciations: [{ index: 0, pinyin: "jūn" }, { index: 1, pinyin: "zǐ" }, { index: 3, pinyin: "xué" }]
      },
      {
        origin: "青，取之于蓝，而青于蓝；冰，水为之，而寒于水。",
        translations: [{ content: "靛青是从蓝草里提取的，可是比蓝草的颜色更深；冰是水凝结而成的，却比水还要寒冷。", types: ["直译"], start: 0, end: 20 }],
        pronunciations: [{ index: 0, pinyin: "qīng" }, { index: 3, pinyin: "qǔ" }, { index: 5, pinyin: "yú" }, { index: 7, pinyin: "lán" }]
      }
    ]
  },
  {
    meta: { author: "韩愈", title: "师说", book: "高中语文必修上册" },
    contents: [
      {
        origin: "古之学者必有师。",
        translations: [{ content: "古代求学的人一定有老师。", types: ["直译"], start: 0, end: 7 }],
        pronunciations: [{ index: 0, pinyin: "gǔ" }, { index: 2, pinyin: "xué" }, { index: 4, pinyin: "bì" }]
      },
      {
        origin: "师者，所以传道受业解惑也。",
        translations: [{ content: "老师，是用来传授道理、教授学业、解答疑难问题的人。", types: ["直译"], start: 0, end: 10 }],
        pronunciations: [{ index: 0, pinyin: "shī" }, { index: 4, pinyin: "chuán" }, { index: 6, pinyin: "dào" }]
      }
    ]
  }
];

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    
    const count = await Wenyanwen.countDocuments();
    if (count > 0) {
      return NextResponse.json({ success: true, message: '已有数据，跳过初始化', count });
    }
    
    const result = await Wenyanwen.insertMany(sampleData);
    return NextResponse.json({ success: true, message: '初始化成功', count: result.length });
  } catch (error) {
    return NextResponse.json({ success: false, error: '初始化失败' }, { status: 500 });
  }
}
