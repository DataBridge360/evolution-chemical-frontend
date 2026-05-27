-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Evolution Chemical - Sistema de Gestión de Análisis Químicos
-- ============================================
-- Fecha: 2026-05-25
-- Descripción: Políticas de seguridad a nivel de fila para proteger datos
--              según roles (owner/company_admin) y company_id
--
-- IMPORTANTE:
-- - Ejecutar como usuario administrador de Supabase
-- - Backup de la base de datos antes de ejecutar
-- - Probar en staging antes de producción
-- ============================================

-- ============================================
-- PASO 1: FUNCIONES HELPER
-- ============================================
-- Estas funciones facilitan la escritura de políticas

-- Función: Obtener rol del usuario actual
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN (
    SELECT role
    FROM public.user_profiles
    WHERE user_id::text = auth.uid()::text
    LIMIT 1
  );
END;
$$;

COMMENT ON FUNCTION public.get_current_user_role() IS
'Retorna el rol del usuario autenticado actual (owner o company_admin)';


-- Función: Obtener company_id del usuario actual
CREATE OR REPLACE FUNCTION public.get_current_user_company_id()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN (
    SELECT company_id
    FROM public.user_profiles
    WHERE user_id::text = auth.uid()::text
    LIMIT 1
  );
END;
$$;

COMMENT ON FUNCTION public.get_current_user_company_id() IS
'Retorna el company_id del usuario autenticado actual';


-- Función: Verificar si el usuario es OWNER
CREATE OR REPLACE FUNCTION public.is_owner()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN (
    SELECT EXISTS (
      SELECT 1
      FROM public.user_profiles
      WHERE user_id::text = auth.uid()::text
      AND role = 'owner'
    )
  );
END;
$$;

COMMENT ON FUNCTION public.is_owner() IS
'Retorna true si el usuario autenticado tiene rol de owner';


-- Función: Verificar si el usuario pertenece a una empresa específica
CREATE OR REPLACE FUNCTION public.user_belongs_to_company(target_company_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN (
    SELECT EXISTS (
      SELECT 1
      FROM public.user_profiles
      WHERE user_id::text = auth.uid()::text
      AND company_id = target_company_id
    )
  );
END;
$$;

COMMENT ON FUNCTION public.user_belongs_to_company(uuid) IS
'Retorna true si el usuario autenticado pertenece a la empresa especificada';


-- ============================================
-- PASO 2: HABILITAR RLS EN TODAS LAS TABLAS
-- ============================================

-- Habilitar RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chromatographic_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.samples ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Nota: compounds NO necesita RLS (datos de referencia públicos)

COMMENT ON TABLE public.user_profiles IS 'RLS habilitado - Solo owners y propios perfiles';
COMMENT ON TABLE public.companies IS 'RLS habilitado - Solo owners y propia empresa';
COMMENT ON TABLE public.chromatographic_analyses IS 'RLS habilitado - Solo owners y propia empresa';
COMMENT ON TABLE public.samples IS 'RLS habilitado - Solo owners y propia empresa';
COMMENT ON TABLE public.analyses IS 'RLS habilitado - Solo owners y propia empresa';
COMMENT ON TABLE public.reports IS 'RLS habilitado - Solo owners y propia empresa';


-- ============================================
-- PASO 3: POLÍTICAS PARA user_profiles
-- ============================================

-- DROP de políticas existentes (si las hay)
DROP POLICY IF EXISTS "users_select_own_profile" ON public.user_profiles;
DROP POLICY IF EXISTS "owners_select_all_profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "company_admin_select_company_profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "owners_insert_users" ON public.user_profiles;
DROP POLICY IF EXISTS "owners_update_users" ON public.user_profiles;
DROP POLICY IF EXISTS "owners_delete_users" ON public.user_profiles;

-- SELECT: Los usuarios pueden ver su propio perfil
CREATE POLICY "users_select_own_profile" ON public.user_profiles
FOR SELECT
USING (auth.uid()::text = user_id::text);

-- SELECT: OWNERS pueden ver todos los perfiles
CREATE POLICY "owners_select_all_profiles" ON public.user_profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.user_id::text = auth.uid()::text
    AND up.role = 'owner'
  )
);

