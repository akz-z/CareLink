export async function POST(request) {
  try {
    const { email, password } = await request.json();

    // Basic validation
    if (!email || !password) {
      return Response.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return Response.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Simple authentication - in production, verify against a database
    // For MVP, we'll create a mock user session
    const user = {
      id: Math.random().toString(36).substr(2, 9),
      email: email,
      name: email.split("@")[0],
      loginTime: new Date().toISOString(),
    };

    // Return user data and a simple token
    return Response.json(
      {
        success: true,
        user: user,
        token: btoa(JSON.stringify(user)), // Simple base64 token for MVP
      },
      { status: 200 }
    );
  } catch (error) {
    return Response.json(
      { error: "Login failed" },
      { status: 500 }
    );
  }
}
