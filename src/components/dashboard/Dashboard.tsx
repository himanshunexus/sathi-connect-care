import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { MessageCircle, Video, Calendar, User, LogOut, Heart } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { AppointmentDashboard } from '@/components/appointments/AppointmentDashboard';
import { VideoCallInterface } from '@/components/video/VideoCallInterface';

type TabType = 'overview' | 'chat' | 'appointments' | 'video' | 'profile';

export function Dashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const { profile, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  const navigation = [
    { id: 'overview', label: 'Overview', icon: Heart },
    { id: 'chat', label: 'Chat', icon: MessageCircle },
    { id: 'appointments', label: 'Appointments', icon: Calendar },
    { id: 'video', label: 'Video Calls', icon: Video },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'chat':
        return <ChatInterface />;
      case 'appointments':
        return <AppointmentDashboard />;
      case 'video':
        return <VideoCallInterface />;
      case 'profile':
        return <ProfileView profile={profile} />;
      default:
        return <OverviewDashboard profile={profile} setActiveTab={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="flex h-screen">
        {/* Sidebar */}
        <div className="w-64 bg-card border-r border-border">
          <div className="p-6">
            <div className="flex items-center space-x-2 mb-8">
              <Heart className="h-8 w-8 text-primary" />
              <h1 className="text-xl font-bold text-foreground">Sathi Portal</h1>
            </div>
            
            <div className="mb-6 p-4 bg-muted rounded-lg">
              <p className="font-medium text-foreground">
                {profile?.first_name} {profile?.last_name}
              </p>
              <p className="text-sm text-muted-foreground capitalize">{profile?.role}</p>
            </div>

            <nav className="space-y-2">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Button
                    key={item.id}
                    variant={activeTab === item.id ? 'default' : 'ghost'}
                    className="w-full justify-start"
                    onClick={() => setActiveTab(item.id as TabType)}
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    {item.label}
                  </Button>
                );
              })}
            </nav>

            <div className="mt-auto pt-6">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={handleSignOut}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-hidden">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}

function OverviewDashboard({ profile, setActiveTab }: { profile: any; setActiveTab: (tab: TabType) => void }) {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">
          Welcome back, {profile?.first_name}!
        </h1>
        <p className="text-muted-foreground">
          Here's what's happening with your mental health journey today.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab('chat')}>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MessageCircle className="mr-2 h-5 w-5 text-primary" />
              Start Chat
            </CardTitle>
            <CardDescription>
              Connect with a counselor for support
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Get instant support through our secure chat system
            </p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab('appointments')}>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="mr-2 h-5 w-5 text-primary" />
              Book Appointment
            </CardTitle>
            <CardDescription>
              Schedule a session with a counselor
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Book video or in-person sessions at your convenience
            </p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab('video')}>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Video className="mr-2 h-5 w-5 text-primary" />
              Video Sessions
            </CardTitle>
            <CardDescription>
              Join or start video consultations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Secure video calls with your counselors
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Tips</CardTitle>
            <CardDescription>Daily mental health reminders</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li>• Take deep breaths when feeling overwhelmed</li>
              <li>• Stay hydrated and maintain a sleep schedule</li>
              <li>• Reach out for support when needed</li>
              <li>• Practice mindfulness for 5 minutes daily</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Emergency Resources</CardTitle>
            <CardDescription>Immediate help when you need it</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p><strong>Crisis Hotline:</strong> 988</p>
              <p><strong>Campus Security:</strong> 911</p>
              <p><strong>Student Health Center:</strong> (555) 123-4567</p>
              <Button className="w-full mt-4" variant="destructive">
                Emergency Chat
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ProfileView({ profile }: { profile: any }) {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-foreground mb-6">Profile</h1>
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Name</Label>
            <p className="text-sm font-medium">{profile?.first_name} {profile?.last_name}</p>
          </div>
          <div>
            <Label>Email</Label>
            <p className="text-sm font-medium">{profile?.email}</p>
          </div>
          <div>
            <Label>Role</Label>
            <p className="text-sm font-medium capitalize">{profile?.role}</p>
          </div>
          <div>
            <Label>Member Since</Label>
            <p className="text-sm font-medium">
              {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'Unknown'}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}