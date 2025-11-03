import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
})

export async function POST(request: NextRequest) {
  try {
    const { message, skill, history } = await request.json()

    // TODO: Load skill context from skills folder
    // For now, use basic system prompt
    const systemPrompt = `You are an HR assistant powered by Claude. You help with:
- Creating HR documents (offer letters, PIPs, termination letters)
- Recruiting and interviewing
- Performance management
- HR analytics and reporting
- Employee relations

Be professional, helpful, and ensure all advice is legally sound. When creating documents,
ask for all required information before generating.`

    const messages = [
      ...history.map((msg: any) => ({
        role: msg.role,
        content: msg.content
      })),
      {
        role: 'user',
        content: message
      }
    ]

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: systemPrompt,
      messages
    })

    const reply = response.content[0].type === 'text' ? response.content[0].text : ''

    return NextResponse.json({ reply })
  } catch (error: any) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: 'Failed to process message', details: error.message },
      { status: 500 }
    )
  }
}
