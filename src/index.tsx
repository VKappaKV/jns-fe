import React from 'react';
import ReactDOM from 'react-dom';
import { render } from "react-dom";
import App from './App';
import App2 from "./App2";

/* multi chain sandbox */
/*ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);*/

/* SOLANA */
const rootElement = document.getElementById("root");
render(<App2 />, rootElement);
