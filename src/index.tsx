import React from 'react';
import ReactDOM from 'react-dom';
import { render } from "react-dom";
//0x6a04b8aa68d54b98b870ac05697274cb2d47cccc2b2fa2c6786ea16d4f6be7ec
import App from './App';

/*ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);*/

import App2 from "./App2";

const rootElement = document.getElementById("root");
render(<App2 />, rootElement);
