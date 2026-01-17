# Deployment Guide

This guide will help you deploy the Sirr (سرّ) application to Vercel and set up Supabase.

## Prerequisites

- GitHub account
- Supabase account (free tier)
- Vercel account (free tier)

## Step 1: Set Up Supabase

1. **Create a Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Click "New Project"
   - Choose a name and database password
   - Select a region close to your users
   - Wait for the project to be created

2. **Run Database Migrations**
   - Go to your Supabase project dashboard
   - Navigate to "SQL Editor"
   - Copy the contents of `supabase/migrations/001_initial_schema.sql`
   - Paste and run the SQL script
   - Verify all tables are created (users, conversations, messages, etc.)

3. **Get Your Supabase Credentials**
   - Go to "Settings" > "API"
   - Copy your "Project URL" (this is your `VITE_SUPABASE_URL`)
   - Copy your "anon public" key (this is your `VITE_SUPABASE_ANON_KEY`)

4. **Set Up Edge Function for Auto-Delete**
   - Install Supabase CLI: `npm install -g supabase`
   - Login: `supabase login`
   - Link your project: `supabase link --project-ref your-project-ref`
   - Deploy the function: `supabase functions deploy delete-expired-messages`
   - Set up a cron job in Supabase dashboard:
     - Go to "Database" > "Cron Jobs"
     - Create a new cron job that calls the function hourly:
       ```sql
       SELECT cron.schedule(
         'delete-expired-messages',
         '0 * * * *', -- Every hour
         $$
         SELECT net.http_post(
           url := 'https://your-project-ref.supabase.co/functions/v1/delete-expired-messages',
           headers := '{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb
         ) AS request_id;
         $$
       );
       ```

## Step 2: Set Up GitHub Repository

1. **Create a New Repository**
   - Go to GitHub and create a new repository
   - Name it `sirr` (or your preferred name)
   - Don't initialize with README (we already have one)

2. **Push Your Code**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/your-username/sirr.git
   git push -u origin main
   ```

## Step 3: Deploy to Vercel

1. **Connect GitHub to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Sign in with GitHub
   - Click "Add New Project"
   - Select your `sirr` repository
   - Click "Import"

2. **Configure Environment Variables**
   - In the "Environment Variables" section, add:
     - `VITE_SUPABASE_URL`: Your Supabase project URL
     - `VITE_SUPABASE_ANON_KEY`: Your Supabase anon key
   - Click "Deploy"

3. **Configure Build Settings**
   - Vercel should auto-detect Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

4. **Deploy**
   - Vercel will automatically deploy on every push to `main`
   - Your app will be available at `https://your-project.vercel.app`

## Step 4: Post-Deployment

1. **Update Supabase RLS Policies** (if needed)
   - Verify RLS policies are working correctly
   - Test authentication flow

2. **Test the Application**
   - Create a test account
   - Send a test message
   - Verify real-time messaging works
   - Test theme switching
   - Verify messages auto-delete after 72 hours

3. **Monitor Usage**
   - Check Supabase dashboard for database usage
   - Monitor Vercel bandwidth usage
   - Stay within free tier limits

## Troubleshooting

### Build Errors
- Check that all environment variables are set in Vercel
- Verify `package.json` dependencies are correct
- Check Vercel build logs for specific errors

### Supabase Connection Issues
- Verify environment variables are correct
- Check Supabase project is active (not paused)
- Verify RLS policies allow your operations

### Real-time Not Working
- Check Supabase Realtime is enabled
- Verify WebSocket connections are allowed
- Check browser console for errors

## Free Tier Limits

### Vercel
- 100 GB bandwidth/month
- Unlimited deployments
- Automatic HTTPS

### Supabase
- 500 MB database storage
- 50,000 monthly active users
- 5 GB egress bandwidth/month
- Projects pause after 1 week of inactivity

## Next Steps

- Set up custom domain (optional)
- Configure analytics (optional)
- Set up monitoring and error tracking (optional)
- Add more features as needed