-- SELECT: COMPANY_ADMIN pueden ver perfiles de su empresa
CREATE POLICY "company_admin_select_company_profiles" ON public.user_profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.user_id::text = auth.uid()::text
    AND up.company_id = user_profiles.company_id
    AND up.role = 'company_admin'
  )
);

-- INSERT: Solo OWNERS pueden insertar nuevos usuarios
CREATE POLICY "owners_insert_users" ON public.user_profiles
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.user_id::text = auth.uid()::text
    AND up.role = 'owner'
  )
);

-- UPDATE: Solo OWNERS pueden actualizar usuarios
CREATE POLICY "owners_update_users" ON public.user_profiles
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.user_id::text = auth.uid()::text
    AND up.role = 'owner'
  )
);

-- DELETE: Solo OWNERS pueden eliminar usuarios
CREATE POLICY "owners_delete_users" ON public.user_profiles
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.user_id::text = auth.uid()::text
    AND up.role = 'owner'
  )
);


-- ============================================
-- PASO 4: POLÍTICAS PARA companies
-- ============================================

-- DROP de políticas existentes
DROP POLICY IF EXISTS "owners_select_all_companies" ON public.companies;
DROP POLICY IF EXISTS "company_admin_select_own_company" ON public.companies;
DROP POLICY IF EXISTS "owners_insert_companies" ON public.companies;
DROP POLICY IF EXISTS "owners_update_companies" ON public.companies;
DROP POLICY IF EXISTS "owners_delete_companies" ON public.companies;

-- SELECT: OWNERS pueden ver todas las empresas
CREATE POLICY "owners_select_all_companies" ON public.companies
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.user_id::text = auth.uid()::text
    AND up.role = 'owner'
  )
);

-- SELECT: COMPANY_ADMIN pueden ver su propia empresa
CREATE POLICY "company_admin_select_own_company" ON public.companies
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.user_id::text = auth.uid()::text
    AND up.company_id = companies.company_id
    AND up.role = 'company_admin'
  )
);

-- INSERT: Solo OWNERS pueden crear empresas
CREATE POLICY "owners_insert_companies" ON public.companies
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.user_id::text = auth.uid()::text
    AND up.role = 'owner'
  )
);

-- UPDATE: Solo OWNERS pueden actualizar empresas
CREATE POLICY "owners_update_companies" ON public.companies
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.user_id::text = auth.uid()::text
    AND up.role = 'owner'
  )
);

-- DELETE: Solo OWNERS pueden eliminar empresas
CREATE POLICY "owners_delete_companies" ON public.companies
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.user_id::text = auth.uid()::text
    AND up.role = 'owner'
  )
);


-- ============================================
-- PASO 5: POLÍTICAS PARA chromatographic_analyses
-- ============================================

-- DROP de políticas existentes
DROP POLICY IF EXISTS "owners_select_all_analyses" ON public.chromatographic_analyses;
DROP POLICY IF EXISTS "company_admin_select_own_analyses" ON public.chromatographic_analyses;
DROP POLICY IF EXISTS "owners_insert_analyses" ON public.chromatographic_analyses;
DROP POLICY IF EXISTS "owners_update_analyses" ON public.chromatographic_analyses;
DROP POLICY IF EXISTS "owners_delete_analyses" ON public.chromatographic_analyses;

-- SELECT: OWNERS pueden ver todos los análisis
CREATE POLICY "owners_select_all_analyses" ON public.chromatographic_analyses
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.user_id::text = auth.uid()::text
    AND up.role = 'owner'
  )
);

