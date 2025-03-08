import { NextResponse } from 'next/server';

// This is a stub function. Replace this with your actual database update logic.
async function updateUser(id: string, username: string, profilePicture: string | null) {
  // For example, if using Prisma:
  // return await prisma.user.update({ where: { id }, data: { username, profilePicture } });
  // For now, simulate a successful update.
  return { id, username, profilePicture };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, username, profilePicture } = body;
    
    if (!id || !username) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    const updatedUser = await updateUser(id, username, profilePicture);
    
    return NextResponse.json({
      message: 'User updated successfully',
      user: updatedUser,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
