export async function POST(request) {
  try {
    const { email, code } = await request.json();

    if (!email || !code) {
      return Response.json(
        { error: "Email and verification code are required" },
        { status: 400 }
      );
    }

    // Access global storage
    const users = global.users || new Map();
    const verificationCodes = global.verificationCodes || new Map();

    // Get verification code data
    const verificationData = verificationCodes.get(email);
    if (!verificationData) {
      return Response.json(
        { error: "No verification code found for this email" },
        { status: 400 }
      );
    }

    // Check if code is expired (10 minutes)
    if (Date.now() - verificationData.createdAt > 10 * 60 * 1000) {
      verificationCodes.delete(email);
      global.verificationCodes = verificationCodes;
      return Response.json(
        { error: "Verification code expired" },
        { status: 400 }
      );
    }

    // Check attempts
    if (verificationData.attempts >= 3) {
      verificationCodes.delete(email);
      global.verificationCodes = verificationCodes;
      return Response.json(
        { error: "Too many failed attempts" },
        { status: 400 }
      );
    }

    // Verify code
    if (verificationData.code !== code) {
      verificationData.attempts += 1;
      global.verificationCodes = verificationCodes;
      return Response.json(
        { error: `Invalid verification code. ${3 - verificationData.attempts} attempts remaining` },
        { status: 400 }
      );
    }

    // Code is valid - create user if signup (has password in verification data)
    if (verificationData.password) {
      const user = {
        id: Math.random().toString(36).substr(2, 9),
        email: email,
        name: email.split("@")[0],
        password: verificationData.password,
        createdAt: new Date().toISOString(),
        loginTime: new Date().toISOString(),
      };
      users.set(email, user);
      global.users = users;
      verificationCodes.delete(email);
      global.verificationCodes = verificationCodes;

      return Response.json(
        {
          success: true,
          message: "Account created and verified",
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            createdAt: user.createdAt,
          },
          token: btoa(JSON.stringify({ id: user.id, email: user.email })),
        },
        { status: 200 }
      );
    }

    // For login verification - user already exists
    const user = users.get(email);
    if (!user) {
      return Response.json(
        { error: "User not found" },
        { status: 400 }
      );
    }

    verificationCodes.delete(email);
    global.verificationCodes = verificationCodes;
    user.loginTime = new Date().toISOString();
    global.users = users;

    return Response.json(
      {
        success: true,
        message: "Logged in successfully",
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
        token: btoa(JSON.stringify({ id: user.id, email: user.email })),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Verification error:", error);
    return Response.json(
      { error: "Verification failed" },
      { status: 500 }
    );
  }
}
