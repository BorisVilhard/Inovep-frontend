import { FaFilePdf } from 'react-icons/fa6';
import { RiFileExcel2Line } from 'react-icons/ri';

export function checkFileType(file: File | null): JSX.Element | string {
  if (!file || !file.name) {
    return 'Unknown file type';
  }

  const excelMimeTypes = [
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ];

  const pdfMimeType = 'application/pdf';

  if (file.type === pdfMimeType) {
    return (
      <>
        <FaFilePdf /> {file.name}
      </>
    );
  } else if (excelMimeTypes.includes(file.type)) {
    return (
      <>
        <RiFileExcel2Line color="green" /> {file.name}
      </>
    );
  } else {
    const extension = getFileExtension(file.name);
    if (extension === 'pdf') {
      return (
        <>
          <FaFilePdf /> {file.name}
        </>
      );
    } else if (extension === 'xls' || extension === 'xlsx') {
      return (
        <>
          <RiFileExcel2Line /> {file.name}
        </>
      );
    } else {
      return 'Unknown file type';
    }
  }
}

function getFileExtension(fileName: string): string {
  if (!fileName) {
    return '';
  }

  const parts = fileName.split('.');
  return parts.length > 1 ? parts.pop()!.toLowerCase() : '';
}
