
'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function LoginPage() {
  const router = useRouter();
  const { login, register } = useUser();
  const { toast } = useToast();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(email, password, name);
      }
      router.push('/lobby');
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Auth Failed",
        description: err.message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background p-6 flex items-center justify-center">
      <div className="w-full max-w-md">
        <Button variant="ghost" onClick={() => router.push('/')} className="mb-6 text-[10px] font-black uppercase">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>

        <Card className="bg-card/50 border-white/5 shadow-2xl">
          <CardHeader>
            <CardTitle className="text-xl font-black uppercase italic italic text-primary">
              {isLogin ? "Player Login" : "Join the Gridiron"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase opacity-50">Display Name</label>
                  <Input value={name} onChange={e => setName(e.target.value)} required placeholder="Username" />
                </div>
              )}
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase opacity-50">Email</label>
                <Input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="name@email.com" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase opacity-50">Password</label>
                <Input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" />
              </div>
              <Button type="submit" className="w-full h-12 font-black italic" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (isLogin ? "LOG IN" : "SIGN UP")}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button variant="link" onClick={() => setIsLogin(!isLogin)} className="text-xs">
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Log in"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </main>
  );
}
