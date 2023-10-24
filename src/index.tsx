import React from 'react';
import ReactDOM from 'react-dom';
import App from './Phantom';
import { render } from "react-dom";
import SolanaVerifier from "./SolanaVerifier";

/* Phantom */

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);








/* SolanaVerifier - backend test only */

/*const rootElement = document.getElementById("root");
render(<SolanaVerifier />, rootElement);*/
