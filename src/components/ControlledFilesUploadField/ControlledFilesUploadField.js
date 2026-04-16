import React, { useState, useRef } from 'react';
import axios from 'axios';

import css from './ControlledFilesUploadField.module.css';
import { Field } from 'react-final-form';
// import Button from '../Button/Button';
import AttachFileIcon from '@material-ui/icons/AttachFile';
import DriveFolderUploadIcon from '@mui/icons-material/DriveFolderUpload';
import FolderIcon from '@mui/icons-material/Folder';
import DownloadIcon from '@mui/icons-material/Download';

import { shortenString, limitText } from './utils';
import DeleteIcon from '@mui/icons-material/Delete';
const fileDownload = require('js-file-download');

const ControlledFilesUploadField = ({ fieldLabel, callbackFunction }) => {
  const isDev = typeof window !== 'undefined' && window.location?.hostname === 'localhost';
  const fileInputRef = useRef(null);

  const [selectedFile, setSelectedFile] = useState(null);
  const [fileIcon, setFileIcon] = useState(<FolderIcon className={css.icon} />);

  const onFileChange = event => {
    const formData = new FormData();

    formData.append('image', event.target.files[0], event.target.files[0].name);
    return axios
      .post(`${isDev ? 'http://localhost:3500' : ''}/api/azure-upload`, formData)
      .then(resp => {
        const file = resp?.data?.file;
        setSelectedFile(file?.name);
        callbackFunction(file?.name);
      })
      .catch(error => {
        console.log(error);
      });
  };

  if (selectedFile) {
    const fileName = selectedFile.split('-')[1];

    const handleDownloadFile = () => {
      axios
        .get(
          `${isDev ? 'http://localhost:3500' : ''}/api/azure-download?fileName=` + selectedFile,
          {
            responseType: 'blob',
          }
        )
        .then(resp => {
          fileDownload(resp.data, `${selectedFile}`);
        })
        .catch(error => {
          console.log(error);
        });
    };

    return (
      <div className={css.fileWrapper}>
        <h2 className={css.label}>{fieldLabel}</h2>
        <div
          className={css.fileIcon}
          title="download"
          onClick={handleDownloadFile}
          onMouseEnter={() => setFileIcon(<DownloadIcon className={css.icon} />)}
          onMouseLeave={() => setFileIcon(<FolderIcon className={css.icon} />)}
        >
          {/* <DeleteIcon className={css.deleteIcon} onClick={handleDeleteFile} /> */}
          {fileIcon}
          <p className={css.fileLabel}> {limitText(fileName, 15)}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={css.wrapper}>
      <input
        type="file"
        className={css.hiddenFileInput}
        onChange={onFileChange}
        ref={fileInputRef}
      />
      <h2 className={css.label}>{fieldLabel}</h2>
      <div className={css.addFileButton} onClick={() => fileInputRef.current.click()}>
        <DriveFolderUploadIcon id="upload-icon" fontSize="large" className={css.addFileIcon} />
      </div>
    </div>
  );
};

export default ControlledFilesUploadField;
