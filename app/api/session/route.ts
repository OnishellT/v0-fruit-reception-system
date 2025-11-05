import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('user_session');

    if (!sessionCookie) {
      return NextResponse.json(null, { status: 401 });
    }

    const session = JSON.parse(sessionCookie.value);

    return NextResponse.json({
      id: session.id,
      username: session.username,
      role: session.role,
    });
  } catch (error) {
    console.error('Error parsing session:', error);
    return NextResponse.json(null, { status: 401 });
  }
}