import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete('tcc_auth_token');
  
  return NextResponse.json({ success: true });
}
