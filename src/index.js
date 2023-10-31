import React from 'react';
import ReactDOM from 'react-dom/client';
import App3 from './App3';
import { MetaMaskProvider } from '@metamask/sdk-react';

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <MetaMaskProvider debug={false} sdkOptions={{
        logging:{
          developerMode: false,
        },
        checkInstallationImmediately: false, // This will automatically connect to MetaMask on page load
        dappMetadata: {
          name: "Demo React App",
          url: window.location.host,
        }
      }}>
      <App3 />
    </MetaMaskProvider>
  </React.StrictMode>
);