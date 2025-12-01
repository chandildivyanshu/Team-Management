import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                empId: { label: "Employee ID", type: "text" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.empId || !credentials?.password) {
                    throw new Error("Invalid credentials");
                }

                await dbConnect();

                const user = await User.findOne({ empId: credentials.empId });

                if (!user) {
                    throw new Error("User not found");
                }

                const isValid = await bcrypt.compare(credentials.password, user.passwordHash);

                if (!isValid) {
                    throw new Error("Invalid password");
                }

                if (!user.active) {
                    throw new Error("User account is inactive");
                }

                return {
                    id: user._id.toString(),
                    name: user.name,
                    email: user.empId, // Using empId as email for NextAuth compatibility/uniqueness
                    image: user.profilePicUrl,
                    role: user.role,
                    mobile: user.mobile,
                };
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user, trigger, session }) {
            if (user) {
                token.role = user.role;
                token.id = user.id;
                token.picture = user.image;
                token.mobile = user.mobile;
            }
            if (trigger === "update") {
                if (session?.image) token.picture = session.image;
                if (session?.name) token.name = session.name;
                if (session?.mobile) token.mobile = session.mobile;
            }
            return token;
        },
        async session({ session, token }) {
            if (session?.user) {
                session.user.role = token.role;
                session.user.id = token.id as string;
                session.user.image = token.picture;
                session.user.mobile = token.mobile;
            }
            return session;
        },
    },
    pages: {
        signIn: "/auth/signin",
    },
    session: {
        strategy: "jwt",
    },
    secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
