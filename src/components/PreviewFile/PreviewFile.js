import React from 'react';
import FolderIcon from '@mui/icons-material/Folder';
import axios from 'axios';

import css from './PreviewFile.module.css';
import { limitText } from '../FilesUploadField/utils';
const fileDownload = require('js-file-download');

const PreviewFile = props => {
  const { fileName } = props;

  if (!fileName) {
    return null;
  }

  const isDev = typeof window !== 'undefined' && window.location?.hostname === 'localhost';
  const trimmedFileName = fileName?.split('-')[1];

  const handleDownloadFile = () => {
    axios
      .get(`${isDev ? 'http://localhost:3500' : ''}/api/azure-download?fileName=` + fileName, {
        responseType: 'blob',
      })
      .then(resp => {
        fileDownload(resp.data, `${fileName}`);
      })
      .catch(error => {
        console.log(error);
      });
  };

  return (
    <div className={css.fileIcon} title="download" onClick={handleDownloadFile}>
      <FolderIcon className={css.icon} />
      {limitText(trimmedFileName, 15)}
    </div>
  );
};

export default PreviewFile;
