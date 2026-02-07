
'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { ArrowLeft, Loader2, ShieldAlert } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AdminLoginPage() {
  const router = useRouter();
  const { login } = useUser();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Explicitly pass 'admin' or full email to the login function
      await login(username.trim(), password);
      router.push('/lobby');
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Access Denied",
        description: "Invalid credentials. Use 'admin' and 'password' for defaults."
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

        <Card className="bg-card/50 border-primary/20 shadow-2xl overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-primary" />
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <ShieldAlert className="w-5 h-5 text-primary" />
              <span className="text-[10px] font-black text-primary uppercase tracking-[4px]">Secure Access</span>
            </div>
            <CardTitle className="text-2xl font-black italic uppercase">Admin Control</CardTitle>
            <CardDescription className="text-xs font-bold text-muted-foreground">Authorized personnel only.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase opacity-50">Username</label>
                <Input 
                  value={username} 
                  onChange={e => setUsername(e.target.value)} 
                  required 
                  placeholder="admin" 
                  className="bg-black/20"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase opacity-50">Password</label>
                <Input 
                  type="password" 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  required 
                  placeholder="••••••••" 
                  className="bg-black/20"
                />
              </div>
              <Button type="submit" className="w-full h-14 font-black italic text-lg" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "AUTHENTICATE"}
              </Button>
            </form>
          </CardContent>
          <div className="p-4 bg-primary/5 text-center">
             <p className="text-[8px] font-bold text-primary uppercase tracking-widest opacity-60">
               Default: admin / password
             </p>
          </div>
        </Card>
      </div>
    </main>
  );
}
