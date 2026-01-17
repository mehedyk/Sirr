# Sirr (سرّ)

A security-focused messaging application with end-to-end encryption, real-time messaging, and cyber security themed UI.

## Features

- 🔐 **End-to-End Encryption**: AES-256 encryption for all messages
- 💬 **Real-Time Messaging**: Instant message delivery via Supabase Realtime
- 👥 **Group Chats**: Support for group conversations (up to 20 members)
- 📞 **Voice/Video Calls**: WebRTC-based calls (1-on-1 and groups)
- 🎨 **5 Cyber Security Themes**: Neo Noir, Digital Matrix, Midnight Tech, Tech Rust, Solar Shift
- ⏰ **Auto-Delete Messages**: Messages automatically deleted after 72 hours
- 🔑 **Secure Key Management**: Singleton pattern for key management
- 🏗️ **OOP Architecture**: Clean code with design patterns (Singleton, Factory, Observer, Strategy, Adapter, Decorator)

## Technology Stack

- **Frontend**: React + Vite + TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Realtime)
- **Encryption**: Web Crypto API (AES-256)
- **Deployment**: Vercel (Frontend), Supabase (Backend)

## Getting Started

### Prerequisites

- Node.js 18+
- Supabase account (free tier)
- Vercel account (free tier)

### Setup

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd sirr
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase**
   - Create a new Supabase project
   - Run the migration file: `supabase/migrations/001_initial_schema.sql`
   - Get your Supabase URL and anon key

4. **Configure environment variables**
   - Copy `.env.example` to `.env`
   - Add your Supabase credentials:
     ```
     VITE_SUPABASE_URL=your_supabase_url
     VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
     ```

5. **Set up Edge Function for auto-delete**
   - Deploy the Edge Function: `supabase/functions/delete-expired-messages/`
   - Set up a cron job to call this function hourly (via Supabase dashboard)

6. **Deploy to Vercel**
   - Connect your GitHub repository to Vercel
   - Add environment variables in Vercel dashboard
   - Deploy!

## Project Structure

```
sirr/
├── src/
│   ├── components/       # React components
│   ├── domain/          # OOP domain models
│   ├── services/        # Service layer with design patterns
│   ├── observers/       # Observer pattern implementations
│   ├── decorators/     # Decorator pattern implementations
│   ├── hooks/          # React hooks
│   ├── store/          # State management
│   ├── styles/         # CSS and themes
│   └── utils/          # Utility functions
├── supabase/
│   ├── migrations/     # Database migrations
│   └── functions/      # Edge Functions
└── public/             # Static assets
```

## Design Patterns Used

- **Singleton**: ThemeManager, KeyManager
- **Factory**: MessageFactory, ThemeFactory
- **Observer**: MessageObserver, ThemeObserver, ConnectionObserver
- **Strategy**: EncryptionService (swappable encryption strategies)
- **Adapter**: SupabaseAdapter (wraps Supabase client)
- **Decorator**: MessageDecorator, LoggingDecorator

## Security Features

- AES-256 encryption for all messages
- HMAC for message integrity verification
- PBKDF2 for key derivation
- Row Level Security (RLS) policies in Supabase
- Secure key exchange for direct and group chats
- Auto-deletion of messages after 72 hours

## Themes

1. **Neo Noir**: Dark with neon blue/green accents
2. **Digital Matrix**: Matrix-style green on black
3. **Midnight Tech**: GitHub dark-inspired with purple accents
4. **Tech Rust**: Industrial rust/orange theme
5. **Solar Shift**: Cosmic space theme with gold/red/yellow

## Free Tier Considerations

- **Vercel**: Unlimited deployments, 100 GB bandwidth/month
- **Supabase**: 500 MB database, 50K MAU, 5 GB egress/month
- All encryption uses built-in Web Crypto API (no library costs)

## License

MIT
