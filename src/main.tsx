import ReactDOM from "react-dom/client";
import App from "./App";
import { ModalProvider } from "./context/ModalContext";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <ModalProvider>
    <App />
  </ModalProvider>,
);
