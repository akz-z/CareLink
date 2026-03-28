export async function POST(request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return Response.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Access global storage
    const users = global.users || new Map();

    // Check if user exists
    const userExists = users.has(email);

    return Response.json(
      {
        exists: userExists,
      },
      { status: 200 }
    );
  } catch (error) {
    return Response.json(
      { error: "Check failed" },
      { status: 500 }
    );
  }
}
