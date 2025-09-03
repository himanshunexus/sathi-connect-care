-- Create user roles enum
CREATE TYPE public.user_role AS ENUM ('student', 'counselor', 'admin');

-- Create user profiles table (extends Supabase auth.users)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    phone TEXT,
    profile_image_url TEXT,
    role user_role DEFAULT 'student',
    is_active BOOLEAN DEFAULT TRUE,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (TRUE);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Chat conversations table
CREATE TABLE public.chat_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    counselor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    conversation_type TEXT DEFAULT 'support' CHECK (conversation_type IN ('support', 'consultation', 'emergency')),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'ended', 'archived')),
    started_at TIMESTAMPTZ DEFAULT NOW(),
    last_message_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on conversations
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;

-- Conversations policies
CREATE POLICY "Users can view own conversations" ON public.chat_conversations 
FOR SELECT USING (auth.uid() = student_id OR auth.uid() = counselor_id);

CREATE POLICY "Students can create conversations" ON public.chat_conversations 
FOR INSERT WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Participants can update conversations" ON public.chat_conversations 
FOR UPDATE USING (auth.uid() = student_id OR auth.uid() = counselor_id);

-- Chat messages table
CREATE TABLE public.chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'file', 'image', 'video')),
    content TEXT,
    file_url TEXT,
    file_name TEXT,
    status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'read')),
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on messages
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Messages policies
CREATE POLICY "Users can view messages in their conversations" ON public.chat_messages 
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.chat_conversations 
        WHERE id = conversation_id 
        AND (student_id = auth.uid() OR counselor_id = auth.uid())
    )
);

CREATE POLICY "Users can insert messages in their conversations" ON public.chat_messages 
FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
        SELECT 1 FROM public.chat_conversations 
        WHERE id = conversation_id 
        AND (student_id = auth.uid() OR counselor_id = auth.uid())
    )
);

-- Appointments table
CREATE TABLE public.appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    counselor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    conversation_id UUID REFERENCES public.chat_conversations(id),
    appointment_type TEXT DEFAULT 'video' CHECK (appointment_type IN ('chat', 'video', 'in_person')),
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled')),
    scheduled_start TIMESTAMPTZ NOT NULL,
    scheduled_end TIMESTAMPTZ NOT NULL,
    meeting_url TEXT,
    notes TEXT,
    reason_for_visit TEXT,
    is_emergency BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on appointments
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Appointments policies
CREATE POLICY "Users can view own appointments" ON public.appointments 
FOR SELECT USING (auth.uid() = student_id OR auth.uid() = counselor_id);

CREATE POLICY "Students can create appointments" ON public.appointments 
FOR INSERT WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Participants can update appointments" ON public.appointments 
FOR UPDATE USING (auth.uid() = student_id OR auth.uid() = counselor_id);

-- Video call sessions table
CREATE TABLE public.video_call_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id UUID REFERENCES public.appointments(id) ON DELETE CASCADE,
    room_id TEXT UNIQUE NOT NULL,
    participants JSONB DEFAULT '[]',
    call_started_at TIMESTAMPTZ,
    call_ended_at TIMESTAMPTZ,
    call_duration INTEGER,
    recording_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on video sessions
ALTER TABLE public.video_call_sessions ENABLE ROW LEVEL SECURITY;

-- Video sessions policies
CREATE POLICY "Users can view sessions for their appointments" ON public.video_call_sessions 
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.appointments 
        WHERE id = appointment_id 
        AND (student_id = auth.uid() OR counselor_id = auth.uid())
    )
);

-- Function to handle new user profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, email, first_name, last_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'role', 'student')::user_role
    );
    RETURN NEW;
END;
$$;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add update triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON public.chat_conversations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();