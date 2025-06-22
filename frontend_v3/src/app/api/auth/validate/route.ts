// Server-side authentication validation API route
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clientId, clientSecret } = body;

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { error: 'Missing client credentials' },
        { status: 400 }
      );
    }

    // Validate against environment variables (server-side only)
    const validClientId = process.env.AUTH_CLIENT_ID;
    const validClientSecret = process.env.AUTH_CLIENT_SECRET;

    if (!validClientId || !validClientSecret) {
      console.error('Server environment variables not configured');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Check credentials
    if (clientId === validClientId && clientSecret === validClientSecret) {
      // Generate a simple token (in production, use proper JWT)
      const token = `demo_token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      return NextResponse.json({
        success: true,
        token,
        expires_in: 86400, // 24 hours
        message: 'Authentication successful'
      });
    } else {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

  } catch (error) {
    console.error('Authentication error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}