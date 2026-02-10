'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { User, LogOut, Check, Loader2, Trophy, Flame } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ProfilePage() {
  const { user, logout, updateDisplayName, loading: authLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const [newName, setNewName] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const userRef = useMemoFirebase(() => 
    firestore && user ? doc(firestore, 'users', user.uid) : null
  , [firestore, user]);

  const { data: profileData, isLoading: profileLoading } = useDoc<any>(userRef);

  useEffect(() => {
    if (user) {
      setNewName(user.displayName);
    }
  }, [user]);

  if (authLoading || profileLoading) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </main>
    );
  }

  if (!user) {
    router.push('/');
    return null;
  }

  const handleUpdateName = async () => {
    if (!newName.trim() || newName === user.displayName) return;
    
    setIsUpdating(true);
    try {
      await updateDisplayName(newName);
      toast({
        title: "Profile Updated",
        description: "Your display name has been changed successfully."
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: err.message
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  return (
    <main className="min-h-screen bg-background p-6 flex flex-col items-center justify-center">
      <div className="w-full max-w-md space-y-6 pb-20">
        <div className="text-center space-y-2 mb-4">
          <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-primary/50">
            <User className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-3xl font-black italic tracking-tighter uppercase">
            Player <span className="text-primary">Profile</span>
          </h2>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
            {profileData?.role === 'ADMIN' ? 'Authorized Administrator' : 'Pro League Player'}
          </p>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-card/50 border-white/5 text-center p-4">
             <Trophy className="w-5 h-5 text-primary mx-auto mb-1" />
             <span className="block text-[8px] font-black uppercase text-muted-foreground">Lifetime Points</span>
             <span className="text-xl font-black italic">{profileData?.points || 0}</span>
          </Card>
          <Card className="bg-card/50 border-white/5 text-center p-4">
             <Flame className="w-5 h-5 text-secondary mx-auto mb-1" />
             <span className="block text-[8px] font-black uppercase text-muted-foreground">Current Streak</span>
             <span className="text-xl font-black italic">x{profileData?.streak || 0}</span>
          </Card>
        </div>

        {/* Edit Info */}
        <Card className="bg-card/50 border-white/5">
          <CardHeader>
            <CardTitle className="text-sm font-black uppercase tracking-widest">Personal Info</CardTitle>
            <CardDescription className="text-xs font-bold">Manage how you appear on the gridiron.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase opacity-50">Display Name</label>
              <div className="flex gap-2">
                <Input 
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="h-12 font-bold text-lg"
                  placeholder="Username"
                />
                <Button 
                  onClick={handleUpdateName} 
                  disabled={isUpdating || !newName.trim() || newName === user.displayName}
                  className="h-12 w-12"
                  size="icon"
                >
                  {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-5 h-5" />}
                </Button>
              </div>
            </div>
            
            <div className="pt-2">
               <div className="bg-white/5 rounded-lg p-3 border border-white/5">
                  <span className="block text-[8px] font-black text-muted-foreground uppercase mb-1">Account ID</span>
                  <span className="text-[10px] font-mono break-all opacity-60">{user.uid}</span>
               </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              variant="destructive" 
              onClick={handleLogout}
              className="w-full h-12 font-black italic uppercase"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </CardFooter>
        </Card>

        {user.uid.startsWith('guest_') && (
          <p className="text-[10px] text-center text-muted-foreground font-bold uppercase tracking-tight px-8">
            You are playing as a <span className="text-primary">Guest</span>. Create a permanent account to save your global rank and stats.
          </p>
        )}
      </div>
    </main>
  );
}
