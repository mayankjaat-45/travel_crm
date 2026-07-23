import { ToastContainer } from "react-toastify";
import "./globals.css";

export const metadata = {
  title: "Travel CRM",
  description: "Lead management CRM for travel agencies",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <ToastContainer position="top-right" autoClose={2000} />
      </body>
    </html>
  );
}
