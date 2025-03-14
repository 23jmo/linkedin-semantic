import { FaLinkedin } from "react-icons/fa";
import { auth, signIn } from "@/auth";
import SignIn from "./sign-in";

export default function AuthPrompt() {
  return (
    <div className="w-full bg-white p-6 rounded-lg shadow-md text-center">
      <SignIn />
    </div>
  );
}
