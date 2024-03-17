import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.scss";
import { ModalProvider } from "async-modal-react";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <ModalProvider>
    <App />
  </ModalProvider>,
);
