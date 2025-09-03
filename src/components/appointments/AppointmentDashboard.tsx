import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock, Video, MessageCircle, Plus } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { Database } from '@/integrations/supabase/types';

type Appointment = Database['public']['Tables']['appointments']['Row'] & {
  student: Database['public']['Tables']['profiles']['Row'];
  counselor: Database['public']['Tables']['profiles']['Row'];
};

export function AppointmentDashboard() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [counselors, setCounselors] = useState<Database['public']['Tables']['profiles']['Row'][]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);

  const { profile } = useAuth();
  const { toast } = useToast();

  const [appointmentForm, setAppointmentForm] = useState({
    counselor_id: '',
    appointment_type: 'video' as 'video' | 'chat' | 'in_person',
    scheduled_start: '',
    scheduled_end: '',
    reason_for_visit: '',
    is_emergency: false
  });

  useEffect(() => {
    if (profile) {
      fetchAppointments();
      if (profile.role === 'student') {
        fetchCounselors();
      }
    }
  }, [profile]);

  const fetchAppointments = async () => {
    try {
      let query = supabase
        .from('appointments')
        .select(`
          *,
          student:profiles!appointments_student_id_fkey(*),
          counselor:profiles!appointments_counselor_id_fkey(*)
        `)
        .order('scheduled_start', { ascending: true });

      if (profile?.role === 'student') {
        query = query.eq('student_id', profile.id);
      } else {
        query = query.eq('counselor_id', profile?.id);
      }

      const { data, error } = await query;

      if (error) throw error;
      setAppointments(data || []);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      toast({
        title: "Error",
        description: "Failed to load appointments",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCounselors = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'counselor')
        .eq('is_active', true);

      if (error) throw error;
      setCounselors(data || []);
    } catch (error) {
      console.error('Error fetching counselors:', error);
    }
  };

  const createAppointment = async () => {
    if (!profile || !appointmentForm.counselor_id || !appointmentForm.scheduled_start || !appointmentForm.scheduled_end) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setCreateLoading(true);

    try {
      const meetingUrl = appointmentForm.appointment_type === 'video' 
        ? `https://meet.jit.si/sathi-appointment-${Date.now()}`
        : null;

      const { error } = await supabase
        .from('appointments')
        .insert({
          student_id: profile.id,
          counselor_id: appointmentForm.counselor_id,
          appointment_type: appointmentForm.appointment_type,
          scheduled_start: appointmentForm.scheduled_start,
          scheduled_end: appointmentForm.scheduled_end,
          reason_for_visit: appointmentForm.reason_for_visit,
          meeting_url: meetingUrl,
          is_emergency: appointmentForm.is_emergency
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Appointment created successfully"
      });

      setShowCreateDialog(false);
      setAppointmentForm({
        counselor_id: '',
        appointment_type: 'video',
        scheduled_start: '',
        scheduled_end: '',
        reason_for_visit: '',
        is_emergency: false
      });
      
      fetchAppointments();
    } catch (error) {
      console.error('Error creating appointment:', error);
      toast({
        title: "Error",
        description: "Failed to create appointment",
        variant: "destructive"
      });
    } finally {
      setCreateLoading(false);
    }
  };

  const joinVideoCall = (appointment: Appointment) => {
    if (appointment.meeting_url) {
      window.open(appointment.meeting_url, '_blank');
    }
  };

  const canJoinCall = (appointment: Appointment) => {
    const now = new Date();
    const startTime = new Date(appointment.scheduled_start);
    const endTime = new Date(appointment.scheduled_end);
    const joinTime = new Date(startTime.getTime() - 15 * 60000); // 15 minutes before
    
    return now >= joinTime && now <= endTime && 
           appointment.status !== 'cancelled' && 
           appointment.appointment_type === 'video';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Loading appointments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Appointments</h1>
          <p className="text-muted-foreground">Manage your counseling sessions</p>
        </div>
        
        {profile?.role === 'student' && (
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Book Appointment
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Book New Appointment</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="counselor">Counselor</Label>
                  <Select value={appointmentForm.counselor_id} onValueChange={(value) => setAppointmentForm({ ...appointmentForm, counselor_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a counselor" />
                    </SelectTrigger>
                    <SelectContent>
                      {counselors.map((counselor) => (
                        <SelectItem key={counselor.id} value={counselor.id}>
                          {counselor.first_name} {counselor.last_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="type">Appointment Type</Label>
                  <Select value={appointmentForm.appointment_type} onValueChange={(value: 'video' | 'chat' | 'in_person') => setAppointmentForm({ ...appointmentForm, appointment_type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="video">Video Call</SelectItem>
                      <SelectItem value="chat">Chat Session</SelectItem>
                      <SelectItem value="in_person">In Person</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="start">Start Time</Label>
                    <Input
                      id="start"
                      type="datetime-local"
                      value={appointmentForm.scheduled_start}
                      onChange={(e) => setAppointmentForm({ ...appointmentForm, scheduled_start: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="end">End Time</Label>
                    <Input
                      id="end"
                      type="datetime-local"
                      value={appointmentForm.scheduled_end}
                      onChange={(e) => setAppointmentForm({ ...appointmentForm, scheduled_end: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="reason">Reason for Visit</Label>
                  <Textarea
                    id="reason"
                    value={appointmentForm.reason_for_visit}
                    onChange={(e) => setAppointmentForm({ ...appointmentForm, reason_for_visit: e.target.value })}
                    placeholder="Describe what you'd like to discuss..."
                  />
                </div>

                <Button onClick={createAppointment} disabled={createLoading} className="w-full">
                  {createLoading ? 'Creating...' : 'Book Appointment'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {appointments.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No appointments found</h3>
          <p className="text-muted-foreground">
            {profile?.role === 'student' ? "Book your first appointment to get started" : "No appointments scheduled yet"}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {appointments.map((appointment) => {
            const otherUser = profile?.role === 'student' ? appointment.counselor : appointment.student;
            const isUpcoming = new Date(appointment.scheduled_start) > new Date();
            
            return (
              <Card key={appointment.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-primary-foreground">
                          {otherUser?.first_name?.[0]}{otherUser?.last_name?.[0]}
                        </span>
                      </div>
                      
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground mb-2">
                          {otherUser?.first_name} {otherUser?.last_name}
                        </h3>
                        
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-3">
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-4 w-4" />
                            <span>{new Date(appointment.scheduled_start).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="h-4 w-4" />
                            <span>
                              {new Date(appointment.scheduled_start).toLocaleTimeString([], {
                                hour: '2-digit', 
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                          <div className="flex items-center space-x-1">
                            {appointment.appointment_type === 'video' ? 
                              <Video className="h-4 w-4" /> : 
                              <MessageCircle className="h-4 w-4" />
                            }
                            <span className="capitalize">{appointment.appointment_type}</span>
                          </div>
                        </div>
                        
                        {appointment.reason_for_visit && (
                          <p className="text-sm text-foreground mb-3">
                            <strong>Reason:</strong> {appointment.reason_for_visit}
                          </p>
                        )}
                        
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            appointment.status === 'scheduled' ? 'bg-primary text-primary-foreground' :
                            appointment.status === 'completed' ? 'bg-green-100 text-green-800' :
                            appointment.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                            'bg-muted text-muted-foreground'
                          }`}>
                            {appointment.status}
                          </span>
                          {isUpcoming && (
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                              Upcoming
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {canJoinCall(appointment) && (
                        <Button onClick={() => joinVideoCall(appointment)} className="gap-2">
                          <Video className="h-4 w-4" />
                          Join Call
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}