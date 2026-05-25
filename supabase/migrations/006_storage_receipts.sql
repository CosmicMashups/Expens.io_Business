-- Run after creating bucket "receipts" in dashboard, or use supabase storage API
-- Bucket: receipts, private, 10MB limit

-- Example storage policies (adjust bucket_id if needed):
-- CREATE POLICY "receipts_select" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'receipts');
-- CREATE POLICY "receipts_insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'receipts');
-- CREATE POLICY "receipts_delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'receipts');
