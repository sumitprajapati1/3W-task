import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Trophy, Crown, Medal, Star, Plus, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Default avatar colors for when no image is available
const getAvatarColor = (name: string) => {
  const colors = [
    'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 
    'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'
  ];
  const index = name.length % colors.length;
  return colors[index];
};

interface User {
  _id: string;
  name: string;
  totalPoints: number;
  rank: number;
}

interface ClaimHistory {
  _id: string;
  userId: string;
  userName: string;
  pointsAwarded: number;
  totalPointsAfterClaim: number;
  timestamp: string;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

const LeaderboardApp: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [newUserName, setNewUserName] = useState('');
  const [showAddUser, setShowAddUser] = useState(false);
  const [claimHistory, setClaimHistory] = useState<ClaimHistory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Fetch users on component mount
  useEffect(() => {
    fetchUsers();
    fetchHistory();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/users`);
      setUsers(response.data);
      // Set first user as selected by default
      if (response.data.length > 0 && !selectedUserId) {
        setSelectedUserId(response.data[0]._id);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive"
      });
    }
  };

  const fetchHistory = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/history`);
      setClaimHistory(response.data.slice(0, 10)); // Show only last 10 entries
    } catch (error) {
      console.error('Failed to fetch history:', error);
    }
  };

  const handleClaimPoints = async () => {
    if (!selectedUserId) {
      toast({
        title: "Error",
        description: "Please select a user first",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/claim`, {
        userId: selectedUserId
      });

      const { pointsAwarded, leaderboard } = response.data;
      setUsers(leaderboard);
      
      toast({
        title: "Points Claimed! 🎉",
        description: `Awarded ${pointsAwarded} points!`,
      });

      fetchHistory(); // Refresh history
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to claim points",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddUser = async () => {
    if (!newUserName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a user name",
        variant: "destructive"
      });
      return;
    }

    try {
      await axios.post(`${API_BASE_URL}/users`, {
        name: newUserName.trim()
      });

      setNewUserName('');
      setShowAddUser(false);
      fetchUsers();
      
      toast({
        title: "Success",
        description: "User added successfully!",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to add user",
        variant: "destructive"
      });
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-6 h-6 text-trophy-gold" />;
      case 2:
        return <Trophy className="w-6 h-6 text-trophy-silver" />;
      case 3:
        return <Medal className="w-6 h-6 text-trophy-bronze" />;
      default:
        return <span className="w-6 h-6 flex items-center justify-center text-sm font-bold text-muted-foreground">{rank}</span>;
    }
  };

  const getTopThreeBackground = (rank: number) => {
    if (rank <= 3) {
      return 'bg-winner-bg border-winner-border';
    }
    return 'bg-card';
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--gradient-primary)' }}>
      {/* Header */}
      <div className="bg-primary/10 backdrop-blur-sm border-b border-primary/20">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-primary-foreground flex items-center gap-2">
              <Trophy className="w-6 h-6" />
              Leaderboard
            </h1>
            <div className="text-sm text-primary-foreground/80">
              {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* User Selection & Claim Section */}
        <Card className="p-4 bg-card/95 backdrop-blur-sm">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Select Player
          </h2>
          
          <div className="space-y-4">
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose a player" />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user._id} value={user._id}>
                    <div className="flex items-center justify-between w-full">
                      <span>{user.name}</span>
                      <span className="text-sm text-muted-foreground ml-2">
                        {user.totalPoints} pts
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              <Button 
                onClick={handleClaimPoints} 
                disabled={isLoading}
                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {isLoading ? 'Claiming...' : 'Claim Points'}
              </Button>
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => setShowAddUser(!showAddUser)}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {showAddUser && (
              <div className="flex gap-2 pt-2 border-t">
                <Input
                  placeholder="Enter new player name"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddUser()}
                />
                <Button onClick={handleAddUser}>Add</Button>
              </div>
            )}
          </div>
        </Card>

        {/* Leaderboard */}
        <Card className="p-4 bg-card/95 backdrop-blur-sm">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Star className="w-5 h-5" />
            Rankings
          </h2>
          
          <div className="space-y-2">
            {users.map((user) => (
              <div
                key={user._id}
                className={`flex items-center justify-between p-3 rounded-lg border transition-all ${getTopThreeBackground(user.rank)}`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center">
                    {getRankIcon(user.rank)}
                  </div>
                  
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm ${getAvatarColor(user.name)}`}>
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  
                  <div>
                    <p className="font-medium text-card-foreground">{user.name}</p>
                    <p className="text-sm text-muted-foreground">Rank #{user.rank}</p>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className="font-bold text-lg text-primary">{user.totalPoints}</p>
                  <p className="text-sm text-muted-foreground">points</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Recent Activity */}
        {claimHistory.length > 0 && (
          <Card className="p-4 bg-card/95 backdrop-blur-sm">
            <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
            <div className="space-y-2">
              {claimHistory.slice(0, 5).map((entry) => (
                <div key={entry._id} className="flex items-center justify-between p-2 rounded border bg-muted/50">
                  <div>
                    <p className="text-sm font-medium">{entry.userName}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(entry.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-green-600">+{entry.pointsAwarded}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default LeaderboardApp;