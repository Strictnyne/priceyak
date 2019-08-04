import React from 'react';
import './App.css';
import ProductForm from "./components/ProductForm";

function App() {
  return (
    <div className="App">
      <header className="App-header">
        Amazon Price Watcher
        <ProductForm/>
      </header>
    </div>
  );
}

export default App;
