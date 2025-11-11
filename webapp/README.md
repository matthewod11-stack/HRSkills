# HR Command Center - Web Application

Next.js-based web interface for the HR automation platform.

## Features

- **Chat Interface** - Interact with Claude using HR skills
- **Metrics Dashboard** - Real-time HR metrics from Rippling
- **Document Generation** - Create offer letters, PIPs, etc.
- **Agent Monitoring** - View status of automation agents

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy `.env.local` from root to webapp directory:

```bash
cp ../.env.local .env.local
```

### 3. Start Development Server

```bash
npm run dev
```

Visit: http://localhost:3000

## Project Structure

```
webapp/
├── app/
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Homepage (dashboard + chat)
│   ├── globals.css         # Global styles
│   └── api/                # API routes
│       ├── chat/           # Chat endpoint
│       ├── metrics/        # Metrics endpoint
│       └── skills/         # Skills management
├── components/
│   ├── chat/               # Chat UI components
│   ├── dashboard/          # Dashboard components
│   └── layout/             # Layout components
├── lib/                    # Utilities
├── types/                  # TypeScript types
└── public/                 # Static assets
```

## Available Routes

- `/` - Homepage (dashboard + chat)
- `/api/chat` - Chat with Claude (POST)
- `/api/metrics` - Get HR metrics (GET)
- `/api/skills` - List available skills (GET)

## Development

### Adding a New Component

```tsx
// components/MyComponent.tsx
'use client';

export default function MyComponent() {
  return <div>My Component</div>;
}
```

### Creating an API Route

```typescript
// app/api/myroute/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ message: 'Hello' });
}
```

## Deployment

### Build for Production

```bash
npm run build
```

### Deploy to Vercel

```bash
npm install -g vercel
vercel deploy
```

### Deploy to Other Platforms

The app can be deployed to:

- Vercel (easiest)
- Netlify
- AWS (containerized)
- Google Cloud Run
- Any Node.js hosting

## Integration with Skills

Skills are loaded from `../skills/` directory. The chat API loads skill context dynamically when a skill is selected.

## Troubleshooting

**Chat not working**

- Check ANTHROPIC_API_KEY in .env.local
- Verify API key has credits

**Metrics showing mock data**

- Implement Rippling integration in /api/metrics/route.ts
- Add RIPPLING_API_KEY to .env.local

**Build errors**

- Run `npm install` to ensure all dependencies are installed
- Check Node.js version (need 18+)

## Next Steps

1. Implement real Rippling integration for metrics
2. Add skill loader to read from `../skills/` folder
3. Create agent status dashboard
4. Add user authentication
5. Implement document download functionality
