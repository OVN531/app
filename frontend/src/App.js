import React from "react";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ChatInterface from "./components/ChatInterface";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ChatProvider } from "./contexts/ChatContext";

function App() {
  return (
    <ThemeProvider>
      <ChatProvider>
        <div className="App h-screen bg-background text-foreground">
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<ChatInterface />} />
            </Routes>
          </BrowserRouter>
        </div>
      </ChatProvider>
    </ThemeProvider>
  );
}

export default App;