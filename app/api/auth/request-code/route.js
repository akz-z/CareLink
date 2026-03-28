// For login - request verification code
function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return Response.json(
        { error: "Email is required" },
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

    // Generate verification code
    const code = generateVerificationCode();
    const verificationCodes = global.verificationCodes || new Map();
    verificationCodes.set(email, {
      code: code,
      createdAt: Date.now(),
      attempts: 0,
    });
    global.verificationCodes = verificationCodes;

    console.log(`Login verification code for ${email}: ${code}`);

    return Response.json(
      {
        success: true,
        message: "Verification code sent to email",
        verificationCode: code,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Request code error:", error);
    return Response.json(
      { error: "Request failed" },
      { status: 500 }
    );
  }
}
