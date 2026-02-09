import Canvas from "./components/Canvas";
import Sidebar from "./components/Sidebar";

export default function App() {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <Canvas />
    </div>
  );
}
