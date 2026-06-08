import type {
  ComponentVisibility,
  Composition,
  CompoundData,
} from '@/src/modules/chromatography/types';

export const COMPONENT_VISIBILITY_KEY = '_component_visibility';

export function normalizeComponentCode(value: string): string {
  return value
    .toUpperCase()
    .replaceAll(' ', '_')
    .replaceAll('-', '_')
    .replaceAll('Ó', 'O')
    .replaceAll('Í', 'I');
}

export function getCompoundCode(compound: Pick<CompoundData, 'code' | 'name'>): string {
  return normalizeComponentCode(compound.code || compound.name || '');
}

export function isTotalsRow(compound: Pick<CompoundData, 'code' | 'name'>): boolean {
  const code = getCompoundCode(compound);
  return code === 'TOTALES';
}

export function getComponentVisibility(composition?: Composition | null): ComponentVisibility {
  const visibility = composition?.[COMPONENT_VISIBILITY_KEY];
  if (!visibility || typeof visibility !== 'object' || Array.isArray(visibility)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(visibility).map(([code, visible]) => [
      normalizeComponentCode(code),
      visible !== false,
    ]),
  );
}

export function isComponentVisible(
  composition: Composition | undefined | null,
  compound: Pick<CompoundData, 'code' | 'name'>,
): boolean {
  if (isTotalsRow(compound)) {
    return true;
  }

  const code = getCompoundCode(compound);
  if (!code) {
    return true;
  }

  return getComponentVisibility(composition)[code] !== false;
}

export function visibleCompounds(
  compounds: CompoundData[] | undefined,
  composition: Composition | undefined | null,
  includeTotals = true,
): CompoundData[] {
  return (compounds || []).filter((compound) => {
    if (isTotalsRow(compound)) {
      return includeTotals;
    }

    return isComponentVisible(composition, compound);
  });
}

export function setComponentVisibility(
  composition: Composition,
  componentCode: string,
  visible: boolean,
): Composition {
  const nextVisibility = {
    ...getComponentVisibility(composition),
    [normalizeComponentCode(componentCode)]: visible,
  };

  return {
    ...composition,
    [COMPONENT_VISIBILITY_KEY]: nextVisibility,
  };
}
