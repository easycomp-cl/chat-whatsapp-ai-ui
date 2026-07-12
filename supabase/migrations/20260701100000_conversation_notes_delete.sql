-- Allow team members to delete conversation notes for their tenant

CREATE POLICY notes_delete ON public.conversation_notes
  FOR DELETE USING (public.can_access_tenant(business_id));
