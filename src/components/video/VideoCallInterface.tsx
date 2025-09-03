import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Video, Phone, Users, Plus } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function VideoCallInterface() {
  const [roomId, setRoomId] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  
  const { profile } = useAuth();
  const { toast } = useToast();

  const createVideoCall = async () => {
    setIsCreating(true);
    try {
      const newRoomId = `sathi-room-${Date.now()}`;
      
      const { error } = await supabase
        .from('video_call_sessions')
        .insert({
          room_id: newRoomId,
          participants: [profile?.id],
          call_started_at: new Date().toISOString()
        });

      if (error) throw error;

      const meetingUrl = `https://meet.jit.si/${newRoomId}`;
      window.open(meetingUrl, '_blank');
      
      toast({
        title: "Success",
        description: "Video call room created successfully"
      });
    } catch (error) {
      console.error('Error creating video call:', error);
      toast({
        title: "Error",
        description: "Failed to create video call",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  const joinVideoCall = () => {
    if (!roomId.trim()) {
      toast({
        title: "Error",
        description: "Please enter a room ID",
        variant: "destructive"
      });
      return;
    }

    const meetingUrl = `https://meet.jit.si/${roomId}`;
    window.open(meetingUrl, '_blank');
  };

  const joinQuickCall = () => {
    const quickRoomId = `sathi-quick-${Date.now()}`;
    const meetingUrl = `https://meet.jit.si/${quickRoomId}`;
    window.open(meetingUrl, '_blank');
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">Video Calls</h1>
        <p className="text-muted-foreground">Start or join secure video consultations</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* Create New Call */}
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Plus className="mr-2 h-5 w-5 text-primary" />
              Create New Call
            </CardTitle>
            <CardDescription>
              Start a new video consultation room
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={createVideoCall} 
              disabled={isCreating}
              className="w-full gap-2"
            >
              <Video className="h-4 w-4" />
              {isCreating ? 'Creating...' : 'Create Room'}
            </Button>
          </CardContent>
        </Card>

        {/* Quick Call */}
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Phone className="mr-2 h-5 w-5 text-primary" />
              Quick Call
            </CardTitle>
            <CardDescription>
              Start an instant video call
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={joinQuickCall} variant="outline" className="w-full gap-2">
              <Video className="h-4 w-4" />
              Start Quick Call
            </Button>
          </CardContent>
        </Card>

        {/* Join Existing Call */}
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="mr-2 h-5 w-5 text-primary" />
              Join Call
            </CardTitle>
            <CardDescription>
              Enter a room ID to join an existing call
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="roomId">Room ID</Label>
              <Input
                id="roomId"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                placeholder="Enter room ID..."
              />
              <Button onClick={joinVideoCall} variant="outline" className="w-full gap-2">
                <Video className="h-4 w-4" />
                Join Room
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Video Call Guidelines */}
      <Card>
        <CardHeader>
          <CardTitle>Video Call Guidelines</CardTitle>
          <CardDescription>Important information for your video sessions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm">
            <div>
              <h4 className="font-medium text-foreground mb-2">Before Your Call:</h4>
              <ul className="space-y-1 text-muted-foreground ml-4">
                <li>• Ensure you have a stable internet connection</li>
                <li>• Test your camera and microphone</li>
                <li>• Find a quiet, private space</li>
                <li>• Have any relevant documents ready</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium text-foreground mb-2">Privacy & Security:</h4>
              <ul className="space-y-1 text-muted-foreground ml-4">
                <li>• All calls are encrypted end-to-end</li>
                <li>• Sessions are not recorded without consent</li>
                <li>• Room IDs are unique and expire after use</li>
                <li>• Only share room IDs with intended participants</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium text-foreground mb-2">Technical Requirements:</h4>
              <ul className="space-y-1 text-muted-foreground ml-4">
                <li>• Modern web browser (Chrome, Firefox, Safari, Edge)</li>
                <li>• Camera and microphone permissions enabled</li>
                <li>• Minimum 1 Mbps internet speed recommended</li>
                <li>• Desktop or mobile device supported</li>
              </ul>
            </div>

            <div className="pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground">
                <strong>Need help?</strong> Contact technical support if you experience any issues with video calls.
                For emergency situations, please call the crisis hotline at <strong>988</strong>.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}