-- SELECT: COMPANY_ADMIN pueden ver análisis de su empresa
CREATE POLICY "company_admin_select_own_analyses" ON public.chromatographic_analyses
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.user_id::text = auth.uid()::text
    AND up.company_id = chromatographic_analyses.company_id
    AND up.role = 'company_admin'
  )
);

-- INSERT: Solo OWNERS pueden insertar análisis
CREATE POLICY "owners_insert_analyses" ON public.chromatographic_analyses
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.user_id::text = auth.uid()::text
    AND up.role = 'owner'
  )
);

-- UPDATE: Solo OWNERS pueden actualizar análisis
CREATE POLICY "owners_update_analyses" ON public.chromatographic_analyses
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.user_id::text = auth.uid()::text
    AND up.role = 'owner'
  )
);

-- DELETE: Solo OWNERS pueden eliminar análisis
CREATE POLICY "owners_delete_analyses" ON public.chromatographic_analyses
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.user_id::text = auth.uid()::text
    AND up.role = 'owner'
  )
);


-- ============================================
-- PASO 6: POLÍTICAS PARA samples
-- ============================================

-- DROP de políticas existentes
DROP POLICY IF EXISTS "owners_select_all_samples" ON public.samples;
DROP POLICY IF EXISTS "company_admin_select_own_samples" ON public.samples;
DROP POLICY IF EXISTS "company_admin_insert_own_samples" ON public.samples;
DROP POLICY IF EXISTS "owners_insert_samples" ON public.samples;
DROP POLICY IF EXISTS "company_admin_update_own_samples" ON public.samples;
DROP POLICY IF EXISTS "owners_update_samples" ON public.samples;
DROP POLICY IF EXISTS "owners_delete_samples" ON public.samples;

-- SELECT: OWNERS pueden ver todas las muestras
CREATE POLICY "owners_select_all_samples" ON public.samples
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.user_id::text = auth.uid()::text
    AND up.role = 'owner'
  )
);

-- SELECT: COMPANY_ADMIN pueden ver muestras de su empresa
CREATE POLICY "company_admin_select_own_samples" ON public.samples
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.user_id::text = auth.uid()::text
    AND up.company_id = samples.company_id
    AND up.role = 'company_admin'
  )
);

-- INSERT: COMPANY_ADMIN pueden crear muestras para su empresa
CREATE POLICY "company_admin_insert_own_samples" ON public.samples
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.user_id::text = auth.uid()::text
    AND up.company_id = samples.company_id
    AND up.role = 'company_admin'
  )
);

-- INSERT: OWNERS pueden crear muestras para cualquier empresa
CREATE POLICY "owners_insert_samples" ON public.samples
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.user_id::text = auth.uid()::text
    AND up.role = 'owner'
  )
);

-- UPDATE: COMPANY_ADMIN pueden actualizar muestras de su empresa
CREATE POLICY "company_admin_update_own_samples" ON public.samples
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.user_id::text = auth.uid()::text
    AND up.company_id = samples.company_id
    AND up.role = 'company_admin'
  )
);

-- UPDATE: OWNERS pueden actualizar cualquier muestra
CREATE POLICY "owners_update_samples" ON public.samples
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.user_id::text = auth.uid()::text
    AND up.role = 'owner'
  )
);

-- DELETE: Solo OWNERS pueden eliminar muestras
CREATE POLICY "owners_delete_samples" ON public.samples
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.user_id::text = auth.uid()::text
    AND up.role = 'owner'
  )
);


-- ============================================
-- PASO 7: POLÍTICAS PARA analyses
-- ============================================

-- DROP de políticas existentes
DROP POLICY IF EXISTS "owners_select_all_general_analyses" ON public.analyses;
DROP POLICY IF EXISTS "company_admin_select_own_analyses" ON public.analyses;
DROP POLICY IF EXISTS "owners_manage_analyses" ON public.analyses;

-- SELECT: OWNERS pueden ver todos los análisis
CREATE POLICY "owners_select_all_general_analyses" ON public.analyses
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.user_id::text = auth.uid()::text
    AND up.role = 'owner'
  )
);

