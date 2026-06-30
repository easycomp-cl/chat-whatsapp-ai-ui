SELECT 'Canal TWD: ' || tc."phoneNumber" || ' (' || tc.status || ', active=' || tc."isActive" || ')'
FROM public."TenantChannel" tc
WHERE tc."tenantId" = 'tenant-twd'
LIMIT 1;

SELECT 'Conversaciones TWD: ' || COUNT(*)::text
FROM public."Conversation"
WHERE "tenantId" = 'tenant-twd';

SELECT 'Mensajes TWD: ' || COUNT(*)::text
FROM public."Message"
WHERE "tenantId" = 'tenant-twd';

SELECT 'FAQs TWD: ' || COUNT(*)::text
FROM public."TenantFaq"
WHERE "tenantId" = 'tenant-twd';

SELECT 'Docs KB TWD: ' || COUNT(*)::text
FROM public."TenantDocument"
WHERE "tenantId" = 'tenant-twd';
