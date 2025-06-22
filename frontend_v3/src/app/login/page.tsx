"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Brain, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { auth } from "@/lib/api";

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const clientId = formData.get("client_id") as string;
    const clientSecret = formData.get("client_secret") as string;

    try {
      // Try backend API first, fallback to local validation
      try {
        // Attempt real API authentication
        const response = await auth.login(clientId, clientSecret);
        
        // Store additional user info
        localStorage.setItem("client_id", clientId);
        localStorage.setItem("token_expires", (Date.now() + response.expires_in * 1000).toString());
        
        // Redirect to dashboard
        router.push("/dashboard");
        return;
        
      } catch (apiError) {
        console.log("Backend API not available, using local validation:", apiError);
        
        // Fallback to local validation for development
        if (clientId === "rabby_lead_gen_mvp_test" && clientSecret === "egqCnbS%!IsPY)Qk8nWJkSEE") {
          // Simulate API call delay
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Store authentication token (demo mode)
          localStorage.setItem("access_token", "demo_token_" + Date.now());
          localStorage.setItem("client_id", clientId);
          localStorage.setItem("demo_mode", "true");
          
          // Redirect to dashboard
          router.push("/dashboard");
        } else {
          setError("Invalid client credentials. Please check your Client ID and Secret.");
        }
      }
      
    } catch (err) {
      console.error("Authentication error:", err);
      setError("Authentication failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden relative">
      {/* Background Effects */}
      <div className="fixed inset-0 z-0">
        <div className="absolute top-20 left-20 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 flex flex-col justify-center items-center min-h-screen px-4">
        {/* Back to home */}
        <div className="absolute top-8 left-8">
          <Link href="/" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back to home</span>
          </Link>
        </div>

        {/* Logo */}
        <div className="mb-8">
          <Link href="/" className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Brain className="w-7 h-7 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-bold text-white">LeadIntel</span>
              <span className="text-sm text-gray-400">Intelligence Platform</span>
            </div>
          </Link>
        </div>

        {/* Login Card */}
        <Card className="w-full max-w-md bg-black/50 border-white/10 backdrop-blur-sm">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-bold text-white">Welcome back</CardTitle>
            <CardDescription className="text-gray-400">
              Enter your credentials to access the company intelligence dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="client_id" className="text-white font-medium">Client ID</Label>
                <Input
                  id="client_id"
                  name="client_id"
                  type="text"
                  placeholder="Enter your client ID"
                  required
                  defaultValue="rabby_lead_gen_mvp_test"
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-blue-500 focus:bg-white/10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="client_secret" className="text-white font-medium">Client Secret</Label>
                <Input
                  id="client_secret"
                  name="client_secret"
                  type="password"
                  placeholder="Enter your client secret"
                  required
                  defaultValue="egqCnbS%!IsPY)Qk8nWJkSEE"
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-blue-500 focus:bg-white/10"
                />
              </div>
              
              {error && (
                <Alert className="border-red-500/20 bg-red-500/10">
                  <AlertDescription className="text-red-400">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium py-6" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  "Access Dashboard"
                )}
              </Button>
            </form>
            
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500">
                Demo credentials are pre-filled for testing
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}