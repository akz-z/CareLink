export async function POST(request) {
  try {
    return Response.json(
      { success: true, message: "Logged out successfully" },
      { status: 200 }
    );
  } catch (error) {
    return Response.json(
      { error: "Logout failed" },
      { status: 500 }
    );
  }
}
