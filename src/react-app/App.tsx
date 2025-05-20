// src/App.tsx
import viteLogo from "/vite.svg";
// import "./App.css";

function App() {
  return (
    <div className="max-w-screen-xl mx-auto px-4">
      <header className="flex py-4 justify-between">
        <img src={viteLogo} className="logo" alt="Vite logo" />
        <div className="">sign in with clerk</div>
      </header>
      <main className="text-3xl font-bold">
        <div>Admin Panel</div>
        <a></a>
      </main>
      <footer className="flex justify-center items-center h-24">
        Created by <span className="text-orange-500 pl-1">GZ</span>
      </footer>
    </div>
  );
}

export default App;
