// Simple mock authentication API
// In production, this would validate against a real database

export async function POST(request) {
  const { email, password } = await request.json();

  // Demo credentials
  const DEMO_EMAIL = "demo@carelink.com";
  const DEMO_PASSWORD = "demo123";

  // Validate inputs
  if (!email || !password) {
    return Response.json(
      { message: "Email and password are required" },
      { status: 400 }
    );
  }

  // Check against demo credentials (in production, validate against database)
  if (email === DEMO_EMAIL && password === DEMO_PASSWORD) {
    const user = {
      id: "1",
      email: email,
      name: "Demo User",
      joinDate: new Date().toISOString(),
    };

    // Generate a simple token (in production, use JWT or similar)
    const token = Buffer.from(
      JSON.stringify({ email, iat: Date.now() })
    ).toString("base64");

    return Response.json(
      {
        user,
        token,
        message: "Login successful",
      },
      { status: 200 }
    );
  }

  // Invalid credentials
  return Response.json(
    { message: "Invalid email or password" },
    { status: 401 }
  );
}
