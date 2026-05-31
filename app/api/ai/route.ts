import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Wenyanwen } from '@/lib/models';

const tools = [
  {
    type: 'function',
    function: {
      name: 'update_wenyanwen',
      description: '修改文言文数据，需要用户提供确认',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'string', description: '文言文ID' },
          data: {
            type: 'object',
            description: '要修改的数据，格式为 {meta: {...}, contents: [...]}',
          },
          reason: { type: 'string', description: '修改原因说明' },
        },
        required: ['id', 'data', 'reason'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_wenyanwen_list',
      description: '获取文言文列表',
      parameters: {
        type: 'object',
        properties: {
          keyword: { type: 'string', description: '搜索关键词' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_wenyanwen_detail',
      description: '获取单篇文言文详情',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'string', description: '文言文ID' },
        },
        required: ['id'],
      },
    },
  },
];

async function executeFunction(name: string, args: any) {
  await dbConnect();

  switch (name) {
    case 'get_wenyanwen_list': {
      const query: any = {};
      if (args.keyword) {
        query.$or = [
          { 'meta.title': { $regex: args.keyword, $options: 'i' } },
          { 'meta.author': { $regex: args.keyword, $options: 'i' } },
        ];
      }
      const data = await Wenyanwen.find(query).select('meta').lean();
      return { success: true, data };
    }
    case 'get_wenyanwen_detail': {
      const data = await Wenyanwen.findById(args.id).lean();
      return { success: true, data };
    }
    case 'update_wenyanwen': {
      return {
        success: true,
        pendingApproval: true,
        id: args.id,
        data: args.data,
        reason: args.reason,
      };
    }
    default:
      return { success: false, error: '未知函数' };
  }
}

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.AI_API_KEY;
    const baseUrl = process.env.AI_BASE_URL || 'https://api.openai.com/v1';
    const model = process.env.AI_MODEL || 'gpt-3.5-turbo';

    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: '请配置 AI_API_KEY 环境变量' },
        { status: 500 }
      );
    }

    const { messages, context } = await request.json();

    const systemMessage = {
      role: 'system',
      content: `你是一个专业的文言文助手，擅长文言文翻译、虚词用法分析、语法讲解等。

你可以帮助用户查看和修改文言文数据。
- 查看数据：直接调用函数获取
- 修改数据：先调用函数提出修改建议，系统会要求用户确认后才执行修改

文言文数据格式：
{
  meta: { title: "标题", author: "作者", book: "教材" },
  contents: [
    {
      origin: "原文",
      translations: [{ content: "翻译", types: ["直译"], start: 0, end: 2 }],
      pronunciations: [{ index: 0, pinyin: "pin yin" }]
    }
  ]
}

translations 中的 start/end 是 0-based 左闭右开区间 [start, end)。
types 可以是：直译、意译、补充内容、通假字、古今异义、词类活用、倒装句等。
补充内容的 start/end 为 null。

虚词数据是静态的，包含：之、其、而、以、于、乃、为、因。

${context ? `\n当前页面数据:\n${JSON.stringify(context, null, 2)}` : ''}

请用简洁明了的中文回答用户的问题。`,
    };

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [systemMessage, ...messages],
        tools,
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json(
        { success: false, error: `API 错误: ${error}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    const choice = data.choices?.[0];

    if (choice?.message?.tool_calls) {
      const toolCall = choice.message.tool_calls[0];
      const funcName = toolCall.function.name;
      const funcArgs = JSON.parse(toolCall.function.arguments);

      const result = await executeFunction(funcName, funcArgs);

      return NextResponse.json({
        success: true,
        toolCall: {
          id: toolCall.id,
          name: funcName,
          args: funcArgs,
          result,
        },
      });
    }

    const content = choice?.message?.content || '抱歉，无法生成回答';
    return NextResponse.json({ success: true, data: content });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || '请求失败' },
      { status: 500 }
    );
  }
}