-- SELECT: COMPANY_ADMIN pueden ver análisis de muestras de su empresa
CREATE POLICY "company_admin_select_own_analyses" ON public.analyses
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles up
    JOIN public.samples s ON s.sample_id = analyses.sample_id
    WHERE up.user_id::text = auth.uid()::text
    AND up.company_id = s.company_id
    AND up.role = 'company_admin'
  )
);

-- INSERT/UPDATE/DELETE: Solo OWNERS pueden gestionar análisis
CREATE POLICY "owners_manage_analyses" ON public.analyses
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.user_id::text = auth.uid()::text
    AND up.role = 'owner'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.user_id::text = auth.uid()::text
    AND up.role = 'owner'
  )
);


-- ============================================
-- PASO 8: POLÍTICAS PARA reports
-- ============================================

-- DROP de políticas existentes
DROP POLICY IF EXISTS "owners_select_all_reports" ON public.reports;
DROP POLICY IF EXISTS "company_admin_select_own_reports" ON public.reports;
DROP POLICY IF EXISTS "owners_manage_reports" ON public.reports;

-- SELECT: OWNERS pueden ver todos los reportes
CREATE POLICY "owners_select_all_reports" ON public.reports
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.user_id::text = auth.uid()::text
    AND up.role = 'owner'
  )
);

-- SELECT: COMPANY_ADMIN pueden ver reportes de muestras de su empresa
CREATE POLICY "company_admin_select_own_reports" ON public.reports
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles up
    JOIN public.samples s ON s.sample_id = reports.sample_id
    WHERE up.user_id::text = auth.uid()::text
    AND up.company_id = s.company_id
    AND up.role = 'company_admin'
  )
);

-- INSERT/UPDATE/DELETE: Solo OWNERS pueden gestionar reportes
CREATE POLICY "owners_manage_reports" ON public.reports
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.user_id::text = auth.uid()::text
    AND up.role = 'owner'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.user_id::text = auth.uid()::text
    AND up.role = 'owner'
  )
);


-- ============================================
-- PASO 9: VERIFICACIÓN Y TESTING
-- ============================================

-- Verificar que RLS está habilitado
SELECT
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN (
  'user_profiles',
  'companies',
  'chromatographic_analyses',
  'samples',
  'analyses',
  'reports'
)
ORDER BY tablename;

-- Listar todas las políticas creadas
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd as operation
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================
-- NOTAS IMPORTANTES
-- ============================================

-- 1. TESTING: Después de ejecutar este script, probar con diferentes usuarios:
--    - Usuario OWNER debe poder ver/modificar todo
--    - Usuario COMPANY_ADMIN solo debe ver datos de su empresa
--    - Intentos de acceso no autorizado deben fallar

-- 2. PERFORMANCE: Las políticas RLS usan subqueries EXISTS que son eficientes
--    pero monitorear performance en producción

-- 3. CACHE: Las funciones helper usan STABLE para permitir cache durante la transacción

-- 4. BACKUP: Siempre hacer backup antes de aplicar cambios de seguridad

-- 5. ROLLBACK: Si algo falla, se puede hacer:
--    ALTER TABLE <tabla> DISABLE ROW LEVEL SECURITY;
--    Y luego DROP de las políticas

-- ============================================
-- FIN DEL SCRIPT
-- ============================================

-- Mensaje de confirmación
DO $$
BEGIN
  RAISE NOTICE '✓ RLS policies aplicadas exitosamente';
  RAISE NOTICE '✓ Tablas protegidas: user_profiles, companies, chromatographic_analyses, samples, analyses, reports';
  RAISE NOTICE '✓ Funciones helper creadas: get_current_user_role, get_current_user_company_id, is_owner, user_belongs_to_company';
  RAISE NOTICE '⚠ IMPORTANTE: Probar con usuarios OWNER y COMPANY_ADMIN antes de ir a producción';
END $$;
