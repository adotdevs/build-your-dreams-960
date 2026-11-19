CREATE POLICY "Own folder read" ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id IN ('kyc-documents','support-attachments','action-attachments')
  AND ((storage.foldername(name))[1] = auth.uid()::text OR public.has_admin_access(auth.uid()))
);

CREATE POLICY "Own folder insert" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id IN ('kyc-documents','support-attachments','action-attachments')
  AND ((storage.foldername(name))[1] = auth.uid()::text OR public.has_admin_access(auth.uid()))
);

CREATE POLICY "Own folder update" ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id IN ('kyc-documents','support-attachments','action-attachments')
  AND ((storage.foldername(name))[1] = auth.uid()::text OR public.has_admin_access(auth.uid()))
)
WITH CHECK (
  bucket_id IN ('kyc-documents','support-attachments','action-attachments')
  AND ((storage.foldername(name))[1] = auth.uid()::text OR public.has_admin_access(auth.uid()))
);

CREATE POLICY "Own folder delete" ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id IN ('kyc-documents','support-attachments','action-attachments')
  AND ((storage.foldername(name))[1] = auth.uid()::text OR public.has_admin_access(auth.uid()))
);