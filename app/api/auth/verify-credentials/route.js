export async function POST(request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return Response.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Access global storage
    const users = global.users || new Map();

    // Check if user exists
    const user = users.get(email);
    if (!user) {
      return Response.json(
        { error: "User not found. Please sign up first." },
        { status: 404 }
      );
    }

    // Verify password
    if (user.password !== password) {
      return Response.json(
        { error: "Invalid password" },
        { status: 401 }
      );
    }

    // Credentials are correct - prepare for OTP
    return Response.json(
      {
        success: true,
        message: "Credentials verified. OTP will be sent to your email.",
        email: email,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Login verification error:", error);
    return Response.json(
      { error: "Login verification failed" },
      { status: 500 }
    );
  }
}
