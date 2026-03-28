// In-memory storage (use database in production)
let users = new Map();
let verificationCodes = new Map();

function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Initialize with global scope
global.users = users;
global.verificationCodes = verificationCodes;

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    // Validate inputs
    if (!email || !password) {
      return Response.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return Response.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return Response.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    // Check if user already exists
    users = global.users || new Map();
    if (users.has(email)) {
      return Response.json(
        { error: "Email already registered" },
        { status: 400 }
      );
    }

    // Generate verification code
    const code = generateVerificationCode();
    verificationCodes = global.verificationCodes || new Map();
    verificationCodes.set(email, {
      code: code,
      password: password,
      createdAt: Date.now(),
      attempts: 0,
    });
    global.verificationCodes = verificationCodes;

    console.log(`Signup verification code for ${email}: ${code}`);

    return Response.json(
      {
        success: true,
        message: "Verification code sent to email",
        email: email,
        verificationCode: code,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Signup error:", error);
    return Response.json(
      { error: "Signup failed" },
      { status: 500 }
    );
  }
}
