/**
 * Página de análisis cromatográfico
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import FileUpload01 from '@/src/components/file-upload-01';
import AnalysisLoadingModal from '@/src/modules/chromatography/components/AnalysisLoadingModal';
import {
  calculateProperties,
  generateReport,
  uploadXLSXFile,
} from '@/src/modules/chromatography/services/chromatographyService';
import { companiesService } from '@/src/modules/companies/services/CompaniesService';
import { Company } from '@/src/types/company';

type ProcessStep = 'idle' | 'uploading' | 'calculating' | 'generating-report' | 'complete';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const EXCEL_EXTENSIONS = ['.xlsx', '.xls'];

export default function ChromatographyPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [fieldName, setFieldName] = useState('');
  const [currentStep, setCurrentStep] = useState<ProcessStep>('idle');
  const [error, setError] = useState<string | null>(null);
  const [loadingCompanies, setLoadingCompanies] = useState(true);

  useEffect(() => {
    void loadCompanies();
  }, []);

  const loadCompanies = async () => {
    try {
      setLoadingCompanies(true);
      const data = await companiesService.getAllCompanies();
      setCompanies(data);
    } catch (loadError) {
      console.error('Error cargando empresas:', loadError);
      setError('Error cargando lista de empresas');
    } finally {
      setLoadingCompanies(false);
    }
  };

  const handleCompanySearchChange = (value: string) => {
    setSearchTerm(value);
    setSelectedCompanyId('');
    setError(null);
  };

  const handleCompanySelect = (company: Company) => {
    setSearchTerm(company.name);
    setSelectedCompanyId(company.company_id);
    setError(null);
  };

  const handleFileSelect = (selectedFile: File) => {
    const validationError = validateExcelFile(selectedFile);

    if (validationError) {
      setFile(null);
      setError(validationError);
      return;
    }

    setFile(selectedFile);
    setError(null);
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Seleccione un archivo Excel del cromatógrafo');
      return;
    }

    const validationError = validateExcelFile(file);

    if (validationError) {
      setError(validationError);
      return;
    }

    if (!selectedCompanyId) {
      setError('Seleccione una empresa para asociar el análisis');
      return;
    }

    setError(null);

    try {
      setCurrentStep('uploading');
      const uploadResult = await uploadXLSXFile(file, {
        company_id: selectedCompanyId,
        field_name: fieldName,
      });

      setCurrentStep('calculating');
      await calculateProperties(uploadResult.analysis_id, {
        apply_o2_n2_discount: false,
        discount_percentage: 0,
        include_viscosities: false,
      });

      setCurrentStep('generating-report');
      await generateReport(uploadResult.analysis_id);

      setCurrentStep('complete');

      setTimeout(() => {
        router.push(`/cromatografia/${uploadResult.analysis_id}`);
      }, 1000);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Error procesando análisis');
      setCurrentStep('idle');
    }
  };

  const clearForm = () => {
    setFile(null);
    setSelectedCompanyId('');
    setSearchTerm('');
    setFieldName('');
    setError(null);
  };

  const isProcessing = currentStep !== 'idle';

  return (
    <>
      <div className="flex justify-center py-2 sm:py-3">
        <div className="w-full max-w-4xl">
          <FileUpload01
            companies={companies}
            companySearch={searchTerm}
            fieldName={fieldName}
            file={file}
            disabled={isProcessing}
            error={error}
            loadingCompanies={loadingCompanies}
            selectedCompanyId={selectedCompanyId}
            onClear={clearForm}
            onCompanySearchChange={handleCompanySearchChange}
            onCompanySelect={handleCompanySelect}
            onFieldNameChange={setFieldName}
            onFileSelect={handleFileSelect}
            onSubmit={handleUpload}
          />
        </div>
      </div>

      <AnalysisLoadingModal
        isOpen={isProcessing}
        currentStep={currentStep === 'idle' ? 'uploading' : currentStep}
      />
    </>
  );
}

function validateExcelFile(file: File) {
  const fileName = file.name.toLowerCase();
  const hasExcelExtension = EXCEL_EXTENSIONS.some((extension) => fileName.endsWith(extension));

  if (!hasExcelExtension) {
    return 'Solo se aceptan archivos Excel del cromatógrafo (.xlsx o .xls).';
  }

  if (file.size > MAX_FILE_SIZE) {
    return 'El Excel supera el máximo permitido de 10MB.';
  }

  return null;
}
